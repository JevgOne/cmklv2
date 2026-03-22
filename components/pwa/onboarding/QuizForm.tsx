"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Jaka je minimalni provize maklere z prodeje vozidla?",
    options: ["10 000 Kc", "15 000 Kc", "25 000 Kc", "50 000 Kc"],
    correctIndex: 2,
  },
  {
    question: "Co je prvni krok pred zahajenim inzerce vozidla?",
    options: ["Nafoceni vozidla", "Podpis maklerske smlouvy", "Zverejneni inzeratu", "Dohoda o cene"],
    correctIndex: 1,
  },
  {
    question: "Kolik procent z prodejni ceny tvori provize maklere?",
    options: ["3%", "5%", "8%", "10%"],
    correctIndex: 1,
  },
  {
    question: "Jaky nastroj pouzivame pro automaticke nacteni udaju o vozidle?",
    options: ["GPS tracker", "VIN dekoder", "OBD scanner", "Databaze STK"],
    correctIndex: 1,
  },
  {
    question: "Jaky je minimalni pocet fotek pro inzerat?",
    options: ["5", "10", "15", "20"],
    correctIndex: 2,
  },
  {
    question: "Kdy se maklerovi vyplaci provize?",
    options: ["Pri podpisu smlouvy", "Pri zverejneni inzeratu", "Po uspesnem prodeji a uhrade", "Kazdy mesic"],
    correctIndex: 2,
  },
  {
    question: "Muzete klientovi slíbit garantovany prodej?",
    options: ["Ano, vzdy", "Ano, pokud je cena realna", "Ne, nikdy", "Ano, do 30 dnu"],
    correctIndex: 2,
  },
  {
    question: "Co se stane s vozidlem po zadani do systemu?",
    options: ["Automaticky se publikuje", "BackOffice ho schvali", "Makler ho publikuje sam", "Nic, ceka na prodejce"],
    correctIndex: 1,
  },
  {
    question: "Jak casto byste meli informovat prodejce o stavu prodeje?",
    options: ["Nikdy", "Jednou za mesic", "Pravidelne", "Az pri prodeji"],
    correctIndex: 2,
  },
  {
    question: "Funguje PWA aplikace offline?",
    options: ["Ne", "Ano, plne", "Jen cteni", "Jen s Wi-Fi"],
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

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    setError("");

    // Check all questions answered
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      setError("Odpovedete na vsechny otazky.");
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
          setError("Ulozeni vysledku se nezdarilo.");
          setLoading(false);
          return;
        }

        router.push("/makler/onboarding/contract");
      } catch {
        setError("Doslo k chybe. Zkuste to znovu.");
        setLoading(false);
      }
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setError("");
  };

  return (
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
              Vas vysledek: {score}/{QUIZ_QUESTIONS.length}
            </p>
            <p className="text-sm mt-1">
              Potrebujete alespon {PASS_THRESHOLD}/{QUIZ_QUESTIONS.length}. Zkuste to znovu.
            </p>
          </div>
        </Alert>
      )}

      {submitted && score >= PASS_THRESHOLD && (
        <Alert variant="success">
          <p className="text-sm font-semibold">
            Vyborne! Vas vysledek: {score}/{QUIZ_QUESTIONS.length}
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
          Odeslat odpovedi
        </Button>
      ) : score < PASS_THRESHOLD ? (
        <Button variant="primary" size="lg" onClick={handleRetry} className="w-full">
          Zkusit znovu
        </Button>
      ) : (
        <Button variant="primary" size="lg" onClick={() => router.push("/makler/onboarding/contract")} disabled={loading} className="w-full">
          {loading ? "Ukladam..." : "Pokracovat"}
        </Button>
      )}
    </div>
  );
}
