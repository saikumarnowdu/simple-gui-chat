import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from './types';
import type { Presence } from '../types';

export type SessionState = {
  status: ConnectionStatus;
  presence: Presence;
  error: string | null;
  /** Rolling ingest rate shown in the perf HUD. */
  ingestPerSecond: number;
  /** UI flush count in the last second. */
  flushesPerSecond: number;
  stressRunning: boolean;
  stressTargetRate: number;
};

const initialState: SessionState = {
  status: 'disconnected',
  presence: { gaitonde: false, bunty: false },
  error: null,
  ingestPerSecond: 0,
  flushesPerSecond: 0,
  stressRunning: false,
  stressTargetRate: 300,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
    setPresence(state, action: PayloadAction<Presence>) {
      state.presence = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    setPerfStats(
      state,
      action: PayloadAction<{ ingestPerSecond: number; flushesPerSecond: number }>,
    ) {
      state.ingestPerSecond = action.payload.ingestPerSecond;
      state.flushesPerSecond = action.payload.flushesPerSecond;
    },
    setStressRunning(state, action: PayloadAction<boolean>) {
      state.stressRunning = action.payload;
    },
    setStressTargetRate(state, action: PayloadAction<number>) {
      state.stressTargetRate = action.payload;
    },
    resetSession() {
      return initialState;
    },
  },
});

export const {
  setStatus,
  setPresence,
  setError,
  setPerfStats,
  setStressRunning,
  setStressTargetRate,
  resetSession,
} = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
