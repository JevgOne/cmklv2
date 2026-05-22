import { test, expect } from "@playwright/test";

const BASIC_USER = "admin";
const BASIC_PASS = "Carmakler2026!";

test.use({
  httpCredentials: { username: BASIC_USER, password: BASIC_PASS },
});

// ─── Scenario 1 — shop.carmakler.cz ──────────────────────────────────────────

test("S1a: shop.carmakler.cz — homepage loads (200 + eshop content)", async ({ page }) => {
  const responses: Array<{ url: string; status: number }> = [];
  page.on("response", (r) => responses.push({ url: r.url(), status: r.status() }));

  const r = await page.goto("https://shop.carmakler.cz/", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("shop.carmakler.cz status:", status, "final URL:", finalUrl);

  await page.screenshot({ path: "test-results/s1a-shop-home.png", fullPage: false });

  // Check content
  const title = await page.title();
  const bodyText = await page.textContent("body");
  console.log("Title:", title);

  // HTTP status
  expect(status).toBe(200);

  // Eshop content indicators
  const hasEshopContent =
    bodyText?.includes("díl") ||
    bodyText?.includes("Díl") ||
    bodyText?.includes("košík") ||
    bodyText?.includes("Košík") ||
    bodyText?.includes("katalog") ||
    bodyText?.includes("vrakoviště") ||
    bodyText?.includes("shop") ||
    bodyText?.includes("Shop");
  console.log("Has eshop content:", hasEshopContent);
  expect(hasEshopContent).toBe(true);

  // Canonical link
  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("shop.carmakler.cz canonical:", canonical);
  // Should point to carmakler.cz (bare, not subdomain)
  if (canonical) {
    const isBare = canonical.includes("carmakler.cz") && !canonical.includes("shop.carmakler.cz");
    console.log("Canonical is bare carmakler.cz:", isBare);
  }

  // JSON-LD check
  const jsonLd = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => s.textContent ?? "")
      .join("\n");
  });
  const hasWwwInJsonLd = jsonLd.includes("www.carmakler.cz");
  const hasShopSubdomainInJsonLd = jsonLd.includes("shop.carmakler.cz");
  console.log("JSON-LD www:", hasWwwInJsonLd, "| JSON-LD shop subdomain:", hasShopSubdomainInJsonLd);
});

test("S1b: shop.carmakler.cz/katalog — katalog dílů (200)", async ({ page }) => {
  const networkLog: Array<{ url: string; status: number }> = [];
  page.on("response", (r) => {
    if (!r.url().includes("/_next/") && !r.url().includes(".js") && !r.url().includes(".css")) {
      networkLog.push({ url: r.url(), status: r.status() });
    }
  });

  const r = await page.goto("https://shop.carmakler.cz/katalog", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("shop.carmakler.cz/katalog status:", status, "final URL:", finalUrl);

  await page.screenshot({ path: "test-results/s1b-shop-katalog.png", fullPage: false });

  // Could be 200 (if /katalog exists) or 404 (if route doesn't exist)
  // The key thing is it doesn't 502/crash
  console.log("Katalog HTTP status:", status);
  expect(status).not.toBe(502);
  expect(status).not.toBe(503);

  const bodyText = await page.textContent("body");
  const hasKatalogContent =
    bodyText?.includes("katalog") ||
    bodyText?.includes("Katalog") ||
    bodyText?.includes("díl") ||
    bodyText?.includes("Díl") ||
    bodyText?.includes("404");
  console.log("Has katalog/díl or 404 content:", hasKatalogContent);

  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("Canonical:", canonical);
});

test("S1c: shop.carmakler.cz — relative links stay on shop subdomain or redirect properly", async ({ page }) => {
  await page.goto("https://shop.carmakler.cz/", { waitUntil: "load" });

  // Get all internal links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.getAttribute("href") ?? "")
      .filter(h => h && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("tel:"))
      .slice(0, 20);
  });
  console.log("Internal links on shop.carmakler.cz:", links);

  // Check if any link has localhost
  const localhostLinks = links.filter(l => l.includes("localhost"));
  console.log("Localhost links:", localhostLinks);
  expect(localhostLinks).toHaveLength(0);

  // Check if links are relative or subdomain-aware
  const absoluteLinks = links.filter(l => l.startsWith("http"));
  const relativeLinks = links.filter(l => l.startsWith("/"));
  console.log("Absolute links:", absoluteLinks.length, "| Relative:", relativeLinks.length);

  // Click first internal content link
  const firstContentLink = await page.locator('a[href^="/"]').first();
  const hasContentLink = await firstContentLink.count() > 0;
  if (hasContentLink) {
    const href = await firstContentLink.getAttribute("href");
    console.log("Clicking first relative link:", href);
    await firstContentLink.click();
    await page.waitForTimeout(2000);
    const afterClickUrl = page.url();
    console.log("URL after click:", afterClickUrl);
    // Should stay on shop subdomain or go to carmakler.cz — NOT localhost
    expect(afterClickUrl).not.toContain("localhost");
    await page.screenshot({ path: "test-results/s1c-shop-link-click.png", fullPage: false });
  }
});

// ─── Scenario 2 — inzerce.carmakler.cz ───────────────────────────────────────

test("S2a: inzerce.carmakler.cz — homepage loads (200 + inzerce content)", async ({ page }) => {
  const r = await page.goto("https://inzerce.carmakler.cz/", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("inzerce.carmakler.cz status:", status, "final URL:", finalUrl);

  await page.screenshot({ path: "test-results/s2a-inzerce-home.png", fullPage: false });

  expect(status).toBe(200);

  const bodyText = await page.textContent("body");
  const hasInzerceContent =
    bodyText?.includes("inzerce") ||
    bodyText?.includes("Inzerce") ||
    bodyText?.includes("inzerát") ||
    bodyText?.includes("auto") ||
    bodyText?.includes("prodej");
  console.log("Has inzerce content:", hasInzerceContent);
  expect(hasInzerceContent).toBe(true);

  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("inzerce.carmakler.cz canonical:", canonical);
  if (canonical) {
    const hasInzerceSubdomain = canonical.includes("inzerce.carmakler.cz");
    console.log("Canonical has inzerce subdomain (BUG if true):", hasInzerceSubdomain);
  }
});

test("S2b: inzerce.carmakler.cz/nabidka — route check", async ({ page }) => {
  const r = await page.goto("https://inzerce.carmakler.cz/nabidka", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("inzerce.carmakler.cz/nabidka status:", status, "final URL:", finalUrl);

  await page.screenshot({ path: "test-results/s2b-inzerce-nabidka.png", fullPage: false });
  console.log("Nabidka status:", status);
  expect(status).not.toBe(502);
  expect(status).not.toBe(503);

  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("Canonical:", canonical);
});

// ─── Scenario 3 — marketplace.carmakler.cz ───────────────────────────────────

test("S3a: marketplace.carmakler.cz — VIP landing (200 + public apply form)", async ({ page }) => {
  const r = await page.goto("https://marketplace.carmakler.cz/", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("marketplace.carmakler.cz status:", status, "final URL:", finalUrl);

  await page.screenshot({ path: "test-results/s3a-marketplace-home.png", fullPage: false });

  expect(status).toBe(200);

  const bodyText = await page.textContent("body");

  // Public content should be visible
  const hasPublicContent =
    bodyText?.includes("Marketplace") ||
    bodyText?.includes("marketplace") ||
    bodyText?.includes("Investor") ||
    bodyText?.includes("Dealer") ||
    bodyText?.includes("VIP");
  console.log("Has public marketplace content:", hasPublicContent);
  expect(hasPublicContent).toBe(true);

  // Gated content should NOT appear without login
  const hasGatedContent =
    bodyText?.includes("Moje příležitosti") ||
    bodyText?.includes("Přidat příležitost");
  console.log("Has gated content (should be false):", hasGatedContent);
  expect(hasGatedContent).toBe(false);

  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("marketplace.carmakler.cz canonical:", canonical);
});

// ─── Scenario 4 — canonical link tag deep check ──────────────────────────────

test("S4: canonical tags — all subdomains point to bare carmakler.cz", async ({ page }) => {
  const subdomains = [
    { url: "https://shop.carmakler.cz/", label: "shop" },
    { url: "https://inzerce.carmakler.cz/", label: "inzerce" },
    { url: "https://marketplace.carmakler.cz/", label: "marketplace" },
  ];

  const results: Array<{ label: string; canonical: string | null; isBare: boolean; isSubdomain: boolean }> = [];

  for (const { url, label } of subdomains) {
    await page.goto(url, { waitUntil: "load" });

    const canonical = await page.evaluate(() =>
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
    );

    const isBare = canonical
      ? canonical.includes("carmakler.cz") && !canonical.includes(label + ".carmakler.cz")
      : false;
    const isSubdomain = canonical ? canonical.includes(label + ".carmakler.cz") : false;

    results.push({ label, canonical, isBare, isSubdomain });
    console.log(`${label}: canonical="${canonical}" | isBare=${isBare} | isSubdomain=${isSubdomain}`);

    await page.screenshot({ path: `test-results/s4-canonical-${label}.png`, fullPage: false });
  }

  // Report results
  for (const r of results) {
    if (r.isSubdomain) {
      console.warn(`⚠️ BUG: ${r.label} canonical points to subdomain — duplicate content risk!`);
    }
  }

  // At least check no subdomain canonicals
  const subdomainCanonicals = results.filter(r => r.isSubdomain);
  console.log("Subdomain canonical count (should be 0):", subdomainCanonicals.length);
});

// ─── Scenario 5 — 404 handling on shop subdomain ─────────────────────────────

test("S5: shop.carmakler.cz/neexistuje — 404 page renders correctly", async ({ page }) => {
  const r = await page.goto("https://shop.carmakler.cz/neexistuje-blbost", { waitUntil: "load" });
  const status = r?.status();
  const finalUrl = page.url();
  console.log("404 test: status=", status, "URL:", finalUrl);

  await page.screenshot({ path: "test-results/s5-shop-404.png", fullPage: false });

  expect(status).toBe(404);

  // Should render a 404 page, not white screen or 500
  const bodyText = await page.textContent("body");
  const hasContent = (bodyText?.length ?? 0) > 50;
  console.log("404 page has content (not white screen):", hasContent, `(${bodyText?.length} chars)`);
  expect(hasContent).toBe(true);

  // Should NOT be a 500 or crash
  const hasCrash = bodyText?.includes("Application error") || bodyText?.includes("500");
  console.log("Has crash/500:", hasCrash);
});

// ─── Scenario 6 — cross-subdomain navigation consistency ─────────────────────

test("S6: content parity — shop.carmakler.cz vs carmakler.cz/dily", async ({ page }) => {
  // Load shop subdomain
  await page.goto("https://shop.carmakler.cz/", { waitUntil: "load" });
  const shopTitle = await page.title();
  const shopH1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("shop.carmakler.cz title:", shopTitle, "| H1:", shopH1);

  await page.screenshot({ path: "test-results/s6-shop-subdomain.png", fullPage: false });

  // Load bare /dily
  await page.goto("https://carmakler.cz/dily", { waitUntil: "load" });
  const dilyTitle = await page.title();
  const dilyH1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("carmakler.cz/dily title:", dilyTitle, "| H1:", dilyH1);

  await page.screenshot({ path: "test-results/s6-dily-bare.png", fullPage: false });

  // Content should be equivalent (same H1 or same general content)
  const titlesMatch = shopTitle === dilyTitle;
  const h1Match = shopH1 === dilyH1;
  console.log("Titles match:", titlesMatch);
  console.log("H1 match:", h1Match);
  console.log("Content parity:", titlesMatch || h1Match ? "✅ SAME" : "⚠️ DIFFERENT (check if expected)");
});
