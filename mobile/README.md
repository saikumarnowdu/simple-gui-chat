# Simple GUI Chat — Mobile

Expo React Native client for the simple two-person chat.

## Scripts

- `npm start` — start Expo
- `npm run android` — open Android
- `npm run ios` — open iOS simulator
- `npm run web` — open in browser
- `npm run typecheck` — TypeScript check
- `npm run perf:stress` — verify 200–500 msg/s Redux ingest + batching

## Roles

- **Gaitonde** — server-side identity (matches Java `Server.java`)
- **Bunty** — client-side identity (matches Java `Client.java`)

Start `../server` first so the WebSocket relay is available on port 6001.

## High-throughput chat

Messages are stored in **Redux Toolkit** and flushed through a **MessageBatcher** (~32ms / max 250) so 200–500 msg/s does not trigger one React render per message.

UI protections:

- memoized `MessageBubble` rows
- isolated `MessageList` subscription (header/input do not re-render on each append)
- FlatList virtualization (`windowSize`, batch render, `removeClippedSubviews`)
- throttled `scrollToEnd`
- capped store (`MAX_MESSAGES = 2500`) to bound memory

In the chat screen, use **Stress 200/s · 300/s · 500/s** and watch the perf HUD (`ingest`, `flushes`, `store`).
