"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  EyeOff,
  Lock,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { FighterInfo, PlayerRole } from "@/types/game";

interface WordSetupPanelProps {
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  myRole: PlayerRole;
  myWord: string | null;
  wordA: string | null;
  wordB: string | null;
  isHost: boolean;
  canSeeBothWords: boolean;
  bothWordsReady: boolean;
  customMode: "words" | "numbers" | null;
  onProposeWord: (word: string) => void;
  onHostSetWord: (targetUserId: string, word: string) => void;
  onApprove: () => void;
  onCancel: () => void;
}

export default function WordSetupPanel({
  fighterA,
  fighterB,
  myRole,
  myWord,
  wordA,
  wordB,
  isHost,
  canSeeBothWords,
  bothWordsReady,
  customMode,
  onProposeWord,
  onHostSetWord,
  onApprove,
  onCancel,
}: WordSetupPanelProps) {
  const [draft, setDraft] = useState("");
  const [hostDraftA, setHostDraftA] = useState("");
  const [hostDraftB, setHostDraftB] = useState("");

  const isFighter = myRole === "fighterA" || myRole === "fighterB";
  const hostPlaying = isHost && isFighter;
  const hostSpectating = isHost && !isFighter;
  const isNumbers = customMode === "numbers";
  const secretLabel = isNumbers ? "رقم" : "كلمة";

  const normalizeDraft = (value: string) =>
    isNumbers ? value.replace(/[^\d]/g, "") : value;

  const revealFor = (side: "A" | "B") => {
    if (side === "A") {
      if (myRole === "fighterA") return myWord;
      if (canSeeBothWords) return wordA;
      return null;
    }
    if (myRole === "fighterB") return myWord;
    if (canSeeBothWords) return wordB;
    return null;
  };

  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-100 sm:text-base">
            <PencilLine className="h-4 w-4" />
            كلمة / رقم مخصص — تفاعلي
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
            {hostPlaying
              ? `أدخل ${secretLabel}ك سراً. كلمة/رقم الخصم مخفي عنك تماماً — توافق فقط كمضيف.`
              : hostSpectating
                ? `الخصمان يدخلان أو أنت تعيّن لهما. ترى الاثنين لأنك متفرج.`
                : `كل خصم يدخل ${secretLabel}ه سراً، ثم يوافق المضيف.`}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InteractiveSecretCard
            title="اللاعب أ"
            name={fighterA?.username ?? "—"}
            ready={Boolean(fighterA?.wordReady)}
            isYou={myRole === "fighterA"}
            canEditAsFighter={myRole === "fighterA"}
            canEditAsHost={hostSpectating}
            canReveal={revealFor("A")}
            hiddenBecauseHostPlaying={hostPlaying && myRole !== "fighterA"}
            secretLabel={secretLabel}
            isNumbers={isNumbers}
            draft={myRole === "fighterA" ? draft : hostDraftA}
            onDraftChange={(value) => {
              const next = normalizeDraft(value);
              if (myRole === "fighterA") setDraft(next);
              else setHostDraftA(next);
            }}
            onSaveFighter={() => {
              if (!draft.trim()) return;
              onProposeWord(draft.trim());
              setDraft("");
            }}
            onSaveHost={() => {
              if (!fighterA || !hostDraftA.trim()) return;
              onHostSetWord(fighterA.userId, hostDraftA.trim());
              setHostDraftA("");
            }}
          />

          <InteractiveSecretCard
            title="اللاعب ب"
            name={fighterB?.username ?? "—"}
            ready={Boolean(fighterB?.wordReady)}
            isYou={myRole === "fighterB"}
            canEditAsFighter={myRole === "fighterB"}
            canEditAsHost={hostSpectating}
            canReveal={revealFor("B")}
            hiddenBecauseHostPlaying={hostPlaying && myRole !== "fighterB"}
            secretLabel={secretLabel}
            isNumbers={isNumbers}
            draft={myRole === "fighterB" ? draft : hostDraftB}
            onDraftChange={(value) => {
              const next = normalizeDraft(value);
              if (myRole === "fighterB") setDraft(next);
              else setHostDraftB(next);
            }}
            onSaveFighter={() => {
              if (!draft.trim()) return;
              onProposeWord(draft.trim());
              setDraft("");
            }}
            onSaveHost={() => {
              if (!fighterB || !hostDraftB.trim()) return;
              onHostSetWord(fighterB.userId, hostDraftB.trim());
              setHostDraftB("");
            }}
          />
        </div>

        {isHost && (
          <div className="space-y-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              موافقة المضيف
            </p>
            {hostPlaying && (
              <p className="flex items-start gap-2 text-xs text-amber-100/90">
                <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                أنت خصم الآن — سر الطرف الآخر مخفي. توافق على الجاهزية فقط بدون رؤية الكلمة اليدوية.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={!bothWordsReady}
                onClick={onApprove}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                موافقة وبدء الجولة
              </motion.button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              >
                إلغاء / رجوع
              </button>
            </div>
            {!bothWordsReady && (
              <p className="text-center text-[11px] text-amber-200/80">
                بانتظار أن يختار كلا الخصمين {secretLabel}هما
              </p>
            )}
          </div>
        )}

        {!isHost && !isFighter && (
          <p className="text-center text-sm text-slate-400">
            الجمهور ينتظر اختيار الخصمين وموافقة المضيف…
          </p>
        )}
      </div>
    </section>
  );
}

function InteractiveSecretCard({
  title,
  name,
  ready,
  isYou,
  canEditAsFighter,
  canEditAsHost,
  canReveal,
  hiddenBecauseHostPlaying,
  secretLabel,
  isNumbers,
  draft,
  onDraftChange,
  onSaveFighter,
  onSaveHost,
}: {
  title: string;
  name: string;
  ready: boolean;
  isYou: boolean;
  canEditAsFighter: boolean;
  canEditAsHost: boolean;
  canReveal: string | null;
  hiddenBecauseHostPlaying: boolean;
  secretLabel: string;
  isNumbers: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSaveFighter: () => void;
  onSaveHost: () => void;
}) {
  const canEdit = canEditAsFighter || canEditAsHost;

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-4 ${
        isYou
          ? "border-violet-400/40 bg-violet-500/10"
          : hiddenBecauseHostPlaying
            ? "border-amber-400/20 bg-amber-500/5"
            : "border-white/10 bg-slate-950/50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className="font-semibold text-white">
            {name}
            {isYou ? " · أنت" : ""}
          </p>
        </div>
        {ready ? (
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-300">
            جاهز ✓
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-200">
            بانتظار
          </span>
        )}
      </div>

      {hiddenBecauseHostPlaying ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-300">
          <Lock className="h-4 w-4 text-amber-300" />
          {secretLabel} يدوي مخفي — لا يمكنك رؤيته وأنت خصم
        </div>
      ) : canReveal ? (
        <p className="mt-2 font-mono text-sm text-violet-200">
          {canReveal}
        </p>
      ) : !canEdit ? (
        <p className="mt-2 text-xs text-slate-500">بانتظار اختيار الخصم…</p>
      ) : null}

      {canEdit && (
        <div className="mt-3 space-y-2">
          <label className="block text-[11px] text-slate-400">
            {canEditAsFighter
              ? `أدخل ${secretLabel}ك السري`
              : `تعيين ${secretLabel} من المضيف`}
          </label>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              inputMode={isNumbers ? "numeric" : "text"}
              placeholder={isNumbers ? "25" : "برتقال"}
              maxLength={64}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/40"
            />
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={canEditAsFighter ? onSaveFighter : onSaveHost}
              className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              حفظ
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
