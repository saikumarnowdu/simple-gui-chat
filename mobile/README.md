# Simple GUI Chat — Mobile

Expo React Native client with Redux, rooms, bot, backup/restore, and high-throughput rendering.

## Scripts

- `npm start` — Expo
- `npm run web` — web
- `npm run typecheck` — TypeScript
- `npm run perf:stress` — 200–500 msg/s Redux ingest check

## Flow

1. Create profile (auth)
2. Join a room (Classic Duo / General / Bot Lounge / custom)
3. Chat with typing, receipts, media, notifications
4. Settings: dark mode, bot toggle, notifications, backup/restore

## Bot

- Join **Bot Lounge**, or send `@bot` / `/help` `/joke` `/time` `/ping`
- Local fallback replies if the server is offline

## Backup / restore

Settings → **Backup chat** / **Restore backup** (JSON).

Start `../server` on port 6001 for realtime multi-user chat.
