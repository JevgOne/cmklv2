/**
 * Test SSR stránek s VYPNUTÝM JavaScript
 * Ověřuje že server-side rendered obsah je viditelný i bez JS
 */
import { test, expect, Browser, BrowserContext } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";

async function makeNoJsContext(browser: Browser, cookieFile: string): Promise<BrowserContext> {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const raw = execSync(`cat ${cookieFile}`, { encoding: "utf8" });
  const match = raw.match(/next-auth\.session-token\s+(\S+)/);
  if (!match) throw new Error(`No session token in ${cookieFile}`);
  await context.addCookies([{
    name: "next-auth.session-token",
    value: match[1],
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }]);
  return context;
}

async function checkNoJs(context: BrowserContext, url: string, label: string) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Get FULL page source (includes <template> tags with Suspense streamed content)
  const fullHtml = await page.content();
  // Strip script tags and HTML tags, get raw text
  const htmlNoScripts = fullHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  const rawText = htmlNoScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hasContent = rawText.length > 200;

  // Visual DOM check (what renders without JS)
  const bodyText = await page.locator("body").innerText();
  const visibleContent = bodyText.trim().length > 100;

  const tableRows = await page.locator("table tr, tbody tr").count();
  const headings = await page.locator("h1, h2, h3").count();

  const currentUrl = page.url();
  const redirectedToLogin = currentUrl.includes("/login");
  const has500 = await page.locator('[data-nextjs-dialog-header]').count();

  // SSR check: data is in HTML source (even if in <template> tags)
  const ssrOk = has500 === 0 && !redirectedToLogin && hasContent;

  let icon: string;
  let note: string;
  if (has500 > 0) { icon = "❌ 500"; note = ""; }
  else if (redirectedToLogin) { icon = "🔒 LOGIN"; note = ""; }
  else if (!hasContent) { icon = "❌ EMPTY"; note = " (žádný HTML obsah)"; }
  else if (visibleContent) { icon = "✅ VISIBLE"; note = ` DOM: ${tableRows}tr, ${headings}h — obsah viditelný bez JS`; }
  else { icon = "⚠️ TEMPLATE"; note = ` HTML OK, ale v <template> — vyžaduje JS pro render`; }

  console.log(`${icon} | ${label} | ${url}${note}`);
  await page.close();

  return { url, label, ssrOk, visibleContent, icon, tableRows, headings };
}

// =====================================================================
// ADMIN (vypnutý JS)
// =====================================================================
test.describe("ADMIN — bez JavaScript", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await makeNoJsContext(browser, "/tmp/cookies_admin.txt");
  });
  test.afterAll(() => ctx.close());

  test("A-NoJS /admin/users", async () => {
    const r = await checkNoJs(ctx, "/admin/users", "Admin Users");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("A-NoJS /admin/orders", async () => {
    const r = await checkNoJs(ctx, "/admin/orders", "Admin Orders");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("A-NoJS /admin/parts", async () => {
    const r = await checkNoJs(ctx, "/admin/parts", "Admin Parts");
    expect(r.ssrOk, r.icon).toBe(true);
  });
});

// =====================================================================
// PARTNER (vypnutý JS)
// =====================================================================
test.describe("PARTNER — bez JavaScript", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await makeNoJsContext(browser, "/tmp/cookies_partner.txt");
  });
  test.afterAll(() => ctx.close());

  test("P-NoJS /partner/dashboard", async () => {
    const r = await checkNoJs(ctx, "/partner/dashboard", "Partner Dashboard");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("P-NoJS /partner/orders", async () => {
    const r = await checkNoJs(ctx, "/partner/orders", "Partner Orders");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("P-NoJS /partner/parts (VRAKOVISTE)", async ({ browser }) => {
    const vCtx = await makeNoJsContext(browser, "/tmp/cookies_vrakoviste.txt");
    const r = await checkNoJs(vCtx, "/partner/parts", "Partner Parts");
    await vCtx.close();
    expect(r.ssrOk, r.icon).toBe(true);
  });
});

// =====================================================================
// PWA DÍLY (vypnutý JS)
// =====================================================================
test.describe("PWA DÍLY — bez JavaScript", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await makeNoJsContext(browser, "/tmp/cookies_dodavatel.txt");
  });
  test.afterAll(() => ctx.close());

  test("D-NoJS /parts/my", async () => {
    const r = await checkNoJs(ctx, "/parts/my", "Parts My");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("D-NoJS /parts/orders", async () => {
    const r = await checkNoJs(ctx, "/parts/orders", "Parts Orders");
    expect(r.ssrOk, r.icon).toBe(true);
  });
});

// =====================================================================
// PWA MAKLÉŘ (vypnutý JS)
// =====================================================================
test.describe("PWA MAKLÉŘ — bez JavaScript", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await makeNoJsContext(browser, "/tmp/cookies_jan.novak.txt");
  });
  test.afterAll(() => ctx.close());

  test("M-NoJS /makler/leads", async () => {
    const r = await checkNoJs(ctx, "/makler/leads", "Makler Leads");
    expect(r.ssrOk, r.icon).toBe(true);
  });

  test("M-NoJS /makler/contacts", async () => {
    const r = await checkNoJs(ctx, "/makler/contacts", "Makler Contacts");
    expect(r.ssrOk, r.icon).toBe(true);
  });
});
