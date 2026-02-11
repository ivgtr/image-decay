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
  const stats = [
    { label: 'Generation', value: `${playback.generation}` },
    { label: 'Quality', value: playback.currentQuality.toFixed(3) },
    { label: 'Elapsed', value: `${toSeconds(playback.elapsedMs)}s` },
    { label: 'FPS', value: playback.fps.toFixed(1) },
    { label: 'PSNR', value: formatPsnr(playback.psnr) },
    { label: 'SSIM', value: formatSsim(playback.ssim) },
  ];

  return (
    <section className="panel-surface grid gap-3 rounded-2xl p-4 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <article className="ui-stat-card" key={stat.label}>
          <p className="micro-label">{stat.label}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{stat.value}</p>
        </article>
      ))}
    </section>
  );
}
