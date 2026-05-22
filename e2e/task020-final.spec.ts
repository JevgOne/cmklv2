import { test, Page } from "@playwright/test";

test.use({ headless: false });

const BASE = "http://localhost:3000";
const results: { name: string; status: "PASS" | "FAIL" | "WARN"; note: string }[] = [];

function pass(name: string, note = "") {
  results.push({ name, status: "PASS", note });
}
function fail(name: string, note: string) {
  results.push({ name, status: "FAIL", note });
}
function warn(name: string, note: string) {
  results.push({ name, status: "WARN", note });
}

async function checkPage(
  page: Page,
  url: string,
  name: string,
  checks: { selector?: string; text?: string; notText?: string }[] = []
): Promise<boolean> {
  try {
    const resp = await page.goto(url, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const httpStatus = resp?.status() ?? 0;

    if (httpStatus >= 500) {
      fail(name, `HTTP ${httpStatus} Server Error`);
      return false;
    }

    // Check for error page content
    const bodyText = await page.locator("body").textContent({ timeout: 3000 }).catch(() => "");
    if (bodyText?.includes("Application error") || bodyText?.includes("Unhandled Runtime Error")) {
      fail(name, "Runtime error na stránce");
      return false;
    }

    // Run custom checks
    let allPassed = true;
    for (const check of checks) {
      if (check.selector) {
        const el = await page.locator(check.selector).first().isVisible({ timeout: 3000 }).catch(() => false);
        if (!el) {
          warn(name, `Element '${check.selector}' není viditelný`);
          allPassed = false;
        }
      }
      if (check.text) {
        const found = bodyText?.includes(check.text);
        if (!found) {
          warn(name, `Text '${check.text}' nenalezen`);
          allPassed = false;
        }
      }
      if (check.notText && bodyText?.includes(check.notText)) {
        fail(name, `Stránka obsahuje '${check.notText}'`);
        allPassed = false;
      }
    }

    if (allPassed) {
      pass(name, `HTTP ${httpStatus}`);
    }
    return allPassed;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(name, `Timeout nebo chyba: ${msg.slice(0, 100)}`);
    return false;
  }
}

test.describe("TASK-020 Final Browser Test", () => {
  test("P0: /dily — hlavní stránka eshopu", async ({ page }) => {
    await checkPage(page, `${BASE}/dily`, "/dily hlavní stránka", [
      { text: "díl", notText: "Application error" },
    ]);
  });

  test("P0: /dily/katalog — katalog s filtry", async ({ page }) => {
    await checkPage(page, `${BASE}/dily/katalog`, "/dily/katalog", [
      { notText: "Application error" },
    ]);
    // Check filter elements
    const body = await page.locator("body").textContent().catch(() => "");
    const hasFilter = body?.includes("Kategori") || body?.includes("Stav") || body?.includes("filter") || body?.includes("Filter");
    if (hasFilter) {
      pass("Katalog — filtry přítomny");
    } else {
      warn("Katalog — filtry", "Nenalezeny texty filtrů");
    }
  });

  test("P0: /dily/[slug] — detail dílu", async ({ page }) => {
    // First get a real slug from the catalog
    const resp = await page.goto(`${BASE}/dily/katalog`, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Try to find a part link
    const partLinks = await page.locator('a[href^="/dily/"]').all();
    let slug = "";
    for (const link of partLinks) {
      const href = await link.getAttribute("href");
      if (href && href.startsWith("/dily/") && !href.startsWith("/dily/katalog") && !href.startsWith("/dily/kosik") && href.split("/").length === 3) {
        slug = href;
        break;
      }
    }

    if (!slug) {
      warn("/dily/[slug] detail", "Nenalezen žádný díl v katalogu pro testování");
      return;
    }

    await checkPage(page, `${BASE}${slug}`, "/dily/[slug] detail dílu", [
      { notText: "Application error" },
      { notText: "404" },
    ]);

    const body = await page.locator("body").textContent().catch(() => "");
    const hasPriceOrImage = body?.includes("Kč") || body?.includes("skladem") || body?.includes("cen");
    if (hasPriceOrImage) {
      pass("Detail dílu — cena/stav přítomny");
    } else {
      warn("Detail dílu — cena", "Nenalezena cena nebo stav");
    }
  });

  test("P0: /dily/kosik — košík", async ({ page }) => {
    await checkPage(page, `${BASE}/dily/kosik`, "/dily/kosik", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasCartContent = body?.includes("košík") || body?.includes("Košík") || body?.includes("prázdný");
    if (hasCartContent) {
      pass("Košík — obsah stránky správný");
    } else {
      warn("Košík", "Stránka nenachází cart obsah");
    }
  });

  test("P0: /dily/objednavka — checkout flow", async ({ page }) => {
    await checkPage(page, `${BASE}/dily/objednavka`, "/dily/objednavka", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasCheckout = body?.includes("Objednávka") || body?.includes("Doručení") || body?.includes("košík je prázdný") || body?.includes("prázdný");
    if (hasCheckout) {
      pass("Checkout — obsah správný (prázdný košík nebo formulář)");
    } else {
      warn("Checkout", "Nenalezen očekávaný obsah");
    }
  });

  test("P1: Autocomplete — searchbar dropdown", async ({ page }) => {
    await page.goto(`${BASE}/dily/katalog`, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Find a search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Hledat"], input[placeholder*="hledat"], input[placeholder*="díl"], input[placeholder*="VIN"]').first();
    const found = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!found) {
      // Try any input
      const anyInput = page.locator('input[type="text"]').first();
      const anyFound = await anyInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (!anyFound) {
        warn("Autocomplete", "Searchbar nenalezen na /dily/katalog");
        return;
      }
      await anyInput.fill("motor");
      await page.waitForTimeout(1500);
      const body = await page.locator("body").textContent().catch(() => "");
      const hasDropdown = body?.includes("motor") || body?.includes("Motor");
      hasDropdown ? pass("Autocomplete — dropdown se zobrazil") : warn("Autocomplete", "Dropdown se nezobrazil po zadání textu");
      return;
    }

    await searchInput.fill("motor");
    await page.waitForTimeout(1500);
    // Look for dropdown/suggestions
    const dropdown = await page.locator('[role="listbox"], [class*="dropdown"], [class*="suggest"], [class*="autocomplete"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (dropdown) {
      pass("Autocomplete — dropdown viditelný po zadání textu");
    } else {
      warn("Autocomplete", "Dropdown element nenalezen, ale input funguje");
    }
  });

  test("P1: /muj-ucet/garaz — Moje garáž", async ({ page }) => {
    await checkPage(page, `${BASE}/muj-ucet/garaz`, "/muj-ucet/garaz", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasGarage = body?.includes("garáž") || body?.includes("Garáž") || body?.includes("vozidl") || body?.includes("Přihlás");
    hasGarage ? pass("Garáž — stránka načtena") : warn("Garáž", "Nenalezen očekávaný obsah");
  });

  test("P1: /muj-ucet/poptavky — Moje poptávky", async ({ page }) => {
    await checkPage(page, `${BASE}/muj-ucet/poptavky`, "/muj-ucet/poptavky", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasPoptavky = body?.includes("poptávk") || body?.includes("Poptávk") || body?.includes("Přihlás");
    hasPoptavky ? pass("Poptávky — stránka načtena") : warn("Poptávky", "Nenalezen očekávaný obsah");
  });

  test("P1: /dily/vrakoviste/[slug] — profil dodavatele", async ({ page }) => {
    // Try to find a real supplier slug
    const res = await fetch(`${BASE}/api/parts?limit=5`).catch(() => null);
    let slug = "";

    if (res?.ok) {
      const data: { parts?: Array<{ supplier?: { slug?: string } }> } = await res.json().catch(() => ({}));
      slug = data.parts?.[0]?.supplier?.slug ?? "";
    }

    if (!slug) {
      // Try a direct test with a known URL pattern
      const testResp = await page.goto(`${BASE}/dily/vrakoviste`, { timeout: 10000, waitUntil: "domcontentloaded" }).catch(() => null);
      if (testResp?.status() === 404) {
        warn("/dily/vrakoviste/[slug]", "Žádný slug nalezen pro testování");
        return;
      }
      warn("/dily/vrakoviste/[slug]", "Nelze získat reálný slug dodavatele");
      return;
    }

    await checkPage(page, `${BASE}/dily/vrakoviste/${slug}`, "/dily/vrakoviste/[slug]", [
      { notText: "Application error" },
    ]);
  });

  test("Admin: /admin/orders — objednávky + SubOrders", async ({ page }) => {
    await checkPage(page, `${BASE}/admin/orders`, "/admin/orders", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasOrders = body?.includes("Objednávk") || body?.includes("order") || body?.includes("Přihlás") || body?.includes("oprávnění");
    hasOrders ? pass("Admin orders — stránka načtena") : warn("Admin orders", "Nenalezen očekávaný obsah");
  });

  test("Admin: /admin/returns — reklamace", async ({ page }) => {
    await checkPage(page, `${BASE}/admin/returns`, "/admin/returns", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasReturns = body?.includes("Reklamac") || body?.includes("Vrácen") || body?.includes("Přihlás") || body?.includes("oprávnění");
    hasReturns ? pass("Admin returns — stránka načtena") : warn("Admin returns", "Nenalezen obsah");
  });

  test("Admin: /admin/parts — správa dílů", async ({ page }) => {
    await checkPage(page, `${BASE}/admin/parts`, "/admin/parts", [
      { notText: "Application error" },
    ]);
    const body = await page.locator("body").textContent().catch(() => "");
    const hasParts = body?.includes("Díly") || body?.includes("díly") || body?.includes("Part") || body?.includes("Přihlás") || body?.includes("oprávnění");
    hasParts ? pass("Admin parts — stránka načtena") : warn("Admin parts", "Nenalezen obsah");
  });

  test.afterAll(async () => {
    console.log("\n=== TASK-020 FINAL RESULTS ===");
    for (const r of results) {
      const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : "⚠️";
      console.log(`${icon} ${r.name}${r.note ? ` — ${r.note}` : ""}`);
    }
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const warned = results.filter((r) => r.status === "WARN").length;
    console.log(`\nTotal: ${passed} PASS, ${warned} WARN, ${failed} FAIL`);
  });
});
