import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, ReceiptStatus } from '../types';

/** Cap retained messages to bound memory under high ingest rates. */
export const MAX_MESSAGES = 2500;

export type MessagesState = {
  items: ChatMessage[];
  ids: Record<string, true>;
  totalReceived: number;
  lastBatchSize: number;
};

const initialState: MessagesState = {
  items: [],
  ids: {},
  totalReceived: 0,
  lastBatchSize: 0,
};

function trimOverflow(state: MessagesState) {
  const overflow = state.items.length - MAX_MESSAGES;
  if (overflow > 0) {
    const removed = state.items.splice(0, overflow);
    for (const message of removed) {
      delete state.ids[message.id];
    }
  }
}

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
          // Allow status / media enrichment on existing ids.
          const existing = state.items.find((m) => m.id === message.id);
          if (existing) {
            if (message.status) existing.status = message.status;
            if (message.mediaUri) existing.mediaUri = message.mediaUri;
            if (message.fromName) existing.fromName = message.fromName;
          }
          continue;
        }
        state.ids[message.id] = true;
        state.items.push({
          status: 'sent',
          ...message,
        });
        accepted += 1;
      }

      if (!accepted) {
        return;
      }

      state.totalReceived += accepted;
      state.lastBatchSize = accepted;
      trimOverflow(state);
    },
    replaceMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.items = [];
      state.ids = {};
      for (const message of action.payload) {
        if (state.ids[message.id]) continue;
        state.ids[message.id] = true;
        state.items.push(message);
      }
      state.totalReceived = state.items.length;
      state.lastBatchSize = state.items.length;
      trimOverflow(state);
    },
    updateMessageStatus(
      state,
      action: PayloadAction<{ messageId: string; status: ReceiptStatus }>,
    ) {
      const message = state.items.find((m) => m.id === action.payload.messageId);
      if (!message) return;
      const order: ReceiptStatus[] = ['pending', 'sent', 'delivered', 'read'];
      const current = order.indexOf(message.status ?? 'sent');
      const next = order.indexOf(action.payload.status);
      if (next >= current) {
        message.status = action.payload.status;
      }
    },
    clearMessages() {
      return initialState;
    },
  },
});

export const { appendMessages, replaceMessages, updateMessageStatus, clearMessages } =
  messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
