import { test, expect } from "@playwright/test";
test("debug login", async ({ page }) => {
  // Krok 1: GET CSRF
  const csrfResp = await page.request.get("http://localhost:3000/api/auth/csrf");
  const csrfBody = await csrfResp.json();
  console.log("CSRF token:", csrfBody.csrfToken);

  // Krok 2: Navigace na login
  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");
  
  // Krok 3: Vidíme form?
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  console.log("Email input visible:", await emailInput.isVisible());
  console.log("Password input visible:", await passwordInput.isVisible());

  // Krok 4: Vyplnit
  await emailInput.fill("admin@carmakler.cz");
  await passwordInput.fill("heslo123");
  
  // Krok 5: Submit a sledovat response
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes("/api/auth/") || resp.url().includes("/admin"), { timeout: 10000 }),
    page.locator('button[type="submit"]').first().click()
  ]);
  console.log("Response URL:", response.url());
  console.log("Response status:", response.status());
  
  await page.waitForTimeout(2000);
  console.log("Final URL:", page.url());
  
  // Screenshoty
  await page.screenshot({ path: "/tmp/debug-login.png", fullPage: false });
});
