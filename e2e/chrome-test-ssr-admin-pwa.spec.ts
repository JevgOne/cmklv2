/**
 * SSR Migration test pro admin a PWA stránky
 * Používá přímé cookie injection (bez login přesměrování na dashboard)
 */
import { test, expect, Page, BrowserContext } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";

// Get NextAuth session token via API (avoids browser redirect to dashboard)
async function getSessionCookie(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  // Step 1: Get CSRF token
  const csrfResp = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfResp.json();

  // Step 2: POST credentials with CSRF cookie (extracted from response)
  const cookies = await csrfResp.headers()["set-cookie"];
  const csrfCookieMatch = csrfToken ? `next-auth.csrf-token=${encodeURIComponent(csrfToken + "|" + csrfToken)}` : "";

  // Use page.request.post to get the session cookie
  const authResp = await page.request.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      form: {
        csrfToken,
        email,
        password,
        redirect: "false",
        json: "true",
      },
      headers: {
        Cookie: `next-auth.csrf-token=${csrfToken}`,
      },
    }
  );

  const respCookies = authResp.headers()["set-cookie"];
  const sessionMatch = respCookies?.match(/next-auth\.session-token=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : "";
}

// Inject auth cookie and navigate to page
async function withAuth(
  context: BrowserContext,
  page: Page,
  email: string,
  password: string,
  targetUrl: string
) {
  // Get CSRF token via curl (more reliable)
  const csrfJson = execSync(
    `curl -s -c /tmp/auth_test_cookies.txt "http://localhost:3000/api/auth/csrf"`,
    { encoding: "utf8" }
  );
  const { csrfToken } = JSON.parse(csrfJson);

  // Get session via curl
  execSync(
    `curl -s -c /tmp/auth_test_cookies.txt -b /tmp/auth_test_cookies.txt -X POST ` +
    `"http://localhost:3000/api/auth/callback/credentials" ` +
    `-H "Content-Type: application/x-www-form-urlencoded" ` +
    `-d "csrfToken=${csrfToken}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&redirect=false&json=true" ` +
    `-o /dev/null`,
    { encoding: "utf8" }
  );

  // Read session cookie from file
  const cookieFile = execSync(`cat /tmp/auth_test_cookies.txt`, { encoding: "utf8" });
  const sessionMatch = cookieFile.match(/next-auth\.session-token\s+(\S+)/);

  if (sessionMatch) {
    // Set cookie in browser context
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: sessionMatch[1],
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }

  // Navigate directly to target URL
  await page.goto(targetUrl, { waitUntil: "commit", timeout: 25000 });
  await page.waitForTimeout(3000);
}

test.describe("Admin panel SSR (cookie injection)", () => {
  test("admin/team - TeamManager SSR", async ({ page, context }) => {
    await withAuth(
      context,
      page,
      "admin@carmakler.cz",
      "heslo123",
      `${BASE_URL}/admin/team`
    );

    const currentUrl = page.url();
    const title = await page.title();
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | admin/team | URL: ${currentUrl} | Title: "${title}"`);

    expect(has500, "No 500 error on admin/team").toBe(0);
    // Screenshot removed (font loading causes timeout)
  });

  test("admin/reviews - ReviewsManager SSR", async ({ page, context }) => {
    await withAuth(
      context,
      page,
      "admin@carmakler.cz",
      "heslo123",
      `${BASE_URL}/admin/reviews`
    );

    const currentUrl = page.url();
    const title = await page.title();
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | admin/reviews | URL: ${currentUrl} | Title: "${title}"`);

    expect(has500, "No 500 error on admin/reviews").toBe(0);
  });
});

test.describe("PWA Makléř SSR (cookie injection)", () => {
  test("makler/vehicles/new/vin - VIN step SSR wrapper", async ({
    page,
    context,
  }) => {
    await withAuth(
      context,
      page,
      "jan.novak@carmakler.cz",
      "heslo123",
      `${BASE_URL}/makler/vehicles/new/vin`
    );

    const currentUrl = page.url();
    const title = await page.title();
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /makler/vehicles/new/vin | URL: ${currentUrl} | Title: "${title}" | spinners: ${spinnerCount}`);

    expect(has500, "No 500 error").toBe(0);
  });

  test("makler/vehicles/new/success - SSR success page", async ({
    page,
    context,
  }) => {
    await withAuth(
      context,
      page,
      "jan.novak@carmakler.cz",
      "heslo123",
      `${BASE_URL}/makler/vehicles/new/success?vehicleId=test-123`
    );

    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /makler/vehicles/new/success | spinners: ${spinnerCount}`);

    expect(has500, "No 500 error on success page").toBe(0);
  });

  test("makler/vehicles/quick/success - SSR quick success page", async ({
    page,
    context,
  }) => {
    await withAuth(
      context,
      page,
      "jan.novak@carmakler.cz",
      "heslo123",
      `${BASE_URL}/makler/vehicles/quick/success?vehicleId=test-123`
    );

    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /makler/vehicles/quick/success | spinners: ${spinnerCount}`);

    expect(has500, "No 500 error on quick success page").toBe(0);
  });
});

test.describe("Shop tracking SSR", () => {
  test("shop/objednavky/sledovani - order tracking SSR", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop/objednavky/sledovani/test-token-123`, {
      waitUntil: "commit",
      timeout: 25000,
    });
    await page.waitForTimeout(2000);

    const title = await page.title();
    const has500 = await page.locator('[data-nextjs-dialog-header]').count();
    const spinnerCount = await page.locator('[class*="animate-spin"]').count();

    console.log(`${has500 > 0 ? "❌ 500" : spinnerCount > 0 ? "⏳ SPINNER" : "✅ OK"} | /shop/objednavky/sledovani | Title: "${title}" | spinners: ${spinnerCount}`);

    expect(has500, "No 500 error on order tracking").toBe(0);
  });
});
