"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/game";

interface GuessChatProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendGuess: (message: string) => void;
  disabled?: boolean;
}

export default function GuessChat({
  messages,
  currentUserId,
  onSendGuess,
  disabled = false,
}: GuessChatProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSendGuess(trimmed);
    setDraft("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4 md:px-6"
      >
        {messages.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400"
            dir="rtl"
          >
            لا يوجد حزر بعد — كن أول من يحزر!
          </motion.p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isMine = message.userId === currentUserId;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 shadow-md sm:max-w-[75%] sm:px-4 sm:py-3 ${
                      isMine
                        ? "rounded-br-md bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white"
                        : "rounded-bl-md border border-white/10 bg-slate-900/85 text-slate-100"
                    }`}
                  >
                    {!isMine && (
                      <p className="mb-1 text-[10px] font-semibold text-slate-400 sm:text-xs">
                        {message.username}
                      </p>
                    )}
                    <p className="break-words text-sm sm:text-base">
                      {message.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/10 bg-slate-950/90 px-3 py-3 pb-safe backdrop-blur-md sm:px-4 md:px-6"
      >
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={disabled ? "انتهت الجولة…" : "اكتب حزرك هنا…"}
            maxLength={120}
            disabled={disabled}
            dir="rtl"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-base text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 sm:px-4"
          />
          <motion.button
            type="submit"
            whileHover={disabled || !draft.trim() ? undefined : { scale: 1.04 }}
            whileTap={disabled || !draft.trim() ? undefined : { scale: 0.94 }}
            disabled={disabled || !draft.trim()}
            aria-label="إرسال الحزر"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-l from-cyan-400 to-teal-400 px-4 text-slate-950 shadow-lg shadow-cyan-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </form>
    </section>
  );
}
