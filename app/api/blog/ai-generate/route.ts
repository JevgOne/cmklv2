import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const generateSchema = z.object({
  topic: z.string().min(5).max(500),
  categoryName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Pouze admin může generovat články" }, { status: 403 });
    }

    const body = await request.json();
    const { topic, categoryName } = generateSchema.parse(body);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const prompt = `Jsi redaktor automobilového magazínu CarMakléř. Napiš článek na téma: "${topic}".
${categoryName ? `Kategorie: ${categoryName}.` : ""}

Požadavky:
- Článek piš v češtině
- Délka 400–600 slov
- Formátuj jako HTML (h2, h3, p, ul/li, strong)
- Nezačínej elementem h1 (ten se přidá automaticky z titulku)
- Piš odborně ale srozumitelně pro běžného čtenáře
- Zaměř se na praktické informace a rady

Vrať JSON objekt s těmito poli:
- title: titulek článku (max 80 znaků)
- slug: URL-friendly slug (jen malá písmena, čísla a pomlčky)
- excerpt: krátký úvodní text (max 200 znaků)
- content: HTML obsah článku
- seoTitle: SEO titulek (max 60 znaků)
- seoDescription: SEO popis (max 155 znaků)
- readTime: odhadovaný čas čtení v minutách (číslo)

Vrať POUZE validní JSON, žádný markdown wrapper.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "AI nevrátila text" }, { status: 500 });
    }

    const parsed = JSON.parse(textBlock.text);

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/blog/ai-generate error:", error);
    return NextResponse.json({ error: "Chyba při generování článku" }, { status: 500 });
  }
}
