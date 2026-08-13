import {
  addRoom,
  getRoom,
  hasRoom,
  normalizeRoomCode,
  removeRoom,
  resetRound,
  resetRoomToWaiting,
} from '../store/roomStore.js';
import { saveSession, setRoomHost } from '../store/sessionStore.js';
import { generateUniqueRoomCode } from '../utils/generateRoomCode.js';
import { emitGameState } from '../utils/gameUtils.js';
import { emitRoomUpdated, hasConnectedHost, sanitizeUsername } from '../utils/roomUtils.js';
import { emitGameStateToSocket } from './gameHandlers.js';

const HOST_TRANSFER_GRACE_MS = 10_000;
const EMPTY_ROOM_GRACE_MS = 30_000;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingHostTransfers = new Map();
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingRoomCleanups = new Map();

/**
 * @param {string} roomCode
 */
function clearPendingHostTransfer(roomCode) {
  const timer = pendingHostTransfers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    pendingHostTransfers.delete(roomCode);
  }
}

/**
 * @param {string} roomCode
 */
function clearPendingRoomCleanup(roomCode) {
  const timer = pendingRoomCleanups.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    pendingRoomCleanups.delete(roomCode);
  }
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {import('socket.io').Socket} [preferredSocket]
 */
async function promoteHostIfNeeded(io, roomCode, preferredSocket) {
  if (!hasRoom(roomCode)) {
    return;
  }

  if (await hasConnectedHost(io, roomCode)) {
    return;
  }

  const remaining = await io.in(roomCode).fetchSockets();
  const nextHost =
    preferredSocket && remaining.some((remote) => remote.id === preferredSocket.id)
      ? preferredSocket
      : remaining[0];

  if (!nextHost?.data.session) {
    return;
  }

  setRoomHost(roomCode, nextHost.data.session.userId);
  saveSession(nextHost.data.session);
  nextHost.emit('becameHost', { message: 'أصبحت المضيف الجديد للغرفة.' });
  await emitRoomUpdated(io, roomCode);
  await emitGameState(io, roomCode);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
function scheduleHostTransfer(io, roomCode) {
  clearPendingHostTransfer(roomCode);

  pendingHostTransfers.set(
    roomCode,
    setTimeout(() => {
      pendingHostTransfers.delete(roomCode);
      void promoteHostIfNeeded(io, roomCode);
    }, HOST_TRANSFER_GRACE_MS),
  );
}

/**
 * @param {string} roomCode
 */
function scheduleEmptyRoomCleanup(roomCode) {
  clearPendingRoomCleanup(roomCode);

  pendingRoomCleanups.set(
    roomCode,
    setTimeout(() => {
      pendingRoomCleanups.delete(roomCode);
      if (!hasRoom(roomCode)) {
        return;
      }

      removeRoom(roomCode);
    }, EMPTY_ROOM_GRACE_MS),
  );
}

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

  const remaining = await io.in(previousRoom).fetchSockets();

  if (remaining.length === 0) {
    clearPendingHostTransfer(previousRoom);
    clearPendingRoomCleanup(previousRoom);
    removeRoom(previousRoom);
    return;
  }

  if (transferHost && wasHost) {
    await promoteHostIfNeeded(io, previousRoom);
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

      if (!hasRoom(normalizedCode)) {
        socket.emit('roomError', { message: 'الغرفة غير موجودة. تحقق من الكود.' });
        return;
      }

      const occupants = await io.in(normalizedCode).fetchSockets();
      const room = getRoom(normalizedCode);
      const sameUserAlreadyHost = occupants.some(
        (remote) =>
          remote.data.session?.userId === socket.data.session.userId &&
          remote.data.session?.isHost === true,
      );

      if (room && occupants.length === 0) {
        resetRoomToWaiting(room);
      }

      clearPendingRoomCleanup(normalizedCode);
      clearPendingHostTransfer(normalizedCode);

      const { session } = socket.data;
      session.username = sanitizedUsername;
      session.roomCode = normalizedCode;
      session.points = occupants.length === 0 ? 0 : session.points;
      const shouldBeHost =
        occupants.length === 0 ||
        sameUserAlreadyHost ||
        !(await hasConnectedHost(io, normalizedCode));
      session.isHost = shouldBeHost;
      if (shouldBeHost) {
        setRoomHost(normalizedCode, session.userId);
      }
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

    if (!session?.roomCode) {
      return;
    }

    const roomCode = session.roomCode;
    const wasHost = session.isHost;

    if (hasRoom(roomCode)) {
      await emitRoomUpdated(io, roomCode);
      await emitGameState(io, roomCode);
    }

    const remaining = await io.in(roomCode).fetchSockets();

    if (remaining.length === 0) {
      scheduleEmptyRoomCleanup(roomCode);
      return;
    }

    if (wasHost) {
      scheduleHostTransfer(io, roomCode);
    }
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export async function handleSessionRoomRejoin(io, socket) {
  const { session } = socket.data;

  if (!session?.roomCode) {
    return;
  }

  if (!hasRoom(session.roomCode)) {
    session.roomCode = null;
    session.isHost = false;
    saveSession(session);
    return;
  }

  clearPendingRoomCleanup(session.roomCode);
  clearPendingHostTransfer(session.roomCode);

  await socket.join(session.roomCode);

  if (session.isHost) {
    setRoomHost(session.roomCode, session.userId);
  } else {
    await promoteHostIfNeeded(io, session.roomCode);
  }

  await emitRoomUpdated(io, session.roomCode);
  await emitGameStateToSocket(io, socket);
}
