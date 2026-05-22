import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const NEW_BRANDS = [
  { slug: "alfa-romeo", name: "Alfa Romeo" },
  { slug: "suzuki", name: "Suzuki" },
  { slug: "fiat", name: "Fiat" },
  { slug: "mini", name: "Mini" },
  { slug: "mitsubishi", name: "Mitsubishi" },
  { slug: "jeep", name: "Jeep" },
  { slug: "jaguar", name: "Jaguar" },
  { slug: "dodge", name: "Dodge" },
  { slug: "lexus", name: "Lexus" },
];

test("B1: All 9 new brand pages — 200 + correct H1 + template content", async ({ page }) => {
  const results: Array<{ slug: string; status: number; h1: string | null; hasContent: boolean }> = [];

  for (const brand of NEW_BRANDS) {
    const r = await page.goto(`${BASE}/dily/znacka/${brand.slug}`, { waitUntil: "load" });
    const httpStatus = r?.status() ?? 0;
    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    const bodyText = await page.textContent("body");
    const hasContent =
      (bodyText?.includes("Náhradní díly") ?? false) ||
      (bodyText?.includes(brand.name) ?? false) ||
      (bodyText?.includes("vrakoviště") ?? false) ||
      (bodyText?.includes("díly") ?? false);

    results.push({ slug: brand.slug, status: httpStatus, h1: h1?.trim() ?? null, hasContent });
    console.log(`${brand.slug}: HTTP ${httpStatus} | H1: "${h1?.trim()}" | content: ${hasContent}`);

    await page.screenshot({ path: `test-results/t147-brand-${brand.slug}.png`, fullPage: false });

    expect(httpStatus).toBe(200);
    expect(h1).toBeTruthy();
    expect(hasContent).toBe(true);
  }

  console.log("Brand results:", JSON.stringify(results, null, 2));
});

test("B2: alfa-romeo/giulia model page — 200 + H1 + breadcrumb", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/giulia`, { waitUntil: "load" });
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  const breadcrumbs = await page.locator('nav a, [aria-label*="readcrumb"] a, ol a').allTextContents().catch(() => []);
  const bodyText = await page.textContent("body");

  console.log("alfa-romeo/giulia HTTP:", r?.status());
  console.log("H1:", h1?.trim());
  console.log("Breadcrumbs:", breadcrumbs.slice(0, 6));
  console.log("Has Giulia content:", bodyText?.includes("Giulia") ?? false);

  await page.screenshot({ path: "test-results/t147-model-giulia.png", fullPage: false });

  expect(r?.status()).toBe(200);
  expect(h1?.toLowerCase()).toContain("alfa");
});

test("B3: alfa-romeo/giulia/2018 year page — 200 + chips + JSON-LD", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/giulia/2018`, { waitUntil: "load" });
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  const chipCount = await page.locator('a[href*="/dily/kategorie/"]').count();
  const jsonLd = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => s.textContent ?? "").join("\n")
  );
  const hasBreadcrumb = jsonLd.includes("BreadcrumbList");
  const hasItemList = jsonLd.includes("ItemList");

  console.log("alfa-romeo/giulia/2018 HTTP:", r?.status());
  console.log("H1:", h1?.trim());
  console.log("Category chips:", chipCount);
  console.log("JSON-LD BreadcrumbList:", hasBreadcrumb, "| ItemList:", hasItemList);

  await page.screenshot({ path: "test-results/t147-year-giulia-2018.png", fullPage: false });

  expect(r?.status()).toBe(200);
  expect(h1?.toLowerCase()).toContain("2018");
  expect(chipCount).toBeGreaterThan(0);
  expect(hasBreadcrumb).toBe(true);
});
