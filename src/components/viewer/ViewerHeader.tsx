import type { ReactNode } from 'react';
import { ArrowLeftIcon, ClockIcon, LayersIcon, SpeedIcon } from '../icons/AppIcons';

interface ViewerHeaderProps {
  elapsedLabel: string;
  generation: number;
  speedLabel: string;
  onBack: () => void;
}

interface StatChipProps {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
}

const StatChip = ({ label, value, icon, className }: StatChipProps) => {
  return (
    <div className={className ?? 'rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-right'}>
      <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm tabular-nums text-slate-600">{value}</p>
    </div>
  );
};

export function ViewerHeader({ elapsedLabel, generation, speedLabel, onBack }: ViewerHeaderProps) {
  return (
    <header className="panel-surface flex items-center justify-between gap-4 px-4 py-4 md:px-6">
      <button className="ui-btn ui-btn-secondary ui-btn-caps gap-2" onClick={onBack} type="button">
        <ArrowLeftIcon className="h-4 w-4" />
        CHANGE
      </button>

      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-right">
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
            <ClockIcon className="h-4 w-4" />
            Elapsed
          </p>
          <p className="text-xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-2xl">{elapsedLabel}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
            <LayersIcon className="h-4 w-4" />
            G {generation}
          </p>
        </div>

        <StatChip
          className="hidden rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-right md:block"
          icon={<SpeedIcon className="h-4 w-4" />}
          label="Speed"
          value={speedLabel}
        />
      </div>
    </header>
  );
}
