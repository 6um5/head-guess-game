import { getRoom } from '../store/roomStore.js';
import { buildLeaderboard, getRoomPlayers } from './roomUtils.js';
import { previewNextPair } from './turnOrder.js';

/**
 * @typedef {import('../types/room.js').Room} Room
 * @typedef {import('../types/player.js').RoomPlayer} RoomPlayer
 */

/**
 * Hints may be stored as plain strings by older saved states.
 * @param {Array<string | { text: string, source?: string, from?: string }>} list
 */
function normalizeHintList(list) {
  return (Array.isArray(list) ? list : []).map((entry) => {
    if (typeof entry === 'string') {
      return { text: entry, source: 'ai', from: null };
    }
    return {
      text: String(entry?.text ?? ''),
      source: entry?.source === 'peer' ? 'peer' : 'ai',
      from: entry?.from ?? null,
    };
  });
}

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

  const hintsForA = normalizeHintList(room.hints?.hintsForA);
  const hintsForB = normalizeHintList(room.hints?.hintsForB);
  const maxRequests = room.hints?.maxRequests ?? 4;
  const myRequests = isFighterA
    ? room.hints?.requestsA ?? 0
    : isFighterB
      ? room.hints?.requestsB ?? 0
      : 0;
  const hintsEnabled = Boolean(room.hints?.enabled);
  const askedA = Boolean(room.hints?.askedA);
  const askedB = Boolean(room.hints?.askedB);
  const iAmWaiting = (isFighterA && askedA) || (isFighterB && askedB);
  const opponentIsWaiting = (isFighterA && askedB) || (isFighterB && askedA);

  return {
    roomCode: room.code,
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
      enabled: hintsEnabled,
      myHints: isFighterA
        ? hintsForA
        : isFighterB
          ? hintsForB
          : [
              ...hintsForA.map((hint) => ({ ...hint, text: `لـ أ: ${hint.text}` })),
              ...hintsForB.map((hint) => ({ ...hint, text: `لـ ب: ${hint.text}` })),
            ],
      hintsForA: isAudience ? hintsForA : [],
      hintsForB: isAudience ? hintsForB : [],
      level: room.hints?.level ?? 0,
      maxRequests,
      myRequests,
      canRequestHint:
        hintsEnabled && isGuessing && isFighter && myRequests < maxRequests,
      waitingForOpponentHint: iAmWaiting,
      opponentWaitingForMyHint: opponentIsWaiting && isGuessing,
      opponentName: isFighterA
        ? room.fighterB?.username ?? null
        : isFighterB
          ? room.fighterA?.username ?? null
          : null,
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
    leaderboard: buildLeaderboard(room, players),
    nextUp: previewNextPair(room, players),
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

/** Only a stray definite article is dropped; name parts stay meaningful. */
const IGNORED_GUESS_WORDS = new Set(['ال']);

/**
 * Arabic-friendly normalisation: hamza, ta-marbuta, alef-maqsura, tatweel,
 * Arabic-Indic digits, and common Persian/Iraqi letter shapes all collapse
 * to one spelling so a correct answer is never rejected over orthography.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeForCompare(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    )
    .replace(/[\u06F0-\u06F9]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x06f0),
    )
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱٲٳ]/g, 'ا')
    .replace(/[ىئیۍ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ةۃ]/g, 'ه')
    .replace(/[ھہۀ]/g, 'ه')
    .replace(/[کڪڬ]/g, 'ك')
    .replace(/[گڲ]/g, 'ك')
    .replace(/چ/g, 'ج')
    .replace(/پ/g, 'ب')
    .replace(/[ڤﭪ]/g, 'ف')
    .replace(/ژ/g, 'ز')
    .replace(/ء/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Spacing-free forms of an answer, with and without the definite article,
 * so "الرمان"/"رمان" and "عمرو دياب"/"عمرودياب" all compare equal.
 *
 * @param {string} value
 * @returns {string[]}
 */
function compareForms(value) {
  const words = normalizeForCompare(value)
    .split(' ')
    .filter((word) => word && !IGNORED_GUESS_WORDS.has(word));

  const plain = words.join('');
  const withoutArticle = words
    .map((word) => (word.length > 3 && word.startsWith('ال') ? word.slice(2) : word))
    .join('');

  return plain === withoutArticle ? [plain] : [plain, withoutArticle];
}

/**
 * @param {string} value
 * @returns {string}
 */
function compactForCompare(value) {
  const forms = compareForms(value);
  return forms[forms.length - 1] ?? '';
}

/**
 * @param {string} guess
 * @param {string} secretWord
 * @returns {boolean}
 */
export function isCorrectGuess(guess, secretWord) {
  const guessForms = compareForms(guess);
  const secretForms = compareForms(secretWord);
  const normalizedGuess = compactForCompare(guess);
  const normalizedSecret = compactForCompare(secretWord);

  if (!normalizedGuess || !normalizedSecret) {
    return false;
  }

  if (guessForms.some((form) => secretForms.includes(form))) {
    return true;
  }

  // Numbers must match exactly — a single digit changes the answer.
  if (/\d/.test(normalizedSecret) || /\d/.test(normalizedGuess)) {
    return false;
  }

  // Forgive one mistyped letter in longer answers, but never a missing
  // or extra letter, so a genuinely different word is still rejected.
  if (
    normalizedSecret.length >= 6 &&
    normalizedGuess.length === normalizedSecret.length
  ) {
    return editDistance(normalizedGuess, normalizedSecret) <= 1;
  }

  return false;
}

/**
 * True when a piece of text gives away the secret, ignoring spelling.
 * @param {string} text
 * @param {string} secretWord
 * @returns {boolean}
 */
export function revealsSecret(text, secretWord) {
  const textForms = compareForms(text);
  const secretForms = compareForms(secretWord);

  if (!textForms[0] || !secretForms[0] || secretForms[0].length < 2) {
    return false;
  }

  return secretForms.some((secret) =>
    textForms.some((form) => form.includes(secret)),
  );
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    previous = current;
  }

  return previous[b.length];
}

/**
 * Private "hot / warm" feedback so a near miss feels rewarding.
 * @param {string} guess
 * @param {string} secretWord
 * @returns {{ level: 'hot' | 'warm', message: string } | null}
 */
export function measureGuessCloseness(guess, secretWord) {
  const normalizedGuess = compactForCompare(guess);
  const normalizedSecret = compactForCompare(secretWord);

  if (!normalizedGuess || !normalizedSecret || normalizedSecret.length < 3) {
    return null;
  }

  const distance = editDistance(normalizedGuess, normalizedSecret);
  const longest = Math.max(normalizedGuess.length, normalizedSecret.length);

  if (distance <= 1 || distance / longest <= 0.2) {
    return { level: 'hot', message: 'حار جداً — قريب من الجواب!' };
  }

  if (distance <= 2 || distance / longest <= 0.4) {
    return { level: 'warm', message: 'دافئ — أنت على الطريق الصحيح.' };
  }

  const sharedPrefix = normalizedGuess.slice(0, 2) === normalizedSecret.slice(0, 2);
  if (sharedPrefix && normalizedGuess.length >= 3) {
    return { level: 'warm', message: 'دافئ — البداية صحيحة.' };
  }

  return null;
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
