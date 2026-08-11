# simple-gui-chat

Simple chat originally built with **Java Swing + Sockets**, now also a **React Native (Expo)** mobile app with rooms, bot, backup/restore, and high-throughput Redux messaging.

## Projects

| Path | Description |
|------|-------------|
| `src/` | Original Java Swing client (`Client.java`) and server (`Server.java`) |
| `mobile/` | React Native Expo app |
| `server/` | Node.js WebSocket server (rooms, typing, receipts, media, bot) |

## Mobile features

1. Message persistence (per-room AsyncStorage)
2. Typing + online presence
3. Media messages (image picker)
4. Multi-user rooms (+ classic Gaitonde/Bunty)
5. Notifications (native + web Notification API)
6. Auth + profiles (name/avatar)
7. Delivery/read receipts
8. Dark mode
9. Backup / restore (JSON export/import)
10. Chat bot (`Bot Lounge`, `@bot`, `/help` `/joke` `/ping`)
11. High-throughput stress mode (200–500 msg/s) with Redux batching

## Run

```bash
# Terminal 1
cd server && npm install && npm start

# Terminal 2
cd mobile && npm install && npm start
```

```bash
cd mobile && npm run perf:stress
```

Physical devices: set `EXPO_PUBLIC_CHAT_HOST` to your machine IP.

## Original Java Swing app

```bash
javac -d out src/chatting/application/*.java
java -cp out:src chatting.application.Server
java -cp out:src chatting.application.Client
```

Server listens on `127.0.0.1:6001`.
