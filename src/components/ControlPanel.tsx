import type { ReactNode } from 'react';
import { SETTINGS_LIMITS } from '../lib/degradation/model';
import type { SessionSettings, SessionSettingsErrorMap, SpeedPreset } from '../types/domain';
import { SPEED_PRESETS } from '../types/domain';
import { PauseIcon, PlayIcon, ResetIcon } from './icons/AppIcons';

interface ControlPanelProps {
  settings: SessionSettings;
  errors: SessionSettingsErrorMap;
  onSettingsChange: (next: SessionSettings) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  disablePlay: boolean;
}

const baseInputClass =
  'ui-field';

const fieldClass = (hasError: boolean): string => {
  return `${baseInputClass} ${hasError ? 'ui-field-error' : ''}`.trim();
};

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }
  return <p className="ui-error-text">{message}</p>;
};

type NumericSettingKey = keyof typeof SETTINGS_LIMITS;

interface NumericFieldConfig {
  key: NumericSettingKey;
  className?: string;
}

const numericFieldConfigs: NumericFieldConfig[] = [
  { key: 'initialQuality' },
  { key: 'minQuality' },
  { key: 'linearDecay' },
  { key: 'exponentialDecay' },
  { key: 'tickMs' },
  { key: 'batch' },
];

const qualityModelOptions: SessionSettings['qualityModel'][] = ['fixed', 'linear', 'exponential'];

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

const FieldShell = ({ label, htmlFor, error, className, children }: FieldShellProps) => {
  return (
    <div className={className ? `ui-field-label ${className}` : 'ui-field-label'}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      <ErrorMessage message={error} />
    </div>
  );
};

export function ControlPanel({
  settings,
  errors,
  onSettingsChange,
  isPlaying,
  onPlayPause,
  onReset,
  disablePlay,
}: ControlPanelProps) {
  const update = <K extends keyof SessionSettings>(key: K, value: SessionSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <section className="panel-surface space-y-4 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <button
          className="ui-btn ui-btn-primary ui-btn-caps gap-2"
          disabled={disablePlay}
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="ui-btn ui-btn-secondary ui-btn-caps gap-2"
          onClick={onReset}
          type="button"
        >
          <ResetIcon className="h-4 w-4" />
          Reset
        </button>
      </div>

      <FieldShell error={errors.speed} htmlFor="settings-speed" label="Speed">
        <select
          className={fieldClass(Boolean(errors.speed))}
          id="settings-speed"
          onChange={(event) => update('speed', Number(event.target.value) as SpeedPreset)}
          value={settings.speed}
        >
          {SPEED_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              x{preset}
            </option>
          ))}
        </select>
      </FieldShell>

      <FieldShell error={errors.qualityModel} htmlFor="settings-quality-model" label="Quality Model">
        <select
          className={fieldClass(Boolean(errors.qualityModel))}
          id="settings-quality-model"
          onChange={(event) => update('qualityModel', event.target.value as SessionSettings['qualityModel'])}
          value={settings.qualityModel}
        >
          {qualityModelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </FieldShell>

      <div className="grid grid-cols-2 gap-4">
        {numericFieldConfigs.map(({ key, className }) => {
          const limits = SETTINGS_LIMITS[key];
          const inputId = `settings-${key}`;
          return (
            <FieldShell
              className={className}
              error={errors[key]}
              htmlFor={inputId}
              key={key}
              label={limits.label}
            >
              <input
                className={fieldClass(Boolean(errors[key]))}
                id={inputId}
                max={limits.max}
                min={limits.min}
                onChange={(event) => update(key, event.target.valueAsNumber)}
                step={limits.step}
                type="number"
                value={settings[key]}
              />
            </FieldShell>
          );
        })}
      </div>
    </section>
  );
}
