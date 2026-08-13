/** @typedef {import('../types/room.js').Room} Room */
/** @typedef {import('../types/room.js').HintState} HintState */

/** @type {Map<string, Room>} */
const rooms = new Map();

export function getAllRooms() {
  return rooms;
}

/**
 * @returns {HintState}
 */
export function createHintState() {
  return {
    consentA: false,
    consentB: false,
    hostApproved: false,
    enabled: false,
    hintsForA: [],
    hintsForB: [],
    level: 0,
    requestsA: 0,
    requestsB: 0,
    maxRequests: 4,
    timer: null,
  };
}

/**
 * @returns {import('../types/room.js').RoundClock}
 */
export function createRoundClockState() {
  return {
    enabled: false,
    durationSec: 60,
    endsAt: null,
    running: false,
    handle: null,
  };
}

/**
 * @param {string} code
 * @returns {Room}
 */
export function createRoomRecord(code) {
  /** @type {Room} */
  const room = {
    code,
    status: 'waiting',
    roundPhase: null,
    roundNumber: 0,
    pointsToWin: 5,
    fighterA: null,
    fighterB: null,
    category: null,
    isCustomRound: false,
    customMode: null,
    hints: createHintState(),
    roundClock: createRoundClockState(),
    messages: [],
    roundWinner: null,
    matchWinner: null,
    revealedWordA: null,
    revealedWordB: null,
    roundResetTimer: null,
    hostUserId: null,
    lastActivityAt: Date.now(),
    members: {},
  };

  rooms.set(code, room);
  return room;
}

/**
 * @param {string} code
 */
export function addRoom(code) {
  if (!rooms.has(code)) {
    createRoomRecord(code);
  }
}

/**
 * @param {string} code
 * @returns {boolean}
 */
export function hasRoom(code) {
  return rooms.has(code);
}

/**
 * @param {string} code
 * @returns {Room | undefined}
 */
export function getRoom(code) {
  return rooms.get(code);
}

/**
 * @param {string | undefined | null} code
 * @returns {string}
 */
export function normalizeRoomCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * @param {Room} room
 */
export function clearRoundResetTimer(room) {
  if (room.roundResetTimer) {
    clearTimeout(room.roundResetTimer);
    room.roundResetTimer = null;
  }
}

/**
 * @param {Room} room
 */
export function clearHintTimer(room) {
  if (room.hints?.timer) {
    clearTimeout(room.hints.timer);
    room.hints.timer = null;
  }
}

/**
 * @param {Room} room
 */
export function ensureHints(room) {
  if (!room.hints) {
    room.hints = createHintState();
  }
  return room.hints;
}

/**
 * @param {Room} room
 */
export function clearRoundClock(room) {
  if (!room.roundClock) {
    room.roundClock = createRoundClockState();
    return;
  }
  if (room.roundClock.handle) {
    clearTimeout(room.roundClock.handle);
    room.roundClock.handle = null;
  }
  room.roundClock.running = false;
  room.roundClock.endsAt = null;
}

/**
 * @param {Room} room
 */
export function ensureRoundClock(room) {
  if (!room.roundClock) {
    room.roundClock = createRoundClockState();
  }
  return room.roundClock;
}

/**
 * @param {Room} room
 */
export function resetHints(room) {
  clearHintTimer(room);
  room.hints = createHintState();
}

/**
 * @param {Room} room
 */
export function resetRound(room) {
  clearRoundResetTimer(room);
  clearRoundClock(room);
  resetHints(room);
  room.status = 'playing';
  room.roundPhase = 'selecting';
  room.fighterA = null;
  room.fighterB = null;
  room.category = null;
  room.isCustomRound = false;
  room.customMode = null;
  room.messages = [];
  room.roundWinner = null;
  room.revealedWordA = null;
  room.revealedWordB = null;
}

/**
 * @param {Room} room
 */
export function resetRoomToWaiting(room) {
  clearRoundResetTimer(room);
  clearRoundClock(room);
  resetHints(room);
  room.status = 'waiting';
  room.roundPhase = null;
  room.roundNumber = 0;
  room.fighterA = null;
  room.fighterB = null;
  room.category = null;
  room.isCustomRound = false;
  room.customMode = null;
  room.messages = [];
  room.roundWinner = null;
  room.matchWinner = null;
  room.revealedWordA = null;
  room.revealedWordB = null;
}

/**
 * @param {string} code
 */
export function removeRoom(code) {
  const room = rooms.get(code);

  if (!room) {
    return;
  }

  clearRoundResetTimer(room);
  clearHintTimer(room);
  clearRoundClock(room);
  rooms.delete(code);
}

/**
 * @param {Room} room
 * @param {number} pointsToWin
 */
export function setPointsToWin(room, pointsToWin) {
  room.pointsToWin = pointsToWin;
}

/**
 * @param {string | undefined | null} username
 * @returns {string}
 */
export function usernameKey(username) {
  return String(username ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * @param {Room} room
 * @returns {Record<string, import('../types/room.js').RoomMember>}
 */
export function ensureMembers(room) {
  if (!room.members || typeof room.members !== 'object') {
    room.members = {};
  }
  return room.members;
}

/**
 * @param {Room} room
 */
export function touchRoom(room) {
  room.lastActivityAt = Date.now();
}

/**
 * @param {Room} room
 * @param {{ userId: string, username: string, points?: number, isHost?: boolean }} player
 */
export function upsertMember(room, player) {
  const members = ensureMembers(room);
  const key = usernameKey(player.username);

  if (!key || !player.userId) {
    return null;
  }

  for (const [existingKey, member] of Object.entries(members)) {
    if (member.userId === player.userId && existingKey !== key) {
      delete members[existingKey];
    }
  }

  const previous = members[key];
  members[key] = {
    userId: player.userId,
    username: player.username,
    points: Number.isFinite(player.points) ? player.points : previous?.points ?? 0,
    isHost: Boolean(player.isHost),
    lastSeen: Date.now(),
  };

  if (player.isHost) {
    room.hostUserId = player.userId;
  }

  touchRoom(room);
  return members[key];
}

/**
 * @param {Room} room
 * @param {string} username
 */
export function findMemberByUsername(room, username) {
  return ensureMembers(room)[usernameKey(username)] ?? null;
}

/**
 * @param {Room} room
 * @param {string} userId
 */
export function findMemberByUserId(room, userId) {
  return (
    Object.values(ensureMembers(room)).find((member) => member.userId === userId) ??
    null
  );
}

/**
 * @param {Room} room
 * @param {string} userId
 * @param {number} points
 */
export function setMemberPoints(room, userId, points) {
  const member = findMemberByUserId(room, userId);
  if (member) {
    member.points = points;
    member.lastSeen = Date.now();
  }
  touchRoom(room);
}

/**
 * @param {Room} room
 */
export function resetMemberPoints(room) {
  for (const member of Object.values(ensureMembers(room))) {
    member.points = 0;
  }
  touchRoom(room);
}

/**
 * @param {Room} room
 * @param {string} userId
 */
export function removeMemberByUserId(room, userId) {
  const members = ensureMembers(room);
  for (const [key, member] of Object.entries(members)) {
    if (member.userId === userId) {
      delete members[key];
    }
  }
  touchRoom(room);
}
