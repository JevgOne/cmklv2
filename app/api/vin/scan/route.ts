import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nahrajte fotografii" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Soubor je příliš velký (max 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 100,
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
              text: `Read the VIN code from this photograph. A VIN is a 17-character alphanumeric code (letters A-H, J-N, P, R-Z and digits 0-9 — never I, O, or Q).
Reply with ONLY the VIN code (17 characters, uppercase) without any other text.
If the VIN is not readable or not in the photograph, reply with the single word NONE.`,
            },
          ],
        },
      ],
    });

    const rawText =
      response.content[0].type === "text"
        ? response.content[0].text.trim().toUpperCase()
        : "";

    const match = rawText.match(VIN_REGEX);

    if (!match) {
      return NextResponse.json({
        found: false,
        message: "VIN nebyl rozpoznán. Zkuste lépe zaostřit na VIN kód.",
      });
    }

    return NextResponse.json({
      found: true,
      vin: match[0],
    });
  } catch (error) {
    console.error("POST /api/vin/scan error:", error);
    return NextResponse.json(
      { error: "Chyba při skenování VIN" },
      { status: 500 }
    );
  }
}
