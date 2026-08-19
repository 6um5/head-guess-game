"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/game";

interface GuessChatProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendGuess: (message: string) => void;
  disabled?: boolean;
  disabledReason?: string | null;
  duelLabel?: string | null;
}

export default function GuessChat({
  messages,
  currentUserId,
  onSendGuess,
  disabled = false,
  disabledReason = null,
  duelLabel = null,
}: GuessChatProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [seenCount, setSeenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSeenCount(messages.length);
    }
  }, [open, messages.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !open) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  const unread = open ? 0 : Math.max(0, messages.length - seenCount);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSendGuess(trimmed);
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-16 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-cyan-950/40 backdrop-blur-md sm:bottom-20 sm:left-5"
        dir="rtl"
        aria-label="فتح الشات"
      >
        <span className="relative">
          <MessageCircle className="h-5 w-5 text-cyan-300" />
          {unread > 0 && (
            <span className="absolute -left-2 -top-2 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        الحزر
        {messages.length > 0 && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            {messages.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق الشات"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <motion.section
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[72dvh] flex-col rounded-t-3xl border-t border-white/10 bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-right" dir="rtl">
                  <p className="text-sm font-semibold text-white">الشات / الحزر</p>
                  <p className="text-[11px] text-slate-400">
                    {duelLabel ?? (disabled ? "المشاهدة فقط" : "اكتب حزرك هنا")}
                  </p>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
              >
                {messages.length === 0 ? (
                  <p
                    className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400"
                    dir="rtl"
                  >
                    لا يوجد حزر بعد — كن أول من يحزر!
                  </p>
                ) : (
                  messages.map((message) => {
                    const isMine = message.userId === currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2.5 shadow-md sm:max-w-[75%] ${
                            isMine
                              ? "rounded-br-md bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white"
                              : "rounded-bl-md border border-white/10 bg-slate-900/85 text-slate-100"
                          }`}
                        >
                          {!isMine && (
                            <p className="mb-1 text-[10px] font-semibold text-slate-400">
                              {message.username}
                            </p>
                          )}
                          <p className="break-words text-sm">{message.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-white/10 bg-slate-950 px-3 py-3 pb-safe"
              >
                {disabled && disabledReason && (
                  <p
                    className="mb-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100"
                    dir="rtl"
                  >
                    {disabledReason}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={disabled ? "الكتابة غير متاحة لك الآن" : "اكتب حزرك هنا…"}
                    maxLength={120}
                    disabled={disabled}
                    dir="rtl"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-base text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
                  />
                  <motion.button
                    type="submit"
                    whileTap={disabled || !draft.trim() ? undefined : { scale: 0.94 }}
                    disabled={disabled || !draft.trim()}
                    aria-label="إرسال الحزر"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-l from-cyan-400 to-teal-400 px-4 text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </motion.button>
                </div>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
