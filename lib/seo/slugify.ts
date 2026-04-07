/**
 * Diakritika-aware slugify utility pro SEO/GEO kanonické URL.
 *
 * Strategie: canonical = ASCII lowercase kebab-case (např. `skoda`, `peugeot`).
 * Aliasy s diakritikou (např. `škoda`) se 301 redirectují na canonical přes `aliasFor()`.
 *
 * Příklady:
 *   slugify("Škoda")           → "skoda"
 *   slugify("Volkswagen")      → "volkswagen"
 *   slugify("Peugeot")         → "peugeot"
 *   slugify("Mercedes-Benz")   → "mercedes-benz"
 *   slugify("Citroën")         → "citroen"
 *   slugify(" BMW ")           → "bmw"
 *
 *   aliasFor("škoda")          → "skoda" (alias detected, caller redirectne)
 *   aliasFor("skoda")          → null    (already canonical, no redirect)
 *   aliasFor("ŠKODA OCTAVIA")  → "skoda-octavia"
 */

/**
 * Convert input string to canonical lowercase kebab-case ASCII slug.
 * Removes diacritics (NFD decomposition + strip combining marks).
 * Strips non-alphanumeric chars except hyphens.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD") // Decompose: "š" → "s" + combining háček
    .replace(/[\u0300-\u036f]/g, "") // Strip combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Keep alphanumerics, spaces, hyphens
    .replace(/[\s_]+/g, "-") // Spaces/underscores → hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Detect if input slug needs alias redirect.
 *
 * Returns canonical slug (string) if input differs from its slugified form
 * — caller should issue 301 redirect to the canonical URL.
 *
 * Returns `null` if input is already canonical (no redirect needed).
 *
 * Použití v page.tsx:
 * ```ts
 * const canonical = aliasFor(slug);
 * if (canonical) {
 *   permanentRedirect(`/dily/znacka/${canonical}`);
 * }
 * ```
 */
export function aliasFor(input: string): string | null {
  const canonical = slugify(input);
  if (canonical === input) return null;
  if (canonical.length === 0) return null; // Edge case: input was all diacritics/punctuation
  return canonical;
}
