import { buildStatusMetrics, type StatusMetricItem } from '../lib/app/statusMetrics';
import type { PlaybackState } from '../types/domain';
import { StatusMetricCard } from './status/StatusMetricCard';

interface StatusBarProps {
  playback: PlaybackState;
  elevated?: boolean;
}

export function StatusBar({ playback, elevated = true }: StatusBarProps) {
  const stats = buildStatusMetrics(playback);
  const containerClass = elevated
    ? 'panel-surface grid gap-3 rounded-2xl p-4 md:grid-cols-3 xl:grid-cols-6'
    : 'grid gap-3 rounded-2xl md:grid-cols-3 xl:grid-cols-6';

  return (
    <section className={containerClass}>
      {stats.map((stat: StatusMetricItem) => <StatusMetricCard key={stat.label} metric={stat} />)}
    </section>
  );
}
