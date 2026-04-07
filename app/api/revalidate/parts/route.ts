/**
 * POST /api/revalidate/parts — On-demand SSG cache invalidation pro /dily/znacka/* tree.
 *
 * Plán: plan-task-143-87d-revalidation.md §3.1 + §11 LEAD DECISIONS Q3/Q5/Q6/Q7.
 *
 * Auth: constant-time compare proti `process.env.REVALIDATE_SECRET` (separátní od
 * CRON_SECRET — different threat model, lead Q5).
 *
 * Edge cases (per dispatch):
 * - brand+model+year → 1 path (single year)
 * - brand+model → model page + all years (getValidYearsForModel)
 * - brand only → brand page + all models + all years + /dily root (lead Q7)
 * - empty body (no brand) → 400 Bad Request (lead Q3)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import {
  PARTS_BRANDS,
  PARTS_MODELS_BY_BRAND,
  getValidYearsForModel,
} from "@/lib/seo-data";

// revalidatePath() requires Node.js runtime — Edge nepodporuje cache APIs.
export const runtime = "nodejs";
// POST endpoint, nikdy necachovat response.
export const dynamic = "force-dynamic";

const RevalidateRequestSchema = z
  .object({
    brand: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1990).max(2030).optional(),
    secret: z.string().min(16).max(256),
  })
  .refine((data) => !data.model || !!data.brand, {
    message: "model requires brand",
    path: ["model"],
  })
  .refine((data) => !data.year || !!data.model, {
    message: "year requires model",
    path: ["year"],
  });

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function buildPathsToRevalidate(input: {
  brand?: string;
  model?: string;
  year?: number;
}): string[] {
  const { brand, model, year } = input;
  const paths: string[] = [];

  if (brand && model && year !== undefined) {
    // Case 1: full match — single year page
    paths.push(`/dily/znacka/${brand}/${model}/${year}`);
  } else if (brand && model) {
    // Case 2: brand + model — model page + all year pages
    const years = getValidYearsForModel(brand, model);
    for (const y of years) {
      paths.push(`/dily/znacka/${brand}/${model}/${y}`);
    }
    paths.push(`/dily/znacka/${brand}/${model}`);
  } else if (brand) {
    // Case 3: brand only — brand page + all model pages + all year pages + /dily root
    const models = PARTS_MODELS_BY_BRAND[brand] || [];
    for (const m of models) {
      const years = getValidYearsForModel(brand, m.slug);
      for (const y of years) {
        paths.push(`/dily/znacka/${brand}/${m.slug}/${y}`);
      }
      paths.push(`/dily/znacka/${brand}/${m.slug}`);
    }
    paths.push(`/dily/znacka/${brand}`);
    // /dily landing může obsahovat "popular brands" — refresh při bulk (lead Q7).
    paths.push(`/dily`);
  }

  return paths;
}

export async function POST(req: NextRequest) {
  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  // 2. Zod validate (shape + refinements)
  const parsed = RevalidateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // 3. Verify secret (constant-time)
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    console.error("[revalidate] REVALIDATE_SECRET env var not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  if (!safeCompare(parsed.data.secret, expectedSecret)) {
    console.warn(
      `[revalidate] auth failure from ${req.headers.get("x-forwarded-for") || "unknown"}`
    );
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 4. Require at least brand (lead Q3 — empty body → 400, žádný full /dily fallback)
  if (!parsed.data.brand) {
    console.warn(
      `[revalidate] empty scope from ${req.headers.get("x-forwarded-for") || "unknown"}`
    );
    return NextResponse.json(
      { error: "at least one of brand/model/year required" },
      { status: 400 }
    );
  }

  // 5. Verify brand exists v PARTS_BRANDS
  const brandExists = PARTS_BRANDS.some((b) => b.slug === parsed.data.brand);
  if (!brandExists) {
    return NextResponse.json(
      { error: `brand '${parsed.data.brand}' not in PARTS_BRANDS` },
      { status: 404 }
    );
  }

  // 6. Build paths + revalidate (per-path try/catch — partial failures ok)
  const pathsToRevalidate = buildPathsToRevalidate(parsed.data);
  const revalidated: string[] = [];
  const errors: string[] = [];

  for (const path of pathsToRevalidate) {
    try {
      revalidatePath(path, "page");
      revalidated.push(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${path}: ${message}`);
    }
  }

  // 7. Log + return
  console.log(
    `[revalidate] ${req.headers.get("x-forwarded-for") || "unknown"} → ${revalidated.length} paths (errors: ${errors.length})`
  );

  // HTTP 500 jen pokud VŠECHNY revalidations fail (catastrophic).
  const status = errors.length > 0 && revalidated.length === 0 ? 500 : 200;
  return NextResponse.json({ revalidated, errors }, { status });
}
