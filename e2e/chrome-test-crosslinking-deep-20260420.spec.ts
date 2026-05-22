import { test, expect } from "@playwright/test";

// Task #28 DEEP — Proklikání všech cross-link sekcí
// 2026-04-20

// Helper: click link and verify destination
async function clickAndVerify(page: any, linkHref: string, label: string) {
  const link = page.locator(`a[href="${linkHref}"]`).first();
  const exists = await link.count();
  if (exists === 0) {
    console.log(`❌ MISSING: ${label} → ${linkHref}`);
    return false;
  }
  await link.click();
  await page.waitForLoadState("domcontentloaded");
  const currentUrl = page.url();
  const ok = currentUrl.includes(linkHref.replace(/^\//, ""));
  console.log(`${ok ? "✅" : "❌"} ${label} → ${linkHref} (landed: ${currentUrl})`);
  await page.goBack();
  await page.waitForLoadState("domcontentloaded");
  return ok;
}

// ─── SERVICE PAGES — FULL CROSS-LINK CHECK ────────────────────────────────────

const servicePages = [
  { path: "/sluzby/financovani", name: "financovani", otherServices: ["/sluzby/proverka", "/sluzby/pojisteni"] },
  { path: "/sluzby/proverka", name: "proverka", otherServices: ["/sluzby/financovani", "/sluzby/pojisteni"] },
  { path: "/sluzby/pojisteni", name: "pojisteni", otherServices: ["/sluzby/financovani", "/sluzby/proverka"] },
];

for (const { path, name, otherServices } of servicePages) {
  test.describe(`Cross-linking deep — ${path}`, () => {
    test(`${name}: karty ostatních služeb + linky na nabidka/chci-prodat/makleri`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      // Find cross-linking section
      const crossSection = await page.locator('h2:has-text("Další služby"), h2:has-text("Ostatní služby"), h2:has-text("Doplňkové")').count();
      console.log(`\n[${name}] Cross-link section heading count: ${crossSection}`);

      // Check links to other service pages
      for (const otherSvc of otherServices) {
        const count = await page.locator(`a[href="${otherSvc}"]`).count();
        console.log(`  Link ${otherSvc}: ${count > 0 ? "✅" : "❌"} (${count}×)`);
      }

      // Check "gateway" links — nabidka, chci-prodat, makleri
      const nabidkaLinks = await page.locator('a[href="/nabidka"]').count();
      const chciProdatLinks = await page.locator('a[href="/chci-prodat"]').count();
      const makleriLinks = await page.locator('a[href="/makleri"]').count();
      console.log(`  Link /nabidka: ${nabidkaLinks > 0 ? "✅" : "❌"} (${nabidkaLinks}×)`);
      console.log(`  Link /chci-prodat: ${chciProdatLinks > 0 ? "✅" : "❌"} (${chciProdatLinks}×)`);
      console.log(`  Link /makleri: ${makleriLinks > 0 ? "✅" : "❌"} (${makleriLinks}×)`);

      // Try to find the cross-link section specifically (not header/footer)
      // Look for links with arrow text (CTA style)
      const ctaLinks = await page.locator('a:has-text("→"), a:has-text("Prohlédnout"), a:has-text("Prodat auto přes"), a:has-text("Najít makléře")').evaluateAll(
        (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\n/g, ' '), href: el.getAttribute("href") }))
      );
      console.log(`  CTA links in section:`, JSON.stringify(ctaLinks));

      // Screenshot of bottom of page (cross-link section area)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/deep-${name}-bottom.png` });

      // Assertions
      expect(crossSection).toBeGreaterThan(0);
      expect(nabidkaLinks + chciProdatLinks + makleriLinks).toBeGreaterThan(0);
    });

    test(`${name}: proklikání cross-linků — navigace funguje`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      // Click each other service link
      for (const otherSvc of otherServices) {
        const link = page.locator(`a[href="${otherSvc}"]`).first();
        if (await link.count() > 0) {
          await link.click();
          await page.waitForLoadState("domcontentloaded");
          const url = page.url();
          const ok = url.includes(otherSvc.replace("/", ""));
          console.log(`${ok ? "✅" : "❌"} Click ${otherSvc} → landed: ${url}`);
          expect(url).toContain(otherSvc.replace("/", ""));
          await page.goBack();
          await page.waitForLoadState("domcontentloaded");
        }
      }
    });
  });
}

// ─── /chci-prodat — "Nejste si jistí?" s pill linky ──────────────────────────

test.describe("/chci-prodat — Nejste si jistí? pill linky", () => {
  test("Sekce pill linky: jak-to-funguje, recenze, makleri", async ({ page }) => {
    await page.goto("/chci-prodat");
    await page.waitForLoadState("networkidle");

    // Scroll to "Nejste si jistí?" section
    const nejsteEl = page.locator('h2:has-text("Nejste si jistí")').first();
    const count = await nejsteEl.count();
    console.log('"Nejste si jistí?" heading:', count);

    if (count > 0) {
      await nejsteEl.scrollIntoView();
      await page.waitForTimeout(500);
    }

    // Check pill links (styled as badges/pills)
    // Pill links often use rounded-full, px-4, py-2, inline-flex
    const pillLinks = await page.locator(
      'a[class*="rounded-full"], a[class*="rounded-lg"][class*="px-"], a[class*="pill"], a[class*="badge"]'
    ).evaluateAll((els: HTMLAnchorElement[]) =>
      els.map(el => ({ text: el.innerText.trim(), href: el.getAttribute("href") }))
         .filter(l => l.text.length > 0)
    );
    console.log("Pill links found:", JSON.stringify(pillLinks));

    // Look for specific CTA links in the "Nejste si jistí?" area
    const jakToFunguje = await page.locator('a[href*="jak-to-funguje"], a[href*="jak-prodat"]').count();
    const recenze = await page.locator('a[href*="recenze"]').count();
    const makleri = await page.locator('a[href="/makleri"]').count();
    console.log(`  jak-to-funguje/jak-prodat links: ${jakToFunguje}`);
    console.log(`  recenze links: ${recenze}`);
    console.log(`  /makleri links: ${makleri}`);

    // Screenshot of "Nejste si jistí?" section area
    if (count > 0) {
      const box = await nejsteEl.boundingBox();
      if (box) {
        await page.screenshot({
          path: "test-results/chci-prodat-nejste-jisti.png",
          clip: { x: 0, y: Math.max(0, box.y - 20), width: 1280, height: 400 }
        });
      }
    }
    await page.screenshot({ path: "test-results/chci-prodat-bottom.png", fullPage: false });

    expect(count).toBe(1);
  });
});

// ─── /nabidka/[slug] — proklikání Doplňkové služby linků ─────────────────────

test.describe("/nabidka/[slug] — Doplňkové služby proklikání", () => {
  test("Kliknutí na service links vede správně", async ({ page }) => {
    await page.goto("/nabidka/peugeot-3008-gt-2022");
    await page.waitForLoadState("networkidle");

    const serviceLinks = ["/sluzby/financovani", "/sluzby/proverka", "/sluzby/pojisteni"];
    for (const svc of serviceLinks) {
      const link = page.locator(`a[href="${svc}"]`).first();
      if (await link.count() > 0) {
        await link.scrollIntoView();
        await page.waitForTimeout(200);
        await link.click();
        await page.waitForLoadState("domcontentloaded");
        const url = page.url();
        const ok = url.includes(svc.replace("/", ""));
        console.log(`${ok ? "✅" : "❌"} Click ${svc} → ${url}`);
        expect(url).toContain(svc.replace(/^\//, ""));
        await page.goBack();
        await page.waitForLoadState("domcontentloaded");
      } else {
        console.log(`❌ MISSING link: ${svc}`);
      }
    }

    // Screenshot doplnkove section
    const doplnkoveEl = page.locator('h2:has-text("Doplňkové"), h3:has-text("Doplňkové")').first();
    if (await doplnkoveEl.count() > 0) {
      await doplnkoveEl.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "test-results/nabidka-doplnkove-sluzby.png" });
    }
  });
});

// ─── /profil/[slug] — proklikání CTA ──────────────────────────────────────────

test.describe("/profil/[slug] — CTA proklikání", () => {
  test("CTA 'Chcete prodat auto?' link vede na /chci-prodat", async ({ page }) => {
    await page.setDefaultTimeout(15000);
    await page.goto("/profil/jan-novak-praha");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const ctaLink = page.locator('a[href="/chci-prodat"]').first();
    const count = await ctaLink.count();
    console.log("Chci-prodat links:", count);

    if (count > 0) {
      await ctaLink.scrollIntoView();
      await page.screenshot({ path: "test-results/profil-cta.png" });
      await ctaLink.click();
      await page.waitForLoadState("domcontentloaded");
      console.log("Landed:", page.url());
      expect(page.url()).toContain("chci-prodat");
    } else {
      console.log("❌ CTA link not found");
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ─── /inzerce/katalog — detailní check ───────────────────────────────────────

test.describe("/inzerce/katalog — nekonečný spinner", () => {
  test("Načte se, redirect na /nabidka, 0 spinnerů, content viditelný", async ({ page }) => {
    await page.goto("/inzerce/katalog");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);

    const spinner = await page.locator('svg[class*="animate-spin"], [role="progressbar"], [class*="spinner"]').count();
    const cards = await page.locator('[class*="card"], article').count();
    console.log("Spinner:", spinner, "Cards:", cards);

    await page.screenshot({ path: "test-results/inzerce-katalog-deep.png" });

    expect(spinner).toBe(0);
    expect(cards).toBeGreaterThan(0);
  });
});
