import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "admin@carmakler.cz";
const BROKER_EMAIL = "jan.novak@carmakler.cz";
const BUYER_EMAIL = "kupujici@email.cz";
const PASSWORD = "heslo123";

// Helper: login as a specific user
async function loginAs(page: Page, email: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "commit", timeout: 15000 });
  await page.waitForSelector("#email", { timeout: 10000 });
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  // Use commit so we don't hang on dashboard SSE
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 }),
    page.click('button[type="submit"]'),
  ]);
  // Small pause to let page settle
  await page.waitForTimeout(2000);
}

// Helper: check page renders properly (not 500, not redirect to login)
async function checkPage(page: Page, url: string, description: string) {
  // waitUntil: "commit" fires as soon as server responds — avoids hanging on SSE/WS/Pusher
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "commit", timeout: 20000 });
  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  const title = await page.title();

  // Detect real 500 errors via Next.js error boundary divs
  const has500 = await page
    .locator(
      '[data-nextjs-dialog-header], h1:has-text("500"), h2:has-text("Internal Server Error")'
    )
    .count();

  // Detect redirect to login
  const redirectedToLogin =
    currentUrl.includes("/login") || currentUrl.includes("/prihlaseni");

  // Detect loading spinners still visible (SSR should have no spinners)
  const spinnerCount = await page
    .locator('[class*="animate-spin"]')
    .count();

  const icon =
    has500 > 0
      ? "❌ 500"
      : redirectedToLogin
        ? "🔒 LOGIN_REDIRECT"
        : spinnerCount > 0
          ? "⏳ SPINNER"
          : "✅ OK";

  console.log(`${icon} | ${description} | ${url} | title: "${title}"`);

  return {
    url,
    description,
    title,
    currentUrl,
    has500: has500 > 0,
    redirectedToLogin,
    spinnerCount,
  };
}

// =============================================
// GROUP 1: Public pages (no login needed)
// =============================================
test.describe("1. Veřejné stránky (bez přihlášení)", () => {
  test("1a. Prezentace stránka", async ({ page }) => {
    const result = await checkPage(
      page,
      "/prezentace",
      "Prezentace Carmakler"
    );
    expect(result.has500, "Page should not show 500 error").toBe(false);
    expect(
      result.redirectedToLogin,
      "Public page should not redirect to login"
    ).toBe(false);
    expect(result.spinnerCount, "No loading spinners should remain").toBe(0);
  });

  test("1b. Katalog dílů (dily/katalog)", async ({ page }) => {
    const result = await checkPage(
      page,
      "/dily/katalog",
      "Katalog autodílů"
    );
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("1c. Shop katalog (shop/katalog)", async ({ page }) => {
    const result = await checkPage(page, "/shop/katalog", "Shop katalog");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });
});

// =============================================
// GROUP 2: User account pages (BUYER login)
// =============================================
test.describe("2. Uživatelský účet (kupujici@email.cz)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, BUYER_EMAIL);
  });

  test("2a. Muj účet - hlavní stránka", async ({ page }) => {
    const result = await checkPage(page, "/muj-ucet", "Muj účet");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2b. Profil uživatele", async ({ page }) => {
    const result = await checkPage(page, "/muj-ucet/profil", "Profil");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2c. Oblíbená vozidla", async ({ page }) => {
    const result = await checkPage(
      page,
      "/muj-ucet/oblibene",
      "Oblíbená vozidla"
    );
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2d. Garáž uživatele", async ({ page }) => {
    const result = await checkPage(page, "/muj-ucet/garaz", "Garáž");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2e. Hlídací pes", async ({ page }) => {
    const result = await checkPage(
      page,
      "/muj-ucet/hlidaci-pes",
      "Hlídací pes"
    );
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2f. Moje inzeráty", async ({ page }) => {
    const result = await checkPage(page, "/moje-inzeraty", "Moje inzeráty");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2g. Objednávky dílů", async ({ page }) => {
    const result = await checkPage(
      page,
      "/dily/moje-objednavky",
      "Moje objednávky (díly)"
    );
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2h. Objednávky shopu", async ({ page }) => {
    const result = await checkPage(
      page,
      "/shop/moje-objednavky",
      "Moje objednávky (shop)"
    );
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("2i. Profil setup wizard", async ({ page }) => {
    const result = await checkPage(
      page,
      "/muj-ucet/profil/setup",
      "Nastavení profilu"
    );
    expect(result.has500).toBe(false);
    // This page may redirect buyers somewhere else - just check no 500
  });

  test("2j. Hlídací pes - potvrzení objednávky díly", async ({ page }) => {
    await page.goto(`${BASE_URL}/dily/objednavka/potvrzeni`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    expect(has500, "No 500 error").toBe(0);
    console.log("✅ OK | /dily/objednavka/potvrzeni | no 500");
  });

  test("2k. Potvrzení objednávky shop", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop/objednavka/potvrzeni`, { waitUntil: "domcontentloaded", timeout: 20000 });

    await page.waitForTimeout(1500);
    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    expect(has500, "No 500 error").toBe(0);
    console.log("✅ OK | /shop/objednavka/potvrzeni | no 500");
  });
});

// =============================================
// GROUP 3: Admin stránky
// =============================================
test.describe("3. Admin panel (admin@carmakler.cz)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
  });

  test("3a. Admin Team management", async ({ page }) => {
    const result = await checkPage(page, "/admin/team", "Admin - Tým");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });

  test("3b. Admin Reviews management", async ({ page }) => {
    const result = await checkPage(page, "/admin/reviews", "Admin - Recenze");
    expect(result.has500).toBe(false);
    expect(result.redirectedToLogin).toBe(false);
    expect(result.spinnerCount).toBe(0);
  });
});

// =============================================
// GROUP 4: PWA Makléř
// =============================================
test.describe("4. PWA Makléř (jan.novak@carmakler.cz)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, BROKER_EMAIL);
  });

  test("4a. Nové vozidlo - VIN krok (SSR wrapper)", async ({ page }) => {
    await page.goto(`${BASE_URL}/makler/vehicles/new/vin`, { waitUntil: "domcontentloaded", timeout: 20000 });

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    const spinnerCount = await page
      .locator('[class*="animate-spin"]')
      .count();

    const icon = has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK";
    console.log(`${icon} | VIN step | ${currentUrl}`);

    expect(has500, "No 500 error on VIN step").toBe(0);
    expect(
      currentUrl.includes("/login"),
      "Should not redirect to login"
    ).toBe(false);
  });

  test("4b. Success stránka - nové vozidlo", async ({ page }) => {
    await page.goto(`${BASE_URL}/makler/vehicles/new/success?vehicleId=test`, { waitUntil: "domcontentloaded", timeout: 20000 });

    await page.waitForTimeout(2000);

    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    const spinnerCount = await page
      .locator('[class*="animate-spin"]')
      .count();

    console.log(
      `${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /makler/vehicles/new/success | spinners: ${spinnerCount}`
    );
    expect(has500).toBe(0);
  });

  test("4c. Success stránka - quick vozidlo", async ({ page }) => {
    await page.goto(`${BASE_URL}/makler/vehicles/quick/success?vehicleId=test`, { waitUntil: "domcontentloaded", timeout: 20000 });

    await page.waitForTimeout(2000);

    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    const spinnerCount = await page
      .locator('[class*="animate-spin"]')
      .count();

    console.log(
      `${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /makler/vehicles/quick/success | spinners: ${spinnerCount}`
    );
    expect(has500).toBe(0);
  });
});

// =============================================
// GROUP 5: Shop reklamace flow
// =============================================
test.describe("5. Reklamace a sledování objednávky", () => {
  test("5a. Sledování objednávky (bez tokenu)", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop/objednavky/sledovani/test-token`, { waitUntil: "domcontentloaded", timeout: 20000 });

    await page.waitForTimeout(1500);
    const has500 = await page
      .locator('[data-nextjs-dialog-header]')
      .count();
    expect(has500, "No 500 error").toBe(0);
    console.log("✅ OK | Order tracking SSR renders without 500");
  });
});
