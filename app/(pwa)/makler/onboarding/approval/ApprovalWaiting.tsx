"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const TIMELINE_STEPS = [
  { label: "Manazer zkontroluje vase dokumenty", icon: "📋" },
  { label: "Overi vasi smlouvu a podpis", icon: "✍️" },
  { label: "Aktivuje vas ucet a muzete zacit pracovat", icon: "🚀" },
];

export function ApprovalWaiting() {
  return (
    <div className="text-center py-12">
      {/* Waiting animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50"
      >
        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-12 h-12 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </motion.svg>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-900 mb-3"
      >
        Hotovo! Manažer vás brzy aktivuje.
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 mb-2 max-w-sm mx-auto"
      >
        Obvykle do 24 hodin
      </motion.p>

      {/* Animated timeline */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-card p-6 mb-6 text-left max-w-sm mx-auto mt-8"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Co se deje dal?</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />

          <div className="space-y-5">
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.2 }}
                className="flex items-start gap-3 relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.6 + i * 0.2 }}
                  className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm shrink-0 z-10"
                >
                  {step.icon}
                </motion.div>
                <span className="text-sm text-gray-600 pt-1.5">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Link href="/">
          <Button variant="outline" size="default">
            Zpet na uvod
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
