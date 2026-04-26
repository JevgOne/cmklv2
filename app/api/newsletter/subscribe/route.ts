import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, RESEND_FROM } from "@/lib/resend";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Neplatný email"),
  name: z.string().max(100).optional(),
  source: z.enum(["BLOG", "FOOTER", "POPUP"]).optional(),
  honeypot: z.string().max(0).optional(), // Bot trap — musí být prázdné
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    // Honeypot check
    if (data.honeypot) {
      // Bot detected — tiše vrátíme úspěch
      return NextResponse.json({ success: true });
    }

    const confirmToken = crypto.randomUUID();

    // Upsert — pokud email existuje a je PENDING/UNSUBSCRIBED, aktualizovat
    await prisma.newsletterSubscriber.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.name,
        source: data.source || "BLOG",
        status: "PENDING",
        confirmToken,
      },
      update: {
        name: data.name || undefined,
        status: "PENDING",
        confirmToken,
        unsubscribedAt: null,
      },
    });

    // Double opt-in — poslat potvrzovací email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}/api/newsletter/confirm?token=${confirmToken}`;

    await sendEmail({
      from: RESEND_FROM,
      to: data.email,
      subject: "Potvrďte odběr novinek — CarMakléř",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #F97316;">Potvrďte odběr novinek</h2>
          <p>Děkujeme za zájem o novinky z CarMakléř blogu!</p>
          <p>Pro aktivaci odběru klikněte na tlačítko:</p>
          <a href="${confirmUrl}"
             style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Potvrdit odběr
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Pokud jste se nepřihlásili k odběru, tento email ignorujte.
          </p>
        </div>
      `,
      text: `Potvrďte odběr novinek CarMakléř: ${confirmUrl}`,
    });

    return NextResponse.json({
      success: true,
      message: "Na váš email jsme odeslali potvrzovací odkaz.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
