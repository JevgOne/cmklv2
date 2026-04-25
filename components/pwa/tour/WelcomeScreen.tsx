"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface WelcomeScreenProps {
  name: string;
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ name, onStart, onSkip }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Image
          src="/brand/logo-white.svg"
          alt="CarMakler"
          width={180}
          height={48}
          className="h-12 w-auto"
        />
      </motion.div>

      {/* Welcome heading */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
        className="text-3xl font-extrabold text-white mb-3 text-center"
      >
        Vitejte, {name}!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-white/60 text-center mb-10 max-w-xs"
      >
        Vas ucet je aktivni. Pojdme se podivat, co vse muzete delat.
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-6 mb-12"
      >
        {[
          { value: "5%", label: "provize" },
          { value: "Offline", label: "mode" },
          { value: "AI", label: "Asistent" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-extrabold text-orange-400">{stat.value}</div>
            <div className="text-xs text-white/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="w-full max-w-xs py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 text-base"
      >
        Spustit pruvodce
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onSkip}
        className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        Preskocit
      </motion.button>
    </motion.div>
  );
}
