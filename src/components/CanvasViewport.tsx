import { useEffect, useRef, useState } from 'react';

interface CanvasViewportProps {
  originalCanvas: HTMLCanvasElement | null;
  currentCanvas: HTMLCanvasElement | null;
  frameVersion: number;
  showOriginal: boolean;
}

const EmptyState = () => {
  return (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-400 bg-slate-100/70 p-6 text-sm text-slate-600">
      No Image
    </div>
  );
};

const drawPreview = (
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  containerWidth: number,
): { width: number; height: number } => {
  const context = canvas.getContext('2d');
  if (!context || source.width === 0 || source.height === 0) {
    return { width: 0, height: 0 };
  }

  const sourceWidth = source.width;
  const sourceHeight = source.height;

  const width = Math.max(320, Math.round(containerWidth));
  const height = Math.max(180, Math.round((width * sourceHeight) / sourceWidth));

  canvas.width = width;
  canvas.height = height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return { width, height };
};

export function CanvasViewport({ originalCanvas, currentCanvas, frameVersion, showOriginal }: CanvasViewportProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!wrapperRef.current || !originalCanvas || !currentCanvas) {
      setWidth(0);
      return;
    }

    const element = wrapperRef.current;
    const updateWidth = () => {
      setWidth(element.clientWidth);
    };

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    updateWidth();

    return () => {
      observer.disconnect();
    };
  }, [currentCanvas, originalCanvas]);

  useEffect(() => {
    if (!previewRef.current || !originalCanvas || !currentCanvas || width <= 0) {
      return;
    }

    const source = showOriginal ? originalCanvas : currentCanvas;
    drawPreview(previewRef.current, source, width);
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
