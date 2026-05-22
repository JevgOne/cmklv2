/**
 * TEST-NEW-035: Full click-through test na carmakler.cz
 * Real user simulation: load, CSS, navigation, forms, console errors, responsive
 */
import { test, expect, Page, BrowserContext } from "@playwright/test";

const BASE = "https://carmakler.cz";

type PageResult = {
  num: number;
  url: string;
  bp: number;
  status: "PASS" | "FAIL" | "REDIRECT" | "ERROR" | "STUB";
  httpCode: number;
  hasContent: boolean;
  cssOk: boolean;
  overflowOk: boolean;
  consoleErrors: string[];
  notes: string[];
};

const results: PageResult[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

function captureConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter known non-critical 3rd party noise
      if (
        text.includes("favicon") ||
        text.includes("ERR_BLOCKED_BY_CLIENT") ||
        text.includes("gtag") ||
        text.includes("analytics")
      )
        return;
      errors.push(text.slice(0, 120));
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`JS: ${err.message.slice(0, 120)}`);
  });
  return () => errors;
}

async function checkPage(
  page: Page,
  num: number,
  path: string,
  bp: number,
  getErrors: () => string[]
): Promise<PageResult> {
  const result: PageResult = {
    num,
    url: path,
    bp,
    status: "ERROR",
    httpCode: 0,
    hasContent: false,
    cssOk: false,
    overflowOk: true,
    consoleErrors: [],
    notes: [],
  };

  try {
    await page.setViewportSize({ width: bp, height: bp <= 375 ? 812 : bp <= 768 ? 1024 : 900 });
    const resp = await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    result.httpCode = resp?.status() ?? 0;
    const finalUrl = page.url();

    if (finalUrl.includes("/login") || (finalUrl.includes("/prihlaseni") && !path.includes("prihlaseni"))) {
      result.status = "REDIRECT";
      result.notes.push(`→ ${finalUrl}`);
      return result;
    }

    if (result.httpCode === 404) {
      result.status = "STUB";
      result.notes.push("HTTP 404");
      return result;
    }
    if (result.httpCode >= 500) {
      result.status = "FAIL";
      result.notes.push(`HTTP ${result.httpCode}`);
      return result;
    }

    // Content check: body has visible text
    const bodyText = await page.evaluate(() => document.body.innerText.trim().length);
    result.hasContent = bodyText > 50;
    if (!result.hasContent) result.notes.push("BLANK/LOW CONTENT");

    // CSS check: first h1/h2 has non-default font-size (CSS loaded)
    const cssRendered = await page.evaluate(() => {
      const heading = document.querySelector("h1, h2, h3");
      if (!heading) return true; // no heading, can't check
      const fs = parseFloat(window.getComputedStyle(heading).fontSize);
      return fs > 12; // default browser h1 is 32px, if CSS broken might show 16px default
    });
    result.cssOk = cssRendered;
    if (!cssRendered) result.notes.push("CSS MAY NOT BE RENDERED");

    // Overflow check
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    result.overflowOk = !overflow;
    if (overflow) {
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      result.notes.push(`H-OVERFLOW ${sw}px`);
    }

    // Console errors
    result.consoleErrors = getErrors();

    result.status =
      result.hasContent && result.cssOk && result.overflowOk ? "PASS" : "FAIL";
  } catch (e) {
    result.status = "ERROR";
    result.notes.push(e instanceof Error ? e.message.slice(0, 100) : String(e).slice(0, 100));
  }

  return result;
}

function icon(s: string) {
  return s === "PASS" ? "✅" : s === "REDIRECT" ? "🔒" : s === "STUB" ? "🔲" : s === "FAIL" ? "❌" : "⚠️";
}

// ── Tests ────────────────────────────────────────────────────────────────────

const MAIN_PAGES: [number, string][] = [
  [1, "/"],
  [2, "/o-nas"],
  [3, "/jak-to-funguje"],
  [4, "/kontakt"],
  [5, "/cenik"],
  [6, "/chci-prodat"],
  [7, "/jak-prodat-auto"],
  [8, "/kolik-stoji-moje-auto"],
  [9, "/recenze"],
  [10, "/kariera"],
  [11, "/sluzby"],
  [12, "/sluzby/proverka"],
  [13, "/sluzby/financovani"],
  [14, "/sluzby/pojisteni"],
  [15, "/makleri"],
  [16, "/obchodni-podminky"],
  [17, "/ochrana-osobnich-udaju"],
  [18, "/reklamacni-rad"],
  [19, "/zasady-cookies"],
];

const BLOG_PAGES: [number, string][] = [
  [20, "/blog"],
];

const NABIDKA_PAGES: [number, string][] = [
  [25, "/nabidka"],
  [26, "/nabidka/porovnani"],
];

const INZERCE_PAGES: [number, string][] = [
  [30, "/inzerce"],
  [31, "/inzerce/katalog"],
  [32, "/inzerce/registrace"],
  [33, "/inzerce/pridat"],
];

const ESHOP_PAGES: [number, string][] = [
  [40, "/shop/katalog"],
  [41, "/shop/kosik"],
  [42, "/dily"],
  [43, "/dily/katalog"],
  [44, "/dily/kosik"],
  [45, "/dily/objednavka"],
];

const MARKETPLACE_PAGES: [number, string][] = [
  [50, "/marketplace"],
  [51, "/marketplace/apply"],
  [52, "/marketplace/dealer"],
  [53, "/marketplace/investor"],
];

const AUTH_PAGES: [number, string][] = [
  [60, "/prihlaseni"],
  [61, "/registrace"],
  [62, "/zapomenute-heslo"],
];

const ADMIN_PAGES: [number, string][] = [
  [70, "/admin/dashboard"],
  [71, "/admin/vehicles"],
  [72, "/admin/brokers"],
  [73, "/admin/payments"],
  [74, "/admin/orders"],
  [75, "/admin/returns"],
  [76, "/admin/blog"],
  [77, "/admin/reviews"],
  [78, "/admin/leads"],
  [79, "/admin/users"],
  [80, "/admin/notifications"],
  [81, "/admin/profile"],
];

const PWA_PAGES: [number, string][] = [
  [90, "/makler/dashboard"],
  [91, "/makler/vehicles"],
  [92, "/makler/contracts"],
  [93, "/makler/contacts"],
  [94, "/makler/leads"],
  [95, "/makler/messages"],
  [96, "/makler/commissions"],
  [97, "/makler/financing-calculator"],
  [98, "/makler/leaderboard"],
  [99, "/makler/stats"],
  [100, "/makler/profile"],
  [101, "/makler/settings"],
  [102, "/makler/blog"],
];

// Run a group of pages at all 3 breakpoints
async function runGroup(
  browser: Parameters<typeof test>[1] extends infer T ? any : never,
  pages: [number, string][],
  label: string,
  storageFile?: string
) {
  // no-op — groups are tested in individual test blocks below
}

// ── MAIN WEB ─────────────────────────────────────────────────────────────────
test.describe("Hlavní web", () => {
  for (const [num, path] of MAIN_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        const issues = [
          !r.hasContent ? "BLANK" : "",
          !r.cssOk ? "NO-CSS" : "",
          !r.overflowOk ? "OVERFLOW" : "",
          r.consoleErrors.length > 0 ? `${r.consoleErrors.length} JS ERR` : "",
        ].filter(Boolean).join(", ");
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}${issues ? ` [${issues}]` : ""}`);
        getErrors(); // clear errors between BPs
      }

      await ctx.close();
    });
  }
});

// ── BLOG ─────────────────────────────────────────────────────────────────────
test.describe("Blog", () => {
  test("#20 /blog + article navigation", async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const getErrors = captureConsoleErrors(page);

    for (const bp of [375, 768, 1280] as const) {
      const r = await checkPage(page, 20, "/blog", bp, getErrors);
      results.push(r);
      console.log(`${icon(r.status)} #20 /blog @ ${bp}px — ${r.notes.join("; ") || "OK"}`);

      // At 1280 also click first article
      if (bp === 1280 && r.status === "PASS") {
        const firstLink = await page.$("a[href*='/blog/']");
        if (firstLink) {
          const href = await firstLink.getAttribute("href");
          if (href) {
            const artResp = await page.goto(`${BASE}${href.startsWith("/") ? href : "/" + href}`, {
              waitUntil: "domcontentloaded",
              timeout: 20000,
            }).catch(() => null);
            if (artResp) {
              const artContent = await page.evaluate(() => document.body.innerText.trim().length);
              console.log(`  → Blog article ${href}: HTTP ${artResp.status()}, content=${artContent}chars`);
              results.push({
                num: 21,
                url: href,
                bp: 1280,
                status: artResp.status() === 200 && artContent > 100 ? "PASS" : "FAIL",
                httpCode: artResp.status(),
                hasContent: artContent > 100,
                cssOk: true,
                overflowOk: true,
                consoleErrors: [],
                notes: [`article: ${href}`],
              });
            }
          }
        }
      }
    }
    await ctx.close();
  });
});

// ── NABÍDKA ─────────────────────────────────────────────────────────────────
test.describe("Nabídka vozidel", () => {
  for (const [num, path] of NABIDKA_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
      }
      await ctx.close();
    });
  }

  // Click through to vehicle detail
  test("#27 Vehicle detail click-through", async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/nabidka`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1000);

    const vehicleLink = await page.$("a[href*='/nabidka/']");
    if (vehicleLink) {
      const href = await vehicleLink.getAttribute("href");
      if (href && href !== "/nabidka" && href !== "/nabidka/porovnani") {
        const resp = await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => null);
        const content = await page.evaluate(() => document.body.innerText.trim().length);
        const status = resp?.status() ?? 0;
        console.log(`  → Vehicle detail ${href}: HTTP ${status}, content=${content}chars`);
        results.push({
          num: 27, url: href, bp: 1280,
          status: status === 200 && content > 100 ? "PASS" : "FAIL",
          httpCode: status, hasContent: content > 100, cssOk: true, overflowOk: true,
          consoleErrors: [], notes: [`vehicle detail: ${href}`],
        });
      }
    } else {
      console.log("  → No vehicle links found on /nabidka (empty catalog?)");
    }
    await ctx.close();
  });
});

// ── INZERCE ──────────────────────────────────────────────────────────────────
test.describe("Inzerce", () => {
  for (const [num, path] of INZERCE_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
      }
      await ctx.close();
    });
  }
});

// ── ESHOP ─────────────────────────────────────────────────────────────────────
test.describe("Eshop a Díly", () => {
  for (const [num, path] of ESHOP_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
      }
      await ctx.close();
    });
  }

  // Click through to part detail
  test("#46 Part detail click-through", async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dily/katalog`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1000);
    const partLink = await page.$("a[href*='/dily/']");
    if (partLink) {
      const href = await partLink.getAttribute("href");
      if (href && !href.endsWith("/dily/katalog") && !href.endsWith("/dily")) {
        const resp = await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
        const content = await page.evaluate(() => document.body.innerText.trim().length);
        const status = resp?.status() ?? 0;
        console.log(`  → Part detail ${href}: HTTP ${status}, content=${content}chars`);
        results.push({
          num: 46, url: href, bp: 1280,
          status: status === 200 && content > 50 ? "PASS" : status === 404 ? "STUB" : "FAIL",
          httpCode: status, hasContent: content > 50, cssOk: true, overflowOk: true,
          consoleErrors: [], notes: [`part detail: ${href}`],
        });
      }
    } else {
      console.log("  → No part links found on /dily/katalog (empty catalog?)");
    }
    await ctx.close();
  });
});

// ── MARKETPLACE ──────────────────────────────────────────────────────────────
test.describe("Marketplace", () => {
  for (const [num, path] of MARKETPLACE_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
      }
      await ctx.close();
    });
  }
});

// ── AUTH PAGES ────────────────────────────────────────────────────────────────
test.describe("Auth stránky", () => {
  for (const [num, path] of AUTH_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 768, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        // /prihlaseni redirects to /login — that's OK, check the /login page
        if (path === "/prihlaseni" && r.status === "REDIRECT") {
          const loginR = await checkPage(page, num, "/login", bp, getErrors);
          loginR.notes.push("via /prihlaseni redirect");
          results.push(loginR);
          console.log(`${icon(loginR.status)} #${num} /login (via /prihlaseni) @ ${bp}px — ${loginR.notes.join("; ") || "OK"}`);
        } else {
          results.push(r);
          console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
        }
      }

      // Form interaction test at 1280 for /prihlaseni → /login
      if (path === "/prihlaseni") {
        await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
        const emailInput = await page.$("#email");
        const passwordInput = await page.$("#password");
        if (emailInput && passwordInput) {
          await emailInput.fill("test@test.cz");
          await passwordInput.fill("test");
          const emailVal = await emailInput.inputValue();
          console.log(`  → Login form interactive: email=${emailVal} ✅`);
        } else {
          console.log(`  → Login form: inputs NOT FOUND ⚠️`);
        }
      }

      if (path === "/registrace") {
        await page.setViewportSize({ width: 1280, height: 900 });
        const inputs = await page.$$("input");
        console.log(`  → Registration form: ${inputs.length} input fields found`);
      }

      await ctx.close();
    });
  }
});

// ── ADMIN (with auth) ─────────────────────────────────────────────────────────
test.describe("Admin panel", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "admin@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    console.log(`[Admin login prod] final URL: ${url}`);
    await ctx.storageState({ path: "e2e/.auth-admin-prod2.json" });
    await ctx.close();
  });

  for (const [num, path] of ADMIN_PAGES) {
    test(`Admin #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(180000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-admin-prod2.json" });
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      // Only test 375px and 1280px for admin (faster)
      for (const bp of [375, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        const issues = !r.overflowOk ? ` [OVERFLOW ${r.notes.join(",")}]` : "";
        console.log(`${icon(r.status)} Admin #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}${issues}`);
      }
      await ctx.close();
    });
  }
});

// ── PWA MAKLÉŘ ────────────────────────────────────────────────────────────────
test.describe("PWA Makléř", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "jan.novak@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    console.log(`[Broker login prod] final URL: ${url}`);
    await ctx.storageState({ path: "e2e/.auth-broker-prod2.json" });
    await ctx.close();
  });

  for (const [num, path] of PWA_PAGES) {
    test(`PWA #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-broker-prod2.json" });
      const page = await ctx.newPage();
      const getErrors = captureConsoleErrors(page);

      for (const bp of [375, 1280] as const) {
        const r = await checkPage(page, num, path, bp, getErrors);
        results.push(r);
        console.log(`${icon(r.status)} PWA #${num} ${path} @ ${bp}px — ${r.notes.join("; ") || "OK"}`);
      }
      await ctx.close();
    });
  }
});
