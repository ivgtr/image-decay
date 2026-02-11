export type QualityModel = 'fixed' | 'linear' | 'exponential';

export type SpeedPreset = 0.1 | 0.5 | 1 | 2 | 4 | 8 | 16 | 50;

export interface SessionSettings {
  initialQuality: number;
  minQuality: number;
  linearDecay: number;
  exponentialDecay: number;
  tickMs: number;
  batch: number;
  maxGenerations: number;
  speed: SpeedPreset;
  qualityModel: QualityModel;
}

export type SessionSettingsErrorMap = Partial<Record<keyof SessionSettings, string>>;

export interface PlaybackState {
  isPlaying: boolean;
  generation: number;
  elapsedMs: number;
  currentQuality: number;
  fps: number;
  psnr: number | null;
  ssim: number | null;
}

export interface UploadState {
  fileName: string;
  width: number;
  height: number;
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
  maxGenerations: 2000,
  speed: 1,
  qualityModel: 'exponential',
};

export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  generation: 0,
  elapsedMs: 0,
  currentQuality: DEFAULT_SESSION_SETTINGS.initialQuality,
  fps: 0,
  psnr: null,
  ssim: null,
};
