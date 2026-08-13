"use client";

import { motion } from "framer-motion";
import { ArrowRight, LogIn, Shield, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import CreditsFooter from "@/components/CreditsFooter";
import InteractiveButton from "@/components/ui/InteractiveButton";
import { getStoredRoomCode, getStoredUsername } from "@/lib/sessionStorage";

interface HomeProps {
  onCreateRoom: (username: string) => void;
  onJoinRoom: (username: string, roomCode: string) => void;
  error: string | null;
  onClearError: () => void;
  isConnected: boolean;
  initialRoomCode?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 24 },
  },
};

export default function Home({
  onCreateRoom,
  onJoinRoom,
  error,
  onClearError,
  isConnected,
  initialRoomCode = null,
}: HomeProps) {
  const [username, setUsername] = useState(() => getStoredUsername() ?? "");
  const [roomCode, setRoomCode] = useState(
    () => initialRoomCode ?? getStoredRoomCode() ?? "",
  );
  const [showJoinInput, setShowJoinInput] = useState(() =>
    Boolean(initialRoomCode ?? getStoredRoomCode()),
  );

  useEffect(() => {
    const storedName = getStoredUsername();
    if (storedName) {
      setUsername(storedName);
    }

    const storedCode = initialRoomCode ?? getStoredRoomCode();
    if (storedCode) {
      setRoomCode(storedCode.toUpperCase());
      setShowJoinInput(true);
    }
  }, [initialRoomCode]);

  const trimmedUsername = username.trim();
  const trimmedCode = roomCode.trim().toUpperCase();
  const canSubmit = trimmedUsername.length > 0 && isConnected;

  const handleCreate = () => {
    if (!canSubmit) return;
    onClearError();
    onCreateRoom(trimmedUsername);
  };

  const handleJoin = () => {
    if (!canSubmit || trimmedCode.length < 4) return;
    onClearError();
    onJoinRoom(trimmedUsername, trimmedCode);
  };

  return (
    <motion.div
      className="relative flex w-full max-w-lg flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir="rtl"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col items-center text-center sm:mb-8"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-400/35 sm:mb-4 sm:h-16 sm:w-16"
        >
          <Sparkles className="h-7 w-7 text-violet-200 sm:h-8 sm:w-8" />
        </motion.div>
        <h1 className="bg-gradient-to-l from-white via-violet-100 to-fuchsia-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
          حزر اللي براسي
        </h1>
        <p className="mt-2 max-w-sm px-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          لعبة أونلاين متكاملة · مبارزة 1 ضد 1 · غرف محمية بالكود فقط
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-right text-xs text-emerald-100 sm:text-sm"
      >
        <Shield className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          الغرف حقيقية ومحمية: الدخول بالكود أو الرابط المباشر فقط. بدون الكود لا يمكن لأحد الدخول.
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-6"
      >
        {showJoinInput && (
          <button
            type="button"
            onClick={() => {
              setShowJoinInput(false);
              setRoomCode(initialRoomCode ?? "");
              onClearError();
            }}
            className="pressable mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            رجوع
          </button>
        )}

        <label className="mb-2 block text-xs font-semibold text-slate-400">
          اسمك
        </label>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="اكتب اسمك"
          maxLength={24}
          className="mb-5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/25 sm:mb-6"
        />

        <div className="flex flex-col gap-3">
          <InteractiveButton
            variant="primary"
            fullWidth
            disabled={!canSubmit}
            onClick={handleCreate}
          >
            <Users className="h-4 w-4" />
            إنشاء غرفة
          </InteractiveButton>

          <InteractiveButton
            variant="secondary"
            fullWidth
            disabled={!canSubmit && !showJoinInput}
            onClick={() => setShowJoinInput(true)}
          >
            <LogIn className="h-4 w-4" />
            الانضمام بكود / رابط
          </InteractiveButton>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: showJoinInput ? "auto" : 0,
            opacity: showJoinInput ? 1 : 0,
            marginTop: showJoinInput ? 16 : 0,
          }}
          className="overflow-hidden"
        >
          <label className="mb-2 block text-xs font-semibold text-slate-400">
            كود الغرفة
          </label>
          <div className="flex flex-col gap-2 sm:flex-row" dir="ltr">
            <input
              type="text"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              placeholder="AB12"
              maxLength={5}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 font-mono tracking-[0.25em] text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
            />
            <InteractiveButton
              variant="accent"
              disabled={!canSubmit || trimmedCode.length < 4}
              onClick={handleJoin}
            >
              دخول
            </InteractiveButton>
          </div>
          {initialRoomCode && (
            <p className="mt-2 text-center text-xs text-cyan-200/80" dir="rtl">
              تم فتح رابط الغرفة مباشرة — أدخل اسمك واضغط دخول
            </p>
          )}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {error}
          </motion.p>
        )}

        {!isConnected && (
          <p className="mt-4 text-center text-xs text-amber-300/80">
            جاري الاتصال بالخادم…
          </p>
        )}
      </motion.div>

      <div className="mt-6">
        <CreditsFooter />
      </div>
    </motion.div>
  );
}
