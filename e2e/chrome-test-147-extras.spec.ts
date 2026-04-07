import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test("EXTRA-1: GET /api/revalidate/parts → 405", async ({ page }) => {
  const r = await page.goto(`${BASE}/api/revalidate/parts`, { waitUntil: "load" });
  console.log("GET /api/revalidate/parts HTTP:", r?.status());
  expect(r?.status()).toBe(405);
  await page.screenshot({ path: "test-results/t147-api-405.png" });
});

test("EXTRA-2: /dily/znacka/neexistuje → 404", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/neexistuje`, { waitUntil: "load" });
  const title = await page.title();
  console.log("/dily/znacka/neexistuje HTTP:", r?.status(), "title:", title);
  expect(r?.status()).toBe(404);
  await page.screenshot({ path: "test-results/t147-brand-404.png" });
});

test("EXTRA-3: /dily/znacka/alfa-romeo/neexistuje → 404 (post-#149 fix)", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/neexistuje`, { waitUntil: "load" });
  const title = await page.title();
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("/dily/znacka/alfa-romeo/neexistuje HTTP:", r?.status(), "title:", title, "H1:", h1);
  await page.screenshot({ path: "test-results/t147-model-404-check.png" });
  expect(r?.status()).toBe(404);
});
