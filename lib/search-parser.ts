/**
 * NLP parser for Czech automotive part queries.
 * Extracts structured intent from natural language queries like
 * "brzdové destičky octavia 2017" → { category: "BRAKES", brand: "Octavia", year: 2017, keywords: ["brzdové", "destičky"] }
 */

import { BRAND_SYNONYMS, CATEGORY_KEYWORDS } from "./search-synonyms";

export interface ParsedQuery {
  category?: string;     // e.g. "BRAKES"
  brand?: string;        // e.g. "Skoda"
  model?: string;        // e.g. "Octavia" (from brand synonyms that map to model names)
  year?: number;         // e.g. 2017
  keywords: string[];    // remaining tokens
  oemNumber?: string;    // detected OEM/part number
}

/**
 * Parse a natural-language Czech query into structured search intent.
 * Tokens are classified as brand, category, year, OEM, or keyword.
 */
export function parseNaturalQuery(query: string): ParsedQuery {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result: ParsedQuery = { keywords: [] };

  // Known model names (subset of BRAND_SYNONYMS that are actually models)
  const MODEL_NAMES = new Set([
    "fabia", "fabie", "octavia", "okťávka", "octávka", "superb", "rapid",
    "kamiq", "karoq", "kodiaq",
    "golf", "passat", "polo", "tiguan",
  ]);

  for (const token of tokens) {
    // Year detection (1990-2099)
    if (/^(19|20)\d{2}$/.test(token)) {
      result.year = parseInt(token, 10);
      continue;
    }

    // Brand/model detection
    const brandMatch = BRAND_SYNONYMS[token];
    if (brandMatch) {
      if (MODEL_NAMES.has(token)) {
        if (!result.model) result.model = brandMatch;
      } else {
        if (!result.brand) result.brand = brandMatch;
      }
      continue;
    }

    // Category detection
    const catMatch = CATEGORY_KEYWORDS[token];
    if (catMatch && !result.category) {
      result.category = catMatch;
      // Also keep as keyword for fulltext (e.g. "brzdové" helps match "brzdové destičky")
      result.keywords.push(token);
      continue;
    }

    // OEM/part number detection (6+ alphanumeric chars with dots/dashes)
    if (/^[A-Z0-9][A-Z0-9.\-]{4,}$/i.test(token) && !/^\d+$/.test(token)) {
      result.oemNumber = token;
      continue;
    }

    result.keywords.push(token);
  }

  return result;
}
