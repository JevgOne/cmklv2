"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "onboarding_completed";

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" className="fill-orange-100" />
        <path d="M20 32l8 8 16-16" className="stroke-orange-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Vítejte v nabírání vozidel!",
    description: "Provedeme vás celým procesem krok za krokem. Každý inzerát bude mít profesionální kvalitu.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="16" width="40" height="32" rx="4" className="fill-blue-100 stroke-blue-500" strokeWidth="2" />
        <text x="32" y="38" textAnchor="middle" className="fill-blue-600" fontSize="14" fontWeight="bold">VIN</text>
      </svg>
    ),
    title: "Zadejte VIN kód",
    description: "Naskenujte nebo zadejte VIN — systém automaticky vyplní co nejvíce údajů za vás.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <rect x="14" y="10" width="36" height="44" rx="6" className="fill-green-100 stroke-green-500" strokeWidth="2" />
        <circle cx="32" cy="42" r="6" className="fill-green-500" />
        <rect x="22" y="18" width="20" height="16" rx="2" className="fill-green-200" />
      </svg>
    ),
    title: "Prohlídka a fotky",
    description: "Provedete prohlídku vozu a nafotíte ho podle naší šablony — povedeme vás krok za krokem.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" className="fill-purple-100 stroke-purple-500" strokeWidth="2" />
        <path d="M32 18v14l10 6" className="stroke-purple-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Zkontrolujte a odešlete",
    description: "Zkontrolujte všechny údaje a odešlete ke schválení. Celý proces zabere přibližně 25 minut.",
    color: "from-purple-500 to-violet-500",
  },
];

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${slide.color} px-6 pt-10 pb-8 flex flex-col items-center`}>
          <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            {slide.icon}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 py-3">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-6 bg-orange-500" : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {!isLast && (
            <button
              onClick={handleComplete}
              className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Přeskočit
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${slide.color} hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            {isLast ? "Začít" : "Další"}
          </button>
        </div>
      </div>
    </div>
  );
}
