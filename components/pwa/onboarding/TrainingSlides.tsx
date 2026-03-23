"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  icon: string;
  points: string[];
}

const SLIDES: Slide[] = [
  {
    title: "Jak funguje Carmakler",
    icon: "1",
    points: [
      "Carmakler propojuje prodejce vozidel s ověřenými makléři",
      "Makléř nabere auto v terénu a zadá ho do systému",
      "BackOffice schválí vozidlo a publikuje inzerát",
      "Po úspěšném prodeji makléř získá provizi 5 % z prodejní ceny (min. 25 000 Kč)",
    ],
  },
  {
    title: "Jak nabrat auto",
    icon: "2",
    points: [
      "Použijte VIN dekodér pro automatické načtení údajů",
      "Pořiďte kvalitní fotky podle fotoprůvodce (min. 15 fotek)",
      "Proveďte inspekci a zaznamenejte stav vozu",
      "Nastavte reálnou cenu na základě tržní analýzy",
      "Vše zadejte do PWA aplikace — funguje i offline",
    ],
  },
  {
    title: "Jednání s prodejcem",
    icon: "3",
    points: [
      "Vždy jednejte profesionálně a transparentně",
      "Vysvětlete prodejci celý proces a výhody spolupráce",
      "Podepište makléřskou smlouvu před zahájením inzerce",
      "Pravidelně informujte prodejce o stavu prodeje",
      "Při prohlídce buďte důkladní — vyhnete se reklamacím",
    ],
  },
  {
    title: "Právní minimum",
    icon: "4",
    points: [
      "Makléřská smlouva je povinný první krok před inzercí",
      "Nikdy neslibujte garantovaný prodej ani konkrétní čas",
      "Ověřujte vlastnictví vozu v registru vozidel",
      "Provize se vyplácí až po úspěšném prodeji a úhradě",
      "Dodržujte GDPR — osobní údaje klientů nedávejte dál",
    ],
  },
];

interface TrainingSlidesProps {
  onComplete: () => void;
}

export function TrainingSlides({ onComplete }: TrainingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = SLIDES[currentSlide];

  return (
    <div>
      {/* Slide counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-500">
          {currentSlide + 1} / {SLIDES.length}
        </span>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentSlide ? "bg-orange-500" : i < currentSlide ? "bg-success-500" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
            {slide.icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{slide.title}</h3>
        </div>

        <ul className="space-y-3">
          {slide.points.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentSlide > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={() => setCurrentSlide((p) => p - 1)}
            className="flex-1"
          >
            Zpět
          </Button>
        )}
        {currentSlide < SLIDES.length - 1 ? (
          <Button
            variant="primary"
            size="default"
            onClick={() => setCurrentSlide((p) => p + 1)}
            className="flex-1"
          >
            Další
          </Button>
        ) : (
          <Button
            variant="primary"
            size="default"
            onClick={onComplete}
            className="flex-1"
          >
            Přejít na kvíz
          </Button>
        )}
      </div>
    </div>
  );
}
