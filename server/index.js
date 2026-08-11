import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

const PORT = Number(process.env.PORT || 6001);
const BOT_ID = 'bot';
const BOT_NAME = 'ChatBot';

/**
 * Multi-user room chat server with typing, receipts, media, and an in-room bot.
 */

/** @typedef {{ id: string, name: string, memberIds: Set<string> }} Room */
/** @typedef {{
 *   ws: WebSocket,
 *   userId: string,
 *   displayName: string,
 *   avatarId: string,
 *   roomId: string | null,
 * }} Client */

/** @type {Map<string, Client>} */
const clientsByWs = new Map();
/** @type {Map<string, Client>} */
const clientsByUserId = new Map();
/** @type {Map<string, Room>} */
const rooms = new Map();

function ensureDefaultRooms() {
  if (!rooms.has('classic')) {
    rooms.set('classic', { id: 'classic', name: 'Classic Duo', memberIds: new Set() });
  }
  if (!rooms.has('general')) {
    rooms.set('general', { id: 'general', name: 'General', memberIds: new Set() });
  }
  if (!rooms.has('bot-lounge')) {
    rooms.set('bot-lounge', { id: 'bot-lounge', name: 'Bot Lounge', memberIds: new Set([BOT_ID]) });
  }
}

ensureDefaultRooms();

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      service: 'simple-gui-chat-server',
      status: 'ok',
      port: PORT,
      features: [
        'rooms',
        'typing',
        'receipts',
        'media',
        'bot',
        'multi-user',
      ],
    }),
  );
});

const wss = new WebSocketServer({ server: httpServer });

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function roomSummary(room) {
  return {
    id: room.id,
    name: room.name,
    memberCount: [...room.memberIds].filter((id) => id !== BOT_ID || room.id === 'bot-lounge').length +
      (room.id === 'bot-lounge' ? 1 : 0),
  };
}

function listRoomsPayload() {
  return {
    type: 'rooms',
    rooms: [...rooms.values()].map(roomSummary),
  };
}

function membersInRoom(roomId) {
  /** @type {Array<{ userId: string, displayName: string, avatarId: string, online: boolean }>} */
  const members = [];
  const room = rooms.get(roomId);
  if (!room) return members;

  for (const userId of room.memberIds) {
    if (userId === BOT_ID) {
      members.push({
        userId: BOT_ID,
        displayName: BOT_NAME,
        avatarId: 'bot',
        online: true,
      });
      continue;
    }
    const client = clientsByUserId.get(userId);
    if (client) {
      members.push({
        userId: client.userId,
        displayName: client.displayName,
        avatarId: client.avatarId,
        online: client.ws.readyState === WebSocket.OPEN,
      });
    }
  }
  return members;
}

function broadcastToRoom(roomId, payload, exceptWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const userId of room.memberIds) {
    if (userId === BOT_ID) continue;
    const client = clientsByUserId.get(userId);
    if (!client || client.ws === exceptWs) continue;
    send(client.ws, payload);
  }
}

function broadcastPresence(roomId) {
  broadcastToRoom(roomId, {
    type: 'presence',
    roomId,
    members: membersInRoom(roomId),
  });
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function botReply(text) {
  const lower = text.toLowerCase().trim();
  if (lower === '/help' || lower.includes('help')) {
    return 'Commands: /help · /joke · /time · /ping · or just chat with me.';
  }
  if (lower === '/joke' || lower.includes('joke')) {
    const jokes = [
      'Why do programmers prefer dark mode? Because light attracts bugs.',
      'I would tell you a UDP joke, but you might not get it.',
      'There are only 10 kinds of people: those who understand binary and those who do not.',
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (lower === '/time' || lower.includes('what time')) {
    return `Server time is ${nowTime()}.`;
  }
  if (lower === '/ping' || lower === 'ping') {
    return 'pong 🏓';
  }
  if (lower.includes('hello') || lower.includes('hi')) {
    return `Hey! I'm ${BOT_NAME}. Try /joke or /help.`;
  }
  return `You said: "${text.slice(0, 120)}". I'm a simple bot — try /help.`;
}

function maybeBotRespond(roomId, incoming) {
  const room = rooms.get(roomId);
  if (!room) return;

  const text = incoming.text || '';
  const addressed =
    roomId === 'bot-lounge' ||
    text.toLowerCase().includes('@bot') ||
    text.trim().startsWith('/') ||
    room.memberIds.has(BOT_ID);

  if (!addressed && roomId !== 'bot-lounge') {
    // Only auto-reply in bot-lounge or when explicitly addressed / commanded.
    if (!text.toLowerCase().includes('@bot') && !text.trim().startsWith('/')) {
      return;
    }
  }

  // Ensure bot is a member so clients see it in presence.
  room.memberIds.add(BOT_ID);

  setTimeout(() => {
    const payload = {
      type: 'message',
      id: randomUUID(),
      roomId,
      from: BOT_ID,
      fromName: BOT_NAME,
      avatarId: 'bot',
      text: botReply(text),
      mediaUri: null,
      time: nowTime(),
      status: 'sent',
    };
    broadcastToRoom(roomId, payload);
    // Also mark delivered for connected members.
    broadcastToRoom(roomId, {
      type: 'receipt',
      roomId,
      messageId: payload.id,
      status: 'delivered',
      by: BOT_ID,
    });
  }, 350 + Math.random() * 400);
}

function leaveRoom(client) {
  if (!client.roomId) return;
  const room = rooms.get(client.roomId);
  const previous = client.roomId;
  if (room) {
    room.memberIds.delete(client.userId);
  }
  client.roomId = null;
  broadcastPresence(previous);
}

wss.on('connection', (ws) => {
  send(ws, {
    type: 'welcome',
    message: 'Authenticate, then join a room. Bot available in Bot Lounge or via @bot / commands.',
    botId: BOT_ID,
  });

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON message' });
      return;
    }

    /** @type {Client | undefined} */
    let client = clientsByWs.get(ws);

    // Legacy join support: map gaitonde/bunty into classic room identities.
    if (data.type === 'join' && (data.role === 'gaitonde' || data.role === 'bunty')) {
      const userId = data.role;
      const displayName = data.role === 'gaitonde' ? 'Gaitonde' : 'Bunty';
      const existing = clientsByUserId.get(userId);
      if (existing && existing.ws !== ws && existing.ws.readyState === WebSocket.OPEN) {
        send(ws, { type: 'error', message: `${displayName} is already connected.` });
        return;
      }
      if (client) {
        leaveRoom(client);
        clientsByUserId.delete(client.userId);
      }
      client = {
        ws,
        userId,
        displayName,
        avatarId: data.role === 'gaitonde' ? '1' : '2',
        roomId: null,
      };
      clientsByWs.set(ws, client);
      clientsByUserId.set(userId, client);

      const room = rooms.get('classic');
      room.memberIds.add(userId);
      client.roomId = 'classic';
      send(ws, {
        type: 'joined',
        role: userId,
        peer: userId === 'gaitonde' ? 'bunty' : 'gaitonde',
        roomId: 'classic',
        user: { userId, displayName, avatarId: client.avatarId },
      });
      send(ws, listRoomsPayload());
      broadcastPresence('classic');
      return;
    }

    if (data.type === 'auth') {
      const displayName =
        typeof data.displayName === 'string' && data.displayName.trim()
          ? data.displayName.trim().slice(0, 32)
          : 'Guest';
      const avatarId = typeof data.avatarId === 'string' ? data.avatarId : '1';
      const userId =
        typeof data.userId === 'string' && data.userId.trim()
          ? data.userId.trim().slice(0, 64)
          : randomUUID();

      const existing = clientsByUserId.get(userId);
      if (existing && existing.ws !== ws) {
        try {
          existing.ws.close();
        } catch {
          // ignore
        }
        clientsByWs.delete(existing.ws);
        clientsByUserId.delete(userId);
      }

      if (client) {
        leaveRoom(client);
        clientsByUserId.delete(client.userId);
      }

      client = { ws, userId, displayName, avatarId, roomId: null };
      clientsByWs.set(ws, client);
      clientsByUserId.set(userId, client);
      send(ws, {
        type: 'authenticated',
        user: { userId, displayName, avatarId },
      });
      send(ws, listRoomsPayload());
      return;
    }

    if (!client) {
      send(ws, { type: 'error', message: 'Authenticate first (type: auth) or legacy join.' });
      return;
    }

    if (data.type === 'list_rooms') {
      send(ws, listRoomsPayload());
      return;
    }

    if (data.type === 'create_room') {
      const name =
        typeof data.name === 'string' && data.name.trim()
          ? data.name.trim().slice(0, 40)
          : `Room ${rooms.size + 1}`;
      const id = randomUUID().slice(0, 8);
      rooms.set(id, { id, name, memberIds: new Set() });
      send(ws, listRoomsPayload());
      for (const other of clientsByUserId.values()) {
        send(other.ws, listRoomsPayload());
      }
      return;
    }

    if (data.type === 'join_room') {
      const roomId = typeof data.roomId === 'string' ? data.roomId : '';
      const room = rooms.get(roomId);
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' });
        return;
      }
      leaveRoom(client);
      room.memberIds.add(client.userId);
      if (roomId === 'bot-lounge') {
        room.memberIds.add(BOT_ID);
      }
      client.roomId = roomId;
      send(ws, {
        type: 'room_joined',
        room: roomSummary(room),
        members: membersInRoom(roomId),
      });
      broadcastPresence(roomId);
      return;
    }

    if (data.type === 'leave_room') {
      leaveRoom(client);
      send(ws, { type: 'room_left' });
      return;
    }

    if (data.type === 'typing') {
      if (!client.roomId) return;
      broadcastToRoom(
        client.roomId,
        {
          type: 'typing',
          roomId: client.roomId,
          userId: client.userId,
          displayName: client.displayName,
          isTyping: Boolean(data.isTyping),
        },
        ws,
      );
      return;
    }

    if (data.type === 'receipt') {
      if (!client.roomId) return;
      const messageId = typeof data.messageId === 'string' ? data.messageId : '';
      const status = data.status === 'read' ? 'read' : 'delivered';
      if (!messageId) return;
      broadcastToRoom(client.roomId, {
        type: 'receipt',
        roomId: client.roomId,
        messageId,
        status,
        by: client.userId,
      });
      return;
    }

    if (data.type === 'message') {
      if (!client.roomId) {
        send(ws, { type: 'error', message: 'Join a room before sending messages' });
        return;
      }

      const text = typeof data.text === 'string' ? data.text.trim() : '';
      const mediaUri = typeof data.mediaUri === 'string' ? data.mediaUri : null;
      if (!text && !mediaUri) return;

      const payload = {
        type: 'message',
        id: typeof data.id === 'string' ? data.id : randomUUID(),
        roomId: client.roomId,
        from: client.userId,
        fromName: client.displayName,
        avatarId: client.avatarId,
        text,
        mediaUri,
        time: nowTime(),
        status: 'sent',
      };

      // Echo to sender as sent, then delivered to peers.
      send(ws, payload);
      broadcastToRoom(client.roomId, { ...payload, status: 'delivered' }, ws);
      send(ws, {
        type: 'receipt',
        roomId: client.roomId,
        messageId: payload.id,
        status: 'delivered',
        by: 'server',
      });

      maybeBotRespond(client.roomId, payload);
      return;
    }

    send(ws, { type: 'error', message: `Unknown message type: ${data.type}` });
  });

  ws.on('close', () => {
    const client = clientsByWs.get(ws);
    if (!client) return;
    leaveRoom(client);
    clientsByWs.delete(ws);
    if (clientsByUserId.get(client.userId)?.ws === ws) {
      clientsByUserId.delete(client.userId);
    }
  });

  ws.on('error', () => {
    // close handler cleans up
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chat server listening on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint: ws://0.0.0.0:${PORT}`);
});
