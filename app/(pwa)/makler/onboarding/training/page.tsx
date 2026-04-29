"use client";

import { useState } from "react";
import { TrainingSlides } from "@/components/pwa/onboarding/TrainingSlides";
import { QuizForm } from "@/components/pwa/onboarding/QuizForm";
import { Button } from "@/components/ui/Button";

export default function OnboardingTrainingPage() {
  const [phase, setPhase] = useState<"intro" | "slides" | "quiz">("intro");

  if (phase === "quiz") {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kvíz</h2>
        <p className="text-sm text-gray-500 mb-6">
          Odpovězte na 10 otázek. Pro úspěšné dokončení potřebujete alespoň 80 %.
        </p>
        <QuizForm />
      </div>
    );
  }

  if (phase === "slides") {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Školení</h2>
        <p className="text-sm text-gray-500 mb-6">
          Pečlivě si přečtěte všechny materiály — na konci vás čeká kvíz.
        </p>
        <TrainingSlides onComplete={() => setPhase("quiz")} />
      </div>
    );
  }

  // Intro phase — welcome video + info
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Školení</h2>
      <p className="text-sm text-gray-500 mb-6">
        Krátké školení vás připraví na úspěch v terénu.
      </p>

      {/* Welcome video */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
          {/* TODO: nahradit skutečným YouTube/Vimeo embedem až bude video natočeno */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 to-orange-800/90 flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Vítejte v CarMakléři!</h3>
            <p className="text-sm text-white/80 max-w-sm">
              Krátké uvítací video vám představí platformu a ukáže jak začít úspěšně prodávat.
            </p>
            <p className="text-xs text-white/50 mt-3">Video bude brzy dostupné</p>
          </div>
        </div>
      </div>

      {/* Quiz warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-800 mb-1">
              Na konci školení vás čeká kvíz
            </p>
            <p className="text-xs text-orange-700 leading-relaxed">
              Pečlivě si přečtěte všechny materiály v následujících 4 krocích. Pro úspěšné dokončení
              kvízu potřebujete alespoň 80 % správných odpovědí. Kvíz můžete opakovat.
            </p>
          </div>
        </div>
      </div>

      {/* What you'll learn */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Co se naučíte</h3>
        <div className="space-y-3">
          {[
            { icon: "🏠", title: "Jak funguje CarMakléř", desc: "Princip platformy a role makléře" },
            { icon: "🚗", title: "Jak nabrat auto", desc: "VIN dekodér, fotky, inspekce, cenotvorba" },
            { icon: "🤝", title: "Jednání s prodejcem", desc: "Profesionalita, smlouvy, komunikace" },
            { icon: "⚖️", title: "Právní minimum", desc: "Smlouvy, GDPR, vlastnictví, provize" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setPhase("slides")}
        className="w-full"
      >
        Začít školení
      </Button>
    </div>
  );
}
