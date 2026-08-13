"use client";

import { motion } from "framer-motion";
import { Brain, Clock3, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import type { GameStatus, RoundClockState, RoundPhase } from "@/types/game";

interface GameStatusBarProps {
  roomCode: string;
  gameStatus: GameStatus;
  roundPhase: RoundPhase | null;
  roundNumber: number;
  pointsToWin: number;
  statusMessage: string | null;
  category: string | null;
  roundClock: RoundClockState;
}

function getPhaseLabel(
  gameStatus: GameStatus,
  roundPhase: RoundPhase | null,
  category: string | null,
): string {
  if (gameStatus === "match_end") return "انتهت المباراة";
  if (gameStatus === "round_end") return "انتهت الجولة";
  if (roundPhase === "selecting") return "اختيار المتبارزين";
  if (roundPhase === "word_setup") return "إعداد كلمة/رقم مخصص";
  if (roundPhase === "guessing") {
    return category ? `مبارزة — ${category}` : "وقت الحزر";
  }
  return "قيد اللعب";
}

function formatSeconds(total: number) {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function GameStatusBar({
  roomCode,
  gameStatus,
  roundPhase,
  roundNumber,
  pointsToWin,
  statusMessage,
  category,
  roundClock,
}: GameStatusBarProps) {
  const phaseLabel = getPhaseLabel(gameStatus, roundPhase, category);
  const [remaining, setRemaining] = useState<number | null>(
    roundClock.remainingSec,
  );

  useEffect(() => {
    if (!roundClock.running || !roundClock.endsAt) {
      setRemaining(roundClock.remainingSec);
      return;
    }

    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((roundClock.endsAt! - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [roundClock.running, roundClock.endsAt, roundClock.remainingSec]);

  const timerUrgent = remaining !== null && remaining <= 10;

  return (
    <header className="shrink-0 border-b border-white/10 bg-slate-950/75 px-2.5 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 sm:h-10 sm:w-10"
            >
              <Brain className="h-4 w-4 text-violet-300 sm:h-5 sm:w-5" />
            </motion.div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white sm:text-base">
                {phaseLabel}
              </p>
              <p className="truncate text-xs text-slate-400">
                الغرفة{" "}
                <span className="font-mono tracking-wider text-violet-200">
                  {roomCode}
                </span>
                {" · "}
                جولة {roundNumber || 0}
                {" · "}
                <Trophy className="mr-1 inline h-3 w-3 text-amber-300" />
                للفوز: {pointsToWin}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {roundClock.enabled && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold sm:text-sm ${
                roundClock.running
                  ? timerUrgent
                    ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                    : "border-cyan-400/35 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
              dir="ltr"
            >
              <Clock3 className="h-3.5 w-3.5" />
              {roundClock.running && remaining !== null
                ? formatSeconds(remaining)
                : `${roundClock.durationSec}s`}
            </div>
          )}

          <motion.div
            key={statusMessage ?? phaseLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 sm:flex-none sm:text-sm"
            dir="auto"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate">{statusMessage ?? "حظاً موفقاً!"}</span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
