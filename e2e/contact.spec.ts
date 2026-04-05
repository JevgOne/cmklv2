import { test, expect } from "@playwright/test";

test.describe("Kontakt", () => {
  test("kontaktni stranka se nacte", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("text=Kontakt").first()).toBeVisible();
  });
});
