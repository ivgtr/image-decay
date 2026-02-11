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
  onCompareStart,
  onCompareEnd,
}: PlaybackHudProps) {
  return (
    <section className="ui-floating-panel pointer-events-auto w-full overflow-hidden rounded-t-2xl border border-slate-300 bg-white/95 md:w-[min(88vw,430px)] md:rounded-2xl">
      <PlaybackProgressBar progress={progress} />
      <PlaybackHudHeader
        fileName={fileName}
        hasEnded={hasEnded}
        onCompareEnd={onCompareEnd}
        onCompareStart={onCompareStart}
        onReset={onReset}
        speedLabel={`x${speed}`}
      />
      <PlaybackHudControls isPlaying={isPlaying} onFaster={onFaster} onPlayPause={onPlayPause} onSlower={onSlower} />
    </section>
  );
}
