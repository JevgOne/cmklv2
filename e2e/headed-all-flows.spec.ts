/**
 * HEADED Chrome — Kompletní user flows
 * Spustit: npx playwright test /tmp/headed-all-flows.spec.ts --headed --project="Desktop Chrome"
 *
 * Pokryté flows:
 *  1. Registrace dodavatele
 *  2. Registrace partnera
 *  3. Login (nesprávné heslo → chybová zpráva)
 *  4. Login admin → admin dashboard
 *  5. Admin panel — navigace sekcemi
 *  6. Inzerce — 6-krokový wizard
 *  7. E-shop — procházení, košík
 *  8. Kontaktní formulář
 *  9. Zapomenuté heslo
 * 10. Logout
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const SLOW = 700; // ms pause after actions — zvýšit pro pomalejší demo

test.use({
  // Headed mode — velké okno ať je vše vidět
  viewport: { width: 1280, height: 900 },
  // Každý krok viditelně pomalý
  actionTimeout: 15_000,
  navigationTimeout: 20_000,
});

// Helper — pauza pro vizibilitu
const wait = (ms = SLOW) => new Promise((r) => setTimeout(r, ms));

// ============================================================
// FLOW 1: Registrace dodavatele
// ============================================================
test("FLOW 1 — Registrace dodavatele", async ({ page }) => {
  await page.goto(`${BASE}/registrace/dodavatel`);
  await wait();

  await expect(page.locator("h1")).toBeVisible();
  await wait();

  // Vyplnit formulář
  const name = page.locator('input[placeholder*="firma"], input[placeholder*="Firma"], input[placeholder*="název"], input[name="companyName"], input[name="name"]').first();
  const email = page.locator('input[type="email"]').first();
  const phone = page.locator('input[type="tel"], input[placeholder*="telefon"], input[placeholder*="Telefon"]').first();

  if (await name.isVisible()) {
    await name.fill("Test Vrakoviště s.r.o.");
    await wait(400);
  }
  if (await email.isVisible()) {
    await email.fill("testdodavatel@example.cz");
    await wait(400);
  }
  if (await phone.isVisible()) {
    await phone.fill("+420 777 123 456");
    await wait(400);
  }

  // Vyplnit zbylé inputy
  const inputs = page.locator("input:visible");
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute("type");
    const val = await inp.inputValue();
    if (val === "" && type !== "submit" && type !== "checkbox" && type !== "radio") {
      await inp.fill("Test hodnota");
      await wait(300);
    }
  }

  // Screenshot před odesláním
  await page.screenshot({ path: "/tmp/flow1-registrace-dodavatel.png" });
  await wait();
});

// ============================================================
// FLOW 2: Registrace partnera
// ============================================================
test("FLOW 2 — Registrace partnera", async ({ page }) => {
  await page.goto(`${BASE}/registrace/partner`);
  await wait();

  await expect(page.locator("h1")).toBeVisible();
  const h1 = await page.locator("h1").first().innerText();
  console.log("H1:", h1);

  const inputs = page.locator("input:visible");
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute("type");
    if (type === "email") {
      await inp.fill("testpartner@example.cz");
    } else if (type === "tel") {
      await inp.fill("+420 777 000 111");
    } else if (type !== "submit" && type !== "checkbox" && type !== "radio") {
      const val = await inp.inputValue();
      if (val === "") await inp.fill("Testovací hodnota");
    }
    await wait(300);
  }

  await page.screenshot({ path: "/tmp/flow2-registrace-partner.png" });
  await wait();
});

// ============================================================
// FLOW 3: Login — špatné heslo → chybová zpráva
// ============================================================
test("FLOW 3 — Login špatné heslo", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await wait();

  await page.locator('input[type="email"], input[name="email"]').first().fill("spatny@email.cz");
  await wait(400);
  await page.locator('input[type="password"], input[name="password"]').first().fill("spatneheslo");
  await wait(400);

  await page.locator('button[type="submit"]').first().click();
  await wait(1500); // počkat na odpověď

  // Chybová zpráva by se měla zobrazit
  const errorMsg = page.getByText(/nesprávný|incorrect|chyba|error/i);
  const hasError = (await errorMsg.count()) > 0;
  console.log("FLOW 3 — Error msg zobrazena:", hasError);

  await page.screenshot({ path: "/tmp/flow3-login-spatne-heslo.png" });
  await wait();
});

// ============================================================
// FLOW 4: Login admin → admin dashboard
// ============================================================
test("FLOW 4 — Login admin → admin dashboard", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await wait();

  await page.locator('input[type="email"], input[name="email"]').first().fill("admin@carmakler.cz");
  await wait(400);
  await page.locator('input[type="password"], input[name="password"]').first().fill("heslo123");
  await wait(400);

  await page.locator('button[type="submit"]').first().click();
  await wait(2000); // počkat na redirect

  const url = page.url();
  console.log("FLOW 4 — URL po loginu:", url);

  // Měl by být na /admin/dashboard nebo /makler/dashboard
  const isOnDashboard = url.includes("dashboard") || url.includes("admin");
  expect(isOnDashboard).toBeTruthy();

  await page.screenshot({ path: "/tmp/flow4-admin-dashboard.png" });
  await wait();
});

// ============================================================
// FLOW 5: Admin panel — navigace sekcemi
// ============================================================
test("FLOW 5 — Admin navigace sekcemi", async ({ page }) => {
  // Nejprve se přihlásit
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"], input[name="email"]').first().fill("admin@carmakler.cz");
  await page.locator('input[type="password"], input[name="password"]').first().fill("heslo123");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
  await wait();

  // Navigace po admin sekcích
  const adminSections = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/vehicles", label: "Vozidla" },
    { path: "/admin/inzerce", label: "Inzerce" },
    { path: "/admin/brokers", label: "Makléři" },
    { path: "/admin/leads", label: "Leady" },
    { path: "/admin/marketplace", label: "Marketplace" },
    { path: "/admin/payments", label: "Platby" },
  ];

  for (const section of adminSections) {
    await page.goto(`${BASE}${section.path}`);
    await wait(800);
    const h1 = await page.locator("h1, h2").first().innerText().catch(() => "–");
    console.log(`FLOW 5 — ${section.label}: ${h1}`);
    await page.screenshot({ path: `/tmp/flow5-admin-${section.label.toLowerCase()}.png` });
  }
});

// ============================================================
// FLOW 6: Inzerce — 6-krokový wizard přidání inzerátu
// ============================================================
test("FLOW 6 — Inzerce wizard", async ({ page }) => {
  await page.goto(`${BASE}/inzerce/pridat`);
  await wait();

  await expect(page.locator("h1")).toBeVisible();
  const h1 = await page.locator("h1").first().innerText();
  console.log("FLOW 6 — H1:", h1);

  // Krok 1: VIN
  const vinInput = page.locator('input[placeholder*="VIN"], input[placeholder*="vin"], input[name="vin"]').first();
  if (await vinInput.isVisible()) {
    await vinInput.fill("WBA3A5C50DF356498"); // testovací VIN BMW
    await wait(500);
  }

  // Přeskočit VIN → button
  const skipBtn = page.getByText(/přeskočit VIN|přeskočit vin/i).first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await wait(800);
  }

  await page.screenshot({ path: "/tmp/flow6-inzerce-krok1.png" });

  // Krok 2: Údaje o vozidle
  await wait();
  const step2inputs = page.locator("input:visible");
  const s2count = await step2inputs.count();
  if (s2count > 0) {
    // Vyplnit první select/input pro značku
    const brandInput = page.locator('input[placeholder*="Značka"], select[name*="brand"], select[name*="make"]').first();
    if (await brandInput.isVisible()) {
      await brandInput.fill("BMW");
      await wait(400);
    }

    // Cena
    const priceInput = page.locator('input[placeholder*="cena"], input[placeholder*="Cena"], input[name*="price"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill("250000");
      await wait(400);
    }
  }

  await page.screenshot({ path: "/tmp/flow6-inzerce-krok2.png" });
  await wait();
});

// ============================================================
// FLOW 7: E-shop — procházení kategorií + košík
// ============================================================
test("FLOW 7 — E-shop a košík", async ({ page }) => {
  // Shop homepage
  await page.goto(`${BASE}/dily`);
  await wait();

  await expect(page.locator("h1")).toBeVisible();
  const h1 = await page.locator("h1").first().innerText();
  console.log("FLOW 7 — Dily H1:", h1);

  // Kliknout na první kategorii
  const firstCard = page.locator("a[href*='/dily/']").first();
  if (await firstCard.isVisible()) {
    const cardHref = await firstCard.getAttribute("href");
    console.log("FLOW 7 — Klikám na kategorii:", cardHref);
    await firstCard.click();
    await wait(1000);
    await page.screenshot({ path: "/tmp/flow7-dily-kategorie.png" });
  }

  // Košík
  await page.goto(`${BASE}/dily/kosik`);
  await wait();
  const kosikText = await page.locator("body").innerText();
  const isEmpty = kosikText.toLowerCase().includes("prázdný") || kosikText.toLowerCase().includes("empty");
  console.log("FLOW 7 — Košík prázdný:", isEmpty);

  await page.screenshot({ path: "/tmp/flow7-kosik.png" });

  // Shop (alternativní URL)
  await page.goto(`${BASE}/shop`);
  await wait();
  await page.screenshot({ path: "/tmp/flow7-shop.png" });
  await wait();
});

// ============================================================
// FLOW 8: Kontaktní formulář
// ============================================================
test("FLOW 8 — Kontaktní formulář", async ({ page }) => {
  await page.goto(`${BASE}/kontakt`);
  await wait();

  await expect(page.locator("h1")).toBeVisible();

  // Počkat na CSR komponentu
  await page.waitForLoadState("networkidle");
  await wait(500);

  const nameInput = page.locator('input[name="name"], input[placeholder*="Jméno"], input[placeholder*="jméno"]').first();
  const emailInput = page.locator('input[type="email"]').first();
  const msgInput = page.locator("textarea").first();

  if (await nameInput.isVisible()) {
    await nameInput.fill("Test Uživatel");
    await wait(400);
  }
  if (await emailInput.isVisible()) {
    await emailInput.fill("test@example.cz");
    await wait(400);
  }
  if (await msgInput.isVisible()) {
    await msgInput.fill("Testovací zpráva z automatického testu. Dobrý den, mám zájem o vaše služby.");
    await wait(400);
  }

  await page.screenshot({ path: "/tmp/flow8-kontakt-vyplneno.png" });

  // Odeslat
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await wait(1500);
    await page.screenshot({ path: "/tmp/flow8-kontakt-odeslano.png" });
  }

  await wait();
});

// ============================================================
// FLOW 9: Zapomenuté heslo
// ============================================================
test("FLOW 9 — Zapomenuté heslo", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await wait();

  // Kliknutí na odkaz "Zapomenuté heslo?"
  const forgotLink = page.locator('a[href*="zapomenute-heslo"]').first();
  await expect(forgotLink).toBeVisible();
  console.log("FLOW 9 — Link href:", await forgotLink.getAttribute("href"));
  await forgotLink.click();
  await wait(800);

  // Na stránce /zapomenute-heslo
  await expect(page).toHaveURL(/zapomenute-heslo/);
  await expect(page.locator("h1")).toBeVisible();

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill("test@example.cz");
  await wait(400);

  await page.screenshot({ path: "/tmp/flow9-zapomenute-heslo.png" });

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  await wait(1500);

  // Potvrzovací zpráva
  const confirmMsg = page.getByText(/odeslali|odeslán|zkontrolujte|email/i).first();
  const hasConfirm = (await confirmMsg.count()) > 0;
  console.log("FLOW 9 — Potvrzení zobrazeno:", hasConfirm);

  await page.screenshot({ path: "/tmp/flow9-zapomenute-heslo-odeslano.png" });
  await wait();
});

// ============================================================
// FLOW 10: Logout
// ============================================================
test("FLOW 10 — Logout", async ({ page }) => {
  // Přihlásit se
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"], input[name="email"]').first().fill("admin@carmakler.cz");
  await page.locator('input[type="password"], input[name="password"]').first().fill("heslo123");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
  await wait(800);

  console.log("FLOW 10 — Přihlášen, URL:", page.url());

  // Odhlásit přes NextAuth API
  await page.goto(`${BASE}/api/auth/signout`);
  await wait(800);

  // Kliknout na tlačítko "Sign out" na NextAuth stránce
  const signoutBtn = page.locator('button[type="submit"], button:has-text("Sign out"), button:has-text("Odhlásit")').first();
  if (await signoutBtn.isVisible()) {
    await signoutBtn.click();
    await wait(1500);
  }

  const urlAfter = page.url();
  console.log("FLOW 10 — URL po odhlášení:", urlAfter);

  // Ověřit session zrušena
  await page.goto(`${BASE}/admin/dashboard`);
  await wait(1000);
  const redirectedToLogin = page.url().includes("login");
  console.log("FLOW 10 — Admin redirect na login:", redirectedToLogin);
  expect(redirectedToLogin).toBeTruthy();

  await page.screenshot({ path: "/tmp/flow10-logout-redirect.png" });
  await wait();
});
