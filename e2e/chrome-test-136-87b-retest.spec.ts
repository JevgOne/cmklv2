import { test, expect } from "@playwright/test";

test("TC5: diakritika browser redirect škoda → skoda", async ({ page }) => {
  const redirects: Array<{ status: number; url: string }> = [];
  page.on("response", (r) => {
    if ([301, 302, 307, 308].includes(r.status())) {
      redirects.push({ status: r.status(), url: r.url() });
    }
  });

  const r = await page.goto("http://localhost:3010/dily/znacka/%C5%A1koda", { waitUntil: "load" });
  const finalUrl = page.url();
  const status = r?.status();
  const title = await page.title();
  const h1 = await page.locator("h1").first().textContent().catch(() => null);

  console.log("TC5 final URL:", finalUrl);
  console.log("TC5 status:", status);
  console.log("TC5 title:", title);
  console.log("TC5 H1:", h1);
  console.log("TC5 redirects:", JSON.stringify(redirects));
  
  expect(finalUrl).toContain("/dily/znacka/skoda");
  expect(finalUrl).not.toContain("%C5%A1");
  expect(status).toBe(200);
  await page.screenshot({ path: "test-results/tc5-diakritika-browser.png" });
});

test("TC13+14+15+16: regression — brand/model/rok pages + no 5xx", async ({ page }) => {
  const errors5xx: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 500) errors5xx.push(`${r.status()} ${r.url()}`);
  });

  // TC13: brand page
  const r13 = await page.goto("http://localhost:3010/dily/znacka/skoda", { waitUntil: "load" });
  const h1_13 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("TC13 brand page status:", r13?.status(), "H1:", h1_13);
  await page.screenshot({ path: "test-results/tc13-brand-page.png" });
  expect(r13?.status()).toBe(200);

  // TC14: model page
  const r14 = await page.goto("http://localhost:3010/dily/znacka/skoda/octavia", { waitUntil: "load" });
  const h1_14 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("TC14 model page status:", r14?.status(), "H1:", h1_14);
  await page.screenshot({ path: "test-results/tc14-model-page.png" });
  expect(r14?.status()).toBe(200);

  // TC15: rok page
  const r15 = await page.goto("http://localhost:3010/dily/znacka/skoda/octavia/2018", { waitUntil: "load" });
  const h1_15 = await page.locator("h1").first().textContent().catch(() => null);
  const chips = await page.locator('a[href*="/dily/kategorie/"]').count();
  console.log("TC15 rok page status:", r15?.status(), "H1:", h1_15, "chips:", chips);
  await page.screenshot({ path: "test-results/tc15-rok-page.png" });
  expect(r15?.status()).toBe(200);
  expect(chips).toBeGreaterThan(0);

  // TC16: no 5xx errors
  console.log("5xx errors:", errors5xx);
  expect(errors5xx).toHaveLength(0);
});
