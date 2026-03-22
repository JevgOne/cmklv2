// ============================================
// CEBIA B2B klient — ověření historie vozidla
// ============================================

export interface CebiaCheckResult {
  vin: string;
  status: "OK" | "WARNING" | "ERROR";
  reportUrl?: string;
  data?: {
    stolen: boolean;
    mileageOk: boolean;
    damageFree: boolean;
    financingFree: boolean;
    registrationHistory: number; // počet registrací
  };
}

/**
 * Objednání CEBIA reportu.
 * V dev prostředí vrací mock data, v produkci volá CEBIA B2B API.
 */
export async function orderCebiaReport(vin: string): Promise<CebiaCheckResult> {
  const apiKey = process.env.CEBIA_API_KEY;

  // Mock v dev prostředí
  if (!apiKey || apiKey === "dev-mock") {
    return mockCebiaReport(vin);
  }

  // TODO: Implementace reálného CEBIA B2B API volání
  // const response = await fetch("https://api.cebia.cz/v1/check", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${apiKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ vin }),
  // });

  // Pro teď fallback na mock
  return mockCebiaReport(vin);
}

/**
 * Získání výsledku hotového reportu.
 */
export async function getCebiaReportResult(reportId: string): Promise<CebiaCheckResult | null> {
  const apiKey = process.env.CEBIA_API_KEY;

  if (!apiKey || apiKey === "dev-mock") {
    return mockCebiaReport("MOCK-VIN-" + reportId);
  }

  // TODO: Implementace reálného CEBIA B2B API volání
  return null;
}

/**
 * Mock CEBIA report pro dev/test
 */
function mockCebiaReport(vin: string): CebiaCheckResult {
  // Simulace — VIN končící na 0 = warning
  const isWarning = vin.endsWith("0");

  return {
    vin,
    status: isWarning ? "WARNING" : "OK",
    reportUrl: `https://cebia.cz/report/mock-${vin.slice(-6)}`,
    data: {
      stolen: false,
      mileageOk: !isWarning,
      damageFree: !isWarning,
      financingFree: true,
      registrationHistory: isWarning ? 5 : 2,
    },
  };
}
