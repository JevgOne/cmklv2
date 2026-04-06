import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validators/marketplace";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/resend";
import {
  marketplaceApplicationAdminHtml,
  marketplaceApplicationAdminText,
  marketplaceApplicationAdminSubject,
} from "@/lib/email-templates/marketplace-application-admin";
import {
  marketplaceApplicationConfirmationHtml,
  marketplaceApplicationConfirmationText,
  marketplaceApplicationConfirmationSubject,
} from "@/lib/email-templates/marketplace-application-confirmation";

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/apply — Veřejná žádost o přístup              */
/*  (NEautentizované — kdokoli může podat žádost)                       */
/* ------------------------------------------------------------------ */

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minut
const RATE_LIMIT_MAX = 5; // 5 žádostí za 15 minut z jedné IP

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    // 1. Rate limit (IP-based)
    const limit = rateLimit(`marketplace-apply:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Příliš mnoho žádostí z této IP adresy. Zkuste to prosím za 15 minut." },
        { status: 429 }
      );
    }

    // 2. Parse body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Neplatný formát požadavku" },
        { status: 400 }
      );
    }

    // 3. Honeypot check — bot vyplnil skrytý field "website"
    if ("website" in body && typeof body.website === "string" && body.website.length > 0) {
      // Silent success — vrátíme 200, jako by bylo vše OK
      console.warn(`[Marketplace Apply] Honeypot triggered from IP ${ip}`);
      return NextResponse.json({
        success: true,
        message: "Žádost byla odeslána. Ozveme se vám do 48 hodin.",
      });
    }

    // 4. Validate
    const data = applySchema.parse(body);

    // 5. Anti-duplicate — stejný email + NEW status za posledních 24h
    const recentDuplicate = await prisma.marketplaceApplication.findFirst({
      where: {
        email: data.email,
        status: "NEW",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        {
          error:
            "Již jste podali žádost v posledních 24 hodinách. Kontaktujeme vás co nejdříve.",
        },
        { status: 409 }
      );
    }

    // 6. Uložit do DB
    const application = await prisma.marketplaceApplication.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        companyName: data.companyName || null,
        ico: data.ico || null,
        investmentRange: data.investmentRange || null,
        message: data.message,
        gdprConsent: data.gdprConsent,
        status: "NEW",
        ipAddress: ip !== "unknown" ? ip : null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    // 7. Poslat email adminům (dry-run fallback je v lib/resend.ts)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, email: true },
    });

    if (admins.length > 0) {
      const baseUrl =
        process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://carmakler.cz";
      const adminEmailData = {
        applicationId: application.id,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName || null,
        ico: data.ico || null,
        investmentRange: data.investmentRange || null,
        message: data.message,
        createdAtIso: application.createdAt.toISOString(),
        ipAddress: ip !== "unknown" ? ip : null,
        adminPanelUrl: `${baseUrl}/admin/marketplace/applications/${application.id}`,
      };

      // Fire-and-forget — neblokuj response pokud email selže
      sendEmail({
        to: admins.map((a) => a.email),
        subject: marketplaceApplicationAdminSubject(adminEmailData),
        html: marketplaceApplicationAdminHtml(adminEmailData),
        text: marketplaceApplicationAdminText(adminEmailData),
      }).catch((err) => {
        console.error("[Marketplace Apply] Admin email failed:", err);
      });

      // Notifikace do DB pro adminy (existing pattern)
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM",
          title: `Nová marketplace žádost — ${data.role === "VERIFIED_DEALER" ? "Realizátor" : "Investor"}`,
          body: `${data.firstName} ${data.lastName} (${data.email}): ${data.message.slice(0, 120)}${data.message.length > 120 ? "…" : ""}`,
          link: `/admin/marketplace/applications/${application.id}`,
        })),
      });
    }

    // 8. Confirmation email žadateli
    sendEmail({
      to: data.email,
      subject: marketplaceApplicationConfirmationSubject(),
      html: marketplaceApplicationConfirmationHtml({
        firstName: data.firstName,
        role: data.role,
      }),
      text: marketplaceApplicationConfirmationText({
        firstName: data.firstName,
        role: data.role,
      }),
    }).catch((err) => {
      console.error("[Marketplace Apply] Confirmation email failed:", err);
    });

    // 9. Response
    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        message: "Žádost byla odeslána. Ozveme se vám do 48 hodin.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/apply error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
