"use client";

import { motion } from "framer-motion";
import {
  Crown,
  ListOrdered,
  Loader2,
  PencilLine,
  Shuffle,
  SkipForward,
  Sparkles,
  Swords,
  Timer,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AI_CATEGORIES, type NextUpPair, type Player } from "@/types/game";

interface HostControlsProps {
  players: Player[];
  currentUserId: string | null;
  roundPhase: "selecting" | "word_setup" | "guessing" | null;
  pointsToWin: number;
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

type PickMode = "manual" | "random" | "sequence";

export default function HostControls({
  players,
  currentUserId,
  roundPhase,
  pointsToWin,
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
  const [customPick, setCustomPick] = useState<"words" | "numbers" | null>(
    null,
  );
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
      setCustomPick(null);
    }
  }, [roundPhase]);

  const kickablePlayers = players.filter(
    (player) => player.userId !== currentUserId && !player.isHost,
  );

  const handlePickPlayer = (userId: string) => {
    if (isGeneratingAI) return;
    setPickMode("manual");
    if (!fighterAId || fighterAId === userId) {
      setFighterAId(userId);
      if (fighterBId === userId) setFighterBId(null);
      return;
    }
    setFighterBId(userId);
  };

  const enoughPlayers = players.length >= 2;
  const canLaunch =
    pickMode === "manual"
      ? Boolean(fighterAId && fighterBId)
      : enoughPlayers;

  const pairPayload = () => {
    if (pickMode === "sequence") return { sequence: true as const };
    if (pickMode === "random") return { random: true as const };
    return { playerAId: fighterAId!, playerBId: fighterBId! };
  };

  const slotLabel = (slot: "a" | "b") => {
    if (pickMode === "sequence") {
      const player = slot === "a" ? nextUp?.a : nextUp?.b;
      return player?.username ?? "بالدور";
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

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
      {roundPhase === "selecting" && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 sm:p-5"
            dir="rtl"
          >
            <div className="mb-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-100 sm:text-base">
                <Swords className="h-4 w-4" />
                اختر المتبارزين (1 ضد 1)
              </p>
              <p className="text-xs text-slate-400 sm:text-sm">
                التسلسل الذكي يوزّع الأدوار بالعدل بين كل اللاعبين
              </p>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isGeneratingAI || !enoughPlayers}
                onClick={() => {
                  setPickMode("sequence");
                  setFighterAId(null);
                  setFighterBId(null);
                }}
                className={`touch-target inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold sm:text-sm ${
                  pickMode === "sequence"
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300"
                } disabled:opacity-50`}
              >
                <ListOrdered className="h-4 w-4" />
                بالدور
              </button>
              <button
                type="button"
                disabled={isGeneratingAI || !enoughPlayers}
                onClick={() => {
                  setPickMode("random");
                  setFighterAId(null);
                  setFighterBId(null);
                }}
                className={`touch-target inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold sm:text-sm ${
                  pickMode === "random"
                    ? "bg-amber-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300"
                } disabled:opacity-50`}
              >
                <Shuffle className="h-4 w-4" />
                عشوائي
              </button>
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={() => setPickMode("manual")}
                className={`touch-target inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold sm:text-sm ${
                  pickMode === "manual"
                    ? "bg-violet-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300"
                } disabled:opacity-50`}
              >
                يدوي
              </button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs sm:text-sm">
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-2 py-2">
                <p className="text-slate-400">اللاعب أ</p>
                <p className="truncate font-semibold text-white">{slotLabel("a")}</p>
              </div>
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2 py-2">
                <p className="text-slate-400">اللاعب ب</p>
                <p className="truncate font-semibold text-white">{slotLabel("b")}</p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => {
                const isA = pickMode === "manual" && player.userId === fighterAId;
                const isB = pickMode === "manual" && player.userId === fighterBId;
                return (
                  <li key={player.userId}>
                    <button
                      type="button"
                      disabled={isGeneratingAI}
                      onClick={() => handlePickPlayer(player.userId)}
                      className={`pressable flex w-full items-center justify-between rounded-xl border px-3 py-3 ${
                        isA
                          ? "border-violet-400/50 bg-violet-500/20"
                          : isB
                            ? "border-cyan-400/50 bg-cyan-500/20"
                            : "border-white/10 bg-slate-950/50 hover:border-white/20"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                          {player.username.charAt(0)}
                        </span>
                        <span className="truncate text-sm text-white">
                          {player.username}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {player.isHost && <Crown className="inline h-3.5 w-3.5 text-amber-300" />}
                        {isA ? " أ" : isB ? " ب" : ` ${player.points}ن`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 sm:p-5"
            dir="rtl"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-100">
              <Timer className="h-4 w-4" />
              مؤقت الجولة
            </p>
            <p className="mb-3 text-xs text-slate-400">
              فعّل أو أوقف المؤقت وحدد المدة. يبدأ مع بداية الحزر.
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTimerEnabled(true);
                  onSetRoundTimer({
                    enabled: true,
                    durationSec: timerDuration,
                  });
                }}
                className={`pressable rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${
                  timerEnabled
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                تفعيل
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerEnabled(false);
                  onSetRoundTimer({ enabled: false, durationSec: timerDuration });
                }}
                className={`pressable rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${
                  !timerEnabled
                    ? "bg-rose-500/80 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                إيقاف
              </button>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs text-slate-400">
                المدة: {timerDuration} ثانية
              </span>
              <input
                type="range"
                min={15}
                max={180}
                step={15}
                value={timerDuration}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setTimerDuration(value);
                  onSetRoundTimer({
                    enabled: timerEnabled,
                    durationSec: value,
                  });
                }}
                className="w-full accent-emerald-500"
              />
            </label>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4 sm:p-5"
            dir="rtl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <Sparkles className="h-5 w-5 text-violet-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-100 sm:text-base">
                  ذكاء اصطناعي — كلمات سهلة حسب الصنف
                </p>
                <p className="text-xs text-slate-400 sm:text-sm">
                  كل لاعب يشوف كلمته (اللي الخصم لازم يحزرها) · الجمهور يشوف الاثنتين
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
              {AI_CATEGORIES.map((category, index) => {
                const isLoading = loadingCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isGeneratingAI || !canLaunch}
                    onClick={() => launchDuel(category.id)}
                    className={`pressable flex min-h-[3.4rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center disabled:opacity-45 ${
                      isLoading
                        ? "border-violet-400/50 bg-violet-500/25"
                        : "border-white/10 bg-slate-950/50 hover:border-violet-400/40 hover:bg-violet-500/10"
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

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-violet-500/5 p-4 sm:p-5"
            dir="rtl"
          >
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-cyan-100">
              <PencilLine className="h-4 w-4" />
              كلمة / رقم مخصص (بموافقة المضيف)
            </p>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              اختيار تفاعلي: كل خصم يدخل سرّه بنفسه. المضيف يوافق للبدء.
              إذا كان المضيف أحد الخصمين — لا يرى الكلمة اليدوية للطرف الآخر.
            </p>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!canLaunch || isGeneratingAI}
                onClick={() => setCustomPick("words")}
                className={`rounded-2xl border px-3 py-4 text-center transition disabled:opacity-45 ${
                  customPick === "words"
                    ? "border-violet-400/60 bg-violet-500/25 text-white shadow-lg shadow-violet-950/30"
                    : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-violet-400/30"
                }`}
              >
                <span className="block text-2xl">✍️</span>
                <span className="mt-2 block text-sm font-semibold">كلمة يدوية</span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  الخصم يكتب كلمة سرية
                </span>
              </button>
              <button
                type="button"
                disabled={!canLaunch || isGeneratingAI}
                onClick={() => setCustomPick("numbers")}
                className={`rounded-2xl border px-3 py-4 text-center transition disabled:opacity-45 ${
                  customPick === "numbers"
                    ? "border-cyan-400/60 bg-cyan-500/25 text-white shadow-lg shadow-cyan-950/30"
                    : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-cyan-400/30"
                }`}
              >
                <span className="block text-2xl">🔢</span>
                <span className="mt-2 block text-sm font-semibold">رقم يدوي</span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  الخصم يكتب رقماً سرياً
                </span>
              </button>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={!canLaunch || isGeneratingAI || !customPick}
              onClick={() => customPick && launchCustom(customPick)}
              className="w-full rounded-xl bg-gradient-to-l from-cyan-500 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-45"
            >
              {!canLaunch
                ? "اختر الخصمين أولاً"
                : !customPick
                  ? "اختر كلمة أو رقم"
                  : customPick === "numbers"
                    ? "بدء — الخصمان يختاران رقمين"
                    : "بدء — الخصمان يختاران كلمتين"}
            </motion.button>
          </motion.section>
        </>
      )}

      {roundPhase === "guessing" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
          dir="rtl"
        >
          <div className="mb-3 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-white">تحكم الجولة</p>
              <button
                type="button"
                onClick={onSkipRound}
                className="pressable inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
              >
                <SkipForward className="h-4 w-4" />
                تخطي الجولة
              </button>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-100">
                <Timer className="h-3.5 w-3.5" />
                مؤقت الجولة
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSetRoundTimer({
                      enabled: true,
                      durationSec: timerDuration,
                    })
                  }
                  className="pressable rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                >
                  تشغيل الآن
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSetRoundTimer({
                      enabled: false,
                      durationSec: timerDuration,
                    })
                  }
                  className="pressable rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                >
                  إيقاف
                </button>
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
                  onSetRoundTimer({
                    enabled: timerEnabled,
                    durationSec: value,
                  });
                }}
                className="w-full accent-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">{timerDuration} ثانية</p>
            </div>
          </div>
          {kickablePlayers.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {kickablePlayers.map((player) => (
                <li key={player.userId}>
                  <button
                    type="button"
                    onClick={() => onKickPlayer(player.userId)}
                    className="pressable flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3"
                  >
                    <span className="truncate text-sm text-white">
                      {player.username}
                    </span>
                    <UserMinus className="h-4 w-4 text-rose-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      )}
    </div>
  );
}
