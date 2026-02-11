import { SETTINGS_LIMITS } from '../lib/degradation/model';
import type { SessionSettings, SessionSettingsErrorMap, SpeedPreset } from '../types/domain';
import { SPEED_PRESETS } from '../types/domain';

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
          className="ui-btn ui-btn-primary ui-btn-caps"
          disabled={disablePlay}
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="ui-btn ui-btn-secondary ui-btn-caps"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>

      <label className="ui-field-label">
        Speed
        <select
          className={fieldClass(Boolean(errors.speed))}
          onChange={(event) => update('speed', Number(event.target.value) as SpeedPreset)}
          value={settings.speed}
        >
          {SPEED_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              x{preset}
            </option>
          ))}
        </select>
        <ErrorMessage message={errors.speed} />
      </label>

      <label className="ui-field-label">
        Quality Model
        <select
          className={fieldClass(Boolean(errors.qualityModel))}
          onChange={(event) => update('qualityModel', event.target.value as SessionSettings['qualityModel'])}
          value={settings.qualityModel}
        >
          <option value="fixed">fixed</option>
          <option value="linear">linear</option>
          <option value="exponential">exponential</option>
        </select>
        <ErrorMessage message={errors.qualityModel} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="ui-field-label">
          Initial Q
          <input
            className={fieldClass(Boolean(errors.initialQuality))}
            max={SETTINGS_LIMITS.initialQuality.max}
            min={SETTINGS_LIMITS.initialQuality.min}
            onChange={(event) => update('initialQuality', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.initialQuality.step}
            type="number"
            value={settings.initialQuality}
          />
          <ErrorMessage message={errors.initialQuality} />
        </label>

        <label className="ui-field-label">
          Min Q
          <input
            className={fieldClass(Boolean(errors.minQuality))}
            max={SETTINGS_LIMITS.minQuality.max}
            min={SETTINGS_LIMITS.minQuality.min}
            onChange={(event) => update('minQuality', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.minQuality.step}
            type="number"
            value={settings.minQuality}
          />
          <ErrorMessage message={errors.minQuality} />
        </label>

        <label className="ui-field-label">
          Linear Decay
          <input
            className={fieldClass(Boolean(errors.linearDecay))}
            max={SETTINGS_LIMITS.linearDecay.max}
            min={SETTINGS_LIMITS.linearDecay.min}
            onChange={(event) => update('linearDecay', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.linearDecay.step}
            type="number"
            value={settings.linearDecay}
          />
          <ErrorMessage message={errors.linearDecay} />
        </label>

        <label className="ui-field-label">
          Exponential Decay
          <input
            className={fieldClass(Boolean(errors.exponentialDecay))}
            max={SETTINGS_LIMITS.exponentialDecay.max}
            min={SETTINGS_LIMITS.exponentialDecay.min}
            onChange={(event) => update('exponentialDecay', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.exponentialDecay.step}
            type="number"
            value={settings.exponentialDecay}
          />
          <ErrorMessage message={errors.exponentialDecay} />
        </label>

        <label className="ui-field-label">
          Tick (ms)
          <input
            className={fieldClass(Boolean(errors.tickMs))}
            max={SETTINGS_LIMITS.tickMs.max}
            min={SETTINGS_LIMITS.tickMs.min}
            onChange={(event) => update('tickMs', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.tickMs.step}
            type="number"
            value={settings.tickMs}
          />
          <ErrorMessage message={errors.tickMs} />
        </label>

        <label className="ui-field-label">
          Batch
          <input
            className={fieldClass(Boolean(errors.batch))}
            max={SETTINGS_LIMITS.batch.max}
            min={SETTINGS_LIMITS.batch.min}
            onChange={(event) => update('batch', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.batch.step}
            type="number"
            value={settings.batch}
          />
          <ErrorMessage message={errors.batch} />
        </label>

        <label className="ui-field-label col-span-2">
          Max Generations
          <input
            className={fieldClass(Boolean(errors.maxGenerations))}
            max={SETTINGS_LIMITS.maxGenerations.max}
            min={SETTINGS_LIMITS.maxGenerations.min}
            onChange={(event) => update('maxGenerations', event.target.valueAsNumber)}
            step={SETTINGS_LIMITS.maxGenerations.step}
            type="number"
            value={settings.maxGenerations}
          />
          <ErrorMessage message={errors.maxGenerations} />
        </label>
      </div>
    </section>
  );
}
