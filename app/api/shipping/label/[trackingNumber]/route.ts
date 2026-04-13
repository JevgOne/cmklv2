import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/shipping/label/[trackingNumber]?carrier=ZASILKOVNA
 *
 * Proxy endpoint pro stahování PDF štítků z dopravce.
 * Zásilkovna API vrací PDF přímo — tenhle endpoint fetchne PDF
 * a předá ho klientovi s Content-Type: application/pdf.
 *
 * Auth: ADMIN, BACKOFFICE, PARTS_SUPPLIER
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.role ||
      !["ADMIN", "BACKOFFICE", "PARTS_SUPPLIER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { trackingNumber } = await params;
    const carrier = request.nextUrl.searchParams.get("carrier");

    if (carrier !== "ZASILKOVNA") {
      return NextResponse.json(
        { error: "Nepodporovaný dopravce" },
        { status: 400 },
      );
    }

    const apiPassword = process.env.ZASILKOVNA_API_PASSWORD;
    if (!apiPassword) {
      return NextResponse.json(
        { error: "Zásilkovna API není nakonfigurována" },
        { status: 503 },
      );
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetLabelPdf>
  <apiPassword>${escapeXml(apiPassword)}</apiPassword>
  <packetId>${escapeXml(trackingNumber)}</packetId>
  <format>A7 on A4</format>
  <offset>0</offset>
</packetLabelPdf>`;

    const response = await fetch("https://www.zasilkovna.cz/api/rest", {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xml,
    });

    if (!response.ok) {
      console.error(
        `[shipping:label] Zásilkovna packetLabelPdf HTTP ${response.status}`,
      );
      return NextResponse.json(
        { error: "Nepodařilo se stáhnout štítek" },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") || "";

    // Zásilkovna vrací XML s chybou místo PDF pokud je problém
    if (contentType.includes("xml") || contentType.includes("text")) {
      const text = await response.text();
      console.error("[shipping:label] Zásilkovna returned error:", text);
      return NextResponse.json(
        { error: "Zásilkovna odmítla vygenerovat štítek" },
        { status: 502 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="label-${trackingNumber}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[shipping:label] Error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 },
    );
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
