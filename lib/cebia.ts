// ============================================
// CEBIA B2B klient — ověření historie vozidla
// ============================================

export interface CebiaCheckResult {
  vin: string;
  status: "OK" | "WARNING" | "ERROR";
  reportUrl: string | null;
  data?: {
    stolen: boolean;
    mileageOk: boolean;
    damageFree: boolean;
    financingFree: boolean;
    registrationHistory: number; // pocet registraci
  };
}

// CEBIA B2B API base URL (konfigurovatelne pres env)
const CEBIA_API_BASE = process.env.CEBIA_API_URL || "https://api.cebia.cz/b2b/v1";

/**
 * Zjisti zda je CEBIA API nakonfigurovano pro realne pouziti
 */
function isCebiaConfigured(): boolean {
  const apiKey = process.env.CEBIA_API_KEY;
  return !!apiKey && apiKey !== "dev-mock";
}

/**
 * Objednani CEBIA reportu.
 * Pokud CEBIA_API_KEY existuje a neni "dev-mock" -> vola realne API.
 * Pokud API selze -> fallback na mock.
 * Pokud CEBIA_API_KEY neexistuje -> mock (dev mode).
 */
export async function orderCebiaReport(vin: string): Promise<CebiaCheckResult> {
  if (!isCebiaConfigured()) {
    console.log("[CEBIA:DEV] Mock report pro VIN:", vin);
    return mockCebiaReport(vin);
  }

  const apiKey = process.env.CEBIA_API_KEY!;

  try {
    const response = await fetch(`${CEBIA_API_BASE}/check`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vin }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[CEBIA] API error:", response.status, errorBody);
      console.warn("[CEBIA] Fallback na mock data");
      return mockCebiaReport(vin);
    }

    const data = await response.json();

    return {
      vin,
      status: data.status || "OK",
      reportUrl: data.reportUrl || null,
      data: data.data
        ? {
            stolen: data.data.stolen ?? false,
            mileageOk: data.data.mileageOk ?? true,
            damageFree: data.data.damageFree ?? true,
            financingFree: data.data.financingFree ?? true,
            registrationHistory: data.data.registrationHistory ?? 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("[CEBIA] Request failed:", error);
    console.warn("[CEBIA] Fallback na mock data");
    return mockCebiaReport(vin);
  }
}

/**
 * Ziskani vysledku hotoveho reportu.
 */
export async function getCebiaReportResult(reportId: string): Promise<CebiaCheckResult | null> {
  if (!isCebiaConfigured()) {
    console.log("[CEBIA:DEV] Mock report result pro ID:", reportId);
    return mockCebiaReport("MOCK-VIN-" + reportId);
  }

  const apiKey = process.env.CEBIA_API_KEY!;

  try {
    const response = await fetch(`${CEBIA_API_BASE}/report/${reportId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("[CEBIA] Report fetch error:", response.status);
      return null;
    }

    const data = await response.json();

    return {
      vin: data.vin || "",
      status: data.status || "OK",
      reportUrl: data.reportUrl || null,
      data: data.data
        ? {
            stolen: data.data.stolen ?? false,
            mileageOk: data.data.mileageOk ?? true,
            damageFree: data.data.damageFree ?? true,
            financingFree: data.data.financingFree ?? true,
            registrationHistory: data.data.registrationHistory ?? 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("[CEBIA] Report fetch failed:", error);
    return null;
  }
}

/**
 * Mock CEBIA report pro dev/test
 * BUG-014: reportUrl je null (ne fake URL)
 */
function mockCebiaReport(vin: string): CebiaCheckResult {
  // Simulace — VIN koncici na 0 = warning
  const isWarning = vin.endsWith("0");

  return {
    vin,
    status: isWarning ? "WARNING" : "OK",
    reportUrl: null, // Dev mock nevraci realne URL
    data: {
      stolen: false,
      mileageOk: !isWarning,
      damageFree: !isWarning,
      financingFree: true,
      registrationHistory: isWarning ? 5 : 2,
    },
  };
}
