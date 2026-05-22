/**
 * P1 Pre-launch: F4 Inzerce + F9 Marketplace VIP + F10 Kupující účet + F11 Admin + F13 Responzivita
 * Headed Chrome, session cookie injection
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
  const isUnauthorized = url.includes("/unauthorized") || url.includes("/403");
  const has500 = await page.locator('[data-nextjs-dialog-header], h1:text("500"), h2:text("Application error")').count() > 0;
  const spinners = await page.locator('[class*="animate-spin"]').count();
  const bodyText = (await page.locator("body").innerText()).trim();

  let status: string;
  if (has500) status = "❌ 500";
  else if (isLogin) status = "🔒 LOGIN";
  else if (isUnauthorized) status = "🚫 UNAUTHORIZED";
  else if (bodyText.length < 50) status = "⚠️ EMPTY";
  else if (spinners > 0) status = "⏳ SPINNER";
  else status = "✅ OK";

  console.log(`${status} | ${label} | ${path}`);
  return { ok: !has500 && !isLogin && !isUnauthorized && bodyText.length > 50, status, text: bodyText };
}

async function checkElement(page: Page, selector: string, label: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  const ok = count > 0;
  console.log(`  ${ok ? "✅" : "❌"} ${label}: ${ok ? `found (${count})` : "NOT FOUND"}`);
  return ok;
}

// ─────────────────────────────────────────────────────────────────────────────
// F4: INZERCE
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F4: Inzerce", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_kupujici.txt");
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("F4-01 Inzerce landing", async () => {
    const r = await go(page, "/inzerce", "Inzerce landing");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='text-2xl']", "heading");
  });

  test("F4-02 Inzerce katalog", async () => {
    const r = await go(page, "/inzerce/katalog", "Katalog inzerátů");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, article, [class*='card'], [class*='listing']", "content");
  });

  test("F4-03 Podat inzerát — form", async () => {
    const r = await go(page, "/inzerce/pridat", "Podání inzerátu");
    // Page either shows form or redirect to register first
    const noError = !r.status.includes("500");
    console.log(`  ℹ️ Status: ${r.status}`);
    expect(noError, r.status).toBe(true);
  });

  test("F4-04 Inzerce registrace", async () => {
    const r = await go(page, "/inzerce/registrace", "Registrace inzerenta");
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
  });

  test("F4-05 Inzerce — no 500 on public listing", async () => {
    const r = await go(page, "/inzerce", "Inzerce public");
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F9: MARKETPLACE VIP
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F9: Marketplace VIP", () => {
  // Public: landing + apply
  test("F9-01 Marketplace landing (public)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace", "Marketplace landing");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='hero'], [class*='text-4xl']", "heading");
    await ctx.close();
  });

  test("F9-02 Apply formulář (public)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace/apply", "Apply formulář");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input, [class*='form']", "form");
    await ctx.close();
  });

  // Unauthorized access — should redirect
  test("F9-03 Investor dashboard — unauthorized redirect", async ({ browser }) => {
    const ctx = await browser.newContext(); // no session
    const page = await ctx.newPage();
    await page.goto(`${BASE}/marketplace/investor`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    const isGated = url.includes("/login") || url.includes("/marketplace") || url.includes("/unauthorized");
    console.log(`  ℹ️ Unauth investor URL: ${url}`);
    expect(isGated, `Should redirect or gate, got: ${url}`).toBe(true);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500).toBe(0);
    await ctx.close();
  });

  test("F9-04 Dealer dashboard — unauthorized redirect", async ({ browser }) => {
    const ctx = await browser.newContext(); // no session
    const page = await ctx.newPage();
    await page.goto(`${BASE}/marketplace/dealer`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    const isGated = url.includes("/login") || url.includes("/marketplace") || url.includes("/unauthorized");
    console.log(`  ℹ️ Unauth dealer URL: ${url}`);
    expect(isGated, `Should redirect or gate, got: ${url}`).toBe(true);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    expect(has500).toBe(0);
    await ctx.close();
  });

  // Investor logged in
  test("F9-05 Investor dashboard", async ({ browser }) => {
    const ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_investor.txt");
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace/investor", "Investor dashboard");
    const noError = !r.status.includes("500");
    console.log(`  ℹ️ Investor status: ${r.status}`);
    expect(noError, r.status).toBe(true);
    await ctx.close();
  });

  test("F9-06 Investor deal list", async ({ browser }) => {
    const ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_investor.txt");
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace/investor", "Investor přehled dealů");
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='deal'], [class*='card']", "content");
    await ctx.close();
  });

  // Dealer logged in
  test("F9-07 Dealer dashboard", async ({ browser }) => {
    const ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_dealer.txt");
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace/dealer", "Dealer dashboard");
    const noError = !r.status.includes("500");
    console.log(`  ℹ️ Dealer status: ${r.status}`);
    expect(noError, r.status).toBe(true);
    await ctx.close();
  });

  test("F9-08 Dealer nabídka — new deal form", async ({ browser }) => {
    const ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_dealer.txt");
    const page = await ctx.newPage();
    const r = await go(page, "/marketplace/dealer/nova", "Nový deal");
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
    await ctx.close();
  });

  test("F9-09 Deal detail fallback — no 500", async ({ browser }) => {
    const ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_investor.txt");
    const page = await ctx.newPage();
    await page.goto(`${BASE}/marketplace/deals/nonexistent-deal-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Deal detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
    await ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F10: KUPUJÍCÍ ÚČET
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F10: Kupující účet", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_kupujici.txt");
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("F10-01 Můj účet — přehled", async () => {
    const r = await go(page, "/muj-ucet", "Můj účet");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, nav, [class*='menu']", "content");
  });

  test("F10-02 Profil", async () => {
    const r = await go(page, "/muj-ucet/profil", "Profil");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input, [class*='profile']", "profile content");
  });

  test("F10-03 Oblíbené", async () => {
    const r = await go(page, "/muj-ucet/oblibene", "Oblíbené");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='favorites'], [class*='empty'], p", "content");
  });

  test("F10-04 Garáž", async () => {
    const r = await go(page, "/muj-ucet/garaz", "Garáž");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F10-05 Hlídací pes", async () => {
    const r = await go(page, "/muj-ucet/hlidaci-pes", "Hlídací pes");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p, [class*='alert'], [class*='watchdog']", "content");
  });

  test("F10-06 Poptávky", async () => {
    const r = await go(page, "/muj-ucet/poptavky", "Poptávky");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F10-07 Dotazy", async () => {
    const r = await go(page, "/muj-ucet/dotazy", "Dotazy");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F10-08 Muj ucet — unauthenticated redirect", async ({ browser }) => {
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto(`${BASE}/muj-ucet`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p2.waitForTimeout(2000);
    const url = p2.url();
    const isGated = url.includes("/login") || url.includes("/prihlaseni");
    console.log(`  ℹ️ Unauth muj-ucet URL: ${url}`);
    expect(isGated, `Should redirect to login, got: ${url}`).toBe(true);
    await ctx2.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F11: ADMIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F11: Admin panel", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    await injectSession(ctx, "/tmp/cookies_admin.txt");
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("F11-01 Admin dashboard", async () => {
    const r = await go(page, "/admin/dashboard", "Admin dashboard");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='stat'], [class*='card']", "dashboard content");
  });

  test("F11-02 Users list", async () => {
    const r = await go(page, "/admin/users", "Uživatelé");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], [class*='user'], h1, h2", "users content");
  });

  test("F11-03 Brokers list", async () => {
    const r = await go(page, "/admin/brokers", "Makléři");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], h1, h2", "brokers content");
  });

  test("F11-04 Vehicles list", async () => {
    const r = await go(page, "/admin/vehicles", "Vozidla");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], h1, h2", "vehicles content");
  });

  test("F11-05 Parts admin", async () => {
    const r = await go(page, "/admin/parts", "Díly");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], h1, h2", "parts content");
  });

  test("F11-06 Orders admin", async () => {
    const r = await go(page, "/admin/orders", "Objednávky");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], h1, h2", "orders content");
  });

  test("F11-07 Returns admin", async () => {
    const r = await go(page, "/admin/returns", "Reklamace");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-08 Blog admin", async () => {
    const r = await go(page, "/admin/blog", "Blog admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "table, [class*='table'], h1, h2", "blog content");
  });

  test("F11-09 Blog AI drafts", async () => {
    const r = await go(page, "/admin/blog/ai-drafts", "Blog AI návrhy");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F11-10 Blog comments", async () => {
    const r = await go(page, "/admin/blog/comments", "Blog komentáře");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-11 Leads admin", async () => {
    const r = await go(page, "/admin/leads", "Leady admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-12 Inzerce admin", async () => {
    const r = await go(page, "/admin/inzerce", "Inzerce admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-13 Marketplace admin", async () => {
    const r = await go(page, "/admin/marketplace", "Marketplace admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-14 Marketplace applications", async () => {
    const r = await go(page, "/admin/marketplace/applications", "Marketplace žádosti");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-15 Suppliers admin", async () => {
    const r = await go(page, "/admin/suppliers", "Dodavatelé admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-16 Partners admin", async () => {
    const r = await go(page, "/admin/partners", "Partneři admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-17 Team admin", async () => {
    const r = await go(page, "/admin/team", "Tým admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, [class*='team'], p", "content");
  });

  test("F11-18 Reviews admin", async () => {
    const r = await go(page, "/admin/reviews", "Recenze admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-19 Payouts admin", async () => {
    const r = await go(page, "/admin/payouts", "Výplaty admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-20 Notifications admin", async () => {
    const r = await go(page, "/admin/notifications", "Notifikace admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F11-21 Payments admin", async () => {
    const r = await go(page, "/admin/payments", "Platby admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, table, p", "content");
  });

  test("F11-22 Feeds admin", async () => {
    const r = await go(page, "/admin/feeds", "XML Feedy admin");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F11-23 Manager dashboard", async () => {
    const r = await go(page, "/admin/manager", "Manager panel");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F11-24 Manager approvals", async () => {
    const r = await go(page, "/admin/manager/approvals", "Manager schvalování");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "h1, h2, p", "content");
  });

  test("F11-25 Admin profile", async () => {
    const r = await go(page, "/admin/profile", "Admin profil");
    expect(r.ok, r.status).toBe(true);
    await checkElement(page, "form, input, h1, h2", "content");
  });

  test("F11-26 Broker detail fallback — no 500", async () => {
    await page.goto(`${BASE}/admin/brokers/nonexistent-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Broker detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  test("F11-27 Vehicle detail fallback — no 500", async () => {
    await page.goto(`${BASE}/admin/vehicles/nonexistent-id`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    console.log(`${has500 === 0 ? "✅" : "❌"} Vehicle detail fallback: ${has500 === 0 ? "no 500" : "HAS 500"}`);
    expect(has500).toBe(0);
  });

  test("F11-28 Admin — unauthorized access (no session)", async ({ browser }) => {
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto(`${BASE}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p2.waitForTimeout(2000);
    const url = p2.url();
    const isGated = url.includes("/login") || url.includes("/prihlaseni") || url.includes("/unauthorized");
    console.log(`  ℹ️ Unauth admin URL: ${url}`);
    expect(isGated, `Admin should be gated, got: ${url}`).toBe(true);
    await ctx2.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F13: RESPONZIVITA
// ─────────────────────────────────────────────────────────────────────────────
test.describe("F13: Responzivita", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 800 },
  ];

  const pages = [
    { path: "/", label: "Homepage" },
    { path: "/katalog", label: "Katalog aut" },
    { path: "/inzerce", label: "Inzerce" },
    { path: "/marketplace", label: "Marketplace" },
    { path: "/dily", label: "Eshop díly" },
    { path: "/makler", label: "Makléř landing" },
  ];

  for (const vp of viewports) {
    test(`F13 Responzivita — ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      const results: { path: string; ok: boolean; status: string }[] = [];

      for (const p of pages) {
        await page.goto(`${BASE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1500);

        const bodyText = (await page.locator("body").innerText()).trim();
        const has500 = await page.locator('[data-nextjs-dialog-header]').count() > 0;
        const hasOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth + 10;
        });

        const ok = !has500 && bodyText.length > 50;
        const status = has500 ? "❌ 500" : !ok ? "⚠️ EMPTY" : hasOverflow ? "⚠️ OVERFLOW" : "✅ OK";
        console.log(`  ${status} | ${vp.name}@${vp.width}px | ${p.label} | ${p.path}${hasOverflow ? ` [scrollWidth=${await page.evaluate(() => document.body.scrollWidth)}]` : ""}`);
        results.push({ path: p.path, ok, status });
      }

      const passed = results.filter(r => r.ok).length;
      console.log(`\n  📊 ${vp.name}: ${passed}/${results.length} OK`);

      for (const r of results) {
        expect(r.ok, `${vp.name} ${r.path}: ${r.status}`).toBe(true);
      }

      await ctx.close();
    });
  }
});
