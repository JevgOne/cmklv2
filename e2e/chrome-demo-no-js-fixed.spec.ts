/**
 * Ověření 5 opravených stránek s VYPNUTÝM JavaScript
 * Po odebrání loading.tsx — obsah musí být viditelný bez JS
 */
import { test, expect, Browser, BrowserContext } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";
const PAUSE = 4000;

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

test("5 opravených stránek — viditelné bez JS", async ({ browser }) => {
  const results: { url: string; visible: boolean; bodyLen: number }[] = [];

  // === 1. /admin/parts ===
  const adminCtx = await makeNoJsCtx(browser, "/tmp/cookies_admin.txt");
  const adminPage = await adminCtx.newPage();
  await adminPage.goto(`${BASE_URL}/admin/parts`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const adminPartsText = (await adminPage.locator("body").innerText()).trim();
  const adminPartsOk = adminPartsText.length > 100;
  console.log(`${adminPartsOk ? "✅" : "❌"} /admin/parts — ${adminPartsOk ? `${adminPartsText.length} znaků viditelných` : "PRÁZDNÉ"}`);
  if (adminPartsOk) console.log(`   Preview: ${adminPartsText.substring(0, 120)}...`);
  results.push({ url: "/admin/parts", visible: adminPartsOk, bodyLen: adminPartsText.length });
  await adminPage.waitForTimeout(PAUSE);
  await adminCtx.close();

  // === 2. /parts/my ===
  const dilyCtx = await makeNoJsCtx(browser, "/tmp/cookies_dodavatel.txt");
  const dilyPage = await dilyCtx.newPage();
  await dilyPage.goto(`${BASE_URL}/parts/my`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const partsMyText = (await dilyPage.locator("body").innerText()).trim();
  const partsMyOk = partsMyText.length > 100;
  console.log(`${partsMyOk ? "✅" : "❌"} /parts/my — ${partsMyOk ? `${partsMyText.length} znaků viditelných` : "PRÁZDNÉ"}`);
  if (partsMyOk) console.log(`   Preview: ${partsMyText.substring(0, 120)}...`);
  results.push({ url: "/parts/my", visible: partsMyOk, bodyLen: partsMyText.length });
  await dilyPage.waitForTimeout(PAUSE);

  // === 3. /parts/orders ===
  await dilyPage.goto(`${BASE_URL}/parts/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const partsOrdersText = (await dilyPage.locator("body").innerText()).trim();
  const partsOrdersOk = partsOrdersText.length > 100;
  console.log(`${partsOrdersOk ? "✅" : "❌"} /parts/orders — ${partsOrdersOk ? `${partsOrdersText.length} znaků viditelných` : "PRÁZDNÉ"}`);
  if (partsOrdersOk) console.log(`   Preview: ${partsOrdersText.substring(0, 120)}...`);
  results.push({ url: "/parts/orders", visible: partsOrdersOk, bodyLen: partsOrdersText.length });
  await dilyPage.waitForTimeout(PAUSE);
  await dilyCtx.close();

  // === 4. /makler/leads ===
  const maklerCtx = await makeNoJsCtx(browser, "/tmp/cookies_jan.novak.txt");
  const maklerPage = await maklerCtx.newPage();
  await maklerPage.goto(`${BASE_URL}/makler/leads`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const leadsText = (await maklerPage.locator("body").innerText()).trim();
  const leadsOk = leadsText.length > 100;
  console.log(`${leadsOk ? "✅" : "❌"} /makler/leads — ${leadsOk ? `${leadsText.length} znaků viditelných` : "PRÁZDNÉ"}`);
  if (leadsOk) console.log(`   Preview: ${leadsText.substring(0, 120)}...`);
  results.push({ url: "/makler/leads", visible: leadsOk, bodyLen: leadsText.length });
  await maklerPage.waitForTimeout(PAUSE);

  // === 5. /makler/contacts ===
  await maklerPage.goto(`${BASE_URL}/makler/contacts`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const contactsText = (await maklerPage.locator("body").innerText()).trim();
  const contactsOk = contactsText.length > 100;
  console.log(`${contactsOk ? "✅" : "❌"} /makler/contacts — ${contactsOk ? `${contactsText.length} znaků viditelných` : "PRÁZDNÉ"}`);
  if (contactsOk) console.log(`   Preview: ${contactsText.substring(0, 120)}...`);
  results.push({ url: "/makler/contacts", visible: contactsOk, bodyLen: contactsText.length });
  await maklerPage.waitForTimeout(PAUSE);
  await maklerCtx.close();

  // === Summary ===
  const passed = results.filter(r => r.visible).length;
  console.log(`\n📊 Výsledek: ${passed}/5 stránek zobrazuje obsah bez JS\n`);

  // Assert all 5 pass
  for (const r of results) {
    expect(r.visible, `${r.url} musí zobrazit obsah bez JS`).toBe(true);
  }
});
