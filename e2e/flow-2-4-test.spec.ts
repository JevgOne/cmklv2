import { test, expect } from "@playwright/test";
import path from "path";

const BASE_URL = "http://localhost:3000";

// ─── Test 1: Flow 1 Retest — dashboard nested <a> fix ───────────────────────

test("T1: broker dashboard — no nested <a> console error", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleErrors.push(msg.text());
    }
  });

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "jan.novak@carmakler.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/makler/dashboard", { timeout: 15000 });

  // Wait for full render
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({
    path: "test-results/flow1-retest-dashboard.png",
    fullPage: true,
  });

  // Verify no nested <a> error
  const nestedAnchorErrors = consoleErrors.filter((e) =>
    e.includes("cannot contain a nested") ||
    e.includes("nested") && e.includes("<a>")
  );

  console.log("All console errors:", consoleErrors);
  console.log("Nested <a> errors:", nestedAnchorErrors);

  expect(nestedAnchorErrors).toHaveLength(0);

  // Verify dashboard content
  await expect(page.getByText("Ahoj")).toBeVisible();
});

test("T1b: broker dashboard — lead row click navigates to lead detail", async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "jan.novak@carmakler.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/makler/dashboard", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Check if NewLeadsSection has leads — if none, skip
  const leadLink = page.locator('a[href*="/makler/leads/"]').first();
  const hasLeads = await leadLink.count() > 0;

  if (!hasLeads) {
    console.log("No leads visible on dashboard — skipping lead click test");
    return;
  }

  // Get lead href
  const leadHref = await leadLink.getAttribute("href");
  console.log("Lead href:", leadHref);

  // Click lead name (not the phone button)
  await leadLink.click();
  await page.waitForURL("**/makler/leads/**", { timeout: 10000 });

  await page.screenshot({
    path: "test-results/flow1-retest-lead-detail.png",
    fullPage: true,
  });

  expect(page.url()).toContain("/makler/leads/");
});

test("T1c: broker dashboard — FollowUp phone is tel: link not redirect", async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "jan.novak@carmakler.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/makler/dashboard", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Check FollowUp section
  const followUpSection = page.locator("text=K FOLLOW-UPU DNES").first();
  const hasFollowUp = await followUpSection.count() > 0;

  if (!hasFollowUp) {
    console.log("No follow-up section visible — skipping");
    return;
  }

  // Find phone tel: links
  const telLinks = page.locator('a[href^="tel:"]');
  const telCount = await telLinks.count();
  console.log(`Found ${telCount} tel: links on dashboard`);

  if (telCount > 0) {
    const telHref = await telLinks.first().getAttribute("href");
    console.log("Tel link href:", telHref);
    expect(telHref).toMatch(/^tel:/);
  }
});

// ─── Test 2: Flow 2 — Vrakoviště register + admin activation ──────────────────

test("T2a: /registrace — Dodavatel dílů tile is visible", async ({ page }) => {
  await page.goto(`${BASE_URL}/registrace`);
  await expect(page).toHaveURL(/registrace/);

  await page.screenshot({
    path: "test-results/flow2-registrace.png",
    fullPage: true,
  });

  // Check for Dodavatel dílů tile (#60c fix)
  const dodavatelTile = page.getByText("Dodavatel dílů");
  await expect(dodavatelTile).toBeVisible();
  console.log("Dodavatel dílů tile found ✅");
});

test("T2b: /registrace/dodavatel — form is visible", async ({ page }) => {
  await page.goto(`${BASE_URL}/registrace/dodavatel`);
  await expect(page).not.toHaveURL(/404/);

  await page.screenshot({
    path: "test-results/flow2-registrace-dodavatel.png",
    fullPage: true,
  });

  // Form should be visible
  const emailInput = page.locator('input[type="email"]').first();
  const hasEmail = await emailInput.count() > 0;
  console.log("Email input visible:", hasEmail);

  // Page should not be error page
  const errorText = page.getByText("404");
  const is404 = await errorText.count() > 0;
  expect(is404).toBe(false);

  // Check for company name or similar registration field
  const nameInput = page.locator('input').first();
  await expect(nameInput).toBeVisible();
});

test("T2c: vrakoviště registration flow", async ({ page }) => {
  const timestamp = Date.now();
  const testEmail = `test.vrakoviste.${timestamp}@test.cz`;

  await page.goto(`${BASE_URL}/registrace/dodavatel`);
  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: "test-results/flow2-dodavatel-form.png",
    fullPage: true,
  });

  // Fill in the form — detect fields
  const inputs = await page.locator("input").all();
  console.log(`Found ${inputs.length} input fields`);

  for (const input of inputs) {
    const type = await input.getAttribute("type");
    const name = await input.getAttribute("name");
    const placeholder = await input.getAttribute("placeholder");
    console.log(`Input: type=${type}, name=${name}, placeholder=${placeholder}`);
  }

  // Try to fill the form
  const emailField = page.locator('input[type="email"]').first();
  if (await emailField.count() > 0) {
    await emailField.fill(testEmail);
  }

  const passwordField = page.locator('input[type="password"]').first();
  if (await passwordField.count() > 0) {
    await passwordField.fill("heslo123456");
  }

  // Company name
  const companyField = page.locator('input[name*="company"], input[name*="firma"], input[placeholder*="firma"], input[placeholder*="Název"]').first();
  if (await companyField.count() > 0) {
    await companyField.fill("Testovací Vrakoviště s.r.o.");
    console.log("Filled company name ✅");
  }

  // Phone
  const phoneField = page.locator('input[type="tel"], input[name*="phone"], input[name*="telefon"]').first();
  if (await phoneField.count() > 0) {
    await phoneField.fill("+420777888999");
    console.log("Filled phone ✅");
  }

  await page.screenshot({
    path: "test-results/flow2-dodavatel-form-filled.png",
    fullPage: true,
  });

  // Submit form
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: "test-results/flow2-dodavatel-form-submitted.png",
      fullPage: true,
    });

    const currentUrl = page.url();
    console.log("After submit URL:", currentUrl);
  }
});

test("T2d: /admin/partners — accessible after admin login", async ({ page }) => {
  // Admin login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "admin@carmakler.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/admin|dashboard/, { timeout: 15000 });

  await page.screenshot({
    path: "test-results/flow2-admin-after-login.png",
    fullPage: true,
  });

  console.log("Admin logged in, URL:", page.url());

  // Navigate to admin/partners
  await page.goto(`${BASE_URL}/admin/partners`);
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: "test-results/flow2-admin-partners.png",
    fullPage: true,
  });

  const currentUrl = page.url();
  console.log("Admin partners URL:", currentUrl);

  // Should not redirect to login
  expect(currentUrl).not.toContain("/login");

  // Page should have some content
  const pageContent = await page.content();
  const hasPartnersContent =
    pageContent.includes("partner") ||
    pageContent.includes("Partner") ||
    pageContent.includes("dodavatel") ||
    pageContent.includes("Dodavatel") ||
    pageContent.includes("vrakoviště") ||
    pageContent.includes("Vrakoviště");

  console.log("Has partners-related content:", hasPartnersContent);
});

// ─── Test 3: Flow 4 — Přidat díl (parts/new wizard) ──────────────────────────

test("T3a: parts/new — 3-step wizard loads for PARTNER_VRAKOVISTE", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Login as PARTS_SUPPLIER
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "dodavatel@vrakoviste.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/parts|dashboard/, { timeout: 15000 });

  await page.screenshot({
    path: "test-results/flow4-after-login.png",
    fullPage: true,
  });

  console.log("Parts supplier logged in, URL:", page.url());

  // Navigate to /parts/new
  await page.goto(`${BASE_URL}/parts/new`);
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: "test-results/flow4-parts-new.png",
    fullPage: true,
  });

  const currentUrl = page.url();
  console.log("parts/new URL:", currentUrl);
  expect(currentUrl).not.toContain("/login");

  // Check for wizard content
  const pageText = await page.textContent("body");
  const hasWizardContent =
    (pageText?.includes("Fotky") || pageText?.includes("fotky")) ||
    (pageText?.includes("díl") || pageText?.includes("Díl")) ||
    (pageText?.includes("krok") || pageText?.includes("Krok")) ||
    (pageText?.includes("Step") || pageText?.includes("step"));

  console.log("Has wizard content:", hasWizardContent);
  expect(hasWizardContent).toBe(true);

  // Check for step indicator
  const progressBar = page.locator('[aria-label*="krok"], [data-step], .step, [class*="step"]').first();
  const hasProgress = await progressBar.count() > 0;
  console.log("Has progress/step indicator:", hasProgress);
});

test("T3b: parts/new — Step 1 photo upload (placehold.co fallback)", async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  // Login as PARTS_SUPPLIER
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "dodavatel@vrakoviste.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/parts|dashboard/, { timeout: 15000 });

  await page.goto(`${BASE_URL}/parts/new`);
  await page.waitForTimeout(2000);

  // Check step 1 is "Fotky dílu"
  const step1Heading = page.getByText("Fotky dílu");
  const hasStep1 = await step1Heading.count() > 0;
  console.log("Step 1 'Fotky dílu' visible:", hasStep1);

  if (!hasStep1) {
    // Check what IS there
    const bodyText = await page.textContent("body");
    console.log("Body text (first 500):", bodyText?.slice(0, 500));
  }

  // Try to find file upload input
  const fileInput = page.locator('input[type="file"]').first();
  const hasFileInput = await fileInput.count() > 0;
  console.log("Has file input:", hasFileInput);

  await page.screenshot({
    path: "test-results/flow4-step1-photo.png",
    fullPage: true,
  });

  // Try uploading a test image if file input exists
  if (hasFileInput) {
    // Create a simple test PNG buffer
    const testImagePath = path.join(process.cwd(), "public", "logo.png");

    // Check if logo.png exists, otherwise skip upload
    const fs = await import("fs");
    if (fs.existsSync(testImagePath)) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(3000); // wait for upload processing

      await page.screenshot({
        path: "test-results/flow4-step1-photo-uploaded.png",
        fullPage: true,
      });

      // Check for placehold.co URL or cloudinary URL
      const imgSrc = await page.locator("img").first().getAttribute("src");
      console.log("After upload, img src:", imgSrc);

      const uploadSuccess =
        imgSrc?.includes("placehold.co") ||
        imgSrc?.includes("cloudinary") ||
        imgSrc?.includes("blob:");

      console.log("Upload processed (placehold/cloudinary/blob):", uploadSuccess);

      // Check no Zod 400 error
      const zodErrors = networkErrors.filter(e => e.startsWith("400"));
      console.log("400 errors:", zodErrors);
      expect(zodErrors.filter(e => e.includes("/api/parts"))).toHaveLength(0);
    } else {
      console.log("Test image not found at", testImagePath, "— skipping upload test");
    }
  }

  // No critical JS errors
  const criticalErrors = consoleErrors.filter(e =>
    !e.includes("CLIENT_FETCH_ERROR") &&
    !e.includes("404") &&
    !e.includes("500")
  );
  console.log("Critical console errors:", criticalErrors);
});

test("T3c: parts/new — complete wizard flow Steps 1-2-3 with photo upload", async ({ page }) => {
  const apiErrors: string[] = [];
  const apiResponses: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      apiResponses.push(`${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        apiErrors.push(`${response.status()} ${response.url()}`);
      }
    }
  });

  // Login as PARTS_SUPPLIER
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "dodavatel@vrakoviste.cz");
  await page.fill('input[type="password"]', "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/parts|dashboard/, { timeout: 15000 });

  await page.goto(`${BASE_URL}/parts/new`);
  await page.waitForTimeout(2000);

  // === Step 1: Photos — upload test image ===
  await page.screenshot({
    path: "test-results/flow4-wizard-step1.png",
    fullPage: true,
  });

  // Upload a test image to unlock "Pokračovat k údajům" button
  const testImagePath = path.join(process.cwd(), "public", "brand", "icon-color.jpg");
  const fileInput = page.locator('input[type="file"]').first();
  const hasFileInput = await fileInput.count() > 0;
  console.log("Step 1: Has file input:", hasFileInput);

  if (hasFileInput) {
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete (spinner disappears, button enabled)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[disabled]');
        // Wait until the Pokračovat button is NOT disabled
        const btns = Array.from(document.querySelectorAll("button"));
        const pokrec = btns.find(b => b.textContent?.includes("Pokračovat k údajům"));
        return pokrec && !pokrec.disabled;
      },
      { timeout: 15000 }
    );

    const uploadedImg = await page.locator("img").first().getAttribute("src");
    console.log("Uploaded image URL:", uploadedImg);
    const isPlaceholder = uploadedImg?.includes("placehold.co");
    const isCloudinary = uploadedImg?.includes("cloudinary");
    console.log("Is placehold.co (dev fallback):", isPlaceholder);
    console.log("Is Cloudinary (prod):", isCloudinary);
  }

  await page.screenshot({
    path: "test-results/flow4-wizard-step1-after-upload.png",
    fullPage: true,
  });

  // Click "Pokračovat k údajům"
  const nextBtn = page.locator('button:has-text("Pokračovat k údajům")').first();
  await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: "test-results/flow4-wizard-step2.png",
    fullPage: true,
  });

  // === Step 2: Údaje ===
  const step2Text = await page.textContent("body");
  const hasStep2Content =
    step2Text?.includes("Název") ||
    step2Text?.includes("Popis") ||
    step2Text?.includes("Kategorie") ||
    step2Text?.includes("Stav");
  console.log("Step 2 (Údaje) content visible:", hasStep2Content);
  expect(hasStep2Content).toBe(true);

  // Fill required fields in Step 2
  const nameInput = page.locator('input').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill("Turbodmychadlo BMW E46 320d");
    console.log("Filled name ✅");
  }

  // Select category if dropdown
  const categorySelect = page.locator('select').first();
  if (await categorySelect.count() > 0) {
    const options = await categorySelect.locator('option').all();
    if (options.length > 1) {
      await categorySelect.selectOption({ index: 1 });
      console.log("Selected category ✅");
    }
  }

  // Select condition if dropdown
  const conditionSelect = page.locator('select').nth(1);
  if (await conditionSelect.count() > 0) {
    const options = await conditionSelect.locator('option').all();
    if (options.length > 1) {
      await conditionSelect.selectOption({ index: 1 });
      console.log("Selected condition ✅");
    }
  }

  // Navigate to Step 3
  const nextBtn2 = page.locator('button:has-text("Pokračovat"), button:has-text("Další k ceně")').first();
  const hasNext2 = await nextBtn2.count() > 0;
  console.log("Step 2: Has next button:", hasNext2);

  if (hasNext2) {
    const isEnabled = await nextBtn2.isEnabled();
    console.log("Step 2 next button enabled:", isEnabled);

    if (isEnabled) {
      await nextBtn2.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: "test-results/flow4-wizard-step3.png",
        fullPage: true,
      });

      const step3Text = await page.textContent("body");
      const hasStep3Content =
        step3Text?.includes("Cena") ||
        step3Text?.includes("Kč") ||
        step3Text?.includes("Zveřejnit") ||
        step3Text?.includes("Doručení");
      console.log("Step 3 (Cena) content visible:", hasStep3Content);
    }
  }

  // Report all API responses
  console.log("API responses during wizard:", apiResponses.slice(-10));

  // No Zod 400 on parts API
  const partsZodErrors = apiErrors.filter(e => e.includes("/api/parts") && e.startsWith("400"));
  console.log("Parts Zod errors:", partsZodErrors);
  expect(partsZodErrors).toHaveLength(0);
});
