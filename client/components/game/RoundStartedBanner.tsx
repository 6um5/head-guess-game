"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface RoundStartedBannerProps {
  category: string | null;
  visible: boolean;
}

export default function RoundStartedBanner({
  category,
  visible,
}: RoundStartedBannerProps) {
  return (
    <AnimatePresence>
      {visible && category && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center px-3 sm:top-20 sm:px-4"
          dir="rtl"
        >
          <div className="w-full max-w-xl rounded-2xl border border-violet-400/40 bg-gradient-to-l from-violet-600/90 to-fuchsia-600/90 px-4 py-3 text-center shadow-2xl shadow-violet-950/50 backdrop-blur-md sm:px-6 sm:py-4">
            <div className="mb-1 flex items-center justify-center gap-2 text-violet-100">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs">
                AI Round
              </span>
            </div>
            <p className="text-base font-bold text-white sm:text-lg md:text-xl">
              تم اختيار الكلمتين! التصنيف: {category}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
