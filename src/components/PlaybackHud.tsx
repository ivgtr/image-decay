import { PlaybackHudControls } from './playback/PlaybackHudControls';
import { PlaybackHudHeader } from './playback/PlaybackHudHeader';
import { PlaybackProgressBar } from './playback/PlaybackProgressBar';
import type { PlaybackHudActionHandlers, PlaybackHudViewState } from './playback/types';

type PlaybackHudProps = PlaybackHudViewState & PlaybackHudActionHandlers;

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
  onCompareToggle,
  showOriginal,
}: PlaybackHudProps) {
  return (
    <section className="ui-floating-panel pointer-events-auto w-full overflow-hidden rounded-t-2xl bg-white/95 backdrop-blur-sm md:w-[min(84vw,390px)] md:rounded-2xl">
      <PlaybackProgressBar progress={progress} />
      <PlaybackHudHeader
        fileName={fileName}
        hasEnded={hasEnded}
        onCompareToggle={onCompareToggle}
        onReset={onReset}
        showOriginal={showOriginal}
        speedLabel={`x${speed}`}
      />
      <PlaybackHudControls isPlaying={isPlaying} onFaster={onFaster} onPlayPause={onPlayPause} onSlower={onSlower} />
    </section>
  );
}
