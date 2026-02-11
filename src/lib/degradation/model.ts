import {
  DEFAULT_SESSION_SETTINGS,
  SPEED_PRESETS,
  type SessionSettings,
  type SessionSettingsErrorMap,
  type SpeedPreset,
} from '../../types/domain';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const SETTINGS_LIMITS = {
  initialQuality: { min: 0.1, max: 1, step: 0.01, label: 'Initial Q' },
  minQuality: { min: 0.01, max: 1, step: 0.01, label: 'Min Q' },
  linearDecay: { min: 0, max: 0.1, step: 0.001, label: 'Linear Decay' },
  exponentialDecay: { min: 0.9, max: 1, step: 0.001, label: 'Exponential Decay' },
  tickMs: { min: 10, max: 2000, step: 10, label: 'Tick (ms)' },
  batch: { min: 1, max: 100, step: 1, label: 'Batch' },
  maxGenerations: { min: 1, max: 100000, step: 100, label: 'Max Generations' },
} as const;

type NumericSettingKey = keyof typeof SETTINGS_LIMITS;

const sanitizeNumeric = (
  key: NumericSettingKey,
  value: unknown,
  fallback: number,
  errors: SessionSettingsErrorMap,
): number => {
  const { min, max, label } = SETTINGS_LIMITS[key];

  if (!isFiniteNumber(value)) {
    errors[key] = `${label}は数値で入力してください。`;
    return fallback;
  }

  if (value < min || value > max) {
    errors[key] = `${label}は${min}〜${max}の範囲で入力してください。`;
    return clamp(value, min, max);
  }

  return value;
};

const sanitizeSpeed = (value: unknown, fallback: SpeedPreset, errors: SessionSettingsErrorMap): SpeedPreset => {
  if (isFiniteNumber(value) && SPEED_PRESETS.includes(value as SpeedPreset)) {
    return value as SpeedPreset;
  }

  errors.speed = 'Speedの値が不正なため既定値を適用しました。';
  return fallback;
};

const sanitizeQualityModel = (
  value: unknown,
  fallback: SessionSettings['qualityModel'],
  errors: SessionSettingsErrorMap,
): SessionSettings['qualityModel'] => {
  if (value === 'fixed' || value === 'linear' || value === 'exponential') {
    return value;
  }

  errors.qualityModel = 'Quality Modelの値が不正なため既定値を適用しました。';
  return fallback;
};

export const sanitizeSessionSettings = (
  input: unknown,
): {
  settings: SessionSettings;
  errors: SessionSettingsErrorMap;
} => {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<SessionSettings>) : {};
  const merged: SessionSettings = { ...DEFAULT_SESSION_SETTINGS, ...candidate };
  const errors: SessionSettingsErrorMap = {};

  const settings: SessionSettings = {
    initialQuality: sanitizeNumeric('initialQuality', merged.initialQuality, DEFAULT_SESSION_SETTINGS.initialQuality, errors),
    minQuality: sanitizeNumeric('minQuality', merged.minQuality, DEFAULT_SESSION_SETTINGS.minQuality, errors),
    linearDecay: sanitizeNumeric('linearDecay', merged.linearDecay, DEFAULT_SESSION_SETTINGS.linearDecay, errors),
    exponentialDecay: sanitizeNumeric(
      'exponentialDecay',
      merged.exponentialDecay,
      DEFAULT_SESSION_SETTINGS.exponentialDecay,
      errors,
    ),
    tickMs: sanitizeNumeric('tickMs', merged.tickMs, DEFAULT_SESSION_SETTINGS.tickMs, errors),
    batch: Math.round(sanitizeNumeric('batch', merged.batch, DEFAULT_SESSION_SETTINGS.batch, errors)),
    maxGenerations: Math.round(
      sanitizeNumeric('maxGenerations', merged.maxGenerations, DEFAULT_SESSION_SETTINGS.maxGenerations, errors),
    ),
    speed: sanitizeSpeed(merged.speed, DEFAULT_SESSION_SETTINGS.speed, errors),
    qualityModel: sanitizeQualityModel(merged.qualityModel, DEFAULT_SESSION_SETTINGS.qualityModel, errors),
  };

  if (settings.minQuality > settings.initialQuality) {
    settings.minQuality = settings.initialQuality;
    errors.minQuality = 'Min QはInitial Q以下にしてください。';
  }

  return { settings, errors };
};

export const computeQuality = (settings: SessionSettings, generation: number): number => {
  const { initialQuality, minQuality, linearDecay, exponentialDecay, qualityModel } = settings;

  if (qualityModel === 'fixed') {
    return clamp(initialQuality, minQuality, 1);
  }

  if (qualityModel === 'linear') {
    return clamp(initialQuality - linearDecay * generation, minQuality, 1);
  }

  return clamp(initialQuality * exponentialDecay ** generation, minQuality, 1);
};

export const validateImageFile = (file: File): string | null => {
  if (!SUPPORTED_TYPES.has(file.type)) {
    return '対応形式は JPEG / PNG / WebP / GIF です。';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'ファイルサイズは10MB以下にしてください。';
  }

  return null;
};
