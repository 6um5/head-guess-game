"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const TIKTOK_URL = "https://www.tiktok.com/@xq3";
const INSTAGRAM_URL = "https://www.instagram.com/6um5";
const SNAPCHAT_URL = "https://www.snapchat.com/add/a339y";
const EMAIL = "alialiraqi.112234@gmail.com";

interface CreditsCreditProps {
  className?: string;
  textClassName?: string;
}

export default function CreditsCredit({
  className = "",
  textClassName = "text-[11px] text-slate-500 sm:text-xs",
}: CreditsCreditProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className={`${textClassName} ${className}`} dir="rtl">
        تم التطوير بالكامل بواسطة{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-violet-300 underline decoration-violet-400/40 underline-offset-4 transition hover:text-violet-200 hover:decoration-violet-200"
        >
          علوش زياد
        </button>
      </p>

      <CreditsContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreditsContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      setEmailCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/80 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-white">علوش زياد</p>
                <p className="mt-1 text-xs text-slate-400">تواصل معي</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <ContactLink href={TIKTOK_URL} label="تيك توك" value="@xq3">
                <TikTokIcon />
              </ContactLink>
              <ContactLink
                href={INSTAGRAM_URL}
                label="إنستغرام"
                value="@6um5"
              >
                <InstagramIcon />
              </ContactLink>
              <ContactLink
                href={SNAPCHAT_URL}
                label="سناب شات"
                value="a339y"
              >
                <SnapchatIcon />
              </ContactLink>
              <button
                type="button"
                onClick={copyEmail}
                className="pressable flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right transition hover:border-violet-400/30 hover:bg-violet-500/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-right">
                  <span className="block text-[11px] text-slate-400">
                    الإيميل · اضغط للنسخ
                  </span>
                  <span
                    className="block truncate text-sm font-semibold text-white"
                    dir="ltr"
                  >
                    {emailCopied ? "تم النسخ ✓" : EMAIL}
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ContactLink({
  href,
  label,
  value,
  children,
}: {
  href: string;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-violet-400/30 hover:bg-violet-500/10"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
        {children}
      </span>
      <span className="min-w-0 text-right">
        <span className="block text-[11px] text-slate-400">{label}</span>
        <span className="block truncate text-sm font-semibold text-white" dir="ltr">
          {value}
        </span>
      </span>
    </a>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1-.15Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.75 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
    </svg>
  );
}

function SnapchatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12.065 2c-2.98 0-4.96 1.92-5.2 4.68-.12 1.35.2 2.7.2 2.7s-.8.42-1.35.9c-.7.62-.95 1.55-.45 2.2.4.52 1.1.7 1.72.85-.35.95-1.3 2.15-2.55 2.55-.45.15-.7.55-.55.95.15.4.55.6.95.55 1.35-.2 2.45-.85 3.25-1.45.35 1.05 1.35 2.55 3.35 3.25.15.05.3.2.3.4v.85c0 .4.3.7.7.7s.7-.3.7-.7v-.85c0-.2.15-.35.3-.4 2-.7 3-2.2 3.35-3.25.8.6 1.9 1.25 3.25 1.45.4.05.8-.15.95-.55.15-.4-.1-.8-.55-.95-1.25-.4-2.2-1.6-2.55-2.55.62-.15 1.32-.33 1.72-.85.5-.65.25-1.58-.45-2.2-.55-.48-1.35-.9-1.35-.9s.32-1.35.2-2.7C17.025 3.92 15.045 2 12.065 2z" />
    </svg>
  );
}
