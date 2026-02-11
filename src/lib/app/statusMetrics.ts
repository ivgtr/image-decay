import type { PlaybackState } from '../../types/domain';

export interface StatusMetricItem {
  id: 'generation' | 'quality' | 'fps' | 'psnr' | 'ssim';
  label: string;
  value: string;
}

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
    { id: 'generation', label: 'Generation', value: `${playback.simulation.appliedGeneration}` },
    { id: 'quality', label: 'Quality', value: playback.render.currentQuality.toFixed(3) },
    { id: 'fps', label: 'FPS', value: playback.render.fps.toFixed(1) },
    { id: 'psnr', label: 'PSNR', value: formatPsnr(playback.render.psnr) },
    { id: 'ssim', label: 'SSIM', value: formatSsim(playback.render.ssim) },
  ];
};
