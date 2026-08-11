import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../types';

/** Cap retained messages to bound memory under high ingest rates. */
export const MAX_MESSAGES = 2500;

export type MessagesState = {
  /** Chronological message list (oldest → newest). */
  items: ChatMessage[];
  /** O(1) dedupe of ids currently retained in `items`. */
  ids: Record<string, true>;
  /** Total messages ever accepted this session (including trimmed). */
  totalReceived: number;
  /** Messages accepted in the latest flush batch. */
  lastBatchSize: number;
};

const initialState: MessagesState = {
  items: [],
  ids: {},
  totalReceived: 0,
  lastBatchSize: 0,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    appendMessages(state, action: PayloadAction<ChatMessage[]>) {
      const incoming = action.payload;
      if (!incoming.length) {
        return;
      }

      let accepted = 0;
      for (const message of incoming) {
        if (state.ids[message.id]) {
          continue;
        }
        state.ids[message.id] = true;
        state.items.push(message);
        accepted += 1;
      }

      if (!accepted) {
        return;
      }

      state.totalReceived += accepted;
      state.lastBatchSize = accepted;

      const overflow = state.items.length - MAX_MESSAGES;
      if (overflow > 0) {
        const removed = state.items.splice(0, overflow);
        for (const message of removed) {
          delete state.ids[message.id];
        }
      }
    },
    clearMessages() {
      return initialState;
    },
  },
});

export const { appendMessages, clearMessages } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
