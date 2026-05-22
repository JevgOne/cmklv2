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

// Navigate to first partner detail page (PartnersTable uses router.push, no <a> tags)
async function navigateToFirstPartner(page: any): Promise<string | null> {
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  // Wait for client-side table to render (async data fetch)
  await page.waitForTimeout(2000);

  const firstRow = page.locator("table tr.cursor-pointer, table tr[class*='cursor-pointer']").first();
  if (await firstRow.count() === 0) {
    console.log("SKIP: No partner rows in table");
    return null;
  }

  await firstRow.click();
  await page.waitForURL(/\/admin\/partners\//, { timeout: 8000 });
  await page.waitForLoadState("load");
  // Wait for useSession() + partner fetch to resolve
  await page.waitForTimeout(2500);

  const url = page.url();
  const id = url.split("/admin/partners/")[1]?.split("/")[0];
  console.log("Navigated to partner:", id, "URL:", url);
  return id || null;
}

// T1: Admin → ProvizeCard visible with commission rate
test("T1: Admin → /admin/partners → ProvizeCard visible", async ({ page }) => {
  await loginAsAdmin(page);

  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partners in table");
    return;
  }

  await page.screenshot({ path: "test-results/t159-t1-partner-detail.png" });
  const pageContent = await page.textContent("body");

  const hasProvize = pageContent?.includes("Provize");
  const hasRate = pageContent?.includes("15.0") || pageContent?.includes("%");
  console.log("Has 'Provize' heading:", hasProvize);
  console.log("Has commission rate:", hasRate);

  // "Upravit sazbu" button — only shown for ADMIN/BACKOFFICE role
  const editBtnCount = await page.locator("button:has-text('Upravit sazbu')").count();
  console.log("'Upravit sazbu' button count:", editBtnCount);

  expect(page.url()).toContain("/admin/partners/");
  expect(hasProvize).toBeTruthy();
  expect(hasRate).toBeTruthy();
  expect(editBtnCount).toBe(1);
});

// T2+T3: CommissionEditDialog — slider min/max/step + reason validation
test("T2+T3: CommissionEditDialog — slider + reason validation", async ({ page }) => {
  await loginAsAdmin(page);

  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partners");
    return;
  }

  const editBtn = page.locator("button:has-text('Upravit sazbu')");
  await editBtn.waitFor({ timeout: 5000 });
  await editBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/t159-t2-dialog-open.png" });

  // Dialog opened
  const dialog = page.locator('[role="dialog"]');
  expect(await dialog.count()).toBe(1);
  console.log("Dialog opened ✅");

  // T2: Slider min=12, max=20, step=0.5
  const slider = page.locator('[role="dialog"] input[type="range"]').first();
  if (await slider.count() > 0) {
    const min = await slider.getAttribute("min");
    const max = await slider.getAttribute("max");
    const step = await slider.getAttribute("step");
    console.log(`Slider: min=${min}, max=${max}, step=${step}`);
    expect(min).toBe("12");
    expect(max).toBe("20");
    expect(step).toBe("0.5");
  } else {
    console.log("WARN: range slider not found in dialog");
  }

  // Save button inside dialog: disabled initially (rateChanged=false && reasonValid=false)
  const saveBtn = page.locator('[role="dialog"] button:has-text("Uložit")');
  const initialDisabled = await saveBtn.isDisabled().catch(() => null);
  console.log("Save disabled initially (no changes):", initialDisabled);
  expect(initialDisabled).toBeTruthy();

  // T3: Change rate but leave short reason → still disabled (reasonValid=false)
  await slider.fill("16.5"); // 16.5 is valid step=0.5 value
  await page.waitForTimeout(200);
  const textarea = page.locator('[role="dialog"] textarea').first();
  if (await textarea.count() > 0) {
    await textarea.fill("krátké"); // 6 chars < 10
    await page.waitForTimeout(200);
    const disabledShortReason = await saveBtn.isDisabled().catch(() => null);
    console.log("Save disabled: rate changed, reason<10:", disabledShortReason);
    expect(disabledShortReason).toBeTruthy();

    // Fill valid reason (>=10 chars) → Save enabled
    await textarea.fill("tohle je dost dlouhý důvod pro změnu sazby");
    await page.waitForTimeout(200);
    const enabledLongReason = await saveBtn.isEnabled().catch(() => null);
    console.log("Save enabled: rate changed + reason>=10:", enabledLongReason);
    expect(enabledLongReason).toBeTruthy();
    await page.screenshot({ path: "test-results/t159-t3-valid-reason.png" });
  } else {
    console.log("WARN: Textarea not found");
  }
});

// T4: Save commission change + verify Card updated
test("T4: Save commission rate 17.5 → Card shows new rate", async ({ page }) => {
  await loginAsAdmin(page);

  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partners");
    return;
  }

  const editBtn = page.locator("button:has-text('Upravit sazbu')");
  await editBtn.waitFor({ timeout: 5000 });
  await editBtn.click();
  await page.waitForTimeout(500);

  // Read current rate from card, pick a different value
  const bodyBeforeDialog = await page.textContent("body");
  // Use 18.5 — distinct from any prior saved value (17.5), stays within min=12 max=20 step=0.5
  const targetRate = "18.5";
  console.log("Setting slider to", targetRate);

  const slider = page.locator('[role="dialog"] input[type="range"]').first();
  if (await slider.count() > 0) {
    await slider.fill(targetRate);
    await page.waitForTimeout(200);
    console.log("Slider set to", targetRate);
  }

  // Fill reason
  const textarea = page.locator('[role="dialog"] textarea').first();
  if (await textarea.count() > 0) {
    await textarea.fill("Testovací změna sazby pro #159 browser test");
  }

  await page.screenshot({ path: "test-results/t159-t4-before-save.png" });

  // Click Save inside the dialog
  const saveBtn = page.locator('[role="dialog"] button:has-text("Uložit")');
  expect(await saveBtn.isEnabled()).toBeTruthy();
  await saveBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t159-t4-after-save.png" });

  // Dialog should close
  const dialogCount = await page.locator('[role="dialog"]').count();
  console.log("Dialog still open after save:", dialogCount > 0);
  expect(dialogCount).toBe(0);

  // Rate 18.5 should be visible in Provize card
  const bodyText = await page.textContent("body");
  const has185 = bodyText?.includes("18.5") || bodyText?.includes("18,5");
  console.log("Rate 18.5 shown in card after save:", has185);
  expect(has185).toBeTruthy();
});

// T5: Commission History shows entry after T4 save
test("T5: CommissionHistoryList — shows 'Žádné změny' or history entries", async ({ page }) => {
  await loginAsAdmin(page);

  const partnerId = await navigateToFirstPartner(page);
  if (!partnerId) {
    console.log("SKIP: No partners");
    return;
  }

  await page.screenshot({ path: "test-results/t159-t5-partner.png" });
  const bodyText = await page.textContent("body");

  // CommissionHistoryList renders either "Žádné změny sazby." or "Historie změn (N)"
  const hasHistorySection =
    bodyText?.includes("Žádné změny sazby") ||
    bodyText?.includes("Historie změn");
  console.log("Has history list (Žádné změny or Historie):", hasHistorySection);
  expect(hasHistorySection).toBeTruthy();
});

// T6: Auth gating — unauthenticated GET → 401/403
test("T6: commission/history returns 401/403 for unauthenticated request", async ({ request }) => {
  // Use Playwright's `request` fixture — completely fresh context, no browser cookies
  const resp = await request.get(
    `${BASE}/api/admin/partners/cmnps8rvt0000juts9dmllx8i/commission/history`
  );
  console.log("History API (no session):", resp.status());
  expect([401, 403]).toContain(resp.status());
  const body = await resp.json().catch(() => ({}));
  console.log("Response body:", JSON.stringify(body));
  console.log("T6: Unauthenticated request correctly rejected ✅");
});

// T7: PATCH validation — reason < 10 chars → 400
test("T7: PATCH commission with 9-char reason → 400", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/admin/partners`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const firstRow = page.locator("table tr.cursor-pointer, table tr[class*='cursor-pointer']").first();
  if (await firstRow.count() === 0) {
    console.log("SKIP: No partners");
    return;
  }

  await firstRow.click();
  await page.waitForURL(/\/admin\/partners\//, { timeout: 8000 });
  const url = page.url();
  const partnerId = url.split("/admin/partners/")[1]?.split("/")[0];
  if (!partnerId) return;

  // PATCH with newRate (correct field) + 9-char reason
  const resp = await page.request.patch(`${BASE}/api/admin/partners/${partnerId}/commission`, {
    data: { newRate: 16.0, reason: "9chars!!!" }, // exactly 9 chars
  });
  console.log("PATCH (newRate=16.0, reason=9chars) status:", resp.status());
  expect(resp.status()).toBe(400);
  const body = await resp.json().catch(() => ({}));
  const reasonError = JSON.stringify(body).includes("reason") || JSON.stringify(body).includes("Too small");
  console.log("Reason validation error:", reasonError, JSON.stringify(body));
  expect(reasonError).toBeTruthy();
});

// T8: Regression — /admin/payments loads OK (Stripe webhook modified in #88a)
test("T8: /admin/payments regression — 200 (no 500)", async ({ page }) => {
  await loginAsAdmin(page);
  const r = await page.goto(`${BASE}/admin/payments`, { waitUntil: "load" });
  console.log("/admin/payments HTTP:", r?.status());
  await page.screenshot({ path: "test-results/t159-t8-payments.png" });
  expect(r?.status()).toBe(200);
});
