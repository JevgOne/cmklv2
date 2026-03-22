import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { externalLeadSchema } from "@/lib/validators/lead";
import { assignRegionByCity, checkDuplicateLead } from "@/lib/lead-management";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // API key auth
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey || apiKey !== process.env.LEADS_API_KEY) {
      return NextResponse.json(
        { error: "Neplatný API klíč" },
        { status: 401 }
      );
    }

    // Rate limiting: 100 requests per hour
    const rateLimitKey = `leads-external:${apiKey}`;
    if (!checkRateLimit(rateLimitKey, 100, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Překročen limit požadavků. Max 100/hod." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = externalLeadSchema.parse(body);

    // Duplicate check: same phone + brand + model within 30 days
    const isDuplicate = await checkDuplicateLead(
      data.phone,
      data.brand,
      data.model
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: "Duplicitní lead — stejný kontakt a vozidlo za posledních 30 dní" },
        { status: 409 }
      );
    }

    // Auto-assign region
    const regionId = data.city
      ? await assignRegionByCity(data.city)
      : null;

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
        year: data.year ?? null,
        mileage: data.mileage ?? null,
        expectedPrice: data.expectedPrice ?? null,
        description: data.description ?? null,
        city: data.city ?? null,
        regionId,
        source: "EXTERNAL_APP",
        externalId: data.externalId ?? null,
        sourceDetail: data.sourceDetail ?? null,
        status: "NEW",
      },
    });

    return NextResponse.json(
      { id: lead.id, status: lead.status },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/leads/external error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
