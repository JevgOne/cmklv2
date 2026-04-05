import { test, expect } from "@playwright/test";

test.describe("Katalog", () => {
  test("nabidka se nacte", async ({ page }) => {
    await page.goto("/nabidka");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("inzerce se nacte", async ({ page }) => {
    await page.goto("/inzerce");
    await expect(page.locator("#main-content")).toBeVisible();
  });
});
