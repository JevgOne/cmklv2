import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  POST /api/csp-report — CSP violation reports                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = body["csp-report"] ?? body;

    // Log v development, v produkci jen důležité
    if (process.env.NODE_ENV === "development") {
      console.warn("[CSP Violation]", JSON.stringify(report, null, 2));
    } else {
      console.warn(
        `[CSP Violation] ${report["violated-directive"] ?? report.violatedDirective} | ${report["blocked-uri"] ?? report.blockedURL} | ${report["document-uri"] ?? report.documentURL}`
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
