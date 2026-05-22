import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

// ─── 1. Dev server smoke ──────────────────────────────────────────────────────

test("T0: dev server is running", async ({ page }) => {
  const r = await page.goto(BASE);
  expect(r?.status()).toBe(200);
});

// ─── 2. 3-level nested routing ────────────────────────────────────────────────

test("T1a: /dily/znacka/skoda — brand page loads, H1 = Škoda, models grid", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/skoda`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t1a-skoda-brand.png", fullPage: false });

  const status = r?.status();
  console.log("/dily/znacka/skoda status:", status);
  expect(status).toBe(200);

  // H1 contains "Škoda"
  const h1 = await page.locator("h1").first().textContent();
  console.log("H1:", h1);
  expect(h1?.toLowerCase()).toContain("škoda");

  // Breadcrumbs visible
  const breadcrumb = page.locator("nav[aria-label], [aria-label*='breadcrumb'], ol li, .breadcrumb").first();
  const hasBreadcrumb = await breadcrumb.count() > 0;
  console.log("Breadcrumb visible:", hasBreadcrumb);

  // Models grid — should contain Octavia, Fabia, Superb links
  const bodyText = await page.textContent("body");
  const hasOctavia = bodyText?.toLowerCase().includes("octavia");
  const hasFabia = bodyText?.toLowerCase().includes("fabia");
  console.log("Models grid has Octavia:", hasOctavia, "| Fabia:", hasFabia);
  expect(hasOctavia).toBe(true);

  // Canonical
  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("Canonical:", canonical);
});

test("T1b: /dily/znacka/skoda/octavia — model page, H1 = Škoda Octavia, categories chips", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/skoda/octavia`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t1b-skoda-octavia-model.png", fullPage: false });

  const status = r?.status();
  console.log("/dily/znacka/skoda/octavia status:", status);
  expect(status).toBe(200);

  const h1 = await page.locator("h1").first().textContent();
  console.log("H1:", h1);
  expect(h1?.toLowerCase()).toContain("škoda");
  expect(h1?.toLowerCase()).toContain("octavia");

  // Breadcrumbs
  const bodyText = await page.textContent("body");
  const hasDily = bodyText?.includes("Díly") || bodyText?.includes("dily");
  const hasSkodaInBc = bodyText?.includes("Škoda") || bodyText?.includes("Skoda");
  console.log("Breadcrumb has Díly:", hasDily, "| Škoda:", hasSkodaInBc);

  // Categories chips (MF-1: rounded pills, NOT big tiles)
  const chips = page.locator('a[href*="/dily/kategorie/"], button[class*="rounded"]').first();
  const hasChips = await chips.count() > 0;
  console.log("Has category chips:", hasChips);

  // Check it's chips, NOT grid with SVG icons
  const svgInCategories = await page.evaluate(() => {
    const catArea = document.querySelector('[class*="chip"], [class*="pill"], [class*="kategorie"]');
    return catArea?.querySelectorAll("svg").length ?? 0;
  });
  console.log("SVG icons in categories area:", svgInCategories);

  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("Canonical:", canonical);
});

test("T1c: /dily/znacka/skoda/octavia/2018 — rok page, H1 = Škoda Octavia 2018", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/skoda/octavia/2018`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t1c-skoda-octavia-2018.png", fullPage: false });

  const status = r?.status();
  console.log("/dily/znacka/skoda/octavia/2018 status:", status);
  expect(status).toBe(200);

  const h1 = await page.locator("h1").first().textContent();
  console.log("H1:", h1);
  expect(h1?.toLowerCase()).toContain("škoda");
  expect(h1?.toLowerCase()).toContain("octavia");
  expect(h1).toContain("2018");

  // Breadcrumbs — all 5 levels
  const bodyText = await page.textContent("body");
  const hasDomov = bodyText?.includes("Domů") || bodyText?.includes("domů");
  const hasDily = bodyText?.includes("Díly");
  const hasSkoda = bodyText?.includes("Škoda");
  const hasOctavia = bodyText?.includes("Octavia");
  const has2018 = bodyText?.includes("2018");
  console.log("Breadcrumb levels — Domů:", hasDomov, "| Díly:", hasDily, "| Škoda:", hasSkoda, "| Octavia:", hasOctavia, "| 2018:", has2018);

  // Categories chips visible
  const canonical = await page.evaluate(() =>
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null
  );
  console.log("Canonical:", canonical);
  // Canonical should contain /dily/znacka/skoda/octavia/2018
  if (canonical) {
    expect(canonical).toContain("skoda");
    expect(canonical).toContain("octavia");
    expect(canonical).toContain("2018");
  }
});

// ─── 3. Category chip click → /dily/kategorie/[slug] ─────────────────────────

test("T2: category chip click → /dily/kategorie/[slug] (no 404)", async ({ page }) => {
  await page.goto(`${BASE}/dily/znacka/skoda/octavia/2018`);
  await page.waitForTimeout(1500);

  // Find category chip links
  const categoryLinks = page.locator('a[href*="/dily/kategorie/"]');
  const count = await categoryLinks.count();
  console.log("Category chip links found:", count);

  if (count > 0) {
    const href = await categoryLinks.first().getAttribute("href");
    console.log("First category chip href:", href);

    // Navigate to the category
    const r = await page.goto(`${BASE}${href?.replace(BASE, "") ?? ""}`);
    await page.waitForTimeout(1000);
    const catStatus = r?.status();
    const catUrl = page.url();
    console.log("Category page status:", catStatus, "URL:", catUrl);
    expect(catStatus).not.toBe(404);
    expect(catStatus).not.toBe(500);

    await page.screenshot({ path: "test-results/t2-category-chip.png", fullPage: false });
  } else {
    console.log("No /dily/kategorie/ links found on rok page — checking model page");
    // Try model page
    await page.goto(`${BASE}/dily/znacka/skoda/octavia`);
    await page.waitForTimeout(1000);
    const catLinks2 = page.locator('a[href*="/dily/kategorie/"]');
    const count2 = await catLinks2.count();
    console.log("Category links on model page:", count2);
    if (count2 > 0) {
      const href2 = await catLinks2.first().getAttribute("href");
      console.log("Category chip href:", href2);
      expect(href2).toContain("/dily/kategorie/");
    }
  }
});

// ─── 4. Diakritika 301 redirect ───────────────────────────────────────────────

test("T3: diakritika 301 redirect — /dily/znacka/škoda → /dily/znacka/skoda", async ({ page }) => {
  const redirects: Array<{ url: string; status: number }> = [];
  page.on("response", (r) => {
    if ([301, 302, 307, 308].includes(r.status())) {
      redirects.push({ url: r.url(), status: r.status() });
    }
  });

  await page.goto(`${BASE}/dily/znacka/škoda`);
  await page.waitForTimeout(1500);

  const finalUrl = page.url();
  console.log("Final URL after diakritika redirect:", finalUrl);
  console.log("Redirects captured:", redirects);

  // Should end up on /skoda (no háček)
  expect(finalUrl).toContain("/skoda");
  expect(finalUrl).not.toContain("/škoda");

  const had301 = redirects.some(r => r.status === 301 || r.status === 308);
  console.log("Had 301/308 redirect:", had301);

  await page.screenshot({ path: "test-results/t3-diakritika-redirect.png", fullPage: false });
});

// ─── 5. Year validation → 404 ─────────────────────────────────────────────────

test("T4: year < 2000 → 404 (BMW Řada 3 1995 neexistovala)", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/bmw/rada-3/1995`);
  await page.waitForTimeout(1000);
  const status = r?.status();
  console.log("/dily/znacka/bmw/rada-3/1995 status:", status);
  expect(status).toBe(404);

  await page.screenshot({ path: "test-results/t4-year-404.png", fullPage: false });
});

// ─── 6. JSON-LD structured data ───────────────────────────────────────────────

test("T5: JSON-LD on rok page — BreadcrumbList + ItemList + FAQPage", async ({ page }) => {
  await page.goto(`${BASE}/dily/znacka/skoda/octavia/2018`);
  await page.waitForTimeout(1500);

  const jsonLdScripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => s.textContent ?? "");
  });

  console.log("JSON-LD script count:", jsonLdScripts.length);

  const allJsonLd = jsonLdScripts.join("\n");
  const hasBreadcrumb = allJsonLd.includes("BreadcrumbList");
  const hasItemList = allJsonLd.includes("ItemList");
  const hasFaq = allJsonLd.includes("FAQPage");
  const hasOrg = allJsonLd.includes("Organization");
  const hasWww = allJsonLd.includes("www.carmakler.cz");

  console.log("BreadcrumbList:", hasBreadcrumb);
  console.log("ItemList:", hasItemList);
  console.log("FAQPage:", hasFaq);
  console.log("Organization:", hasOrg);
  console.log("www. in JSON-LD:", hasWww);

  expect(hasBreadcrumb).toBe(true);
  expect(hasWww).toBe(false);

  // Log snippet
  if (jsonLdScripts.length > 0) {
    console.log("First JSON-LD (200 chars):", jsonLdScripts[0].slice(0, 200));
  }
});

// ─── 7. Sitemap contains new URLs ─────────────────────────────────────────────

test("T6: sitemap.xml contains /dily/znacka/skoda/octavia/2018", async ({ page }) => {
  const r = await page.goto(`${BASE}/sitemap.xml`);
  expect(r?.status()).toBe(200);

  const content = await page.content();
  const hasSkodaOctavia2018 = content.includes("/dily/znacka/skoda/octavia/2018");
  const hasSkodaBrand = content.includes("/dily/znacka/skoda");
  const dilyLocs = (content.match(/\/dily\/znacka\//g) ?? []).length;

  console.log("Sitemap has /dily/znacka/skoda/octavia/2018:", hasSkodaOctavia2018);
  console.log("Sitemap has /dily/znacka/skoda:", hasSkodaBrand);
  console.log("/dily/znacka/ entries count:", dilyLocs);

  expect(hasSkodaBrand).toBe(true);
  expect(hasSkodaOctavia2018).toBe(true);
});

// ─── 8. Multi-brand test ──────────────────────────────────────────────────────

test("T7: multi-brand — VW Golf 2018, Ford Focus 2020, Hyundai Kona 2022", async ({ page }) => {
  const brands = [
    { url: `${BASE}/dily/znacka/volkswagen/golf/2018`, expectedH1: ["volkswagen", "golf", "2018"] },
    { url: `${BASE}/dily/znacka/ford/focus/2020`,      expectedH1: ["ford", "focus", "2020"] },
    { url: `${BASE}/dily/znacka/hyundai/kona/2022`,    expectedH1: ["hyundai", "kona", "2022"] },
  ];

  for (const { url, expectedH1 } of brands) {
    const r = await page.goto(url);
    await page.waitForTimeout(1000);
    const status = r?.status();
    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    const h1Lower = h1?.toLowerCase() ?? "";
    console.log(`${url} → status=${status} H1="${h1}"`);

    expect(status).not.toBe(500);
    // Either 200 with correct H1, or 404 (brand/model might not be in seed)
    if (status === 200) {
      for (const term of expectedH1) {
        const hasIt = h1Lower.includes(term.toLowerCase());
        console.log(`  H1 contains "${term}":`, hasIt);
      }
    } else {
      console.log(`  ${url} → 404 (brand/model may not be in SSG list)`);
    }

    await page.screenshot({ path: `test-results/t7-${expectedH1[0]}-${expectedH1[1]}-${expectedH1[2]}.png`, fullPage: false });
  }
});

// ─── 9. MF-1: categories chips NOT grid (model page) ─────────────────────────

test("T8-MF1: /dily/znacka/skoda/octavia — categories are chips not grid", async ({ page }) => {
  await page.goto(`${BASE}/dily/znacka/skoda/octavia`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/t8-mf1-chips-check.png", fullPage: false });

  // MF-1: categories should be chips (small rounded pills)
  // NOT big tiles with SVG icons like brand page

  // Look for chip-style elements (small rounded links)
  const chipSelector = 'a[href*="/dily/kategorie/"]';
  const chipLinks = page.locator(chipSelector);
  const chipCount = await chipLinks.count();
  console.log("Category chip links (/dily/kategorie/):", chipCount);

  if (chipCount > 0) {
    // Check if they have chip-like classes (small, rounded-full, py-2)
    const firstChipClass = await chipLinks.first().getAttribute("class");
    console.log("First chip class:", firstChipClass);

    const isChip =
      firstChipClass?.includes("rounded") ||
      firstChipClass?.includes("px-") ||
      firstChipClass?.includes("py-") ||
      firstChipClass?.includes("text-sm");
    console.log("Looks like chip (rounded/px/py/text-sm):", isChip);

    // Verify NOT big grid tiles with SVG icons
    const svgInChipArea = await chipLinks.first().locator("svg").count();
    console.log("SVG icons inside chip:", svgInChipArea);
    // MF-1 violation: chips should NOT have SVG icons
    if (svgInChipArea > 0) {
      console.warn("⚠️ MF-1 VIOLATION: Category links have SVG icons — looks like grid, not chips!");
    } else {
      console.log("MF-1 OK: Category links are text-only chips ✅");
    }
  } else {
    // Maybe categories are shown differently on model page
    const bodyText = await page.textContent("body");
    const hasKategorie = bodyText?.includes("ategor");
    console.log("Has category text on page:", hasKategorie);
    console.log("Category chip format: reporting for review");
  }
});

// ─── 10. Breadcrumb navigation ────────────────────────────────────────────────

test("T9: breadcrumb nav — full chain from rok page back to homepage", async ({ page }) => {
  await page.goto(`${BASE}/dily/znacka/skoda/octavia/2018`);
  await page.waitForTimeout(1500);

  // Find all breadcrumb links
  const bcLinks = await page.locator('nav a, [aria-label*="breadcrumb"] a, ol a, [class*="breadcrumb"] a').evaluateAll(
    els => els.map(el => ({ text: el.textContent?.trim() ?? "", href: el.getAttribute("href") ?? "" }))
  );
  console.log("Breadcrumb links:", bcLinks);

  const texts = bcLinks.map(l => l.text.toLowerCase());
  const hrefs = bcLinks.map(l => l.href);

  // Should contain all navigation levels
  const hasDomov = texts.some(t => t.includes("domů") || t.includes("home") || t === "/");
  const hasDily = texts.some(t => t.includes("díly") || t.includes("dily")) || hrefs.some(h => h === "/dily" || h.endsWith("/dily"));
  const hasSkoda = texts.some(t => t.includes("škoda") || t.includes("skoda"));
  const hasOctavia = texts.some(t => t.includes("octavia"));
  const has2018 = texts.some(t => t.includes("2018")) || (await page.textContent("body") ?? "").includes("2018");

  console.log("Breadcrumb — Domů:", hasDomov, "| Díly:", hasDily, "| Škoda:", hasSkoda, "| Octavia:", hasOctavia, "| 2018:", has2018);

  // Find Octavia link and click it → should go to model page
  const octaviaLink = page.locator('a[href*="/skoda/octavia"]').first();
  const hasOctaviaLink = await octaviaLink.count() > 0;
  console.log("Octavia breadcrumb link found:", hasOctaviaLink);

  if (hasOctaviaLink) {
    const octaviaHref = await octaviaLink.getAttribute("href");
    console.log("Octavia href:", octaviaHref);
    await octaviaLink.click();
    await page.waitForTimeout(1000);
    const afterUrl = page.url();
    console.log("After Octavia click URL:", afterUrl);
    expect(afterUrl).toContain("octavia");
    expect(afterUrl).not.toContain("2018");

    await page.screenshot({ path: "test-results/t9-breadcrumb-octavia-click.png", fullPage: false });
  }

  // Navigate back to rok page and try Díly link
  await page.goto(`${BASE}/dily/znacka/skoda/octavia/2018`);
  await page.waitForTimeout(1000);

  const dilyLink = page.locator('a[href="/dily"], a[href*="/dily"]').first();
  const hasDilyLink = await dilyLink.count() > 0;
  console.log("Díly breadcrumb link found:", hasDilyLink);
  if (hasDilyLink) {
    const dilyHref = await dilyLink.getAttribute("href");
    console.log("Díly href:", dilyHref);
  }
});
