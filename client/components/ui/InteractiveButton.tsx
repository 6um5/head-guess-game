"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost" | "success";

interface InteractiveButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "border-transparent bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/40 hover:brightness-110",
  secondary:
    "border-cyan-400/35 bg-cyan-500/15 text-cyan-50 hover:border-cyan-300/50 hover:bg-cyan-500/25",
  accent:
    "border-transparent bg-gradient-to-l from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-950/30 hover:brightness-110",
  danger:
    "border-rose-400/35 bg-rose-500/12 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/20",
  ghost:
    "border-white/12 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10",
  success:
    "border-transparent bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/30 hover:brightness-110",
};

export default function InteractiveButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  type = "button",
  ...props
}: InteractiveButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { y: -1, scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none transition-[box-shadow,filter] focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:py-3 ${
        fullWidth ? "w-full" : ""
      } ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
