import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  if (!result.success) {
    const errorUrl = new URL("/overeni-emailu/chyba", process.env.NEXTAUTH_URL);
    errorUrl.searchParams.set("error", result.error || "Neznámá chyba");
    return NextResponse.redirect(errorUrl);
  }

  const successUrl = new URL("/overeni-emailu/uspech", process.env.NEXTAUTH_URL);
  return NextResponse.redirect(successUrl);
}
