/**
 * Diagnostic: find which element causes horizontal overflow on /admin/vehicles @ 375px
 */
import { test, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#email", "admin@carmakler.cz");
  await page.fill("#password", "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3500);
}

test("Find overflow element on /admin/vehicles @ 375px", async ({ browser }) => {
  test.setTimeout(120000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAsAdmin(page);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/admin/vehicles`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2000);

  // Find the root flex container and its children widths
  const layoutInfo = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;

    // Find all direct children of the min-h-screen flex container
    const rootFlex = document.querySelector('.min-h-screen.flex') as HTMLElement;
    const mainArea = document.querySelector('.flex-1') as HTMLElement;
    const sidebar = document.querySelector('aside') as HTMLElement;

    const getSizeInfo = (el: HTMLElement | null, name: string) => {
      if (!el) return { name, error: "NOT FOUND" };
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        name,
        width: rect.width,
        right: rect.right,
        scrollWidth: el.scrollWidth,
        offsetWidth: el.offsetWidth,
        position: computed.position,
        display: computed.display,
        flexGrow: computed.flexGrow,
        flexBasis: computed.flexBasis,
        minWidth: computed.minWidth,
        marginLeft: computed.marginLeft,
      };
    };

    return {
      viewport: vw,
      rootFlex: getSizeInfo(rootFlex, 'rootFlex div.min-h-screen.flex'),
      mainArea: getSizeInfo(mainArea, 'mainArea div.flex-1'),
      sidebar: getSizeInfo(sidebar, 'aside (sidebar)'),
    };
  });

  console.log("\n=== LAYOUT ANALYSIS ===");
  console.log(JSON.stringify(layoutInfo, null, 2));

  // Find the specific element that is CAUSING the page to be 526px
  // by checking the flex container's direct flex items
  const flexItems = await page.evaluate(() => {
    const rootFlex = document.querySelector('.min-h-screen.flex') as HTMLElement;
    if (!rootFlex) return [];

    return Array.from(rootFlex.children).map((child) => {
      const el = child as HTMLElement;
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className?.toString().slice(0, 100),
        width: rect.width,
        right: rect.right,
        position: computed.position,
        display: computed.display,
        visibility: computed.visibility,
      };
    });
  });

  console.log("\n=== ROOT FLEX DIRECT CHILDREN ===");
  for (const item of flexItems) {
    console.log(JSON.stringify(item));
  }

  // Check AdminGlobalSearch modal
  const globalSearch = await page.evaluate(() => {
    const modal = document.querySelector('[class*="AdminGlobalSearch"]') as HTMLElement;
    const allFixed = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el as HTMLElement);
      return style.position === 'fixed' && (el as HTMLElement).getBoundingClientRect().width > 300;
    }).map(el => ({
      tag: (el as HTMLElement).tagName,
      class: el.className?.toString().slice(0, 80),
      width: (el as HTMLElement).getBoundingClientRect().width,
    }));
    return allFixed;
  });
  console.log("\n=== FIXED ELEMENTS > 300px wide ===");
  console.log(JSON.stringify(globalSearch, null, 2));

  await ctx.close();
});
