import { useEffect, useRef, useState } from 'react';

interface CanvasViewportProps {
  originalCanvas: HTMLCanvasElement | null;
  currentCanvas: HTMLCanvasElement | null;
  frameVersion: number;
}

const EmptyState = () => {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-6 text-sm text-slate-300">
      画像をアップロードすると、ここに比較ビューを表示します。
    </div>
  );
};

const drawSplitPreview = (
  canvas: HTMLCanvasElement,
  original: HTMLCanvasElement,
  current: HTMLCanvasElement,
  splitRatio: number,
  containerWidth: number,
): void => {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const sourceWidth = original.width;
  const sourceHeight = original.height;
  if (sourceWidth === 0 || sourceHeight === 0) {
    return;
  }

  const width = Math.max(320, Math.round(containerWidth));
  const height = Math.max(180, Math.round((width * sourceHeight) / sourceWidth));

  canvas.width = width;
  canvas.height = height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#0f172a';
  context.fillRect(0, 0, width, height);

  context.drawImage(original, 0, 0, width, height);

  const splitX = Math.round(width * splitRatio);
  context.save();
  context.beginPath();
  context.rect(0, 0, splitX, height);
  context.clip();
  context.drawImage(current, 0, 0, width, height);
  context.restore();

  context.strokeStyle = '#38bdf8';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(splitX + 0.5, 0);
  context.lineTo(splitX + 0.5, height);
  context.stroke();
};

export function CanvasViewport({ originalCanvas, currentCanvas, frameVersion }: CanvasViewportProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [split, setSplit] = useState<number>(0.5);
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

    drawSplitPreview(previewRef.current, originalCanvas, currentCanvas, split, width);
  }, [currentCanvas, frameVersion, originalCanvas, split, width]);

  if (!originalCanvas || !currentCanvas) {
    return <EmptyState />;
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-3" ref={wrapperRef}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span>Current</span>
        <span>Original</span>
      </div>
      <canvas className="w-full rounded-lg bg-slate-800" ref={previewRef} />
      <label className="block text-sm text-slate-300">
        比較スライダー
        <input
          className="mt-2 w-full accent-sky-400"
          max={100}
          min={0}
          onChange={(event) => setSplit(Number(event.target.value) / 100)}
          step={1}
          type="range"
          value={Math.round(split * 100)}
        />
      </label>
    </section>
  );
}
