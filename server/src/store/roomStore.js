/** @typedef {import('../types/room.js').Room} Room */
/** @typedef {import('../types/room.js').HintState} HintState */

/** @type {Map<string, Room>} */
const rooms = new Map();

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
