/**
 * Finální SSR Migration test — 33 stránek
 * Partner (11) + Admin (11) + PWA Díly (8) + PWA Makléř (3)
 * Cookie injection approach (bez login redirect na dashboard)
 */
import { test, expect, BrowserContext, Page } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";

// Inject pre-obtained session cookie into context
async function injectSession(
  context: BrowserContext,
  cookieFile: string
) {
  const raw = execSync(`cat ${cookieFile}`, { encoding: "utf8" });
  const match = raw.match(/next-auth\.session-token\s+(\S+)/);
  if (!match) throw new Error(`No session token in ${cookieFile}`);
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: match[1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

// Navigate and check the page
async function checkPage(
  page: Page,
  url: string,
  label: string
): Promise<{ ok: boolean; status: string; spinners: number }> {
  await page.goto(`${BASE_URL}${url}`, {
    waitUntil: "commit",
    timeout: 45000,
  });
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const has500 = await page.locator('[data-nextjs-dialog-header], h1:text("500"), h2:text("Application error")').count();
  const spinners = await page.locator('[class*="animate-spin"]').count();
  const redirectedToLogin = currentUrl.includes("/login") || currentUrl.includes("/prihlaseni");

  const statusIcon = has500 > 0 ? "❌ 500" : redirectedToLogin ? "🔒 LOGIN" : spinners > 0 ? "⏳ SPINNER" : "✅ OK";
  console.log(`${statusIcon} | ${label} | ${url} → ${currentUrl}`);

  return {
    ok: has500 === 0 && !redirectedToLogin,
    status: statusIcon,
    spinners,
  };
}

// =====================================================================
// PARTNER PORTÁL (11 stránek) — partner@testbazar.cz
// =====================================================================
test.describe("PARTNER PORTÁL (partner@testbazar.cz)", () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context, "/tmp/cookies_partner.txt");
  });

  test("P01 /partner/dashboard", async ({ page }) => {
    const r = await checkPage(page, "/partner/dashboard", "Dashboard");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners, "No loading spinners").toBe(0);
  });

  test("P02 /partner/orders", async ({ page }) => {
    const r = await checkPage(page, "/partner/orders", "Objednávky");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P03 /partner/orders/[id] — fallback 404 OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/partner/orders/nonexistent-order-id`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 error").toBe(0);
    console.log(`✅ OK | /partner/orders/[id] | no 500`);
  });

  test("P04 /partner/parts (VRAKOVISTE role)", async ({ page, context }) => {
    // /partner/parts requires PARTNER_VRAKOVISTE role — inject vrakoviste session
    await context.clearCookies();
    await injectSession(context, "/tmp/cookies_vrakoviste.txt");
    const r = await checkPage(page, "/partner/parts", "Produkty");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P05 /partner/parts/[id] — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/partner/parts/nonexistent-part-id`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 error").toBe(0);
    console.log(`✅ OK | /partner/parts/[id] | no 500`);
  });

  test("P06 /partner/profile", async ({ page }) => {
    const r = await checkPage(page, "/partner/profile", "Profil");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P07 /partner/billing (VRAKOVISTE role)", async ({ page, context }) => {
    // /partner/billing requires PARTNER_VRAKOVISTE role — inject vrakoviste session
    await context.clearCookies();
    await injectSession(context, "/tmp/cookies_vrakoviste.txt");
    const r = await checkPage(page, "/partner/billing", "Faktury");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P08 /partner/stats", async ({ page }) => {
    const r = await checkPage(page, "/partner/stats", "Statistiky");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P09 /partner/leads", async ({ page }) => {
    const r = await checkPage(page, "/partner/leads", "Leady");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P10 /partner/messages", async ({ page }) => {
    const r = await checkPage(page, "/partner/messages", "Zprávy");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("P11 /partner/documents", async ({ page }) => {
    const r = await checkPage(page, "/partner/documents", "Dokumenty");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });
});

// =====================================================================
// ADMIN PANEL (11 stránek) — admin@carmakler.cz
// =====================================================================
test.describe("ADMIN PANEL (admin@carmakler.cz)", () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context, "/tmp/cookies_admin.txt");
  });

  test("A01 /admin/users", async ({ page }) => {
    const r = await checkPage(page, "/admin/users", "Uživatelé");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A02 /admin/orders", async ({ page }) => {
    const r = await checkPage(page, "/admin/orders", "Objednávky");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A03 /admin/parts", async ({ page }) => {
    const r = await checkPage(page, "/admin/parts", "Díly");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A04 /admin/suppliers", async ({ page }) => {
    const r = await checkPage(page, "/admin/suppliers", "Dodavatelé");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A05 /admin/vehicles", async ({ page }) => {
    const r = await checkPage(page, "/admin/vehicles", "Vozidla");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A06 /admin/brokers", async ({ page }) => {
    const r = await checkPage(page, "/admin/brokers", "Makléři");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A07 /admin/blog", async ({ page }) => {
    const r = await checkPage(page, "/admin/blog", "Blog");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A08 /admin/team", async ({ page }) => {
    const r = await checkPage(page, "/admin/team", "Tým");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A09 /admin/reviews", async ({ page }) => {
    const r = await checkPage(page, "/admin/reviews", "Recenze");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("A10 /admin/marketplace/applications", async ({ page }) => {
    const r = await checkPage(
      page,
      "/admin/marketplace/applications",
      "Marketplace aplikace"
    );
    // May redirect or 404 if no such route — check no 500
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 error").toBe(0);
    console.log(`Checked /admin/marketplace/applications: ${r.status}`);
  });

  test("A11 /admin/manager/notifications", async ({ page }) => {
    const r = await checkPage(
      page,
      "/admin/manager/notifications",
      "Manager notifikace"
    );
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });
});

// =====================================================================
// PWA DÍLY (8 stránek) — dodavatel@vrakoviste.cz
// =====================================================================
test.describe("PWA DÍLY (dodavatel@vrakoviste.cz)", () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context, "/tmp/cookies_dodavatel.txt");
  });

  test("D01 /parts/my", async ({ page }) => {
    const r = await checkPage(page, "/parts/my", "Moje díly");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("D02 /parts/orders", async ({ page }) => {
    const r = await checkPage(page, "/parts/orders", "Objednávky dílů");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("D03 /parts/orders/[id] — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/parts/orders/nonexistent-order`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 on parts order detail").toBe(0);
    console.log(`✅ OK | /parts/orders/[id] | no 500`);
  });

  test("D04 /parts/[id] — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/parts/nonexistent-part`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 on part detail").toBe(0);
    console.log(`✅ OK | /parts/[id] | no 500`);
  });

  test("D05 /parts/[id]/edit — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/parts/nonexistent-part/edit`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 on part edit").toBe(0);
    console.log(`✅ OK | /parts/[id]/edit | no 500`);
  });

  test("D06 /parts/profile", async ({ page }) => {
    const r = await checkPage(page, "/parts/profile", "Profil dodavatele");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("D07 /parts/donors", async ({ page }) => {
    const r = await checkPage(page, "/parts/donors", "Donor auta");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("D08 /parts/donors/[id] — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/parts/donors/nonexistent-donor`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 on donor detail").toBe(0);
    console.log(`✅ OK | /parts/donors/[id] | no 500`);
  });
});

// =====================================================================
// PWA MAKLÉŘ (3 stránky) — jan.novak@carmakler.cz
// =====================================================================
test.describe("PWA MAKLÉŘ (jan.novak@carmakler.cz)", () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context, "/tmp/cookies_jan.novak.txt");
  });

  test("M01 /makler/leads", async ({ page }) => {
    const r = await checkPage(page, "/makler/leads", "Leady");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("M02 /makler/contacts", async ({ page }) => {
    const r = await checkPage(page, "/makler/contacts", "Kontakty");
    expect(r.ok, r.status).toBe(true);
    expect(r.spinners).toBe(0);
  });

  test("M03 /makler/contacts/[id] — fallback OK", async ({ page }) => {
    await page.goto(`${BASE_URL}/makler/contacts/nonexistent-contact`, {
      waitUntil: "commit",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500, "No 500 on contact detail").toBe(0);
    console.log(`✅ OK | /makler/contacts/[id] | no 500`);
  });
});
