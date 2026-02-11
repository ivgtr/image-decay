export const drawCanvasPreview = (
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  containerWidth: number,
  containerHeight: number,
): { width: number; height: number } => {
  const context = canvas.getContext('2d');
  if (!context || source.width === 0 || source.height === 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  const width = Math.max(1, Math.round(sourceWidth * safeScale));
  const height = Math.max(1, Math.round(sourceHeight * safeScale));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'low';
  }

  context.drawImage(source, 0, 0, width, height);

  return { width, height };
};
