/**
 * PWA — kompletní test obou aplikací (Makléř + Dodavatel dílů)
 * Spustit: npx playwright test e2e/pwa-flows.spec.ts --headed --project=chromium --workers=1
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 14 — PWA je mobile-first
  actionTimeout: 15_000,
  navigationTimeout: 20_000,
});

// Helper: login via NextAuth
async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  // Zavřít cookie banner
  const cookieBtn = page.locator('button:has-text("Přijmout vše")');
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

// =============================================
// MAKLÉŘ PWA
// =============================================
// Skrýt Next.js dev overlay který v mobile viewportu překrývá bottom nav.
// Injektujeme přes <style> do <head> při každém page loadu.
async function hideNextDevOverlay(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const inject = () => {
      if (document.getElementById("hide-next-overlay")) return;
      const s = document.createElement("style");
      s.id = "hide-next-overlay";
      s.textContent = "nextjs-portal{display:none!important}";
      document.head?.appendChild(s);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", inject);
    } else {
      inject();
    }
  });
}

test.describe("Makléř PWA", () => {
  test.beforeEach(async ({ page }) => {
    await hideNextDevOverlay(page);
    await login(page, "prodejce@email.cz", "heslo123");
  });

  test("Dashboard — načte se, zobrazuje statistiky", async ({ page }) => {
    await page.goto(`${BASE}/makler/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-dashboard.png" });

    // TopBar viditelný
    await expect(page.locator("text=CarMakléř")).toBeVisible({ timeout: 5000 });

    // Nějaký obsah dashboardu
    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ DASHBOARD:", body.substring(0, 300));

    // BottomNav — 5 tlačítek
    const navItems = await page.locator("nav a, nav button").count();
    console.log("  BottomNav items:", navItems);
  });

  test("Vozidla — seznam + tlačítko přidat", async ({ page }) => {
    await page.goto(`${BASE}/makler/vehicles`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-vehicles.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ VEHICLES:", body.substring(0, 300));

    // Mělo by být buď seznam vozidel nebo empty state
    expect(body.length).toBeGreaterThan(50);
  });

  test("Nové vozidlo — VIN krok", async ({ page }) => {
    await page.goto(`${BASE}/makler/vehicles/new/vin`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-new-vin.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ NEW VIN:", body.substring(0, 300));

    // Měl by být VIN input
    const vinInput = page.locator('input[placeholder*="VIN"], input[name*="vin"], input[id*="vin"]');
    const hasVinInput = await vinInput.count();
    console.log("  VIN input found:", hasVinInput > 0);
  });

  test("Nové vozidlo — Quick mode", async ({ page }) => {
    await page.goto(`${BASE}/makler/vehicles/quick`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-quick.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ QUICK:", body.substring(0, 300));
  });

  test("Kontakty — seznam CRM", async ({ page }) => {
    await page.goto(`${BASE}/makler/contacts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-contacts.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ CONTACTS:", body.substring(0, 300));
  });

  test("Nový kontakt — formulář", async ({ page }) => {
    await page.goto(`${BASE}/makler/contacts/new`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-contacts-new.png" });

    const inputs = await page.locator("input:visible").count();
    console.log("MAKLÉŘ NEW CONTACT — inputs:", inputs);
  });

  test("Zprávy", async ({ page }) => {
    await page.goto(`${BASE}/makler/messages`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-messages.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ MESSAGES:", body.substring(0, 200));
  });

  test("Leady", async ({ page }) => {
    await page.goto(`${BASE}/makler/leads`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-leads.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ LEADS:", body.substring(0, 200));
  });

  test("Smlouvy — seznam", async ({ page }) => {
    await page.goto(`${BASE}/makler/contracts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-contracts.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ CONTRACTS:", body.substring(0, 200));
  });

  test("Nová smlouva — formulář", async ({ page }) => {
    await page.goto(`${BASE}/makler/contracts/new`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-contracts-new.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ NEW CONTRACT:", body.substring(0, 200));
  });

  test("Provize", async ({ page }) => {
    await page.goto(`${BASE}/makler/commissions`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-commissions.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ COMMISSIONS:", body.substring(0, 200));
  });

  test("Statistiky", async ({ page }) => {
    await page.goto(`${BASE}/makler/stats`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-stats.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ STATS:", body.substring(0, 200));
  });

  test("Leaderboard", async ({ page }) => {
    await page.goto(`${BASE}/makler/leaderboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-leaderboard.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ LEADERBOARD:", body.substring(0, 200));
  });

  test("Kalkulačka financování", async ({ page }) => {
    await page.goto(`${BASE}/makler/financing-calculator`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-financing.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ FINANCING:", body.substring(0, 200));

    // Zkusit interakci — najít slidery nebo inputy
    const inputs = await page.locator("input:visible").count();
    console.log("  Inputs:", inputs);
  });

  test("Profil — zobrazení + editace", async ({ page }) => {
    await page.goto(`${BASE}/makler/profile`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-profile.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ PROFILE:", body.substring(0, 300));
  });

  test("Nastavení", async ({ page }) => {
    await page.goto(`${BASE}/makler/settings`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-settings.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ SETTINGS:", body.substring(0, 200));
  });

  test("Offline stránka", async ({ page }) => {
    await page.goto(`${BASE}/makler/offline`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-offline.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ OFFLINE:", body.substring(0, 200));
  });

  test("Onboarding flow", async ({ page }) => {
    await page.goto(`${BASE}/makler/onboarding`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-makler-onboarding.png" });

    const body = await page.locator("body").innerText();
    console.log("MAKLÉŘ ONBOARDING:", body.substring(0, 300));
  });

  test("BottomNav navigace — proklikání", async ({ page }) => {
    await page.goto(`${BASE}/makler/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    const bottomNav = page.getByRole("navigation", { name: /Spodni navigace/i });

    await bottomNav.getByRole("link", { name: /Vozy|Vozidla/i }).click();
    await page.waitForURL(/\/makler\/vehicles/, { timeout: 10_000 });
    expect(page.url()).toContain("/makler/vehicles");
    console.log("BOTTOMNAV → Vehicles: OK");

    await bottomNav.getByRole("link", { name: /Kontakty/i }).click();
    await page.waitForURL(/\/makler\/contacts/, { timeout: 10_000 });
    expect(page.url()).toContain("/makler/contacts");
    console.log("BOTTOMNAV → Contacts: OK");

    await bottomNav.getByRole("link", { name: /Domů|Dashboard/i }).click();
    await page.waitForURL(/\/makler\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain("/makler/dashboard");
    console.log("BOTTOMNAV → Dashboard: OK");

    await page.screenshot({ path: "/tmp/pwa-makler-bottomnav.png" });
  });
});

// =============================================
// DODAVATEL DÍLŮ PWA
// =============================================
test.describe("Dodavatel dílů PWA", () => {
  test.beforeEach(async ({ page }) => {
    await hideNextDevOverlay(page);
    await login(page, "dodavatel@vrakoviste.cz", "heslo123");
  });

  test("Dashboard dodavatele", async ({ page }) => {
    await page.goto(`${BASE}/parts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-parts-dashboard.png" });

    const body = await page.locator("body").innerText();
    console.log("PARTS DASHBOARD:", body.substring(0, 300));

    // Ověřit TopBar
    await expect(page.locator("body")).toContainText(/Díly|Parts|CarMakléř/i);
  });

  test("Moje díly — seznam", async ({ page }) => {
    await page.goto(`${BASE}/parts/my`);
    // domcontentloaded — ne networkidle: PWA má pusher+SW sockety které networkidle nikdy neuspokojí
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector('h1:has-text("Moje díly")', { timeout: 10_000 });
    await page.screenshot({ path: "/tmp/pwa-parts-my.png" });

    const body = await page.locator("body").innerText();
    console.log("PARTS MY:", body.substring(0, 300));
  });

  test("Přidat díl — formulář", async ({ page }) => {
    await page.goto(`${BASE}/parts/new`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-parts-new.png" });

    const inputs = await page.locator("input:visible, select:visible, textarea:visible").count();
    console.log("PARTS NEW — form fields:", inputs);

    const body = await page.locator("body").innerText();
    console.log("PARTS NEW:", body.substring(0, 300));
  });

  test("Import CSV", async ({ page }) => {
    await page.goto(`${BASE}/parts/import`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-parts-import.png" });

    const body = await page.locator("body").innerText();
    console.log("PARTS IMPORT:", body.substring(0, 300));
  });

  test("Objednávky", async ({ page }) => {
    await page.goto(`${BASE}/parts/orders`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-parts-orders.png" });

    const body = await page.locator("body").innerText();
    console.log("PARTS ORDERS:", body.substring(0, 300));
  });

  test("Profil dodavatele", async ({ page }) => {
    await page.goto(`${BASE}/parts/profile`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "/tmp/pwa-parts-profile.png" });

    const body = await page.locator("body").innerText();
    console.log("PARTS PROFILE:", body.substring(0, 300));
  });

  test("BottomNav navigace", async ({ page }) => {
    await page.goto(`${BASE}/parts`);
    await page.waitForLoadState("domcontentloaded");

    // Target přesně bottom nav — na dashboardu jsou stejné href i v card listech
    const bottomNav = page.getByRole("navigation", { name: /Spodni navigace|BottomNav/i });

    await bottomNav.getByRole("link", { name: "Díly" }).click();
    await page.waitForURL(/\/parts\/my/, { timeout: 10_000 });
    expect(page.url()).toContain("/parts/my");
    console.log("PARTS BOTTOMNAV → My parts: OK");

    await bottomNav.getByRole("link", { name: "Objednávky" }).click();
    await page.waitForURL(/\/parts\/orders/, { timeout: 10_000 });
    expect(page.url()).toContain("/parts/orders");
    console.log("PARTS BOTTOMNAV → Orders: OK");

    await page.screenshot({ path: "/tmp/pwa-parts-bottomnav.png" });
  });
});
