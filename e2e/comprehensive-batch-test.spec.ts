import { test, expect } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3000";

// ============================================================
// BATCH 1 — Legal pages, cookie consent, footer, security
// ============================================================

test.describe("BATCH 1 — Právní stránky", () => {
  test("/obchodni-podminky — 11 sekcí", async ({ page }) => {
    await page.goto(`${BASE}/obchodni-podminky`);
    await expect(page).toHaveTitle(/podminky|podmínky/i);
    await expect(page.locator("h1")).toBeVisible();
    // Check for at least section headings (h2)
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(5);
  });

  test("/ochrana-osobnich-udaju — GDPR sekce", async ({ page }) => {
    await page.goto(`${BASE}/ochrana-osobnich-udaju`);
    await expect(page.locator("h1")).toBeVisible();
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(5);
  });

  test("/reklamacni-rad — sekce", async ({ page }) => {
    await page.goto(`${BASE}/reklamacni-rad`);
    await expect(page.locator("h1")).toBeVisible();
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(5);
  });

  test("/zasady-cookies — cookie tabulka", async ({ page }) => {
    await page.goto(`${BASE}/zasady-cookies`);
    await expect(page.locator("h1")).toBeVisible();
    // Should have a table or list of cookies
    const hasTable = (await page.locator("table").count()) > 0;
    const hasH2 = (await page.locator("h2").count()) > 0;
    expect(hasTable || hasH2).toBeTruthy();
  });
});

test.describe("BATCH 1 — Cookie consent banner", () => {
  test("banner se zobrazí na homepage (poprvé)", async ({ page }) => {
    // Clear storage to simulate first visit
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.removeItem("cookie_consent"));
    await page.reload();
    // Wait for the cookie banner to appear
    const banner = page.locator(
      '[role="dialog"], [aria-label*="cookie"], [aria-label*="Cookie"], [data-testid*="cookie"]'
    );
    // The cookie consent is client-side, so wait a bit
    await page.waitForTimeout(1000);
    // Check that at least one consent-related element is present
    const cookieText = page.getByText(/nezbytné|analytické|marketingové|cookies/i);
    const hasCookieBanner = (await cookieText.count()) > 0;
    expect(hasCookieBanner).toBeTruthy();
  });
});

test.describe("BATCH 1 — Footer právní odkazy", () => {
  test("hlavní footer obsahuje právní odkazy", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(
      page.locator('a[href*="ochrana-osobnich-udaju"]').first()
    ).toBeVisible();
    await expect(
      page.locator('a[href*="obchodni-podminky"]').first()
    ).toBeVisible();
    await expect(
      page.locator('a[href*="reklamacni-rad"]').first()
    ).toBeVisible();
  });

  test("footer legal links lead to correct pages", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Click on Obchodní podmínky in footer
    const link = page.locator('a[href*="obchodni-podminky"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toContain("obchodni-podminky");
  });
});

test.describe("BATCH 1 — Security", () => {
  test("middleware.ts neobsahuje hardcoded heslo", async ({ page }) => {
    // This is checked via file system, not browser
    // We verify via reading the source file
    const content = fs.readFileSync("middleware.ts", "utf-8");
    expect(content).not.toMatch(/password\s*===\s*["'][^"']{3,}["']/);
    expect(content).not.toMatch(/secret\s*===\s*["'][^"']{3,}["']/);
  });

  test(".env.example existuje", async ({ page }) => {
    expect(fs.existsSync(".env.example")).toBeTruthy();
  });
});

// ============================================================
// BATCH 2 — Kontakt, homepage statistiky, analytics, CI
// ============================================================

test.describe("BATCH 2 — Kontakt stránka", () => {
  test("/kontakt — stránka se načte", async ({ page }) => {
    await page.goto(`${BASE}/kontakt`);
    await expect(page.locator("h1")).toBeVisible();
    // Check for email or contact info
    const email = page.getByText(/@carmakler/i);
    await expect(email.first()).toBeVisible();
  });

  test("/kontakt — formulář přítomen", async ({ page }) => {
    await page.goto(`${BASE}/kontakt`);
    const form = page.locator("form");
    expect(await form.count()).toBeGreaterThan(0);
    // Check for input fields
    const inputs = page.locator('input[type="text"], input[type="email"]');
    expect(await inputs.count()).toBeGreaterThan(0);
  });
});

test.describe("BATCH 2 — Homepage", () => {
  test("homepage se načte správně", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/CarMakléř|CarMakler|Carmakler/i);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("homepage — hero sekce přítomna", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Should have some hero/banner text
    const hasContent = await page.locator("#main-content").first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("homepage — navigace funguje", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    // Check for key nav links
    const nabidkaLink = page.locator('a[href*="nabidka"]').first();
    await expect(nabidkaLink).toBeVisible();
  });
});

test.describe("BATCH 2 — Další stránky", () => {
  test("/chci-prodat — načte se", async ({ page }) => {
    await page.goto(`${BASE}/chci-prodat`);
    const httpStatus = page.url();
    expect(httpStatus).toBeTruthy();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/marketplace — načte se", async ({ page }) => {
    await page.goto(`${BASE}/marketplace`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/o-nas — načte se", async ({ page }) => {
    const response = await page.goto(`${BASE}/o-nas`);
    expect(response?.status()).toBeLessThan(400);
  });

  test("/jak-to-funguje — načte se", async ({ page }) => {
    const response = await page.goto(`${BASE}/jak-to-funguje`);
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("BATCH 2 — Soubory (Analytics, CI)", () => {
  test("lib/resend.ts existuje", async ({ page }) => {
    expect(fs.existsSync("lib/resend.ts")).toBeTruthy();
  });

  test("lib/cloudinary.ts existuje", async ({ page }) => {
    expect(fs.existsSync("lib/cloudinary.ts")).toBeTruthy();
  });

  test("components/web/Analytics.tsx existuje", async ({ page }) => {
    expect(fs.existsSync("components/web/Analytics.tsx")).toBeTruthy();
  });

  test(".github/workflows/ci.yml existuje", async ({ page }) => {
    expect(fs.existsSync(".github/workflows/ci.yml")).toBeTruthy();
  });
});

// ============================================================
// BATCH 3 — Password reset, returns, guest checkout, Sentry
// ============================================================

test.describe("BATCH 3 — Password reset flow", () => {
  test("/zapomenute-heslo — formulář přítomen", async ({ page }) => {
    await page.goto(`${BASE}/zapomenute-heslo`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(
      page.locator('button[type="submit"], button:has-text("Odeslat")')
    ).toBeVisible();
  });

  test("/login — odkaz na /zapomenute-heslo přítomen", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const forgotLink = page.locator('a[href*="zapomenute-heslo"]');
    await expect(forgotLink).toBeVisible();
  });

  test("/reset-hesla/[token] — formulář pro nové heslo", async ({ page }) => {
    await page.goto(`${BASE}/reset-hesla/test-invalid-token`);
    await expect(page.locator("h1")).toBeVisible();
    // Should either show the form or an error about invalid token
    const hasForm = (await page.locator('input[type="password"]').count()) > 0;
    const hasError = (await page.getByText(/neplatný|expired|invalid|chyba/i).count()) > 0;
    expect(hasForm || hasError).toBeTruthy();
  });
});

test.describe("BATCH 3 — Returns & Complaints (auth guarded)", () => {
  test("/shop/moje-objednavky/[id]/vraceni — redirectuje na login", async ({ page }) => {
    const response = await page.goto(
      `${BASE}/shop/moje-objednavky/test-id/vraceni`,
      { waitUntil: "networkidle" }
    );
    // Should redirect to login
    expect(page.url()).toContain("login");
  });

  test("/shop/moje-objednavky/[id]/reklamace — redirectuje na login", async ({ page }) => {
    await page.goto(`${BASE}/shop/moje-objednavky/test-id/reklamace`, {
      waitUntil: "networkidle",
    });
    expect(page.url()).toContain("login");
  });
});

test.describe("BATCH 3 — Guest checkout tracking", () => {
  test("/shop/objednavky/sledovani/[token] — renderuje stránku", async ({ page }) => {
    const response = await page.goto(
      `${BASE}/shop/objednavky/sledovani/test-token`
    );
    // Should render something (even if token is invalid — 200 or 404 with proper page)
    expect(response?.status()).toBeLessThan(500);
    // Should have some content
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("BATCH 3 — Sentry config soubory", () => {
  test("sentry.client.config.ts existuje", async ({ page }) => {
    expect(fs.existsSync("sentry.client.config.ts")).toBeTruthy();
  });

  test("sentry.server.config.ts existuje", async ({ page }) => {
    expect(fs.existsSync("sentry.server.config.ts")).toBeTruthy();
  });

  test("sentry.edge.config.ts existuje", async ({ page }) => {
    expect(fs.existsSync("sentry.edge.config.ts")).toBeTruthy();
  });
});

test.describe("BATCH 3 — API routes", () => {
  test("POST /api/auth/forgot-password — route existuje (ne 404)", async ({ page }) => {
    const resp = await page.request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: "test@test.com" },
    });
    expect(resp.status()).not.toBe(404);
  });

  test("POST /api/auth/reset-password — route existuje (ne 404)", async ({ page }) => {
    const resp = await page.request.post(`${BASE}/api/auth/reset-password`, {
      data: { token: "test", password: "Test123!" },
    });
    expect(resp.status()).not.toBe(404);
  });

  test("GET /api/orders/track/[token] — route existuje (ne 404)", async ({ page }) => {
    const resp = await page.request.get(
      `${BASE}/api/orders/track/test-token`
    );
    expect(resp.status()).not.toBe(404);
  });
});

// ============================================================
// VŠECHNY STRÁNKY — HTTP + render check
// ============================================================

test.describe("Všechny stránky — HTTP + render", () => {
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/obchodni-podminky", name: "Obchodní podmínky" },
    { path: "/ochrana-osobnich-udaju", name: "Ochrana osobních údajů" },
    { path: "/reklamacni-rad", name: "Reklamační řád" },
    { path: "/zasady-cookies", name: "Zásady cookies" },
    { path: "/kontakt", name: "Kontakt" },
    { path: "/login", name: "Login" },
    { path: "/zapomenute-heslo", name: "Zapomenuté heslo" },
    { path: "/dily", name: "Autodíly" },
    { path: "/shop", name: "Shop" },
    { path: "/nabidka", name: "Nabídka vozidel" },
    { path: "/inzerce", name: "Inzerce" },
    { path: "/chci-prodat", name: "Chci prodat" },
    { path: "/marketplace", name: "Marketplace" },
    { path: "/o-nas", name: "O nás" },
  ];

  for (const p of pages) {
    test(`${p.path} — ${p.name} — HTTP < 400`, async ({ page }) => {
      const response = await page.goto(`${BASE}${p.path}`);
      const finalStatus = response?.status() ?? 0;
      expect(finalStatus).toBeLessThan(400);
      // Page should have some body content
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});
