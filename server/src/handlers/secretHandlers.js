import {
  generateSecretTribute,
  isSecretTributeName,
} from '../utils/gemini.js';

/**
 * Secret tribute handlers — not advertised in the UI docs.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSecretHandlers(_io, socket) {
  /**
   * @param {string} rawKey
   * @param {string} successEvent
   * @param {string} errorEvent
   */
  async function respondWithTribute(rawKey, successEvent, errorEvent) {
    const normalized = String(rawKey ?? '')
      .trim()
      .replace(/\s+/g, '');

    if (!isSecretTributeName(normalized)) {
      socket.emit(errorEvent, { message: 'غير مسموح.' });
      return;
    }

    const { name, message } = await generateSecretTribute(normalized);
    socket.emit(successEvent, { name, message });
  }

  socket.on('requestSecretTribute', async ({ key } = {}) => {
    try {
      await respondWithTribute(key, 'secretTribute', 'secretTributeError');
    } catch (error) {
      console.error('requestSecretTribute failed:', error);
      socket.emit('secretTributeError', { message: 'تعذر إكمال اللحظة الآن.' });
    }
  });
}
