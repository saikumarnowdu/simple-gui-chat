import type { ChatMessage } from '../types';
import { appendMessages } from '../store/messagesSlice';
import { setPerfStats } from '../store/sessionSlice';
import type { AppDispatch } from '../store';

type BatcherOptions = {
  dispatch: AppDispatch;
  /** Max UI store updates per second target (default ~30fps). */
  flushIntervalMs?: number;
  /** Flush early once this many messages are queued. */
  maxBatchSize?: number;
};

/**
 * Coalesces high-frequency message arrivals into Redux batch dispatches.
 * Prevents 200–500 React re-renders/sec by flushing ~every frame.
 */
export class MessageBatcher {
  private queue: ChatMessage[] = [];
  private pendingIds = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly dispatch: AppDispatch;

  private ingestCount = 0;
  private flushCount = 0;
  private statsTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: BatcherOptions) {
    this.dispatch = options.dispatch;
    this.flushIntervalMs = options.flushIntervalMs ?? 32;
    this.maxBatchSize = options.maxBatchSize ?? 250;
  }

  start() {
    this.stopStats();
    this.statsTimer = setInterval(() => {
      this.dispatch(
        setPerfStats({
          ingestPerSecond: this.ingestCount,
          flushesPerSecond: this.flushCount,
        }),
      );
      this.ingestCount = 0;
      this.flushCount = 0;
    }, 1000);
  }

  stop() {
    this.flush();
    this.stopStats();
    this.pendingIds.clear();
  }

  enqueue(message: ChatMessage) {
    if (this.pendingIds.has(message.id)) {
      return;
    }
    this.pendingIds.add(message.id);
    this.queue.push(message);
    this.ingestCount += 1;

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  enqueueMany(messages: ChatMessage[]) {
    for (const message of messages) {
      this.enqueue(message);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.queue.length) {
      return;
    }

    const batch = this.queue;
    this.queue = [];
    for (const message of batch) {
      this.pendingIds.delete(message.id);
    }
    this.flushCount += 1;
    this.dispatch(appendMessages(batch));
  }

  private stopStats() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }
}
