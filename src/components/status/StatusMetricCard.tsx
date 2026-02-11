import type { StatusMetricItem } from '../../lib/app/statusMetrics';
import { ClockIcon, CompareIcon, LayersIcon, SparkIcon, SpeedIcon } from '../icons/AppIcons';

interface StatusMetricCardProps {
  metric: StatusMetricItem;
}

const iconByMetric = (id: StatusMetricItem['id']) => {
  if (id === 'generation') {
    return <LayersIcon className="h-4 w-4" />;
  }
  if (id === 'quality') {
    return <SparkIcon className="h-4 w-4" />;
  }
  if (id === 'elapsed') {
    return <ClockIcon className="h-4 w-4" />;
  }
  if (id === 'fps') {
    return <SpeedIcon className="h-4 w-4" />;
  }
  return <CompareIcon className="h-4 w-4" />;
};

export function StatusMetricCard({ metric }: StatusMetricCardProps) {
  return (
    <article className="ui-stat-card">
      <p className="micro-label inline-flex items-center gap-1">
        {iconByMetric(metric.id)}
        {metric.label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{metric.value}</p>
    </article>
  );
}
