import { v4 as uuidv4 } from 'uuid';
import { createSession, getSession } from '../store/sessionStore.js';

/**
 * Socket.io middleware that resolves or creates a persistent session.
 * Existing sessions are restored from the in-memory store so players
 * can reconnect without losing room membership, points, or host status.
 *
 * @param {import('socket.io').Socket} socket
 * @param {(err?: Error) => void} next
 */
export function sessionMiddleware(socket, next) {
  try {
    const sessionId = socket.handshake.auth?.sessionId;

    if (typeof sessionId === 'string' && sessionId.length > 0) {
      const existingSession = getSession(sessionId);

      if (existingSession) {
        socket.data.session = existingSession;
        return next();
      }
    }

    const newSessionId = uuidv4();
    const userId = uuidv4();
    const session = createSession(newSessionId, userId);

    socket.data.session = session;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Session middleware failed'));
  }
}
