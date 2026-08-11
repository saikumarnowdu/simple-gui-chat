# Simple GUI Chat — WebSocket Server

Node.js WebSocket relay for the React Native mobile app.

Replaces the raw TCP socket used by the original Java Swing apps with a browser/mobile-friendly WebSocket endpoint on port **6001**.

## Run

```bash
npm install
npm start
```

## Protocol

Clients send JSON:

```json
{ "type": "join", "role": "gaitonde" }
{ "type": "message", "text": "hello" }
```

Roles: `gaitonde` | `bunty`

Server events: `welcome`, `joined`, `presence`, `message`, `error`.
