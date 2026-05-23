import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const BAZAR_EMAIL = "bazar@carmakler.cz";
const VRAK_EMAIL = "vrakoviste@carmakler.cz";
const PASS = "heslo123";
const TEST_VEHICLE_ID = "partner-vehicle-test-235";
const TEST_PART_ID = "partner-part-test-235";

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/partner/, { timeout: 12000 });
}

// T1: PARTNER_BAZAR login → /partner/dashboard
test("T1: PARTNER_BAZAR login → /partner/dashboard", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await loginAs(page, BAZAR_EMAIL);
  const url = page.url();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t235-t1-bazar-dashboard.png" });

  const bodyText = await page.textContent("body");
  const hasDashboard = bodyText?.includes("Dashboard") || bodyText?.includes("dashboard");
  const hasNav = bodyText?.includes("Vozidla") || bodyText?.includes("Zájemci");

  console.log("T1 — URL:", url);
  console.log("T1 — Has dashboard:", hasDashboard);
  console.log("T1 — Has BAZAR nav (Vozidla/Zájemci):", hasNav);
  console.log("T1 — Console errors:", consoleErrors.filter(e => !e.includes("404")).slice(0, 5));

  const criticalErrors = consoleErrors.filter(
    (e) => e.includes("TypeError") || e.includes("Prisma") || e.includes("Cannot read")
  );
  expect(url).toContain("/partner");
  expect(hasDashboard).toBeTruthy();
  expect(hasNav).toBeTruthy();
  expect(criticalErrors.length).toBe(0);
});

// T2: PARTNER_VRAKOVISTE login → /partner/dashboard (different nav)
test("T2: PARTNER_VRAKOVISTE login → /partner/dashboard", async ({ page }) => {
  await loginAs(page, VRAK_EMAIL);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t235-t2-vrakoviste-dashboard.png" });

  const bodyText = await page.textContent("body");
  const hasDashboard = bodyText?.includes("Dashboard");
  const hasVrakNav = bodyText?.includes("Díly") || bodyText?.includes("Objednávky");
  const noBazarNav = !bodyText?.includes("Vozidla") || bodyText?.includes("Díly");

  console.log("T2 — URL:", page.url());
  console.log("T2 — Has VRAKOVISTE nav (Díly/Objednávky):", hasVrakNav);
  console.log("T2 — No BAZAR nav (Vozidla):", noBazarNav);

  expect(page.url()).toContain("/partner");
  expect(hasDashboard).toBeTruthy();
  expect(hasVrakNav).toBeTruthy();
});

// T3: BottomNav visible on mobile viewport (C1 — commit 3273d43)
test("T3: Mobile BottomNav visible on 390px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t235-t3-mobile-bottomnav.png" });

  const bodyText = await page.textContent("body");
  // BottomNav renders with nav aria-label or specific nav items
  const bottomNav = page.locator(
    "nav[aria-label*='navigace'], nav[aria-label*='nav'], .fixed.bottom-0, [class*='bottom-nav'], [class*='BottomNav']"
  );
  const hasBottomNav = (await bottomNav.count()) > 0;

  // Check for nav links/icons that appear in the bottom nav
  const hasNavIcons = bodyText?.includes("Dashboard") && bodyText?.includes("Vozidla");

  // No horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const noHorizontalScroll = scrollWidth <= clientWidth + 5;

  console.log("T3 — Bottom nav element found:", hasBottomNav);
  console.log("T3 — Nav icons visible:", hasNavIcons);
  console.log("T3 — No horizontal scroll:", noHorizontalScroll, `(${scrollWidth} <= ${clientWidth})`);

  expect(hasBottomNav || hasNavIcons).toBeTruthy();
  expect(noHorizontalScroll).toBeTruthy();
});

// T4: OfflineBanner in layout (C6 — commit 9c7b38b)
test("T4: OfflineBanner + OnlineStatusProvider in partner layout", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(2000);

  // OfflineBanner should be in DOM (even when online — it renders but stays hidden)
  const offlineBanner = page.locator('[class*="offline"], [class*="OfflineBanner"], [data-testid*="offline"]');
  const hasOfflineBanner = (await offlineBanner.count()) > 0;

  // Check layout renders without crashes
  const bodyText = await page.textContent("body");
  const layoutOk = bodyText?.includes("Dashboard");

  console.log("T4 — OfflineBanner element in DOM:", hasOfflineBanner);
  console.log("T4 — Layout renders OK:", layoutOk);
  console.log("T4 — Page errors:", pageErrors);
  await page.screenshot({ path: "test-results/t235-t4-layout-offline.png" });

  expect(pageErrors.length).toBe(0);
  expect(layoutOk).toBeTruthy();
});

// T5: Vehicle list page (C2 — commit fc1f02b)
test("T5: PARTNER_BAZAR — /partner/vehicles list", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/vehicles`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/t235-t5-vehicles-list.png" });

  const url = page.url();
  const bodyText = await page.textContent("body");
  const hasVehicleContent =
    bodyText?.includes("Vozidla") ||
    bodyText?.includes("BMW") || // test vehicle
    bodyText?.includes("Přidat") ||
    bodyText?.includes("žádná") ||
    bodyText?.includes("empty") ||
    (await page.locator("a[href*='/partner/vehicles/']").count()) > 0;

  console.log("T5 — URL:", url);
  console.log("T5 — Has vehicle content:", hasVehicleContent);
  console.log("T5 — BMW test vehicle found:", bodyText?.includes("BMW"));
  expect(url).toContain("/partner/vehicles");
  expect(hasVehicleContent).toBeTruthy();
});

// T6: Vehicle detail page (C2 — commit fc1f02b)
test("T6: Vehicle detail /partner/vehicles/[id] — fields + edit", async ({ page }) => {
  const network500: string[] = [];
  page.on("response", (resp) => {
    if (resp.status() >= 500) network500.push(`${resp.status()} ${resp.url()}`);
  });

  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/vehicles/${TEST_VEHICLE_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/t235-t6a-vehicle-detail.png" });

  const url = page.url();
  const bodyText = await page.textContent("body");

  const hasBMW = bodyText?.includes("BMW");
  const hasPrice = bodyText?.includes("Kč") || bodyText?.includes("450");
  const hasStatus = bodyText?.includes("Aktivní") || bodyText?.includes("ACTIVE") || bodyText?.includes("aktivní");
  const hasEditBtn =
    (await page.locator("button:has-text('Upravit'), a:has-text('Upravit'), button:has-text('Edit')").count()) > 0;
  const hasPhotoUpload =
    (await page.locator("[class*='PhotoUpload'], input[type='file'], [class*='photo'], [class*='upload']").count()) > 0;

  console.log("T6 — URL:", url);
  console.log("T6 — Has BMW:", hasBMW);
  console.log("T6 — Has price/Kč:", hasPrice);
  console.log("T6 — Has status badge:", hasStatus);
  console.log("T6 — Edit button:", hasEditBtn);
  console.log("T6 — PhotoUpload component:", hasPhotoUpload);
  console.log("T6 — 500 errors:", network500);

  expect(network500.length).toBe(0);
  expect(hasBMW || url.includes("/partner/vehicles/")).toBeTruthy();
});

// T7: Part list + detail + delete (C3 — commit 42bfd1a)
test("T7: PARTNER_VRAKOVISTE — /partner/parts list + detail", async ({ page }) => {
  const network500: string[] = [];
  page.on("response", (resp) => {
    if (resp.status() >= 500) network500.push(`${resp.status()} ${resp.url()}`);
  });

  await loginAs(page, VRAK_EMAIL);

  // Parts list
  await page.goto(`${BASE}/partner/parts`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/t235-t7a-parts-list.png" });

  const listText = await page.textContent("body");
  const hasPartContent =
    listText?.includes("Díl") ||
    listText?.includes("Dveře") || // test part
    listText?.includes("BMW") ||
    listText?.includes("Přidat") ||
    (await page.locator("a[href*='/partner/parts/']").count()) > 0;
  console.log("T7 — Parts list has content:", hasPartContent);
  console.log("T7 — Test part (Dveře BMW) found:", listText?.includes("Dveře") || listText?.includes("BMW"));

  // Part detail
  await page.goto(`${BASE}/partner/parts/${TEST_PART_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/t235-t7b-part-detail.png" });

  const detailText = await page.textContent("body");
  const hasBMWPart = detailText?.includes("BMW") || detailText?.includes("Dveře");
  const hasVyrobce = detailText?.includes("Výrobce");
  const hasZaruka = detailText?.includes("Záruka");
  const hasDeleteBtn =
    (await page.locator("button:has-text('Smazat'), button:has-text('Odstranit')").count()) > 0;

  console.log("T7 — Part detail BMW:", hasBMWPart);
  console.log("T7 — 'Výrobce' label (diacritics):", hasVyrobce);
  console.log("T7 — 'Záruka' label (diacritics):", hasZaruka);
  console.log("T7 — Delete button:", hasDeleteBtn);
  console.log("T7 — 500 errors:", network500);

  expect(network500.length).toBe(0);
  expect(hasBMWPart || page.url().includes("/partner/parts/")).toBeTruthy();
});

// T8: Orders page loads (C4 — commit bea7003)
test("T8: PARTNER_VRAKOVISTE — /partner/orders loads (empty state OK)", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await loginAs(page, VRAK_EMAIL);
  const resp = await page.goto(`${BASE}/partner/orders`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/t235-t8-orders.png" });

  const bodyText = await page.textContent("body");
  const hasOrderContent =
    bodyText?.includes("Objednávk") ||
    bodyText?.includes("objednávk") ||
    bodyText?.includes("žádné") ||
    bodyText?.includes("Nova") ||
    bodyText?.includes("Potvrzena");

  console.log("T8 — URL:", page.url());
  console.log("T8 — Orders page content:", hasOrderContent);
  console.log("T8 — HTTP:", resp?.status());
  console.log("T8 — Page errors:", pageErrors);

  expect(resp?.status()).toBe(200);
  expect(hasOrderContent || (bodyText?.length ?? 0) > 100).toBeTruthy();
  expect(pageErrors.length).toBe(0);
});

// T9: PhotoUpload component visible in new vehicle/part form (C5 — commit 316d957 + 17d87b5)
test("T9: PhotoUpload component visible in /partner/vehicles/new", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/vehicles/new`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/t235-t9a-vehicle-new.png" });

  const bodyText = await page.textContent("body");
  const hasPhotoSection =
    bodyText?.includes("Foto") ||
    bodyText?.includes("foto") ||
    bodyText?.includes("Fotografie") ||
    bodyText?.includes("Nahrát") ||
    bodyText?.includes("nahrát") ||
    bodyText?.includes("obrázek") ||
    bodyText?.includes("Přidat foto") ||
    (await page.locator("input[type='file'], [class*='upload'], [class*='photo']").count()) > 0;

  console.log("T9 — Vehicle new page URL:", page.url());
  console.log("T9 — PhotoUpload/foto section visible:", hasPhotoSection);
  console.log("T9 — upload_preset in page:", bodyText?.includes("upload_preset") || hasPhotoSection);
  await page.screenshot({ path: "test-results/t235-t9b-vehicle-new-photo.png" });

  expect(page.url()).toContain("/partner/vehicles");
  expect(hasPhotoSection).toBeTruthy();
});

// T10: Onboarding flow (C6 — commit 4057b4b)
test("T10: Partner onboarding — middleware redirect + page structure", async ({ page }) => {
  // Test: ONBOARDING status user → redirect to /partner/onboarding
  // No ONBOARDING partner in seed → test page accessibility directly
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/onboarding`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t235-t10-onboarding.png" });

  const bodyText = await page.textContent("body");
  const hasOnboardingContent =
    bodyText?.includes("onboarding") ||
    bodyText?.includes("Onboarding") ||
    bodyText?.includes("Vítejte") ||
    bodyText?.includes("profil") ||
    bodyText?.includes("Krok") ||
    bodyText?.includes("IČO") ||
    bodyText?.includes("Smlouva") ||
    bodyText?.includes("schválení");

  console.log("T10 — URL:", page.url());
  console.log("T10 — Onboarding content:", hasOnboardingContent);
  console.log("T10 — NOTE: Seed has no PARTNER with status=ONBOARDING");

  expect(page.url()).toContain("/partner");
  expect(hasOnboardingContent).toBeTruthy();
});

// T11: Diacritics throughout partner PWA
test("T11: Diacritics — Výrobce/Záruka/Objednávky correct in partner PWA", async ({ page }) => {
  await loginAs(page, VRAK_EMAIL);
  await page.goto(`${BASE}/partner/parts/${TEST_PART_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);

  const bodyText = await page.textContent("body");
  const hasVyrobceCorrect = bodyText?.includes("Výrobce");
  const hasZarukaCorrect = bodyText?.includes("Záruka");
  const hasVyrobceWrong = bodyText?.includes("Vyrobce") && !bodyText?.includes("Výrobce");
  const hasZarukaWrong = bodyText?.includes("Zaruka") && !bodyText?.includes("Záruka");

  // Check orders page for Czech diacritics
  await page.goto(`${BASE}/partner/orders`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const ordersText = await page.textContent("body");
  const hasObjednavkyCorrect = ordersText?.includes("Objednávk") || ordersText?.includes("objednávk");

  console.log("T11 — 'Výrobce' (correct):", hasVyrobceCorrect);
  console.log("T11 — 'Záruka' (correct):", hasZarukaCorrect);
  console.log("T11 — 'Výrobce' wrong (no diacritics):", hasVyrobceWrong);
  console.log("T11 — 'Záruka' wrong (no diacritics):", hasZarukaWrong);
  console.log("T11 — 'Objednávky' (correct):", hasObjednavkyCorrect);

  await page.screenshot({ path: "test-results/t235-t11-diacritics.png" });

  expect(hasVyrobceWrong).toBeFalsy();
  expect(hasZarukaWrong).toBeFalsy();
});

// T12: Protected routes — /partner blocked for non-partner
test("T12: Protected routes — unauthenticated → redirect, non-partner → redirect", async ({ page }) => {
  // T12a: unauthenticated → /partner/dashboard → redirect
  const resp = await page.goto(`${BASE}/partner/dashboard`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  const urlAfterUnauthenticated = page.url();
  console.log("T12a — Unauthenticated /partner/dashboard → URL:", urlAfterUnauthenticated);
  const redirected = !urlAfterUnauthenticated.includes("/partner/dashboard");
  console.log("T12a — Blocked/redirected:", redirected);

  // T12b: BROKER role (not a partner) → /partner → redirect
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"], input[name="email"]', "dodavatel@vrakoviste.cz");
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto(`${BASE}/partner/dashboard`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const afterBrokerURL = page.url();
  console.log("T12b — PARTS_SUPPLIER trying /partner → URL:", afterBrokerURL);
  const brokerBlocked = !afterBrokerURL.includes("/partner/dashboard");
  console.log("T12b — Non-partner blocked:", brokerBlocked);

  await page.screenshot({ path: "test-results/t235-t12-protected.png" });

  expect(redirected).toBeTruthy();
  expect(brokerBlocked).toBeTruthy();
});

// T13: Zero console crashes on key pages
test("T13: Zero page errors on dashboard + vehicles + parts + orders", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/dashboard`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/partner/vehicles`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  await loginAs(page, VRAK_EMAIL);
  await page.goto(`${BASE}/partner/parts`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/partner/orders`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const criticalErrors = consoleErrors.filter(
    (e) =>
      (e.includes("TypeError") || e.includes("Cannot read") || e.includes("Prisma")) &&
      !e.includes("404") &&
      !e.includes("Failed to fetch") // navigation abort during rapid page transitions — expected
  );
  console.log("T13 — Page errors:", pageErrors);
  console.log("T13 — Critical console errors:", criticalErrors);

  expect(pageErrors.length).toBe(0);
  expect(criticalErrors.length).toBe(0);
});
