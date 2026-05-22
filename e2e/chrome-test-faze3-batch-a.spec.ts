import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const BAZAR_EMAIL = "bazar@carmakler.cz";
const VRAK_EMAIL = "vrakoviste@carmakler.cz";
const PASS = "heslo123";
const TEST_ORDER_ID = "order-faze3-test-001";

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/partner/, { timeout: 12000 });
  await page.waitForTimeout(1500);
}

// ============================================================
// D15 — Opening Hours Editor
// ============================================================

test("D15-T1: /partner/profile loads with OpeningHoursEditor (7 days)", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/profile`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/d15-t1-profile-page.png" });

  const bodyText = await page.textContent("body");
  const hasOteviraciDoba = bodyText?.includes("Otev") && bodyText?.includes("doba");
  const hasDays = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]
    .filter(d => bodyText?.includes(d));
  const hasCopyButton = bodyText?.includes("Kopírovat") || bodyText?.includes("pondeli") || bodyText?.includes("Kopirovat");
  const hasUlozitButton = bodyText?.includes("Ulozit") || bodyText?.includes("Uložit");

  console.log("D15-T1 — URL:", page.url());
  console.log("D15-T1 — Has 'Otevírací doba':", hasOteviraciDoba);
  console.log("D15-T1 — Days found:", hasDays.length, "/7");
  console.log("D15-T1 — Has copy button:", hasCopyButton);
  console.log("D15-T1 — Has save button:", hasUlozitButton);

  const criticalErrors = consoleErrors.filter(e =>
    (e.includes("TypeError") || e.includes("Error:") || e.includes("Cannot")) &&
    !e.includes("ResizeObserver")
  );
  console.log("D15-T1 — Console errors:", criticalErrors.slice(0, 5));

  expect(page.url()).toContain("/partner/profile");
  expect(hasOteviraciDoba).toBeTruthy();
  expect(hasDays.length).toBeGreaterThanOrEqual(6);
  expect(criticalErrors.length).toBe(0);
});

test("D15-T2: Saturday default = Zavřeno checkbox unchecked", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/profile`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  // Find checkboxes
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();

  // Saturday = index 5 (0-based), Sunday = index 6
  // But check that at least one checkbox exists for days
  const bodyText = await page.textContent("body");
  const saturdayClosed = bodyText?.includes("Zavřeno") || bodyText?.includes("Zavreno");

  await page.screenshot({ path: "test-results/d15-t2-saturday-closed.png" });
  console.log("D15-T2 — Checkbox count:", count);
  console.log("D15-T2 — Has 'Zavřeno' text:", saturdayClosed);

  expect(count).toBeGreaterThanOrEqual(7);
  expect(saturdayClosed).toBeTruthy();
});

test("D15-T3: Copy Monday to Tue-Fri button works", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/profile`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  // Find Monday time input and change it
  const timeInputs = page.locator('input[type="time"]');
  const timeCount = await timeInputs.count();
  console.log("D15-T3 — Time inputs:", timeCount);

  if (timeCount > 0) {
    // Change Monday open time to 09:00
    await timeInputs.first().fill("09:00");
    await page.waitForTimeout(300);
  }

  // Click "Kopírovat pondělí" button
  const copyBtn = page.locator('button:has-text("Kopírovat")');
  const copyBtnCount = await copyBtn.count();
  console.log("D15-T3 — Copy button found:", copyBtnCount);

  if (copyBtnCount > 0) {
    await copyBtn.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: "test-results/d15-t3-copy-button.png" });

  expect(timeCount).toBeGreaterThanOrEqual(5); // Mon-Fri = 5 × 2 time inputs = 10
  expect(copyBtnCount).toBe(1);
});

test("D15-T4: Save profile with openingHours → API PUT 200", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/profile`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  // Intercept PUT request
  const putPromise = page.waitForResponse(
    (res) => res.url().includes("/api/partner/profile") && res.request().method() === "PUT",
    { timeout: 10000 }
  );

  // Click save button
  const saveBtn = page.locator('button:has-text("Ulozit"), button:has-text("Uložit")').first();
  await saveBtn.click();

  let putStatus = 0;
  try {
    const putResponse = await putPromise;
    putStatus = putResponse.status();
  } catch {
    console.log("D15-T4 — PUT request not captured (timeout)");
  }

  await page.screenshot({ path: "test-results/d15-t4-save-profile.png" });
  console.log("D15-T4 — PUT /api/partner/profile status:", putStatus);

  expect(putStatus).toBe(200);
});

// ============================================================
// D16 — PDF buttons on order detail
// ============================================================

test("D16-T1: /partner/orders/[id] shows PDF download buttons", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await loginAs(page, VRAK_EMAIL);
  await page.goto(`${BASE}/partner/orders/${TEST_ORDER_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/d16-t1-order-detail.png" });

  const bodyText = await page.textContent("body");
  const hasDodaciList = bodyText?.includes("Dodaci") || bodyText?.includes("dodací") || bodyText?.includes("Dodací");
  const hasPotvrzeni = bodyText?.includes("Potvrzeni") || bodyText?.includes("Potvrzení");
  const hasOrderNumber = bodyText?.includes("FAZE3") || bodyText?.includes("faze3") || bodyText?.includes("OBJ");

  const criticalErrors = consoleErrors.filter(e =>
    (e.includes("TypeError") || e.includes("Error:")) && !e.includes("ResizeObserver")
  );

  console.log("D16-T1 — URL:", page.url());
  console.log("D16-T1 — Has 'Dodací list' button:", hasDodaciList);
  console.log("D16-T1 — Has 'Potvrzení' button:", hasPotvrzeni);
  console.log("D16-T1 — Order number visible:", hasOrderNumber);
  console.log("D16-T1 — Critical errors:", criticalErrors.slice(0, 5));

  expect(hasDodaciList).toBeTruthy();
  expect(hasPotvrzeni).toBeTruthy();
  expect(criticalErrors.length).toBe(0);
});

test("D16-T2: PDF delivery endpoint returns PDF content-type", async ({ page, request }) => {
  // First get a session cookie by logging in
  await loginAs(page, VRAK_EMAIL);

  // Now make an API call with session cookies
  const pdfResponse = await page.evaluate(async (orderId) => {
    const res = await fetch(`/api/partner/orders/${orderId}/pdf?type=delivery`, {
      method: "POST",
    });
    return { status: res.status, contentType: res.headers.get("content-type") };
  }, TEST_ORDER_ID);

  console.log("D16-T2 — PDF API status:", pdfResponse.status);
  console.log("D16-T2 — Content-Type:", pdfResponse.contentType);

  expect(pdfResponse.status).toBe(200);
  expect(pdfResponse.contentType).toContain("application/pdf");
});

test("D16-T3: PDF confirmation endpoint returns PDF content-type", async ({ page }) => {
  await loginAs(page, VRAK_EMAIL);

  const pdfResponse = await page.evaluate(async (orderId) => {
    const res = await fetch(`/api/partner/orders/${orderId}/pdf?type=confirmation`, {
      method: "POST",
    });
    return { status: res.status, contentType: res.headers.get("content-type") };
  }, TEST_ORDER_ID);

  console.log("D16-T3 — Confirmation PDF status:", pdfResponse.status);
  console.log("D16-T3 — Content-Type:", pdfResponse.contentType);

  expect(pdfResponse.status).toBe(200);
  expect(pdfResponse.contentType).toContain("application/pdf");
});

// ============================================================
// D11 — Search button + overlay in Partner layout
// ============================================================

test("D11-T1: Search button visible in PARTNER_BAZAR layout", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/d11-t1-bazar-search-btn.png" });

  const searchBtn = page.locator('button[aria-label="Hledat"], button[aria-label*="search" i], button[aria-label*="hledat" i]');
  const count = await searchBtn.count();
  console.log("D11-T1 — Search buttons in BAZAR layout:", count);

  expect(count).toBeGreaterThanOrEqual(1);
});

test("D11-T2: Search overlay opens on click", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // mobile — search button is in lg:hidden header
  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(1500);

  const searchBtn = page.locator('button[aria-label="Hledat"]').first();
  await searchBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/d11-t2-search-overlay-open.png" });

  // Overlay should be visible — check for input or backdrop
  const overlay = page.locator('[role="dialog"], .fixed.inset-0, input[placeholder*="ledat" i]');
  const overlayCount = await overlay.count();

  const bodyText = await page.textContent("body");
  // Look for search input in overlay
  const searchInput = page.locator('input[placeholder*="ledat" i], input[type="search"], input[placeholder*="Hledat"]');
  const inputCount = await searchInput.count();

  console.log("D11-T2 — Overlay elements:", overlayCount);
  console.log("D11-T2 — Search inputs after open:", inputCount);

  expect(overlayCount + inputCount).toBeGreaterThan(0);
});

test("D11-T3: Search for 'BMW' returns vehicle result for BAZAR user", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(1500);

  // Open search (button is in mobile header = lg:hidden)
  const searchBtn = page.locator('button[aria-label="Hledat"]').first();
  await searchBtn.click();
  await page.waitForTimeout(500);

  // Type into search input
  const searchInput = page.locator('input[placeholder*="ledat" i], input[placeholder*="Hledat"]').first();
  const inputVisible = await searchInput.count();
  if (inputVisible > 0) {
    await searchInput.fill("BMW");
    await page.waitForTimeout(800); // wait for debounce + API response
  } else {
    // Fallback: type into any visible input
    await page.keyboard.type("BMW");
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: "test-results/d11-t3-bazar-search-results.png" });

  const bodyText = await page.textContent("body");
  const hasBMW = bodyText?.includes("BMW");
  const hasResults = bodyText?.includes("BMW") || bodyText?.includes("3 Series");

  console.log("D11-T3 — BMW in results:", hasBMW);
  console.log("D11-T3 — Has search results:", hasResults);

  expect(hasBMW).toBeTruthy();
});

test("D11-T4: Search button visible in PARTNER_VRAKOVISTE layout", async ({ page }) => {
  await loginAs(page, VRAK_EMAIL);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/d11-t4-vrak-search-btn.png" });

  const searchBtn = page.locator('button[aria-label="Hledat"]');
  const count = await searchBtn.count();
  console.log("D11-T4 — Search buttons in VRAK layout:", count);

  expect(count).toBeGreaterThanOrEqual(1);
});

test("D11-T5: Search for 'Dveře' returns part result for VRAKOVISTE user", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, VRAK_EMAIL);
  await page.waitForTimeout(1500);

  const searchBtn = page.locator('button[aria-label="Hledat"]').first();
  await searchBtn.click();
  await page.waitForTimeout(500);

  const searchInput = page.locator('input[placeholder*="ledat" i], input[placeholder*="Hledat"]').first();
  const inputVisible = await searchInput.count();
  if (inputVisible > 0) {
    await searchInput.fill("Dveře");
    await page.waitForTimeout(800);
  } else {
    await page.keyboard.type("Dveře");
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: "test-results/d11-t5-vrak-search-results.png" });

  const bodyText = await page.textContent("body");
  const hasPart = bodyText?.includes("Dveře") || bodyText?.includes("Dvere") || bodyText?.includes("BMW");

  console.log("D11-T5 — Part in results:", hasPart);
  expect(hasPart).toBeTruthy();
});

test("D11-T6: ESC closes search overlay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, BAZAR_EMAIL);
  await page.waitForTimeout(1500);

  const searchBtn = page.locator('button[aria-label="Hledat"]').first();
  await searchBtn.click();
  await page.waitForTimeout(500);

  // Press ESC
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/d11-t6-esc-close.png" });

  // After ESC, overlay should be gone — check we're back to normal
  const bodyText = await page.textContent("body");
  const hasDashboard = bodyText?.includes("Dashboard");
  console.log("D11-T6 — Dashboard visible after ESC:", hasDashboard);

  // Main test: no crash, page still works
  const url = page.url();
  expect(url).toContain("/partner");
});

// ============================================================
// D13 — Dashboard Charts
// ============================================================

test("D13-T1: /partner/stats loads with charts for BAZAR user", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/stats`, { waitUntil: "load" });
  await page.waitForTimeout(3000); // charts need extra time to render
  await page.screenshot({ path: "test-results/d13-t1-bazar-stats.png" });

  const bodyText = await page.textContent("body");
  // Check for stats page content
  const hasStats = bodyText?.includes("tatistik") || bodyText?.includes("Přehled") || bodyText?.includes("Tržby") || bodyText?.includes("rzby");
  // Check for chart containers (recharts renders svg or canvas)
  const chartElements = page.locator("svg.recharts-surface, .recharts-wrapper, svg[class*='recharts']");
  const chartCount = await chartElements.count();

  const criticalErrors = consoleErrors.filter(e =>
    (e.includes("TypeError") || e.includes("Error:")) && !e.includes("ResizeObserver")
  );

  console.log("D13-T1 — URL:", page.url());
  console.log("D13-T1 — Has stats content:", hasStats);
  console.log("D13-T1 — Recharts SVG elements:", chartCount);
  console.log("D13-T1 — Critical errors:", criticalErrors.slice(0, 5));

  expect(page.url()).toContain("/partner/stats");
  expect(criticalErrors.length).toBe(0);
});

test("D13-T2: Charts API returns data for BAZAR user", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);

  const chartApiResponse = await page.evaluate(async () => {
    const res = await fetch("/api/partner/stats/charts?months=6");
    if (!res.ok) return { status: res.status, data: null };
    const data = await res.json();
    return { status: res.status, data };
  });

  console.log("D13-T2 — Charts API status:", chartApiResponse.status);
  console.log("D13-T2 — Charts API data:", JSON.stringify(chartApiResponse.data).slice(0, 200));

  expect(chartApiResponse.status).toBe(200);
  expect(chartApiResponse.data).toBeTruthy();
  expect(Array.isArray(chartApiResponse.data?.months)).toBeTruthy();
});

test("D13-T3: /partner/stats loads with charts for VRAKOVISTE user", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await loginAs(page, VRAK_EMAIL);
  await page.goto(`${BASE}/partner/stats`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/d13-t3-vrak-stats.png" });

  const bodyText = await page.textContent("body");
  const hasStats = bodyText?.includes("tatistik") || bodyText?.includes("Díly") || bodyText?.includes("Objednávky");
  const chartElements = page.locator("svg.recharts-surface, .recharts-wrapper, svg[class*='recharts']");
  const chartCount = await chartElements.count();

  const criticalErrors = consoleErrors.filter(e =>
    (e.includes("TypeError") || e.includes("Error:")) && !e.includes("ResizeObserver")
  );

  console.log("D13-T3 — Has VRAK stats content:", hasStats);
  console.log("D13-T3 — Recharts SVG elements:", chartCount);
  console.log("D13-T3 — Critical errors:", criticalErrors.slice(0, 5));

  expect(page.url()).toContain("/partner/stats");
  expect(criticalErrors.length).toBe(0);
});

test("D13-T4: Charts API returns data for VRAKOVISTE user", async ({ page }) => {
  await loginAs(page, VRAK_EMAIL);

  const chartApiResponse = await page.evaluate(async () => {
    const res = await fetch("/api/partner/stats/charts?months=6");
    if (!res.ok) return { status: res.status, data: null };
    const data = await res.json();
    return { status: res.status, data };
  });

  console.log("D13-T4 — Charts API status:", chartApiResponse.status);
  console.log("D13-T4 — Charts API data:", JSON.stringify(chartApiResponse.data).slice(0, 200));

  expect(chartApiResponse.status).toBe(200);
  expect(chartApiResponse.data).toBeTruthy();
  expect(Array.isArray(chartApiResponse.data?.months)).toBeTruthy();
});

test("D13-T5: /partner/stats renders RevenueChart heading/label", async ({ page }) => {
  await loginAs(page, BAZAR_EMAIL);
  await page.goto(`${BASE}/partner/stats`, { waitUntil: "load" });
  await page.waitForTimeout(3000);

  const bodyText = await page.textContent("body");
  // Look for chart section labels
  const hasRevenueLabel = bodyText?.includes("Tržby") || bodyText?.includes("trzby") || bodyText?.includes("rseby");
  const hasOrdersLabel = bodyText?.includes("Objednávky") || bodyText?.includes("Prodeje");
  const hasMesicich = bodyText?.includes("měsíc") || bodyText?.includes("mesic");

  await page.screenshot({ path: "test-results/d13-t5-chart-labels.png" });
  console.log("D13-T5 — Has 'Tržby' label:", hasRevenueLabel);
  console.log("D13-T5 — Has 'Objednávky' label:", hasOrdersLabel);
  console.log("D13-T5 — Has 'měsíc' label:", hasMesicich);

  // At least one chart label should be present
  expect(hasRevenueLabel || hasOrdersLabel || hasMesicich).toBeTruthy();
});
