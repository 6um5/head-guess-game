"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Swords } from "lucide-react";
import type { FighterInfo, PlayerRole } from "@/types/game";

interface DuelBoardProps {
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  myRole: PlayerRole;
  myWord: string | null;
  wordA: string | null;
  wordB: string | null;
  canSeeBothWords: boolean;
  category: string | null;
  roundNumber: number;
}

export default function DuelBoard({
  fighterA,
  fighterB,
  myRole,
  myWord,
  wordA,
  wordB,
  canSeeBothWords,
  category,
  roundNumber,
}: DuelBoardProps) {
  const isFighter = myRole === "fighterA" || myRole === "fighterB";

  const displayWordA = canSeeBothWords
    ? wordA
    : myRole === "fighterA"
      ? myWord
      : null;

  const displayWordB = canSeeBothWords
    ? wordB
    : myRole === "fighterB"
      ? myWord
      : null;

  return (
    <section
      className="shrink-0 border-b border-white/10 px-2.5 py-2.5 sm:px-4 sm:py-4"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-violet-300" />
            الجولة {roundNumber || "—"}
            {category ? ` · ${category}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {canSeeBothWords ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-300" />
                الجمهور يرى الكلمتين
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                كلمتك ظاهرة لك — الخصم يحزرها
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FighterCard
            label="اللاعب أ"
            name={fighterA?.username ?? "—"}
            accent="violet"
            word={displayWordA}
            isYou={myRole === "fighterA"}
            delay={0}
          />
          <FighterCard
            label="اللاعب ب"
            name={fighterB?.username ?? "—"}
            accent="cyan"
            word={displayWordB}
            isYou={myRole === "fighterB"}
            delay={0.06}
          />
        </div>

        {isFighter && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-slate-300 sm:text-sm"
          >
            كلمتك ظاهرة فوق — الخصم يحاول يحزرها. أنت تحزر كلمة الخصم في الشات.
          </motion.p>
        )}
      </div>
    </section>
  );
}

function FighterCard({
  label,
  name,
  word,
  accent,
  isYou,
  delay,
}: {
  label: string;
  name: string;
  word: string | null;
  accent: "violet" | "cyan";
  isYou: boolean;
  delay: number;
}) {
  const border =
    accent === "violet"
      ? "border-violet-400/35 bg-gradient-to-b from-violet-500/20 to-violet-500/5"
      : "border-cyan-400/35 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border px-3 py-2.5 shadow-lg shadow-black/20 sm:px-4 sm:py-4 ${border} ${
        isYou ? "ring-1 ring-white/15" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-400 sm:text-xs">{label}</p>
        {isYou && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">
            أنت
          </span>
        )}
      </div>
      <p className="truncate text-base font-semibold text-white sm:text-lg">
        {name}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">
        {isYou ? "كلمتك (الخصم يحزرها)" : word ? "الكلمة" : "مخفية عنك"}
      </p>
      <motion.p
        key={word ?? "hidden"}
        initial={{ opacity: 0.4, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-1 font-mono text-lg font-bold text-amber-100 sm:text-xl"
      >
        {word ?? "•••"}
      </motion.p>
    </motion.div>
  );
}
