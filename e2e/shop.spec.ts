import { test, expect } from "@playwright/test";

test.describe("E-shop", () => {
  test("katalog dilu se nacte", async ({ page }) => {
    await page.goto("/dily");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("shop katalog se nacte", async ({ page }) => {
    await page.goto("/shop/katalog");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("kosik zobrazuje obsah nebo prazdny stav", async ({ page }) => {
    await page.goto("/shop/kosik");
    await expect(page.locator("#main-content")).toBeVisible();
  });
});
