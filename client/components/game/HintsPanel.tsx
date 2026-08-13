"use client";

import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import type { FighterInfo, HintsState, PlayerRole } from "@/types/game";

interface HintsPanelProps {
  hints: HintsState;
  myRole: PlayerRole;
  isHost: boolean;
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  onConsent: (allow: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestHint: () => void;
}

export default function HintsPanel({
  hints,
  myRole,
  isHost,
  fighterA,
  fighterB,
  onConsent,
  onApprove,
  onReject,
  onRequestHint,
}: HintsPanelProps) {
  const [open, setOpen] = useState(true);
  const isFighter = myRole === "fighterA" || myRole === "fighterB";
  const myConsent =
    myRole === "fighterA"
      ? hints.consentA
      : myRole === "fighterB"
        ? hints.consentB
        : false;

  const statusLabel = hints.enabled
    ? `مفعّلة · ${hints.myRequests}/${hints.maxRequests} طلب`
    : hints.bothConsented
      ? "بانتظار موافقة المضيف"
      : "بانتظار موافقة المتبارزين";

  return (
    <section
      className="shrink-0 border-b border-white/10 bg-slate-950/80 px-2.5 py-2 sm:px-4"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-right"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Lightbulb className="h-4 w-4 shrink-0" />
            تلميحات الذكاء الاصطناعي
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] text-amber-200/80">
            {statusLabel}
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        {open && (
          <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {!hints.enabled && (
              <>
                <p className="text-xs leading-relaxed text-slate-400">
                  المتبارزان يوافقان أولاً، ثم المضيف يفعّل. بعدها كل خصم يطلب
                  تلميحه بزر خاص.
                </p>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                    <p className="truncate text-slate-400">
                      {fighterA?.username ?? "أ"}
                    </p>
                    <p
                      className={
                        hints.consentA ? "text-emerald-300" : "text-amber-300"
                      }
                    >
                      {hints.consentA ? "موافق ✓" : "بانتظار"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                    <p className="truncate text-slate-400">
                      {fighterB?.username ?? "ب"}
                    </p>
                    <p
                      className={
                        hints.consentB ? "text-emerald-300" : "text-amber-300"
                      }
                    >
                      {hints.consentB ? "موافق ✓" : "بانتظار"}
                    </p>
                  </div>
                </div>

                {isFighter && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onConsent(true)}
                      disabled={myConsent}
                      className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Check className="h-4 w-4" />
                      {myConsent ? "تمت موافقتك" : "أوافق"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConsent(false)}
                      className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
                    >
                      <X className="h-4 w-4" />
                      أرفض
                    </button>
                  </div>
                )}

                {isHost && hints.bothConsented && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={onApprove}
                      className="flex-1 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white"
                    >
                      موافقة المضيف — تفعيل أزرار التلميح
                    </motion.button>
                    <button
                      type="button"
                      onClick={onReject}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200"
                    >
                      رفض
                    </button>
                  </div>
                )}

                {isHost && !hints.bothConsented && (
                  <p className="text-center text-[11px] text-slate-500">
                    بانتظار موافقة كلا المتبارزين
                  </p>
                )}
              </>
            )}

            {hints.enabled && (
              <div className="space-y-2">
                {isFighter && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    disabled={!hints.canRequestHint}
                    onClick={onRequestHint}
                    className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-3 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-45"
                  >
                    <Send className="h-4 w-4" />
                    اطلب تلميح لي
                    <span className="text-[11px] font-medium opacity-80">
                      ({hints.myRequests}/{hints.maxRequests})
                    </span>
                  </motion.button>
                )}

                {!isFighter && (
                  <p className="text-center text-[11px] text-slate-500">
                    كل خصم يطلب تلميحه بزر خاص بعد موافقة المضيف
                  </p>
                )}

                {hints.myHints.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {isFighter
                      ? "اضغط الزر فوق لطلب تلميح عن كلمة خصمك."
                      : "لا تلميحات بعد…"}
                  </p>
                ) : (
                  <ul className="max-h-28 space-y-1.5 overflow-y-auto">
                    {hints.myHints.map((hint, index) => (
                      <li
                        key={`${index}-${hint}`}
                        className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100"
                      >
                        {index + 1}. {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
