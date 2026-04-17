import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Rate limiting: max 3 requesty za hodinu na email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        email,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTokens >= 3) {
      // Nevracet chybu — security (neodhalovat zda email existuje)
      return NextResponse.json({
        message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
      });
    }

    // Najit uzivatele
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, email: true, status: true },
    });

    // BEZPECNOST: Vzdy vracet stejnou odpoved (i pokud email neexistuje)
    if (!user || (user.status !== "ACTIVE" && user.status !== "ONBOARDING")) {
      return NextResponse.json({
        message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
      });
    }

    // Generovat token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // Odeslat email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}/reset-hesla/${token}`;

    await sendEmail({
      to: email,
      subject: "Obnova hesla | Carmakler",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Carmakler</h1>
          </div>
          <div style="padding: 32px;">
            <p>Dobry den${user.firstName ? ` ${user.firstName}` : ""},</p>
            <p>obdrzeli jsme zadost o obnovu hesla k vasemu uctu.</p>
            <p>Pro nastaveni noveho hesla kliknete na tlacitko nize:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Nastavit nove heslo
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Odkaz je platny 1 hodinu. Pokud jste o obnovu hesla nezadali, tento email ignorujte.</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">Pokud tlacitko nefunguje, zkopirujte tento odkaz: ${resetUrl}</p>
          </div>
          <div style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Carmakler — prodej aut pres overene maklere</p>
          </div>
        </div>
      `,
      text: `Obnova hesla Carmakler\n\nPro nastaveni noveho hesla otevrete tento odkaz: ${resetUrl}\n\nOdkaz je platny 1 hodinu.`,
    });

    return NextResponse.json({
      message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
