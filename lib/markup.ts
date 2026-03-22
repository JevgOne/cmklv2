/**
 * Markup/přirážka kalkulace pro eshop autodílů.
 *
 * Priorita:
 *   1. per-kategorie markup (categoryMarkups v feedConfig)
 *   2. per-dodavatel markup (markupValue v feedConfig)
 *   3. globální default (25 %)
 */

const GLOBAL_DEFAULT_MARKUP_PERCENT = 25;

interface FeedMarkupConfig {
  markupType: string; // "PERCENT" | "FIXED"
  markupValue: number;
  categoryMarkups: string | null; // JSON: { "BRAKES": 15, "BODY": 35 }
}

/**
 * Vypočítá prodejní cenu z nákupní ceny + přirážky.
 *
 * @param wholesalePrice  Nákupní cena od dodavatele
 * @param feedConfig      Konfigurace feedu (markup nastavení), nebo null pro globální default
 * @param category        Kategorie dílu (pro per-kategorie přirážku)
 * @returns               Prodejní cena zaokrouhlená na celé koruny
 */
export function calculateMarkup(
  wholesalePrice: number,
  feedConfig: FeedMarkupConfig | null,
  category?: string
): { retailPrice: number; markupPercent: number } {
  if (!feedConfig) {
    // Globální default
    const retailPrice = Math.round(wholesalePrice * (1 + GLOBAL_DEFAULT_MARKUP_PERCENT / 100));
    return { retailPrice, markupPercent: GLOBAL_DEFAULT_MARKUP_PERCENT };
  }

  // 1. Zkus per-kategorie markup
  if (category && feedConfig.categoryMarkups) {
    try {
      const categoryMap: Record<string, number> = JSON.parse(feedConfig.categoryMarkups);
      if (category in categoryMap) {
        const catMarkup = categoryMap[category];
        if (feedConfig.markupType === "FIXED") {
          return { retailPrice: Math.round(wholesalePrice + catMarkup), markupPercent: 0 };
        }
        return {
          retailPrice: Math.round(wholesalePrice * (1 + catMarkup / 100)),
          markupPercent: catMarkup,
        };
      }
    } catch {
      // Neplatný JSON — pokračuj na dodavatelský markup
    }
  }

  // 2. Per-dodavatel markup
  if (feedConfig.markupType === "FIXED") {
    return {
      retailPrice: Math.round(wholesalePrice + feedConfig.markupValue),
      markupPercent: 0,
    };
  }

  // PERCENT markup
  const markupPercent = feedConfig.markupValue ?? GLOBAL_DEFAULT_MARKUP_PERCENT;
  return {
    retailPrice: Math.round(wholesalePrice * (1 + markupPercent / 100)),
    markupPercent,
  };
}

/**
 * Jednoduchá kalkulace ceny — wrapper pro běžné použití.
 */
export function calculatePrice(wholesalePrice: number, markupPercent: number): number {
  return Math.round(wholesalePrice * (1 + markupPercent / 100));
}
