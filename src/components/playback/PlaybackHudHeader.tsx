import { CompareIcon, DownloadIcon, ResetIcon } from '../icons/AppIcons';

interface PlaybackHudHeaderProps {
  fileName: string;
  hasEnded: boolean;
  speedLabel: string;
  showOriginal: boolean;
  onCompareToggle: () => void;
  onDownload: () => Promise<void>;
  onReset: () => void;
}

export function PlaybackHudHeader({
  fileName,
  hasEnded,
  speedLabel,
  showOriginal,
  onCompareToggle,
  onDownload,
  onReset,
}: PlaybackHudHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-3">
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-700 md:text-sm">{fileName}</p>
        <p className="mt-2 text-xs text-slate-500">{hasEnded ? 'ended' : speedLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="toggle original image"
          aria-pressed={showOriginal}
          className={`ui-btn h-10 w-10 !px-0 ${showOriginal ? 'ui-btn-primary' : 'ui-btn-neutral'}`}
          onClick={onCompareToggle}
          type="button"
        >
          <CompareIcon className="h-4 w-4" />
        </button>
        <button
          aria-label="download degraded image"
          className="ui-btn ui-btn-neutral h-10 w-10 !px-0"
          onClick={() => {
            void onDownload();
          }}
          type="button"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
        <button
          aria-label="reset playback"
          className="ui-btn ui-btn-neutral h-10 w-10 !px-0"
          onClick={onReset}
          type="button"
        >
          <ResetIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
