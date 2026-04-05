import { test, expect } from "@playwright/test";

test.describe("Autentizace", () => {
  test("login stranka se nacte s formularem", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("nespravne udaje ukazi chybu", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "neexistuje@test.cz");
    await page.fill("input[type='password']", "spatneheslo");
    await page.click("button[type='submit']");
    await expect(page.locator("text=Nesprávný email")).toBeVisible({ timeout: 5000 });
  });

  test("uspesne prihlaseni (seed admin)", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "admin@carmakler.cz");
    await page.fill("input[type='password']", "heslo123");
    await page.click("button[type='submit']");
    // Po prihlaseni redirect z /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });
});
