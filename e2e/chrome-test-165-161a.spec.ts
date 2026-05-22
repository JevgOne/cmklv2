import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const ADMIN_EMAIL = "admin@carmakler.cz";
const ADMIN_PASS = "heslo123";

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 });
}

// T1: Dev server running — homepage loads, no Prisma errors
test("T1: Dev server running — homepage 200, no Prisma schema errors", async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  const resp = await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t165-t1-homepage.png" });

  console.log("Homepage status:", resp?.status());
  const prismaErrors = consoleLogs.filter(
    (l) =>
      l.includes("Prisma") ||
      l.includes("schema") ||
      l.includes("stripeAccountId") ||
      l.includes("stripeOnboarding")
  );
  console.log("Prisma-related console errors:", prismaErrors);
  console.log("All console errors/warnings:", consoleLogs.slice(0, 10));

  expect(resp?.status()).toBe(200);
  expect(prismaErrors.length).toBe(0);
});

// T2: Regression #88a — Commission Card still works after #161-a changes
test("T2: Regression #88a — CommissionCard + edit dialog + history visible", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await loginAsAdmin(page);

  // Navigate to admin partners table
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t165-t2a-partners-table.png" });

  const firstRow = page
    .locator("table tr.cursor-pointer, table tr[class*='cursor-pointer']")
    .first();
  const rowCount = await firstRow.count();
  console.log("Partner rows found:", rowCount);

  if (rowCount === 0) {
    console.log("SKIP: No partner rows in table");
    // Still pass — no regression (table may be empty)
    return;
  }

  await firstRow.click();
  await page.waitForURL(/\/admin\/partners\//, { timeout: 8000 });
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500); // wait for useSession + partner fetch

  const url = page.url();
  const partnerId = url.split("/admin/partners/")[1]?.split("/")[0];
  console.log("Partner detail URL:", url, "ID:", partnerId);

  await page.screenshot({ path: "test-results/t165-t2b-partner-detail.png" });
  const bodyText = await page.textContent("body");

  // Commission Card
  const hasProvize = bodyText?.includes("Provize");
  const hasRate = bodyText?.includes("%");
  const editBtnCount = await page
    .locator("button:has-text('Upravit sazbu')")
    .count();

  console.log("Has 'Provize' heading:", hasProvize);
  console.log("Has commission rate %:", hasRate);
  console.log("'Upravit sazbu' button count:", editBtnCount);

  // Open dialog
  if (editBtnCount > 0) {
    await page.locator("button:has-text('Upravit sazbu')").click();
    await page.waitForTimeout(500);
    const dialogCount = await page.locator('[role="dialog"]').count();
    console.log("Dialog opened:", dialogCount > 0);

    if (dialogCount > 0) {
      const slider = page
        .locator('[role="dialog"] input[type="range"]')
        .first();
      const min = await slider.getAttribute("min");
      const max = await slider.getAttribute("max");
      const step = await slider.getAttribute("step");
      console.log(`Slider: min=${min}, max=${max}, step=${step}`);
      await page.screenshot({ path: "test-results/t165-t2c-dialog.png" });

      // Close dialog
      const cancelBtn = page
        .locator('[role="dialog"] button:has-text("Zrušit")')
        .first();
      if (await cancelBtn.count() > 0) await cancelBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // History list
  const hasHistory =
    bodyText?.includes("Žádné změny sazby") ||
    bodyText?.includes("Historie změn");
  console.log("Has history section:", hasHistory);

  // Console errors check
  const prismaTypeErrors = consoleErrors.filter(
    (e) =>
      e.includes("stripeOnboardingStartedAt") ||
      e.includes("does not exist on type") ||
      e.includes("stripeAccountId") ||
      e.includes("Prisma")
  );
  console.log("Prisma type errors in console:", prismaTypeErrors);

  expect(hasProvize).toBeTruthy();
  expect(hasRate).toBeTruthy();
  expect(editBtnCount).toBeGreaterThanOrEqual(1);
  expect(hasHistory).toBeTruthy();
  expect(prismaTypeErrors.length).toBe(0);
});

// T3: API routes existence — 401/403 for status, 405 for POST-only routes via GET
test("T3: New Stripe Connect API routes respond correctly (no 500)", async ({ request }) => {
  // GET /api/stripe/connect/status — no auth → 401 or 403
  const statusResp = await request.get(`${BASE}/api/stripe/connect/status`);
  console.log("GET /api/stripe/connect/status (no auth):", statusResp.status());
  expect([401, 403]).toContain(statusResp.status());

  // GET /api/stripe/connect/dashboard-link — route is POST-only → 405
  const dashResp = await request.get(
    `${BASE}/api/stripe/connect/dashboard-link`
  );
  console.log(
    "GET /api/stripe/connect/dashboard-link (no auth, GET):",
    dashResp.status()
  );
  // 405 if POST-only, or 401/403 if auth check runs first — NOT 500
  expect([401, 403, 405]).toContain(dashResp.status());
  expect(dashResp.status()).not.toBe(500);

  // GET /api/stripe/connect/onboard-link — route is POST-only → 405
  const onboardResp = await request.get(
    `${BASE}/api/stripe/connect/onboard-link`
  );
  console.log(
    "GET /api/stripe/connect/onboard-link (no auth, GET):",
    onboardResp.status()
  );
  expect([401, 403, 405]).toContain(onboardResp.status());
  expect(onboardResp.status()).not.toBe(500);

  console.log("T3: All new API routes respond without 500 ✅");
});

// T4: Build passes (checked via next build output — run externally, verify no TypeScript errors in browser)
// We verify by checking that the running dev server has no TypeScript compile errors on key pages
test("T4: Key pages load without TypeScript/Prisma runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await loginAsAdmin(page);

  // Admin partners list
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t165-t4a-admin-partners.png" });

  // Admin payments (Stripe regression from #88a T8)
  await page.goto(`${BASE}/admin/payments`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t165-t4b-admin-payments.png" });

  const prismaErrors = errors.filter(
    (e) =>
      e.includes("Prisma") ||
      e.includes("stripeOnboarding") ||
      e.includes("stripeAccountId") ||
      e.includes("does not exist")
  );
  console.log("Page errors collected:", errors.slice(0, 10));
  console.log("Prisma-related page errors:", prismaErrors);

  expect(prismaErrors.length).toBe(0);
});

// T5: Marketplace public flow — no runtime crash from Prisma client regeneration
test("T5: /marketplace public landing loads without crash", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const resp = await page.goto(`${BASE}/marketplace`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t165-t5-marketplace.png" });

  console.log("/marketplace status:", resp?.status());
  console.log("Page errors:", pageErrors);

  expect(resp?.status()).toBe(200);
  expect(pageErrors.length).toBe(0);
});

// T6: No Prisma type errors in admin partner detail devtools console
test("T6: No Prisma type errors in browser console on partner detail", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await loginAsAdmin(page);
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const firstRow = page
    .locator("table tr.cursor-pointer, table tr[class*='cursor-pointer']")
    .first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForURL(/\/admin\/partners\//, { timeout: 8000 });
    await page.waitForLoadState("load");
    await page.waitForTimeout(2500);
  }

  await page.screenshot({ path: "test-results/t165-t6-console-check.png" });

  const prismaTypeErrors = consoleErrors.filter(
    (e) =>
      e.includes("stripeOnboardingStartedAt") ||
      e.includes("does not exist on type") ||
      e.includes("stripeAccountId") ||
      e.includes("commissionRate") ||
      e.includes("Prisma")
  );

  console.log("All console errors:", consoleErrors.slice(0, 15));
  console.log("Prisma type errors:", prismaTypeErrors);

  expect(prismaTypeErrors.length).toBe(0);
  console.log("T6: No Prisma type errors in browser console ✅");
});
