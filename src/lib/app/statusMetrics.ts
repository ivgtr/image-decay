import type { PlaybackState } from '../../types/domain';

export interface StatusMetricItem {
  id: 'generation' | 'quality' | 'elapsed' | 'fps' | 'psnr' | 'ssim';
  label: string;
  value: string;
}

const formatSeconds = (elapsedMs: number): string => {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
};

const formatPsnr = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return `${value.toFixed(2)} dB`;
};

const formatSsim = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }
  return value.toFixed(4);
};

export const buildStatusMetrics = (playback: PlaybackState): StatusMetricItem[] => {
  return [
    { id: 'generation', label: 'Generation', value: `${playback.generation}` },
    { id: 'quality', label: 'Quality', value: playback.currentQuality.toFixed(3) },
    { id: 'elapsed', label: 'Elapsed', value: formatSeconds(playback.elapsedMs) },
    { id: 'fps', label: 'FPS', value: playback.fps.toFixed(1) },
    { id: 'psnr', label: 'PSNR', value: formatPsnr(playback.psnr) },
    { id: 'ssim', label: 'SSIM', value: formatSsim(playback.ssim) },
  ];
};
