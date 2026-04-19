import { test, expect } from "@playwright/test";

test.describe("/prezentace — detailní audit pitch deck", () => {
  test("Základní render — H1, sekce", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());
    await expect(page.locator("h1").first()).toBeVisible();

    const h2s = await page.locator("h2").allTextContents();
    console.log("H2 sections:", h2s);

    // Should have 8 sections
    const sections = await page.locator("section, [class*='section'], [class*='slide']").count();
    console.log("Section count:", sections);

    await page.screenshot({ path: "test-results/prezentace-top.png" });
  });

  test("Mapa ČR s piny", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Check for map elements
    const mapContainer = page.locator(".leaflet-container, [class*='map'], svg[class*='map']").first();
    const mapCount = await page.locator(".leaflet-container, [class*='map'], svg").count();
    console.log("Map elements count:", mapCount);

    // SVG map with pins
    const svgElements = await page.locator("svg").count();
    console.log("SVG elements:", svgElements);

    // Check for city pins/markers
    const pins = await page.locator("circle, [class*='pin'], [class*='marker'], [class*='dot']").count();
    console.log("Pin elements:", pins);
  });

  test("QR kód", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Check for QR code canvas or SVG
    const qrCanvas = await page.locator("canvas, svg[class*='qr'], [class*='qr']").count();
    console.log("QR elements:", qrCanvas);

    // Also check for img with qr in src/alt
    const qrImg = await page.locator("img[alt*='QR'], img[src*='qr'], canvas").count();
    console.log("QR img/canvas:", qrImg);
  });

  test("Dot navigation", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Dot nav - small circular navigation elements
    const dots = await page.locator('[class*="dot"], [class*="nav"] button, [class*="indicator"]').count();
    console.log("Dot nav elements:", dots);

    await page.screenshot({ path: "test-results/prezentace-nav.png" });
  });

  test("Scroll snap / sections", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Check scroll snap CSS
    const scrollSnap = await page.locator('[class*="snap"], [style*="scroll-snap"]').count();
    console.log("Scroll snap elements:", scrollSnap);

    // Scroll through page
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prezentace-scroll1.png" });

    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prezentace-scroll2.png" });
  });

  test("?manager=jan-novak parametr — personalizace", async ({ page }) => {
    await page.goto("/prezentace?manager=jan-novak");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const hasManagerName = bodyText?.includes("Jan") || bodyText?.includes("Novák") || bodyText?.includes("Novak");
    console.log("Manager name visible:", hasManagerName);

    // Check for manager info
    const managerElements = await page.locator('[class*="manager"], [class*="profile"]').count();
    console.log("Manager elements:", managerElements);

    await page.screenshot({ path: "test-results/prezentace-manager.png", fullPage: false });
  });

  test("Framer Motion animace — přítomnost", async ({ page }) => {
    await page.goto("/prezentace");
    // Don't wait for networkidle - check during load for animations
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Check for motion elements (framer renders as regular divs with style transforms)
    const motionElements = await page.locator('[style*="transform"], [style*="opacity"]').count();
    console.log("Animated elements:", motionElements);

    // Check for will-change (framer motion indicator)
    const willChange = await page.locator('[style*="will-change"]').count();
    console.log("Will-change elements:", willChange);
  });
});

test.describe("Ostatní sekce — rychlý audit", () => {
  test("Homepage — hero, karty, navigace", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    const h1 = await page.locator("h1").first().textContent();
    console.log("Homepage H1:", h1?.trim());
    await page.screenshot({ path: "test-results/homepage.png" });
  });

  test("/nabidka — katalog vozidel", async ({ page }) => {
    await page.goto("/nabidka");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    const h1 = await page.locator("h1").first().textContent();
    console.log("Nabídka H1:", h1?.trim());
    await page.screenshot({ path: "test-results/nabidka.png" });
  });

  test("/makleri — seznam makléřů", async ({ page }) => {
    await page.goto("/makleri");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    // Check for broker cards
    const cards = await page.locator('[class*="card"], article').count();
    console.log("Broker cards:", cards);
    await page.screenshot({ path: "test-results/makleri.png" });
  });

  test("/dily — eshop autodíly", async ({ page }) => {
    await page.goto("/dily");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    const h1 = await page.locator("h1").first().textContent();
    console.log("Dily H1:", h1?.trim());
    await page.screenshot({ path: "test-results/dily.png" });
  });

  test("/marketplace — investiční platforma", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/marketplace.png" });
  });

  test("/inzerce — inzertní platforma", async ({ page }) => {
    await page.goto("/inzerce");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/inzerce.png" });
  });

  test("/o-nas — o nás stránka", async ({ page }) => {
    await page.goto("/o-nas");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await page.screenshot({ path: "test-results/o-nas.png" });
  });

  test("/kontakt — kontaktní stránka", async ({ page }) => {
    await page.goto("/kontakt");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    // Check for contact form
    const form = await page.locator("form").count();
    console.log("Contact forms:", form);
    await page.screenshot({ path: "test-results/kontakt.png" });
  });

  test("/prihlaseni — přihlašovací formulář", async ({ page }) => {
    await page.goto("/prihlaseni");
    await page.waitForLoadState("networkidle");
    const email = page.locator('input[type="email"]').first();
    await expect(email).toBeVisible();
    const password = page.locator('input[type="password"]').first();
    await expect(password).toBeVisible();
    await page.screenshot({ path: "test-results/prihlaseni.png" });
  });

  test("/registrace — registrační stránka", async ({ page }) => {
    await page.goto("/registrace");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await page.screenshot({ path: "test-results/registrace.png" });
  });

  test("/makler/dashboard — redirect na login", async ({ page }) => {
    await page.goto("/makler/dashboard");
    await expect(page).toHaveURL(/login/);
    console.log("PWA redirect OK:", page.url());
  });

  test("/admin/dashboard — redirect na login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/login/);
    console.log("Admin redirect OK:", page.url());
  });
});
