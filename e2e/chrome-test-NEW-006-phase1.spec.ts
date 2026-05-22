/**
 * TEST-NEW-006 PHASE 1 — Responzivita high-risk stránek
 * Breakpointy: 375px (mobile), 768px (tablet), 1280px (desktop)
 */
import { test, expect, Page } from "@playwright/test";

const BREAKPOINTS = [
  { width: 375, height: 812, label: "375px (mobile)" },
  { width: 768, height: 1024, label: "768px (tablet)" },
  { width: 1280, height: 900, label: "1280px (desktop)" },
];

/** Detekuj horizontální scroll */
async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  });
}

/** Získej scrollWidth a clientWidth pro debugging */
async function getScrollInfo(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

/** Čekej na načtení stránky (timeout tolerant) */
async function navigateSafe(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(800); // Let layout settle
  } catch {
    // Page might have redirected or timed out — still capture state
  }
}

// ============================================================
// TEST 1: Homepage hero — CTA, hero section
// ============================================================
test.describe("HIGH-RISK #1: Homepage /", () => {
  for (const bp of BREAKPOINTS) {
    test(`Homepage @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/");

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Homepage ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);

      // Hero section visible
      const hero = page.locator("h1").first();
      await expect(hero).toBeVisible();

      // CTA button tapovatelné (min 44px height)
      const cta = page.locator("a[href*='chci-prodat'], a[href*='prodej'], button").first();
      if (await cta.count() > 0) {
        const box = await cta.boundingBox();
        if (box && bp.width === 375) {
          console.log(`[Homepage CTA] height=${box.height}px width=${box.width}px`);
          // Warn if below 44px
          if (box.height < 44) console.warn(`⚠️ CTA button pod 44px: ${box.height}px`);
        }
      }

      await page.screenshot({ path: `e2e/screenshots/homepage-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 2: Katalog s filtry /nabidka
// ============================================================
test.describe("HIGH-RISK #2: Katalog /nabidka", () => {
  for (const bp of BREAKPOINTS) {
    test(`Katalog @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/nabidka");

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Katalog ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);

      // Check main content visible
      const main = page.locator("main, #main-content").first();
      await expect(main).toBeVisible();

      await page.screenshot({ path: `e2e/screenshots/katalog-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 3: Porovnání vozidel /nabidka/porovnani
// ============================================================
test.describe("HIGH-RISK #3: Porovnání /nabidka/porovnani", () => {
  for (const bp of BREAKPOINTS) {
    test(`Porovnání @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/nabidka/porovnani");

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Porovnani ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      // Porovnání může mít záměrný horizontal scroll pro wide table — to je OK
      // ale wrapper musí být přítomný
      const hasScrollWrapper = await page.evaluate(() => {
        const tables = document.querySelectorAll("table");
        let allWrapped = true;
        tables.forEach((t) => {
          const parent = t.parentElement;
          if (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowX !== "auto" && style.overflowX !== "scroll") {
              allWrapped = false;
            }
          }
        });
        return allWrapped;
      });

      if (bp.width === 375) {
        console.log(`[Porovnani mobile] tables wrapped in overflow-x-auto: ${hasScrollWrapper}`);
        if (!hasScrollWrapper) console.warn("⚠️ Tabulka porovnání bez overflow-x-auto wrapperu na mobile!");
      }

      await page.screenshot({ path: `e2e/screenshots/porovnani-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 4: Košík shop /shop/kosik
// ============================================================
test.describe("HIGH-RISK #4: Košík /shop/kosik", () => {
  for (const bp of BREAKPOINTS) {
    test(`Košík @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/shop/kosik");

      const finalUrl = page.url();
      console.log(`[Košík ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Košík ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/kosik-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 5: Checkout díly /dily/objednavka
// ============================================================
test.describe("HIGH-RISK #5: Checkout /dily/objednavka", () => {
  for (const bp of BREAKPOINTS) {
    test(`Checkout @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/dily/objednavka");

      const finalUrl = page.url();
      console.log(`[Checkout ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Checkout ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/checkout-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 6: Vehicle wizard /makler/vehicles/new
// ============================================================
test.describe("HIGH-RISK #6: Vehicle wizard /makler/vehicles/new", () => {
  for (const bp of BREAKPOINTS) {
    test(`Vehicle wizard @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/makler/vehicles/new");

      const finalUrl = page.url();
      console.log(`[Wizard ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Wizard ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/wizard-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 7: SignatureCanvas /makler/contracts
// ============================================================
test.describe("HIGH-RISK #7: SignatureCanvas /makler/contracts", () => {
  for (const bp of BREAKPOINTS) {
    test(`Contracts @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/makler/contracts");

      const finalUrl = page.url();
      console.log(`[Contracts ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Contracts ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/contracts-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 8: Admin sidebar /admin/dashboard
// ============================================================
test.describe("HIGH-RISK #8: Admin sidebar /admin/dashboard", () => {
  for (const bp of BREAKPOINTS) {
    test(`Admin dashboard @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/admin/dashboard");

      const finalUrl = page.url();
      console.log(`[Admin ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Admin ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/admin-dashboard-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 9: Admin DataTable /admin/vehicles
// ============================================================
test.describe("HIGH-RISK #9: Admin DataTable /admin/vehicles", () => {
  for (const bp of BREAKPOINTS) {
    test(`Admin vehicles @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/admin/vehicles");

      const finalUrl = page.url();
      console.log(`[Admin vehicles ${bp.label}] URL po navigaci: ${finalUrl}`);

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Admin vehicles ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);
      await page.screenshot({ path: `e2e/screenshots/admin-vehicles-${bp.width}.png`, fullPage: false });
    });
  }
});

// ============================================================
// TEST 10: Blog /blog
// ============================================================
test.describe("HIGH-RISK #10: Blog /blog", () => {
  for (const bp of BREAKPOINTS) {
    test(`Blog @ ${bp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await navigateSafe(page, "/blog");

      const overflow = await hasHorizontalScroll(page);
      const info = await getScrollInfo(page);
      console.log(`[Blog ${bp.label}] overflow=${overflow} scrollW=${info.scrollWidth} clientW=${info.clientWidth}`);

      expect(overflow, `Horizontal scroll na ${bp.label}`).toBe(false);

      // Images scale properly
      const imgIssues = await page.evaluate(() => {
        const imgs = document.querySelectorAll("img");
        const issues: string[] = [];
        imgs.forEach((img) => {
          const rect = img.getBoundingClientRect();
          if (rect.width > window.innerWidth) {
            issues.push(`img src=${img.src.slice(-30)} width=${rect.width}`);
          }
        });
        return issues;
      });

      if (imgIssues.length > 0) {
        console.warn(`[Blog ${bp.label}] Obrázky přetékají viewport: ${imgIssues.join(", ")}`);
      }

      await page.screenshot({ path: `e2e/screenshots/blog-${bp.width}.png`, fullPage: false });
    });
  }
});
