"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export default function HelpButton({ onClick, className = "" }: HelpButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-white/12 bg-slate-900/80 px-3 text-xs font-medium text-slate-200 shadow-sm backdrop-blur-md hover:border-violet-300/40 hover:bg-violet-500/15 hover:text-white ${className}`}
      dir="rtl"
      aria-label="شرح اللعبة"
      title="شرح اللعبة"
    >
      <BookOpen className="h-3.5 w-3.5 text-violet-300" />
      <span>شرح</span>
    </motion.button>
  );
}
