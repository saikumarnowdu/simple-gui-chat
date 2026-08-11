import { configureStore } from '@reduxjs/toolkit';
import { messagesReducer } from './messagesSlice';
import { sessionReducer } from './sessionSlice';

export const store = configureStore({
  reducer: {
    messages: messagesReducer,
    session: sessionReducer,
  },
  // High-throughput chat: skip serializable/immutable checks in production paths.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
