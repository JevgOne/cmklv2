import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";

/**
 * POST /api/admin/send-verification-emails
 * Admin-only endpoint pro jednorázové odeslání verifikačních emailů
 * všem existujícím uživatelům bez emailVerified.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    // Pouze admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { emailVerified: null, status: "ACTIVE" },
      select: { email: true, firstName: true },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        await sendVerificationEmail(user.email, user.firstName);
        sent++;
        // Rate limit: 2 emaily/sekunda (Resend limit)
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        errors.push(user.email);
        console.error(`Failed to send verification to ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      total: users.length,
      sent,
      failed: errors.length,
      failedEmails: errors,
    });
  } catch (error) {
    console.error("Admin send-verification-emails error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
