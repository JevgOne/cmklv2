import { test } from "@playwright/test";

test("Inzerce nav debug", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3001/inzerce", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/inzerce-desktop.png" });
  
  // Check all nav/header text
  const headerText = await page.locator("header").innerText().catch(() => "");
  console.log("=== HEADER innerText ===\n" + headerText);
  
  // Check for visible "Nabídka vozidel" link specifically
  const count = await page.locator("text=Nabídka vozidel").count();
  console.log(`\nNabídka vozidel elements: ${count}`);
  
  // Check all links in header
  const links = await page.locator("header a, header button").allInnerTexts();
  console.log("Header links: " + links.join(" | "));
  
  // Check body with just the nav
  const navLinks = await page.locator("nav a").allInnerTexts();
  console.log("Nav links: " + navLinks.join(" | "));
});
