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

  return sockets
    .map((remoteSocket) => {
      /** @type {Session | undefined} */
      const session = remoteSocket.data.session;

      if (!session?.username) {
        return null;
      }

      return {
        userId: session.userId,
        username: session.username,
        points: session.points,
        isHost: session.isHost,
      };
    })
    .filter((player) => player !== null);
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
