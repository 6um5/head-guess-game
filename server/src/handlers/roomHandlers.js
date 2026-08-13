import { addRoom, getRoom, hasRoom, normalizeRoomCode, resetRound } from '../store/roomStore.js';
import { saveSession } from '../store/sessionStore.js';
import { generateUniqueRoomCode } from '../utils/generateRoomCode.js';
import { emitGameState } from '../utils/gameUtils.js';
import { emitRoomUpdated, sanitizeUsername } from '../utils/roomUtils.js';
import { emitGameStateToSocket } from './gameHandlers.js';

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
async function leaveCurrentRoom(socket, io, { transferHost = true } = {}) {
  const { session } = socket.data;

  if (!session.roomCode) {
    return;
  }

  const previousRoom = session.roomCode;
  const wasHost = session.isHost;
  const room = getRoom(previousRoom);

  await socket.leave(previousRoom);
  session.roomCode = null;
  session.isHost = false;
  saveSession(session);

  if (room) {
    if (
      room.fighterA?.userId === session.userId ||
      room.fighterB?.userId === session.userId
    ) {
      if (room.status === 'playing' || room.status === 'round_end') {
        resetRound(room);
      }
    }
  }

  if (transferHost && wasHost) {
    const remaining = await io.in(previousRoom).fetchSockets();
    if (remaining.length > 0) {
      const nextHost = remaining[0];
      nextHost.data.session.isHost = true;
      saveSession(nextHost.data.session);
      nextHost.emit('becameHost', { message: 'أصبحت المضيف الجديد للغرفة.' });
    }
  }

  await emitRoomUpdated(io, previousRoom);
  if (hasRoom(previousRoom)) {
    await emitGameState(io, previousRoom);
  }
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerRoomHandlers(io, socket) {
  socket.on('createRoom', async ({ username }) => {
    try {
      const sanitizedUsername = sanitizeUsername(username);

      if (!sanitizedUsername) {
        socket.emit('roomError', { message: 'أدخل اسماً صالحاً (1–24 حرفاً).' });
        return;
      }

      await leaveCurrentRoom(socket, io);

      const roomCode = generateUniqueRoomCode();
      addRoom(roomCode);

      const { session } = socket.data;
      session.username = sanitizedUsername;
      session.roomCode = roomCode;
      session.isHost = true;
      session.points = 0;
      saveSession(session);

      await socket.join(roomCode);
      await emitRoomUpdated(io, roomCode);
    } catch (error) {
      console.error('createRoom failed:', error);
      socket.emit('roomError', { message: 'تعذر إنشاء الغرفة. حاول مرة أخرى.' });
    }
  });

  socket.on('joinRoom', async ({ roomCode, username }) => {
    try {
      const sanitizedUsername = sanitizeUsername(username);
      const normalizedCode = normalizeRoomCode(roomCode);

      if (!sanitizedUsername) {
        socket.emit('roomError', { message: 'أدخل اسماً صالحاً (1–24 حرفاً).' });
        return;
      }

      if (!normalizedCode) {
        socket.emit('roomError', { message: 'أدخل كود غرفة صالحاً.' });
        return;
      }

      if (!hasRoom(normalizedCode)) {
        socket.emit('roomError', { message: 'الغرفة غير موجودة. تحقق من الكود.' });
        return;
      }

      await leaveCurrentRoom(socket, io);

      const { session } = socket.data;
      session.username = sanitizedUsername;
      session.roomCode = normalizedCode;
      session.isHost = false;
      saveSession(session);

      await socket.join(normalizedCode);
      await emitRoomUpdated(io, normalizedCode);
      await emitGameStateToSocket(io, socket);
    } catch (error) {
      console.error('joinRoom failed:', error);
      socket.emit('roomError', { message: 'تعذر الانضمام للغرفة.' });
    }
  });

  socket.on('leaveRoom', async () => {
    try {
      const { session } = socket.data;

      if (!session?.roomCode) {
        socket.emit('leftRoom', { ok: true });
        return;
      }

      await leaveCurrentRoom(socket, io);
      socket.emit('leftRoom', { ok: true });
    } catch (error) {
      console.error('leaveRoom failed:', error);
      socket.emit('roomError', { message: 'تعذر مغادرة الغرفة.' });
    }
  });

  socket.on('disconnect', async () => {
    const { session } = socket.data;

    if (session?.roomCode) {
      await emitRoomUpdated(io, session.roomCode);
      if (hasRoom(session.roomCode)) {
        await emitGameState(io, session.roomCode);
      }
    }
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export async function handleSessionRoomRejoin(io, socket) {
  const { session } = socket.data;

  if (!session?.roomCode || !hasRoom(session.roomCode)) {
    return;
  }

  await socket.join(session.roomCode);
  await emitRoomUpdated(io, session.roomCode);
  await emitGameStateToSocket(io, socket);
}
