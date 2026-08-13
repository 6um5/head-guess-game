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
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
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

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is missing — AI word generation will fail.');
  }
});
