"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Flame, Medal, Trophy, X } from "lucide-react";
import type { LeaderboardEntry } from "@/types/game";

interface LeaderboardPanelProps {
  open: boolean;
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  pointsToWin: number;
  onClose: () => void;
}

const MEDALS = ["text-amber-300", "text-slate-300", "text-orange-300"];

export default function LeaderboardPanel({
  open,
  entries,
  currentUserId,
  pointsToWin,
  onClose,
}: LeaderboardPanelProps) {
  const leader = entries[0] ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/80 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="max-h-[86dvh] w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/20 bg-slate-900 shadow-2xl"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-l from-amber-500/15 to-violet-500/10 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-white">
                  <Trophy className="h-5 w-5 text-amber-300" />
                  لوحة المتصدرين
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  الترتيب حسب النقاط ثم الجولات المكسوبة · حد الفوز {pointsToWin}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="touch-target rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[62dvh] overflow-y-auto px-4 py-4">
              {entries.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  لا توجد نتائج بعد — ابدأوا أول جولة!
                </p>
              ) : (
                <ol className="space-y-2">
                  {entries.map((entry, index) => {
                    const isMe = entry.userId === currentUserId;
                    const progress = Math.min(
                      100,
                      pointsToWin > 0
                        ? Math.round((entry.points / pointsToWin) * 100)
                        : 0,
                    );

                    return (
                      <motion.li
                        key={entry.userId}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`relative overflow-hidden rounded-2xl border px-3 py-3 ${
                          isMe
                            ? "border-violet-400/40 bg-violet-500/10"
                            : "border-white/10 bg-slate-950/50"
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500/15 to-transparent"
                          style={{ width: `${progress}%` }}
                          aria-hidden
                        />

                        <div className="relative flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold ${
                                MEDALS[index] ?? "text-slate-400"
                              }`}
                            >
                              {index < 3 ? (
                                <Medal className="h-4 w-4" />
                              ) : (
                                index + 1
                              )}
                            </span>

                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-1.5 font-medium text-white">
                                <span className="truncate">{entry.username}</span>
                                {entry.isHost && (
                                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                                )}
                                {isMe && (
                                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                                    أنت
                                  </span>
                                )}
                                {!entry.online && (
                                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                                    خارج
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <Flame className="h-3 w-3 text-orange-300" />
                                {entry.roundWins} جولة كاملة
                              </p>
                            </div>
                          </div>

                          <div className="text-left">
                            <p className="text-[10px] text-slate-500">نقاط</p>
                            <p className="font-mono text-xl font-bold text-emerald-300">
                              {entry.points}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </div>

            {leader && leader.points > 0 && (
              <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-amber-100/90">
                المتصدر حالياً: <strong>{leader.username}</strong> بـ{" "}
                {leader.points} نقطة و {leader.roundWins} جولة
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
