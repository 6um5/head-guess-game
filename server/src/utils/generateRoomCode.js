import { hasRoom } from '../store/roomStore.js';

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a random 4–5 character uppercase alphanumeric room code.
 * @returns {string}
 */
export function generateRoomCode() {
  const length = Math.random() < 0.5 ? 4 : 5;
  let code = '';

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[index];
  }

  return code;
}

/**
 * @param {() => string} generator
 * @param {number} [maxAttempts=20]
 * @returns {string}
 */
export function generateUniqueRoomCode(generator = generateRoomCode, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generator();

    if (!hasRoom(code)) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique room code');
}
