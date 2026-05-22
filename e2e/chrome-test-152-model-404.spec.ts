import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test("T1: /dily/znacka/alfa-romeo/neexistuje → 404", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/neexistuje`, { waitUntil: "load" });
  const httpStatus = r?.status();
  const title = await page.title();
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("status:", httpStatus, "| title:", title, "| H1:", h1?.trim());
  await page.screenshot({ path: "test-results/t152-model-404-fix.png" });
  expect(httpStatus).toBe(404);
});

test("T2: /dily/znacka/skoda/neexistuje-model → 404", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/skoda/neexistuje-model`, { waitUntil: "load" });
  console.log("skoda/neexistuje-model status:", r?.status());
  await page.screenshot({ path: "test-results/t152-skoda-model-404.png" });
  expect(r?.status()).toBe(404);
});

test("T3: regression — valid model pages still 200", async ({ page }) => {
  const validPaths = [
    { path: "/dily/znacka/alfa-romeo/giulia", label: "alfa-romeo/giulia" },
    { path: "/dily/znacka/skoda/octavia", label: "skoda/octavia" },
    { path: "/dily/znacka/bmw/rada-3", label: "bmw/rada-3" },
  ];

  for (const { path, label } of validPaths) {
    const r = await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    console.log(`${label}: status=${r?.status()}, H1="${h1?.trim()}"`);
    await page.screenshot({ path: `test-results/t152-valid-${label.replace("/", "-")}.png` });
    expect(r?.status()).toBe(200);
    expect(h1).toBeTruthy();
  }
});

test("T4: regression — rok pages still 200", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/giulia/2018`, { waitUntil: "load" });
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  const chips = await page.locator('a[href*="/dily/kategorie/"]').count();
  console.log("alfa-romeo/giulia/2018 status:", r?.status(), "H1:", h1?.trim(), "chips:", chips);
  await page.screenshot({ path: "test-results/t152-rok-regression.png" });
  expect(r?.status()).toBe(200);
  expect(chips).toBeGreaterThan(0);
});
