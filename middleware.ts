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

  // Chranene makler routy — PWA stranky (ne verejne profily /makler/[slug])
  const protectedMaklerPaths = [
    "/makler/dashboard",
    "/makler/vehicles",
    "/makler/commissions",
    "/makler/profile",
    "/makler/offline",
  ];
  if (protectedMaklerPaths.some((p) => pathname.startsWith(p))) {
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
  matcher: [
    "/admin/:path*",
    "/makler/dashboard",
    "/makler/dashboard/:path*",
    "/makler/vehicles",
    "/makler/vehicles/:path*",
    "/makler/commissions",
    "/makler/commissions/:path*",
    "/makler/profile",
    "/makler/profile/:path*",
    "/makler/offline",
    "/makler/offline/:path*",
  ],
};
