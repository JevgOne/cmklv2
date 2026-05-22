/**
 * REÁLNÝ test registrace — vyplní formulář, klikne submit, ověří výsledek.
 * Spustit: npx playwright test e2e/registration-real.spec.ts --headed --project=chromium
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const UNIQUE = Date.now();

test.use({
  viewport: { width: 1280, height: 900 },
  actionTimeout: 15_000,
  navigationTimeout: 20_000,
});

test("Registrace dodavatele — end-to-end se submitem", async ({ page }) => {
  await page.goto(`${BASE}/registrace/dodavatel`);
  await page.waitForLoadState("networkidle");

  // Zavřít cookie banner pokud existuje
  const cookieBtn = page.locator('button:has-text("Přijmout vše")');
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }

  // Ověřit správnou stránku
  await expect(page.locator("h1")).toContainText("Registrace dodavatele dílů");

  // Vyplnit každé pole přes placeholder (přesné placeholdery z kódu)
  await page.locator('input[placeholder="12345678"]').fill("87654321");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Vrakoviště s.r.o."]').fill(`Test Vrak ${UNIQUE}`);
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Jan Novák"]').fill("Pavel Testovač");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="info@vrakoviste.cz"]').fill(`playwright-${UNIQUE}@test.cz`);
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="+420 777 123 456"]').fill("+420999888777");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Minimálně 8 znaků"]').fill("TestHeslo123!");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Zopakujte heslo"]').fill("TestHeslo123!");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Průmyslová 45"]').fill("Testovací ulice 99");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="Praha"]').fill("Ostrava");
  await page.waitForTimeout(200);

  await page.locator('input[placeholder="110 00"]').fill("70100");
  await page.waitForTimeout(200);

  // Screenshot PŘED odesláním
  await page.screenshot({ path: "/tmp/reg-before-submit.png", fullPage: true });
  console.log("Formulář vyplněn, odesílám...");

  // Kliknout na SUBMIT
  await page.locator('button:has-text("Odeslat registraci")').click();

  // Počkat na výsledek — buď success stránka nebo error
  await page.waitForTimeout(5000);

  // Screenshot PO odeslání
  await page.screenshot({ path: "/tmp/reg-after-submit.png", fullPage: true });

  const bodyText = await page.locator("body").innerText();
  console.log("RESULT — URL:", page.url());
  console.log("RESULT — Success:", bodyText.includes("Registrace úspěšná"));
  console.log("RESULT — Error:", bodyText.includes("již existuje") || bodyText.includes("Nepodařilo"));

  // Úspěch = stránka obsahuje "Registrace úspěšná!"
  await expect(page.locator("text=Registrace úspěšná")).toBeVisible({ timeout: 10000 });
});
