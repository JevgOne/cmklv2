"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SlidePoint {
  text: string;
  /** Highlighted key info that may appear in quiz */
  highlight?: boolean;
}

interface Slide {
  title: string;
  icon: string;
  intro: string;
  points: SlidePoint[];
  tip?: string;
}

const SLIDES: Slide[] = [
  {
    title: "Jak funguje CarMakléř",
    icon: "1",
    intro: "CarMakléř je platforma, která propojuje prodejce vozidel s certifikovanými makléři. Pochopte celý proces od A do Z.",
    points: [
      { text: "CarMakléř propojuje prodejce vozidel s ověřenými makléři — vy jste ten prostředník" },
      { text: "Makléř nabere auto v terénu, provede inspekci a zadá ho do systému přes PWA aplikaci" },
      { text: "BackOffice tým schválí vozidlo a publikuje inzerát na všechny portály", highlight: true },
      { text: "Vozidlo se po zadání do systému NEpublikuje automaticky — vždy musí projít schválením BackOffice", highlight: true },
      { text: "Provize makléře činí 5 % z prodejní ceny (minimálně 25 000 Kč)", highlight: true },
      { text: "Provize se vyplácí až po úspěšném prodeji a úhradě kupujícím — ne dříve", highlight: true },
    ],
    tip: "Příklad: Prodáte auto za 500 000 Kč → vaše provize je 25 000 Kč (5 %). Prodáte za 300 000 Kč → provize je stále 25 000 Kč (minimum).",
  },
  {
    title: "Jak nabrat auto",
    icon: "2",
    intro: "Nabírání auta je váš hlavní úkol. Kvalitní zpracování = rychlejší prodej = spokojený klient.",
    points: [
      { text: "Použijte VIN dekodér pro automatické načtení technických údajů vozidla — ušetří vám čas a snížíte chybovost", highlight: true },
      { text: "Pořiďte kvalitní fotky podle fotoprůvodce — minimálně 15 fotografií (exteriér, interiér, detaily, vady)", highlight: true },
      { text: "Proveďte důkladnou inspekci a poctivě zaznamenejte stav vozu — laky, poškrábání, mechanický stav" },
      { text: "Nastavte reálnou cenu na základě tržní analýzy — nadsazená cena = auto se neprodá" },
      { text: "Vše zadejte do PWA aplikace — funguje i offline, data se synchronizují po připojení k internetu", highlight: true },
      { text: "Čím kvalitněji auto zpracujete, tím rychleji BackOffice schválí a tím dříve se začne prodávat" },
    ],
    tip: "PWA aplikace funguje plně offline — můžete nabírat auta i v garáži bez signálu. Data se odešlou automaticky jakmile budete online.",
  },
  {
    title: "Jednání s prodejcem",
    icon: "3",
    intro: "Profesionální jednání buduje důvěru. Spokojený prodejce vás doporučí dalším a vy si vybudujete síť kontaktů.",
    points: [
      { text: "Vždy jednejte profesionálně a transparentně — prodejce musí rozumět celému procesu" },
      { text: "Podepište makléřskou smlouvu PŘED zahájením jakékoliv inzerce — to je povinný první krok", highlight: true },
      { text: "Nikdy neslibujte garantovaný prodej ani konkrétní termín — to není možné garantovat", highlight: true },
      { text: "Pravidelně informujte prodejce o stavu prodeje — alespoň jednou týdně", highlight: true },
      { text: "Při prohlídce buďte důkladní a upřímní o stavu vozu — vyhnete se pozdějším reklamacím" },
      { text: "Vysvětlete prodejci výhody: profesionální fotky, inzerce na všech portálech, ověření kupujících" },
    ],
    tip: "Dobrá komunikace = spokojený klient = doporučení dalším prodejcům. Jeden spokojený prodejce vám může přinést 3-5 dalších kontaktů.",
  },
  {
    title: "Právní minimum a pravidla",
    icon: "4",
    intro: "Dodržování pravidel chrání vás i klienty. Tyto body jsou klíčové — porušení může vést k ukončení spolupráce.",
    points: [
      { text: "Makléřská smlouva je povinný PRVNÍ krok — bez ní nesmíte vozidlo inzerovat ani nabízet", highlight: true },
      { text: "Nikdy neslibujte garantovaný prodej ani konkrétní čas prodeje", highlight: true },
      { text: "Ověřujte vlastnictví vozu — prodejce musí být skutečným vlastníkem nebo mít plnou moc" },
      { text: "Provize se vyplácí výhradně po úspěšném prodeji a úhradě — nikdy předem", highlight: true },
      { text: "Dodržujte GDPR — osobní údaje klientů nesmíte předávat třetím stranám ani používat pro jiné účely" },
      { text: "Veškeré smlouvy a dokumenty zpracovávejte přes platformu CarMakléř — máte je pak vždy k dispozici" },
    ],
    tip: "Zapamatujte si: Smlouva → Fotky → Systém → Schválení → Inzerce → Prodej → Provize. V tomto pořadí, nikdy jinak.",
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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
            {slide.icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{slide.title}</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{slide.intro}</p>

        <ul className="space-y-3">
          {slide.points.map((point, i) => (
            <li key={i} className={cn(
              "flex items-start gap-3 rounded-lg p-2 -mx-2",
              point.highlight && "bg-orange-50 border border-orange-100"
            )}>
              <svg className={cn(
                "w-5 h-5 mt-0.5 shrink-0",
                point.highlight ? "text-orange-500" : "text-gray-400"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={cn(
                "text-sm leading-relaxed",
                point.highlight ? "text-gray-900 font-medium" : "text-gray-700"
              )}>{point.text}</span>
            </li>
          ))}
        </ul>

        {slide.tip && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold">Tip: </span>
              {slide.tip}
            </p>
          </div>
        )}
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
