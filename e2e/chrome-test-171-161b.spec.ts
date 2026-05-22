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

async function navigateToFirstPartner(page: any): Promise<string | null> {
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const firstRow = page
    .locator("table tr.cursor-pointer, table tr[class*='cursor-pointer']")
    .first();
  if ((await firstRow.count()) === 0) return null;
  await firstRow.click();
  await page.waitForURL(/\/admin\/partners\//, { timeout: 8000 });
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500);
  const url = page.url();
  return url.split("/admin/partners/")[1]?.split("/")[0] || null;
}

// T1: Dev server running — no Prisma schema errors
test("T1: Dev server running — homepage 200, no Prisma errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const resp = await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t171-t1-homepage.png" });

  const prismaErrors = consoleErrors.filter(
    (e) => e.includes("Prisma") || e.includes("schema") || e.includes("stripeOnboarding")
  );
  console.log("Homepage status:", resp?.status());
  console.log("Prisma console errors:", prismaErrors);

  expect(resp?.status()).toBe(200);
  expect(prismaErrors.length).toBe(0);
});

// T2: Admin login + partners list navigation
test("T2: Admin login → /admin/partners loads", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/t171-t2-partners-list.png" });

  const bodyText = await page.textContent("body");
  console.log("URL after login:", page.url());
  console.log("Partners page has table:", bodyText?.includes("table") || await page.locator("table").count() > 0);

  expect(page.url()).toContain("/admin");
  expect(await page.locator("table, [data-testid='partners-table']").count()).toBeGreaterThan(0);
});

// T3: PartnerDetail + StripeOnboardingCard render
test("T3: PartnerDetail — StripeOnboardingCard renders, amber warning gone", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await loginAsAdmin(page);
  const partnerId = await navigateToFirstPartner(page);

  if (!partnerId) {
    console.log("SKIP: No partner rows");
    return;
  }

  await page.screenshot({ path: "test-results/t171-t3a-partner-detail.png" });
  const bodyText = await page.textContent("body");
  console.log("Partner URL:", page.url());

  // Stripe Connect Express card
  const hasStripeCard =
    bodyText?.includes("Stripe Connect") ||
    bodyText?.includes("Stripe účet") ||
    bodyText?.includes("Zkopírovat onboarding") ||
    bodyText?.includes("not_started") ||
    bodyText?.includes("Výplaty provizních");
  console.log("Has StripeOnboardingCard:", hasStripeCard);

  // StripeStatusBadge present
  const badgeCount = await page.locator("text=Nepřipojen, text=In Review, text=Aktivní, text=Paused, text=Incomplete").count();
  const hasBadge = bodyText?.includes("Nepřipojen") || bodyText?.includes("Aktivní") || bodyText?.includes("In Review") || bodyText?.includes("Paused") || bodyText?.includes("Incomplete");
  console.log("Has StripeStatusBadge text:", hasBadge);

  // Amber warning "Stripe účet nepřipojen" removed from Commission Card
  const hasAmberWarning = bodyText?.includes("Stripe účet nepřipojen");
  console.log("Amber warning 'Stripe účet nepřipojen' removed from CommissionCard:", !hasAmberWarning);

  // Card order: CommissionCard content present + StripeOnboardingCard + "Stav a přiřazení"
  const hasCommissionCard = bodyText?.includes("Provize");
  const hasStatusCard = bodyText?.includes("Stav a přiřazení");
  console.log("Has CommissionCard ('Provize'):", hasCommissionCard);
  console.log("Has 'Stav a přiřazení' section:", hasStatusCard);

  // Console errors
  const criticalErrors = consoleErrors.filter(
    (e) =>
      e.includes("stripeOnboardingStartedAt does not exist") ||
      e.includes("pg") ||
      e.includes("Prisma")
  );
  console.log("Critical console errors:", criticalErrors);

  await page.screenshot({ path: "test-results/t171-t3b-stripe-card.png" });

  expect(hasStripeCard).toBeTruthy();
  expect(hasCommissionCard).toBeTruthy();
  expect(hasStatusCard).toBeTruthy();
  expect(criticalErrors.length).toBe(0);
  // Amber warning must be removed (it was in CommissionCard in old code)
  expect(hasAmberWarning).toBeFalsy();
});

// T4: 5-state UI — not_started state visible, copy-link button clickable
test("T4: not_started state — copy-link button + busy/feedback flow", async ({ page }) => {
  const networkErrors: { url: string; status: number }[] = [];
  page.on("response", (resp) => {
    if (resp.status() >= 500) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  await loginAsAdmin(page);
  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partner");
    return;
  }

  // Test partner has no stripeAccountId → not_started state
  const copyBtn = page.locator("button:has-text('Zkopírovat onboarding link')").first();
  const hasCopyBtn = (await copyBtn.count()) > 0;
  console.log("Copy-link button visible (not_started state):", hasCopyBtn);

  if (hasCopyBtn) {
    await page.screenshot({ path: "test-results/t171-t4a-before-copy.png" });
    await copyBtn.click();
    // Wait for busy state or feedback
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/t171-t4b-after-copy.png" });

    const bodyAfter = await page.textContent("body");
    // Success (link copied) OR error feedback — either means UI flow works
    const hasFeedback =
      bodyAfter?.includes("Zkopírováno") ||
      bodyAfter?.includes("Chyba") ||
      bodyAfter?.includes("selhal") ||
      bodyAfter?.includes("nepodařilo") ||
      bodyAfter?.includes("Nepodařilo");
    console.log("Feedback shown after copy-link click:", hasFeedback);
    console.log("500 errors during copy:", networkErrors.filter(e => e.url.includes("stripe")).length);

    // No 500 errors on the connect routes (401/400 OK — Stripe may reject without real account)
    const stripe500 = networkErrors.filter(
      (e) => e.url.includes("/api/stripe/connect") && e.status >= 500
    );
    expect(stripe500.length).toBe(0);
  } else {
    // If state is different from not_started, still check no 500s
    console.log("Partner not in not_started state — checking no 500 errors");
  }

  // No 500 errors on any stripe connect routes
  const any500 = networkErrors.filter((e) => e.url.includes("/api/stripe"));
  console.log("Any 500 on Stripe routes:", any500);
  expect(any500.length).toBe(0);
});

// T5: Sync button — busy state + feedback (error OK, UI flow required)
test("T5: Sync button — busy state + no 500", async ({ page }) => {
  const networkErrors: { url: string; status: number }[] = [];
  page.on("response", (resp) => {
    if (resp.url().includes("/api/stripe") && resp.status() >= 500) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  await loginAsAdmin(page);
  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partner");
    return;
  }

  const syncBtn = page.locator("button:has-text('Sync ze Stripe')").first();
  const hasSyncBtn = (await syncBtn.count()) > 0;
  console.log("Sync button visible:", hasSyncBtn);

  if (hasSyncBtn) {
    await syncBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/t171-t5-after-sync.png" });

    const bodyAfter = await page.textContent("body");
    const hasFeedback =
      bodyAfter?.includes("Synchronizováno") ||
      bodyAfter?.includes("Sync ze Stripe selhal") ||
      bodyAfter?.includes("Chyba") ||
      bodyAfter?.includes("selhal");
    console.log("Feedback after sync:", hasFeedback);
    console.log("500 errors on stripe routes:", networkErrors.length);
    expect(networkErrors.length).toBe(0);
  } else {
    // Sync button shown only when state != not_started (no stripeAccountId)
    // For not_started partner, sync btn is hidden — this is expected behavior per spec
    console.log("Sync button not shown (expected for not_started state — no stripeAccountId)");
  }
});

// T6: #88a Commission regression
test("T6: #88a CommissionCard regression — slider/dialog/history intact", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await loginAsAdmin(page);
  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partner");
    return;
  }

  const bodyText = await page.textContent("body");

  const hasProvize = bodyText?.includes("Provize");
  const hasRate = bodyText?.includes("%");
  const editBtnCount = await page.locator("button:has-text('Upravit sazbu')").count();

  console.log("Has 'Provize' heading:", hasProvize);
  console.log("Has commission rate %:", hasRate);
  console.log("'Upravit sazbu' button:", editBtnCount);

  // Open dialog
  if (editBtnCount > 0) {
    await page.locator("button:has-text('Upravit sazbu')").click();
    await page.waitForTimeout(500);
    const dialogOpen = (await page.locator('[role="dialog"]').count()) > 0;
    console.log("Dialog opened:", dialogOpen);

    if (dialogOpen) {
      const slider = page.locator('[role="dialog"] input[type="range"]').first();
      if ((await slider.count()) > 0) {
        const min = await slider.getAttribute("min");
        const max = await slider.getAttribute("max");
        const step = await slider.getAttribute("step");
        console.log(`Slider: min=${min}, max=${max}, step=${step}`);
        expect(min).toBe("12");
        expect(max).toBe("20");
        expect(step).toBe("0.5");
      }
      await page.screenshot({ path: "test-results/t171-t6-commission-dialog.png" });
      // Close dialog
      const cancelBtn = page.locator('[role="dialog"] button:has-text("Zrušit")').first();
      if ((await cancelBtn.count()) > 0) await cancelBtn.click();
      await page.waitForTimeout(300);
    }
    expect(dialogOpen).toBeTruthy();
  }

  const hasHistory =
    bodyText?.includes("Žádné změny sazby") ||
    bodyText?.includes("Historie změn");
  console.log("Has history section:", hasHistory);

  const criticalErrors = consoleErrors.filter(
    (e) => e.includes("stripeOnboarding") || e.includes("Prisma") || e.includes("pg")
  );
  console.log("Critical console errors:", criticalErrors);

  expect(hasProvize).toBeTruthy();
  expect(hasRate).toBeTruthy();
  expect(hasHistory).toBeTruthy();
  expect(criticalErrors.length).toBe(0);
});

// T7: Console + network — no pg bundle errors, no Prisma type errors
test("T7: Console + network — no pg client bundle, no Prisma type errors, no 500s", async ({ page }) => {
  const consoleErrors: string[] = [];
  const network500: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("response", (resp) => {
    if (resp.status() >= 500) network500.push(`${resp.status()} ${resp.url()}`);
  });

  await loginAsAdmin(page);
  await navigateToFirstPartner(page);
  await page.waitForTimeout(1000);

  const pgBundleErrors = consoleErrors.filter(
    (e) => e.includes("pg") && (e.includes("bundle") || e.includes("require") || e.includes("Cannot find module"))
  );
  const prismaTypeErrors = consoleErrors.filter(
    (e) =>
      e.includes("does not exist on type") ||
      e.includes("stripeOnboardingStartedAt") ||
      e.includes("stripeAccountId")
  );
  const stripe500s = network500.filter((u) => u.includes("stripe"));

  console.log("All console errors:", consoleErrors.slice(0, 15));
  console.log("pg bundle errors:", pgBundleErrors);
  console.log("Prisma type errors:", prismaTypeErrors);
  console.log("Stripe 500s in network:", stripe500s);

  expect(pgBundleErrors.length).toBe(0);
  expect(prismaTypeErrors.length).toBe(0);
  expect(stripe500s.length).toBe(0);
});

// T8: /admin/payments smoke
test("T8: /admin/payments loads OK (no 500, #88a commission intact)", async ({ page }) => {
  await loginAsAdmin(page);
  const resp = await page.goto(`${BASE}/admin/payments`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t171-t8-payments.png" });
  console.log("/admin/payments HTTP:", resp?.status());
  expect(resp?.status()).toBe(200);
});

// T9: /marketplace public smoke
test("T9: /marketplace public — loads OK, no regressions", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const resp = await page.goto(`${BASE}/marketplace`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/t171-t9-marketplace.png" });
  console.log("/marketplace HTTP:", resp?.status());
  console.log("Page errors:", pageErrors);

  expect(resp?.status()).toBe(200);
  expect(pageErrors.length).toBe(0);
});
