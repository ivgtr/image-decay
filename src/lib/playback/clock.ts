import type { WallClockState } from '../../types/domain';

export const createWallClockState = (startedAtMs: number | null): WallClockState => {
  if (startedAtMs === null) {
    return {
      sessionStartedAtMs: null,
      nowMs: null,
      elapsedRealMs: 0,
    };
  }

  return {
    sessionStartedAtMs: startedAtMs,
    nowMs: startedAtMs,
    elapsedRealMs: 0,
  };
};

export const advanceWallClock = (state: WallClockState, nowMs: number): WallClockState => {
  if (state.sessionStartedAtMs === null) {
    return state;
  }

  return {
    ...state,
    nowMs,
    elapsedRealMs: Math.max(0, nowMs - state.sessionStartedAtMs),
  };
};
