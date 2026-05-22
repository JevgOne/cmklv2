/**
 * Vizuální demo: stránky s VYPNUTÝM JavaScript
 * Browser se otevře VIDITELNĚ a projde každou stránku (4s pauza)
 */
import { test, Browser, BrowserContext } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";
const PAUSE = 4000; // 4s per page — uživatel vidí výsledek

async function makeNoJsCtx(browser: Browser, cookieFile: string): Promise<BrowserContext> {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const raw = execSync(`cat ${cookieFile}`, { encoding: "utf8" });
  const match = raw.match(/next-auth\.session-token\s+(\S+)/);
  if (match) {
    await ctx.addCookies([{
      name: "next-auth.session-token",
      value: match[1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    }]);
  }
  return ctx;
}

test("Vizuální demo: 10 stránek s vypnutým JS", async ({ browser }) => {
  // Admin pages
  const adminCtx = await makeNoJsCtx(browser, "/tmp/cookies_admin.txt");
  const adminPage = await adminCtx.newPage();

  console.log("\n🔴 JavaScript VYPNUT — prohlížeč otevřen\n");

  for (const [url, label] of [
    ["/admin/users",  "ADMIN: Uživatelé"],
    ["/admin/orders", "ADMIN: Objednávky"],
    ["/admin/parts",  "ADMIN: Díly"],
  ] as [string, string][]) {
    await adminPage.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const title = await adminPage.title();
    const bodyText = (await adminPage.locator("body").innerText()).trim();
    const visible = bodyText.length > 100;
    console.log(`${visible ? "✅" : "⚠️"} ${label} — ${visible ? "obsah viditelný" : "prázdné (Suspense template)"} | "${title}"`);
    await adminPage.waitForTimeout(PAUSE);
  }
  await adminCtx.close();

  // Partner pages
  const partnerCtx = await makeNoJsCtx(browser, "/tmp/cookies_partner.txt");
  const partnerPage = await partnerCtx.newPage();

  for (const [url, label] of [
    ["/partner/dashboard", "PARTNER: Dashboard"],
    ["/partner/orders",    "PARTNER: Objednávky"],
  ] as [string, string][]) {
    await partnerPage.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const bodyText = (await partnerPage.locator("body").innerText()).trim();
    const visible = bodyText.length > 100;
    console.log(`${visible ? "✅" : "⚠️"} ${label} — ${visible ? "obsah viditelný" : "prázdné (Suspense template)"}`);
    await partnerPage.waitForTimeout(PAUSE);
  }
  await partnerCtx.close();

  // Partner parts (needs VRAKOVISTE)
  const vrCtx = await makeNoJsCtx(browser, "/tmp/cookies_vrakoviste.txt");
  const vrPage = await vrCtx.newPage();
  await vrPage.goto(`${BASE_URL}/partner/parts`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const vrText = (await vrPage.locator("body").innerText()).trim();
  console.log(`${vrText.length > 100 ? "✅" : "⚠️"} PARTNER: Díly (VRAKOVISTE) — ${vrText.length > 100 ? "obsah viditelný" : "prázdné"}`);
  await vrPage.waitForTimeout(PAUSE);
  await vrCtx.close();

  // PWA Díly pages
  const dilyCtx = await makeNoJsCtx(browser, "/tmp/cookies_dodavatel.txt");
  const dilyPage = await dilyCtx.newPage();

  for (const [url, label] of [
    ["/parts/my",     "PWA DÍLY: Moje díly"],
    ["/parts/orders", "PWA DÍLY: Objednávky"],
  ] as [string, string][]) {
    await dilyPage.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const bodyText = (await dilyPage.locator("body").innerText()).trim();
    const visible = bodyText.length > 100;
    console.log(`${visible ? "✅" : "⚠️"} ${label} — ${visible ? "obsah viditelný" : "prázdné (Suspense template)"}`);
    await dilyPage.waitForTimeout(PAUSE);
  }
  await dilyCtx.close();

  // PWA Makléř pages
  const maklerCtx = await makeNoJsCtx(browser, "/tmp/cookies_jan.novak.txt");
  const maklerPage = await maklerCtx.newPage();

  for (const [url, label] of [
    ["/makler/leads",    "PWA MAKLÉŘ: Leady"],
    ["/makler/contacts", "PWA MAKLÉŘ: Kontakty"],
  ] as [string, string][]) {
    await maklerPage.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const bodyText = (await maklerPage.locator("body").innerText()).trim();
    const visible = bodyText.length > 100;
    console.log(`${visible ? "✅" : "⚠️"} ${label} — ${visible ? "obsah viditelný" : "prázdné (Suspense template)"}`);
    await maklerPage.waitForTimeout(PAUSE);
  }
  await maklerCtx.close();

  console.log("\n✅ Demo dokončeno\n");
});
