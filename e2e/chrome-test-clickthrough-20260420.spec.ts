import { test, expect } from "@playwright/test";

// Task #28 CLICK-THROUGH — Proklikání všech cross-linků
// 2026-04-20

// ─── SERVICE PAGES: click-through ─────────────────────────────────────────────

const serviceTests = [
  {
    from: "/sluzby/financovani",
    name: "financovani",
    targets: ["/sluzby/proverka", "/sluzby/pojisteni", "/nabidka", "/chci-prodat", "/makleri"],
  },
  {
    from: "/sluzby/proverka",
    name: "proverka",
    targets: ["/sluzby/financovani", "/sluzby/pojisteni", "/nabidka", "/chci-prodat", "/makleri"],
  },
  {
    from: "/sluzby/pojisteni",
    name: "pojisteni",
    targets: ["/sluzby/financovani", "/sluzby/proverka", "/nabidka", "/chci-prodat", "/makleri"],
  },
];

for (const { from, name, targets } of serviceTests) {
  test(`${name}: cross-link karty + CTA linky`, async ({ page }) => {
    await page.goto(from);
    await page.waitForLoadState("networkidle");

    // Confirm "Další služby" section
    const section = await page.locator('h2:has-text("Další služby")').count();
    console.log(`\n[${name}] 'Další služby' heading: ${section}`);
    expect(section).toBe(1);

    // Log all targeted links
    for (const target of targets) {
      const links = page.locator(`a[href="${target}"]`);
      const count = await links.count();
      console.log(`  ${count > 0 ? "✅" : "❌"} ${target}: ${count}×`);
      expect(count).toBeGreaterThan(0);
    }

    // CTA arrow links
    const ctaArrow = await page.locator('a:has-text("nabídku vozidel"), a:has-text("přes makléře"), a:has-text("Najít makléře")').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, ' '), href: el.getAttribute("href") }))
    );
    console.log(`  CTA arrow links:`, JSON.stringify(ctaArrow));

    // Screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/clickthrough-${name}.png` });
  });

  test(`${name}: click inter-service → correct navigation`, async ({ page }) => {
    // Only click inter-service links (the 2 other service pages)
    const interService = targets.filter(t => t.startsWith("/sluzby/"));

    for (const target of interService) {
      await page.goto(from);
      await page.waitForLoadState("networkidle");

      const link = page.locator(`a[href="${target}"]`).first();
      // Scroll into view
      await link.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
      await page.waitForTimeout(200);
      await link.click();
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      console.log(`✅ ${from} → click ${target} → landed: ${url}`);
      expect(url).toContain(target.replace(/^\//, ""));
    }
  });
}

// ─── /nabidka/[slug] click-through ────────────────────────────────────────────

test("/nabidka/[slug]: Doplňkové služby click-through", async ({ page }) => {
  await page.goto("/nabidka/peugeot-3008-gt-2022");
  await page.waitForLoadState("networkidle");

  const section = await page.locator('h2:has-text("Doplňkové"), h3:has-text("Doplňkové")').count();
  console.log('"Doplňkové" heading:', section);

  const serviceTargets = ["/sluzby/financovani", "/sluzby/proverka", "/sluzby/pojisteni"];

  for (const target of serviceTargets) {
    await page.goto("/nabidka/peugeot-3008-gt-2022");
    await page.waitForLoadState("networkidle");

    const link = page.locator(`a[href="${target}"]`).first();
    const count = await link.count();
    if (count === 0) {
      console.log(`❌ MISSING ${target}`);
      continue;
    }
    await link.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    await page.waitForTimeout(200);
    await link.click();
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    console.log(`${url.includes(target.replace(/^\//, "")) ? "✅" : "❌"} nabidka → ${target} → ${url}`);
    expect(url).toContain(target.replace(/^\//, ""));
  }

  // Screenshot of doplnkove section
  await page.goto("/nabidka/peugeot-3008-gt-2022");
  await page.waitForLoadState("networkidle");
  const doplnkove = page.locator('h2:has-text("Doplňkové"), h3:has-text("Doplňkové")').first();
  if (await doplnkove.count() > 0) {
    await doplnkove.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: "test-results/nabidka-doplnkove.png" });
  }
});

// ─── /chci-prodat "Nejste si jistí?" pill linky ───────────────────────────────

test('/chci-prodat: "Nejste si jistí?" sekce + linky', async ({ page }) => {
  await page.goto("/chci-prodat");
  await page.waitForLoadState("networkidle");

  const heading = page.locator('h2:has-text("Nejste si jistí")').first();
  const count = await heading.count();
  console.log('"Nejste si jistí?" heading:', count);
  expect(count).toBe(1);

  // Scroll to section
  await heading.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(400);

  // Get all links visible near this section
  const sectionLinks = await page.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll("h2")).find(
      (el) => el.textContent?.includes("Nejste si jistí")
    );
    if (!h2) return [];
    // Get next sibling elements looking for links
    const container = h2.parentElement;
    if (!container) return [];
    const links = Array.from(container.querySelectorAll("a[href]"));
    return links.map((a) => ({
      text: (a as HTMLAnchorElement).innerText.trim().replace(/\s+/g, " "),
      href: (a as HTMLAnchorElement).getAttribute("href"),
    }));
  });
  console.log('"Nejste si jistí?" section links:', JSON.stringify(sectionLinks));

  // Pill links typically styled with rounded-full
  const pillLinks = await page.locator('a[class*="rounded-full"], a[class*="rounded-lg"][class*="gap-"]').evaluateAll(
    (els: HTMLAnchorElement[]) =>
      els
        .map((el) => ({ text: el.innerText.trim().replace(/\s+/g, " "), href: el.getAttribute("href") }))
        .filter((l) => l.text.length > 0)
  );
  console.log("Pill links (rounded-full/rounded-lg):", JSON.stringify(pillLinks));

  // Screenshot of "Nejste si jistí?" section
  await page.screenshot({ path: "test-results/chci-prodat-nejste-section.png" });
});

// ─── /profil/[slug]: CTA click-through ────────────────────────────────────────

test('/profil/jan-novak-praha: "Chcete prodat auto?" click', async ({ page }) => {
  page.setDefaultTimeout(15000);
  await page.goto("/profil/jan-novak-praha");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Find CTA link
  const ctaLink = page.locator('a[href="/chci-prodat"]').first();
  const count = await ctaLink.count();
  console.log('"chci-prodat" links:', count);
  expect(count).toBeGreaterThan(0);

  // Scroll and screenshot before click
  await ctaLink.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/profil-cta-before-click.png" });

  // Click and verify
  await ctaLink.click();
  await page.waitForLoadState("domcontentloaded");
  console.log("Landed:", page.url());
  expect(page.url()).toContain("chci-prodat");
});

// ─── /inzerce/katalog spinner ─────────────────────────────────────────────────

test("/inzerce/katalog: redirect /nabidka, 0 spinnerů", async ({ page }) => {
  await page.goto("/inzerce/katalog");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const spinner = await page.locator('svg[class*="animate-spin"], [role="progressbar"]').count();
  const cards = await page.locator('[class*="card"], article').count();
  console.log("Final URL:", finalUrl, "| Spinner:", spinner, "| Cards:", cards);

  expect(spinner).toBe(0);
  expect(cards).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/inzerce-katalog-final.png" });
});
