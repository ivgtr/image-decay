import { useEffect, useRef } from 'react';
import { useElementSize } from '../hooks/useElementSize';
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
  const { width, height } = useElementSize(wrapperRef, Boolean(originalCanvas && currentCanvas));

  useEffect(() => {
    if (!previewRef.current || !originalCanvas || !currentCanvas || width <= 0 || height <= 0) {
      return;
    }

    const source = showOriginal ? originalCanvas : currentCanvas;
    drawCanvasPreview(previewRef.current, source, width, height);
    previewRef.current.dataset.frameVersion = String(frameVersion);
  }, [currentCanvas, frameVersion, height, originalCanvas, showOriginal, width]);

  if (!originalCanvas || !currentCanvas) {
    return <EmptyState />;
  }

  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden" ref={wrapperRef}>
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
          <canvas className="h-auto max-h-full w-auto max-w-full" ref={previewRef} />
        </div>
      </div>

    </section>
  );
}
