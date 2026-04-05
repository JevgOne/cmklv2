import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 3, 60 * 60 * 1000); // 3x za hodinu
  if (!success) {
    return NextResponse.json(
      { error: "Příliš mnoho pokusů. Zkuste to za hodinu." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Bezpečnostní: vždy vracet OK (neprozrazovat jestli email existuje)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      await sendVerificationEmail(email, user.firstName);
    }

    return NextResponse.json({
      message: "Pokud máte u nás účet, odeslali jsme vám ověřovací email.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatný email" },
        { status: 400 }
      );
    }
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
