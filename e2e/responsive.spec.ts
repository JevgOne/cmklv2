import { test, expect } from "@playwright/test";

test.describe("Responsivita", () => {
  test("homepage na mobilnim viewportu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("katalog na tabletu", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/nabidka");
    await expect(page.locator("#main-content")).toBeVisible();
  });
});
