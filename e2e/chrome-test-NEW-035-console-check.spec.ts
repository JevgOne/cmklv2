/**
 * Console error investigation for carmakler.cz
 * Captures actual JS error messages
 */
import { test, Page } from "@playwright/test";
const BASE = "https://carmakler.cz";

async function getConsoleErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message.slice(0, 200)}`));
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  return errors;
}

test("Console errors on / (homepage)", async ({ page }) => {
  const errors = await getConsoleErrors(page, "/");
  console.log(`\n=== / — ${errors.length} errors ===`);
  for (const e of errors) console.log("  ERR:", e);
});

test("Console errors on /blog", async ({ page }) => {
  const errors = await getConsoleErrors(page, "/blog");
  console.log(`\n=== /blog — ${errors.length} errors ===`);
  for (const e of errors) console.log("  ERR:", e);
});

test("Console errors on /nabidka", async ({ page }) => {
  const errors = await getConsoleErrors(page, "/nabidka");
  console.log(`\n=== /nabidka — ${errors.length} errors ===`);
  for (const e of errors) console.log("  ERR:", e);
});

test("Console errors on /inzerce", async ({ page }) => {
  const errors = await getConsoleErrors(page, "/inzerce");
  console.log(`\n=== /inzerce — ${errors.length} errors ===`);
  for (const e of errors) console.log("  ERR:", e);
});

test("Console errors on /marketplace", async ({ page }) => {
  const errors = await getConsoleErrors(page, "/marketplace");
  console.log(`\n=== /marketplace — ${errors.length} errors ===`);
  for (const e of errors) console.log("  ERR:", e);
});
