import {
  addRoom,
  findMemberByUsername,
  findMemberByUserId,
  getRoom,
  hasRoom,
  normalizeRoomCode,
  removeMemberByUserId,
  removeRoom,
  upsertMember,
} from '../store/roomStore.js';
import { schedulePersist } from '../store/persist.js';
import { saveSession, setRoomHost } from '../store/sessionStore.js';
import { generateUniqueRoomCode } from '../utils/generateRoomCode.js';
import { emitGameState } from '../utils/gameUtils.js';
import { emitRoomUpdated, hasConnectedHost, sanitizeUsername } from '../utils/roomUtils.js';
import { emitGameStateToSocket } from './gameHandlers.js';

const HOST_TRANSFER_GRACE_MS = 45_000;
const EMPTY_ROOM_GRACE_MS = 6 * 60 * 60 * 1000;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingHostTransfers = new Map();
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingRoomCleanups = new Map();

/**
 * @param {import('socket.io').Socket} socket
 */
function emitSession(socket) {
  const { session } = socket.data;
  if (!session) return;
  socket.emit('session', {
    sessionId: session.sessionId,
    userId: session.userId,
  });
}

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
 * @param {import('../types/room.js').Room} room
 * @param {import('../types/session.js').Session} session
 */
function syncMember(room, session) {
  upsertMember(room, {
    userId: session.userId,
    username: session.username ?? 'لاعب',
    points: session.points,
    isHost: session.isHost,
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @returns {Promise<Set<string>>}
 */
async function getConnectedUserIds(io, roomCode) {
  const sockets = await io.in(roomCode).fetchSockets();
  return new Set(
    sockets
      .map((remote) => remote.data.session?.userId)
      .filter((userId) => typeof userId === 'string'),
  );
}

/**
 * Restore a returning player by the same username, including points and identity.
 * @param {import('../types/room.js').Room} room
 * @param {import('../types/session.js').Session} session
 * @param {string} username
 * @param {Set<string>} connectedUserIds
 */
function restorePlayerIdentity(room, session, username, connectedUserIds) {
  const byName = findMemberByUsername(room, username);
  const byId = findMemberByUserId(room, session.userId);

  if (byName && connectedUserIds.has(byName.userId) && byName.userId !== session.userId) {
    return { ok: false, reason: 'name_taken' };
  }

  const member = byName ?? byId;
  if (member) {
    session.userId = member.userId;
    session.points = member.points;
  }

  session.username = username;
  session.roomCode = room.code;

  if (!room.hostUserId) {
    room.hostUserId = session.userId;
  }
  session.isHost = room.hostUserId === session.userId;
  syncMember(room, session);
  return { ok: true };
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {import('socket.io').Socket} [preferredSocket]
 */
async function promoteHostIfNeeded(io, roomCode, preferredSocket) {
  const room = getRoom(roomCode);
  if (!room) {
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

  room.hostUserId = nextHost.data.session.userId;
  setRoomHost(roomCode, nextHost.data.session.userId);
  syncMember(room, nextHost.data.session);
  saveSession(nextHost.data.session);
  nextHost.emit('becameHost', { message: 'أصبحت المضيف الجديد للغرفة.' });
  await emitRoomUpdated(io, roomCode);
  await emitGameState(io, roomCode);
  schedulePersist();
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
      schedulePersist();
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

  if (room) {
    syncMember(room, {
      ...session,
      isHost: wasHost,
    });
  }

  session.roomCode = null;
  session.isHost = false;
  saveSession(session);

  const remaining = await io.in(previousRoom).fetchSockets();

  if (remaining.length === 0) {
    if (room && wasHost) {
      room.hostUserId = session.userId;
    }
    scheduleEmptyRoomCleanup(previousRoom);
    schedulePersist();
    return;
  }

  if (transferHost && wasHost) {
    await promoteHostIfNeeded(io, previousRoom);
  }

  await emitRoomUpdated(io, previousRoom);
  if (hasRoom(previousRoom)) {
    await emitGameState(io, previousRoom);
  }
  schedulePersist();
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {string} roomCode
 * @param {string} username
 */
async function enterRoom(io, socket, roomCode, username) {
  const room = getRoom(roomCode);
  if (!room) {
    return false;
  }

  clearPendingRoomCleanup(roomCode);
  clearPendingHostTransfer(roomCode);

  const connectedUserIds = await getConnectedUserIds(io, roomCode);
  const restored = restorePlayerIdentity(
    room,
    socket.data.session,
    username,
    connectedUserIds,
  );

  if (!restored.ok) {
    socket.emit('roomError', {
      message: 'هذا الاسم مستخدم حالياً في الغرفة. استخدم نفس حسابك أو اسماً آخر.',
    });
    return false;
  }

  saveSession(socket.data.session);
  emitSession(socket);
  await socket.join(roomCode);
  await emitRoomUpdated(io, roomCode);
  await emitGameStateToSocket(io, socket);
  schedulePersist();
  return true;
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
      const room = getRoom(roomCode);

      const { session } = socket.data;
      session.username = sanitizedUsername;
      session.roomCode = roomCode;
      session.isHost = true;
      session.points = 0;
      if (room) {
        room.hostUserId = session.userId;
        syncMember(room, session);
      }
      saveSession(session);

      await socket.join(roomCode);
      emitSession(socket);
      await emitRoomUpdated(io, roomCode);
      schedulePersist();
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

      const { session } = socket.data;
      if (session.roomCode && session.roomCode !== normalizedCode) {
        await leaveCurrentRoom(socket, io);
      }

      if (!hasRoom(normalizedCode)) {
        socket.emit('roomError', { message: 'الغرفة غير موجودة. تحقق من الكود.' });
        return;
      }

      await enterRoom(io, socket, normalizedCode, sanitizedUsername);
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
    const room = getRoom(roomCode);

    if (room) {
      syncMember(room, session);
    }

    if (hasRoom(roomCode)) {
      await emitRoomUpdated(io, roomCode);
      await emitGameState(io, roomCode);
    }

    const remaining = await io.in(roomCode).fetchSockets();

    if (remaining.length === 0) {
      scheduleEmptyRoomCleanup(roomCode);
      schedulePersist();
      return;
    }

    if (wasHost) {
      scheduleHostTransfer(io, roomCode);
    }
    schedulePersist();
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

  const username = sanitizeUsername(session.username);
  if (!username) {
    return;
  }

  await enterRoom(io, socket, session.roomCode, username);
}
