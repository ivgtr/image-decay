export type QualityModel = 'fixed' | 'linear' | 'exponential';

export type SpeedPreset = 0.1 | 0.5 | 1 | 2 | 4 | 8 | 16 | 50;

export interface SessionSettings {
  initialQuality: number;
  minQuality: number;
  linearDecay: number;
  exponentialDecay: number;
  tickMs: number;
  batch: number;
  speed: SpeedPreset;
  qualityModel: QualityModel;
}

export type SessionSettingsErrorMap = Partial<Record<keyof SessionSettings, string>>;

export interface WallClockState {
  sessionStartedAtMs: number | null;
  nowMs: number | null;
  elapsedRealMs: number;
}

export interface SimulationState {
  targetGenPerSec: SpeedPreset;
  effectiveGenPerSec: number;
  generationDebt: number;
  appliedGeneration: number;
  elapsedSimMs: number;
}

export interface ProcessingState {
  avgGenerationCostMs: number;
  workerMode: boolean;
  processingWidth: number;
  processingHeight: number;
}

export interface RenderState {
  currentQuality: number;
  fps: number;
  psnr: number | null;
  ssim: number | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  wallClock: WallClockState;
  simulation: SimulationState;
  processing: ProcessingState;
  render: RenderState;
}

export interface UploadState {
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  processingWidth: number;
  processingHeight: number;
  resized: boolean;
}

export const SPEED_PRESETS: SpeedPreset[] = [0.1, 0.5, 1, 2, 4, 8, 16, 50];

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  initialQuality: 0.92,
  minQuality: 0.1,
  linearDecay: 0.002,
  exponentialDecay: 0.995,
  tickMs: 120,
  batch: 1,
  speed: 1,
  qualityModel: 'exponential',
};

export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  wallClock: {
    sessionStartedAtMs: null,
    nowMs: null,
    elapsedRealMs: 0,
  },
  simulation: {
    targetGenPerSec: DEFAULT_SESSION_SETTINGS.speed,
    effectiveGenPerSec: 0,
    generationDebt: 0,
    appliedGeneration: 0,
    elapsedSimMs: 0,
  },
  processing: {
    avgGenerationCostMs: DEFAULT_SESSION_SETTINGS.tickMs,
    workerMode: false,
    processingWidth: 0,
    processingHeight: 0,
  },
  render: {
    currentQuality: DEFAULT_SESSION_SETTINGS.initialQuality,
    fps: 0,
    psnr: null,
    ssim: null,
  },
};
