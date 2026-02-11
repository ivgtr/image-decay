import { useEffect, useRef, useState } from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { LandingScreen } from './components/LandingScreen';
import { PlaybackHud } from './components/PlaybackHud';
import {
  calculateQualityMetrics,
  copyCanvasFrame,
  decodeFileToCanvasSource,
  drawInitialFrame,
  reencodeFrameWithRetry,
} from './lib/degradation/engine';
import { computeQuality, sanitizeSessionSettings, validateImageFile } from './lib/degradation/model';
import { DegradationWorkerClient, createDegradationWorkerClient } from './lib/degradation/workerClient';
import {
  DEFAULT_PLAYBACK_STATE,
  type PlaybackState,
  type SessionSettings,
  type SpeedPreset,
  type UploadState,
} from './types/domain';

const STORAGE_KEY = 'image-decay:session-settings';
const MAX_ENCODE_RETRY = 3;
const METRICS_INTERVAL = 5;
const WORKER_FALLBACK_NOTICE = 'Worker処理で問題が発生したためメインスレッドへフォールバックしました。';
const VIEWER_SPEED_PRESETS: SpeedPreset[] = [0.5, 1, 2, 4, 8, 16];

const SAMPLE_OPTIONS = [
  {
    id: 'neon-city',
    title: 'Neon City',
  },
  {
    id: 'portrait-light',
    title: 'Portrait Light',
  },
  {
    id: 'paper-texture',
    title: 'Paper Texture',
  },
] as const;

type SampleId = (typeof SAMPLE_OPTIONS)[number]['id'];
type ScreenMode = 'landing' | 'viewer';

const loadSettings = (): { settings: SessionSettings; hasError: boolean } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitized = sanitizeSessionSettings(null);
      return { settings: sanitized.settings, hasError: false };
    }
    const sanitized = sanitizeSessionSettings(JSON.parse(raw));
    return { settings: sanitized.settings, hasError: Object.keys(sanitized.errors).length > 0 };
  } catch {
    const sanitized = sanitizeSessionSettings(null);
    return { settings: sanitized.settings, hasError: true };
  }
};

const formatElapsed = (elapsedMs: number): string => {
  const totalSec = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const toSampleFile = async (canvas: HTMLCanvasElement, sampleId: SampleId): Promise<File> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('サンプル画像の生成に失敗しました。'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      0.94,
    );
  });

  return new File([blob], `${sampleId}.jpg`, { type: 'image/jpeg' });
};

const drawNeonCity = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#140b3b');
  sky.addColorStop(0.55, '#1f134c');
  sky.addColorStop(1, '#040811');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 20; i += 1) {
    const x = (i * width) / 20;
    const buildingWidth = width * (0.035 + (i % 5) * 0.01);
    const h = height * (0.25 + ((i * 37) % 40) / 100);
    const y = height - h;
    ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#0f172a';
    ctx.fillRect(x, y, buildingWidth, h);

    ctx.fillStyle = i % 2 === 0 ? '#22d3ee' : '#38bdf8';
    for (let w = 0; w < 6; w += 1) {
      ctx.fillRect(x + 4, y + 10 + w * 18, Math.max(3, buildingWidth - 8), 4);
    }
  }

  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.quadraticCurveTo(width * 0.45, height * 0.68, width, height * 0.74);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const drawPortraitLight = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#fef3c7');
  bg.addColorStop(0.5, '#fed7aa');
  bg.addColorStop(1, '#fca5a5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.52, width * 0.2, height * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fcd5b5';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.48, width * 0.14, height * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width * 0.34, height * 0.74, width * 0.36, height * 0.22);

  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width * 0.43, height * 0.53);
  ctx.quadraticCurveTo(width * 0.52, height * 0.59, width * 0.61, height * 0.53);
  ctx.stroke();
};

const drawPaperTexture = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#f8fafc');
  base.addColorStop(0.5, '#e2e8f0');
  base.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.25;
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      const tone = 190 + ((x * 13 + y * 17) % 45);
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i += 1) {
    const y = height * (0.08 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(width * 0.06, y);
    ctx.bezierCurveTo(width * 0.2, y - 8, width * 0.8, y + 8, width * 0.94, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const createSampleImageFile = async (sampleId: SampleId): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('サンプル画像の生成に失敗しました。');
  }

  if (sampleId === 'neon-city') {
    drawNeonCity(ctx, canvas.width, canvas.height);
  } else if (sampleId === 'portrait-light') {
    drawPortraitLight(ctx, canvas.width, canvas.height);
  } else {
    drawPaperTexture(ctx, canvas.width, canvas.height);
  }

  return toSampleFile(canvas, sampleId);
};

function App() {
  const loadedSettingsRef = useRef(loadSettings());
  const [settings, setSettings] = useState<SessionSettings>(() => loadedSettingsRef.current.settings);
  const [playback, setPlayback] = useState<PlaybackState>({
    ...DEFAULT_PLAYBACK_STATE,
    currentQuality: loadedSettingsRef.current.settings.initialQuality,
  });
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [frameVersion, setFrameVersion] = useState<number>(0);
  const [screenMode, setScreenMode] = useState<ScreenMode>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>(() => {
    if (loadedSettingsRef.current.hasError) {
      return '保存済み設定に不正値があったため補正しました。';
    }
    return '画像を選択すると自動で再生が始まります。';
  });

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferARef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferBRef = useRef<HTMLCanvasElement | null>(null);

  const settingsRef = useRef(settings);
  const playbackRef = useRef(playback);
  const uploadRef = useRef(upload);
  const workerClientRef = useRef<DegradationWorkerClient | null>(null);
  const workerModeRef = useRef<boolean>(false);
  const workerFallbackNotifiedRef = useRef<boolean>(false);

  const loopTimerRef = useRef<number | null>(null);
  const processingRef = useRef<boolean>(false);
  const playbackClockRef = useRef<number | null>(null);
  const loopTokenRef = useRef<number>(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (playback.generation === 0) {
      setPlayback((prev) => ({ ...prev, currentQuality: settings.initialQuality }));
    }
  }, [settings.initialQuality, playback.generation]);

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
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
      }
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

  const stopLoop = () => {
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    playbackClockRef.current = null;
  };

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
    const remaining = Math.max(0, config.maxGenerations - baseGeneration);
    const stepsToRun = Math.min(config.batch, remaining);
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
    const reachedMax = nextGeneration >= config.maxGenerations;
    const interrupted = token !== loopTokenRef.current;
    if (interrupted) {
      if (workerFrame) {
        workerFrame.close();
      }
      processingRef.current = false;
      loopTimerRef.current = null;
      return;
    }

    if (workerFrame) {
      drawWorkerFrameToCurrentCanvas(workerFrame);
    }

    const shouldStop = failed || reachedMax || processed === 0;

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

    setPlayback((prev) => {
      return {
        ...prev,
        generation: prev.generation + processed,
        elapsedMs: prev.elapsedMs + processed * config.tickMs,
        currentQuality: processed > 0 ? latestQuality : prev.currentQuality,
        fps: Number.isFinite(smoothFps) ? smoothFps : prev.fps,
        psnr: nextPsnr,
        ssim: nextSsim,
        isPlaying: prev.isPlaying && !shouldStop,
      };
    });

    if (failed) {
      setHasEnded(true);
      setNotice('JPEG再エンコードに3回失敗したため停止しました。');
    } else if (reachedMax) {
      setHasEnded(true);
      setNotice(`最大世代 (${config.maxGenerations}) に到達しました。REPLAYで再生できます。`);
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
  }, [playback.isPlaying, settings.batch, settings.speed, settings.tickMs, upload]);

  const mergeSettings = (partial: Partial<SessionSettings>) => {
    const sanitized = sanitizeSessionSettings({ ...settingsRef.current, ...partial });
    setSettings(sanitized.settings);
    if (Object.keys(sanitized.errors).length > 0) {
      setNotice('設定値に不正な値があったため補正しました。');
    }
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
    setNotice(autoPlay ? '' : '最初のフレームに戻しました。');

    if (freshCurrent) {
      void syncWorkerFromCanvas(freshCurrent);
    } else {
      disableWorkerMode();
    }
  };

  const handleUpload = async (file: File | null) => {
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
    setNotice('画像を読み込んでいます...');

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
      setNotice('画像の読み込みに失敗しました。別の画像で再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleSelect = async (sampleId: string) => {
    if (!SAMPLE_OPTIONS.some((sample) => sample.id === sampleId)) {
      return;
    }

    setIsLoading(true);
    try {
      const file = await createSampleImageFile(sampleId as SampleId);
      await handleUpload(file);
    } catch {
      setNotice('サンプル画像の生成に失敗しました。');
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

    if (hasEnded || playbackRef.current.generation >= settingsRef.current.maxGenerations) {
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
    setNotice('画像を選択すると自動で再生が始まります。');
  };

  const shiftSpeed = (direction: -1 | 1) => {
    const currentIndex = VIEWER_SPEED_PRESETS.findIndex((value) => value === settingsRef.current.speed);
    const safeIndex = currentIndex >= 0 ? currentIndex : VIEWER_SPEED_PRESETS.indexOf(1);
    const nextIndex = Math.min(Math.max(0, safeIndex + direction), VIEWER_SPEED_PRESETS.length - 1);
    const nextSpeed = VIEWER_SPEED_PRESETS[nextIndex];

    if (nextSpeed === settingsRef.current.speed) {
      return;
    }

    mergeSettings({ speed: nextSpeed });
  };
  const shouldShowNotice = /失敗|到達|フォールバック|補正|不正/.test(notice);

  return (
    <main className="app-shell">
      {screenMode === 'landing' ? (
        <LandingScreen
          isLoading={isLoading}
          notice={notice}
          onFileSelect={handleUpload}
          onSampleSelect={handleSampleSelect}
          samples={SAMPLE_OPTIONS.map((sample) => ({ ...sample }))}
        />
      ) : (
        <section className="relative min-h-screen overflow-hidden px-4 pb-[144px] pt-4 md:px-8 md:pb-8 md:pt-8">
          <div className="mx-auto grid w-full max-w-7xl gap-6">
            <header className="panel-surface flex items-center justify-between gap-4 px-4 py-4 md:px-6">
              <button
                className="ui-btn ui-btn-secondary ui-btn-caps"
                onClick={handleBackToLanding}
                type="button"
              >
                CHANGE
              </button>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-right">
                  <p className="text-xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-2xl">
                    {formatElapsed(playback.elapsedMs)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    G {playback.generation} / {settings.maxGenerations}
                  </p>
                </div>
                <div className="hidden rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-right md:block">
                  <p className="text-xs font-semibold text-slate-800">Speed</p>
                  <p className="mt-2 text-sm tabular-nums text-slate-600">x{settings.speed}</p>
                </div>
              </div>
            </header>

            {shouldShowNotice ? (
              <p className="ui-notice-warning mx-auto rounded-full px-4 py-2 text-xs">
                {notice}
              </p>
            ) : null}

            <div className="flex min-h-[calc(100vh-240px)] items-center justify-center md:min-h-[calc(100vh-265px)]">
              <CanvasViewport
                currentCanvas={currentCanvasRef.current}
                frameVersion={frameVersion}
                originalCanvas={originalCanvasRef.current}
                showOriginal={showOriginal}
              />
            </div>
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 md:absolute md:bottom-6 md:right-8 md:left-auto md:w-[430px]">
            <PlaybackHud
              fileName={upload?.fileName ?? 'Untitled'}
              hasEnded={hasEnded}
              isPlaying={playback.isPlaying}
              onCompareEnd={() => setShowOriginal(false)}
              onCompareStart={() => setShowOriginal(true)}
              onFaster={() => shiftSpeed(1)}
              onPlayPause={handlePlayPause}
              onReset={() => resetSession(true)}
              onSlower={() => shiftSpeed(-1)}
              progress={Math.min(1, playback.generation / settings.maxGenerations)}
              speed={settings.speed}
            />
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
