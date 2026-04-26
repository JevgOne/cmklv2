import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

const generateBioSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const BIO_QUESTION_LABELS: Record<string, string> = {
  experience: "Délka zkušeností",
  region: "Region působnosti",
  brands: "Preferované značky",
  motivation: "Motivace",
  vehicle_types: "Typ vozidel",
  certifications: "Certifikace",
  differentiator: "Odlišení od konkurence",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateBioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatný požadavek" },
        { status: 400 }
      );
    }

    const { answers } = parsed.data;

    const filledAnswers = Object.entries(answers)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${BIO_QUESTION_LABELS[k] || k}: ${v.trim()}`);

    if (filledAnswers.length < 3) {
      return NextResponse.json(
        { error: "Vyplňte alespoň 3 otázky" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `Jsi copywriter pro platformu Carmakler — síť certifikovaných automobilových makléřů.
Z odpovědí makléře vygeneruj profesionální bio (3-4 věty) v češtině.

PRAVIDLA:
- Piš ve třetí osobě ("Martin má 5 let zkušeností...")
- Profesionální ale přátelský tón
- Zdůrazni silné stránky a odlišení
- Nepoužívej superlativy bez podkladu
- Nepoužívej emoji
- Výstup: pouze text bio, žádné nadpisy ani odrážky`,
      messages: [
        {
          role: "user",
          content: `Vygeneruj profesionální bio makléře z těchto odpovědí:\n\n${filledAnswers.join("\n")}`,
        },
      ],
    });

    const bio =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ bio });
  } catch (error) {
    console.error("Generate bio error:", error);
    return NextResponse.json(
      { error: "Chyba při generování bio" },
      { status: 500 }
    );
  }
}
