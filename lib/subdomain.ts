export type SubdomainType = "main" | "inzerce" | "shop" | "marketplace";

const SUBDOMAIN_MAP: Record<string, SubdomainType> = {
  inzerce: "inzerce",
  shop: "shop",
  marketplace: "marketplace",
};

/**
 * Parsuje host header a vrací typ subdomény.
 * Dev:  inzerce.localhost:3000 → 'inzerce', localhost:3000 → 'main'
 * Prod: inzerce.carmakler.cz   → 'inzerce', carmakler.cz   → 'main' (www.* → 'main' via redirect)
 */
export function getSubdomain(host: string): SubdomainType {
  // Odstraň port
  const hostname = host.split(":")[0];

  // Dev: xxx.localhost → subdomain je "xxx"
  if (hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    const sub = hostname.split(".")[0];
    return SUBDOMAIN_MAP[sub] ?? "main";
  }

  // Prod: xxx.carmakler.cz → subdomain je "xxx"
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub === "www") return "main";
    return SUBDOMAIN_MAP[sub] ?? "main";
  }

  return "main";
}
