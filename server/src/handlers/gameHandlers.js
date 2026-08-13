import { v4 as uuidv4 } from 'uuid';
import {
  clearRoundResetTimer,
  clearHintTimer,
  clearRoundClock,
  ensureHints,
  ensureRoundClock,
  getRoom,
  resetHints,
  resetRound,
} from '../store/roomStore.js';
import { saveSession } from '../store/sessionStore.js';
import { generateHint, generateTwoDistinctWords } from '../utils/gemini.js';
import {
  buildPersonalizedGameState,
  emitGameState,
  getRoomFromSocket,
  isCorrectGuess,
  isHost,
  sanitizeGuess,
  sanitizePointsToWin,
  sanitizeSecretWord,
} from '../utils/gameUtils.js';
import { emitRoomUpdated, getRoomPlayers } from '../utils/roomUtils.js';

const ROUND_END_DELAY_MS = 4500;
const MAX_PERSONAL_HINTS = 4;

const ALLOWED_CATEGORIES = new Set([
  'شخصيات عربية مشهورة',
  'شخصيات عراقية مشهورة',
  'فواكه',
  'جماد',
  'أكلات شعبية',
  'أرقام سهلة',
]);

/**
 * @param {import('socket.io').Socket} socket
 * @param {string} message
 */
function emitGameError(socket, message) {
  socket.emit('gameError', { message });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('../types/room.js').Room} room
 */
function scheduleNextRound(io, room) {
  clearRoundResetTimer(room);

  room.roundResetTimer = setTimeout(async () => {
    if (room.status === 'match_end') {
      return;
    }

    resetRound(room);
    await emitGameState(io, room.code);
  }, ROUND_END_DELAY_MS);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 * @param {string} userId
 */
async function findSocketByUserId(io, roomCode, userId) {
  const sockets = await io.in(roomCode).fetchSockets();
  return (
    sockets.find((remoteSocket) => remoteSocket.data.session?.userId === userId) ??
    null
  );
}

/**
 * @param {import('../types/player.js').RoomPlayer[]} players
 * @param {string} userId
 */
function findPlayer(players, userId) {
  return players.find((player) => player.userId === userId) ?? null;
}

/**
 * @param {import('../types/player.js').RoomPlayer[]} players
 */
function pickRandomPair(players) {
  const unique = [];
  const seen = new Set();

  for (const player of players) {
    if (!player?.userId || seen.has(player.userId)) {
      continue;
    }
    seen.add(player.userId);
    unique.push(player);
  }

  if (unique.length < 2) return null;
  const shuffled = [...unique].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('../types/room.js').Room} room
 * @param {import('../types/player.js').RoomPlayer} playerA
 * @param {import('../types/player.js').RoomPlayer} playerB
 * @param {string} category
 * @param {boolean} isCustom
 * @param {'words' | 'numbers' | null} [customMode=null]
 */
function assignFighters(room, playerA, playerB, category, isCustom, customMode = null) {
  resetHints(room);
  room.fighterA = {
    userId: playerA.userId,
    username: playerA.username,
    word: null,
    wordReady: false,
  };
  room.fighterB = {
    userId: playerB.userId,
    username: playerB.username,
    word: null,
    wordReady: false,
  };
  room.category = category;
  room.isCustomRound = isCustom;
  room.customMode = isCustom ? customMode : null;
  room.messages = [];
  room.roundWinner = null;
  room.matchWinner = null;
  room.revealedWordA = null;
  room.revealedWordB = null;
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('../types/room.js').Room} room
 */
async function handleRoundTimeout(io, room) {
  clearRoundClock(room);
  clearHintTimer(room);

  if (room.roundPhase !== 'guessing' || !room.fighterA || !room.fighterB) {
    return;
  }

  room.revealedWordA = room.fighterA.word;
  room.revealedWordB = room.fighterB.word;
  room.roundPhase = null;
  room.status = 'round_end';
  room.roundWinner = null;
  if (room.hints) room.hints.enabled = false;

  io.to(room.code).emit('roundTimedOut', {
    wordA: room.revealedWordA,
    wordB: room.revealedWordB,
    message: 'انتهى الوقت! لا فائز في هذه الجولة.',
  });

  await emitGameState(io, room.code);
  scheduleNextRound(io, room);
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('../types/room.js').Room} room
 */
function startRoundClockIfEnabled(io, room) {
  const clock = ensureRoundClock(room);
  const wasEnabled = Boolean(clock.enabled);
  const durationSec = Math.min(300, Math.max(15, Number(clock.durationSec) || 60));
  clearRoundClock(room);
  clock.enabled = wasEnabled;
  clock.durationSec = durationSec;

  if (!clock.enabled || room.roundPhase !== 'guessing') {
    return;
  }

  clock.running = true;
  clock.endsAt = Date.now() + durationSec * 1000;
  clock.handle = setTimeout(() => {
    handleRoundTimeout(io, room);
  }, durationSec * 1000);
}

/**
 * Enables manual personal hints after host approval.
 * @param {import('../types/room.js').Room} room
 */
function enableManualHints(room) {
  const hints = ensureHints(room);
  clearHintTimer(room);
  hints.enabled = true;
  hints.hostApproved = true;
  hints.maxRequests = MAX_PERSONAL_HINTS;
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('../types/room.js').Room} room
 */
function startAutomaticHints(_io, room) {
  enableManualHints(room);
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerGameHandlers(io, socket) {
  socket.on('setPointsToWin', async ({ pointsToWin }) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه تحديد حد الفوز.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (
        !room ||
        (room.status !== 'waiting' &&
          room.roundPhase !== 'selecting' &&
          room.status !== 'match_end')
      ) {
        emitGameError(socket, 'لا يمكن تغيير حد الفوز الآن.');
        return;
      }

      room.pointsToWin = sanitizePointsToWin(pointsToWin, room.pointsToWin);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('setPointsToWin failed:', error);
      emitGameError(socket, 'تعذر تحديث حد الفوز.');
    }
  });

  socket.on('startGame', async ({ pointsToWin } = {}) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه بدء المباراة.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room) {
        emitGameError(socket, 'أنت لست داخل غرفة.');
        return;
      }

      if (room.status !== 'waiting' && room.status !== 'match_end') {
        emitGameError(socket, 'لا يمكن بدء مباراة جديدة الآن.');
        return;
      }

      const players = await getRoomPlayers(io, room.code);

      if (players.length < 2) {
        emitGameError(socket, 'تحتاج لاعبين على الأقل لبدء المبارزة.');
        return;
      }

      clearRoundResetTimer(room);
      clearHintTimer(room);
      clearRoundClock(room);
      resetHints(room);
      room.pointsToWin = sanitizePointsToWin(pointsToWin, room.pointsToWin);
      room.status = 'playing';
      room.roundPhase = 'selecting';
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

      for (const remote of await io.in(room.code).fetchSockets()) {
        if (remote.data.session) {
          remote.data.session.points = 0;
          saveSession(remote.data.session);
        }
      }

      await emitRoomUpdated(io, room.code);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('startGame failed:', error);
      emitGameError(socket, 'تعذر بدء المباراة.');
    }
  });

  socket.on('startDuel', async ({ playerAId, playerBId, random, category }) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه بدء المبارزة.');
        return;
      }

      const room = getRoomFromSocket(socket);
      const selectedCategory =
        typeof category === 'string' ? category.trim() : '';

      if (!room || room.status !== 'playing' || room.roundPhase !== 'selecting') {
        emitGameError(socket, 'اختيار المبارزة متاح فقط أثناء مرحلة الاختيار.');
        return;
      }

      if (!ALLOWED_CATEGORIES.has(selectedCategory)) {
        emitGameError(socket, 'تصنيف غير صالح.');
        return;
      }

      const players = await getRoomPlayers(io, room.code);

      if (players.length < 2) {
        emitGameError(socket, 'تحتاج لاعبين على الأقل.');
        return;
      }

      let playerA = null;
      let playerB = null;

      if (random === true) {
        const pair = pickRandomPair(players);
        if (!pair) {
          emitGameError(socket, 'تعذر اختيار لاعبين عشوائياً.');
          return;
        }
        [playerA, playerB] = pair;
      } else {
        playerA = findPlayer(players, playerAId);
        playerB = findPlayer(players, playerBId);
      }

      if (!playerA || !playerB || playerA.userId === playerB.userId) {
        emitGameError(socket, 'اختر لاعبين مختلفين للمبارزة.');
        return;
      }

      io.to(room.code).emit('aiGenerating', { category: selectedCategory });

      const [rawWordA, rawWordB] = await generateTwoDistinctWords(selectedCategory);
      const allowNumber = selectedCategory === 'أرقام سهلة';
      const wordA = sanitizeSecretWord(rawWordA, { allowNumber });
      const wordB = sanitizeSecretWord(rawWordB, { allowNumber });

      if (!wordA || !wordB) {
        emitGameError(socket, 'فشل توليد كلمتين صالحتين. حاول مرة أخرى.');
        return;
      }

      clearRoundResetTimer(room);
      room.roundNumber += 1;
      room.status = 'playing';
      room.roundPhase = 'guessing';
      assignFighters(room, playerA, playerB, selectedCategory, false);
      room.fighterA.word = wordA;
      room.fighterA.wordReady = true;
      room.fighterB.word = wordB;
      room.fighterB.wordReady = true;

      io.to(room.code).emit('roundStarted', {
        category: selectedCategory,
        roundNumber: room.roundNumber,
        fighterA: { userId: playerA.userId, username: playerA.username },
        fighterB: { userId: playerB.userId, username: playerB.username },
        message: `تم اختيار الكلمتين! التصنيف: ${selectedCategory}`,
      });

      startRoundClockIfEnabled(io, room);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('startDuel failed:', error);
      emitGameError(socket, 'تعذر بدء المبارزة. حاول مرة أخرى.');
    }
  });

  socket.on('startCustomDuel', async ({ playerAId, playerBId, random, mode }) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه بدء جولة مخصصة.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || room.status !== 'playing' || room.roundPhase !== 'selecting') {
        emitGameError(socket, 'الإعداد المخصص متاح فقط أثناء الاختيار.');
        return;
      }

      const players = await getRoomPlayers(io, room.code);
      let playerA = null;
      let playerB = null;

      if (random === true) {
        const pair = pickRandomPair(players);
        if (!pair) {
          emitGameError(socket, 'تعذر اختيار لاعبين.');
          return;
        }
        [playerA, playerB] = pair;
      } else {
        playerA = findPlayer(players, playerAId);
        playerB = findPlayer(players, playerBId);
      }

      if (!playerA || !playerB || playerA.userId === playerB.userId) {
        emitGameError(socket, 'اختر لاعبين مختلفين.');
        return;
      }

      const customMode = mode === 'numbers' ? 'numbers' : 'words';
      const category =
        customMode === 'numbers'
          ? 'الخصمان يختاران رقمين'
          : 'الخصمان يختاران كلمتين';

      clearRoundResetTimer(room);
      room.roundNumber += 1;
      room.status = 'playing';
      room.roundPhase = 'word_setup';
      assignFighters(room, playerA, playerB, category, true, customMode);

      io.to(room.code).emit('customSetupStarted', {
        roundNumber: room.roundNumber,
        fighterA: { userId: playerA.userId, username: playerA.username },
        fighterB: { userId: playerB.userId, username: playerB.username },
        customMode,
        message:
          customMode === 'numbers'
            ? 'أدخلا رقمين مختلفين — تحتاج موافقة المضيف للبدء.'
            : 'أدخلا كلمتين مختلفتين — تحتاج موافقة المضيف للبدء.',
      });

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('startCustomDuel failed:', error);
      emitGameError(socket, 'تعذر بدء الإعداد المخصص.');
    }
  });

  socket.on('proposeWord', async ({ word }) => {
    try {
      const room = getRoomFromSocket(socket);
      const { session } = socket.data;

      if (!room || room.roundPhase !== 'word_setup' || !room.isCustomRound) {
        emitGameError(socket, 'لا يمكن اقتراح كلمة الآن.');
        return;
      }

      const numbersOnly = room.customMode === 'numbers';
      const finalWord = sanitizeSecretWord(String(word ?? '').trim(), {
        numbersOnly,
        allowNumber: numbersOnly,
      });

      if (!finalWord) {
        emitGameError(
          socket,
          numbersOnly
            ? 'أدخل رقماً صحيحاً بين 1 و 1000000000.'
            : 'أدخل كلمة صحيحة صالحة.',
        );
        return;
      }

      if (room.fighterA?.userId === session.userId) {
        room.fighterA.word = finalWord;
        room.fighterA.wordReady = true;
      } else if (room.fighterB?.userId === session.userId) {
        room.fighterB.word = finalWord;
        room.fighterB.wordReady = true;
      } else {
        emitGameError(socket, 'فقط المتبارزان يمكنهما اقتراح كلمة.');
        return;
      }

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('proposeWord failed:', error);
      emitGameError(socket, 'تعذر حفظ الكلمة.');
    }
  });

  socket.on('hostSetWord', async ({ targetUserId, word }) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه تعيين الكلمات.');
        return;
      }

      const room = getRoomFromSocket(socket);
      const { session } = socket.data;

      if (!room || room.roundPhase !== 'word_setup') {
        emitGameError(socket, 'تعيين الكلمات متاح أثناء الإعداد فقط.');
        return;
      }

      const hostIsFighter =
        session.userId === room.fighterA?.userId ||
        session.userId === room.fighterB?.userId;

      if (hostIsFighter && targetUserId !== session.userId) {
        emitGameError(
          socket,
          'أنت متبارز — لا يمكنك تعيين أو رؤية كلمة الخصم. يمكنك الموافقة فقط.',
        );
        return;
      }

      const numbersOnly = room.customMode === 'numbers';
      const finalWord = sanitizeSecretWord(String(word ?? '').trim(), {
        numbersOnly,
        allowNumber: numbersOnly,
      });

      if (!finalWord) {
        emitGameError(
          socket,
          numbersOnly
            ? 'أدخل رقماً صحيحاً صالحاً.'
            : 'أدخل كلمة صحيحة صالحة.',
        );
        return;
      }

      if (room.fighterA?.userId === targetUserId) {
        room.fighterA.word = finalWord;
        room.fighterA.wordReady = true;
      } else if (room.fighterB?.userId === targetUserId) {
        room.fighterB.word = finalWord;
        room.fighterB.wordReady = true;
      } else {
        emitGameError(socket, 'اللاعب المحدد ليس متبارزاً.');
        return;
      }

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('hostSetWord failed:', error);
      emitGameError(socket, 'تعذر تعيين الكلمة.');
    }
  });

  socket.on('approveCustomWords', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يوافق على بدء الجولة.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || room.roundPhase !== 'word_setup') {
        emitGameError(socket, 'لا توجد كلمات بانتظار الموافقة.');
        return;
      }

      if (!room.fighterA?.wordReady || !room.fighterB?.wordReady) {
        emitGameError(socket, 'يجب تجهيز كلمتي اللاعبين أولاً.');
        return;
      }

      if (
        room.fighterA.word &&
        room.fighterB.word &&
        isCorrectGuess(room.fighterA.word, room.fighterB.word)
      ) {
        emitGameError(socket, 'يجب أن تكون الكلمتان مختلفتين.');
        return;
      }

      room.roundPhase = 'guessing';
      room.status = 'playing';

      io.to(room.code).emit('roundStarted', {
        category: room.category,
        roundNumber: room.roundNumber,
        fighterA: {
          userId: room.fighterA.userId,
          username: room.fighterA.username,
        },
        fighterB: {
          userId: room.fighterB.userId,
          username: room.fighterB.username,
        },
        message: `تمت الموافقة! التصنيف: ${room.category}`,
      });

      startRoundClockIfEnabled(io, room);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('approveCustomWords failed:', error);
      emitGameError(socket, 'تعذر الموافقة على الجولة.');
    }
  });

  socket.on('cancelCustomSetup', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه إلغاء الإعداد.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || room.roundPhase !== 'word_setup') {
        return;
      }

      resetRound(room);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('cancelCustomSetup failed:', error);
    }
  });

  socket.on('consentHints', async ({ allow }) => {
    try {
      const room = getRoomFromSocket(socket);
      const { session } = socket.data;

      if (!room || room.roundPhase !== 'guessing') {
        emitGameError(socket, 'التلميحات متاحة أثناء الحزر فقط.');
        return;
      }

      const hints = ensureHints(room);

      if (hints.enabled) {
        emitGameError(socket, 'التلميحات مفعّلة بالفعل.');
        return;
      }

      const isA = session.userId === room.fighterA?.userId;
      const isB = session.userId === room.fighterB?.userId;

      if (!isA && !isB) {
        emitGameError(socket, 'فقط المتبارزان يوافقان على التلميحات.');
        return;
      }

      const consented = allow !== false;

      if (isA) hints.consentA = consented;
      if (isB) hints.consentB = consented;

      io.to(room.code).emit('hintConsentUpdated', {
        consentA: hints.consentA,
        consentB: hints.consentB,
        bothConsented: hints.consentA && hints.consentB,
      });

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('consentHints failed:', error);
      emitGameError(socket, 'تعذر تسجيل الموافقة على التلميحات.');
    }
  });

  socket.on('approveHints', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يوافق على التلميحات.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || room.roundPhase !== 'guessing') {
        emitGameError(socket, 'لا يمكن تفعيل التلميحات الآن.');
        return;
      }

      const hints = ensureHints(room);

      if (!hints.consentA || !hints.consentB) {
        emitGameError(socket, 'يحتاج موافقة كلا المتبارزين أولاً.');
        return;
      }

      startAutomaticHints(io, room);
      io.to(room.code).emit('hintsEnabled', {
        message: 'تمت الموافقة — كل خصم يقدر يطلب تلميح بزر خاص فيه.',
      });
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('approveHints failed:', error);
      emitGameError(socket, 'تعذر تفعيل التلميحات.');
    }
  });

  socket.on('requestPersonalHint', async () => {
    try {
      const room = getRoomFromSocket(socket);
      const { session } = socket.data;

      if (!room || room.roundPhase !== 'guessing') {
        emitGameError(socket, 'طلب التلميح متاح أثناء الحزر فقط.');
        return;
      }

      const hints = ensureHints(room);

      if (!hints.enabled) {
        emitGameError(socket, 'التلميحات غير مفعّلة بعد.');
        return;
      }

      const isA = session.userId === room.fighterA?.userId;
      const isB = session.userId === room.fighterB?.userId;

      if (!isA && !isB) {
        emitGameError(socket, 'فقط المتبارزان يطلبان التلميحات.');
        return;
      }

      const maxRequests = hints.maxRequests ?? MAX_PERSONAL_HINTS;
      const used = isA ? hints.requestsA : hints.requestsB;

      if (used >= maxRequests) {
        emitGameError(socket, 'استهلكت كل طلبات التلميح لهذه الجولة.');
        return;
      }

      const secret = isA ? room.fighterB?.word : room.fighterA?.word;
      if (!secret) {
        emitGameError(socket, 'لا توجد كلمة سرية حالياً.');
        return;
      }

      const nextLevel = (isA ? hints.hintsForA.length : hints.hintsForB.length) + 1;
      const hint = await generateHint(secret, room.category, nextLevel);

      if (isA) {
        hints.requestsA += 1;
        hints.hintsForA.push(hint);
      } else {
        hints.requestsB += 1;
        hints.hintsForB.push(hint);
      }
      hints.level = Math.max(hints.hintsForA.length, hints.hintsForB.length);

      io.to(room.code).emit('hintsUpdated', {
        level: hints.level,
        message: `${session.username} طلب تلميحاً جديداً`,
      });

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('requestPersonalHint failed:', error);
      emitGameError(socket, 'تعذر إرسال التلميح.');
    }
  });

  socket.on('setRoundTimer', async ({ enabled, durationSec } = {}) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يتحكم بالمؤقت.');
        return;
      }

      const room = getRoomFromSocket(socket);
      if (!room) return;

      const clock = ensureRoundClock(room);
      const nextEnabled =
        typeof enabled === 'boolean' ? enabled : Boolean(clock.enabled);
      const nextDuration = Math.min(
        300,
        Math.max(15, Number(durationSec) || clock.durationSec || 60),
      );

      clock.enabled = nextEnabled;
      clock.durationSec = nextDuration;

      if (room.roundPhase === 'guessing' && nextEnabled) {
        startRoundClockIfEnabled(io, room);
        io.to(room.code).emit('roundTimerUpdated', {
          message: `المؤقت مفعّل: ${nextDuration} ثانية`,
        });
      } else {
        clearRoundClock(room);
        clock.enabled = nextEnabled;
        clock.durationSec = nextDuration;
        io.to(room.code).emit('roundTimerUpdated', {
          message: nextEnabled
            ? `المؤقت جاهز: ${nextDuration} ثانية (يبدأ مع الجولة القادمة)`
            : 'تم إيقاف المؤقت',
        });
      }

      await emitGameState(io, room.code);
    } catch (error) {
      console.error('setRoundTimer failed:', error);
      emitGameError(socket, 'تعذر تحديث المؤقت.');
    }
  });

  socket.on('rejectHints', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يرفض التلميحات.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room) return;

      resetHints(room);
      io.to(room.code).emit('hintsRejected', {
        message: 'المضيف رفض تفعيل التلميحات.',
      });
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('rejectHints failed:', error);
    }
  });

  socket.on('returnToLobby', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه الرجوع للوبي.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room) return;

      clearRoundResetTimer(room);
      clearHintTimer(room);
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

      await emitGameState(io, room.code);
      await emitRoomUpdated(io, room.code);
    } catch (error) {
      console.error('returnToLobby failed:', error);
      emitGameError(socket, 'تعذر الرجوع للوبي.');
    }
  });

  socket.on('sendGuess', async ({ message }) => {
    try {
      const { session } = socket.data;
      const room = getRoomFromSocket(socket);
      const sanitizedGuess = sanitizeGuess(message);

      if (!room || room.roundPhase !== 'guessing' || !room.fighterA || !room.fighterB) {
        return;
      }

      const isFighterA = session.userId === room.fighterA.userId;
      const isFighterB = session.userId === room.fighterB.userId;

      if (!isFighterA && !isFighterB) {
        emitGameError(socket, 'الجمهور يشاهد فقط — المتبارزان يحزران.');
        return;
      }

      if (!sanitizedGuess || !room.fighterA.word || !room.fighterB.word) {
        return;
      }

      const targetWord = isFighterA ? room.fighterB.word : room.fighterA.word;

      const chatMessage = {
        id: uuidv4(),
        userId: session.userId,
        username: session.username,
        message: sanitizedGuess,
        timestamp: Date.now(),
      };

      room.messages.push(chatMessage);
      io.to(room.code).emit('guessMessage', chatMessage);

      if (room.roundWinner) return;

      if (isCorrectGuess(sanitizedGuess, targetWord)) {
        session.points += 1;
        saveSession(session);

        room.roundWinner = {
          userId: session.userId,
          username: session.username,
        };
        room.revealedWordA = room.fighterA.word;
        room.revealedWordB = room.fighterB.word;
        room.roundPhase = null;
        clearHintTimer(room);
        clearRoundClock(room);
        room.hints.enabled = false;

        const reachedTarget = session.points >= room.pointsToWin;

        if (reachedTarget) {
          room.status = 'match_end';
          room.matchWinner = room.roundWinner;
        } else {
          room.status = 'round_end';
        }

        io.to(room.code).emit('roundWinner', {
          winner: room.roundWinner,
          wordA: room.revealedWordA,
          wordB: room.revealedWordB,
          points: session.points,
          pointsToWin: room.pointsToWin,
          matchOver: reachedTarget,
        });

        await emitRoomUpdated(io, room.code);
        await emitGameState(io, room.code);

        if (!reachedTarget) {
          scheduleNextRound(io, room);
        }
      }
    } catch (error) {
      console.error('sendGuess failed:', error);
    }
  });

  socket.on('skipRound', async () => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه تخطي الجولة.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || (room.status !== 'playing' && room.status !== 'round_end')) {
        emitGameError(socket, 'لا توجد جولة لتخطيها.');
        return;
      }

      resetRound(room);
      io.to(room.code).emit('roundSkipped');
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('skipRound failed:', error);
      emitGameError(socket, 'تعذر تخطي الجولة.');
    }
  });

  socket.on('kickPlayer', async ({ userId }) => {
    try {
      if (!isHost(socket)) {
        emitGameError(socket, 'فقط المضيف يمكنه طرد اللاعبين.');
        return;
      }

      const room = getRoomFromSocket(socket);

      if (!room || typeof userId !== 'string') {
        emitGameError(socket, 'تعذر طرد اللاعب.');
        return;
      }

      if (userId === socket.data.session.userId) {
        emitGameError(socket, 'لا يمكنك طرد نفسك.');
        return;
      }

      const targetSocket = await findSocketByUserId(io, room.code, userId);

      if (!targetSocket) {
        emitGameError(socket, 'اللاعب غير موجود في الغرفة.');
        return;
      }

      const targetSession = targetSocket.data.session;

      if (targetSession.isHost) {
        emitGameError(socket, 'لا يمكن طرد المضيف.');
        return;
      }

      targetSession.roomCode = null;
      saveSession(targetSession);

      targetSocket.emit('kicked', { message: 'تمت إزالتك من الغرفة بواسطة المضيف.' });
      await targetSocket.leave(room.code);

      if (
        room.fighterA?.userId === userId ||
        room.fighterB?.userId === userId
      ) {
        resetRound(room);
      }

      await emitRoomUpdated(io, room.code);
      await emitGameState(io, room.code);
    } catch (error) {
      console.error('kickPlayer failed:', error);
      emitGameError(socket, 'تعذر طرد اللاعب.');
    }
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export async function emitGameStateToSocket(io, socket) {
  const roomCode = socket.data.session?.roomCode;
  const room = roomCode ? getRoom(roomCode) : null;

  if (!room) return;

  const players = await getRoomPlayers(io, room.code);
  socket.emit(
    'gameState',
    buildPersonalizedGameState(
      room,
      players,
      socket.data.session?.userId,
      socket.data.session?.isHost === true,
    ),
  );
}
