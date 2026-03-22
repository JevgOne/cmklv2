import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];
const MAKLER_ROLES = [
  "BROKER",
  "MANAGER",
  "REGIONAL_DIRECTOR",
  "ADMIN",
];
const INZERENT_ROLES = ["ADVERTISER", "ADMIN", "BACKOFFICE"];
const BUYER_ROLES = ["BUYER", "ADVERTISER", "ADMIN", "BACKOFFICE"];
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];

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

  // Chráněné onboarding routy — přístup jen pro BROKER v ONBOARDING stavu
  if (pathname.startsWith("/makler/onboarding")) {
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

  // Chranene makler routy — PWA stranky (ne verejne profily /makler/[slug])
  const protectedMaklerPaths = [
    "/makler/dashboard",
    "/makler/vehicles",
    "/makler/commissions",
    "/makler/profile",
    "/makler/offline",
    "/makler/assistant",
    "/makler/contracts",
    "/makler/leads",
    "/makler/messages",
    "/makler/contacts",
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

    // Makléř v ONBOARDING stavu → přesměrovat na onboarding (kromě /makler/onboarding)
    if (token.status === "ONBOARDING") {
      return NextResponse.redirect(new URL("/makler/onboarding", request.url));
    }
  }

  // Chráněné routy dodavatelů dílů
  const protectedPartsPaths = [
    "/parts",
  ];
  if (protectedPartsPaths.some((p) => pathname.startsWith(p))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!PARTS_SUPPLIER_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Chráněné marketplace dealer routy
  if (pathname.startsWith("/marketplace/dealer")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!MARKETPLACE_DEALER_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/marketplace", request.url));
    }
  }

  // Chráněné marketplace investor routy
  if (pathname.startsWith("/marketplace/investor")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!MARKETPLACE_INVESTOR_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/marketplace", request.url));
    }
  }

  // Chráněné routy inzertní platformy (moje-inzeraty, muj-ucet)
  // Přístup má každý přihlášený uživatel
  if (
    pathname.startsWith("/moje-inzeraty") ||
    pathname.startsWith("/muj-ucet")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/makler/onboarding",
    "/makler/onboarding/:path*",
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
    "/makler/assistant",
    "/makler/assistant/:path*",
    "/makler/contracts",
    "/makler/contracts/:path*",
    "/makler/leads",
    "/makler/leads/:path*",
    "/makler/messages",
    "/makler/messages/:path*",
    "/makler/contacts",
    "/makler/contacts/:path*",
    "/moje-inzeraty",
    "/moje-inzeraty/:path*",
    "/muj-ucet",
    "/muj-ucet/:path*",
    "/parts",
    "/parts/:path*",
    "/marketplace/dealer",
    "/marketplace/dealer/:path*",
    "/marketplace/investor",
    "/marketplace/investor/:path*",
  ],
};
