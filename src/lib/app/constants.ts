import type { SpeedPreset } from '../../types/domain';

export const STORAGE_KEY = 'image-decay:session-settings';
export const MAX_ENCODE_RETRY = 3;
export const METRICS_INTERVAL = 5;
export const WORKER_FALLBACK_NOTICE = 'Worker処理で問題が発生したためメインスレッドへフォールバックしました。';

export const DEFAULT_NOTICE = '画像を選択すると自動で再生が始まります。';
export const SETTINGS_CORRECTED_NOTICE = '設定値に不正な値があったため補正しました。';
export const SETTINGS_LOAD_CORRECTED_NOTICE = '保存済み設定に不正値があったため補正しました。';
export const LOAD_IMAGE_NOTICE = '画像を読み込んでいます...';
export const LOAD_IMAGE_FAILED_NOTICE = '画像の読み込みに失敗しました。別の画像で再試行してください。';
export const DOWNLOAD_IMAGE_FAILED_NOTICE = '画像の保存に失敗しました。再試行してください。';
export const SAMPLE_IMAGE_FAILED_NOTICE = 'サンプル画像の生成に失敗しました。';
export const ENCODE_FAILED_NOTICE = 'JPEG再エンコードに3回失敗したため停止しました。';
export const RESET_NOTICE = '最初のフレームに戻しました。';

export const VIEWER_SPEED_PRESETS: SpeedPreset[] = [0.5, 1, 2, 4, 8, 16];

export const SAMPLE_OPTIONS = [
  { id: 'neon-city', title: 'Neon City' },
  { id: 'portrait-light', title: 'Portrait Light' },
  { id: 'detail-lab', title: 'Detail Lab' },
] as const;

export type SampleId = (typeof SAMPLE_OPTIONS)[number]['id'];
export type ScreenMode = 'landing' | 'viewer';

const warningNoticePattern = /失敗|到達|フォールバック|補正|不正/;

export const shouldShowWarningNotice = (notice: string): boolean => {
  return warningNoticePattern.test(notice);
};
