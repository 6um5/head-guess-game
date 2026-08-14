export interface SessionPayload {
  sessionId: string;
  userId: string;
}

export interface Player {
  userId: string;
  username: string;
  points: number;
  roundWins?: number;
  isHost: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  roundWins: number;
  isHost: boolean;
  online: boolean;
}

export interface RoomUpdatedPayload {
  roomCode: string;
  players: Player[];
  leaderboard?: LeaderboardEntry[];
}

export interface RoomErrorPayload {
  message: string;
}

export type AppScreen = "home" | "lobby" | "game";

export type GameStatus = "waiting" | "playing" | "round_end" | "match_end";
export type RoundPhase = "selecting" | "word_setup" | "guessing";
export type PlayerRole = "fighterA" | "fighterB" | "audience";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface RoundWinner {
  userId: string;
  username: string;
}

export interface FighterInfo {
  userId: string;
  username: string;
  wordReady?: boolean;
}

export interface GameStatePayload {
  roomCode?: string;
  status: GameStatus;
  roundPhase: RoundPhase | null;
  roundNumber: number;
  pointsToWin: number;
  category: string | null;
  isCustomRound: boolean;
  customMode: "words" | "numbers" | null;
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  myRole: PlayerRole;
  myWord: string | null;
  wordA: string | null;
  wordB: string | null;
  canSeeBothWords: boolean;
  bothWordsReady: boolean;
  hints: HintsState;
  roundClock: RoundClockState;
  messages: ChatMessage[];
  roundWinner: RoundWinner | null;
  matchWinner: RoundWinner | null;
  players: Player[];
  leaderboard?: LeaderboardEntry[];
  nextUp?: NextUpPair | null;
}

export interface RoundStartedPayload {
  category: string;
  roundNumber: number;
  fighterA: FighterInfo;
  fighterB: FighterInfo;
  message: string;
}

export interface RoundWinnerPayload {
  winner: RoundWinner;
  wordA: string;
  wordB: string;
  points: number;
  pointsToWin: number;
  matchOver: boolean;
}

export interface HintItem {
  text: string;
  source: "ai" | "peer";
  from?: string | null;
}

export interface HintsState {
  consentA: boolean;
  consentB: boolean;
  bothConsented: boolean;
  hostApproved: boolean;
  enabled: boolean;
  myHints: HintItem[];
  hintsForA: HintItem[];
  hintsForB: HintItem[];
  level: number;
  maxRequests: number;
  myRequests: number;
  canRequestHint: boolean;
  waitingForOpponentHint: boolean;
  opponentWaitingForMyHint: boolean;
  opponentName: string | null;
}

export interface NextUpPair {
  a: { userId: string; username: string };
  b: { userId: string; username: string };
}

export interface GuessFeedback {
  level: "hot" | "warm";
  message: string;
}

export interface RoundClockState {
  enabled: boolean;
  durationSec: number;
  endsAt: number | null;
  running: boolean;
  remainingSec: number | null;
}

export interface GameErrorPayload {
  message: string;
}

export interface KickedPayload {
  message: string;
}

export const AI_CATEGORIES = [
  { id: "شخصيات عربية مشهورة", label: "شخصيات عربية", icon: "🌟" },
  { id: "شخصيات عراقية مشهورة", label: "شخصيات عراقية", icon: "🇮🇶" },
  { id: "فواكه", label: "فواكه", icon: "🍎" },
  { id: "جماد", label: "جماد", icon: "🪑" },
  { id: "أكلات شعبية", label: "أكلات شعبية", icon: "🍲" },
  { id: "أرقام سهلة", label: "أرقام (حزر المليار)", icon: "🔢" },
] as const;

export const CREDITS_TEXT = "تم التطوير بالكامل بواسطة علوش زياد";
