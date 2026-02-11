export interface DegradationWorkerInitRequest {
  type: 'init';
  width: number;
  height: number;
  source: ImageBitmap;
  maxRetry: number;
}

export interface DegradationWorkerProcessRequest {
  type: 'process';
  requestId: number;
  qualities: number[];
}

export interface DegradationWorkerDisposeRequest {
  type: 'dispose';
}

export type DegradationWorkerRequest =
  | DegradationWorkerInitRequest
  | DegradationWorkerProcessRequest
  | DegradationWorkerDisposeRequest;

export interface DegradationWorkerReadyResponse {
  type: 'ready';
}

export interface DegradationWorkerProcessResponse {
  type: 'process-result';
  requestId: number;
  processed: number;
  failed: boolean;
  lastQuality: number | null;
  frame: ImageBitmap | null;
}

export interface DegradationWorkerErrorResponse {
  type: 'error';
  message: string;
  requestId?: number;
}

export type DegradationWorkerResponse =
  | DegradationWorkerReadyResponse
  | DegradationWorkerProcessResponse
  | DegradationWorkerErrorResponse;
