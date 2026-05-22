import { test, expect } from "@playwright/test";

// Final targeted click-through test
// Using section-specific locators to avoid nav interference

test.describe("Service pages: click inter-service cards (section-scoped)", () => {
  const cases = [
    { from: "/sluzby/financovani", clickTarget: "/sluzby/proverka" },
    { from: "/sluzby/financovani", clickTarget: "/sluzby/pojisteni" },
    { from: "/sluzby/proverka", clickTarget: "/sluzby/financovani" },
    { from: "/sluzby/proverka", clickTarget: "/sluzby/pojisteni" },
    { from: "/sluzby/pojisteni", clickTarget: "/sluzby/financovani" },
    { from: "/sluzby/pojisteni", clickTarget: "/sluzby/proverka" },
  ];

  for (const { from, clickTarget } of cases) {
    test(`${from} → click ${clickTarget}`, async ({ page }) => {
      await page.goto(from);
      await page.waitForLoadState("networkidle");

      // Use section-specific locator: only links within "Další služby" section
      const sectionLink = page.locator(
        `section:has(h2:has-text("Další služby")) a[href="${clickTarget}"]`
      ).first();

      const count = await sectionLink.count();
      console.log(`Section-scoped link ${clickTarget}: ${count}`);
      expect(count).toBeGreaterThan(0);

      // Force click (bypass opacity/visibility from Framer Motion or rendering)
      await sectionLink.click({ force: true });
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      console.log(`✅ Landed: ${url}`);
      expect(url).toContain(clickTarget.replace(/^\//, ""));
    });
  }
});

test('/chci-prodat: pill linky v "Nejste si jistí?" + click', async ({ page }) => {
  await page.goto("/chci-prodat");
  await page.waitForLoadState("networkidle");

  // Section scoped
  const section = page.locator('section:has(h2:has-text("Nejste si jistí"))');
  const sectionCount = await section.count();
  console.log('"Nejste si jistí?" section:', sectionCount);
  expect(sectionCount).toBeGreaterThan(0);

  // Pill links in section (rounded-xl style)
  const pillLinks = await section.locator('a[class*="rounded-xl"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim(), href: el.getAttribute("href") }))
  );
  console.log("Pill links:", JSON.stringify(pillLinks));

  // Verify specific links
  const jakToFunguje = await section.locator('a[href*="jak-to-funguje"], a[href*="jak-prodat"]').count();
  const recenze = await section.locator('a[href*="recenze"]').count();
  const makleri = await section.locator('a[href*="makleri"]').count();
  console.log(`  jak-to-funguje: ${jakToFunguje} | recenze: ${recenze} | makleri: ${makleri}`);

  expect(jakToFunguje + recenze + makleri).toBeGreaterThan(0);

  // Screenshot of section
  const heading = section.locator('h2').first();
  await heading.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/chci-prodat-nejste-section-final.png" });

  // Click one pill link
  const firstPill = section.locator('a[class*="rounded-xl"]').first();
  await firstPill.click({ force: true });
  await page.waitForLoadState("domcontentloaded");
  console.log("Pill click landed:", page.url());
  expect(page.url()).not.toContain("chci-prodat");
});

test('/profil/jan-novak-praha: CTA "Chcete prodat auto?" section-scoped', async ({ page }) => {
  page.setDefaultTimeout(15000);
  await page.goto("/profil/jan-novak-praha");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000); // let client components render

  // Find CTA div containing "Chcete prodat auto?"
  const ctaText = page.locator('div:has-text("Chcete prodat auto?")').first();
  const ctaCount = await ctaText.count();
  console.log('"Chcete prodat auto?" div:', ctaCount);

  // Find the Link wrapping it
  const ctaLink = page.locator('a[href="/chci-prodat"]:has-text("prodat")').first();
  const linkCount = await ctaLink.count();
  console.log("CTA link (has-text prodat):", linkCount);

  // All chci-prodat links
  const allLinks = await page.locator('a[href="/chci-prodat"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 50), class: el.className.slice(0, 80) }))
  );
  console.log("All /chci-prodat links:", JSON.stringify(allLinks));

  await page.screenshot({ path: "test-results/profil-cta-final.png" });
});

test("/nabidka/[slug]: Doplňkové služby — karty section-scoped", async ({ page }) => {
  await page.goto("/nabidka/peugeot-3008-gt-2022");
  await page.waitForLoadState("networkidle");

  // Section scoped
  const section = page.locator('section:has(h2:has-text("Doplňkové")), div:has(h2:has-text("Doplňkové"))').first();
  const sectionCount = await section.count();
  console.log('"Doplňkové" section:', sectionCount);

  // All links in section
  const sectionLinks = await page.locator('h2:has-text("Doplňkové")').evaluate((h2) => {
    const container = h2.closest("section") || h2.parentElement;
    if (!container) return [];
    return Array.from(container.querySelectorAll("a[href]")).map((a) => ({
      text: (a as HTMLAnchorElement).innerText.trim().replace(/\s+/g, " "),
      href: (a as HTMLAnchorElement).getAttribute("href"),
    }));
  });
  console.log("Doplňkové section links:", JSON.stringify(sectionLinks));

  // Scroll + screenshot
  const heading = page.locator('h2:has-text("Doplňkové"), h3:has-text("Doplňkové")').first();
  if (await heading.count() > 0) {
    await heading.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: "test-results/nabidka-doplnkove-final.png" });
  }

  const serviceLinks = sectionLinks.filter(l => l.href?.includes("/sluzby/"));
  console.log("Service links in Doplňkové section:", serviceLinks.length);
  expect(serviceLinks.length).toBeGreaterThan(0);
});
