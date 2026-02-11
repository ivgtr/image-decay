import { useEffect, useRef } from 'react';
import { useElementWidth } from '../hooks/useElementWidth';
import { drawCanvasPreview } from '../lib/app/canvasPreview';
import { UploadIcon } from './icons/AppIcons';

interface CanvasViewportProps {
  originalCanvas: HTMLCanvasElement | null;
  currentCanvas: HTMLCanvasElement | null;
  frameVersion: number;
  showOriginal: boolean;
}

const EmptyState = () => {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-400 bg-slate-100/70 p-6 text-sm text-slate-600">
      <UploadIcon className="h-6 w-6" />
      No Image
    </div>
  );
};

export function CanvasViewport({ originalCanvas, currentCanvas, frameVersion, showOriginal }: CanvasViewportProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const width = useElementWidth(wrapperRef, Boolean(originalCanvas && currentCanvas));

  useEffect(() => {
    if (!previewRef.current || !originalCanvas || !currentCanvas || width <= 0) {
      return;
    }

    const source = showOriginal ? originalCanvas : currentCanvas;
    drawCanvasPreview(previewRef.current, source, width);
    previewRef.current.dataset.frameVersion = String(frameVersion);
  }, [currentCanvas, frameVersion, originalCanvas, showOriginal, width]);

  if (!originalCanvas || !currentCanvas) {
    return <EmptyState />;
  }

  return (
    <section className="panel-surface relative w-full overflow-hidden p-2 md:p-4" ref={wrapperRef}>
      <div className="relative">
        <canvas className="w-full rounded-2xl border border-slate-300 bg-slate-50" ref={previewRef} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-900/5" />
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-slate-400 bg-white/95 px-2 py-2 text-xs font-semibold tracking-[0.08em] text-slate-700">
        {showOriginal ? 'ORIGINAL' : 'DECAY'}
      </div>
    </section>
  );
}
