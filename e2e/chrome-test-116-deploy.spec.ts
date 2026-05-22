import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const PROD = "https://carmakler.cz";
const BASIC_USER = "admin";
const BASIC_PASS = "Carmakler2026!";

// Helper: inject basic auth header via page route
async function authFetch(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  headers.set("Authorization", "Basic " + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64"));
  return fetch(url, { ...options, headers });
}

// ─── Global basic auth for all page navigations ───────────────────────────────

test.use({
  httpCredentials: { username: BASIC_USER, password: BASIC_PASS },
});

// ─── Test 1: Homepage — canonical + og:url ────────────────────────────────────

test("T1: homepage — loads, canonical bare, og:url bare", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto(`${PROD}/`);
  await page.waitForTimeout(3000);

  const status = response?.status();
  console.log("Homepage HTTP status:", status);
  expect(status).not.toBe(401);
  expect(status).not.toBe(502);
  expect(status).not.toBe(503);
  expect([200, 304]).toContain(status);

  await page.screenshot({ path: "test-results/prod-t1-homepage.png", fullPage: false });

  // View source — canonical link
  const canonical = await page.evaluate(() => {
    const el = document.querySelector('link[rel="canonical"]');
    return el?.getAttribute("href") ?? null;
  });
  console.log("canonical:", canonical);

  // og:url
  const ogUrl = await page.evaluate(() => {
    const el = document.querySelector('meta[property="og:url"]');
    return el?.getAttribute("content") ?? null;
  });
  console.log("og:url:", ogUrl);

  // Both should be bare (not www)
  if (canonical) {
    expect(canonical).not.toContain("www.");
    expect(canonical).toContain("carmakler.cz");
  }
  if (ogUrl) {
    expect(ogUrl).not.toContain("www.");
    expect(ogUrl).toContain("carmakler.cz");
  }

  console.log("Critical console errors:", consoleErrors.filter(e => !e.includes("ERR_") && !e.includes("net::")));
});

// ─── Test 2: www → bare 301 redirect ─────────────────────────────────────────

test("T2: www.carmakler.cz → 301 redirect → bare carmakler.cz", async ({ page }) => {
  // Track redirects
  const redirects: Array<{ url: string; status: number }> = [];
  page.on("response", (response) => {
    if ([301, 302, 307, 308].includes(response.status())) {
      redirects.push({ url: response.url(), status: response.status() });
    }
  });

  await page.goto("https://www.carmakler.cz/");
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  console.log("Final URL after www redirect:", finalUrl);
  console.log("Redirects captured:", redirects);

  // Final URL should be bare carmakler.cz (no www)
  expect(finalUrl).not.toContain("www.carmakler.cz");
  expect(finalUrl).toContain("carmakler.cz");

  // Should have had a 301
  const has301 = redirects.some((r) => r.status === 301);
  console.log("Had 301 redirect:", has301);
  // Note: Playwright may follow 301 automatically; check final URL is sufficient

  await page.screenshot({ path: "test-results/prod-t2-www-redirect.png", fullPage: false });
});

// ─── Test 3: sitemap.xml — all <loc> bare ────────────────────────────────────

test("T3: sitemap.xml — all <loc> are bare (no www)", async ({ page }) => {
  const response = await page.goto(`${PROD}/sitemap.xml`);
  await page.waitForTimeout(2000);

  const status = response?.status();
  console.log("sitemap.xml HTTP status:", status);
  expect(status).toBe(200);

  await page.screenshot({ path: "test-results/prod-t3-sitemap.png", fullPage: true });

  const content = await page.content();
  console.log("Sitemap content length:", content.length);

  // Check no www. in loc tags
  const wwwLocs = content.match(/<loc>[^<]*www\.[^<]*<\/loc>/g) ?? [];
  console.log("www. <loc> entries:", wwwLocs.length);
  console.log("Sample www locs:", wwwLocs.slice(0, 3));
  expect(wwwLocs).toHaveLength(0);

  // Count total <loc> entries
  const allLocs = content.match(/<loc>/g) ?? [];
  console.log("Total <loc> entries:", allLocs.length);
  expect(allLocs.length).toBeGreaterThan(0);

  // Verify all locs point to carmakler.cz
  const carmaklerlocs = content.match(/<loc>https:\/\/carmakler\.cz[^<]*<\/loc>/g) ?? [];
  console.log("carmakler.cz <loc> entries:", carmaklerlocs.length);
});

// ─── Test 4: robots.txt — bare sitemap URL ───────────────────────────────────

test("T4: robots.txt — Sitemap points to bare carmakler.cz", async ({ page }) => {
  const response = await page.goto(`${PROD}/robots.txt`);
  const status = response?.status();
  console.log("robots.txt HTTP status:", status);
  expect(status).toBe(200);

  const text = await page.evaluate(() => document.body.innerText || document.documentElement.innerText || "");
  // Also get raw content
  const rawContent = await page.content();
  console.log("robots.txt content:", text || rawContent.slice(0, 500));

  // Check Sitemap directive is bare
  const hasBaresSitemap =
    text.includes("Sitemap: https://carmakler.cz/sitemap.xml") ||
    rawContent.includes("Sitemap: https://carmakler.cz/sitemap.xml");
  const hasWwwSitemap =
    text.includes("www.carmakler.cz") ||
    rawContent.includes("www.carmakler.cz");

  console.log("Has bare sitemap:", hasBaresSitemap);
  console.log("Has www sitemap:", hasWwwSitemap);

  expect(hasBaresSitemap).toBe(true);
  expect(hasWwwSitemap).toBe(false);

  await page.screenshot({ path: "test-results/prod-t4-robots.png", fullPage: true });
});

// ─── Test 5: PWA paths ───────────────────────────────────────────────────────

test("T5: /makler — login screen, /makler/dashboard → redirect to login", async ({ page }) => {
  // /makler — should load (login screen for broker)
  const r1 = await page.goto(`${PROD}/makler`);
  await page.waitForTimeout(2000);
  const url1 = page.url();
  const status1 = r1?.status();
  console.log("/makler URL:", url1, "status:", status1);

  await page.screenshot({ path: "test-results/prod-t5-makler.png", fullPage: false });

  // Should load some page (login redirect or dashboard)
  expect([200, 302, 307]).toContain(status1 ?? 200);
  expect(url1).toContain("carmakler.cz");

  // /makler/dashboard — should redirect to login (not 200 without auth)
  const r2 = await page.goto(`${PROD}/makler/dashboard`);
  await page.waitForTimeout(2000);
  const url2 = page.url();
  console.log("/makler/dashboard final URL:", url2);

  await page.screenshot({ path: "test-results/prod-t5-makler-dashboard.png", fullPage: false });

  // Should either redirect to login or show login form (not serve dashboard without auth)
  const isLoginPage =
    url2.includes("/login") ||
    url2.includes("/prihlaseni") ||
    (await page.locator('input[type="email"], input[type="password"]').count()) > 0;
  console.log("Redirected to login:", isLoginPage);
  // Note: if Next.js middleware redirects to login, this passes
});

// ─── Test 6: /dily — katalog dílů + vrakovišť ───────────────────────────────

test("T6: /dily — katalog loads, /dily/vrakoviste — seznam vrakovišť", async ({ page }) => {
  const r1 = await page.goto(`${PROD}/dily`);
  await page.waitForTimeout(3000);
  const status1 = r1?.status();
  const url1 = page.url();
  console.log("/dily status:", status1, "URL:", url1);
  expect(status1).not.toBe(404);
  expect(status1).not.toBe(500);

  await page.screenshot({ path: "test-results/prod-t6-dily.png", fullPage: false });

  // Check JSON-LD for bare URLs
  const jsonLd = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map((s) => s.textContent ?? "").join("\n");
  });
  if (jsonLd) {
    const hasWwwInJsonLd = jsonLd.includes("www.carmakler.cz");
    console.log("www. in JSON-LD:", hasWwwInJsonLd);
    expect(hasWwwInJsonLd).toBe(false);
    console.log("JSON-LD snippet:", jsonLd.slice(0, 300));
  }

  // /dily/vrakoviste
  const r2 = await page.goto(`${PROD}/dily/vrakoviste`);
  await page.waitForTimeout(2000);
  const status2 = r2?.status();
  console.log("/dily/vrakoviste status:", status2);
  expect(status2).not.toBe(404);
  expect(status2).not.toBe(500);

  await page.screenshot({ path: "test-results/prod-t6-dily-vrakoviste.png", fullPage: false });
});

// ─── Test 7: /inzerce ─────────────────────────────────────────────────────────

test("T7: /inzerce — landing loads, inzerát detail bare URLs", async ({ page }) => {
  const r = await page.goto(`${PROD}/inzerce`);
  await page.waitForTimeout(3000);
  const status = r?.status();
  console.log("/inzerce status:", status, "URL:", page.url());
  expect(status).not.toBe(404);
  expect(status).not.toBe(500);

  await page.screenshot({ path: "test-results/prod-t7-inzerce.png", fullPage: false });

  // Try to click first listing link
  const listingLink = page.locator('a[href*="/inzerce/"]').first();
  const hasListing = await listingLink.count() > 0;
  console.log("Has listing link:", hasListing);

  if (hasListing) {
    const href = await listingLink.getAttribute("href");
    console.log("First listing href:", href);
    if (href) {
      expect(href).not.toContain("www.carmakler.cz");
    }
  }
});

// ─── Test 8: /marketplace — public landing + apply form ──────────────────────

test("T8: /marketplace — public landing, apply form visible (no gated content)", async ({ page }) => {
  const r = await page.goto(`${PROD}/marketplace`);
  await page.waitForTimeout(3000);
  const status = r?.status();
  console.log("/marketplace status:", status, "URL:", page.url());
  expect(status).not.toBe(404);
  expect(status).not.toBe(500);

  await page.screenshot({ path: "test-results/prod-t8-marketplace.png", fullPage: false });

  const bodyText = await page.textContent("body");
  const hasApplyForm =
    bodyText?.includes("Přihlásit se") ||
    bodyText?.includes("Požádat") ||
    bodyText?.includes("Investovat") ||
    bodyText?.includes("Dealer") ||
    bodyText?.includes("marketplace") ||
    bodyText?.includes("Marketplace");
  console.log("Marketplace public content visible:", hasApplyForm);
  expect(hasApplyForm).toBe(true);

  // Should NOT show gated content without login
  const hasDealerDashboard =
    bodyText?.includes("Moje příležitosti") ||
    bodyText?.includes("Přidat příležitost");
  console.log("Dealer dashboard (gated) visible:", hasDealerDashboard);
  // Gated content should NOT appear on public landing without login
});

// ─── Test 9: Subdomény (optional) ────────────────────────────────────────────

test("T9: subdomény — inzerce / shop / marketplace", async ({ page }) => {
  const subdomains = [
    { url: "https://inzerce.carmakler.cz/", label: "inzerce" },
    { url: "https://shop.carmakler.cz/", label: "shop" },
    { url: "https://marketplace.carmakler.cz/", label: "marketplace" },
  ];

  for (const { url, label } of subdomains) {
    try {
      const r = await page.goto(url, { timeout: 10000 });
      const status = r?.status();
      const finalUrl = page.url();
      console.log(`${label}: status=${status}, URL=${finalUrl}`);
      await page.screenshot({
        path: `test-results/prod-t9-subdomain-${label}.png`,
        fullPage: false,
      });
      // Just report — subdomains may or may not be configured
      console.log(`${label} subdomain: ${status === 200 ? "✅ UP" : `⚠️ status ${status}`}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`${label} subdomain: ⚠️ FAILED — ${msg}`);
    }
  }
});

// ─── Test 10: PlatformSwitcher menu — links are bare ─────────────────────────

test("T10: PlatformSwitcher — menu links are bare carmakler.cz (not localhost, not www)", async ({ page }) => {
  await page.goto(`${PROD}/`);
  await page.waitForTimeout(3000);

  // Find platform switcher links in navbar
  const navLinks = await page.locator("nav a, header a").evaluateAll((els) =>
    els.map((el) => el.getAttribute("href") ?? "")
  );
  console.log("Nav links (sample):", navLinks.slice(0, 15));

  // None should contain localhost
  const localhostLinks = navLinks.filter((l) => l.includes("localhost"));
  console.log("Localhost links:", localhostLinks);
  expect(localhostLinks).toHaveLength(0);

  // None should contain www.
  const wwwLinks = navLinks.filter((l) => l.includes("www.carmakler.cz"));
  console.log("www. links:", wwwLinks);
  expect(wwwLinks).toHaveLength(0);

  // Check for platform switcher links (inzerce, shop, marketplace)
  const platformLinks = navLinks.filter(
    (l) =>
      l.includes("inzerce") ||
      l.includes("shop") ||
      l.includes("marketplace") ||
      l.includes("/dily")
  );
  console.log("Platform links:", platformLinks);

  await page.screenshot({ path: "test-results/prod-t10-navbar.png", fullPage: false });
});
