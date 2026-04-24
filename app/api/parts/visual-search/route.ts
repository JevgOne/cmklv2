import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/parts/visual-search — Vizuální rozpoznání dílu            */
/*  Stub: Claude Vision pokud ANTHROPIC_API_KEY, jinak fallback.       */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nahrajte fotografii dílu" }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      return NextResponse.json({
        recognized: false,
        message: "Vizuální vyhledávání je momentálně nedostupné. Zkuste popsat díl textově.",
        suggestions: [],
        status: "unavailable",
      }, { status: 503 });
    }

    // Claude Vision rozpoznání
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: anthropicKey });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Rozpoznej tento autodíl. Odpověz POUZE validním JSON (bez markdown):
{ "partType": "název dílu česky", "category": "ENGINE|BRAKES|BODY|SUSPENSION|ELECTRICAL|INTERIOR|WHEELS|EXHAUST|COOLING|FUEL|TRANSMISSION|OTHER",
  "oemNumber": "pokud viditelné, jinak null",
  "manufacturer": "pokud viditelný, jinak null",
  "confidence": 0.0-1.0 }`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    // Hledat díly v katalogu
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (parsed.category) where.category = parsed.category;
    if (parsed.oemNumber) {
      where.OR = [
        { oemNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
        { name: { contains: parsed.partType, mode: "insensitive" } },
      ];
    } else if (parsed.partType) {
      where.name = { contains: parsed.partType, mode: "insensitive" };
    }

    const suggestions = await prisma.part.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      take: 6,
      orderBy: { viewCount: "desc" },
    });

    return NextResponse.json({
      recognized: true,
      partType: parsed.partType,
      category: parsed.category,
      oemNumber: parsed.oemNumber,
      manufacturer: parsed.manufacturer,
      confidence: parsed.confidence,
      suggestions: suggestions.map((s) => ({
        ...s,
        image: s.images[0]?.url ?? null,
        images: undefined,
      })),
    });
  } catch (error) {
    console.error("Visual search error:", error);
    return NextResponse.json({
      recognized: false,
      message: "Nepodařilo se rozpoznat díl. Zkuste popsat textově.",
      suggestions: [],
    });
  }
}
