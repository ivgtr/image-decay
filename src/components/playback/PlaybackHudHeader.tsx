import { CompareIcon, ResetIcon } from '../icons/AppIcons';

interface PlaybackHudHeaderProps {
  fileName: string;
  hasEnded: boolean;
  speedLabel: string;
  onCompareStart: () => void;
  onCompareEnd: () => void;
  onReset: () => void;
}

export function PlaybackHudHeader({
  fileName,
  hasEnded,
  speedLabel,
  onCompareStart,
  onCompareEnd,
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
          aria-label="show original while pressing"
          className="ui-btn ui-btn-neutral h-10 w-10 !px-0"
          onMouseDown={onCompareStart}
          onMouseLeave={onCompareEnd}
          onMouseUp={onCompareEnd}
          onTouchCancel={onCompareEnd}
          onTouchEnd={onCompareEnd}
          onTouchStart={onCompareStart}
          type="button"
        >
          <CompareIcon className="h-4 w-4" />
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
