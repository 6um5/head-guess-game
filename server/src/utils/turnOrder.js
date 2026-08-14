import { ensureDuelStats, pairKey } from '../store/roomStore.js';

/**
 * @typedef {import('../types/player.js').RoomPlayer} RoomPlayer
 * @typedef {import('../types/room.js').Room} Room
 */

/**
 * @param {RoomPlayer[]} players
 * @returns {RoomPlayer[]}
 */
export function uniquePlayers(players) {
  const seen = new Set();
  /** @type {RoomPlayer[]} */
  const unique = [];

  for (const player of Array.isArray(players) ? players : []) {
    if (!player?.userId || seen.has(player.userId)) continue;
    seen.add(player.userId);
    unique.push(player);
  }

  return unique;
}

/**
 * Fair rotation: players who fought the fewest duels (and longest ago) go next,
 * and the exact same pair is avoided twice in a row when other players exist.
 *
 * @param {Room} room
 * @param {RoomPlayer[]} players
 * @returns {[RoomPlayer, RoomPlayer] | null}
 */
export function pickSequencePair(room, players) {
  const roster = uniquePlayers(players);

  if (roster.length < 2) {
    return null;
  }

  const stats = ensureDuelStats(room);
  const ranked = roster
    .map((player, index) => {
      const entry = stats[player.userId] ?? { duels: 0, lastRound: -1 };
      return {
        player,
        index,
        duels: entry.duels ?? 0,
        lastRound: entry.lastRound ?? -1,
      };
    })
    .sort(
      (a, b) => a.duels - b.duels || a.lastRound - b.lastRound || a.index - b.index,
    );

  const first = ranked[0];
  let second = ranked[1];

  if (
    roster.length > 2 &&
    room.lastPairKey &&
    pairKey(first.player.userId, second.player.userId) === room.lastPairKey &&
    ranked[2]
  ) {
    second = ranked[2];
  }

  return [first.player, second.player];
}

/**
 * Read-only preview used to show players who is up next.
 * @param {Room} room
 * @param {RoomPlayer[]} players
 */
export function previewNextPair(room, players) {
  const pair = pickSequencePair(room, players);

  if (!pair) {
    return null;
  }

  return {
    a: { userId: pair[0].userId, username: pair[0].username },
    b: { userId: pair[1].userId, username: pair[1].username },
  };
}
