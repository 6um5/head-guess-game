/** @typedef {import('../types/session.js').Session} Session */

/** @type {Map<string, Session>} */
const sessions = new Map();

export function getAllSessions() {
  return sessions;
}

/**
 * @param {string} sessionId
 * @returns {Session | undefined}
 */
export function getSession(sessionId) {
  return sessions.get(sessionId);
}

/**
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Session}
 */
export function createSession(sessionId, userId) {
  /** @type {Session} */
  const session = {
    sessionId,
    userId,
    username: null,
    roomCode: null,
    points: 0,
    isHost: false,
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * @param {Session} session
 */
export function saveSession(session) {
  sessions.set(session.sessionId, session);
}

/**
 * Ensures only one session in a room is marked as host.
 * @param {string} roomCode
 * @param {string | null} [hostUserId=null]
 */
export function setRoomHost(roomCode, hostUserId = null) {
  for (const session of sessions.values()) {
    if (session.roomCode !== roomCode) {
      continue;
    }

    session.isHost = Boolean(hostUserId) && session.userId === hostUserId;
  }
}

/**
 * @param {string} roomCode
 * @returns {Session[]}
 */
export function getSessionsByRoom(roomCode) {
  return [...sessions.values()].filter((session) => session.roomCode === roomCode);
}

/**
 * @returns {number}
 */
export function getSessionCount() {
  return sessions.size;
}
