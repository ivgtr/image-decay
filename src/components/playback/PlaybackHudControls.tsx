import { MinusIcon, PauseIcon, PlayIcon, PlusIcon } from '../icons/AppIcons';

interface PlaybackHudControlsProps {
  isPlaying: boolean;
  onSlower: () => void;
  onPlayPause: () => void;
  onFaster: () => void;
}

const iconButtonClass = 'ui-btn ui-btn-secondary h-10 w-10 !px-0 text-sm';

export function PlaybackHudControls({ isPlaying, onSlower, onPlayPause, onFaster }: PlaybackHudControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:pb-4">
      <button aria-label="slower" className={iconButtonClass} onClick={onSlower} type="button">
        <MinusIcon className="h-5 w-5" />
      </button>
      <button
        aria-label="play-pause"
        className="ui-btn ui-btn-primary h-12 w-12 !px-0 text-sm"
        onClick={onPlayPause}
        type="button"
      >
        {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>
      <button aria-label="faster" className={iconButtonClass} onClick={onFaster} type="button">
        <PlusIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
