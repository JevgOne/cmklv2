import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoutLeadIngestSchema } from "@/lib/validators/scout-lead";
import { ingestScoutLeads } from "@/lib/scout-lead-management";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
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
    // X-API-Key auth
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey || apiKey !== process.env.SCOUT_LEADS_API_KEY) {
      return NextResponse.json(
        { error: "Neplatný API klíč" },
        { status: 401 }
      );
    }

    // Rate limiting: 500 requests per hour
    const rateLimitKey = `scout-leads-ingest:${apiKey}`;
    if (!checkRateLimit(rateLimitKey, 500, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Překročen limit požadavků. Max 500/hod." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = scoutLeadIngestSchema.parse(body);

    const result = await ingestScoutLeads(data.leads);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/scout-leads/ingest error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
