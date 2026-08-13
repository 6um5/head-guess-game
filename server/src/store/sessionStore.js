/** @typedef {import('../types/session.js').Session} Session */

/** @type {Map<string, Session>} */
const sessions = new Map();

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
 * @returns {number}
 */
export function getSessionCount() {
  return sessions.size;
}
