import type { SampleOption } from '../../lib/app/sampleLibrary';

interface SampleListProps {
  isLoading: boolean;
  samples: SampleOption[];
  onSampleSelect: (sampleId: string) => void;
}

const cardClass = 'landing-sample-btn group w-full text-left disabled:cursor-not-allowed disabled:opacity-50';

export function SampleList({ isLoading, onSampleSelect, samples }: SampleListProps) {
  return (
    <div className="landing-sample-list mt-4 rounded-2xl border border-slate-300 bg-slate-100/70 p-4">
      <p className="micro-label">Presets</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {samples.map((sample) => (
          <button
            className={cardClass}
            disabled={isLoading}
            key={sample.id}
            onClick={() => onSampleSelect(sample.id)}
            type="button"
          >
            <p className="text-sm font-semibold text-slate-900">{sample.title}</p>
            <span className="landing-sample-btn-chip">LOAD</span>
          </button>
        ))}
      </div>
    </div>
  );
}
