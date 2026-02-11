import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { STORAGE_KEY } from '../lib/app/constants';
import { sanitizeSessionSettings } from '../lib/degradation/model';
import type { SessionSettings } from '../types/domain';

interface LoadedSettings {
  settings: SessionSettings;
  hasError: boolean;
}

const loadSessionSettings = (): LoadedSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitized = sanitizeSessionSettings(null);
      return { settings: sanitized.settings, hasError: false };
    }
    const sanitized = sanitizeSessionSettings(JSON.parse(raw));
    return { settings: sanitized.settings, hasError: Object.keys(sanitized.errors).length > 0 };
  } catch {
    const sanitized = sanitizeSessionSettings(null);
    return { settings: sanitized.settings, hasError: true };
  }
};

export interface UseSessionSettingsResult {
  settings: SessionSettings;
  settingsRef: MutableRefObject<SessionSettings>;
  hasLoadError: boolean;
  mergeSettings: (partial: Partial<SessionSettings>) => boolean;
}

export const useSessionSettings = (): UseSessionSettingsResult => {
  const loadedRef = useRef<LoadedSettings>(loadSessionSettings());
  const [settings, setSettings] = useState<SessionSettings>(() => loadedRef.current.settings);
  const settingsRef = useRef<SessionSettings>(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const mergeSettings = useCallback((partial: Partial<SessionSettings>): boolean => {
    const sanitized = sanitizeSessionSettings({ ...settingsRef.current, ...partial });
    setSettings(sanitized.settings);
    return Object.keys(sanitized.errors).length > 0;
  }, []);

  return {
    settings,
    settingsRef,
    hasLoadError: loadedRef.current.hasError,
    mergeSettings,
  };
};
