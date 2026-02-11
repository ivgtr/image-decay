import { useEffect, useState } from 'react';
import { CanvasViewport } from '../CanvasViewport';
import { PlaybackHud } from '../PlaybackHud';
import { StatusBar } from '../StatusBar';
import { ViewerNotice } from './ViewerNotice';
import type { PlaybackState, SpeedPreset } from '../../types/domain';
import { ArrowLeftIcon } from '../icons/AppIcons';

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
  onCompareToggle: () => void;
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
  onCompareToggle,
  onFaster,
  onSlower,
  onPlayPause,
  onReset,
}: ViewerScreenProps) {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isInfoOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfoOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isInfoOpen]);

  return (
    <section className="relative h-screen overflow-hidden px-2 pb-[176px] pt-2 md:px-3 md:pb-28 md:pt-3">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2">
        <header className="flex items-center justify-between gap-2 px-1 py-1">
          <button
            aria-label="back to upload"
            className="ui-btn ui-btn-secondary h-10 w-10 !px-0"
            onClick={onBack}
            type="button"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="rounded-md border border-slate-200 bg-white/70 px-3 py-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Elapsed</p>
              <p className="text-xs font-semibold tabular-nums text-slate-900 md:text-sm">{elapsedLabel}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white/70 px-3 py-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Speed</p>
              <p className="text-xs font-semibold tabular-nums text-slate-900 md:text-sm">{speedLabel}</p>
            </div>
          </div>

          <button
            className="ui-btn ui-btn-neutral ui-btn-caps ui-btn-compact"
            onClick={() => setIsInfoOpen(true)}
            type="button"
          >
            INFO
          </button>
        </header>

        {shouldShowNotice ? <ViewerNotice notice={notice} /> : null}

        <div className="min-h-0 flex-1">
          <CanvasViewport
            currentCanvas={currentCanvas}
            frameVersion={frameVersion}
            originalCanvas={originalCanvas}
            showOriginal={showOriginal}
          />
        </div>
      </div>

      {isInfoOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4"
          onClick={() => setIsInfoOpen(false)}
          role="presentation"
        >
          <section className="ui-floating-panel w-full max-w-5xl rounded-2xl bg-white/95 p-4 md:p-5" onClick={(event) => event.stopPropagation()}>
            <header className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Playback</p>
                <p className="text-sm font-semibold text-slate-900">{fileName}</p>
              </div>
              <button
                className="ui-btn ui-btn-secondary ui-btn-caps ui-btn-compact"
                onClick={() => setIsInfoOpen(false)}
                type="button"
              >
                CLOSE
              </button>
            </header>

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Elapsed</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{elapsedLabel}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Generation</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{generation}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Speed</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{speedLabel}</p>
              </div>
            </div>

            <StatusBar elevated={false} playback={playback} />
          </section>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 md:absolute md:bottom-6 md:right-8 md:left-auto md:w-[430px]">
        <PlaybackHud
          fileName={fileName}
          hasEnded={hasEnded}
          isPlaying={isPlaying}
          onCompareToggle={onCompareToggle}
          showOriginal={showOriginal}
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
