import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];
const MAKLER_ROLES = [
  "BROKER",
  "MANAGER",
  "REGIONAL_DIRECTOR",
  "ADMIN",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chráněné admin routy
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!ADMIN_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Chráněné makléř routy — POUZE /makler/dashboard (ne veřejné profily /makler/[slug])
  if (pathname.startsWith("/makler/dashboard")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!MAKLER_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/makler/dashboard", "/makler/dashboard/:path*"],
};
