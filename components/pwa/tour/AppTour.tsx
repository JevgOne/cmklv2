"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { WelcomeScreen } from "./WelcomeScreen";
import { TourSpotlight } from "./TourSpotlight";

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="dashboard-stats"]',
    title: "Vas prehled",
    description: "Mesicni provize, prodeje a aktivni vozy",
  },
  {
    selector: '[data-tour="add-vehicle-cta"]',
    title: "Pridejte prvni vuz",
    description: "Kliknete pro registraci vozidla do systemu",
  },
  {
    selector: '[data-tour="notifications"]',
    title: "Notifikace",
    description: "Dulezite zpravy a upozorneni na jednom miste",
  },
  {
    selector: '[data-tour="bottom-nav-vehicles"]',
    title: "Vase vozy",
    description: "Prehled vsech vasich registrovanych vozidel",
  },
  {
    selector: '[data-tour="bottom-nav-contacts"]',
    title: "Kontakty",
    description: "CRM — vasi prodejci a kupujici",
  },
  {
    selector: '[data-tour="bottom-nav-profile"]',
    title: "Vas profil",
    description: "Nastaveni profilu, materialy a statistiky",
  },
  {
    selector: '[data-tour="materials-link"]',
    title: "Materialy",
    description: "Vizitka, email podpis a prezentace — vse personalizovane",
  },
];

interface AppTourProps {
  userName: string;
}

export function AppTour({ userName }: AppTourProps) {
  const [phase, setPhase] = useState<"welcome" | "tour" | "done">("welcome");
  const [currentStep, setCurrentStep] = useState(0);

  const completeTour = useCallback(async () => {
    setPhase("done");
    try {
      await fetch("/api/broker/tour-complete", { method: "POST" });
    } catch {
      // Non-critical — tour flag will be set on next visit
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  if (phase === "done") return null;

  return (
    <AnimatePresence mode="wait">
      {phase === "welcome" && (
        <WelcomeScreen
          key="welcome"
          name={userName}
          onStart={() => setPhase("tour")}
          onSkip={completeTour}
        />
      )}
      {phase === "tour" && (
        <TourSpotlight
          key={`step-${currentStep}`}
          targetSelector={TOUR_STEPS[currentStep].selector}
          title={TOUR_STEPS[currentStep].title}
          description={TOUR_STEPS[currentStep].description}
          step={currentStep + 1}
          totalSteps={TOUR_STEPS.length}
          onNext={handleNext}
          onSkip={completeTour}
        />
      )}
    </AnimatePresence>
  );
}
