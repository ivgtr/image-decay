import type { SpeedPreset } from '../../types/domain';

export interface PlaybackHudActionHandlers {
  onPlayPause: () => void;
  onReset: () => void;
  onSlower: () => void;
  onFaster: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
}

export interface PlaybackHudViewState {
  fileName: string;
  hasEnded: boolean;
  isPlaying: boolean;
  progress: number;
  speed: SpeedPreset;
}
