const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";
const INZERCE_URL =
  process.env.NEXT_PUBLIC_INZERCE_URL || "http://inzerce.localhost:3000";
const SHOP_URL =
  process.env.NEXT_PUBLIC_SHOP_URL || "http://shop.localhost:3000";
const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
  "http://marketplace.localhost:3000";

function buildUrl(base: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export const urls = {
  main: (path: string = "/") => buildUrl(MAIN_URL, path),
  inzerce: (path: string = "/") => buildUrl(INZERCE_URL, path),
  shop: (path: string = "/") => buildUrl(SHOP_URL, path),
  marketplace: (path: string = "/") => buildUrl(MARKETPLACE_URL, path),
};
