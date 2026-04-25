import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

// Zod schema pro request body
const generateDescriptionSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2030),
  mileage: z.number().int().min(0),
  condition: z.string().min(1),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const parsed = generateDescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatný požadavek", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // System prompt pro generování popisů
    const systemPrompt = `Jsi expert na psaní inzerátů na prodej ojetých vozidel v češtině. Piš profesionální, důvěryhodné a lákavé popisy.

PRAVIDLA:
- Piš česky, profesionálním ale přátelským tónem
- Popis má mít 3-5 odstavců
- První odstavec: stručné představení vozu a jeho hlavní přednosti
- Prostřední odstavce: technický stav, výbava, servisní historie (pokud uvedeno)
- Poslední odstavec: výzva k akci, nabídka prohlídky
- Nepoužívej superlativy bez podkladu ("nejlepší na trhu")
- Zmiň konkrétní výbavu a vlastnosti
- Pokud jsou uvedeny highlights, zdůrazni je
- Nepoužívej emoji
- Nepiš nadpisy ani odrážky — pouze plynulý text`;

    const userPrompt = `Vygeneruj popis inzerátu pro toto vozidlo:

Značka: ${data.brand}
Model: ${data.model}
Rok: ${data.year}
Nájezd: ${data.mileage.toLocaleString("cs-CZ")} km
Stav: ${data.condition}
${data.fuelType ? `Palivo: ${data.fuelType}` : ""}
${data.transmission ? `Převodovka: ${data.transmission}` : ""}
${data.enginePower ? `Výkon: ${data.enginePower} kW` : ""}
${data.bodyType ? `Karoserie: ${data.bodyType}` : ""}
${data.color ? `Barva: ${data.color}` : ""}
${data.equipment?.length ? `Výbava: ${data.equipment.join(", ")}` : ""}
${data.highlights?.length ? `Hlavní přednosti: ${data.highlights.join(", ")}` : ""}`;

    // Volání Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const description =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Generate description error:", error);
    return NextResponse.json(
      { error: "Chyba při generování popisu" },
      { status: 500 }
    );
  }
}
