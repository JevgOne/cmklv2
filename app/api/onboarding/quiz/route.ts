import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const quizSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      answerIndex: z.number(),
    })
  ),
});

const PASS_THRESHOLD = 80; // 80%

// Správné odpovědi kvízu — server-side source of truth
// Indexy odpovídají QUIZ_QUESTIONS v QuizForm.tsx
const CORRECT_ANSWERS: Record<number, number> = {
  0: 2, // 25 000 Kč
  1: 1, // Podpis makléřské smlouvy
  2: 1, // 5%
  3: 1, // VIN dekodér
  4: 2, // 15 fotek
  5: 2, // Po úspěšném prodeji a úhradě
  6: 2, // Ne, nikdy
  7: 1, // BackOffice ho schválí
  8: 2, // Pravidelně
  9: 1, // Ano, plně
};

const TOTAL_QUESTIONS = Object.keys(CORRECT_ANSWERS).length;

// POST /api/onboarding/quiz — odeslání odpovědí kvízu
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "BROKER" || session.user.status !== "ONBOARDING") {
      return NextResponse.json(
        { error: "Tato akce je dostupná pouze pro makléře v onboardingu" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = quizSubmitSchema.parse(body);

    // Vyhodnocení na serveru — klient nemůže podvrhnout skóre
    let correctCount = 0;
    for (const answer of data.answers) {
      if (CORRECT_ANSWERS[answer.questionIndex] === answer.answerIndex) {
        correctCount++;
      }
    }

    const scorePercent = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
    const passed = scorePercent >= PASS_THRESHOLD;

    if (passed) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          quizScore: scorePercent,
          onboardingStep: 4, // posun na krok 4 (smlouva)
        },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          quizScore: scorePercent,
        },
      });
    }

    return NextResponse.json({
      score: scorePercent,
      passed,
      correctCount,
      totalCount: TOTAL_QUESTIONS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Onboarding quiz error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
