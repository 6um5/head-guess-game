/**
 * @typedef {'waiting' | 'playing' | 'round_end' | 'match_end'} GameStatus
 * @typedef {'selecting' | 'word_setup' | 'guessing'} RoundPhase
 *
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} username
 * @property {string} message
 * @property {number} timestamp
 *
 * @typedef {Object} RoundWinner
 * @property {string} userId
 * @property {string} username
 *
 * @typedef {Object} Fighter
 * @property {string} userId
 * @property {string} username
 * @property {string | null} word
 * @property {boolean} wordReady
 *
 * @typedef {Object} HintState
 * @property {boolean} consentA
 * @property {boolean} consentB
 * @property {boolean} hostApproved
 * @property {boolean} enabled
 * @property {string[]} hintsForA
 * @property {string[]} hintsForB
 * @property {number} level
 * @property {number} requestsA
 * @property {number} requestsB
 * @property {number} maxRequests
 * @property {ReturnType<typeof setTimeout> | null} timer
 *
 * @typedef {Object} RoundClock
 * @property {boolean} enabled
 * @property {number} durationSec
 * @property {number | null} endsAt
 * @property {boolean} running
 * @property {ReturnType<typeof setTimeout> | null} handle
 *
 * @typedef {Object} Room
 * @property {string} code
 * @property {GameStatus} status
 * @property {RoundPhase | null} roundPhase
 * @property {number} roundNumber
 * @property {number} pointsToWin
 * @property {Fighter | null} fighterA
 * @property {Fighter | null} fighterB
 * @property {string | null} category
 * @property {boolean} isCustomRound
 * @property {'words' | 'numbers' | null} customMode
 * @property {HintState} hints
 * @property {RoundClock} roundClock
 * @property {ChatMessage[]} messages
 * @property {RoundWinner | null} roundWinner
 * @property {RoundWinner | null} matchWinner
 * @property {string | null} revealedWordA
 * @property {string | null} revealedWordB
 * @property {ReturnType<typeof setTimeout> | null} roundResetTimer
 * @property {string | null} hostUserId
 * @property {number} lastActivityAt
 * @property {Record<string, RoomMember>} members
 *
 * @typedef {Object} RoomMember
 * @property {string} userId
 * @property {string} username
 * @property {number} points
 * @property {boolean} isHost
 * @property {number} lastSeen
 */

export {};
