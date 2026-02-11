import type { SpeedPreset } from '../types/domain';

interface PlaybackHudProps {
  fileName: string;
  hasEnded: boolean;
  isPlaying: boolean;
  progress: number;
  speed: SpeedPreset;
  onPlayPause: () => void;
  onReset: () => void;
  onSlower: () => void;
  onFaster: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
}

const iconButtonClass =
  'ui-btn ui-btn-secondary h-10 w-10 !px-0 text-sm';

export function PlaybackHud({
  fileName,
  hasEnded,
  isPlaying,
  progress,
  speed,
  onPlayPause,
  onReset,
  onSlower,
  onFaster,
  onCompareStart,
  onCompareEnd,
}: PlaybackHudProps) {
  return (
    <section className="ui-floating-panel pointer-events-auto w-full overflow-hidden rounded-t-2xl border border-slate-300 bg-white/95 md:w-[min(88vw,430px)] md:rounded-2xl">
      <div className="h-1 w-full bg-slate-200">
        <div
          className="h-full bg-blue-600 transition-[width] duration-200"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-700 md:text-sm">{fileName}</p>
          <p className="mt-2 text-xs text-slate-500">{hasEnded ? 'ended' : `x${speed}`}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="ui-btn ui-btn-neutral ui-btn-compact"
            onMouseDown={onCompareStart}
            onMouseLeave={onCompareEnd}
            onMouseUp={onCompareEnd}
            onTouchCancel={onCompareEnd}
            onTouchEnd={onCompareEnd}
            onTouchStart={onCompareStart}
            type="button"
          >
            ORIG
          </button>
          <button
            aria-label="reset"
            className="ui-btn ui-btn-neutral ui-btn-compact"
            onClick={onReset}
            type="button"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:pb-4">
        <button aria-label="slower" className={iconButtonClass} onClick={onSlower} type="button">
          {'-'}
        </button>
        <button
          aria-label="play-pause"
          className="ui-btn ui-btn-primary h-12 w-12 !px-0 text-sm"
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? '||' : '>'}
        </button>
        <button aria-label="faster" className={iconButtonClass} onClick={onFaster} type="button">
          {'+'}
        </button>
      </div>
    </section>
  );
}
