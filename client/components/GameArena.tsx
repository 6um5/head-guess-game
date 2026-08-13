"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, LogOut } from "lucide-react";
import CreditsCredit from "@/components/CreditsCredit";
import CreditsFooter from "@/components/CreditsFooter";
import HelpButton from "@/components/HelpButton";
import DuelBoard from "@/components/game/DuelBoard";
import GameStatusBar from "@/components/game/GameStatusBar";
import GuessChat from "@/components/game/GuessChat";
import HintsPanel from "@/components/game/HintsPanel";
import HostControls from "@/components/game/HostControls";
import RoundStartedBanner from "@/components/game/RoundStartedBanner";
import WinOverlay from "@/components/game/WinOverlay";
import WordSetupPanel from "@/components/game/WordSetupPanel";
import type {
  ChatMessage,
  FighterInfo,
  GameStatus,
  HintsState,
  Player,
  PlayerRole,
  RoundClockState,
  RoundPhase,
  RoundWinner,
} from "@/types/game";

interface GameArenaProps {
  roomCode: string;
  players: Player[];
  gameStatus: GameStatus;
  roundPhase: RoundPhase | null;
  roundNumber: number;
  pointsToWin: number;
  category: string | null;
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  myRole: PlayerRole;
  myWord: string | null;
  wordA: string | null;
  wordB: string | null;
  canSeeBothWords: boolean;
  bothWordsReady: boolean;
  hints: HintsState;
  customMode: "words" | "numbers" | null;
  roundClock: RoundClockState;
  statusMessage: string | null;
  messages: ChatMessage[];
  currentUserId: string | null;
  isHost: boolean;
  canGuess: boolean;
  isGeneratingAI: boolean;
  showRoundStartedBanner: boolean;
  roundWinner: RoundWinner | null;
  matchWinner: RoundWinner | null;
  onStartDuel: (payload: {
    category: string;
    random?: boolean;
    playerAId?: string;
    playerBId?: string;
  }) => void;
  onStartCustomDuel: (payload: {
    random?: boolean;
    playerAId?: string;
    playerBId?: string;
    mode?: "words" | "numbers";
  }) => void;
  onProposeWord: (word: string) => void;
  onHostSetWord: (targetUserId: string, word: string) => void;
  onApproveCustomWords: () => void;
  onCancelCustomSetup: () => void;
  onConsentHints: (allow: boolean) => void;
  onApproveHints: () => void;
  onRejectHints: () => void;
  onRequestPersonalHint: () => void;
  onSetRoundTimer: (payload: {
    enabled: boolean;
    durationSec?: number;
  }) => void;
  onReturnToLobby: () => void;
  onSendGuess: (message: string) => void;
  onSkipRound: () => void;
  onKickPlayer: (userId: string) => void;
  onStartGame: (pointsToWin?: number) => void;
  onLeaveRoom: () => void;
  onOpenHelp: () => void;
}

export default function GameArena({
  roomCode,
  players,
  gameStatus,
  roundPhase,
  roundNumber,
  pointsToWin,
  category,
  fighterA,
  fighterB,
  myRole,
  myWord,
  wordA,
  wordB,
  canSeeBothWords,
  bothWordsReady,
  hints,
  customMode,
  roundClock,
  statusMessage,
  messages,
  currentUserId,
  isHost,
  canGuess,
  isGeneratingAI,
  showRoundStartedBanner,
  roundWinner,
  matchWinner,
  onStartDuel,
  onStartCustomDuel,
  onProposeWord,
  onHostSetWord,
  onApproveCustomWords,
  onCancelCustomSetup,
  onConsentHints,
  onApproveHints,
  onRejectHints,
  onRequestPersonalHint,
  onSetRoundTimer,
  onReturnToLobby,
  onSendGuess,
  onSkipRound,
  onKickPlayer,
  onStartGame,
  onLeaveRoom,
  onOpenHelp,
}: GameArenaProps) {
  const showWinOverlay =
    (gameStatus === "round_end" || gameStatus === "match_end") && !!roundWinner;
  const canReturnToLobby =
    isHost &&
    (gameStatus === "playing" ||
      gameStatus === "round_end" ||
      gameStatus === "match_end");

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="soft-pulse absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="soft-pulse absolute -right-10 bottom-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" style={{ animationDelay: "1.4s" }} />
        </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col pt-safe">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-rose-400/30 hover:text-rose-200 sm:text-xs"
              dir="rtl"
            >
              <LogOut className="h-3.5 w-3.5" />
              خروج
            </button>
            {canReturnToLobby && (
              <button
                type="button"
                onClick={onReturnToLobby}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] text-cyan-100 hover:border-cyan-300/50 sm:text-xs"
                dir="rtl"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                رجوع للوبي
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CreditsCredit textClassName="hidden text-[10px] text-slate-500 sm:block sm:text-xs" />
            <HelpButton onClick={onOpenHelp} />
          </div>
        </div>

        <GameStatusBar
          roomCode={roomCode}
          gameStatus={gameStatus}
          roundPhase={roundPhase}
          roundNumber={roundNumber}
          pointsToWin={pointsToWin}
          statusMessage={statusMessage}
          category={category}
          roundClock={roundClock}
        />

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <RoundStartedBanner
            category={category}
            visible={showRoundStartedBanner}
          />

          {roundPhase === "guessing" && (
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto pb-24">
                <DuelBoard
                  fighterA={fighterA}
                  fighterB={fighterB}
                  myRole={myRole}
                  myWord={myWord}
                  wordA={wordA}
                  wordB={wordB}
                  canSeeBothWords={canSeeBothWords}
                  category={category}
                  roundNumber={roundNumber}
                />
                <HintsPanel
                  hints={hints}
                  myRole={myRole}
                  isHost={isHost}
                  fighterA={fighterA}
                  fighterB={fighterB}
                  onConsent={onConsentHints}
                  onApprove={onApproveHints}
                  onReject={onRejectHints}
                  onRequestHint={onRequestPersonalHint}
                />
                {isHost && (
                  <HostControls
                    players={players}
                    currentUserId={currentUserId}
                    roundPhase={roundPhase}
                    pointsToWin={pointsToWin}
                    isGeneratingAI={isGeneratingAI}
                    roundClockEnabled={roundClock.enabled}
                    roundClockDurationSec={roundClock.durationSec}
                    onStartDuel={onStartDuel}
                    onStartCustomDuel={onStartCustomDuel}
                    onSkipRound={onSkipRound}
                    onKickPlayer={onKickPlayer}
                    onSetRoundTimer={onSetRoundTimer}
                  />
                )}
                {!canGuess && gameStatus === "playing" && (
                  <p
                    className="px-3 py-3 text-center text-xs text-slate-400"
                    dir="rtl"
                  >
                    أنت جمهور — افتح الشات لمشاهدة الحزر
                  </p>
                )}
              </div>
              <GuessChat
                messages={messages}
                currentUserId={currentUserId}
                onSendGuess={onSendGuess}
                disabled={gameStatus !== "playing" || !canGuess}
              />
            </div>
          )}

          {isHost && roundPhase === "selecting" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <HostControls
                players={players}
                currentUserId={currentUserId}
                roundPhase={roundPhase}
                pointsToWin={pointsToWin}
                isGeneratingAI={isGeneratingAI}
                roundClockEnabled={roundClock.enabled}
                roundClockDurationSec={roundClock.durationSec}
                onStartDuel={onStartDuel}
                onStartCustomDuel={onStartCustomDuel}
                onSkipRound={onSkipRound}
                onKickPlayer={onKickPlayer}
                onSetRoundTimer={onSetRoundTimer}
              />
            </div>
          )}

          {roundPhase === "selecting" && !isHost && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center p-4 text-center"
              dir="rtl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Clock className="h-7 w-7 text-violet-300" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white sm:text-xl">
                بانتظار المضيف
              </h2>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                المضيف يختار المتبارزين والتصنيف أو كلمة مخصصة.
              </p>
            </motion.section>
          )}

          {roundPhase === "word_setup" && (
            <WordSetupPanel
              fighterA={fighterA}
              fighterB={fighterB}
              myRole={myRole}
              myWord={myWord}
              wordA={wordA}
              wordB={wordB}
              isHost={isHost}
              canSeeBothWords={canSeeBothWords}
              bothWordsReady={bothWordsReady}
              customMode={customMode}
              onProposeWord={onProposeWord}
              onHostSetWord={onHostSetWord}
              onApprove={onApproveCustomWords}
              onCancel={onCancelCustomSetup}
            />
          )}

          {gameStatus === "match_end" && isHost && (
            <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-2 px-4 pb-safe">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onStartGame(pointsToWin)}
                className="touch-target w-full max-w-sm rounded-2xl bg-gradient-to-l from-emerald-500 to-teal-500 px-6 py-4 text-sm font-semibold text-white shadow-xl"
              >
                بدء مباراة جديدة
              </motion.button>
              <button
                type="button"
                onClick={onReturnToLobby}
                className="touch-target w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-200"
              >
                رجوع للوبي
              </button>
            </div>
          )}

          {showWinOverlay && roundWinner && (
            <WinOverlay
              winnerName={roundWinner.username}
              word={
                matchWinner
                  ? `فاز بالمباراة · أ:${wordA ?? "—"} / ب:${wordB ?? "—"}`
                  : `أ:${wordA ?? "—"} · ب:${wordB ?? "—"}`
              }
              points={
                players.find((p) => p.userId === roundWinner.userId)?.points ??
                null
              }
            />
          )}
        </main>

        <CreditsFooter />
      </div>
    </div>
  );
}
