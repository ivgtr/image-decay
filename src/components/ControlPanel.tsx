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
  'mt-1 w-full rounded-md border bg-slate-800 px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500';

const fieldClass = (hasError: boolean): string => {
  return `${baseInputClass} ${hasError ? 'border-rose-500' : 'border-slate-600'}`;
};

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
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
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center gap-2">
        <button
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disablePlay}
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>

      <label className="block text-sm text-slate-300">
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

      <label className="block text-sm text-slate-300">
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

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-300">
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

        <label className="text-sm text-slate-300">
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

        <label className="text-sm text-slate-300">
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

        <label className="text-sm text-slate-300">
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

        <label className="text-sm text-slate-300">
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

        <label className="text-sm text-slate-300">
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

        <label className="col-span-2 text-sm text-slate-300">
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
