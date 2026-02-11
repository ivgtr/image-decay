import { buildStatusMetrics, type StatusMetricItem } from '../lib/app/statusMetrics';
import type { PlaybackState } from '../types/domain';
import { StatusMetricCard } from './status/StatusMetricCard';

interface StatusBarProps {
  playback: PlaybackState;
}

export function StatusBar({ playback }: StatusBarProps) {
  const stats = buildStatusMetrics(playback);

  return (
    <section className="panel-surface grid gap-3 rounded-2xl p-4 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat: StatusMetricItem) => <StatusMetricCard key={stat.label} metric={stat} />)}
    </section>
  );
}
