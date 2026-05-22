import { test, expect } from "@playwright/test";

test.describe("REDESIGN TEST — /sluzby/vykup smazán", () => {
  test("/sluzby/vykup vrací 404", async ({ page }) => {
    const response = await page.goto("/sluzby/vykup");
    const statusCode = response?.status();
    console.log("HTTP status /sluzby/vykup:", statusCode);
    expect(statusCode).toBe(404);
    await page.screenshot({ path: "test-results/redesign-vykup-404.png" });
  });
});

test.describe("REDESIGN TEST — /sluzby/financovani", () => {
  test("HTTP 200 + základní render", async ({ page }) => {
    const response = await page.goto("/sluzby/financovani");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();
    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());
  });

  test("Gradient hero — přítomnost gradientního pozadí", async ({ page }) => {
    await page.goto("/sluzby/financovani");
    await page.waitForLoadState("networkidle");

    // Check for gradient classes in hero area
    const heroEl = page.locator("section, div").first();
    const gradientCount = await page.locator('[class*="gradient"], [class*="from-"], [class*="via-"], [class*="to-"]').count();
    console.log("Gradient elements:", gradientCount);

    // Check for blur decorative circles
    const blurElements = await page.locator('[class*="blur"], [class*="rounded-full"][class*="absolute"]').count();
    console.log("Blur/decorative elements:", blurElements);

    await page.screenshot({ path: "test-results/redesign-financovani-hero.png", fullPage: false });
  });

  test("Shadow formulář s ikonou", async ({ page }) => {
    await page.goto("/sluzby/financovani");
    await page.waitForLoadState("networkidle");

    // Check for shadow on form
    const shadowElements = await page.locator('[class*="shadow"]').count();
    console.log("Shadow elements:", shadowElements);

    // Check for icon near form
    const svgIcons = await page.locator("svg").count();
    console.log("SVG icons:", svgIcons);

    // Form inputs
    const inputs = await page.locator("input:not([type='hidden']), select, textarea").count();
    const labels = await page.locator("label").allTextContents();
    console.log("Form inputs:", inputs, "Labels:", labels);

    await page.screenshot({ path: "test-results/redesign-financovani-form.png", fullPage: true });
  });

  test("H2 sekce — obsah stránky", async ({ page }) => {
    await page.goto("/sluzby/financovani");
    await page.waitForLoadState("networkidle");
    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s.slice(0, 8));
  });
});

test.describe("REDESIGN TEST — /sluzby/proverka", () => {
  test("HTTP 200 + H1", async ({ page }) => {
    const response = await page.goto("/sluzby/proverka");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Shadow formulář s ikonou", async ({ page }) => {
    await page.goto("/sluzby/proverka");
    await page.waitForLoadState("networkidle");

    const shadowElements = await page.locator('[class*="shadow"]').count();
    console.log("Shadow elements:", shadowElements);
    const svgIcons = await page.locator("svg").count();
    console.log("SVG icons:", svgIcons);
    const inputs = await page.locator("input:not([type='hidden']), select, textarea").count();
    const labels = await page.locator("label").allTextContents();
    console.log("Form inputs:", inputs, "Labels:", labels);

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s.slice(0, 8));

    await page.screenshot({ path: "test-results/redesign-proverka-full.png", fullPage: true });
  });
});

test.describe("REDESIGN TEST — /sluzby/pojisteni", () => {
  test("HTTP 200 + H1", async ({ page }) => {
    const response = await page.goto("/sluzby/pojisteni");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Shadow formulář s ikonou", async ({ page }) => {
    await page.goto("/sluzby/pojisteni");
    await page.waitForLoadState("networkidle");

    const shadowElements = await page.locator('[class*="shadow"]').count();
    console.log("Shadow elements:", shadowElements);
    const svgIcons = await page.locator("svg").count();
    console.log("SVG icons:", svgIcons);
    const inputs = await page.locator("input:not([type='hidden']), select, textarea").count();
    const labels = await page.locator("label").allTextContents();
    console.log("Form inputs:", inputs, "Labels:", labels);

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s.slice(0, 8));

    await page.screenshot({ path: "test-results/redesign-pojisteni-full.png", fullPage: true });
  });
});

test.describe("REDESIGN TEST — /prezentace kompletní redesign", () => {
  test("HTTP 200 + H1 a sekce", async ({ page }) => {
    const response = await page.goto("/prezentace");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());
    await expect(page.locator("h1").first()).toBeVisible();

    const h2s = await page.locator("h2").allTextContents();
    console.log("H2 sections:", h2s);

    const sectionCount = await page.locator("section").count();
    console.log("Sections:", sectionCount);
  });

  test("Dark/light střídání sekcí", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Check for dark background sections
    const darkSections = await page.locator('[class*="bg-gray-900"], [class*="bg-black"], [class*="bg-slate-9"], [class*="dark"]').count();
    console.log("Dark sections:", darkSections);

    // Check for light sections
    const lightSections = await page.locator('[class*="bg-white"], [class*="bg-gray-50"]').count();
    console.log("Light sections:", lightSections);

    // Screenshot hero
    await page.screenshot({ path: "test-results/redesign-prezentace-hero.png", fullPage: false });
  });

  test("Gradienty a glow efekty", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    const gradients = await page.locator('[class*="from-"], [class*="gradient"]').count();
    console.log("Gradient elements:", gradients);

    // Glow/blur decorative elements
    const glowBlur = await page.locator('[class*="blur"], [class*="glow"]').count();
    console.log("Glow/blur elements:", glowBlur);
  });

  test("Velká čísla — big numbers sekce", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Large text elements (stats/numbers)
    const bigText = await page.locator('[class*="text-6xl"], [class*="text-7xl"], [class*="text-8xl"], [class*="text-9xl"]').count();
    console.log("Big number elements:", bigText);

    // Get text of big elements
    const bigTexts = await page.locator('[class*="text-6xl"], [class*="text-7xl"], [class*="text-8xl"]').allTextContents();
    console.log("Big text content:", bigTexts.slice(0, 5));
  });

  test("Glassmorphism — backdrop blur elementy", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    const backdrop = await page.locator('[class*="backdrop"], [class*="backdrop-blur"], [class*="glass"]').count();
    console.log("Glassmorphism (backdrop-blur) elements:", backdrop);

    // Also check for bg-white/opacity patterns
    const frostedGlass = await page.locator('[class*="bg-white/"], [class*="bg-black/"]').count();
    console.log("Frosted glass (bg-white/ or bg-black/) elements:", frostedGlass);
  });

  test("Scroll snap zachován", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    const snapElements = await page.locator('[class*="snap"]').count();
    console.log("Scroll snap elements:", snapElements);
    expect(snapElements).toBeGreaterThan(0);
  });

  test("Mapa ČR na tmavém pozadí", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // SVG map present
    const svgCount = await page.locator("svg").count();
    console.log("SVG elements:", svgCount);

    // Circles/pins (city markers)
    const circles = await page.locator("circle").count();
    console.log("SVG circles (map pins):", circles);

    // Scroll to map section
    await page.evaluate(() => {
      const sections = document.querySelectorAll("section");
      if (sections.length > 2) sections[2].scrollIntoView();
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/redesign-prezentace-mapa.png" });
  });

  test("QR kód přítomen", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    const canvas = await page.locator("canvas").count();
    console.log("Canvas elements (QR):", canvas);
    expect(canvas).toBeGreaterThan(0);
  });

  test("Dot navigation s glow", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");

    // Dot nav: fixed right side, small circles
    const fixedNav = await page.locator("nav[aria-label]").count();
    console.log("Nav elements:", fixedNav);

    // Check for nav links (dot nav anchors)
    const navLinks = await page.locator("nav a").count();
    console.log("Nav links (dots):", navLinks);

    // Glow on active dot
    const orangeDots = await page.locator('[class*="orange"]').count();
    console.log("Orange elements (active dot glow):", orangeDots);

    await page.screenshot({ path: "test-results/redesign-prezentace-dotnav.png" });
  });

  test("Fullpage screenshot — celá stránka", async ({ page }) => {
    await page.goto("/prezentace");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // allow animations
    await page.screenshot({
      path: "test-results/redesign-prezentace-fullpage.png",
      fullPage: true,
    });
    console.log("Full page screenshot saved");
  });
});

test.describe("REDESIGN TEST — /prezentace?manager=jan-novak", () => {
  test("Manager personalizace funguje", async ({ page }) => {
    await page.goto("/prezentace?manager=jan-novak");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const hasName = bodyText?.includes("Jan") || bodyText?.includes("Novák") || bodyText?.includes("Novak");
    console.log("Manager name visible:", hasName);
    expect(hasName).toBe(true);

    // Check for manager contact info (phone, email)
    const hasPhone = bodyText?.includes("+420") || bodyText?.includes("tel");
    const hasEmail = bodyText?.includes("@") && bodyText?.includes("carmakler");
    console.log("Has phone:", hasPhone, "Has email:", hasEmail);

    await page.screenshot({ path: "test-results/redesign-prezentace-manager.png", fullPage: false });
  });

  test("Vizuální rozdíl vs bez parametru", async ({ page }) => {
    // With manager
    await page.goto("/prezentace?manager=jan-novak");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check for manager card/section
    const managerSections = await page.locator('[class*="manager"], [class*="contact"], [class*="profile"]').count();
    console.log("Manager/contact sections:", managerSections);

    // QR should be personalized too
    const canvas = await page.locator("canvas").count();
    console.log("Canvas (personalized QR?):", canvas);

    await page.screenshot({ path: "test-results/redesign-prezentace-manager-full.png", fullPage: false });
  });
});
