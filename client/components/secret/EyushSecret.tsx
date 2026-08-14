"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { connectSocket } from "@/lib/socket";

const FLOATERS = Array.from({ length: 22 }, (_, index) => index);

const THEMES: Record<
  string,
  {
    label: string;
    panel: string;
    ring: string;
    icon: string;
    heart: string;
    spark: string;
    caption: string;
  }
> = {
  ايوش: {
    label: "لإيوش فقط",
    panel:
      "border-rose-300/30 bg-gradient-to-b from-rose-500/20 via-fuchsia-600/15 to-slate-950/90",
    ring: "bg-rose-400/20",
    icon: "fill-rose-300 text-rose-200",
    heart: "fill-rose-400 text-rose-300",
    spark: "text-amber-200",
    caption: "text-rose-200/80",
  },
  طوطه: {
    label: "لطوطه فقط",
    panel:
      "border-teal-300/30 bg-gradient-to-b from-teal-500/20 via-violet-600/15 to-slate-950/90",
    ring: "bg-teal-400/20",
    icon: "fill-teal-300 text-teal-100",
    heart: "fill-teal-400 text-teal-300",
    spark: "text-violet-200",
    caption: "text-teal-200/80",
  },
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة$/, "ه");
}

export default function EyushSecret() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState<string>("ايوش");
  const [typed, setTyped] = useState("");

  const theme = THEMES[normalizeKey(name)] ?? THEMES["ايوش"];

  const particles = useMemo(
    () =>
      FLOATERS.map((index) => ({
        id: index,
        left: `${(index * 17 + 7) % 94}%`,
        delay: (index % 9) * 0.35,
        duration: 4.8 + (index % 5) * 0.7,
        kind: index % 3 === 0 ? "star" : "heart",
        size: 10 + (index % 4) * 3,
      })),
    [],
  );

  useEffect(() => {
    if (!message) {
      setTyped("");
      return;
    }

    let index = 0;
    setTyped("");
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(message.slice(0, index));
      if (index >= message.length) {
        window.clearInterval(timer);
      }
    }, 38);

    return () => window.clearInterval(timer);
  }, [message]);

  useEffect(() => {
    const socket = connectSocket();

    const onTribute = (payload: { message: string; name?: string }) => {
      setLoading(false);
      setError(null);
      if (payload.name) setName(payload.name);
      setMessage(payload.message);
      setOpen(false);
      setDraft("");
    };

    const onError = (payload: { message: string }) => {
      setLoading(false);
      setError(payload.message || "تعذر الآن.");
    };

    socket.on("secretTribute", onTribute);
    socket.on("secretTributeError", onError);

    return () => {
      socket.off("secretTribute", onTribute);
      socket.off("secretTributeError", onError);
    };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = normalizeKey(draft);

    if (!THEMES[value]) {
      setError("...");
      return;
    }

    setName(value);
    setLoading(true);
    setError(null);
    connectSocket().emit("requestSecretTribute", { key: value });
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="·"
        title=""
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          setOpen((current) => !current);
          setError(null);
        }}
        className="fixed bottom-3 right-3 z-[90] flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/10 text-rose-200/80 shadow-lg backdrop-blur-md sm:bottom-4 sm:right-4"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Heart className="h-3.5 w-3.5 fill-current opacity-80" />
      </motion.button>

      <AnimatePresence>
        {open && !message && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="fixed bottom-14 right-3 z-[90] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-rose-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl sm:bottom-16 sm:right-4"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            dir="rtl"
          >
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="…"
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-300/40"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading || !draft.trim()}
                className="w-full rounded-xl bg-gradient-to-l from-rose-500 to-fuchsia-500 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-45"
              >
                {loading ? "…" : "✦"}
              </motion.button>
              {error && (
                <p className="text-center text-[11px] text-rose-200/80">{error}</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/80 px-4 backdrop-blur-md"
          >
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="pointer-events-none absolute"
                style={{ left: particle.left, bottom: "-8%" }}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: ["0vh", "-110vh"],
                  x: [0, particle.id % 2 === 0 ? 18 : -18],
                  rotate: [0, 40, -20, 10],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                {particle.kind === "heart" ? (
                  <Heart
                    className={theme.heart}
                    style={{ width: particle.size, height: particle.size }}
                  />
                ) : (
                  <Sparkles
                    className={theme.spark}
                    style={{ width: particle.size, height: particle.size }}
                  />
                )}
              </motion.span>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className={`relative z-10 w-full max-w-md rounded-3xl border p-6 text-center shadow-2xl sm:p-8 ${theme.panel}`}
              dir="rtl"
            >
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="absolute left-3 top-3 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>

              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${theme.ring}`}
              >
                <Heart className={`h-7 w-7 ${theme.icon}`} />
              </motion.div>

              <p className={`text-[11px] tracking-[0.35em] ${theme.caption}`}>
                {theme.label}
              </p>
              <p className="mt-4 min-h-[4.5rem] text-base leading-8 text-white/95 sm:text-lg sm:leading-9">
                {typed}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="mr-0.5 inline-block"
                >
                  |
                </motion.span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
