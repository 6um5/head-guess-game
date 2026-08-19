"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, LogOut, Trophy } from "lucide-react";
import { useState } from "react";
import CreditsCredit from "@/components/CreditsCredit";
import CreditsFooter from "@/components/CreditsFooter";
import HelpButton from "@/components/HelpButton";
import DuelBoard from "@/components/game/DuelBoard";
import GameStatusBar from "@/components/game/GameStatusBar";
import GuessChat from "@/components/game/GuessChat";
import HintsPanel from "@/components/game/HintsPanel";
import HostControls from "@/components/game/HostControls";
import LeaderboardPanel from "@/components/game/LeaderboardPanel";
import RoundStartedBanner from "@/components/game/RoundStartedBanner";
import WinOverlay from "@/components/game/WinOverlay";
import WordSetupPanel from "@/components/game/WordSetupPanel";
import type {
  ChatMessage,
  FighterInfo,
  GameStatus,
  GuessFeedback,
  HintsState,
  LeaderboardEntry,
  NextUpPair,
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
  leaderboard: LeaderboardEntry[];
  nextUp: NextUpPair | null;
  guessFeedback: GuessFeedback | null;
  onStartDuel: (payload: {
    category: string;
    random?: boolean;
    sequence?: boolean;
    playerAId?: string;
    playerBId?: string;
  }) => void;
  onStartCustomDuel: (payload: {
    random?: boolean;
    sequence?: boolean;
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
  onRequestPeerHint: () => void;
  onSendPeerHint: (text: string) => void;
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
  leaderboard,
  nextUp,
  guessFeedback,
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
  onRequestPeerHint,
  onSendPeerHint,
  onSetRoundTimer,
  onReturnToLobby,
  onSendGuess,
  onSkipRound,
  onKickPlayer,
  onStartGame,
  onLeaveRoom,
  onOpenHelp,
}: GameArenaProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const showWinOverlay =
    (gameStatus === "round_end" || gameStatus === "match_end") && !!roundWinner;

  // Trust the ids too, so a stale role never locks a real duelist out.
  const isDuelist =
    myRole === "fighterA" ||
    myRole === "fighterB" ||
    (!!currentUserId &&
      (currentUserId === fighterA?.userId || currentUserId === fighterB?.userId));
  const duelLabel =
    fighterA && fighterB ? `${fighterA.username} ضد ${fighterB.username}` : null;
  const chatDisabled = !canGuess && !(isDuelist && roundPhase === "guessing");
  const chatDisabledReason = !chatDisabled
    ? null
    : !isDuelist
      ? duelLabel
        ? `أنت جمهور هذه الجولة — المتبارزان ${duelLabel} هما فقط من يحزران.`
        : "أنت جمهور هذه الجولة — المتبارزان فقط يحزران."
      : roundPhase !== "guessing"
        ? "انتهت الجولة — انتظر بداية الجولة القادمة."
        : "الكتابة غير متاحة الآن.";
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
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 hover:border-amber-300/50 sm:text-xs"
              dir="rtl"
            >
              <Trophy className="h-3.5 w-3.5" />
              المتصدرون
            </button>
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
                  onRequestPeerHint={onRequestPeerHint}
                  onSendPeerHint={onSendPeerHint}
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
                    nextUp={nextUp}
                    onStartDuel={onStartDuel}
                    onStartCustomDuel={onStartCustomDuel}
                    onSkipRound={onSkipRound}
                    onKickPlayer={onKickPlayer}
                    onSetRoundTimer={onSetRoundTimer}
                  />
                )}
                {!isDuelist && gameStatus === "playing" && (
                  <p
                    className="px-3 py-3 text-center text-xs text-slate-400"
                    dir="rtl"
                  >
                    أنت جمهور هذه الجولة — افتح الشات لمتابعة الحزر
                    {duelLabel ? ` بين ${duelLabel}` : ""}
                  </p>
                )}
              </div>
              <GuessChat
                messages={messages}
                currentUserId={currentUserId}
                onSendGuess={onSendGuess}
                disabled={chatDisabled}
                disabledReason={chatDisabledReason}
                duelLabel={duelLabel}
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
                nextUp={nextUp}
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
              {nextUp && (
                <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                  الدور القادم: {nextUp.a.username} ضد {nextUp.b.username}
                </p>
              )}
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

          <AnimatePresence>
            {guessFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4"
              >
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
                    guessFeedback.level === "hot"
                      ? "bg-rose-500/90 text-white"
                      : "bg-amber-400/90 text-slate-950"
                  }`}
                  dir="rtl"
                >
                  {guessFeedback.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

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

      <LeaderboardPanel
        open={showLeaderboard}
        entries={leaderboard}
        currentUserId={currentUserId}
        pointsToWin={pointsToWin}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}
