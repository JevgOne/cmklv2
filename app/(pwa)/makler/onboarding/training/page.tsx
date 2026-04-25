"use client";

import { useState } from "react";
import { TrainingSlides } from "@/components/pwa/onboarding/TrainingSlides";
import { QuizForm } from "@/components/pwa/onboarding/QuizForm";

export default function OnboardingTrainingPage() {
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {showQuiz ? "Kvíz" : "Školení"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {showQuiz
          ? "Odpovězte na 10 otázek. Pro úspěšné dokončení potřebujete alespoň 80%."
          : "Projděte si základní informace o fungování Carmakler."}
      </p>

      {showQuiz ? (
        <QuizForm />
      ) : (
        <TrainingSlides onComplete={() => setShowQuiz(true)} />
      )}
    </div>
  );
}
