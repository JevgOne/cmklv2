import { test, expect } from "@playwright/test";

test.describe("Inzerce", () => {
  test("stranka s nabidkami se nacte", async ({ page }) => {
    await page.goto("/inzerce");
    await expect(page.locator("main")).toBeVisible();
  });
});
