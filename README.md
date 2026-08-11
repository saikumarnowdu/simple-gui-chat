# simple-gui-chat

Simple two-person chat, originally built with **Java Swing + Sockets**, now also available as a **React Native (Expo)** mobile app.

## Projects

| Path | Description |
|------|-------------|
| `src/` | Original Java Swing client (`Client.java`) and server (`Server.java`) |
| `mobile/` | React Native Expo app with the same WhatsApp-style chat UI |
| `server/` | Node.js WebSocket relay used by the mobile app |

## Mobile app (React Native)

### Prerequisites

- Node.js 18+
- Expo Go on a phone, or an Android/iOS emulator
- Chat server running locally (see below)

### Start the chat server

```bash
cd server
npm install
npm start
```

The WebSocket server listens on port **6001** (same port as the Java socket server).

### Start the Expo app

```bash
cd mobile
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

### How to chat

1. Launch the app and choose **Gaitonde** (server role) or **Bunty** (client role).
2. Open a second session (another device, emulator, or browser tab) and pick the other role.
3. Send messages — they are relayed through the WebSocket server.

### Connecting a physical device

Set the host machine IP before starting Expo:

```bash
export EXPO_PUBLIC_CHAT_HOST=192.168.1.10
cd mobile && npm start
```

Android emulator uses `10.0.2.2` automatically; iOS simulator and web use `localhost`.

## Original Java Swing app

```bash
# Terminal 1
javac -d out src/chatting/application/*.java
java -cp out:src chatting.application.Server

# Terminal 2
java -cp out:src chatting.application.Client
```

Uses `javax.swing`, sockets, and threads. Server listens on `127.0.0.1:6001`.

## Screenshot

<img width="781" alt="chat" src="https://github.com/saikumarnowdu/simple-gui-chat/assets/40161529/a59a6ebf-188c-41c3-bd5e-6c5a43a1104f">
