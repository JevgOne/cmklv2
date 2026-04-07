import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSubdomain, type SubdomainType } from "@/lib/subdomain";
import { aliasFor } from "@/lib/seo/slugify";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
const MAKLER_ROLES = [
  "BROKER",
  "MANAGER",
  "REGIONAL_DIRECTOR",
  "ADMIN",
];
const INZERENT_ROLES = ["ADVERTISER", "ADMIN", "BACKOFFICE"];
const BUYER_ROLES = ["BUYER", "ADVERTISER", "ADMIN", "BACKOFFICE"];
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];

// Cesty, které se nemají rewritovat (statické soubory, API, interní Next.js cesty)
const SKIP_REWRITE_PREFIXES = [
  "/api/",
  "/_next/",
  "/brand/",
  "/icons/",
  "/sw.js",
  "/manifest",
  "/favicon",
  "/login",
  "/registrace",
  "/prihlaseni",
  "/admin",
  "/makler",
  "/parts",
  "/partner",
  "/moje-inzeraty",
  "/muj-ucet",
  "/notifikace",
];

function shouldSkipRewrite(pathname: string): boolean {
  return SKIP_REWRITE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * /dily/znacka/{brand}[/{model}[/{rok}]] diakritika 301 redirect.
 * Vrací canonical path pokud aspoň jeden segment má diakritika alias, jinak null.
 * Musí běžet PŘED subdomain rewrite (page-level redirect nefunguje s dynamicParams=false).
 */
const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;

function getPartsRouteDiakritikaRedirect(pathname: string): string | null {
  // Next.js vrací pathname URL-encoded (např. `%C5%A1koda` pro `škoda`).
  // Musíme dekódovat PŘED match, jinak `aliasFor()` strip-uje `%` chars
  // a vrátí nesmysl jako `c5a1koda`.
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null; // Malformed URI sequence
  }

  const match = decoded.match(PARTS_BRAND_ROUTE);
  if (!match) return null;
  const [, brand, model, rok] = match;

  const brandCanonical = aliasFor(brand);
  const modelCanonical = model ? aliasFor(model) : null;
  if (!brandCanonical && !modelCanonical) return null;

  const finalBrand = brandCanonical ?? brand;
  const finalModel = modelCanonical ?? model;
  let canonicalPath = `/dily/znacka/${finalBrand}`;
  if (finalModel) canonicalPath += `/${finalModel}`;
  if (rok) canonicalPath += `/${rok}`;
  return canonicalPath;
}

/**
 * Rewrite URL na základě subdomény.
 * Subdoménové routy jsou mapovány na existující app/(web)/inzerce, app/(web)/shop, app/(web)/marketplace.
 */
function getRewriteUrl(
  subdomain: SubdomainType,
  pathname: string,
  request: NextRequest
): URL | null {
  if (subdomain === "main" || shouldSkipRewrite(pathname)) {
    return null;
  }

  if (subdomain === "inzerce") {
    // Na inzerce subdoméně: / → /inzerce, /katalog → /inzerce/katalog
    // Cesty co už začínají /inzerce projdou
    if (pathname.startsWith("/inzerce")) return null;
    // /moje-inzeraty, /muj-ucet zůstanou (jsou v SKIP_REWRITE_PREFIXES)
    const rewriteUrl = new URL(`/inzerce${pathname}`, request.url);
    return rewriteUrl;
  }

  if (subdomain === "shop") {
    // Na shop subdoméně: / → /shop, /katalog → /shop/katalog
    // Cesty co už začínají /shop nebo /dily projdou
    if (pathname.startsWith("/shop") || pathname.startsWith("/dily")) return null;
    const rewriteUrl = new URL(`/shop${pathname}`, request.url);
    return rewriteUrl;
  }

  if (subdomain === "marketplace") {
    // Na marketplace subdoméně: / → /marketplace, /dealer → /marketplace/dealer
    if (pathname.startsWith("/marketplace")) return null;
    const rewriteUrl = new URL(`/marketplace${pathname}`, request.url);
    return rewriteUrl;
  }

  return null;
}

// Heslo pro přístup na web (nahrazuje nginx basic auth)
const SITE_AUTH_COOKIE = "site_access";

// Cesty, které nepotřebují site password
const SKIP_SITE_AUTH = [
  "/_next/",
  "/api/",
  "/brand/",
  "/icons/",
  "/sw.js",
  "/manifest",
  "/favicon",
  "/gate",
];

function shouldSkipSiteAuth(pathname: string): boolean {
  return SKIP_SITE_AUTH.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Site-wide password ochrana — jen pokud je SITE_PASSWORD nastaveno v env
  const sitePassword = process.env.SITE_PASSWORD || null;
  if (sitePassword && !shouldSkipSiteAuth(pathname)) {
    const siteAuth = request.cookies.get(SITE_AUTH_COOKIE);
    if (!siteAuth || siteAuth.value !== sitePassword) {
      const gateUrl = new URL("/gate", request.url);
      gateUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(gateUrl);
    }
  }

  // Detekce subdomény
  const host = request.headers.get("host") || "localhost:3000";
  const subdomain = getSubdomain(host);

  // Diakritika 301 redirect pro /dily/znacka/* — musí běžet PŘED subdomain rewrite
  // Aplikuje se na main + shop (oba mohou mít /dily/znacka/* paths po rewrite)
  if (subdomain === "main" || subdomain === "shop") {
    const canonicalPath = getPartsRouteDiakritikaRedirect(pathname);
    if (canonicalPath) {
      return NextResponse.redirect(new URL(canonicalPath, request.url), 301);
    }
  }

  // Subdomain rewrite
  const rewriteUrl = getRewriteUrl(subdomain, pathname, request);
  if (rewriteUrl) {
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-subdomain", subdomain);
    return response;
  }

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
    "/makler/stats",
    "/makler/leaderboard",
    "/makler/financing-calculator",
    "/makler/settings",
    "/makler/provize",
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
      // Neauth → nasměrovat rovnou na apply flow s důvodem + předvyplněnou rolí
      const applyUrl = new URL("/marketplace/apply", request.url);
      applyUrl.searchParams.set("reason", "auth_required");
      applyUrl.searchParams.set("role", "dealer");
      return NextResponse.redirect(applyUrl);
    }

    if (!MARKETPLACE_DEALER_ROLES.includes(token.role as string)) {
      // Auth ale špatná role → zpět na landing s not_authorized bannerem
      const landingUrl = new URL("/marketplace", request.url);
      landingUrl.searchParams.set("reason", "not_authorized");
      return NextResponse.redirect(landingUrl);
    }
  }

  // Chráněné marketplace investor routy
  if (pathname.startsWith("/marketplace/investor")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const applyUrl = new URL("/marketplace/apply", request.url);
      applyUrl.searchParams.set("reason", "auth_required");
      applyUrl.searchParams.set("role", "investor");
      return NextResponse.redirect(applyUrl);
    }

    if (!MARKETPLACE_INVESTOR_ROLES.includes(token.role as string)) {
      const landingUrl = new URL("/marketplace", request.url);
      landingUrl.searchParams.set("reason", "not_authorized");
      return NextResponse.redirect(landingUrl);
    }
  }

  // Chráněné routy partnerského portálu
  if (pathname.startsWith("/partner")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!PARTNER_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Chráněné routy inzertní platformy (moje-inzeraty, muj-ucet, moje-objednavky)
  // Přístup má každý přihlášený uživatel
  if (
    pathname.startsWith("/moje-inzeraty") ||
    pathname.startsWith("/muj-ucet") ||
    pathname.startsWith("/shop/moje-objednavky") ||
    pathname.startsWith("/dily/moje-objednavky")
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

  // Přidej x-subdomain header do response
  const response = NextResponse.next();
  response.headers.set("x-subdomain", subdomain);
  return response;
}

export const config = {
  matcher: [
    // Subdomain rewrite — matchuje všechny cesty kromě statických souborů
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
