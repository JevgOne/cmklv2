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
          ? "Odpovezte na 10 otazek. Pro uspesne dokonceni potrebujete alespon 80%."
          : "Kratke skoleni vas pripravi na uspech v terenu."}
      </p>

      {showQuiz ? (
        <QuizForm />
      ) : (
        <TrainingSlides onComplete={() => setShowQuiz(true)} />
      )}
    </div>
  );
}
