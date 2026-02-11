import { useEffect, useRef, useState } from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { ControlPanel } from './components/ControlPanel';
import { StatusBar } from './components/StatusBar';
import {
  calculateQualityMetrics,
  copyCanvasFrame,
  decodeFileToCanvasSource,
  drawInitialFrame,
  reencodeFrameWithRetry,
} from './lib/degradation/engine';
import { computeQuality, sanitizeSessionSettings, validateImageFile } from './lib/degradation/model';
import {
  DEFAULT_PLAYBACK_STATE,
  type PlaybackState,
  type SessionSettings,
  type SessionSettingsErrorMap,
  type UploadState,
} from './types/domain';

const STORAGE_KEY = 'image-decay:session-settings';
const MAX_ENCODE_RETRY = 3;
const METRICS_INTERVAL = 5;

const loadSettings = (): { settings: SessionSettings; errors: SessionSettingsErrorMap } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return sanitizeSessionSettings(null);
    }
    return sanitizeSessionSettings(JSON.parse(raw));
  } catch {
    return sanitizeSessionSettings(null);
  }
};

function App() {
  const loadedSettingsRef = useRef(loadSettings());
  const [settings, setSettings] = useState<SessionSettings>(() => loadedSettingsRef.current.settings);
  const [settingErrors, setSettingErrors] = useState<SessionSettingsErrorMap>(() => loadedSettingsRef.current.errors);
  const [playback, setPlayback] = useState<PlaybackState>({
    ...DEFAULT_PLAYBACK_STATE,
    currentQuality: loadedSettingsRef.current.settings.initialQuality,
  });
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [frameVersion, setFrameVersion] = useState<number>(0);
  const [notice, setNotice] = useState<string>(() => {
    if (Object.keys(loadedSettingsRef.current.errors).length > 0) {
      return '保存済み設定に不正値があり補正しました。';
    }
    return '画像をアップロードしてください。';
  });

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferARef = useRef<HTMLCanvasElement | null>(null);
  const psnrBufferBRef = useRef<HTMLCanvasElement | null>(null);

  const settingsRef = useRef(settings);
  const playbackRef = useRef(playback);
  const uploadRef = useRef(upload);

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

  const resetCurrentFrame = () => {
    const original = originalCanvasRef.current;
    if (!original) {
      return;
    }

    const freshCurrent = document.createElement('canvas');
    copyCanvasFrame(original, freshCurrent);
    currentCanvasRef.current = freshCurrent;
    setFrameVersion((prev) => prev + 1);
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

    let processed = 0;
    let failed = false;
    let latestQuality = playbackRef.current.currentQuality;

    for (let step = 0; step < stepsToRun; step += 1) {
      if (token !== loopTokenRef.current || !playbackRef.current.isPlaying) {
        break;
      }

      const nextGeneration = baseGeneration + processed + 1;
      latestQuality = computeQuality(config, nextGeneration);

      const success = await reencodeFrameWithRetry(workingCanvas, latestQuality, MAX_ENCODE_RETRY);
      if (!success) {
        failed = true;
        break;
      }

      processed += 1;
    }

    const tickEnd = performance.now();
    const lastClock = playbackClockRef.current ?? tickStart;
    const elapsedDelta = Math.max(0, tickEnd - lastClock);
    playbackClockRef.current = tickEnd;

    const nextGeneration = baseGeneration + processed;
    const reachedMax = nextGeneration >= config.maxGenerations;
    const interrupted = token !== loopTokenRef.current;
    if (interrupted) {
      processingRef.current = false;
      loopTimerRef.current = null;
      return;
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
        elapsedMs: prev.elapsedMs + elapsedDelta,
        currentQuality: processed > 0 ? latestQuality : prev.currentQuality,
        fps: Number.isFinite(smoothFps) ? smoothFps : prev.fps,
        psnr: nextPsnr,
        ssim: nextSsim,
        isPlaying: prev.isPlaying && !shouldStop,
      };
    });

    if (failed) {
      setNotice('JPEG再エンコードに3回失敗したため停止しました。');
    } else if (reachedMax) {
      setNotice(`最大世代 (${config.maxGenerations}) に到達したため停止しました。`);
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

  const handleSettingsChange = (next: SessionSettings) => {
    const sanitized = sanitizeSessionSettings(next);
    setSettings(sanitized.settings);
    setSettingErrors(sanitized.errors);

    if (Object.keys(sanitized.errors).length > 0) {
      setNotice('設定値を補正しました。入力範囲を確認してください。');
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
      });

      setFrameVersion((prev) => prev + 1);
      setNotice(
        resized
          ? `アップロード成功。高解像度のため ${width}x${height} に自動縮小しました。`
          : 'アップロード成功。Playで劣化を開始できます。',
      );
    } catch {
      setNotice('画像の読み込みに失敗しました。別の画像で再試行してください。');
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
      setNotice('一時停止しました。');
      return;
    }

    playbackClockRef.current = performance.now();
    setPlayback((prev) => ({ ...prev, isPlaying: true }));
    setNotice('再生中...');
  };

  const handleReset = () => {
    loopTokenRef.current += 1;
    stopLoop();
    resetCurrentFrame();
    setPlayback({
      ...DEFAULT_PLAYBACK_STATE,
      currentQuality: settingsRef.current.initialQuality,
      psnr: null,
      ssim: null,
    });
    setNotice('セッションを初期化しました。');
  };

  const disablePlay = !upload;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-xl font-bold tracking-wide">image-decay</h1>
          <p className="mt-1 text-sm text-slate-300">JPEG劣化観測アプリケーション</p>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <label className="mb-2 block text-sm text-slate-300" htmlFor="image-input">
            画像アップロード（JPEG / PNG / WebP / GIF, 10MBまで）
          </label>
          <input
            className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm"
            id="image-input"
            onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
            type="file"
          />
          <p className="mt-2 text-xs text-amber-300">{notice}</p>
          {upload ? (
            <p className="mt-1 text-xs text-slate-400">
              現在の画像: {upload.fileName} ({upload.width}x{upload.height})
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <CanvasViewport
            currentCanvas={currentCanvasRef.current}
            frameVersion={frameVersion}
            originalCanvas={originalCanvasRef.current}
          />
          <ControlPanel
            disablePlay={disablePlay}
            errors={settingErrors}
            isPlaying={playback.isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onSettingsChange={handleSettingsChange}
            settings={settings}
          />
        </div>

        <StatusBar playback={playback} />
      </div>
    </main>
  );
}

export default App;
