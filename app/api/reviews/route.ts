import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

const reviewSchema = z.object({
  authorName: z.string().min(1, "Jméno je povinné").max(100),
  authorCity: z.string().max(100).optional(),
  text: z.string().min(10, "Recenze musí mít alespoň 10 znaků").max(2000),
  rating: z.number().int().min(1).max(5),
  type: z.enum(["GENERAL", "SALE", "PURCHASE", "PARTS", "MARKETPLACE"]).default("GENERAL"),
});

/* POST /api/reviews — Submit a new review (unpublished, needs admin approval) */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(ip, 3, 10 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Příliš mnoho požadavků. Zkuste to za 10 minut." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const data = reviewSchema.parse(body);

    const review = await prisma.review.create({
      data: {
        authorName: data.authorName,
        authorCity: data.authorCity || null,
        text: data.text,
        rating: data.rating,
        type: data.type,
        isPublished: false,
        source: "WEB_FORM",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] }, status: "ACTIVE" },
      select: { id: true },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "SYSTEM",
        title: "Nová recenze ke schválení",
        body: `${data.authorName}: ${data.rating}★ — ${data.text.slice(0, 80)}...`,
        link: "/admin/reviews",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, reviewId: review.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
