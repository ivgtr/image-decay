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
  SETTINGS_CORRECTED_NOTICE,
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
import { createDegradationWorkerClient, type DegradationWorkerClient } from '../lib/degradation/workerClient';
import { DEFAULT_PLAYBACK_STATE, type PlaybackState, type SessionSettings, type UploadState } from '../types/domain';

interface UseDecayControllerArgs {
  settings: SessionSettings;
  settingsRef: MutableRefObject<SessionSettings>;
  hasLoadError: boolean;
  mergeSettings: (partial: Partial<SessionSettings>) => boolean;
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

export const useDecayController = ({
  settings,
  settingsRef,
  hasLoadError,
  mergeSettings,
}: UseDecayControllerArgs): UseDecayControllerResult => {
  const [playback, setPlayback] = useState<PlaybackState>({
    ...DEFAULT_PLAYBACK_STATE,
    currentQuality: settings.initialQuality,
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
    if (playback.generation !== 0) {
      return;
    }
    setPlayback((prev) => {
      if (prev.currentQuality === settings.initialQuality) {
        return prev;
      }
      return { ...prev, currentQuality: settings.initialQuality };
    });
  }, [playback.generation, settings.initialQuality]);

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
    const freshCurrent = resetCurrentFrame();

    setPlayback({
      ...DEFAULT_PLAYBACK_STATE,
      currentQuality: settingsRef.current.initialQuality,
      psnr: null,
      ssim: null,
      isPlaying: autoPlay,
    });
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
    const baseGeneration = playbackRef.current.generation;
    const stepsToRun = config.batch;
    const plannedQualities: number[] = [];

    for (let step = 0; step < stepsToRun; step += 1) {
      plannedQualities.push(computeQuality(config, baseGeneration + step + 1));
    }

    let processed = 0;
    let failed = false;
    let latestQuality = playbackRef.current.currentQuality;
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
    const lastClock = playbackClockRef.current ?? tickStart;
    const elapsedDelta = Math.max(0, tickEnd - lastClock);
    playbackClockRef.current = tickEnd;

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

    const shouldStop = failed || processed === 0;

    let nextPsnr = playbackRef.current.psnr;
    let nextSsim = playbackRef.current.ssim;
    if (processed > 0 && (nextGeneration === 1 || nextGeneration % METRICS_INTERVAL === 0)) {
      const metrics = measureQualityMetrics();
      nextPsnr = metrics.psnr;
      nextSsim = metrics.ssim;
    }

    const instantFps = elapsedDelta > 0 ? (processed * 1000) / elapsedDelta : playbackRef.current.fps;
    const smoothFps =
      processed > 0
        ? playbackRef.current.fps === 0
          ? instantFps
          : playbackRef.current.fps * 0.7 + instantFps * 0.3
        : playbackRef.current.fps;

    if (processed > 0) {
      setFrameVersion((prev) => prev + 1);
    }

    setPlayback((prev) => ({
      ...prev,
      generation: prev.generation + processed,
      elapsedMs: prev.elapsedMs + processed * config.tickMs,
      currentQuality: processed > 0 ? latestQuality : prev.currentQuality,
      fps: Number.isFinite(smoothFps) ? smoothFps : prev.fps,
      psnr: nextPsnr,
      ssim: nextSsim,
      isPlaying: prev.isPlaying && !shouldStop,
    }));

    if (failed) {
      setHasEnded(true);
      setNotice(ENCODE_FAILED_NOTICE);
    }

    processingRef.current = false;
    loopTimerRef.current = null;

    if (shouldStop || !playbackRef.current.isPlaying || token !== loopTokenRef.current) {
      return;
    }

    const effectiveTickMs = Math.max(8, config.tickMs / config.speed);
    const processCost = tickEnd - tickStart;
    const delayMs = Math.max(0, effectiveTickMs - processCost);
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
        width,
        height,
        resized,
      });

      setPlayback({
        ...DEFAULT_PLAYBACK_STATE,
        currentQuality: settingsRef.current.initialQuality,
        psnr: null,
        ssim: null,
        isPlaying: true,
      });

      setScreenMode('viewer');
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
      setPlayback((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    if (hasEndedRef.current) {
      resetSession(true);
      return;
    }

    playbackClockRef.current = performance.now();
    setPlayback((prev) => ({ ...prev, isPlaying: true }));
  };

  const handleBackToLanding = () => {
    loopTokenRef.current += 1;
    stopLoop();
    disableWorkerMode();
    setPlayback({
      ...DEFAULT_PLAYBACK_STATE,
      currentQuality: settingsRef.current.initialQuality,
      psnr: null,
      ssim: null,
    });
    setUpload(null);
    setShowOriginal(false);
    setHasEnded(false);
    setScreenMode('landing');
    setNotice(DEFAULT_NOTICE);
  };

  const shiftSpeed = (direction: -1 | 1) => {
    const currentIndex = VIEWER_SPEED_PRESETS.findIndex((value) => value === settingsRef.current.speed);
    const safeIndex = currentIndex >= 0 ? currentIndex : VIEWER_SPEED_PRESETS.indexOf(1);
    const nextIndex = Math.min(Math.max(0, safeIndex + direction), VIEWER_SPEED_PRESETS.length - 1);
    const nextSpeed = VIEWER_SPEED_PRESETS[nextIndex];

    if (nextSpeed === settingsRef.current.speed) {
      return;
    }

    const hadError = mergeSettings({ speed: nextSpeed });
    if (hadError) {
      setNotice(SETTINGS_CORRECTED_NOTICE);
    }
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
