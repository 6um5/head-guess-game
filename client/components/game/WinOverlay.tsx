"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, Trophy } from "lucide-react";

interface WinOverlayProps {
  winnerName: string;
  word: string;
  points: number | null;
}

const confettiPieces = Array.from({ length: 18 }, (_, index) => index);

export default function WinOverlay({
  winnerName,
  word,
  points,
}: WinOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      >
        {confettiPieces.map((piece) => (
          <motion.span
            key={piece}
            className="absolute h-2 w-2 rounded-full"
            style={{
              background:
                piece % 3 === 0
                  ? "#a78bfa"
                  : piece % 3 === 1
                    ? "#22d3ee"
                    : "#fbbf24",
              left: `${(piece * 17) % 100}%`,
              top: `${(piece * 11) % 40}%`,
            }}
            initial={{ opacity: 0, y: -20, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 120, 220],
              scale: [0.5, 1, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.2,
              delay: piece * 0.05,
              ease: "easeOut",
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-full max-w-md rounded-3xl border border-amber-300/30 bg-gradient-to-b from-amber-500/20 to-violet-600/20 p-6 text-center shadow-2xl sm:p-8"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 24px rgba(251,191,36,0.25)",
                "0 0 48px rgba(167,139,250,0.45)",
                "0 0 24px rgba(251,191,36,0.25)",
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 sm:h-20 sm:w-20"
          >
            <PartyPopper className="h-8 w-8 text-amber-200 sm:h-10 sm:w-10" />
          </motion.div>

          <p className="text-xs font-semibold tracking-[0.3em] text-amber-200/80" dir="rtl">
            صحيح!
          </p>
          <h2 className="mt-2 bg-gradient-to-l from-amber-100 via-white to-violet-100 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl" dir="rtl">
            {winnerName} فاز بالجولة
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base" dir="rtl">
            الكلمات:{" "}
            <span className="font-semibold text-white">{word}</span>
          </p>
          {points !== null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-violet-100" dir="rtl">
              <Trophy className="h-4 w-4 text-amber-300" />
              مجموع النقاط: {points}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
