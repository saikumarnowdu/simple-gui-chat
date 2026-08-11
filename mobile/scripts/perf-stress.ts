/**
 * High-throughput Redux ingest verification (no UI).
 *
 * Simulates 200 / 300 / 500 messages per second with:
 * 1) Naive per-message dispatch (control / buggy baseline)
 * 2) Batched MessageBatcher dispatch (production path)
 *
 * Run: npm run perf:stress
 */
import { performance } from 'node:perf_hooks';
import { configureStore } from '@reduxjs/toolkit';
import {
  appendMessages,
  clearMessages,
  messagesReducer,
  MAX_MESSAGES,
} from '../src/store/messagesSlice';
import { sessionReducer, setPerfStats } from '../src/store/sessionSlice';
import type { ChatMessage } from '../src/types';
import { MessageBatcher } from '../src/utils/messageBatcher';

function createTestStore() {
  return configureStore({
    reducer: {
      messages: messagesReducer,
      session: sessionReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

function makeMessage(i: number): ChatMessage {
  return {
    id: `m-${i}`,
    from: i % 2 === 0 ? 'gaitonde' : 'bunty',
    text: `msg ${i}`,
    time: '12:00',
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runNaive(rate: number, seconds: number) {
  const store = createTestStore();
  let subscriberCalls = 0;
  store.subscribe(() => {
    subscriberCalls += 1;
    void store.getState().messages.items.length;
  });

  const total = rate * seconds;
  const start = performance.now();
  const memBefore = process.memoryUsage().heapUsed;

  for (let i = 0; i < total; i += 1) {
    store.dispatch(appendMessages([makeMessage(i)]));
    if (i > 0 && i % rate === 0) {
      const elapsed = performance.now() - start;
      const target = (i / rate) * 1000;
      if (target > elapsed) {
        await sleep(target - elapsed);
      }
    }
  }

  const elapsed = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed;
  return {
    mode: 'naive' as const,
    rate,
    seconds,
    total,
    elapsedMs: Math.round(elapsed),
    subscriberCalls,
    stored: store.getState().messages.items.length,
    totalReceived: store.getState().messages.totalReceived,
    heapDeltaMB: Number(((memAfter - memBefore) / (1024 * 1024)).toFixed(2)),
  };
}

async function runBatched(rate: number, seconds: number) {
  const store = createTestStore();
  let subscriberCalls = 0;
  store.subscribe(() => {
    subscriberCalls += 1;
    void store.getState().messages.items.length;
  });

  const batcher = new MessageBatcher({
    dispatch: store.dispatch,
    flushIntervalMs: 32,
    maxBatchSize: 250,
  });
  batcher.start();

  const total = rate * seconds;
  const start = performance.now();
  const memBefore = process.memoryUsage().heapUsed;
  const tickMs = 16;
  const perTick = Math.max(1, Math.round((rate * tickMs) / 1000));
  let sent = 0;

  while (sent < total) {
    const batch: ChatMessage[] = [];
    const count = Math.min(perTick, total - sent);
    for (let i = 0; i < count; i += 1) {
      batch.push(makeMessage(sent + i));
    }
    batcher.enqueueMany(batch);
    sent += count;
    await sleep(tickMs);
  }

  batcher.stop();
  const elapsed = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed;
  const state = store.getState();

  return {
    mode: 'batched' as const,
    rate,
    seconds,
    total,
    elapsedMs: Math.round(elapsed),
    subscriberCalls,
    stored: state.messages.items.length,
    totalReceived: state.messages.totalReceived,
    lastBatchSize: state.messages.lastBatchSize,
    heapDeltaMB: Number(((memAfter - memBefore) / (1024 * 1024)).toFixed(2)),
    maxMessagesCap: MAX_MESSAGES,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const rates = [200, 300, 500];
  const seconds = 2;
  const results = [];

  for (const rate of rates) {
    const batched = await runBatched(rate, seconds);
    results.push(batched);

    if (rate === 200) {
      const naive = await runNaive(rate, seconds);
      results.push(naive);

      assert(
        batched.subscriberCalls < naive.subscriberCalls * 0.25,
        `Expected batched subscriber calls (${batched.subscriberCalls}) to be <25% of naive (${naive.subscriberCalls})`,
      );
      assert(
        batched.stored <= MAX_MESSAGES,
        `Stored messages exceeded cap: ${batched.stored}`,
      );
      assert(
        batched.totalReceived === batched.total,
        `Missing messages: received ${batched.totalReceived} / ${batched.total}`,
      );
    } else {
      assert(
        batched.stored <= MAX_MESSAGES,
        `Stored messages exceeded cap: ${batched.stored}`,
      );
      assert(
        batched.totalReceived === batched.total,
        `Missing messages at ${rate}/s: ${batched.totalReceived} / ${batched.total}`,
      );
      const maxExpectedSubscribers = seconds * 80;
      assert(
        batched.subscriberCalls <= maxExpectedSubscribers,
        `Too many UI notifications at ${rate}/s: ${batched.subscriberCalls} > ${maxExpectedSubscribers}`,
      );
    }
  }

  const store = createTestStore();
  store.dispatch(
    appendMessages(Array.from({ length: MAX_MESSAGES + 500 }, (_, i) => makeMessage(i))),
  );
  assert(
    store.getState().messages.items.length === MAX_MESSAGES,
    'Message cap trim failed',
  );
  store.dispatch(clearMessages());
  store.dispatch(setPerfStats({ ingestPerSecond: 0, flushesPerSecond: 0 }));

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
