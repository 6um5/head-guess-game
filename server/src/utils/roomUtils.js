import { ensureMembers, findMemberByUserId, getRoom } from '../store/roomStore.js';

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
  const room = getRoom(roomCode);
  const seenUserIds = new Set();
  /** @type {RoomPlayer[]} */
  const players = [];

  for (const remoteSocket of sockets) {
    /** @type {Session | undefined} */
    const session = remoteSocket.data.session;

    if (!session?.username || seenUserIds.has(session.userId)) {
      continue;
    }

    const member = room ? findMemberByUserId(room, session.userId) : null;

    seenUserIds.add(session.userId);
    players.push({
      userId: session.userId,
      username: session.username,
      points: session.points,
      roundWins: member?.roundWins ?? 0,
      isHost: session.isHost,
    });
  }

  return players;
}

/**
 * Ranks everyone the room has ever seen, including players who stepped away.
 * @param {import('../types/room.js').Room | null | undefined} room
 * @param {RoomPlayer[]} players
 */
export function buildLeaderboard(room, players) {
  const onlineIds = new Set(players.map((player) => player.userId));
  /** @type {Map<string, { userId: string, username: string, points: number, roundWins: number, isHost: boolean, online: boolean }>} */
  const entries = new Map();

  if (room) {
    for (const member of Object.values(ensureMembers(room))) {
      entries.set(member.userId, {
        userId: member.userId,
        username: member.username,
        points: member.points ?? 0,
        roundWins: member.roundWins ?? 0,
        isHost: room.hostUserId === member.userId,
        online: onlineIds.has(member.userId),
      });
    }
  }

  for (const player of players) {
    const existing = entries.get(player.userId);
    entries.set(player.userId, {
      userId: player.userId,
      username: player.username,
      points: player.points ?? existing?.points ?? 0,
      roundWins: player.roundWins ?? existing?.roundWins ?? 0,
      isHost: player.isHost,
      online: true,
    });
  }

  return [...entries.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.roundWins - a.roundWins ||
      Number(b.online) - Number(a.online) ||
      a.username.localeCompare(b.username, 'ar'),
  );
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
  const room = getRoom(roomCode);

  io.to(roomCode).emit('roomUpdated', {
    roomCode,
    players,
    leaderboard: buildLeaderboard(room, players),
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
