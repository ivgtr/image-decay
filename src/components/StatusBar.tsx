import type { PlaybackState } from '../types/domain';

interface StatusBarProps {
  playback: PlaybackState;
}

const toSeconds = (elapsedMs: number): string => {
  return (elapsedMs / 1000).toFixed(1);
};

const formatPsnr = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return `${value.toFixed(2)} dB`;
};

const formatSsim = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }
  return value.toFixed(4);
};

export function StatusBar({ playback }: StatusBarProps) {
  return (
    <section className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200 md:grid-cols-6">
      <p>Generation: {playback.generation}</p>
      <p>Quality: {playback.currentQuality.toFixed(3)}</p>
      <p>Elapsed: {toSeconds(playback.elapsedMs)}s</p>
      <p>FPS: {playback.fps.toFixed(1)}</p>
      <p>PSNR: {formatPsnr(playback.psnr)}</p>
      <p>SSIM: {formatSsim(playback.ssim)}</p>
    </section>
  );
}
