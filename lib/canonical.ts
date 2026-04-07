/**
 * Canonical URL helper for Next.js page metadata.
 *
 * Řeší globální SEO bug (#127): Next.js metadata API shallow-merguje
 * `alternates` z root layoutu na child stránky. Pokud root layout exportuje
 * `alternates: { canonical: BASE_URL }`, všechny stránky bez vlastního
 * `alternates.canonical` zdědí homepage URL místo své vlastní.
 *
 * Fix: root layout NESMÍ exportovat `alternates.canonical`. Každá indexovaná
 * stránka MUSÍ exportovat vlastní `alternates: pageCanonical("/path")`.
 *
 * Phase 1 (#127a): apex domain only — `https://carmakler.cz/{path}`. Subdomain
 * canonical handling (shop.carmakler.cz/...) je out of scope, defer to #127b.
 */
import { BASE_URL } from "@/lib/seo-data";

/**
 * Vytvoří `alternates` objekt s absolutním canonical URL pro danou cestu.
 *
 * Použití v page metadata:
 * ```ts
 * import { pageCanonical } from "@/lib/canonical";
 *
 * export const metadata: Metadata = {
 *   title: "...",
 *   description: "...",
 *   alternates: pageCanonical("/dily/katalog"),
 * };
 * ```
 *
 * V dynamic generateMetadata:
 * ```ts
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const { slug } = await params;
 *   return {
 *     title: "...",
 *     alternates: pageCanonical(`/dodavatel/${slug}`),
 *   };
 * }
 * ```
 *
 * @param path Pathname začínající `/`. Query string se ignoruje (canonical
 *             URL nikdy neobsahuje query). Trailing slash se normalizuje
 *             (odstraní se kromě root `/`).
 * @returns `{ canonical: "https://carmakler.cz{path}" }` ready pro
 *          `metadata.alternates`.
 * @throws Error pokud `path` nezačíná `/` — defensive check zachytí copy-paste
 *         chybu typu `pageCanonical("dily")` v PR review.
 */
export function pageCanonical(path: string): { canonical: string } {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new Error(
      `pageCanonical(): path must be a string starting with "/", got: ${JSON.stringify(path)}`,
    );
  }

  // Strip query string — canonical URL nikdy neobsahuje query params.
  const queryIndex = path.indexOf("?");
  let normalized = queryIndex >= 0 ? path.slice(0, queryIndex) : path;

  // Strip hash fragment — canonical URL nikdy neobsahuje hash.
  const hashIndex = normalized.indexOf("#");
  if (hashIndex >= 0) normalized = normalized.slice(0, hashIndex);

  // Normalize trailing slash: odstranit kromě root "/".
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  // Root path = bare BASE_URL bez trailing slash.
  if (normalized === "/") {
    return { canonical: BASE_URL };
  }

  return { canonical: `${BASE_URL}${normalized}` };
}
