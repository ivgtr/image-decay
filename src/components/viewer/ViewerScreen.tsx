import { CanvasViewport } from '../CanvasViewport';
import { PlaybackHud } from '../PlaybackHud';
import { StatusBar } from '../StatusBar';
import { ViewerHeader } from './ViewerHeader';
import { ViewerNotice } from './ViewerNotice';
import type { PlaybackState, SpeedPreset } from '../../types/domain';

interface ViewerScreenProps {
  playback: PlaybackState;
  elapsedLabel: string;
  generation: number;
  speedLabel: string;
  speed: SpeedPreset;
  shouldShowNotice: boolean;
  notice: string;
  currentCanvas: HTMLCanvasElement | null;
  originalCanvas: HTMLCanvasElement | null;
  frameVersion: number;
  showOriginal: boolean;
  fileName: string;
  hasEnded: boolean;
  isPlaying: boolean;
  progress?: number;
  onBack: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
  onFaster: () => void;
  onSlower: () => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export function ViewerScreen({
  playback,
  elapsedLabel,
  generation,
  speedLabel,
  speed,
  shouldShowNotice,
  notice,
  currentCanvas,
  originalCanvas,
  frameVersion,
  showOriginal,
  fileName,
  hasEnded,
  isPlaying,
  progress,
  onBack,
  onCompareStart,
  onCompareEnd,
  onFaster,
  onSlower,
  onPlayPause,
  onReset,
}: ViewerScreenProps) {
  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-[144px] pt-4 md:px-8 md:pb-8 md:pt-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <ViewerHeader
          elapsedLabel={elapsedLabel}
          generation={generation}
          onBack={onBack}
          speedLabel={speedLabel}
        />

        {shouldShowNotice ? <ViewerNotice notice={notice} /> : null}
        <StatusBar playback={playback} />

        <div className="flex min-h-[calc(100vh-240px)] items-center justify-center md:min-h-[calc(100vh-265px)]">
          <CanvasViewport
            currentCanvas={currentCanvas}
            frameVersion={frameVersion}
            originalCanvas={originalCanvas}
            showOriginal={showOriginal}
          />
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 md:absolute md:bottom-6 md:right-8 md:left-auto md:w-[430px]">
        <PlaybackHud
          fileName={fileName}
          hasEnded={hasEnded}
          isPlaying={isPlaying}
          onCompareEnd={onCompareEnd}
          onCompareStart={onCompareStart}
          onFaster={onFaster}
          onPlayPause={onPlayPause}
          onReset={onReset}
          onSlower={onSlower}
          progress={progress}
          speed={speed}
        />
      </div>
    </section>
  );
}
