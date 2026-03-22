export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Kolik je minimální provize za zprostředkování prodeje?",
    options: ["10 000 Kč", "15 000 Kč", "25 000 Kč", "50 000 Kč"],
    correctAnswer: "25 000 Kč",
  },
  {
    id: "q2",
    question: "Co znamená exkluzivní smlouva?",
    options: [
      "Prodejce může prodávat i přes jiné kanály",
      "Prodejce nesmí prodávat jinde po dobu platnosti smlouvy",
      "Makléř může nabízet auto pouze na jednom portálu",
      "Auto je nabízeno pouze VIP klientům",
    ],
    correctAnswer: "Prodejce nesmí prodávat jinde po dobu platnosti smlouvy",
  },
  {
    id: "q3",
    question: "Kolik fotek je minimum pro kvalitní inzerát?",
    options: ["5", "8", "12", "20"],
    correctAnswer: "12",
  },
  {
    id: "q4",
    question: "Může prodejce auto používat během inzerce?",
    options: [
      "Ne, auto musí být zaparkované",
      "Ano, ale nesmí najíždět více než 500 km",
      "Ano",
      "Pouze po schválení manažerem",
    ],
    correctAnswer: "Ano",
  },
  {
    id: "q5",
    question: "Co uděláte, když zjistíte stočený tachometr?",
    options: [
      "Nabrat auto s upozorněním v inzerátu",
      "Odmítnout vůz",
      "Snížit cenu o 20 %",
      "Kontaktovat policii",
    ],
    correctAnswer: "Odmítnout vůz",
  },
  {
    id: "q6",
    question: "Jaká je standardní provize makléře z prodejní ceny?",
    options: ["3 %", "5 %", "10 %", "15 %"],
    correctAnswer: "5 %",
  },
  {
    id: "q7",
    question: "Co je prvním krokem při nabírání nového vozu?",
    options: [
      "Vyfotit auto",
      "Ověřit VIN a historii vozu",
      "Podepsat smlouvu",
      "Stanovit cenu",
    ],
    correctAnswer: "Ověřit VIN a historii vozu",
  },
  {
    id: "q8",
    question: "Jak dlouho platí zprostředkovatelská smlouva standardně?",
    options: ["1 měsíc", "3 měsíce", "6 měsíců", "12 měsíců"],
    correctAnswer: "3 měsíce",
  },
  {
    id: "q9",
    question: "Co musíte zkontrolovat na STK?",
    options: [
      "Zda je auto čisté",
      "Datum platnosti STK",
      "Barvu razítka",
      "Jméno technika",
    ],
    correctAnswer: "Datum platnosti STK",
  },
  {
    id: "q10",
    question: "Jaké údaje prodejce potřebujete pro smlouvu?",
    options: [
      "Pouze jméno a telefon",
      "Jméno, adresu, číslo OP a rodné číslo",
      "Pouze email",
      "Číslo řidičského průkazu",
    ],
    correctAnswer: "Jméno, adresu, číslo OP a rodné číslo",
  },
];

export const QUIZ_PASS_THRESHOLD = 80; // Minimum 80 % správných odpovědí

export function evaluateQuiz(answers: Record<string, string>): {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
} {
  const totalCount = quizQuestions.length;
  let correctCount = 0;

  for (const question of quizQuestions) {
    if (answers[question.id] === question.correctAnswer) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / totalCount) * 100);

  return {
    score,
    passed: score >= QUIZ_PASS_THRESHOLD,
    correctCount,
    totalCount,
  };
}
