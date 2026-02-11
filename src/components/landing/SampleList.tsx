import type { SampleOption } from '../../lib/app/sampleLibrary';

interface SampleListProps {
  isLoading: boolean;
  samples: SampleOption[];
  onSampleSelect: (sampleId: string) => void;
}

const cardClass =
  'ui-btn ui-btn-secondary group relative w-full justify-start overflow-hidden rounded-2xl border px-4 text-left disabled:cursor-not-allowed disabled:opacity-50';

export function SampleList({ isLoading, onSampleSelect, samples }: SampleListProps) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-100/70 p-4">
      <p className="micro-label">Samples</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {samples.map((sample) => (
          <button
            className={cardClass}
            disabled={isLoading}
            key={sample.id}
            onClick={() => onSampleSelect(sample.id)}
            type="button"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
            <p className="pl-4 text-sm font-semibold text-slate-900">{sample.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
