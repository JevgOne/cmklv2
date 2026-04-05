import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("nacte se a ma spravny title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CarMakléř/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("navigace obsahuje hlavni odkazy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("footer obsahuje pravni odkazy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator("footer a[href*='obchodni-podminky']")).toBeVisible();
    await expect(page.locator("footer a[href*='ochrana-osobnich-udaju']")).toBeVisible();
    await expect(page.locator("footer a[href*='reklamacni-rad']")).toBeVisible();
  });
});
