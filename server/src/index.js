import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import { handleSessionRoomRejoin, registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerSecretHandlers } from './handlers/secretHandlers.js';
import { sessionMiddleware } from './middleware/sessionMiddleware.js';

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGINS = String(process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

/**
 * @param {string | undefined} origin
 * @returns {boolean}
 */
function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalized = origin.replace(/\/$/, '');
  if (CLIENT_ORIGINS.includes(normalized)) {
    return true;
  }

  try {
    const { hostname } = new URL(normalized);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.onrender.com') ||
      hostname.endsWith('.netlify.app')
    );
  } catch {
    return false;
  }
}

const corsOrigin = (origin, callback) => {
  callback(null, isAllowedOrigin(origin));
};

const app = express();

app.use(cors({ origin: corsOrigin }));
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'head-guess-game-server',
    health: '/health',
  });
});
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

io.use(sessionMiddleware);

io.on('connection', async (socket) => {
  const { session } = socket.data;

  socket.emit('session', {
    sessionId: session.sessionId,
    userId: session.userId,
  });

  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerSecretHandlers(io, socket);
  await handleSessionRoomRejoin(io, socket);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Allowed client origins: ${CLIENT_ORIGINS.join(', ')}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is missing — AI word generation will fail.');
  }
});
