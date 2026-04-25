"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { StepComplete } from "./StepComplete";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Jaká je minimální provize makléře z prodeje vozidla?",
    options: ["10 000 Kč", "15 000 Kč", "25 000 Kč", "50 000 Kč"],
    correctIndex: 2,
  },
  {
    question: "Co je první krok před zahájením inzerce vozidla?",
    options: ["Nafocení vozidla", "Podpis makléřské smlouvy", "Zveřejnění inzerátu", "Dohoda o ceně"],
    correctIndex: 1,
  },
  {
    question: "Kolik procent z prodejní ceny tvoří provize makléře?",
    options: ["3%", "5%", "8%", "10%"],
    correctIndex: 1,
  },
  {
    question: "Jaký nástroj používáme pro automatické načtení údajů o vozidle?",
    options: ["GPS tracker", "VIN dekodér", "OBD scanner", "Databáze STK"],
    correctIndex: 1,
  },
  {
    question: "Jaký je minimální počet fotek pro inzerát?",
    options: ["5", "10", "15", "20"],
    correctIndex: 2,
  },
  {
    question: "Kdy se makléřovi vyplácí provize?",
    options: ["Při podpisu smlouvy", "Při zveřejnění inzerátu", "Po úspěšném prodeji a úhradě", "Každý měsíc"],
    correctIndex: 2,
  },
  {
    question: "Můžete klientovi slíbit garantovaný prodej?",
    options: ["Ano, vždy", "Ano, pokud je cena reálná", "Ne, nikdy", "Ano, do 30 dnů"],
    correctIndex: 2,
  },
  {
    question: "Co se stane s vozidlem po zadání do systému?",
    options: ["Automaticky se publikuje", "BackOffice ho schválí", "Makléř ho publikuje sám", "Nic, čeká na prodejce"],
    correctIndex: 1,
  },
  {
    question: "Jak často byste měli informovat prodejce o stavu prodeje?",
    options: ["Nikdy", "Jednou za měsíc", "Pravidelně", "Až při prodeji"],
    correctIndex: 2,
  },
  {
    question: "Funguje PWA aplikace offline?",
    options: ["Ne", "Ano, plně", "Jen čtení", "Jen s Wi-Fi"],
    correctIndex: 1,
  },
];

const PASS_THRESHOLD = 8; // 80%

export function QuizForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    setError("");

    // Check all questions answered
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      setError("Odpovězte na všechny otázky.");
      return;
    }

    // Calculate score
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    if (correct >= PASS_THRESHOLD) {
      // Submit to API
      setLoading(true);
      try {
        const res = await fetch("/api/onboarding/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: Object.entries(answers).map(([q, a]) => ({
              questionIndex: parseInt(q),
              answerIndex: a,
            })),
          }),
        });

        if (!res.ok) {
          setError("Uložení výsledku se nezdařilo.");
          setLoading(false);
          return;
        }

        setShowCelebration(true);
      } catch {
        setError("Došlo k chybě. Zkuste to znovu.");
        setLoading(false);
      }
    }
  };

  const handleContinue = useCallback(() => {
    router.push("/makler/onboarding/contract");
  }, [router]);

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setError("");
  };

  return (
    <>
    {showCelebration && (
      <StepComplete step={3} emoji="🎓" title="Školení dokončeno!" subtitle="Jste připraveni na úspěch v terénu." onContinue={handleContinue} />
    )}
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {submitted && score < PASS_THRESHOLD && (
        <Alert variant="warning">
          <div>
            <p className="text-sm font-semibold">
              Váš výsledek: {score}/{QUIZ_QUESTIONS.length}
            </p>
            <p className="text-sm mt-1">
              Potřebujete alespoň {PASS_THRESHOLD}/{QUIZ_QUESTIONS.length}. Zkuste to znovu.
            </p>
          </div>
        </Alert>
      )}

      {submitted && score >= PASS_THRESHOLD && (
        <Alert variant="success">
          <p className="text-sm font-semibold">
            Výborně! Váš výsledek: {score}/{QUIZ_QUESTIONS.length}
          </p>
        </Alert>
      )}

      {QUIZ_QUESTIONS.map((q, qi) => (
        <div key={qi} className="bg-white rounded-xl shadow-card p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            {qi + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((option, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.correctIndex;
              const isWrong = submitted && isSelected && oi !== q.correctIndex;

              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => handleSelect(qi, oi)}
                  disabled={submitted}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all",
                    !submitted && isSelected && "border-orange-500 bg-orange-50",
                    !submitted && !isSelected && "border-gray-200 hover:border-gray-300 bg-white",
                    isCorrect && "border-success-500 bg-success-50",
                    isWrong && "border-error-500 bg-error-50",
                    submitted && !isCorrect && !isWrong && "border-gray-200 bg-gray-50 opacity-60",
                    submitted ? "cursor-default" : "cursor-pointer"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <Button variant="primary" size="lg" onClick={handleSubmit} className="w-full">
          Odeslat odpovědi
        </Button>
      ) : score < PASS_THRESHOLD ? (
        <Button variant="primary" size="lg" onClick={handleRetry} className="w-full">
          Zkusit znovu
        </Button>
      ) : (
        <Button variant="primary" size="lg" onClick={() => router.push("/makler/onboarding/contract")} disabled={loading} className="w-full">
          {loading ? "Ukládám..." : "Pokračovat"}
        </Button>
      )}
    </div>
    </>
  );
}
