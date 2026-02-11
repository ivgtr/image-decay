/// <reference lib="webworker" />

import type {
  DegradationWorkerProcessRequest,
  DegradationWorkerRequest,
  DegradationWorkerResponse,
} from './workerProtocol';

let workingCanvas: OffscreenCanvas | null = null;
let workingContext: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let maxRetry = 3;
let messageQueue: Promise<void> = Promise.resolve();

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const postResponse = (response: DegradationWorkerResponse, transfer: Transferable[] = []) => {
  if (transfer.length > 0) {
    self.postMessage(response, transfer);
    return;
  }
  self.postMessage(response);
};

const toErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Worker処理で不明なエラーが発生しました。';
};

const closeBitmap = (bitmap: ImageBitmap) => {
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }
};

const createContext = (target: OffscreenCanvas): OffscreenCanvasRenderingContext2D => {
  const context = target.getContext('2d');
  if (!context) {
    throw new Error('WorkerでCanvas 2Dコンテキストを取得できませんでした。');
  }
  return context;
};

const verifyEncodeSupport = async (target: OffscreenCanvas): Promise<void> => {
  await target.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
};

const initializeCanvas = async (
  source: ImageBitmap,
  nextWidth: number,
  nextHeight: number,
  nextMaxRetry: number,
): Promise<void> => {
  width = nextWidth;
  height = nextHeight;
  maxRetry = nextMaxRetry;
  workingCanvas = new OffscreenCanvas(width, height);
  workingContext = createContext(workingCanvas);
  workingContext.clearRect(0, 0, width, height);
  workingContext.drawImage(source, 0, 0, width, height);
  closeBitmap(source);
  await verifyEncodeSupport(workingCanvas);
};

const reencodeFrameWithRetry = async (quality: number): Promise<boolean> => {
  if (!workingCanvas || !workingContext) {
    return false;
  }

  for (let attempt = 1; attempt <= maxRetry; attempt += 1) {
    let decoded: ImageBitmap | null = null;
    try {
      const blob = await workingCanvas.convertToBlob({ type: 'image/jpeg', quality });
      decoded = await createImageBitmap(blob);
      workingContext.clearRect(0, 0, width, height);
      workingContext.drawImage(decoded, 0, 0, width, height);
      closeBitmap(decoded);
      return true;
    } catch {
      if (decoded) {
        closeBitmap(decoded);
      }
      if (attempt === maxRetry) {
        return false;
      }
      await delay(12 * attempt);
    }
  }

  return false;
};

const handleProcess = async (message: DegradationWorkerProcessRequest): Promise<void> => {
  if (!workingCanvas || !workingContext) {
    postResponse({
      type: 'error',
      message: 'Workerが初期化されていません。',
      requestId: message.requestId,
    });
    return;
  }

  let processed = 0;
  let failed = false;
  let lastQuality: number | null = null;

  for (const quality of message.qualities) {
    const success = await reencodeFrameWithRetry(quality);
    if (!success) {
      failed = true;
      break;
    }
    processed += 1;
    lastQuality = quality;
  }

  let frame: ImageBitmap | null = null;
  if (processed > 0) {
    frame = workingCanvas.transferToImageBitmap();
    // transferToImageBitmap後は描画バッファが差し替わるため、次Tick用に内容を戻す。
    workingContext.clearRect(0, 0, width, height);
    workingContext.drawImage(frame, 0, 0, width, height);
  }
  postResponse(
    {
      type: 'process-result',
      requestId: message.requestId,
      processed,
      failed,
      lastQuality,
      frame,
    },
    frame ? [frame] : [],
  );
};

const handleMessage = async (message: DegradationWorkerRequest): Promise<void> => {
  if (message.type === 'dispose') {
    workingCanvas = null;
    workingContext = null;
    return;
  }

  if (message.type === 'init') {
    await initializeCanvas(message.source, message.width, message.height, message.maxRetry);
    postResponse({ type: 'ready' });
    return;
  }

  await handleProcess(message);
};

self.onmessage = (event: MessageEvent<DegradationWorkerRequest>) => {
  const message = event.data;
  messageQueue = messageQueue
    .then(async () => {
      await handleMessage(message);
    })
    .catch((error) => {
      postResponse({
        type: 'error',
        message: toErrorMessage(error),
        requestId: message.type === 'process' ? message.requestId : undefined,
      });
    });
};

export {};
