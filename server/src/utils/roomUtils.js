/**
 * @typedef {import('../types/session.js').Session} Session
 * @typedef {import('../types/player.js').RoomPlayer} RoomPlayer
 */

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @returns {Promise<RoomPlayer[]>}
 */
export async function getRoomPlayers(io, roomCode) {
  const sockets = await io.in(roomCode).fetchSockets();
  const seenUserIds = new Set();
  /** @type {RoomPlayer[]} */
  const players = [];

  for (const remoteSocket of sockets) {
    /** @type {Session | undefined} */
    const session = remoteSocket.data.session;

    if (!session?.username || seenUserIds.has(session.userId)) {
      continue;
    }

    seenUserIds.add(session.userId);
    players.push({
      userId: session.userId,
      username: session.username,
      points: session.points,
      isHost: session.isHost,
    });
  }

  return players;
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @returns {Promise<boolean>}
 */
export async function hasConnectedHost(io, roomCode) {
  const sockets = await io.in(roomCode).fetchSockets();
  return sockets.some((remoteSocket) => remoteSocket.data.session?.isHost === true);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
export async function emitRoomUpdated(io, roomCode) {
  const players = await getRoomPlayers(io, roomCode);

  io.to(roomCode).emit('roomUpdated', {
    roomCode,
    players,
  });
}

/**
 * @param {string | undefined | null} username
 * @returns {string | null}
 */
export function sanitizeUsername(username) {
  if (typeof username !== 'string') {
    return null;
  }

  const trimmed = username.trim();

  if (trimmed.length < 1 || trimmed.length > 24) {
    return null;
  }

  return trimmed;
}
