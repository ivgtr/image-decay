import type {
  DegradationWorkerProcessResponse,
  DegradationWorkerRequest,
  DegradationWorkerResponse,
} from './workerProtocol';

interface PendingProcess {
  resolve: (value: DegradationWorkerProcessResponse) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
}

const INIT_TIMEOUT_MS = 2000;
const PROCESS_TIMEOUT_MS = 10000;

const createTimeoutError = (message: string): Error => {
  return new Error(message);
};

export const canUseOffscreenWorker = (): boolean => {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
};

export class DegradationWorkerClient {
  private worker: Worker;

  private nextRequestId = 1;

  private ready = false;

  private disposed = false;

  private initResolver: ((ready: boolean) => void) | null = null;

  private initTimeoutId: number | null = null;

  private pendingProcesses = new Map<number, PendingProcess>();

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = (event: MessageEvent<DegradationWorkerResponse>) => {
      this.handleMessage(event.data);
    };
    this.worker.onerror = () => {
      this.ready = false;
      if (this.initTimeoutId !== null) {
        window.clearTimeout(this.initTimeoutId);
        this.initTimeoutId = null;
      }
      if (this.initResolver) {
        this.initResolver(false);
        this.initResolver = null;
      }
      this.failAllPending('Workerが停止したためメインスレッドへフォールバックします。');
    };
  }

  async init(width: number, height: number, source: ImageBitmap, maxRetry: number): Promise<boolean> {
    if (this.disposed) {
      return false;
    }

    this.ready = false;
    if (this.initResolver) {
      this.initResolver(false);
      this.initResolver = null;
    }
    if (this.initTimeoutId !== null) {
      window.clearTimeout(this.initTimeoutId);
      this.initTimeoutId = null;
    }

    const request: DegradationWorkerRequest = {
      type: 'init',
      width,
      height,
      source,
      maxRetry,
    };

    this.worker.postMessage(request, [source]);

    return new Promise<boolean>((resolve) => {
      this.initResolver = resolve;
      this.initTimeoutId = window.setTimeout(() => {
        if (!this.initResolver) {
          return;
        }
        this.initResolver(false);
        this.initResolver = null;
      }, INIT_TIMEOUT_MS);
    });
  }

  async process(qualities: number[]): Promise<DegradationWorkerProcessResponse> {
    if (this.disposed || !this.ready) {
      throw new Error('Workerが利用できません。');
    }

    const requestId = this.nextRequestId;
    this.nextRequestId += 1;

    const request: DegradationWorkerRequest = {
      type: 'process',
      requestId,
      qualities,
    };

    return new Promise<DegradationWorkerProcessResponse>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pendingProcesses.delete(requestId);
        reject(createTimeoutError('Worker応答がタイムアウトしました。'));
      }, PROCESS_TIMEOUT_MS);

      this.pendingProcesses.set(requestId, { resolve, reject, timeoutId });
      this.worker.postMessage(request);
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.ready = false;
    this.failAllPending('Workerを破棄しました。');
    try {
      this.worker.postMessage({ type: 'dispose' } satisfies DegradationWorkerRequest);
    } catch {
      // no-op
    }
    this.worker.terminate();
  }

  private handleMessage(message: DegradationWorkerResponse): void {
    if (message.type === 'ready') {
      this.ready = true;
      if (this.initTimeoutId !== null) {
        window.clearTimeout(this.initTimeoutId);
        this.initTimeoutId = null;
      }
      if (this.initResolver) {
        this.initResolver(true);
        this.initResolver = null;
      }
      return;
    }

    if (message.type === 'process-result') {
      const pending = this.pendingProcesses.get(message.requestId);
      if (!pending) {
        if (message.frame && typeof message.frame.close === 'function') {
          message.frame.close();
        }
        return;
      }
      this.pendingProcesses.delete(message.requestId);
      window.clearTimeout(pending.timeoutId);
      pending.resolve(message);
      return;
    }

    if (message.requestId !== undefined) {
      const pending = this.pendingProcesses.get(message.requestId);
      if (pending) {
        this.pendingProcesses.delete(message.requestId);
        window.clearTimeout(pending.timeoutId);
        pending.reject(new Error(message.message));
      }
      return;
    }

    if (this.initTimeoutId !== null) {
      window.clearTimeout(this.initTimeoutId);
      this.initTimeoutId = null;
    }
    this.ready = false;
    if (this.initResolver) {
      this.initResolver(false);
      this.initResolver = null;
    }
    this.failAllPending(message.message);
  }

  private failAllPending(message: string): void {
    for (const [, pending] of this.pendingProcesses) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(new Error(message));
    }
    this.pendingProcesses.clear();
  }
}

export const createDegradationWorkerClient = (): DegradationWorkerClient | null => {
  if (!canUseOffscreenWorker()) {
    return null;
  }

  try {
    const worker = new Worker(new URL('./degradation.worker.ts', import.meta.url), { type: 'module' });
    return new DegradationWorkerClient(worker);
  } catch {
    return null;
  }
};
