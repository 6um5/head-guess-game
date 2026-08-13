import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { addRoom, getAllRooms, getRoom, hasRoom } from './roomStore.js';
import { createSession, getAllSessions, getSession, saveSession } from './sessionStore.js';

const STATE_FILE = join(dirname(fileURLToPath(import.meta.url)), '../../data/state.json');

let saveTimer = null;

/**
 * @param {import('../types/room.js').Room} room
 */
function serializeRoom(room) {
  return {
    code: room.code,
    status: room.status,
    roundPhase: room.roundPhase,
    roundNumber: room.roundNumber,
    pointsToWin: room.pointsToWin,
    fighterA: room.fighterA,
    fighterB: room.fighterB,
    category: room.category,
    isCustomRound: room.isCustomRound,
    customMode: room.customMode,
    hints: {
      ...room.hints,
      timer: null,
    },
    roundClock: {
      enabled: Boolean(room.roundClock?.enabled),
      durationSec: room.roundClock?.durationSec ?? 60,
      endsAt: null,
      running: false,
      handle: null,
    },
    messages: room.messages,
    roundWinner: room.roundWinner,
    matchWinner: room.matchWinner,
    revealedWordA: room.revealedWordA,
    revealedWordB: room.revealedWordB,
    hostUserId: room.hostUserId ?? null,
    lastActivityAt: room.lastActivityAt ?? Date.now(),
    members: room.members ?? {},
  };
}

export function loadPersistedState() {
  try {
    const raw = readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    for (const session of parsed.sessions ?? []) {
      if (!session?.sessionId || !session?.userId || getSession(session.sessionId)) {
        continue;
      }
      const created = createSession(session.sessionId, session.userId);
      created.username = session.username ?? null;
      created.roomCode = session.roomCode ?? null;
      created.points = Number(session.points) || 0;
      created.isHost = Boolean(session.isHost);
      saveSession(created);
    }

    for (const saved of parsed.rooms ?? []) {
      if (!saved?.code || hasRoom(saved.code)) {
        continue;
      }
      addRoom(saved.code);
      const room = getRoom(saved.code);
      if (!room) continue;
      Object.assign(room, serializeRoom({ ...room, ...saved }));
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Could not load persisted rooms:', error?.message ?? error);
    }
  }
}

export function saveGameState() {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true });
    writeFileSync(
      STATE_FILE,
      JSON.stringify(
        {
          rooms: [...getAllRooms().values()].map(serializeRoom),
          sessions: [...getAllSessions().values()],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.warn('Could not persist rooms:', error?.message ?? error);
  }
}

export function schedulePersist() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(saveGameState, 400);
}
