"use client";

import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  ListOrdered,
  Loader2,
  PencilLine,
  Settings2,
  Shuffle,
  SkipForward,
  Timer,
  UserMinus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AI_CATEGORIES, type NextUpPair, type Player } from "@/types/game";

interface HostControlsProps {
  players: Player[];
  currentUserId: string | null;
  roundPhase: "selecting" | "word_setup" | "guessing" | null;
  isGeneratingAI: boolean;
  roundClockEnabled: boolean;
  roundClockDurationSec: number;
  nextUp: NextUpPair | null;
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
  onSkipRound: () => void;
  onKickPlayer: (userId: string) => void;
  onSetRoundTimer: (payload: {
    enabled: boolean;
    durationSec?: number;
  }) => void;
}

type PickMode = "sequence" | "random" | "manual";

const MODES: { id: PickMode; label: string; hint: string }[] = [
  { id: "sequence", label: "بالدور", hint: "توزيع عادل بين الجميع" },
  { id: "random", label: "عشوائي", hint: "اختيار عشوائي كل جولة" },
  { id: "manual", label: "يدوي", hint: "تختار اللاعبين بنفسك" },
];

export default function HostControls({
  players,
  currentUserId,
  roundPhase,
  isGeneratingAI,
  roundClockEnabled,
  roundClockDurationSec,
  nextUp,
  onStartDuel,
  onStartCustomDuel,
  onSkipRound,
  onKickPlayer,
  onSetRoundTimer,
}: HostControlsProps) {
  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState<PickMode>("sequence");
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(roundClockEnabled);
  const [timerDuration, setTimerDuration] = useState(roundClockDurationSec);

  useEffect(() => {
    setTimerEnabled(roundClockEnabled);
    setTimerDuration(roundClockDurationSec);
  }, [roundClockEnabled, roundClockDurationSec]);

  useEffect(() => {
    if (!isGeneratingAI) setLoadingCategory(null);
  }, [isGeneratingAI]);

  useEffect(() => {
    if (roundPhase === "selecting") {
      setFighterAId(null);
      setFighterBId(null);
      setPickMode("sequence");
      setShowExtras(false);
    }
  }, [roundPhase]);

  const enoughPlayers = players.length >= 2;
  const canLaunch =
    pickMode === "manual" ? Boolean(fighterAId && fighterBId) : enoughPlayers;

  const kickablePlayers = players.filter(
    (player) => player.userId !== currentUserId && !player.isHost,
  );

  const handlePickPlayer = (userId: string) => {
    if (isGeneratingAI) return;
    if (!fighterAId || fighterAId === userId) {
      setFighterAId(userId);
      if (fighterBId === userId) setFighterBId(null);
      return;
    }
    setFighterBId(userId);
  };

  const pairPayload = () => {
    if (pickMode === "sequence") return { sequence: true as const };
    if (pickMode === "random") return { random: true as const };
    return { playerAId: fighterAId!, playerBId: fighterBId! };
  };

  const slotName = (slot: "a" | "b") => {
    if (pickMode === "sequence") {
      return (slot === "a" ? nextUp?.a : nextUp?.b)?.username ?? "بالدور";
    }
    if (pickMode === "random") return "عشوائي";
    const id = slot === "a" ? fighterAId : fighterBId;
    return players.find((player) => player.userId === id)?.username ?? "—";
  };

  const launchDuel = (category: string) => {
    if (isGeneratingAI || !canLaunch) return;
    setLoadingCategory(category);
    onStartDuel({ category, ...pairPayload() });
  };

  const launchCustom = (mode: "words" | "numbers") => {
    if (isGeneratingAI || !canLaunch) return;
    onStartCustomDuel({ ...pairPayload(), mode });
  };

  const timerRow = (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
          <Timer className="h-3.5 w-3.5" />
          مؤقت الجولة
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTimerEnabled(true);
              onSetRoundTimer({ enabled: true, durationSec: timerDuration });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              timerEnabled
                ? "bg-emerald-500 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            تشغيل
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerEnabled(false);
              onSetRoundTimer({ enabled: false, durationSec: timerDuration });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              !timerEnabled
                ? "bg-rose-500/80 text-white"
                : "border border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            إيقاف
          </button>
        </div>
      </div>
      <input
        type="range"
        min={15}
        max={180}
        step={15}
        value={timerDuration}
        onChange={(event) => {
          const value = Number(event.target.value);
          setTimerDuration(value);
          onSetRoundTimer({ enabled: timerEnabled, durationSec: value });
        }}
        className="w-full accent-emerald-500"
      />
      <p className="mt-1 text-[11px] text-slate-400">{timerDuration} ثانية</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
      {roundPhase === "selecting" && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            dir="rtl"
          >
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/25 text-xs text-violet-100">
                ١
              </span>
              من يتبارز؟
            </p>

            <div className="mb-3 grid grid-cols-3 gap-2">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  disabled={isGeneratingAI || (mode.id !== "manual" && !enoughPlayers)}
                  onClick={() => {
                    setPickMode(mode.id);
                    setFighterAId(null);
                    setFighterBId(null);
                  }}
                  className={`touch-target rounded-xl px-2 py-2.5 text-xs font-semibold transition disabled:opacity-45 sm:text-sm ${
                    pickMode === mode.id
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-950/30"
                      : "border border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/25"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {mode.id === "sequence" && <ListOrdered className="h-4 w-4" />}
                    {mode.id === "random" && <Shuffle className="h-4 w-4" />}
                    {mode.id === "manual" && <Users className="h-4 w-4" />}
                    {mode.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="mb-3 text-[11px] text-slate-400">
              {MODES.find((mode) => mode.id === pickMode)?.hint}
            </p>

            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:text-sm">
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-2 py-2">
                <p className="text-[10px] text-slate-400">اللاعب أ</p>
                <p className="truncate font-semibold text-white">{slotName("a")}</p>
              </div>
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2 py-2">
                <p className="text-[10px] text-slate-400">اللاعب ب</p>
                <p className="truncate font-semibold text-white">{slotName("b")}</p>
              </div>
            </div>

            {pickMode === "manual" && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {players.map((player) => {
                  const isA = player.userId === fighterAId;
                  const isB = player.userId === fighterBId;
                  return (
                    <li key={player.userId}>
                      <button
                        type="button"
                        disabled={isGeneratingAI}
                        onClick={() => handlePickPlayer(player.userId)}
                        className={`pressable flex w-full items-center justify-between rounded-xl border px-3 py-2.5 ${
                          isA
                            ? "border-violet-400/50 bg-violet-500/20"
                            : isB
                              ? "border-cyan-400/50 bg-cyan-500/20"
                              : "border-white/10 bg-slate-950/50 hover:border-white/25"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                            {player.username.charAt(0)}
                          </span>
                          <span className="truncate text-sm text-white">
                            {player.username}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-300">
                          {player.isHost && (
                            <Crown className="inline h-3.5 w-3.5 text-amber-300" />
                          )}
                          {isA ? " أ" : isB ? " ب" : ` ${player.points}ن`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4"
            dir="rtl"
          >
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/25 text-xs text-violet-100">
                ٢
              </span>
              اختر التصنيف وابدأ
            </p>
            <p className="mb-3 text-[11px] text-slate-400">
              {canLaunch
                ? "الذكاء الاصطناعي يختار كلمتين سهلتين ومشهورتين"
                : "اختر اللاعبين أولاً"}
            </p>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {AI_CATEGORIES.map((category) => {
                const isLoading = loadingCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    disabled={isGeneratingAI || !canLaunch}
                    onClick={() => launchDuel(category.id)}
                    className={`pressable flex min-h-[3.4rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition disabled:opacity-45 ${
                      isLoading
                        ? "border-violet-400/60 bg-violet-500/30"
                        : "border-white/10 bg-slate-950/50 hover:border-violet-400/40 hover:bg-violet-500/15"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                    ) : (
                      <span className="text-lg">{category.icon}</span>
                    )}
                    <span className="text-[11px] font-semibold leading-tight sm:text-xs">
                      {category.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          <section
            className="rounded-2xl border border-white/10 bg-white/[0.03]"
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => setShowExtras((value) => !value)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Settings2 className="h-4 w-4 text-slate-400" />
                خيارات إضافية
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] text-slate-400">
                المؤقت وكلمة مخصصة
                {showExtras ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>

            {showExtras && (
              <div className="space-y-3 border-t border-white/10 p-4">
                {timerRow}

                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                    <PencilLine className="h-3.5 w-3.5" />
                    كلمة أو رقم مخصص
                  </p>
                  <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
                    كل خصم يكتب سرّه بنفسه، وأنت توافق للبدء.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!canLaunch || isGeneratingAI}
                      onClick={() => launchCustom("words")}
                      className="pressable rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-center text-xs font-semibold text-slate-200 transition hover:border-violet-400/40 disabled:opacity-45"
                    >
                      ✍️ كلمة يدوية
                    </button>
                    <button
                      type="button"
                      disabled={!canLaunch || isGeneratingAI}
                      onClick={() => launchCustom("numbers")}
                      className="pressable rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-center text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 disabled:opacity-45"
                    >
                      🔢 رقم يدوي
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {roundPhase === "guessing" && (
        <section
          className="rounded-2xl border border-white/10 bg-white/[0.04]"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-2 p-3">
            <button
              type="button"
              onClick={onSkipRound}
              className="pressable inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 sm:text-sm"
            >
              <SkipForward className="h-4 w-4" />
              تخطي الجولة
            </button>
            <button
              type="button"
              onClick={() => setShowTools((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 sm:text-sm"
            >
              <Settings2 className="h-4 w-4" />
              أدوات المضيف
              {showTools ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {showTools && (
            <div className="space-y-3 border-t border-white/10 p-3">
              {timerRow}

              {kickablePlayers.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] text-slate-400">طرد لاعب</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {kickablePlayers.map((player) => (
                      <li key={player.userId}>
                        <button
                          type="button"
                          onClick={() => onKickPlayer(player.userId)}
                          className="pressable flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5"
                        >
                          <span className="truncate text-sm text-white">
                            {player.username}
                          </span>
                          <UserMinus className="h-4 w-4 text-rose-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
