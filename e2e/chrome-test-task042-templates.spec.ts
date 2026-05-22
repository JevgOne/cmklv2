import { test, expect } from "@playwright/test";
import path from "path";

const TEMPLATES_DIR = path.resolve(__dirname, "../docs/presentations");

function fileUrl(name: string) {
  return `file://${TEMPLATES_DIR}/${name}`;
}

const TEMPLATES = [
  {
    file: "landing-page-sablona.html",
    name: "Landing page šablona",
    expectedTexts: ["CarMakler", "landing", "SEO"],
    type: "wireframe",
  },
  {
    file: "obchodni-prezentace.html",
    name: "Obchodní prezentace",
    expectedTexts: ["CarMakler"],
    type: "landscape",
  },
  {
    file: "marketplace-investori.html",
    name: "Marketplace investoři",
    expectedTexts: ["CarMakler", "invest"],
    type: "landscape",
  },
  {
    file: "onboarding-makler.html",
    name: "Onboarding makléře",
    expectedTexts: ["CarMakler", "onboarding"],
    type: "landscape",
  },
  {
    file: "cenik-sluzeb.html",
    name: "Ceník služeb",
    expectedTexts: ["CarMakler"],
    type: "landscape",
  },
  {
    file: "faktura-sablona.html",
    name: "Faktura šablona",
    expectedTexts: ["CarMakler", "Faktura"],
    type: "portrait-A4",
  },
];

for (const tpl of TEMPLATES) {
  test(`Visual: ${tpl.name} (${tpl.file})`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Set viewport based on type
    if (tpl.type === "portrait-A4") {
      await page.setViewportSize({ width: 794, height: 1123 }); // A4 portrait ~96dpi
    } else if (tpl.type === "wireframe") {
      await page.setViewportSize({ width: 1280, height: 900 });
    } else {
      await page.setViewportSize({ width: 1122, height: 794 }); // A4 landscape ~96dpi
    }

    await page.goto(fileUrl(tpl.file), { waitUntil: "load" });
    await page.waitForTimeout(2000); // allow Google Fonts to load

    const screenshotName = tpl.file.replace(".html", "");
    await page.screenshot({
      path: `test-results/t042-${screenshotName}.png`,
      fullPage: true,
    });

    // Check basic presence
    const bodyText = await page.textContent("body");
    const hasCarMakler = bodyText?.toLowerCase().includes("carmakler") ||
                          bodyText?.toLowerCase().includes("car makler") ||
                          bodyText?.includes("Carmakler");

    // Check for orange color usage (brand color #F97316)
    const hasOrangeColor = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        const border = style.borderColor;
        if (
          bg.includes("249, 115, 22") || // rgb of #F97316
          color.includes("249, 115, 22") ||
          border.includes("249, 115, 22") ||
          (el as HTMLElement).style.background?.includes("#F97316") ||
          (el as HTMLElement).style.background?.includes("#f97316")
        ) {
          return true;
        }
      }
      return false;
    });

    // Check Outfit font is specified
    const hasOutfitFont = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return style.fontFamily.toLowerCase().includes("outfit");
    });

    // Check page is not blank (has meaningful content)
    const textLength = (bodyText || "").replace(/\s+/g, " ").trim().length;

    // Check for critical JS errors
    const criticalErrors = consoleErrors.filter(
      (e) => (e.includes("SyntaxError") || e.includes("ReferenceError")) &&
               !e.includes("fonts")
    );

    console.log(`\n=== ${tpl.name} ===`);
    console.log(`URL: ${fileUrl(tpl.file)}`);
    console.log(`Text length: ${textLength} chars`);
    console.log(`Has CarMakler brand: ${hasCarMakler}`);
    console.log(`Has orange (#F97316): ${hasOrangeColor}`);
    console.log(`Has Outfit font: ${hasOutfitFont}`);
    console.log(`Critical JS errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) console.log(`Errors:`, criticalErrors);

    // Assertions
    expect(textLength).toBeGreaterThan(100); // not blank
    expect(hasCarMakler).toBeTruthy();
    expect(criticalErrors.length).toBe(0);
  });
}

// Print preview simulation — check @page CSS exists
test("Print CSS: all templates have @page rule", async ({ page }) => {
  for (const tpl of TEMPLATES) {
    await page.goto(fileUrl(tpl.file), { waitUntil: "load" });

    const hasPageRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText.includes("@page")) return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });

    const hasPrintColorAdjust = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      // check inline styles for print-color-adjust
      return document.documentElement.innerHTML.includes("print-color-adjust");
    });

    console.log(`${tpl.file}: @page=${hasPageRule}, print-color-adjust=${hasPrintColorAdjust}`);
    expect(hasPageRule).toBeTruthy();
  }
});

// Faktura: check specific invoice elements
test("Faktura: contains invoice-specific elements", async ({ page }) => {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.goto(fileUrl("faktura-sablona.html"), { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const bodyText = await page.textContent("body") || "";
  const hasFaktura = bodyText.toLowerCase().includes("faktura") || bodyText.toLowerCase().includes("invoice");
  const hasCelkem = bodyText.toLowerCase().includes("celkem") || bodyText.toLowerCase().includes("total");
  const hasDph = bodyText.toLowerCase().includes("dph") || bodyText.toLowerCase().includes("vat") || bodyText.toLowerCase().includes("%");
  const hasQrOrIban = bodyText.toLowerCase().includes("iban") || bodyText.toLowerCase().includes("qr") || bodyText.toLowerCase().includes("účet") || bodyText.toLowerCase().includes("ucet");

  await page.screenshot({ path: "test-results/t042-faktura-detail.png" });

  console.log("\n=== Faktura detail ===");
  console.log(`Has 'Faktura': ${hasFaktura}`);
  console.log(`Has 'Celkem': ${hasCelkem}`);
  console.log(`Has DPH/VAT/%: ${hasDph}`);
  console.log(`Has IBAN/QR/účet: ${hasQrOrIban}`);

  expect(hasFaktura).toBeTruthy();
  expect(hasCelkem).toBeTruthy();
});

// Ceník: check pricing elements
test("Ceník: contains pricing information", async ({ page }) => {
  await page.setViewportSize({ width: 1122, height: 794 });
  await page.goto(fileUrl("cenik-sluzeb.html"), { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const bodyText = await page.textContent("body") || "";
  const hasCena = bodyText.toLowerCase().includes("cena") || bodyText.toLowerCase().includes("kč") || bodyText.toLowerCase().includes("provize");
  const hasPercent = bodyText.includes("%");
  const hasServices = bodyText.toLowerCase().includes("inzer") || bodyText.toLowerCase().includes("makléř") || bodyText.toLowerCase().includes("makler");

  await page.screenshot({ path: "test-results/t042-cenik-detail.png" });

  console.log("\n=== Ceník detail ===");
  console.log(`Has pricing (Kč/%): ${hasCena || hasPercent}`);
  console.log(`Has services: ${hasServices}`);

  expect(hasCena || hasPercent).toBeTruthy();
});
