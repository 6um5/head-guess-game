"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import GameArena from "@/components/GameArena";
import HelpButton from "@/components/HelpButton";
import Home from "@/components/Home";
import HowToPlayModal from "@/components/HowToPlayModal";
import Lobby from "@/components/Lobby";
import EyushSecret from "@/components/secret/EyushSecret";
import { useGameSocket } from "@/hooks/useGameSocket";

interface GameAppProps {
  initialRoomCode?: string | null;
}

export default function GameApp({ initialRoomCode = null }: GameAppProps) {
  const [showHelp, setShowHelp] = useState(false);
  const {
    screen,
    session,
    roomCode,
    players,
    isHost,
    error,
    isConnected,
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
    messages,
    roundWinner,
    matchWinner,
    statusMessage,
    showRoundStartedBanner,
    isGeneratingAI,
    canGuess,
    currentUserId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updatePointsToWin,
    startDuel,
    startCustomDuel,
    proposeWord,
    hostSetWord,
    approveCustomWords,
    cancelCustomSetup,
    consentHints,
    approveHints,
    rejectHints,
    requestPersonalHint,
    setRoundTimer,
    returnToLobby,
    sendGuess,
    skipRound,
    kickPlayer,
    clearError,
  } = useGameSocket();

  return (
    <>
      <HowToPlayModal open={showHelp} onClose={() => setShowHelp(false)} />
      <EyushSecret />

      {screen === "game" && roomCode ? (
        <div className="relative">
          {error && (
            <div className="absolute inset-x-0 top-0 z-40 px-3 pt-safe sm:px-4">
              <p
                className="mx-auto mt-12 max-w-xl rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-center text-sm text-rose-100"
                dir="rtl"
              >
                {error}
              </p>
            </div>
          )}
          <GameArena
            roomCode={roomCode}
            players={players}
            gameStatus={gameStatus}
            roundPhase={roundPhase}
            roundNumber={roundNumber}
            pointsToWin={pointsToWin}
            category={category}
            fighterA={fighterA}
            fighterB={fighterB}
            myRole={myRole}
            myWord={myWord}
            wordA={wordA}
            wordB={wordB}
            canSeeBothWords={canSeeBothWords}
            bothWordsReady={bothWordsReady}
            hints={hints}
            customMode={customMode}
            roundClock={roundClock}
            statusMessage={statusMessage}
            messages={messages}
            currentUserId={currentUserId}
            isHost={isHost}
            canGuess={canGuess}
            isGeneratingAI={isGeneratingAI}
            showRoundStartedBanner={showRoundStartedBanner}
            roundWinner={roundWinner}
            matchWinner={matchWinner}
            onStartDuel={startDuel}
            onStartCustomDuel={startCustomDuel}
            onProposeWord={proposeWord}
            onHostSetWord={hostSetWord}
            onApproveCustomWords={approveCustomWords}
            onCancelCustomSetup={cancelCustomSetup}
            onConsentHints={consentHints}
            onApproveHints={approveHints}
            onRejectHints={rejectHints}
            onRequestPersonalHint={requestPersonalHint}
            onSetRoundTimer={setRoundTimer}
            onReturnToLobby={returnToLobby}
            onSendGuess={sendGuess}
            onSkipRound={skipRound}
            onKickPlayer={kickPlayer}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
            onOpenHelp={() => setShowHelp(true)}
          />
        </div>
      ) : (
        <div className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-x-hidden px-safe pb-safe pt-safe">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="soft-pulse absolute -left-16 top-8 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl sm:h-72 sm:w-72" />
            <div className="soft-pulse absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl sm:h-80 sm:w-80" style={{ animationDelay: "1.2s" }} />
            <div className="float-slow absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
          </div>

          <div className="absolute left-3 top-3 z-20 sm:left-4 sm:top-4" style={{ marginTop: "env(safe-area-inset-top)" }}>
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>

          <div className="relative z-10 w-full max-w-5xl px-3 py-6 pt-14 sm:px-4 sm:py-8 md:px-6">
            <AnimatePresence mode="wait">
              {screen === "home" ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto flex w-full justify-center"
                >
                  <Home
                    onCreateRoom={createRoom}
                    onJoinRoom={joinRoom}
                    error={error}
                    onClearError={clearError}
                    isConnected={isConnected}
                    initialRoomCode={initialRoomCode}
                  />
                </motion.div>
              ) : (
                roomCode && (
                  <motion.div
                    key="lobby"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35 }}
                    className="mx-auto flex w-full justify-center"
                  >
                    <Lobby
                      roomCode={roomCode}
                      players={players}
                      isHost={isHost}
                      currentUserId={session?.userId ?? null}
                      pointsToWin={pointsToWin}
                      onPointsToWinChange={updatePointsToWin}
                      onStartGame={startGame}
                      onLeaveRoom={leaveRoom}
                      error={error}
                    />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
