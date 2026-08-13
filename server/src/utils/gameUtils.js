import { getRoom } from '../store/roomStore.js';
import { getRoomPlayers } from './roomUtils.js';

/**
 * @typedef {import('../types/room.js').Room} Room
 * @typedef {import('../types/player.js').RoomPlayer} RoomPlayer
 */

/**
 * Host sees both words only when not playing as a fighter (spectator host / audience).
 * Host-as-fighter is treated like a normal player for word visibility,
 * but still keeps approval powers on the client/server separately.
 *
 * @param {Room} room
 * @param {RoomPlayer[]} players
 * @param {string | null | undefined} viewerUserId
 * @param {boolean} [viewerIsHost=false]
 */
export function buildPersonalizedGameState(
  room,
  players,
  viewerUserId,
  viewerIsHost = false,
) {
  const fighterAId = room.fighterA?.userId ?? null;
  const fighterBId = room.fighterB?.userId ?? null;
  const isFighterA = viewerUserId === fighterAId;
  const isFighterB = viewerUserId === fighterBId;
  const isFighter = isFighterA || isFighterB;
  const isAudience = !isFighter;
  const hostSpectating = viewerIsHost && !isFighter;
  const isGuessing = room.roundPhase === 'guessing';
  const isWordSetup = room.roundPhase === 'word_setup';
  const isReveal = room.status === 'round_end' || room.status === 'match_end';

  let myWord = null;
  let wordA = null;
  let wordB = null;

  if (isReveal) {
    wordA = room.revealedWordA ?? room.fighterA?.word ?? null;
    wordB = room.revealedWordB ?? room.fighterB?.word ?? null;
    if (isFighterA) myWord = wordA;
    if (isFighterB) myWord = wordB;
  } else if (isGuessing) {
    if (isFighterA) {
      myWord = room.fighterA?.word ?? null;
    } else if (isFighterB) {
      myWord = room.fighterB?.word ?? null;
    } else if (isAudience) {
      // Includes spectator host — can see both when not fighting.
      wordA = room.fighterA?.word ?? null;
      wordB = room.fighterB?.word ?? null;
    }
  } else if (isWordSetup) {
    if (isFighterA) myWord = room.fighterA?.word ?? null;
    if (isFighterB) myWord = room.fighterB?.word ?? null;
    // Host sees proposed words only when not one of the fighters.
    if (hostSpectating) {
      wordA = room.fighterA?.word ?? null;
      wordB = room.fighterB?.word ?? null;
    }
  }

  const canSeeBothWords =
    (isAudience && isGuessing) || (hostSpectating && isWordSetup);

  return {
    status: room.status,
    roundPhase: room.roundPhase,
    roundNumber: room.roundNumber,
    pointsToWin: room.pointsToWin,
    category: room.category,
    isCustomRound: room.isCustomRound,
    customMode: room.customMode ?? null,
    fighterA: room.fighterA
      ? {
          userId: room.fighterA.userId,
          username: room.fighterA.username,
          wordReady: Boolean(room.fighterA.wordReady),
        }
      : null,
    fighterB: room.fighterB
      ? {
          userId: room.fighterB.userId,
          username: room.fighterB.username,
          wordReady: Boolean(room.fighterB.wordReady),
        }
      : null,
    myRole: isFighterA ? 'fighterA' : isFighterB ? 'fighterB' : 'audience',
    myWord,
    wordA,
    wordB,
    canSeeBothWords,
    bothWordsReady: Boolean(
      room.fighterA?.wordReady && room.fighterB?.wordReady,
    ),
    hints: {
      consentA: Boolean(room.hints?.consentA),
      consentB: Boolean(room.hints?.consentB),
      bothConsented: Boolean(room.hints?.consentA && room.hints?.consentB),
      hostApproved: Boolean(room.hints?.hostApproved),
      enabled: Boolean(room.hints?.enabled),
      myHints: isFighterA
        ? room.hints?.hintsForA ?? []
        : isFighterB
          ? room.hints?.hintsForB ?? []
          : [
              ...(room.hints?.hintsForA ?? []).map((h) => `لـ أ: ${h}`),
              ...(room.hints?.hintsForB ?? []).map((h) => `لـ ب: ${h}`),
            ],
      hintsForA: isAudience ? room.hints?.hintsForA ?? [] : [],
      hintsForB: isAudience ? room.hints?.hintsForB ?? [] : [],
      level: room.hints?.level ?? 0,
      maxRequests: room.hints?.maxRequests ?? 4,
      myRequests: isFighterA
        ? room.hints?.requestsA ?? 0
        : isFighterB
          ? room.hints?.requestsB ?? 0
          : 0,
      canRequestHint:
        Boolean(room.hints?.enabled) &&
        isGuessing &&
        ((isFighterA && (room.hints?.requestsA ?? 0) < (room.hints?.maxRequests ?? 4)) ||
          (isFighterB && (room.hints?.requestsB ?? 0) < (room.hints?.maxRequests ?? 4))),
    },
    roundClock: {
      enabled: Boolean(room.roundClock?.enabled),
      durationSec: room.roundClock?.durationSec ?? 60,
      endsAt: room.roundClock?.endsAt ?? null,
      running: Boolean(room.roundClock?.running),
      remainingSec:
        room.roundClock?.running && room.roundClock?.endsAt
          ? Math.max(0, Math.ceil((room.roundClock.endsAt - Date.now()) / 1000))
          : null,
    },
    messages: room.messages,
    roundWinner: room.roundWinner,
    matchWinner: room.matchWinner,
    players,
  };
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
export async function emitGameState(io, roomCode) {
  const room = getRoom(roomCode);

  if (!room) {
    return;
  }

  const players = await getRoomPlayers(io, roomCode);
  const sockets = await io.in(roomCode).fetchSockets();

  for (const remoteSocket of sockets) {
    const viewerId = remoteSocket.data.session?.userId ?? null;
    const viewerIsHost = remoteSocket.data.session?.isHost === true;
    remoteSocket.emit(
      'gameState',
      buildPersonalizedGameState(room, players, viewerId, viewerIsHost),
    );
  }
}

/**
 * @param {string | undefined | null} word
 * @param {{ allowNumber?: boolean; numbersOnly?: boolean }} [options]
 * @returns {string | null}
 */
export function sanitizeSecretWord(word, options = {}) {
  if (typeof word !== 'string') {
    return null;
  }

  const trimmed = word.trim();

  if (trimmed.length < 1 || trimmed.length > 64) {
    return null;
  }

  if (options.numbersOnly || options.allowNumber) {
    const digits = trimmed.replace(/[^\d]/g, '');
    const num = Number(digits);
    if (!Number.isInteger(num) || num < 1 || num > 1_000_000_000) {
      return null;
    }
    return String(num);
  }

  return trimmed;
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeForCompare(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * @param {string} guess
 * @param {string} secretWord
 * @returns {boolean}
 */
export function isCorrectGuess(guess, secretWord) {
  return normalizeForCompare(guess) === normalizeForCompare(secretWord);
}

/**
 * @param {string | undefined | null} message
 * @returns {string | null}
 */
export function sanitizeGuess(message) {
  if (typeof message !== 'string') {
    return null;
  }

  const trimmed = message.trim();

  if (trimmed.length < 1 || trimmed.length > 120) {
    return null;
  }

  return trimmed;
}

/**
 * @param {import('socket.io').Socket} socket
 * @returns {boolean}
 */
export function isHost(socket) {
  return socket.data.session?.isHost === true;
}

/**
 * @param {import('socket.io').Socket} socket
 * @returns {Room | null}
 */
export function getRoomFromSocket(socket) {
  const roomCode = socket.data.session?.roomCode;

  if (!roomCode) {
    return null;
  }

  return getRoom(roomCode) ?? null;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
export function sanitizePointsToWin(value, fallback = 5) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(20, Math.max(1, Math.floor(parsed)));
}
