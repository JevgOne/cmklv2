"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "@/components/ui/Confetti";

interface StepCompleteProps {
  step: number;
  emoji: string;
  title: string;
  subtitle: string;
  onContinue: () => void;
}

export function StepComplete({ step, emoji, title, subtitle, onContinue }: StepCompleteProps) {
  useEffect(() => {
    const timer = setTimeout(onContinue, 3000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onContinue}
      >
        <Confetti />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouncing emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
            className="text-7xl mb-6"
          >
            {emoji}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-extrabold text-white mb-2"
          >
            {title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 mb-4"
          >
            {subtitle}
          </motion.p>

          {/* Progress dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s <= step ? "bg-orange-400" : "bg-white/30"
                }`}
              />
            ))}
          </motion.div>

          {/* Continue button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="px-8 py-3 bg-white text-orange-600 font-bold rounded-full shadow-lg"
          >
            Pokracovat
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
