// ============================================
// ARES API — ověření IČO přes Administrativní registr ekonomických subjektů
// https://ares.gov.cz/
// ============================================

const ARES_API_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";
const TIMEOUT_MS = 10_000;

export interface AresResult {
  ico: string;
  name: string;
  address?: string;
  city?: string;
  zip?: string;
  valid: boolean;
}

/**
 * Ověří IČO přes ARES API a vrátí údaje o firmě.
 * Vrací null pokud IČO neexistuje.
 */
export async function verifyIco(ico: string): Promise<AresResult | null> {
  const normalized = ico.replace(/\s/g, "").trim();

  // Validace formátu (8 číslic)
  if (!/^\d{8}$/.test(normalized)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ARES_API_URL}/${normalized}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`ARES API vrátil ${response.status}`);
    }

    const data = await response.json();

    const address = data.sidlo;
    const addressParts: string[] = [];
    if (address?.nazevUlice) {
      addressParts.push(
        `${address.nazevUlice}${address.cisloDomovni ? ` ${address.cisloDomovni}` : ""}${address.cisloOrientacni ? `/${address.cisloOrientacni}` : ""}`
      );
    }

    return {
      ico: normalized,
      name: data.obchodniJmeno || data.jmeno || "",
      address: addressParts.length > 0 ? addressParts.join(", ") : undefined,
      city: address?.nazevObce,
      zip: address?.psc ? String(address.psc) : undefined,
      valid: true,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("ARES API timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
