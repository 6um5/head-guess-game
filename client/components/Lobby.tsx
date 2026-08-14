"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Copy, Crown, Link2, Play, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import CreditsFooter from "@/components/CreditsFooter";
import LeaderboardPanel from "@/components/game/LeaderboardPanel";
import InteractiveButton from "@/components/ui/InteractiveButton";
import type { LeaderboardEntry, NextUpPair, Player } from "@/types/game";

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  currentUserId: string | null;
  pointsToWin: number;
  leaderboard: LeaderboardEntry[];
  nextUp: NextUpPair | null;
  onPointsToWinChange: (value: number) => void;
  onStartGame: (pointsToWin: number) => void;
  onLeaveRoom: () => void;
  error: string | null;
}

export default function Lobby({
  roomCode,
  players,
  isHost,
  currentUserId,
  pointsToWin,
  leaderboard,
  nextUp,
  onPointsToWinChange,
  onStartGame,
  onLeaveRoom,
  error,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const roomLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/${roomCode}`;
  }, [roomCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <motion.div
      className="relative w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      dir="rtl"
    >
      <div className="mb-4 flex justify-start">
        <InteractiveButton variant="ghost" onClick={onLeaveRoom} className="!py-2 text-xs sm:text-sm">
          <ArrowRight className="h-4 w-4" />
          رجوع للرئيسية
        </InteractiveButton>
      </div>

      <div className="mb-6 text-center sm:mb-8">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-slate-400 sm:text-xs">
          كود الغرفة
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
          <motion.span
            key={roomCode}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-mono text-4xl font-bold tracking-[0.2em] text-white sm:text-5xl lg:text-6xl"
          >
            {roomCode}
          </motion.span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCopy}
            className="pressable flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 sm:h-12 sm:w-12"
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </motion.button>
        </div>
        <p className="mt-3 text-xs text-slate-400 sm:text-sm">
          شارك الكود أو الرابط المباشر — الدخول محمي بالكود فقط
        </p>
        <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <InteractiveButton
            variant="secondary"
            onClick={handleCopyLink}
            className="!py-2 text-xs sm:text-sm"
          >
            <Link2 className="h-4 w-4" />
            {copiedLink ? "تم نسخ الرابط" : "نسخ رابط الغرفة"}
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            onClick={() => setShowLeaderboard(true)}
            className="!py-2 text-xs sm:text-sm"
          >
            <Trophy className="h-4 w-4" />
            المتصدرون
          </InteractiveButton>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-4 w-4 text-violet-300" />
            <span className="text-sm font-medium">{players.length} لاعب متصل</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 sm:text-xs">
            <Trophy className="h-3.5 w-3.5" />
            مبارزة 1 ضد 1 · جولات متسلسلة
          </div>
        </div>

        <ul className="space-y-2 sm:space-y-3">
          <AnimatePresence mode="popLayout">
            {players.map((player) => {
              const isMe = player.userId === currentUserId;
              return (
                <motion.li
                  key={player.userId}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 sm:rounded-2xl sm:px-4 ${
                    player.isHost
                      ? "border-amber-400/30 bg-amber-500/10"
                      : "border-white/8 bg-slate-950/40"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm font-bold text-violet-200">
                      {player.username.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium text-white">
                        <span className="truncate">{player.username}</span>
                        {isMe && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                            أنت
                          </span>
                        )}
                      </p>
                      {player.isHost && (
                        <p className="flex items-center gap-1 text-xs text-amber-300/90">
                          <Crown className="h-3 w-3" />
                          المضيف
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500">نقاط</p>
                    <p className="font-mono text-lg font-semibold text-violet-200">
                      {player.points}
                    </p>
                    {(player.roundWins ?? 0) > 0 && (
                      <p className="text-[10px] text-amber-300/80">
                        {player.roundWins} جولة
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {nextUp && players.length >= 2 && (
          <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-center text-xs text-emerald-100 sm:text-sm">
            أول مبارزة بالدور: {nextUp.a.username} ضد {nextUp.b.username}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        {isHost && (
          <div className="mt-5 space-y-3 sm:mt-6">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                حد الفوز (كم نقطة يفوز اللاعب؟)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={pointsToWin}
                  onChange={(event) =>
                    onPointsToWinChange(Number(event.target.value))
                  }
                  className="w-full accent-emerald-500"
                />
                <motion.span
                  key={pointsToWin}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-10 text-center font-mono text-lg font-bold text-emerald-300"
                >
                  {pointsToWin}
                </motion.span>
              </div>
            </label>

            <InteractiveButton
              variant="success"
              fullWidth
              disabled={players.length < 2}
              onClick={() => onStartGame(pointsToWin)}
              className="!py-4"
            >
              <Play className="h-5 w-5 fill-current" />
              ابدأ المباراة
            </InteractiveButton>
          </div>
        )}

        {!isHost && (
          <p className="mt-5 text-center text-xs text-slate-400 sm:text-sm">
            بانتظار المضيف… حد الفوز: {pointsToWin} نقطة
          </p>
        )}
      </div>

      <div className="mt-6">
        <CreditsFooter />
      </div>

      <LeaderboardPanel
        open={showLeaderboard}
        entries={leaderboard}
        currentUserId={currentUserId}
        pointsToWin={pointsToWin}
        onClose={() => setShowLeaderboard(false)}
      />
    </motion.div>
  );
}
