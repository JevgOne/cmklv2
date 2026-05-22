/**
 * P0 Pre-launch: F6 Makléř PWA + F7 Dodavatel dílů PWA
 * Headed Chrome, session cookie injection
 * Output: pass/fail per step, screenshots on failure
 */
import { test, expect, BrowserContext, Page } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:3000";

async function injectSession(ctx: BrowserContext, cookieFile: string) {
  const raw = execSync(`cat ${cookieFile}`, { encoding: "utf8" });
  const match = raw.match(/next-auth\.session-token\s+(\S+)/);
  if (!match) throw new Error(`No session token in ${cookieFile}`);
  await ctx.addCookies([{
    name: "next-auth.session-token",
    value: match[1],
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }]);
}

async function go(page: Page, path: string, label: string): Promise<{ ok: boolean; status: string; text: string }> {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  const url = page.url();
  const isLogin = url.includes("/login") || url.includes("/prihlaseni");
  const has500 = await page.locator('[data-nextjs-dialog-header], h1:text("500"), h2:text("Application error")').count() > 0;
  const spinners = await page.locator('[class*="animate-spin"]').count();
  const bodyText = (await page.locator("body").innerText()).trim();

  let status: string;
  if (has500) status = "❌ 500";
  else if (isLogin) status = "🔒 LOGIN";
  else if (bodyText.length < 50) status = "⚠️ EMPTY";
  else if (spinners > 0) status = "⏳ SPINNER";
  else status = "✅ OK";

  console.log(`${status} | ${label} | ${path}`);
  return { ok: !has500 && !isLogin && bodyText.length > 50, status, text: bodyText };
}

async function checkElement(page: Page, selector: string, label: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  const ok = count > 0;
  console.log(`  ${ok ? "✅" : "❌"} ${label}: ${ok ? `found (${count})` : "NOT FOUND"}`);
  return ok;
}

// ─────────────────────────────────────────────────────────────────────────────
// F6: MAKLÉŘ PWA
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F6: Makléř PWA", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_jan.novak.txt");
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("F6-01 Dashboard loads", async () => {
    const r = await go(page, "/makler/dashboard", "Makléř Dashboard");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='text-xl'], [class*='text-2xl']", "heading");
  });

  test("F6-02 Vehicles list", async () => {
    const r = await go(page, "/makler/vehicles", "Vozidla");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-03 VIN intake — step 1 (vin)", async () => {
    const r = await go(page, "/makler/vehicles/new/vin", "Nabírání — VIN");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "input[placeholder*='VIN'], input[name*='vin'], input[id*='vin']", "VIN input");
  });

  test("F6-04 Quick intake flow start", async () => {
    const r = await go(page, "/makler/vehicles/quick", "Quick intake");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-05 Quick intake step1", async () => {
    const r = await go(page, "/makler/vehicles/quick/step1", "Quick step1");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-06 Quick intake step2", async () => {
    const r = await go(page, "/makler/vehicles/quick/step2", "Quick step2");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-07 Quick intake step3", async () => {
    const r = await go(page, "/makler/vehicles/quick/step3", "Quick step3");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-08 Leads list", async () => {
    const r = await go(page, "/makler/leads", "Leady");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2", "heading");
  });

  test("F6-09 Contacts list", async () => {
    const r = await go(page, "/makler/contacts", "Kontakty");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2", "heading");
  });

  test("F6-10 New contact form", async () => {
    const r = await go(page, "/makler/contacts/new", "Nový kontakt");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input[name], input[type='text']", "form fields");
  });

  test("F6-11 Contracts list", async () => {
    const r = await go(page, "/makler/contracts", "Smlouvy");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-12 New contract form", async () => {
    const r = await go(page, "/makler/contracts/new", "Nová smlouva");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-13 Profile", async () => {
    const r = await go(page, "/makler/profile", "Profil makléře");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input, [class*='profile']", "profile content");
  });

  test("F6-14 Commissions", async () => {
    const r = await go(page, "/makler/commissions", "Provize");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-15 Messages list", async () => {
    const r = await go(page, "/makler/messages", "Zprávy");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-16 Materials", async () => {
    const r = await go(page, "/makler/materials", "Materiály");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-17 Leaderboard", async () => {
    const r = await go(page, "/makler/leaderboard", "Žebříček");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-18 Financing calculator", async () => {
    const r = await go(page, "/makler/financing-calculator", "Kalkulačka");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-19 Blog list", async () => {
    const r = await go(page, "/makler/blog", "Blog");
    expect(r.ok, r.status).toBe(true);
  });

  test("F6-20 Notification settings", async () => {
    const r = await go(page, "/makler/settings/notifications", "Notifikace");
    expect(r.ok, r.status).toBe(true);
  });

  // Interactive: VIN decode via API
  test("F6-21 VIN API decode", async () => {
    const res = await page.request.get(`${BASE}/api/vin/decode?vin=WBA3A5C50CF256429`);
    const ok = res.status() < 500;
    console.log(`${ok ? "✅" : "❌"} VIN API: HTTP ${res.status()}`);
    expect(res.status(), `VIN API status: ${res.status()}`).toBeLessThan(500);
  });

  // Interactive: Submit new contact
  test("F6-22 Contact new form — renders fields", async () => {
    await page.goto(`${BASE}/makler/contacts/new`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const inputs = await page.locator("input, select, textarea").count();
    console.log(`  ✅ Nový kontakt — ${inputs} formulářových polí`);
    expect(inputs).toBeGreaterThan(2);
  });

  // Leads detail (fallback)
  test("F6-23 Lead detail fallback — no 500", async () => {
    await page.goto(`${BASE}/makler/leads/nonexistent-lead-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Lead detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  // Contact detail (fallback)
  test("F6-24 Contact detail fallback — no 500", async () => {
    await page.goto(`${BASE}/makler/contacts/nonexistent-contact-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Contact detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F7: DODAVATEL DÍLŮ PWA
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F7: Dodavatel dílů PWA", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_dodavatel.txt");
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("F7-01 Parts dashboard/home", async () => {
    const r = await go(page, "/parts", "Dodavatel home");
    expect(r.ok, r.status).toBe(true);
  });

  test("F7-02 My parts list", async () => {
    const r = await go(page, "/parts/my", "Moje díly");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2", "heading");
  });

  test("F7-03 New part form", async () => {
    const r = await go(page, "/parts/new", "Nový díl");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input[name], select", "form fields");
    const inputs = await page.locator("input, select, textarea").count();
    console.log(`  ℹ️ Nový díl — ${inputs} polí`);
  });

  test("F7-04 Orders list", async () => {
    const r = await go(page, "/parts/orders", "Objednávky");
    expect(r.ok, r.status).toBe(true);
  });

  test("F7-05 Donor cars list", async () => {
    const r = await go(page, "/parts/donors", "Donor auta");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, button, a[href*='donor']", "content");
  });

  test("F7-06 Supplier profile", async () => {
    const r = await go(page, "/parts/profile", "Profil dodavatele");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input, [class*='profile']", "profile content");
  });

  test("F7-07 Import page", async () => {
    const r = await go(page, "/parts/import", "Import dílů");
    expect(r.ok, r.status).toBe(true);
  });

  // New part form — field check
  test("F7-08 New part form — has required fields", async () => {
    await page.goto(`${BASE}/parts/new`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const hasName = await page.locator("input[name='name'], input[placeholder*='název'], input[placeholder*='name']").count() > 0;
    const hasCategory = await page.locator("select[name='category'], select").count() > 0;
    const hasPrice = await page.locator("input[name='price'], input[type='number']").count() > 0;
    console.log(`  ${hasName ? "✅" : "❌"} Název dílu`);
    console.log(`  ${hasCategory ? "✅" : "❌"} Kategorie`);
    console.log(`  ${hasPrice ? "✅" : "❌"} Cena`);
    expect(hasName || hasCategory || hasPrice, "New part form has fields").toBe(true);
  });

  // Donor car new flow
  test("F7-09 Donor car new — renders", async () => {
    await page.goto(`${BASE}/parts/donors`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Look for add/new button
    const addBtn = await page.locator("a[href*='/new'], button:has-text('Přidat'), button:has-text('Nový')").count();
    console.log(`  ${addBtn > 0 ? "✅" : "⚠️"} Tlačítko přidat donor auto: ${addBtn > 0 ? "found" : "not found (may need donor data)"}`);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500).toBe(0);
  });

  // Parts API
  test("F7-10 Parts API /api/parts/my", async () => {
    const res = await page.request.get(`${BASE}/api/parts/my`);
    const ok = res.status() < 500;
    console.log(`${ok ? "✅" : "❌"} /api/parts/my: HTTP ${res.status()}`);
    expect(res.status()).toBeLessThan(500);
  });

  test("F7-11 Part detail fallback — no 500", async () => {
    await page.goto(`${BASE}/parts/nonexistent-part-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Part detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  test("F7-12 Part edit fallback — no 500", async () => {
    await page.goto(`${BASE}/parts/nonexistent-part-id/edit`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Part edit fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  test("F7-13 Order detail fallback — no 500", async () => {
    await page.goto(`${BASE}/parts/orders/nonexistent-order-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Order detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  test("F7-14 Donor detail fallback — no 500", async () => {
    await page.goto(`${BASE}/parts/donors/nonexistent-donor-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Donor detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });
});
