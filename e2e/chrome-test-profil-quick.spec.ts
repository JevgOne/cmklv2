import { test, expect } from "@playwright/test";

test("profil/jan-novak-praha — content check", async ({ page }) => {
  page.setDefaultTimeout(15000);
  const resp = await page.goto("/profil/jan-novak-praha");
  console.log("HTTP:", resp?.status());
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "N/A");
  const h2s = await page.locator("h2").allTextContents();
  const h3s = await page.locator("h3").allTextContents();
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);
  console.log("H3s:", h3s.slice(0, 8));

  const ctaChciProdat = await page.locator('a[href*="chci-prodat"]').count();
  const ctaPoptavka = await page.locator('a[href*="poptavka"]').count();
  const ctaContact = await page.locator('a[href*="kontakt"]').count();
  console.log("Links chci-prodat:", ctaChciProdat, "poptavka:", ctaPoptavka, "kontakt:", ctaContact);

  const prodejCTA = await page.locator('h2:has-text("prodat"), h3:has-text("prodat"), [class*="cta"]').count();
  console.log("Prodat CTA headings:", prodejCTA);

  await page.screenshot({ path: "test-results/profil-jan-novak.png", fullPage: true });
  console.log("Screenshot saved");
});

test("inzerce/katalog — detailed check", async ({ page }) => {
  page.setDefaultTimeout(15000);
  const resp = await page.goto("/inzerce/katalog");
  console.log("HTTP:", resp?.status(), "URL:", page.url());
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "N/A");
  const h2s = await page.locator("h2").allTextContents();
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);
  console.log("Final URL:", page.url());

  const spinner = await page.locator('svg[class*="animate-spin"], [role="progressbar"], [class*="spinner"]').count();
  const cards = await page.locator('[class*="card"], article').count();
  const inzerceLinks = await page.locator('a[href*="/inzerce/"]').count();
  console.log("Spinner:", spinner, "Cards:", cards, "Inzerce links:", inzerceLinks);

  await page.screenshot({ path: "test-results/inzerce-katalog-check.png", fullPage: true });
});
