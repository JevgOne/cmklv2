import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRedirectByRole } from "@/lib/auth-redirect";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ url: "/login" });
  }
  return NextResponse.json({ url: getRedirectByRole(session.user.role) });
}
