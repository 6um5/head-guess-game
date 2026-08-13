import { generateEyushRomance } from '../utils/gemini.js';

/**
 * Secret romantic tribute handler — not advertised in the UI docs.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSecretHandlers(_io, socket) {
  socket.on('requestEyushRomance', async ({ key } = {}) => {
    try {
      const normalized = String(key ?? '')
        .trim()
        .replace(/\s+/g, '');

      if (normalized !== 'ايوش') {
        socket.emit('eyushRomanceError', {
          message: 'غير مسموح.',
        });
        return;
      }

      const message = await generateEyushRomance();
      socket.emit('eyushRomance', { message });
    } catch (error) {
      console.error('requestEyushRomance failed:', error);
      socket.emit('eyushRomanceError', {
        message: 'تعذر إكمال اللحظة الآن.',
      });
    }
  });
}
