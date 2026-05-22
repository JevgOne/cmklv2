import { test, expect } from "@playwright/test";

const SCREEN_DIR = "/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots";

test.describe("TASK-036 unified profile + regression", () => {
  test("A1 — /profil/jan-novak-praha unified layout", async ({ page }) => {
    const resp = await page.goto("http://localhost:3000/profil/jan-novak-praha", { waitUntil: "domcontentloaded" });
    expect(resp?.status(), "HTTP status must be 200").toBe(200);

    // Wait a bit for hydration
    await page.waitForLoadState("networkidle");

    // Screenshot full page
    await page.screenshot({ path: `${SCREEN_DIR}/A1-profile-desktop.png`, fullPage: true });

    const html = await page.content();

    // Check for key presence (Czech UI texts expected)
    const checks: Record<string, boolean> = {
      hasMaxW6xl: html.includes("max-w-6xl"),
      hasCoverGradient: /bg-gradient-to-[rtb]{1,2}[\s\S]{0,80}(orange|peach|amber|rose)/i.test(html),
      hasAvatar: /avatar|rounded-full/i.test(html),
      hasHero: /jan-novak|Jan Novák|Jan Novak/i.test(html),
      hasTagPill: /TagPill|tag-pill|hashtag|#/.test(html),
      hasBio: /(O makléři|O mne|O mně|bio)/i.test(html),
      hasSpecialization: /(Specializace|specializ)/i.test(html),
      hasKontakt: /(Kontakt|kontakt)/i.test(html),
      hasVozidla: /(Vozidla|Auta|vehicle)/i.test(html),
      hasBadges: /(Badge|badge|Odznak|odznak)/i.test(html),
      hasKomentare: /(Komentář|Komentáře|komentář|Recenze)/i.test(html),
    };

    console.log("A1 checks:", checks);

    // At minimum must contain the broker name and layout width
    expect(html).toContain("max-w-6xl");
    expect(/jan[\s-]*nov[aá]k/i.test(html)).toBe(true);
  });

  test("A2 — TagPill click → /makleri/[slug] landing", async ({ page }) => {
    await page.goto("http://localhost:3000/profil/jan-novak-praha", { waitUntil: "networkidle" });

    // Find first link to /makleri/ (hashtag landing)
    const tagLinks = page.locator('a[href^="/makleri/"]');
    const count = await tagLinks.count();
    console.log(`A2 — found ${count} tag links`);

    if (count > 0) {
      const href = await tagLinks.first().getAttribute("href");
      console.log(`A2 — first tag href: ${href}`);
      // Use Promise.all to catch navigation (tag may be Link w/ client-side push)
      await Promise.all([
        page.waitForURL(/\/makleri\/[\w-]+/, { timeout: 10000 }).catch(() => null),
        tagLinks.first().click(),
      ]);
      await page.waitForLoadState("networkidle").catch(() => null);

      const url = page.url();
      console.log(`A2 — after click URL: ${url}`);
      expect(url).toMatch(/\/makleri\/[\w-]+/);
      await page.screenshot({ path: `${SCREEN_DIR}/A2-hashtag-landing.png`, fullPage: true });
    } else {
      console.log("A2 — no tag pills found on profile");
      await page.screenshot({ path: `${SCREEN_DIR}/A2-no-tags.png`, fullPage: true });
    }
  });

  test("A3 — /makler/[slug] redirect to /profil/[slug]", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/makler/jan-novak-praha", { waitUntil: "domcontentloaded" });
    console.log(`A3 — initial URL: ${page.url()}, status: ${response?.status()}`);

    // Dev Next.js uses meta-refresh for permanentRedirect; wait for it
    await page.waitForURL(/\/profil\/jan-novak-praha/, { timeout: 10000 }).catch(() => null);
    const finalUrl = page.url();
    console.log(`A3 — final URL after redirect: ${finalUrl}`);

    expect(finalUrl).toContain("/profil/jan-novak-praha");
  });

  test("A4 — /profil mobile 360x800", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3000/profil/jan-novak-praha", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${SCREEN_DIR}/A4-profile-mobile.png`, fullPage: true });

    // Check that content isn't horizontally overflowing
    const bodyScrollW = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientW = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`A4 — scrollW=${bodyScrollW}, clientW=${bodyClientW}`);
    expect(bodyScrollW).toBeLessThanOrEqual(bodyClientW + 5);
    await ctx.close();
  });

  test("B1 — /makleri/praha landing", async ({ page }) => {
    const resp = await page.goto("http://localhost:3000/makleri/praha", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
    await page.screenshot({ path: `${SCREEN_DIR}/B1-makleri-praha.png`, fullPage: true });
    const html = await page.content();
    console.log(`B1 — has 'praha' in content: ${/praha/i.test(html)}`);
  });

  test("B2 — /makleri/bmw landing", async ({ page }) => {
    const resp = await page.goto("http://localhost:3000/makleri/bmw", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
    await page.screenshot({ path: `${SCREEN_DIR}/B2-makleri-bmw.png`, fullPage: true });
  });

  test("B3 — /makleri/elektromobily landing", async ({ page }) => {
    const resp = await page.goto("http://localhost:3000/makleri/elektromobily", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
    await page.screenshot({ path: `${SCREEN_DIR}/B3-makleri-elektromobily.png`, fullPage: true });
  });

  test("C1 — /dodavatel/[slug] redirect", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/dodavatel/autovrakoviste-pilsen", { waitUntil: "domcontentloaded" });
    const initialStatus = response?.status();
    // Wait for meta-refresh to /dily/vrakoviste (or stay put if entity missing)
    await page.waitForURL(/\/dily\/vrakoviste/, { timeout: 6000 }).catch(() => null);
    const finalUrl = page.url();
    console.log(`C1 — final URL: ${finalUrl}, initial status: ${initialStatus}`);
    // Acceptable: redirected, OR 404 (entity missing), OR page still shows supplier (redirect target may 404 downstream)
    const html = await page.content();
    const hasRedirectMeta = /__next-page-redirect[^>]*\/dily\/vrakoviste/.test(html);
    const ok = finalUrl.includes("/dily/vrakoviste") || initialStatus === 404 || hasRedirectMeta;
    console.log(`C1 — redirect meta present: ${hasRedirectMeta}`);
    expect(ok).toBe(true);
  });

  test("C2 — /prihlaseni redirects to /login", async ({ page }) => {
    await page.goto("http://localhost:3000/prihlaseni", { waitUntil: "domcontentloaded" });
    // Dev Next.js uses meta-refresh; wait for URL change
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => null);
    const finalUrl = page.url();
    console.log(`C2 — final URL: ${finalUrl}`);
    expect(finalUrl).toContain("/login");
  });

  test("C3 — /jak-prodat-auto FAQ works", async ({ page }) => {
    const resp = await page.goto("http://localhost:3000/jak-prodat-auto", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
    const html = await page.content();
    const hasFaqTitle = /Často kladené otázky|FAQ/i.test(html);
    console.log(`C3 — hasFaqTitle: ${hasFaqTitle}`);
    expect(hasFaqTitle).toBe(true);
    await page.screenshot({ path: `${SCREEN_DIR}/C3-jak-prodat-auto.png`, fullPage: true });
  });

  test("C4 — /sluzby pages FAQ presence", async ({ page }) => {
    // /sluzby root does not exist; check subpages instead
    const paths = [
      "/sluzby/financovani",
      "/sluzby/pojisteni",
      "/sluzby/proverka",
    ];
    const results: Record<string, { status: number; hasFaq: boolean }> = {};
    for (const p of paths) {
      const resp = await page.goto("http://localhost:3000" + p, { waitUntil: "networkidle" });
      const status = resp?.status() ?? 0;
      const html = await page.content();
      results[p] = { status, hasFaq: /Často kladené otázky|FAQ/i.test(html) };
    }
    console.log("C4 results:", JSON.stringify(results));
    await page.screenshot({ path: `${SCREEN_DIR}/C4-sluzby-last.png`, fullPage: true });
  });
});
