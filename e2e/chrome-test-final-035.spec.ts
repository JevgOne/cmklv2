/**
 * FINAL TEST — carmakler.cz full web click-through
 * Phase 1-7A deployed, comprehensive check
 */
import { test, Page } from "@playwright/test";

const BASE = "https://carmakler.cz";
const BPS = [375, 768, 1280] as const;

type R = {
  url: string;
  bp: number;
  status: "PASS" | "FAIL" | "REDIRECT" | "STUB" | "ERROR";
  http: number;
  content: boolean;
  css: boolean;
  overflow: boolean;
  jsErrors: string[];
  notes: string;
};

const REPORT: R[] = [];

function icon(s: string) {
  return s === "PASS" ? "✅" : s === "REDIRECT" ? "🔒" : s === "STUB" ? "🔲" : s === "FAIL" ? "❌" : "⚠️";
}

async function testPage(page: Page, path: string, bp: number): Promise<R> {
  const jsErrors: string[] = [];
  const handler = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Skip known benign errors
      if (t.includes("favicon") || t.includes("ERR_BLOCKED_BY_CLIENT") ||
          t.includes("gtag") || t.includes("ads") || t.includes("google-analytics")) return;
      jsErrors.push(t.slice(0, 150));
    }
  };
  const errHandler = (e: Error) => jsErrors.push(`[pageerror] ${e.message.slice(0, 150)}`);

  page.on("console", handler);
  page.on("pageerror", errHandler);

  const r: R = { url: path, bp, status: "ERROR", http: 0, content: false, css: false, overflow: true, jsErrors: [], notes: "" };

  try {
    await page.setViewportSize({ width: bp, height: bp <= 375 ? 812 : bp <= 768 ? 1024 : 900 });
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(800);

    r.http = resp?.status() ?? 0;
    const url = page.url();

    if (url.includes("/login") && !path.includes("login") && !path.includes("prihlaseni")) {
      r.status = "REDIRECT"; r.notes = "→ login"; return r;
    }
    if (r.http === 404) { r.status = "STUB"; r.notes = "404"; return r; }
    if (r.http >= 500) { r.status = "FAIL"; r.notes = `HTTP ${r.http}`; return r; }

    r.content = await page.evaluate(() => document.body.innerText.trim().length > 50);
    r.css = await page.evaluate(() => {
      const h = document.querySelector("h1, h2");
      if (!h) return true;
      return parseFloat(window.getComputedStyle(h).fontSize) > 14;
    });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    r.overflow = sw > cw + 2;

    r.jsErrors = [...jsErrors];
    r.status = r.content && r.css && !r.overflow ? "PASS" : "FAIL";
    if (!r.content) r.notes += "BLANK ";
    if (!r.css) r.notes += "NO-CSS ";
    if (r.overflow) r.notes += `OVERFLOW(${sw}px) `;
    if (r.jsErrors.length > 0) r.notes += `${r.jsErrors.length} JS-ERR`;
    r.notes = r.notes.trim() || "OK";
  } catch (e) {
    r.status = "ERROR";
    r.notes = e instanceof Error ? e.message.slice(0, 80) : String(e).slice(0, 80);
  } finally {
    page.off("console", handler);
    page.off("pageerror", errHandler);
  }
  return r;
}

async function runPage(browser: Parameters<typeof test>[1] extends infer T ? any : never, path: string, label: string) {
  // helper called from within test() — not used as top-level
}

// ── All pages ─────────────────────────────────────────────────────────────────

const ALL_PAGES: [string, string][] = [
  // Hlavní web
  ["/", "Homepage"],
  ["/o-nas", "O nás"],
  ["/jak-to-funguje", "Jak to funguje"],
  ["/kontakt", "Kontakt"],
  ["/cenik", "Ceník"],
  ["/chci-prodat", "Chci prodat"],
  ["/jak-prodat-auto", "Jak prodat auto"],
  ["/kolik-stoji-moje-auto", "Ocenění auta"],
  ["/recenze", "Recenze"],
  ["/kariera", "Kariéra"],
  ["/sluzby", "Služby"],
  ["/sluzby/proverka", "Prověrka"],
  ["/sluzby/financovani", "Financování"],
  ["/sluzby/pojisteni", "Pojištění"],
  ["/makleri", "Makléři"],
  // Blog
  ["/blog", "Blog listing"],
  // Nabídka
  ["/nabidka", "Nabídka katalog"],
  ["/nabidka/porovnani", "Porovnání"],
  // Inzerce
  ["/inzerce", "Inzerce landing"],
  ["/inzerce/katalog", "Inzerce katalog"],
  ["/inzerce/registrace", "Inzerce registrace"],
  ["/inzerce/pridat", "Přidat inzerát"],
  // Eshop
  ["/shop/katalog", "Shop katalog"],
  ["/shop/kosik", "Shop košík"],
  // Díly
  ["/dily", "Díly landing"],
  ["/dily/katalog", "Díly katalog"],
  ["/dily/kosik", "Díly košík"],
  ["/dily/objednavka", "Díly objednávka"],
  // Marketplace
  ["/marketplace", "Marketplace landing"],
  ["/marketplace/apply", "Marketplace apply"],
  ["/marketplace/dealer", "Marketplace dealer"],
  ["/marketplace/investor", "Marketplace investor"],
  // Auth
  ["/login", "Login"],
  ["/registrace", "Registrace"],
  ["/zapomenute-heslo", "Zapomenuté heslo"],
  // Prezentace (nové)
  ["/prezentace", "Prezentace"],
  // Právní
  ["/obchodni-podminky", "VOP"],
  ["/ochrana-osobnich-udaju", "GDPR"],
  ["/reklamacni-rad", "Reklamační řád"],
  ["/zasady-cookies", "Cookies"],
];

test.describe("FINAL — carmakler.cz full web", () => {
  for (const [path, label] of ALL_PAGES) {
    test(`${label} (${path})`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      for (const bp of BPS) {
        const r = await testPage(page, path, bp);
        REPORT.push(r);
        const errNote = r.jsErrors.length > 0 ? ` [${r.jsErrors.length} JS-ERR]` : "";
        console.log(`${icon(r.status)} ${path} @ ${bp}px — ${r.notes}${errNote}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/FINAL-FAIL-${path.replace(/\//g, "-")}-${bp}.png` }).catch(() => {});
          if (r.jsErrors.length > 0) {
            for (const e of r.jsErrors) console.log(`    JS: ${e}`);
          }
        }
      }
      await ctx.close();
    });
  }
});

// ── Click-through navigation tests ───────────────────────────────────────────

test.describe("FINAL — Navigation click-through", () => {
  test("Blog: list → article detail", async ({ browser }) => {
    test.setTimeout(60000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/blog`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(800);

    const link = await page.$("a[href*='/blog/']");
    if (link) {
      const href = await link.getAttribute("href") || "";
      const articleUrl = href.startsWith("http") ? href : `${BASE}${href}`;
      const resp = await page.goto(articleUrl, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
      const chars = await page.evaluate(() => document.body.innerText.trim().length);
      const status = resp?.status() ?? 0;
      console.log(`Blog article click: ${href} → HTTP ${status}, ${chars} chars`);
      console.log(status === 200 && chars > 100 ? "✅ Blog article OK" : "❌ Blog article FAIL");
    } else {
      console.log("ℹ️ No blog articles found (empty blog)");
    }
    await ctx.close();
  });

  test("Nabídka: catalog → vehicle detail", async ({ browser }) => {
    test.setTimeout(60000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/nabidka`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(800);

    // Find a vehicle link (not the base /nabidka or /porovnani)
    const links = await page.$$("a[href^='/nabidka/']");
    let vehicleLink: string | null = null;
    for (const link of links) {
      const href = await link.getAttribute("href") || "";
      if (!href.endsWith("/nabidka") && !href.includes("porovnani")) {
        vehicleLink = href;
        break;
      }
    }

    if (vehicleLink) {
      const resp = await page.goto(`${BASE}${vehicleLink}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
      const chars = await page.evaluate(() => document.body.innerText.trim().length);
      const status = resp?.status() ?? 0;
      console.log(`Vehicle detail click: ${vehicleLink} → HTTP ${status}, ${chars} chars`);
      console.log(status === 200 && chars > 100 ? "✅ Vehicle detail OK" : "❌ Vehicle detail FAIL");
    } else {
      console.log("ℹ️ No vehicle links found (empty catalog)");
    }
    await ctx.close();
  });

  test("Login form: fields interactive", async ({ browser }) => {
    test.setTimeout(60000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(500);

    const emailInput = await page.$("#email");
    const passwordInput = await page.$("#password");
    const submitBtn = await page.$('button[type="submit"]');

    if (emailInput && passwordInput && submitBtn) {
      await emailInput.fill("test@example.cz");
      await passwordInput.fill("testpassword");
      const emailVal = await emailInput.inputValue();
      const passVal = await passwordInput.inputValue();
      console.log(`✅ Login form: email="${emailVal}", pass="${passVal.replace(/./g, "*")}"`);
      console.log(`✅ Submit button found: ${await submitBtn.textContent()}`);
    } else {
      console.log(`⚠️ Login form elements: email=${!!emailInput}, pass=${!!passwordInput}, btn=${!!submitBtn}`);
    }
    await ctx.close();
  });

  test("Prezentace page: loads and has content", async ({ browser }) => {
    test.setTimeout(60000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const jsErrors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") jsErrors.push(m.text().slice(0, 150)); });

    await page.setViewportSize({ width: 1280, height: 900 });
    const resp = await page.goto(`${BASE}/prezentace`, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => null);
    await page.waitForTimeout(800);

    const status = resp?.status() ?? 0;
    const url = page.url();
    const chars = await page.evaluate(() => document.body.innerText.trim().length);
    const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent || "");
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);

    console.log(`/prezentace: HTTP ${status}, url=${url}, chars=${chars}, h1="${h1}"`);
    console.log(`  overflow: ${sw > cw + 2} (${sw}px / ${cw}px)`);
    if (jsErrors.length > 0) {
      console.log(`  JS errors: ${jsErrors.length}`);
      for (const e of jsErrors) console.log(`    ${e}`);
    }
    if (status === 200 && chars > 50) {
      console.log("✅ /prezentace OK");
    } else if (url.includes("/login")) {
      console.log("🔒 /prezentace → requires auth");
    } else if (status === 404) {
      console.log("🔲 /prezentace → 404 (not yet deployed?)");
    } else {
      console.log(`❌ /prezentace FAIL`);
    }
    await ctx.close();
  });
});
