import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"];

const priceEstimateSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2027),
  mileage: z.number().int().min(0),
  condition: z.string().min(1),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().optional(),
  bodyType: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

const priceEstimateTool: Anthropic.Tool = {
  name: "price_estimate",
  description: "Returns a structured vehicle price estimate for the Czech market",
  input_schema: {
    type: "object" as const,
    properties: {
      min: { type: "number", description: "Lower bound of price range (CZK)" },
      max: { type: "number", description: "Upper bound of price range (CZK)" },
      suggested: { type: "number", description: "Recommended selling price (CZK)" },
      confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level based on available data" },
      reasoning: { type: "string", description: "Explanation in Czech (2-3 sentences)" },
    },
    required: ["min", "max", "suggested", "confidence", "reasoning"],
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = priceEstimateSchema.parse(body);

    // Query comparable SOLD vehicles from our own database
    const comparables = await prisma.vehicle.findMany({
      where: {
        brand: data.brand,
        model: data.model,
        status: "SOLD",
        soldPrice: { not: null },
        year: { gte: data.year - 2, lte: data.year + 2 },
      },
      select: {
        year: true,
        mileage: true,
        price: true,
        soldPrice: true,
        soldAt: true,
        condition: true,
        fuelType: true,
        transmission: true,
      },
      orderBy: { soldAt: "desc" },
      take: 20,
    });

    // Build prompt
    const comparablesText =
      comparables.length > 0
        ? `\nREÁLNÁ PRODEJNÍ DATA Z PLATFORMY (${comparables.length} vozidel):\n${comparables
            .map(
              (c) =>
                `- ${c.year} ${data.brand} ${data.model}, ${c.mileage} km, stav ${c.condition}, nabízeno za ${c.price} Kč, prodáno za ${c.soldPrice} Kč (${c.soldAt?.toLocaleDateString("cs-CZ") ?? "?"})`
            )
            .join("\n")}`
        : "\nNemám vlastní prodejní data pro tento model — odhadni z obecné znalosti trhu.";

    const equipmentText =
      data.equipment && data.equipment.length > 0
        ? `Výbava: ${data.equipment.join(", ")}`
        : "";

    const userPrompt = `Oceň toto vozidlo na českém trhu:

Značka: ${data.brand}
Model: ${data.model}
Rok výroby: ${data.year}
Nájezd: ${data.mileage} km
Stav: ${data.condition}
${data.fuelType ? `Palivo: ${data.fuelType}` : ""}
${data.transmission ? `Převodovka: ${data.transmission}` : ""}
${data.enginePower ? `Výkon: ${data.enginePower} kW` : ""}
${data.bodyType ? `Karoserie: ${data.bodyType}` : ""}
${equipmentText}
${comparablesText}`;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `Jsi expert na oceňování ojetých vozidel na českém trhu. Odhadni tržní cenu na základě parametrů vozidla a (pokud jsou k dispozici) reálných prodejních dat z platformy Carmakler.

PRAVIDLA:
- Vrať cenové rozmezí (min-max) a doporučenou cenu v Kč
- Zohledni: značku, model, rok, km, stav, palivo, převodovku, výbavu
- Český trh: populární značky (Škoda, VW, Hyundai, Kia) mají vyšší likviditu
- Stav vozidla: EXCELLENT +10%, GOOD baseline, FAIR -15%, DAMAGED -35%
- Servisní kniha: +5-10%
- Automatická převodovka: +5-15% (závisí na segmentu)
- Cenu vyjádři v CZK, zaokrouhli na 5000 Kč
- Pokud máš k dispozici comparable sales data, váží je vyšší váhou
- Buď upřímný o confidence — pokud nemáš dostatek dat, řekni to
- Reasoning piš česky (2-3 věty)`,
      messages: [{ role: "user", content: userPrompt }],
      tools: [priceEstimateTool],
      tool_choice: { type: "tool", name: "price_estimate" },
    });

    // Extract tool result
    const toolBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolBlock) {
      return NextResponse.json(
        { error: "AI nedokázal vygenerovat cenový odhad" },
        { status: 500 }
      );
    }

    const estimate = toolBlock.input as {
      min: number;
      max: number;
      suggested: number;
      confidence: "high" | "medium" | "low";
      reasoning: string;
    };

    // Override confidence based on actual comparable count
    let confidence = estimate.confidence;
    if (comparables.length >= 10) confidence = "high";
    else if (comparables.length >= 3) confidence = "medium";
    else confidence = "low";

    return NextResponse.json({
      min: estimate.min,
      max: estimate.max,
      suggested: estimate.suggested,
      confidence,
      reasoning: estimate.reasoning,
      comparablesCount: comparables.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/assistant/price-estimate error:", error);
    return NextResponse.json(
      { error: "Chyba při odhadu ceny" },
      { status: 500 }
    );
  }
}
