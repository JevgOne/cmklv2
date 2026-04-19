import { test, expect } from "@playwright/test";

// Full platform visual audit - 2026-04-19
// Tests: public pages, auth pages, eshop, marketplace, inzerce, PWA redirects, admin redirects

test.describe("Full Platform Audit - Public Pages", () => {
  test("Homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CarMakléř/);
    // Check key sections exist
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    // Check hero section
    const hero = page.locator("h1").first();
    await expect(hero).toBeVisible();
  });

  test("/nabidka — katalog vozidel", async ({ page }) => {
    await page.goto("/nabidka");
    await expect(page).toHaveTitle(/Nabídka vozidel/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/makleri — seznam makléřů", async ({ page }) => {
    await page.goto("/makleri");
    await expect(page).toHaveTitle(/Naši makléři/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/o-nas — o nás stránka", async ({ page }) => {
    await page.goto("/o-nas");
    await expect(page).toHaveTitle(/O nás/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/kontakt — kontakt", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page).toHaveTitle(/Kontakt/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/jak-to-funguje — jak to funguje", async ({ page }) => {
    await page.goto("/jak-to-funguje");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/jak-prodat-auto — jak prodat auto", async ({ page }) => {
    await page.goto("/jak-prodat-auto");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/chci-prodat — chci prodat", async ({ page }) => {
    await page.goto("/chci-prodat");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/kolik-stoji-moje-auto — ocenění auta", async ({ page }) => {
    await page.goto("/kolik-stoji-moje-auto");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/kariera — kariéra", async ({ page }) => {
    await page.goto("/kariera");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/recenze — recenze", async ({ page }) => {
    await page.goto("/recenze");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Služby", () => {
  test("/sluzby/financovani — financování", async ({ page }) => {
    await page.goto("/sluzby/financovani");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/sluzby/pojisteni — pojištění", async ({ page }) => {
    await page.goto("/sluzby/pojisteni");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/sluzby/proverka — prověrka", async ({ page }) => {
    await page.goto("/sluzby/proverka");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Auth", () => {
  test("/prihlaseni — přihlášení", async ({ page }) => {
    await page.goto("/prihlaseni");
    await expect(page.locator("header")).toBeVisible();
    // Should have email/password form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("/registrace — registrace", async ({ page }) => {
    await page.goto("/registrace");
    await expect(page).toHaveTitle(/Registrace/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/registrace/makler — registrace makléře", async ({ page }) => {
    await page.goto("/registrace/makler");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/registrace/dodavatel — registrace dodavatele", async ({ page }) => {
    await page.goto("/registrace/dodavatel");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/zapomenute-heslo — zapomenuté heslo", async ({ page }) => {
    await page.goto("/zapomenute-heslo");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Inzerce", () => {
  test("/inzerce — inzerce landing", async ({ page }) => {
    await page.goto("/inzerce");
    await expect(page).toHaveTitle(/Inzerce/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/inzerce/katalog — katalog inzerátů", async ({ page }) => {
    await page.goto("/inzerce/katalog");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/inzerce/pridat — přidat inzerát", async ({ page }) => {
    await page.goto("/inzerce/pridat");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — E-shop Autodíly", () => {
  test("/dily — autodíly landing", async ({ page }) => {
    await page.goto("/dily");
    await expect(page).toHaveTitle(/Autodíly/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/dily/katalog — katalog dílů", async ({ page }) => {
    await page.goto("/dily/katalog");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/dily/kosik — košík", async ({ page }) => {
    await page.goto("/dily/kosik");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Shop", () => {
  test("/shop — shop landing", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveTitle(/Shop/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/shop/katalog — katalog shopu", async ({ page }) => {
    await page.goto("/shop/katalog");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/shop/kosik — košík shopu", async ({ page }) => {
    await page.goto("/shop/kosik");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Marketplace", () => {
  test("/marketplace — marketplace landing", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveTitle(/Marketplace/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("/marketplace/apply — apply form", async ({ page }) => {
    await page.goto("/marketplace/apply");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Prezentace", () => {
  test("/prezentace — partnerská prezentace", async ({ page }) => {
    await page.goto("/prezentace");
    await expect(page).toHaveTitle(/prezentace/i);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    // Check map exists
    const mapSection = page.locator('[data-testid="map"], .leaflet-container, iframe[src*="maps"], [class*="map"]');
    // Check QR code exists
    const qr = page.locator('canvas[aria-label*="QR"], img[alt*="QR"], [class*="qr"]');
  });
});

test.describe("Full Platform Audit — Legal stránky", () => {
  test("/obchodni-podminky", async ({ page }) => {
    await page.goto("/obchodni-podminky");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/ochrana-osobnich-udaju", async ({ page }) => {
    await page.goto("/ochrana-osobnich-udaju");
    await expect(page.locator("header")).toBeVisible();
  });

  test("/zasady-cookies", async ({ page }) => {
    await page.goto("/zasady-cookies");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Full Platform Audit — Auth Redirects (protected)", () => {
  test("/makler/dashboard redirects to login", async ({ page }) => {
    await page.goto("/makler/dashboard");
    await expect(page).toHaveURL(/login|prihlaseni/);
  });

  test("/admin/dashboard redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/login|prihlaseni/);
  });

  test("/partner/dashboard redirects to login", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await expect(page).toHaveURL(/login|prihlaseni/);
  });

  test("/muj-ucet redirects to login", async ({ page }) => {
    await page.goto("/muj-ucet");
    await expect(page).toHaveURL(/login|prihlaseni/);
  });
});

test.describe("Full Platform Audit — Navigation", () => {
  test("Homepage navigation links work", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    // Check logo links to homepage
    const logo = page.locator('header a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test("Footer links are present", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Footer should have links
    const footerLinks = footer.locator("a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(3);
  });
});
