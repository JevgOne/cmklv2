"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingProgress, type OnboardingStep } from "@/components/pwa/onboarding/OnboardingProgress";

const STEP_MAP: Record<string, OnboardingStep> = {
  "/makler/onboarding/profile": "profile",
  "/makler/onboarding/documents": "documents",
  "/makler/onboarding/training": "training",
  "/makler/onboarding/contract": "contract",
  "/makler/onboarding/approval": "approval",
};

const STEP_ORDER: OnboardingStep[] = ["profile", "documents", "training", "contract", "approval"];

const MOTIVATIONAL_TEXT: Record<number, string> = {
  0: "Zaciname! 5 kroku k uspechu.",
  1: "Super start! Zbyvaji 4 kroky.",
  2: "Pulka za vami! Zbyvaji 3 kroky.",
  3: "Skoro tam! Zbyvaji 2 kroky.",
  4: "Posledni krok!",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = STEP_MAP[pathname] || "profile";
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const completedSteps = STEP_ORDER.slice(0, currentIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <h1 className="text-lg font-bold text-white mb-4">Onboarding maklere</h1>
          <OnboardingProgress currentStep={currentStep} completedSteps={completedSteps} />
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-white/80 mt-3 text-center"
            >
              {MOTIVATIONAL_TEXT[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
