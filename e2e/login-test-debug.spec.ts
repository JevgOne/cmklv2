import { test, expect } from "@playwright/test";

test("Admin login debug", async ({ page }) => {
  test.setTimeout(60000);

  // Go directly to /login (not /prihlaseni which redirects)
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: "e2e/screenshots/debug-login-before.png" });

  // Fill form with correct IDs
  await page.fill("#email", "admin@carmakler.cz");
  await page.fill("#password", "heslo123");
  await page.screenshot({ path: "e2e/screenshots/debug-login-filled.png" });

  // Submit and wait
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("URL po kliknutí:", page.url());
  await page.screenshot({ path: "e2e/screenshots/debug-login-after.png" });

  // Check for error message
  const errorEl = page.locator(".bg-error-50, .text-error-600, [class*='error']").first();
  if (await errorEl.count() > 0) {
    console.log("Chybová zpráva:", await errorEl.textContent());
  }

  const loggedIn = !page.url().includes("/login");
  console.log("Přihlášen:", loggedIn, "URL:", page.url());
  expect(loggedIn).toBe(true);
});
