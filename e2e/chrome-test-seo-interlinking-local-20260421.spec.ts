import { test, expect } from "@playwright/test";

// Task #33 — SEO Interlinking audit (localhost — production not accessible via DNS)
// 2026-04-21

const BASE = "http://localhost:3000";

// ─── 1. /nabidka/skoda — brand landing ────────────────────────────────────────

test.describe("/nabidka/skoda — brand landing", () => {
  test("H1, H2 sekce, meta title", async ({ page }) => {
    const resp = await page.goto(`${BASE}/nabidka/skoda`);
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    const title = await page.title();
    console.log("Title:", title);
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    await page.screenshot({ path: "test-results/seo-nabidka-skoda-top.png" });
    expect(resp?.status()).toBe(200);
  });

  test('"Mohlo by vás zajímat" / cross-link sekce', async ({ page }) => {
    await page.goto(`${BASE}/nabidka/skoda`);
    await page.waitForLoadState("networkidle");

    // All H2 headings
    const allH2 = await page.locator("h2").allTextContents();
    console.log("Všechna H2:", allH2);

    // Check for cross-link section
    const zajimaSekce = await page.locator(
      'h2:has-text("Mohlo by"), h2:has-text("zajímat"), h2:has-text("Doplňkové"), h2:has-text("Díly pro"), h2:has-text("Náhradní"), h2:has-text("Doporučujeme"), h2:has-text("Služby")'
    ).count();
    console.log("Cross-link sekce count:", zajimaSekce);

    // Links to /dily (autodíly pro Škoda)
    const dilyLinks = await page.locator('a[href*="/dily"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Linky na /dily:", JSON.stringify(dilyLinks.slice(0, 8)));

    // Links to /sluzby
    const sluzbyLinks = await page.locator('a[href*="/sluzby"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Linky na /sluzby:", JSON.stringify(sluzbyLinks.slice(0, 6)));

    // Brand model links (Škoda Octavia, Fabia etc.)
    const modelLinks = await page.locator('a[href*="/nabidka/skoda/"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Model linky /nabidka/skoda/*:", JSON.stringify(modelLinks.slice(0, 6)));

    // Screenshot bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/seo-nabidka-skoda-bottom.png" });
  });
});

// ─── 2. /nabidka/skoda/octavia — model landing ───────────────────────────────

test("/nabidka/skoda/octavia — bridge link na díly + H1", async ({ page }) => {
  const resp = await page.goto(`${BASE}/nabidka/skoda/octavia`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  const title = await page.title();
  console.log("Title:", title);
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  // Bridge link na díly pro Octavia / Škoda
  const dilyBridge = await page.locator('a[href*="dily"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Bridge na díly:", JSON.stringify(dilyBridge.slice(0, 6)));

  // Service links on model page
  const sluzbyLinks = await page.locator('a[href*="/sluzby"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Sluzby linky:", JSON.stringify(sluzbyLinks.slice(0, 4)));

  await page.screenshot({ path: "test-results/seo-nabidka-skoda-octavia.png", fullPage: true });
  expect(resp?.status()).toBe(200);
});

// ─── 3. /dily/znacka/skoda — parts brand landing ─────────────────────────────

test("/dily/znacka/skoda — bridge link na ojetá Škoda + H1", async ({ page }) => {
  const resp = await page.goto(`${BASE}/dily/znacka/skoda`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  const title = await page.title();
  console.log("Title:", title);
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  // Bridge link zpět na ojetá Škoda
  const nabidkaLinks = await page.locator('a[href*="/nabidka"][href*="skoda"], a[href*="nabidka/skoda"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Bridge na /nabidka/skoda:", JSON.stringify(nabidkaLinks));

  // All /nabidka links
  const allNabidka = await page.locator('a[href*="/nabidka"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Všechny /nabidka linky:", JSON.stringify(allNabidka.slice(0, 8)));

  await page.screenshot({ path: "test-results/seo-dily-skoda.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/seo-dily-skoda-bottom.png" });

  expect(resp?.status()).toBe(200);
});

// ─── 4. /jak-prodat-auto — info page ─────────────────────────────────────────

test('/jak-prodat-auto — "Související články" sekce', async ({ page }) => {
  const resp = await page.goto(`${BASE}/jak-prodat-auto`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  const title = await page.title();
  console.log("Title:", title);
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  // "Související články" section
  const souvisejiCount = await page.locator(
    'h2:has-text("Související"), h2:has-text("Doporučené"), h2:has-text("Čtěte také"), h3:has-text("Související")'
  ).count();
  console.log('"Související/Doporučené" sekce:', souvisejiCount);

  // Get section links
  const sectionLinks = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const related = headings.find(h =>
      h.textContent?.includes("Související") ||
      h.textContent?.includes("Doporučené") ||
      h.textContent?.includes("Čtěte také")
    );
    if (!related) return { found: false, links: [] };
    const container = related.closest("section") || related.parentElement?.parentElement || related.parentElement;
    const links = Array.from(container?.querySelectorAll("a[href]") || []) as HTMLAnchorElement[];
    return {
      found: true,
      heading: related.textContent?.trim(),
      links: links.map(a => ({ text: a.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: a.getAttribute("href") }))
    };
  });
  console.log("Section links:", JSON.stringify(sectionLinks));

  // All related page links
  const relatedLinks = await page.locator(
    'a[href*="kolik-stoji"], a[href*="jak-to-funguje"], a[href*="chci-prodat"], a[href*="makleri"]'
  ).evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Related page links:", JSON.stringify(relatedLinks));

  await page.screenshot({ path: "test-results/seo-jak-prodat-auto.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/seo-jak-prodat-bottom.png" });

  expect(resp?.status()).toBe(200);
});

// ─── 5. /kolik-stoji-moje-auto ───────────────────────────────────────────────

test('/kolik-stoji-moje-auto — "Související články" sekce', async ({ page }) => {
  const resp = await page.goto(`${BASE}/kolik-stoji-moje-auto`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  const title = await page.title();
  console.log("Title:", title);
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  // "Související" section
  const souvisejiCount = await page.locator(
    'h2:has-text("Související"), h2:has-text("Doporučené"), h2:has-text("Čtěte také"), h3:has-text("Související")'
  ).count();
  console.log('"Související/Doporučené" sekce:', souvisejiCount);

  const sectionLinks = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const related = headings.find(h =>
      h.textContent?.includes("Související") ||
      h.textContent?.includes("Doporučené") ||
      h.textContent?.includes("Čtěte také")
    );
    if (!related) return { found: false, links: [] };
    const container = related.closest("section") || related.parentElement?.parentElement || related.parentElement;
    const links = Array.from(container?.querySelectorAll("a[href]") || []) as HTMLAnchorElement[];
    return {
      found: true,
      heading: related.textContent?.trim(),
      links: links.map(a => ({ text: a.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: a.getAttribute("href") }))
    };
  });
  console.log("Section links:", JSON.stringify(sectionLinks));

  const relatedLinks = await page.locator(
    'a[href*="jak-prodat"], a[href*="jak-to-funguje"], a[href*="chci-prodat"], a[href*="makleri"]'
  ).evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Related page links:", JSON.stringify(relatedLinks));

  await page.screenshot({ path: "test-results/seo-kolik-stoji.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/seo-kolik-stoji-bottom.png" });

  expect(resp?.status()).toBe(200);
});
