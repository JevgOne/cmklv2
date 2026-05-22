import { test } from "@playwright/test";

for (const port of [3000, 3001]) {
  test(`Footer na portu ${port}`, async ({ page }) => {
    await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const footerText = await page.locator("footer").innerText().catch(() => "NO FOOTER");
    const hasReklamacni = footerText.includes("Reklamační řád");
    const hasCarMakler = footerText.includes("CarMakler s.r.o.");
    const hasOldName = footerText.includes("CAR makléř") || footerText.includes("Carmakler") || footerText.includes("makléř, s.r.o");
    const firmMatch = footerText.match(/\d{4}\s+(.+?)\s+·\s+IČO/);
    console.log(`\nPort ${port}:`);
    console.log(`  'Reklamační řád': ${hasReklamacni ? "❌ PŘÍTOMNO" : "✅ CHYBÍ (OK)"}`);
    console.log(`  'CarMakler s.r.o.': ${hasCarMakler ? "✅ NALEZENO" : "❌ CHYBÍ"}`);
    console.log(`  Stará jména: ${hasOldName ? "❌ PŘÍTOMNO" : "✅ OK"}`);
    console.log(`  Firma v © řádce: "${firmMatch?.[1] || 'nenalezeno'}"`);
  });

  test(`Inzerce navbar na portu ${port}`, async ({ page }) => {
    await page.goto(`http://localhost:${port}/inzerce`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const navText = await page.locator("nav, header").innerText().catch(() => "");
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const navHasKatalog = navText.includes("Katalog");
    const navHasNabidka = navText.includes("Nabídka vozidel");
    const footerHasKatalogV = footerText.includes("Katalog vozidel");
    const footerHasNabidkaV = footerText.includes("Nabídka vozidel");
    console.log(`\nPort ${port} /inzerce:`);
    console.log(`  NAV 'Katalog': ${navHasKatalog ? "❌ PŘÍTOMNO — BUG" : "✅ NENÍ"}`);
    console.log(`  NAV 'Nabídka vozidel': ${navHasNabidka ? "✅ NALEZENO" : "❌ CHYBÍ"}`);
    console.log(`  FOOTER 'Katalog vozidel': ${footerHasKatalogV ? "❌ PŘÍTOMNO" : "✅ NENÍ"}`);
    console.log(`  FOOTER 'Nabídka vozidel': ${footerHasNabidkaV ? "✅ NALEZENO" : "❌ CHYBÍ"}`);
  });
}
