import { test, expect } from "@playwright/test";
test("debug login v2", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");

  // Kliknutí na input a skutečné psaní (triggeruje React onChange)
  await page.locator('#email').click();
  await page.locator('#email').pressSequentially("admin@carmakler.cz", { delay: 50 });
  await page.locator('#password').click();
  await page.locator('#password').pressSequentially("heslo123", { delay: 50 });

  // Ověřit hodnoty
  const emailVal = await page.locator('#email').inputValue();
  const passVal = await page.locator('#password').inputValue();
  console.log("Email value:", emailVal);
  console.log("Pass value:", passVal.length > 0 ? "(filled)" : "(EMPTY)");
  
  // Screenshot před submit
  await page.screenshot({ path: "/tmp/debug-before-submit.png" });
  
  // Submit a čekat na navigaci
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(e => console.log("Nav timeout:", e.message)),
    page.locator('button[type="submit"]').click()
  ]);
  
  await page.waitForTimeout(1000);
  console.log("Final URL:", page.url());
  await page.screenshot({ path: "/tmp/debug-after-submit.png" });
});
