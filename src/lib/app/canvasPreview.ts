export const drawCanvasPreview = (
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
