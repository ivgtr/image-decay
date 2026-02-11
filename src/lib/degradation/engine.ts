const JPEG_MIME = 'image/jpeg';
const METRICS_MAX_EDGE = 256;
const SSIM_C1 = (0.01 * 255) ** 2;
const SSIM_C2 = (0.03 * 255) ** 2;

export const MAX_IMAGE_EDGE = 2048;

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
};

const get2dContext = (canvas: HTMLCanvasElement, forReadback = false): CanvasRenderingContext2D => {
  const context = canvas.getContext('2d', forReadback ? { willReadFrequently: true } : undefined);
  if (!context) {
    throw new Error('Canvas 2Dコンテキストを取得できませんでした。');
  }
  return context;
};

const loadImageFromBlob = async (blob: Blob): Promise<HTMLImageElement> => {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('画像デコードに失敗しました。'));
      element.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const decodeBlobToBitmap = async (blob: Blob): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob);
    } catch {
      return loadImageFromBlob(blob);
    }
  }

  return loadImageFromBlob(blob);
};

export const decodeFileToCanvasSource = async (
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number; dispose: () => void }> => {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // SafariのフォールバックとしてImage要素でデコードする。
    }
  }

  const image = await loadImageFromBlob(file);
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => {},
  };
};

export const scaleDimensions = (
  width: number,
  height: number,
  maxEdge = MAX_IMAGE_EDGE,
): { width: number; height: number; resized: boolean } => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) {
    return { width, height, resized: false };
  }

  const ratio = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    resized: true,
  };
};

export const drawInitialFrame = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  originalCanvas: HTMLCanvasElement,
  currentCanvas: HTMLCanvasElement,
  maxEdge = MAX_IMAGE_EDGE,
): { width: number; height: number; resized: boolean } => {
  const { width, height, resized } = scaleDimensions(sourceWidth, sourceHeight, maxEdge);

  originalCanvas.width = width;
  originalCanvas.height = height;
  currentCanvas.width = width;
  currentCanvas.height = height;

  const originalCtx = get2dContext(originalCanvas);
  const currentCtx = get2dContext(currentCanvas);

  originalCtx.clearRect(0, 0, width, height);
  currentCtx.clearRect(0, 0, width, height);

  originalCtx.drawImage(source, 0, 0, width, height);
  currentCtx.drawImage(source, 0, 0, width, height);

  return { width, height, resized };
};

export const copyCanvasFrame = (source: HTMLCanvasElement, target: HTMLCanvasElement): void => {
  target.width = source.width;
  target.height = source.height;

  const context = get2dContext(target);
  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(source, 0, 0);
};

export const canvasToJpegBlob = async (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('toBlobがnullを返しました。'));
          return;
        }
        resolve(blob);
      },
      JPEG_MIME,
      quality,
    );
  });
};

export const decodeBlobToCanvas = async (blob: Blob, canvas: HTMLCanvasElement): Promise<void> => {
  const decoded = await decodeBlobToBitmap(blob);
  const context = get2dContext(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded, 0, 0, canvas.width, canvas.height);

  if ('close' in decoded && typeof decoded.close === 'function') {
    decoded.close();
  }
};

export const reencodeFrameWithRetry = async (
  canvas: HTMLCanvasElement,
  quality: number,
  maxRetry = 3,
): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetry; attempt += 1) {
    try {
      const blob = await canvasToJpegBlob(canvas, quality);
      await decodeBlobToCanvas(blob, canvas);
      return true;
    } catch {
      if (attempt === maxRetry) {
        return false;
      }
      await delay(12 * attempt);
    }
  }

  return false;
};

const drawDownsampled = (
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  maxEdge: number,
): ImageData => {
  const { width, height } = scaleDimensions(source.width, source.height, maxEdge);

  target.width = width;
  target.height = height;

  const context = get2dContext(target, true);
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return context.getImageData(0, 0, width, height);
};

export interface QualityMetrics {
  psnr: number;
  ssim: number;
}

export const calculateQualityMetrics = (
  originalCanvas: HTMLCanvasElement,
  currentCanvas: HTMLCanvasElement,
  bufferA: HTMLCanvasElement,
  bufferB: HTMLCanvasElement,
): QualityMetrics => {
  const original = drawDownsampled(originalCanvas, bufferA, METRICS_MAX_EDGE);
  const current = drawDownsampled(currentCanvas, bufferB, METRICS_MAX_EDGE);

  const length = Math.min(original.data.length, current.data.length);
  if (length === 0) {
    return {
      psnr: Number.NaN,
      ssim: Number.NaN,
    };
  }

  let squaredErrorSum = 0;
  let mseCount = 0;
  let grayCount = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (let i = 0; i < length; i += 4) {
    const originalR = original.data[i];
    const originalG = original.data[i + 1];
    const originalB = original.data[i + 2];
    const currentR = current.data[i];
    const currentG = current.data[i + 1];
    const currentB = current.data[i + 2];

    const diffR = originalR - currentR;
    const diffG = originalG - currentG;
    const diffB = originalB - currentB;

    squaredErrorSum += diffR * diffR + diffG * diffG + diffB * diffB;
    mseCount += 3;

    const grayOriginal = 0.299 * originalR + 0.587 * originalG + 0.114 * originalB;
    const grayCurrent = 0.299 * currentR + 0.587 * currentG + 0.114 * currentB;

    sumX += grayOriginal;
    sumY += grayCurrent;
    sumXX += grayOriginal * grayOriginal;
    sumYY += grayCurrent * grayCurrent;
    sumXY += grayOriginal * grayCurrent;
    grayCount += 1;
  }

  let psnr = Number.NaN;
  if (mseCount > 0) {
    const mse = squaredErrorSum / mseCount;
    psnr = mse === 0 ? Number.POSITIVE_INFINITY : 10 * Math.log10((255 * 255) / mse);
  }

  let ssim = Number.NaN;
  if (grayCount > 0) {
    const meanX = sumX / grayCount;
    const meanY = sumY / grayCount;
    const varianceX = Math.max(0, sumXX / grayCount - meanX * meanX);
    const varianceY = Math.max(0, sumYY / grayCount - meanY * meanY);
    const covariance = sumXY / grayCount - meanX * meanY;

    const numerator = (2 * meanX * meanY + SSIM_C1) * (2 * covariance + SSIM_C2);
    const denominator = (meanX * meanX + meanY * meanY + SSIM_C1) * (varianceX + varianceY + SSIM_C2);

    if (denominator !== 0) {
      const rawSsim = numerator / denominator;
      ssim = Math.min(1, Math.max(-1, rawSsim));
    }
  }

  return { psnr, ssim };
};

export const calculatePsnr = (
  originalCanvas: HTMLCanvasElement,
  currentCanvas: HTMLCanvasElement,
  bufferA: HTMLCanvasElement,
  bufferB: HTMLCanvasElement,
): number => {
  return calculateQualityMetrics(originalCanvas, currentCanvas, bufferA, bufferB).psnr;
};
