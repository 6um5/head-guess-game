"use client";

import { motion } from "framer-motion";
import { EyeOff, Send } from "lucide-react";
import { FormEvent, useState } from "react";

interface SecretWordInputProps {
  onSubmitWord: (word: string) => void;
}

export default function SecretWordInput({ onSubmitWord }: SecretWordInputProps) {
  const [word, setWord] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = word.trim();
    if (!trimmed) return;
    onSubmitWord(trimmed);
    setWord("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center p-4 sm:p-6 md:p-8"
    >
      <div className="w-full max-w-lg rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/10 to-fuchsia-500/5 p-5 shadow-xl shadow-violet-950/30 sm:p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20">
            <EyeOff className="h-5 w-5 text-violet-200" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              Your secret word
            </h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Others will try to guess it in real time.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="Type the secret word…"
            maxLength={48}
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/30 sm:text-lg"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={!word.trim()}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            <Send className="h-4 w-4" />
            Lock In Word
          </motion.button>
        </form>
      </div>
    </motion.section>
  );
}
