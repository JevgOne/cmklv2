import { test, expect } from "@playwright/test";
test("debug login v3 - intercept credentials", async ({ page }) => {
  // Zachytit request na credentials callback
  let capturedRequest: any = null;
  page.on('request', req => {
    if (req.url().includes('/api/auth/callback/credentials')) {
      capturedRequest = {
        url: req.url(),
        method: req.method(),
        postData: req.postData(),
      };
      console.log("=== CREDENTIALS REQUEST ===");
      console.log("URL:", req.url());
      console.log("Method:", req.method());
      console.log("PostData:", req.postData()?.substring(0, 200));
    }
  });
  
  page.on('response', resp => {
    if (resp.url().includes('/api/auth/callback/credentials')) {
      console.log("=== CREDENTIALS RESPONSE ===");
      console.log("Status:", resp.status());
      resp.text().then(text => console.log("Body:", text.substring(0, 200))).catch(() => {});
    }
  });

  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");

  // Vyplnit přes evaluate (React state)
  await page.evaluate(() => {
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const passwordInput = document.querySelector('#password') as HTMLInputElement;
    
    // Simulate React onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(emailInput, 'admin@carmakler.cz');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      nativeInputValueSetter.call(passwordInput, 'heslo123');
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  
  await page.waitForTimeout(200);
  
  const emailVal = await page.locator('#email').inputValue();
  const passLen = (await page.locator('#password').inputValue()).length;
  console.log("Email:", emailVal, "| Pass length:", passLen);

  // Click submit
  page.locator('button[type="submit"]').click().catch(() => {});
  
  // Čekat na credentials response max 10s
  await page.waitForTimeout(10000);
  
  if (!capturedRequest) {
    console.log("!!! Credentials request NEBYLO odesláno !!!");
  }
  
  console.log("Final URL:", page.url());
  await page.screenshot({ path: "/tmp/debug3.png" });
});
