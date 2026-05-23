/**
 * Setup script: Log in users and save session cookies to /tmp/
 * Usage: npx playwright test e2e/setup-sessions.ts --headed --project=chromium
 */
import { test } from "@playwright/test";
import fs from "fs";

const BASE = "http://localhost:3000";

async function login(page: any, email: string, password: string, outFile: string) {
  // Get CSRF token first
  const csrfResp = await page.request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfResp.json();

  // POST credentials directly to NextAuth callback
  await page.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      email,
      password,
      csrfToken,
      callbackUrl: `${BASE}/`,
      json: "true",
    },
  });

  // Navigate to check if session exists
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  const url = page.url();
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c: { name: string; value: string; expires: number }) => c.name === "next-auth.session-token");

  if (sessionCookie) {
    const content = `# Netscape HTTP Cookie File\n#HttpOnly_localhost\tFALSE\t/\tFALSE\t${Math.floor(sessionCookie.expires)}\tnext-auth.session-token\t${sessionCookie.value}\n`;
    fs.writeFileSync(outFile, content, "utf8");
    console.log(`✅ ${email} → ${outFile} (url: ${url})`);
  } else {
    console.log(`❌ ${email} — no session cookie! URL: ${url}`);
    // Fallback: try form login
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.locator("input[type='email']").first().fill(email);
    await page.locator("input[type='password']").first().fill(password);
    await page.locator("button[type='submit']").first().click();
    await page.waitForTimeout(5000);
    const cookies2 = await page.context().cookies();
    const session2 = cookies2.find((c: { name: string; value: string; expires: number }) => c.name === "next-auth.session-token");
    if (session2) {
      const content = `# Netscape HTTP Cookie File\n#HttpOnly_localhost\tFALSE\t/\tFALSE\t${Math.floor(session2.expires)}\tnext-auth.session-token\t${session2.value}\n`;
      fs.writeFileSync(outFile, content, "utf8");
      console.log(`✅ ${email} (form fallback) → ${outFile} (url: ${page.url()})`);
    } else {
      console.log(`❌❌ ${email} — both methods failed, URL: ${page.url()}`);
    }
  }
}

test("Create sessions for kupujici, investor, dealer", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, "kupujici@email.cz", "heslo123", "/tmp/cookies_kupujici.txt");
  await login(page, "investor1@carmakler.cz", "heslo123", "/tmp/cookies_investor.txt");
  await login(page, "dealer1@carmakler.cz", "heslo123", "/tmp/cookies_dealer.txt");

  await ctx.close();
});
