/**
 * Marketplace — admin dashboard, applications, approval/payout flows
 * Spustit: npx playwright test e2e/marketplace/admin.spec.ts --headed --project=chromium
 */

import { test, expect } from "@playwright/test";
import { dismissCookieConsent, login, TEST_USERS } from "./helpers";

test.describe("Admin Marketplace Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test("loads admin marketplace page", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await expect(page.locator("h1")).toContainText("Marketplace");
  });

  test("shows stat cards (total, active, pending, volume)", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toMatch(/Celkem flip/i);
    expect(body).toMatch(/Aktivni/i);
    expect(body).toMatch(/schvalen/i);
  });

  test("shows link to applications with NEW count", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    const appLink = page.locator('a[href*="/admin/marketplace/applications"]');
    await expect(appLink).toBeVisible();

    const linkText = await appLink.textContent();
    expect(linkText).toMatch(/Žádosti o přístup/i);
  });

  test("shows pending payments section", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toMatch(/platby|Cekajici/i);
  });

  test("shows all flips table", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toMatch(/flipy|Vsechny/i);
  });
});

test.describe("Admin Applications", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test("loads applications list page", async ({ page }) => {
    await page.goto("/admin/marketplace/applications");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await expect(page.locator("h1")).toContainText("Žádosti o přístup");
  });

  test("shows status filter tabs", async ({ page }) => {
    await page.goto("/admin/marketplace/applications");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toContain("Vše");
    expect(body).toContain("Nové");
    expect(body).toContain("Schválené");
    expect(body).toContain("Zamítnuté");
  });

  test("has search input", async ({ page }) => {
    await page.goto("/admin/marketplace/applications");
    await dismissCookieConsent(page);

    const searchInput = page.locator('input[name="search"]');
    await expect(searchInput).toBeVisible();
  });

  test("filter by status works", async ({ page }) => {
    await page.goto("/admin/marketplace/applications?status=NEW");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    // The NEW tab should be active (orange background)
    const activeTab = page.locator('a[href*="status=NEW"]');
    const classes = await activeTab.getAttribute("class");
    expect(classes).toContain("orange");
  });

  test("application detail page loads", async ({ page }) => {
    await page.goto("/admin/marketplace/applications");
    await dismissCookieConsent(page);

    // Click first "Detail" link if available
    const detailLink = page.locator('a:has-text("Detail")').first();
    if (await detailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailLink.click();
      await page.waitForLoadState("networkidle");

      // Should show application detail
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/Kontaktní údaje|Zpráva od žadatele/i);
    }
  });

  test("application detail shows admin actions", async ({ page }) => {
    await page.goto("/admin/marketplace/applications");
    await dismissCookieConsent(page);

    const detailLink = page.locator('a:has-text("Detail")').first();
    if (await detailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Should show action buttons (unless already approved)
      const body = await page.locator("body").textContent();
      const hasActions = body?.match(/Schválit|Zamítnout|Kontaktovaný|spam/i);
      const isApproved = body?.match(/APPROVED/i) && body?.match(/Propojený účet/i);

      // Either actions are available or it's already approved
      expect(hasActions || isApproved).toBeTruthy();
    }
  });
});

test.describe("Admin Flip Detail", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test("flip detail page loads from dashboard", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    // Click first flip detail link
    const flipLink = page.locator('a[href*="/admin/marketplace/"]').filter({ hasNotText: "applications" }).first();
    if (await flipLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flipLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Should show flip details
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/Detaily vozidla|Prubeh flipu|Realizátor/i);
    }
  });

  test("admin can see dealer email in flip detail", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    const flipLink = page.locator('a[href*="/admin/marketplace/"]').filter({ hasNotText: "applications" }).first();
    if (await flipLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flipLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const body = await page.locator("body").textContent();
      // Admin should see dealer email (F7 fix)
      if (body?.includes("Realizátor")) {
        expect(body).toMatch(/Email|@/i);
      }
    }
  });

  test("admin actions visible for PENDING_APPROVAL flips", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    // Find a pending approval flip
    const pendingBadge = page.locator('text=PENDING_APPROVAL, text=Ke schvaleni').first();
    if (await pendingBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Navigate to its detail
      const row = pendingBadge.locator("xpath=ancestor::tr");
      const link = row.locator('a[href*="/admin/marketplace/"]');
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Should show approve/reject buttons
        await expect(page.locator('button:has-text("Schválit")')).toBeVisible();
        await expect(page.locator('button:has-text("Zamítnout")')).toBeVisible();
      }
    }
  });
});

test.describe("Admin API — auth protection", () => {
  test("GET /api/admin/marketplace/applications — requires ADMIN role", async ({ request }) => {
    const res = await request.get("/api/admin/marketplace/applications");
    expect(res.status()).toBe(403);
  });

  test("PUT /api/admin/marketplace/applications/fake-id — requires ADMIN role", async ({ request }) => {
    const res = await request.put("/api/admin/marketplace/applications/fake-id", {
      data: { status: "APPROVED" },
    });
    expect(res.status()).toBe(403);
  });

  test("PUT /api/marketplace/investments/fake-id/confirm-payment — requires ADMIN role", async ({ request }) => {
    const res = await request.put("/api/marketplace/investments/fake-id/confirm-payment", {
      data: { paymentReference: "test" },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/marketplace/opportunities/fake-id/approve — requires ADMIN role", async ({ request }) => {
    const res = await request.post("/api/marketplace/opportunities/fake-id/approve", {
      data: { approved: true },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/marketplace/opportunities/fake-id/payout — requires ADMIN role", async ({ request }) => {
    const res = await request.post("/api/marketplace/opportunities/fake-id/payout", {
      data: { actualSalePrice: 300000 },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("Payment Confirmation/Rejection", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test("pending payments table shows confirm and reject buttons", async ({ page }) => {
    await page.goto("/admin/marketplace");
    await dismissCookieConsent(page);

    // PaymentConfirmation component renders table with Potvrdit/Zamítnout
    const confirmBtn = page.locator('button:has-text("Potvrdit")').first();
    const rejectBtn = page.locator('button:has-text("Zamítnout")').first();

    // If there are pending payments, both buttons should be visible
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(confirmBtn).toBeVisible();
      await expect(rejectBtn).toBeVisible();
    }
  });
});
