import { test, expect, Page } from "@playwright/test";

/**
 * #184 IMPL TASK-020 — E2E parts wholesale flow
 * Headed Chromium test cesty:
 *   1. Login WHOLESALE_SUPPLIER
 *   2. /parts/* gating (middleware allows WHOLESALE_SUPPLIER)
 *   3. Public katalog filter na manufacturer
 *   4. Public detail render manufacturer + warranty (z seedu Commit E)
 */

const BASE = "http://localhost:3000";
const WHOLESALE_EMAIL = "velkoobchod@carmakler.cz";
const WHOLESALE_PASS = "heslo123";

async function loginAs(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard|parts|makler|marketplace)/, {
    timeout: 12000,
  });
}

// T1: WHOLESALE_SUPPLIER login funguje (seed user existuje a role je akceptována)
test("T1: WHOLESALE_SUPPLIER login + middleware /parts gating", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await loginAs(page, WHOLESALE_EMAIL, WHOLESALE_PASS);
  console.log("Wholesale logged in, URL:", page.url());

  // Middleware musí pustit WHOLESALE_SUPPLIER na /parts/* (PARTS_SUPPLIER_ROLES)
  await page.goto(`${BASE}/parts/profile`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/parts-wholesale-t1-profile.png" });

  // Po login a navigation na /parts/profile by URL měla obsahovat parts/profile
  // (NE redirect na "/" který by middleware udělala při blokované roli)
  expect(page.url()).toContain("parts/profile");

  const criticalErrors = consoleErrors.filter(
    (e) => e.includes("Prisma") || e.includes("does not exist on type")
  );
  expect(criticalErrors.length).toBe(0);
});

// T2: /parts/new wizard accessible
test("T2: WHOLESALE_SUPPLIER → /parts/new wizard accessible", async ({ page }) => {
  await loginAs(page, WHOLESALE_EMAIL, WHOLESALE_PASS);
  await page.goto(`${BASE}/parts/new`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/parts-wholesale-t2-wizard.png" });

  // Wizard PhotoStep / DetailsStep je viditelný (ne redirect)
  expect(page.url()).toContain("parts/new");

  const bodyText = await page.textContent("body");
  // Wizard má buď "Fotky", "Údaje", nebo "Cena" headline (jakýkoliv step)
  const hasWizard =
    bodyText?.includes("Údaje") ||
    bodyText?.includes("Fotk") ||
    bodyText?.includes("Cena") ||
    bodyText?.includes("Pokračovat");
  expect(hasWizard).toBeTruthy();
});

// T3: Public katalog manufacturer filter — seeded TRW/Bosch/Sachs jsou viditelné
test("T3: /dily/katalog manufacturer filter input visible + filters", async ({ page }) => {
  await page.goto(`${BASE}/dily/katalog`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/parts-wholesale-t3-katalog.png" });

  // Manufacturer Input field je v filter baru
  const manufacturerInput = page.locator("input[placeholder*='TRW'], input[placeholder*='Bosch']").first();
  const hasManufacturerInput = (await manufacturerInput.count()) > 0;
  console.log("Manufacturer input present:", hasManufacturerInput);
  expect(hasManufacturerInput).toBeTruthy();

  // Vyplň "TRW" a počkej na refetch
  await manufacturerInput.fill("TRW");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/parts-wholesale-t3-katalog-trw.png" });

  // Body by měl obsahovat TRW seeded part name
  const bodyAfterFilter = await page.textContent("body");
  const hasTrwResult =
    bodyAfterFilter?.includes("TRW") ||
    bodyAfterFilter?.includes("Brzdové destičky");
  console.log("Has TRW result after filter:", hasTrwResult);
  expect(hasTrwResult).toBeTruthy();
});

// T4: Public detail page renders manufacturer + warranty
test("T4: /dily/[slug] detail render — manufacturer + warranty visible", async ({ page }) => {
  // Slug ze seedu Commit E
  await page.goto(`${BASE}/dily/trw-brzdove-desticky-octavia-iii`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/parts-wholesale-t4-detail.png" });

  const bodyText = await page.textContent("body");

  // Detail block musí obsahovat výrobce + záruku
  const hasManufacturer = bodyText?.includes("TRW");
  const hasWarranty = bodyText?.includes("24 měsíců");
  const hasManufacturerLabel = bodyText?.includes("Výrobce");
  const hasWarrantyLabel = bodyText?.includes("Záruka");

  console.log("Manufacturer 'TRW':", hasManufacturer);
  console.log("Warranty '24 měsíců':", hasWarranty);
  console.log("'Výrobce' label:", hasManufacturerLabel);
  console.log("'Záruka' label:", hasWarrantyLabel);

  expect(hasManufacturer).toBeTruthy();
  expect(hasWarranty).toBeTruthy();
  expect(hasManufacturerLabel).toBeTruthy();
  expect(hasWarrantyLabel).toBeTruthy();
});
