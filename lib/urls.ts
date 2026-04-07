/**
 * Cross-platform URL builder.
 *
 * Default chování (dev, žádné env vars):
 *   - urls.main("/x")        → "http://localhost:3000/x"
 *   - urls.inzerce("/x")     → "/inzerce/x"      (path-based, žádný subdomain)
 *   - urls.shop("/x")        → "/dily/x"         (path-based — /dily je canonical, viz #87/#87a SEO)
 *   - urls.marketplace("/x") → "/marketplace/x"  (path-based)
 *
 * S env vars (prod nebo dev se subdomain setupem):
 *   NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz
 *   → urls.inzerce("/x") → "https://inzerce.carmakler.cz/x"
 *
 * Routing:
 *   Path-based: app/(web)/inzerce/page.tsx, app/(web)/dily/page.tsx, app/(web)/marketplace/page.tsx
 *   Subdomain: middleware.ts rewrituje host header → path internally
 */

const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";

// Subdomain URLs — env vars override path-based defaults.
// Empty/undefined → fallback na path-based routing (žádný /etc/hosts setup nutný).
const INZERCE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_INZERCE_URL || "";
const SHOP_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_SHOP_URL || "";
const MARKETPLACE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "";

// Path-based fallbacks (musí odpovídat existujícím app/(web)/<prefix>/page.tsx)
const PATH_PREFIX = {
  inzerce: "/inzerce",
  shop: "/dily", // ⚠️ canonical eshop URL (NE "/shop") — viz #87/#87a SEO investice + CLAUDE.md
  marketplace: "/marketplace",
} as const;

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildMainUrl(path: string): string {
  return `${MAIN_URL}${normalizePath(path)}`;
}

function buildPlatformUrl(subdomainUrl: string, pathPrefix: string, path: string): string {
  const cleanPath = normalizePath(path);
  if (subdomainUrl) {
    // Env var nastavený → použij subdomain URL (prod nebo opt-in dev)
    return `${subdomainUrl}${cleanPath}`;
  }
  // Bez env var → path-based routing
  // urls.inzerce("/") → "/inzerce" (ne "/inzerce/")
  // urls.inzerce("/katalog") → "/inzerce/katalog"
  if (cleanPath === "/") return pathPrefix;
  return `${pathPrefix}${cleanPath}`;
}

export const urls = {
  main: (path: string = "/") => buildMainUrl(path),
  inzerce: (path: string = "/") => buildPlatformUrl(INZERCE_SUBDOMAIN_URL, PATH_PREFIX.inzerce, path),
  shop: (path: string = "/") => buildPlatformUrl(SHOP_SUBDOMAIN_URL, PATH_PREFIX.shop, path),
  marketplace: (path: string = "/") => buildPlatformUrl(MARKETPLACE_SUBDOMAIN_URL, PATH_PREFIX.marketplace, path),
};
