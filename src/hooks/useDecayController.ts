import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  DEFAULT_NOTICE,
  ENCODE_FAILED_NOTICE,
  LOAD_IMAGE_FAILED_NOTICE,
  LOAD_IMAGE_NOTICE,
  MAX_ENCODE_RETRY,
  METRICS_INTERVAL,
  RESET_NOTICE,
  SAMPLE_IMAGE_FAILED_NOTICE,
  SETTINGS_LOAD_CORRECTED_NOTICE,
  VIEWER_SPEED_PRESETS,
  WORKER_FALLBACK_NOTICE,
  type ScreenMode,
} from '../lib/app/constants';
import { createSampleImageFile, isSampleId } from '../lib/app/sampleLibrary';
import {
  calculateQualityMetrics,
  copyCanvasFrame,
  decodeFileToCanvasSource,
  drawInitialFrame,
  reencodeFrameWithRetry,
} from '../lib/degradation/engine';
import { computeQuality, validateImageFile } from '../lib/degradation/model';
import { advanceWallClock, createWallClockState } from '../lib/playback/clock';
import { createSchedulerState, planSchedulerTick, settleSchedulerAfterProcess } from '../lib/playback/scheduler';
import { createDegradationWorkerClient, type DegradationWorkerClient } from '../lib/degradation/workerClient';
import type { PlaybackState, SessionSettings, SpeedPreset, UploadState } from '../types/domain';

interface UseDecayControllerArgs {
  settings: SessionSettings;
  settingsRef: MutableRefObject<SessionSettings>;
  hasLoadError: boolean;
}

interface UseDecayControllerResult {
  playback: PlaybackState;
  upload: UploadState | null;
  frameVersion: number;
  screenMode: ScreenMode;
  isLoading: boolean;
  showOriginal: boolean;
  hasEnded: boolean;
  notice: string;
  originalCanvas: HTMLCanvasElement | null;
  currentCanvas: HTMLCanvasElement | null;
  handleUpload: (file: File | null) => Promise<void>;
  handleSampleSelect: (sampleId: string) => Promise<void>;
  handlePlayPause: () => void;
  handleBackToLanding: () => void;
  handleReset: () => void;
  handleCompareToggle: () => void;
  shiftSpeed: (direction: -1 | 1) => void;
}

const LOOP_INTERVAL_MS = 16;
const INITIAL_VIEWER_SPEED: SpeedPreset = 1;
const PREVIEW_FRAME_INTERVAL_MS = 33;
const METRICS_MIN_INTERVAL_MS = 1200;

const createInitialPlaybackState = (
  settings: SessionSettings,
  startedAtMs: number | null,
  isPlaying: boolean,
  processingWidth = 0,
  processingHeight = 0,
): PlaybackState => {
  return {
    isPlaying,
    wallClock: createWallClockState(startedAtMs),
    simulation: {
      targetGenPerSec: INITIAL_VIEWER_SPEED,
      effectiveGenPerSec: 0,
      generationDebt: 0,
      appliedGeneration: 0,
      elapsedSimMs: 0,
    },
    processing: {
      avgGenerationCostMs: settings.tickMs,
      workerMode: false,
      processingWidth,
      processingHeight,
    },
    render: {
      currentQuality: settings.initialQuality,
      fps: 0,
      psnr: null,
      ssim: null,
    },
  };
};

export const useDecayController = ({
  settings,
  settingsRef,
  hasLoadError,
}: UseDecayControllerArgs): UseDecayControllerResult => {
  const [playback, setPlayback] = useState<PlaybackState>(() => {
    return createInitialPlaybackState(settings, null, false);
  });
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [frameVersion, setFrameVersion] = useState<number>(0);
  const [screenMode, setScreenMode] = useState<ScreenMode>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>(() => {
    return hasLoadError ? SETTINGS_LOAD_CORRECTED_NOTICE : DEFAULT_NOTICE;
  });

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferARef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferBRef = useRef<HTMLCanvasElement | null>(null);

  const playbackRef = useRef<PlaybackState>(playback);
  const uploadRef = useRef<UploadState | null>(upload);
  const hasEndedRef = useRef<boolean>(hasEnded);
  const workerClientRef = useRef<DegradationWorkerClient | null>(null);
  const workerModeRef = useRef<boolean>(false);
  const workerFallbackNotifiedRef = useRef<boolean>(false);

  const loopTimerRef = useRef<number | null>(null);
  const processingRef = useRef<boolean>(false);
  const playbackClockRef = useRef<number | null>(null);
  const loopTokenRef = useRef<number>(0);
  const schedulerRef = useRef(createSchedulerState(settings.tickMs));
  const lastPreviewPaintMsRef = useRef<number>(0);
  const lastMetricsAtMsRef = useRef<number>(0);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);

  useEffect(() => {
    hasEndedRef.current = hasEnded;
  }, [hasEnded]);

  useEffect(() => {
    if (playback.simulation.appliedGeneration !== 0) {
      return;
    }
    setPlayback((prev) => {
      if (prev.render.currentQuality === settings.initialQuality) {
        return prev;
      }
      return {
        ...prev,
        render: {
          ...prev.render,
          currentQuality: settings.initialQuality,
        },
      };
    });
  }, [playback.simulation.appliedGeneration, settings.initialQuality]);

  useEffect(() => {
    return () => {
      loopTokenRef.current += 1;
      if (loopTimerRef.current !== null) {
        window.clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    workerClientRef.current = createDegradationWorkerClient();
    return () => {
      workerClientRef.current?.dispose();
      workerClientRef.current = null;
      workerModeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (screenMode !== 'viewer') {
      return;
    }

    const timerId = window.setInterval(() => {
      const nowMs = Date.now();
      setPlayback((prev) => {
        const nextWallClock = advanceWallClock(prev.wallClock, nowMs);
        if (nextWallClock === prev.wallClock) {
          return prev;
        }
        return {
          ...prev,
          wallClock: nextWallClock,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [screenMode]);

  const ensureCanvases = (fresh = false) => {
    if (fresh || !originalCanvasRef.current) {
      originalCanvasRef.current = document.createElement('canvas');
    }
    if (fresh || !currentCanvasRef.current) {
      currentCanvasRef.current = document.createElement('canvas');
    }
    if (!psnrBufferARef.current) {
      psnrBufferARef.current = document.createElement('canvas');
    }
    if (!psnrBufferBRef.current) {
      psnrBufferBRef.current = document.createElement('canvas');
    }

    return {
      original: originalCanvasRef.current,
      current: currentCanvasRef.current,
      psnrA: psnrBufferARef.current,
      psnrB: psnrBufferBRef.current,
    };
  };

  const stopLoop = useCallback(() => {
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    playbackClockRef.current = null;
  }, []);

  const measureQualityMetrics = (): { psnr: number | null; ssim: number | null } => {
    const original = originalCanvasRef.current;
    const current = currentCanvasRef.current;
    const psnrA = psnrBufferARef.current;
    const psnrB = psnrBufferBRef.current;

    if (!original || !current || !psnrA || !psnrB) {
      return { psnr: null, ssim: null };
    }

    try {
      return calculateQualityMetrics(original, current, psnrA, psnrB);
    } catch {
      return { psnr: null, ssim: null };
    }
  };

  const disableWorkerMode = (message?: string) => {
    workerModeRef.current = false;
    setPlayback((prev) => {
      if (!prev.processing.workerMode) {
        return prev;
      }
      return {
        ...prev,
        processing: {
          ...prev.processing,
          workerMode: false,
        },
      };
    });
    if (message && !workerFallbackNotifiedRef.current) {
      workerFallbackNotifiedRef.current = true;
      setNotice(message);
    }
  };

  const syncWorkerFromCanvas = async (canvas: HTMLCanvasElement): Promise<boolean> => {
    const client = workerClientRef.current;
    if (!client) {
      disableWorkerMode();
      return false;
    }

    try {
      const source = await createImageBitmap(canvas);
      const ready = await client.init(canvas.width, canvas.height, source, MAX_ENCODE_RETRY);
      if (!ready) {
        disableWorkerMode();
        return false;
      }

      workerModeRef.current = true;
      workerFallbackNotifiedRef.current = false;
      setPlayback((prev) => {
        if (prev.processing.workerMode) {
          return prev;
        }
        return {
          ...prev,
          processing: {
            ...prev.processing,
            workerMode: true,
          },
        };
      });
      return true;
    } catch {
      disableWorkerMode();
      return false;
    }
  };

  const drawWorkerFrameToCurrentCanvas = (frame: ImageBitmap) => {
    const current = currentCanvasRef.current;
    if (!current) {
      frame.close();
      return;
    }

    const context = current.getContext('2d');
    if (!context) {
      frame.close();
      return;
    }

    context.clearRect(0, 0, current.width, current.height);
    context.drawImage(frame, 0, 0, current.width, current.height);
    frame.close();
  };

  const resetCurrentFrame = (): HTMLCanvasElement | null => {
    const original = originalCanvasRef.current;
    if (!original) {
      return null;
    }

    const freshCurrent = document.createElement('canvas');
    copyCanvasFrame(original, freshCurrent);
    currentCanvasRef.current = freshCurrent;
    setFrameVersion((prev) => prev + 1);
    return freshCurrent;
  };

  const resetSession = (autoPlay: boolean) => {
    loopTokenRef.current += 1;
    stopLoop();
    lastPreviewPaintMsRef.current = 0;
    lastMetricsAtMsRef.current = 0;
    schedulerRef.current = createSchedulerState(settingsRef.current.tickMs);
    const freshCurrent = resetCurrentFrame();
    const startedAtMs = Date.now();
    const processingWidth = freshCurrent?.width ?? playbackRef.current.processing.processingWidth;
    const processingHeight = freshCurrent?.height ?? playbackRef.current.processing.processingHeight;
    setPlayback(
      createInitialPlaybackState(settingsRef.current, startedAtMs, autoPlay, processingWidth, processingHeight),
    );
    setHasEnded(false);
    setShowOriginal(false);
    setNotice(autoPlay ? '' : RESET_NOTICE);

    if (freshCurrent) {
      void syncWorkerFromCanvas(freshCurrent);
      return;
    }

    disableWorkerMode();
  };

  const runTickRef = useRef<() => Promise<void>>(async () => {});

  runTickRef.current = async () => {
    const token = loopTokenRef.current;
    const workingCanvas = currentCanvasRef.current;

    if (
      processingRef.current ||
      !playbackRef.current.isPlaying ||
      !uploadRef.current ||
      !workingCanvas ||
      !originalCanvasRef.current
    ) {
      return;
    }

    processingRef.current = true;
    const tickStart = performance.now();
    const config = settingsRef.current;
    const lastClock = playbackClockRef.current ?? tickStart;
    const frameDeltaMs = Math.max(0, tickStart - lastClock);
    playbackClockRef.current = tickStart;
    const targetGenPerSec = playbackRef.current.simulation.targetGenPerSec;
    const schedulePlan = planSchedulerTick({
      scheduler: schedulerRef.current,
      deltaMs: frameDeltaMs,
      targetGenPerSec,
      batch: config.batch,
    });
    schedulerRef.current = schedulePlan.scheduler;
    const effectiveGenPerSec = schedulePlan.effectiveGenPerSec;
    const stepsToRun = schedulePlan.stepsToRun;
    const baseGeneration = playbackRef.current.simulation.appliedGeneration;
    const plannedQualities: number[] = [];

    for (let step = 0; step < stepsToRun; step += 1) {
      plannedQualities.push(computeQuality(config, baseGeneration + step + 1));
    }

    let processed = 0;
    let failed = false;
    let latestQuality = playbackRef.current.render.currentQuality;
    let workerFrame: ImageBitmap | null = null;

    if (workerModeRef.current && workerClientRef.current && plannedQualities.length > 0) {
      try {
        const result = await workerClientRef.current.process(plannedQualities);
        processed = result.processed;
        failed = result.failed;
        latestQuality = result.lastQuality ?? latestQuality;
        workerFrame = result.frame;
      } catch {
        disableWorkerMode(WORKER_FALLBACK_NOTICE);
      }
    }

    if (!workerModeRef.current) {
      for (const quality of plannedQualities) {
        if (token !== loopTokenRef.current || !playbackRef.current.isPlaying) {
          break;
        }

        latestQuality = quality;
        const success = await reencodeFrameWithRetry(workingCanvas, latestQuality, MAX_ENCODE_RETRY);
        if (!success) {
          failed = true;
          break;
        }
        processed += 1;
      }
    }

    const tickEnd = performance.now();
    const elapsedDelta = Math.max(0, tickEnd - lastClock);

    const nextGeneration = baseGeneration + processed;
    const interrupted = token !== loopTokenRef.current;
    if (interrupted) {
      workerFrame?.close();
      processingRef.current = false;
      loopTimerRef.current = null;
      return;
    }

    if (workerFrame) {
      drawWorkerFrameToCurrentCanvas(workerFrame);
    }

    schedulerRef.current = settleSchedulerAfterProcess(schedulerRef.current, processed, tickEnd - tickStart);

    const shouldStop = failed || (stepsToRun > 0 && processed === 0);

    let nextPsnr = playbackRef.current.render.psnr;
    let nextSsim = playbackRef.current.render.ssim;
    const shouldMeasureMetricsByGeneration = processed > 0 && (nextGeneration === 1 || nextGeneration % METRICS_INTERVAL === 0);
    const shouldMeasureMetricsByTime = tickEnd - lastMetricsAtMsRef.current >= METRICS_MIN_INTERVAL_MS;
    if (shouldMeasureMetricsByGeneration && shouldMeasureMetricsByTime) {
      const metrics = measureQualityMetrics();
      nextPsnr = metrics.psnr;
      nextSsim = metrics.ssim;
      lastMetricsAtMsRef.current = tickEnd;
    }

    const instantFps = elapsedDelta > 0 ? (processed * 1000) / elapsedDelta : playbackRef.current.render.fps;
    const smoothFps =
      processed > 0
        ? playbackRef.current.render.fps === 0
          ? instantFps
          : playbackRef.current.render.fps * 0.7 + instantFps * 0.3
        : playbackRef.current.render.fps;

    const shouldUpdatePreview =
      processed > 0 &&
      (tickEnd - lastPreviewPaintMsRef.current >= PREVIEW_FRAME_INTERVAL_MS || shouldStop || failed);
    if (shouldUpdatePreview) {
      lastPreviewPaintMsRef.current = tickEnd;
      setFrameVersion((prev) => prev + 1);
    }

    const nowMs = Date.now();
    const schedulerSnapshot = schedulerRef.current;
    setPlayback((prev) => {
      const nextAppliedGeneration = prev.simulation.appliedGeneration + processed;
      const nextElapsedSimMs = nextAppliedGeneration * 1000;
      return {
        ...prev,
        isPlaying: prev.isPlaying && !shouldStop,
        wallClock: advanceWallClock(prev.wallClock, nowMs),
        simulation: {
          targetGenPerSec: prev.simulation.targetGenPerSec,
          effectiveGenPerSec,
          generationDebt: schedulerSnapshot.generationDebt,
          appliedGeneration: nextAppliedGeneration,
          elapsedSimMs: nextElapsedSimMs,
        },
        processing: {
          ...prev.processing,
          avgGenerationCostMs: schedulerSnapshot.avgGenerationCostMs,
          workerMode: workerModeRef.current,
        },
        render: {
          ...prev.render,
          currentQuality: processed > 0 ? latestQuality : prev.render.currentQuality,
          fps: Number.isFinite(smoothFps) ? smoothFps : prev.render.fps,
          psnr: nextPsnr,
          ssim: nextSsim,
        },
      };
    });

    if (failed) {
      setHasEnded(true);
      setNotice(ENCODE_FAILED_NOTICE);
    }

    processingRef.current = false;
    loopTimerRef.current = null;

    if (shouldStop || !playbackRef.current.isPlaying || token !== loopTokenRef.current) {
      return;
    }

    const delayMs = schedulerRef.current.generationDebt >= 1 ? 0 : LOOP_INTERVAL_MS;
    loopTimerRef.current = window.setTimeout(() => {
      void runTickRef.current();
    }, delayMs);
  };

  useEffect(() => {
    if (!playback.isPlaying || !upload) {
      stopLoop();
      return;
    }

    if (loopTimerRef.current !== null || processingRef.current) {
      return;
    }

    playbackClockRef.current = performance.now();
    void runTickRef.current();
  }, [playback.isPlaying, stopLoop, upload]);

  const handleUpload = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setNotice(validationError);
      return;
    }

    loopTokenRef.current += 1;
    stopLoop();
    lastPreviewPaintMsRef.current = 0;
    lastMetricsAtMsRef.current = 0;
    schedulerRef.current = createSchedulerState(settingsRef.current.tickMs);
    disableWorkerMode();
    setIsLoading(true);
    setHasEnded(false);
    setNotice(LOAD_IMAGE_NOTICE);

    try {
      const decoded = await decodeFileToCanvasSource(file);
      const { original, current } = ensureCanvases(true);
      const { width, height, resized } = drawInitialFrame(
        decoded.source,
        decoded.width,
        decoded.height,
        original,
        current,
      );
      decoded.dispose();

      setUpload({
        fileName: file.name,
        originalWidth: decoded.width,
        originalHeight: decoded.height,
        processingWidth: width,
        processingHeight: height,
        resized,
      });

      const startedAtMs = Date.now();
      setPlayback(createInitialPlaybackState(settingsRef.current, startedAtMs, true, width, height));

      setScreenMode('viewer');
      lastPreviewPaintMsRef.current = performance.now();
      lastMetricsAtMsRef.current = 0;
      setFrameVersion((prev) => prev + 1);

      const workerReady = await syncWorkerFromCanvas(current);
      setNotice(
        resized
          ? `再生を開始しました。高解像度のため ${width}x${height} に自動縮小しています。${
              workerReady ? ' Workerモードです。' : ''
            }`
          : `再生を開始しました。${workerReady ? 'Workerモードです。' : ''}`,
      );
    } catch {
      setNotice(LOAD_IMAGE_FAILED_NOTICE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleSelect = async (sampleId: string): Promise<void> => {
    if (!isSampleId(sampleId)) {
      return;
    }

    setIsLoading(true);
    try {
      const file = await createSampleImageFile(sampleId);
      await handleUpload(file);
    } catch {
      setNotice(SAMPLE_IMAGE_FAILED_NOTICE);
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!uploadRef.current) {
      return;
    }

    if (playbackRef.current.isPlaying) {
      loopTokenRef.current += 1;
      stopLoop();
      schedulerRef.current = {
        ...schedulerRef.current,
        generationDebt: 0,
      };
      setPlayback((prev) => {
        return {
          ...prev,
          isPlaying: false,
          simulation: {
            ...prev.simulation,
            effectiveGenPerSec: 0,
            generationDebt: 0,
          },
        };
      });
      return;
    }

    if (hasEndedRef.current) {
      resetSession(true);
      return;
    }

    schedulerRef.current = {
      ...schedulerRef.current,
      generationDebt: 0,
    };
    playbackClockRef.current = performance.now();
    setPlayback((prev) => {
      return {
        ...prev,
        isPlaying: true,
        simulation: {
          ...prev.simulation,
          generationDebt: 0,
        },
      };
    });
  };

  const handleBackToLanding = () => {
    loopTokenRef.current += 1;
    stopLoop();
    lastPreviewPaintMsRef.current = 0;
    lastMetricsAtMsRef.current = 0;
    schedulerRef.current = createSchedulerState(settingsRef.current.tickMs);
    disableWorkerMode();
    setPlayback(createInitialPlaybackState(settingsRef.current, null, false));
    setUpload(null);
    setShowOriginal(false);
    setHasEnded(false);
    setScreenMode('landing');
    setNotice(DEFAULT_NOTICE);
  };

  const shiftSpeed = (direction: -1 | 1) => {
    const currentSpeed = playbackRef.current.simulation.targetGenPerSec as SpeedPreset;
    const currentIndex = VIEWER_SPEED_PRESETS.findIndex((value) => value === currentSpeed);
    const safeIndex = currentIndex >= 0 ? currentIndex : VIEWER_SPEED_PRESETS.indexOf(1);
    const nextIndex = Math.min(Math.max(0, safeIndex + direction), VIEWER_SPEED_PRESETS.length - 1);
    const nextSpeed = VIEWER_SPEED_PRESETS[nextIndex];

    if (nextSpeed === currentSpeed) {
      return;
    }

    setPlayback((prev) => {
      return {
        ...prev,
        simulation: {
          ...prev.simulation,
          targetGenPerSec: nextSpeed,
        },
      };
    });
  };

  return {
    playback,
    upload,
    frameVersion,
    screenMode,
    isLoading,
    showOriginal,
    hasEnded,
    notice,
    originalCanvas: originalCanvasRef.current,
    currentCanvas: currentCanvasRef.current,
    handleUpload,
    handleSampleSelect,
    handlePlayPause,
    handleBackToLanding,
    handleReset: () => resetSession(true),
    handleCompareToggle: () => setShowOriginal((prev) => !prev),
    shiftSpeed,
  };
};
