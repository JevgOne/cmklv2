import { test } from "@playwright/test";

test("Footer content check", async ({ page }) => {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  const footerText = await page.locator("footer").innerText().catch(() => "NO FOOTER");
  console.log("\n=== FULL FOOTER TEXT ===\n" + footerText + "\n=== END ===");
});
