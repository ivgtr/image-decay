import type { SampleOption } from '../../lib/app/sampleLibrary';
import { UploadIcon } from '../icons/AppIcons';
import { SampleList } from './SampleList';

interface LandingUploadPanelProps {
  isLoading: boolean;
  notice: string;
  samples: SampleOption[];
  onFileSelect: (file: File | null) => void;
  onSampleSelect: (sampleId: string) => void;
}

export function LandingUploadPanel({
  isLoading,
  notice,
  onFileSelect,
  onSampleSelect,
  samples,
}: LandingUploadPanelProps) {
  return (
    <aside className="panel-surface p-4 md:p-6">
      <label
        className="ui-upload-drop group flex min-h-[208px] cursor-pointer flex-col items-center justify-center rounded-2xl px-4 py-6 text-center"
        htmlFor="image-input"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition group-hover:border-blue-500 group-hover:text-blue-700">
          <UploadIcon className="h-6 w-6" />
        </span>
        <span className="mt-4 text-lg font-semibold text-slate-900">Upload Image</span>
        <span className="mt-2 text-xs text-slate-600">JPEG / PNG / WebP / GIF</span>
        <span className="mt-2 text-xs text-slate-500">max 10MB</span>
      </label>

      <SampleList isLoading={isLoading} onSampleSelect={onSampleSelect} samples={samples} />

      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={isLoading}
        id="image-input"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onFileSelect(file);
          event.currentTarget.value = '';
        }}
        type="file"
      />

      <p className="mt-4 min-h-6 text-xs text-amber-700">{isLoading ? 'loading...' : notice}</p>
    </aside>
  );
}
