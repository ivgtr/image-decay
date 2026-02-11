import type { SpeedPreset } from '../../types/domain';

export interface PlaybackHudActionHandlers {
  onPlayPause: () => void;
  onReset: () => void;
  onSlower: () => void;
  onFaster: () => void;
  onCompareToggle: () => void;
}

export interface PlaybackHudViewState {
  fileName: string;
  hasEnded: boolean;
  isPlaying: boolean;
  showOriginal: boolean;
  progress?: number;
  speed: SpeedPreset;
}
