import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = Number(process.env.PORT || 6001);

/**
 * Simple two-party chat relay.
 * Clients join as "gaitonde" (server role) or "bunty" (client role),
 * mirroring the original Java Swing Server / Client apps.
 */
const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      service: 'simple-gui-chat-server',
      status: 'ok',
      port: PORT,
    }),
  );
});

const wss = new WebSocketServer({ server: httpServer });

/** @type {Map<string, WebSocket>} */
const clients = new Map();

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastPresence() {
  const online = {
    gaitonde: clients.has('gaitonde') && clients.get('gaitonde')?.readyState === WebSocket.OPEN,
    bunty: clients.has('bunty') && clients.get('bunty')?.readyState === WebSocket.OPEN,
  };

  for (const ws of clients.values()) {
    send(ws, { type: 'presence', online });
  }
}

function peerOf(role) {
  return role === 'gaitonde' ? 'bunty' : 'gaitonde';
}

wss.on('connection', (ws) => {
  /** @type {string | null} */
  let role = null;

  send(ws, {
    type: 'welcome',
    message: 'Connected. Join as gaitonde or bunty.',
  });

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON message' });
      return;
    }

    if (data.type === 'join') {
      const nextRole = data.role === 'gaitonde' || data.role === 'bunty' ? data.role : null;
      if (!nextRole) {
        send(ws, { type: 'error', message: 'Role must be gaitonde or bunty' });
        return;
      }

      const existing = clients.get(nextRole);
      if (existing && existing !== ws && existing.readyState === WebSocket.OPEN) {
        send(ws, {
          type: 'error',
          message: `${nextRole} is already connected. Try the other role or reconnect later.`,
        });
        return;
      }

      if (role && clients.get(role) === ws) {
        clients.delete(role);
      }

      role = nextRole;
      clients.set(role, ws);
      send(ws, { type: 'joined', role, peer: peerOf(role) });
      broadcastPresence();
      return;
    }

    if (data.type === 'message') {
      if (!role) {
        send(ws, { type: 'error', message: 'Join with a role before sending messages' });
        return;
      }

      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) {
        return;
      }

      const payload = {
        type: 'message',
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: role,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      };

      // Echo to sender so UI stays in sync, and deliver to peer.
      send(ws, payload);
      const peer = clients.get(peerOf(role));
      if (peer && peer !== ws) {
        send(peer, payload);
      }
      return;
    }

    send(ws, { type: 'error', message: `Unknown message type: ${data.type}` });
  });

  ws.on('close', () => {
    if (role && clients.get(role) === ws) {
      clients.delete(role);
      broadcastPresence();
    }
  });

  ws.on('error', () => {
    // close handler cleans up role mapping
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chat server listening on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint: ws://0.0.0.0:${PORT}`);
});
