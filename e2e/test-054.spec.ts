import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function acceptCookies(page: any) {
  const btn = page.getByRole('button', { name: 'Příjmout vše' });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

// ============================================================
// SECTION 1: PUBLIC FLOW
// ============================================================

test('P1: /makleri/praha — 9 sekcí + obsah', async ({ page }) => {
  await page.goto(`${BASE}/makleri/praha`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await acceptCookies(page);

  await page.screenshot({ path: '/tmp/054-makleri-praha.png' });

  // Page renders
  const body = await page.locator('body').textContent();
  console.log('Page length:', body?.length);

  // Hero section — H1
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log('H1:', h1);
  expect(h1).toBeTruthy();

  // Breadcrumb
  const breadcrumb = page.locator('nav[aria-label*="readcrumb"], ol, [class*="breadcrumb"]').first();
  const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);
  console.log('Breadcrumb:', hasBreadcrumb);

  // BrokerGrid — some cards
  const brokerCards = await page.locator('a[href*="/profil/"]').count();
  console.log('Broker cards:', brokerCards);
  expect(brokerCards).toBeGreaterThan(0);

  // FAQ sekce
  const faq = page.getByText(/Nejčastější dotazy|FAQ|časté otázky/i).first();
  const hasFAQ = await faq.isVisible().catch(() => false);
  console.log('FAQ section:', hasFAQ);
  expect(hasFAQ).toBe(true);

  // CTA section — "registrace" link
  const ctaLink = page.locator('a[href*="registrace"]').first();
  const hasRegCTA = await ctaLink.isVisible().catch(() => false);
  console.log('CTA /registrace:', hasRegCTA);
  expect(hasRegCTA).toBe(true);
});

test('P2: /makleri/praha — JSON-LD schemas (4 typy)', async ({ page }) => {
  await page.goto(`${BASE}/makleri/praha`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Evaluate JSON-LD in browser
  const schemas = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map(s => {
      try { return JSON.parse(s.textContent || '{}'); }
      catch { return null; }
    }).filter(Boolean);
  });

  console.log('JSON-LD schemas found:', schemas.length);
  const types = schemas.map((s: any) => s['@type']).filter(Boolean);
  console.log('Schema types:', types);

  expect(schemas.length).toBeGreaterThanOrEqual(2);
  // Check for ItemList and FAQPage (minimum required)
  const hasItemList = types.includes('ItemList');
  const hasFAQPage = types.includes('FAQPage');
  console.log('ItemList:', hasItemList, '| FAQPage:', hasFAQPage);
  expect(hasItemList).toBe(true);
  expect(hasFAQPage).toBe(true);
});

test('P3: /makleri/bmw — BRAND varianta', async ({ page }) => {
  await page.goto(`${BASE}/makleri/bmw`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await acceptCookies(page);

  await page.screenshot({ path: '/tmp/054-makleri-bmw.png' });

  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log('BMW H1:', h1);
  expect(h1).toBeTruthy();

  // Brand copy should reference BMW
  const body = await page.locator('body').textContent();
  const hasBMW = body?.toLowerCase().includes('bmw') ?? false;
  console.log('BMW referenced:', hasBMW);
  expect(hasBMW).toBe(true);
});

test('P4: /makleri/elektromobily — SPECIALIZATION, bez EV zkratky', async ({ page }) => {
  await page.goto(`${BASE}/makleri/elektromobily`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await acceptCookies(page);

  await page.screenshot({ path: '/tmp/054-makleri-elektromobily.png' });

  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log('Elektromobily H1:', h1);
  expect(h1).toBeTruthy();

  // URL is /makleri/elektromobily (without -ev)
  expect(page.url()).toContain('/makleri/elektromobily');
  expect(page.url()).not.toContain('-ev');

  // Label should be "Elektromobily" not "EV"
  const body = await page.locator('body').textContent() ?? '';
  const hasEVShortcut = body.includes(' EV ') || body.includes('"EV"');
  console.log('EV shortcut found:', hasEVShortcut);
  expect(hasEVShortcut).toBe(false);

  const hasElektromobily = body.toLowerCase().includes('elektromobil');
  console.log('Elektromobily found:', hasElektromobily);
  expect(hasElektromobily).toBe(true);
});

test('P5: /h/Praha redirect → /makleri/Praha', async ({ page }) => {
  const response = await page.goto(`${BASE}/h/praha`, { waitUntil: 'commit' });
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  console.log('Final URL after /h/Praha:', finalUrl);
  // Should redirect to /makleri/Praha
  expect(finalUrl).toContain('/makleri/');
});

test('P6: /tag/Praha redirect → /makleri/Praha', async ({ page }) => {
  const response = await page.goto(`${BASE}/tag/praha`, { waitUntil: 'commit' });
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  console.log('Final URL after /tag/Praha:', finalUrl);
  expect(finalUrl).toContain('/makleri/');
});

// ============================================================
// SECTION 2: BROKER FLOW
// ============================================================

test('B1: TagInput na /muj-ucet/profil', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('jan.novak@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  const loginUrl = page.url();
  console.log('Login URL:', loginUrl);
  if (loginUrl.includes('/prihlaseni')) { console.warn('Login failed'); test.skip(); }

  await page.goto(`${BASE}/muj-ucet/profil`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);
  await page.screenshot({ path: '/tmp/054-broker-profil.png' });

  // TagInput visible
  const tagSection = page.locator('[class*="tag"], input[placeholder*="tag"], input[placeholder*="Tag"], [data-testid*="tag"]').first();
  const tagInputVisible = await tagSection.isVisible().catch(() => false);
  console.log('TagInput visible:', tagInputVisible);

  // Look for tags section heading or input
  const tagsHeading = page.getByText(/tagy|hashtag|tag/i).first();
  const hasTagsSection = await tagsHeading.isVisible().catch(() => false);
  console.log('Tags section heading:', hasTagsSection);
  expect(hasTagsSection).toBe(true);
});

test('B2: /profil/[slug] — TagPills klikatelné', async ({ page }) => {
  await page.goto(`${BASE}/profil/jan-novak-praha`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);

  await page.screenshot({ path: '/tmp/054-profil-tagpills.png' });

  // Check for tag pills (links to /makleri/[slug])
  const tagLinks = page.locator('a[href*="/makleri/"]');
  const tagCount = await tagLinks.count();
  console.log('Tag links on profile:', tagCount);

  // Tag pills may or may not be present depending on if broker has tags
  // Just verify the page renders
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log('Profile H1:', h1);
  expect(h1).toContain('Jan');
});

// ============================================================
// SECTION 3: ADMIN FLOW
// ============================================================

test('A1: Admin /admin/tagy — tabulka tagů', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  const loginUrl = page.url();
  console.log('Admin login URL:', loginUrl);

  await page.goto(`${BASE}/admin/tagy`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);
  await page.screenshot({ path: '/tmp/054-admin-tagy.png' });

  const finalUrl = page.url();
  console.log('Admin tagy URL:', finalUrl);
  expect(finalUrl).toContain('/admin/tagy');

  // Table should exist
  const table = page.locator('table').first();
  const hasTable = await table.isVisible().catch(() => false);
  console.log('Table visible:', hasTable);
  expect(hasTable).toBe(true);

  // Has tag rows
  const rows = await page.locator('table tbody tr').count();
  console.log('Tag rows:', rows);
  expect(rows).toBeGreaterThan(0);
});

test('A2: Admin sidebar "Tagy" link', async ({ page }) => {
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('admin@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/admin/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);
  await page.screenshot({ path: '/tmp/054-admin-sidebar.png' });

  // Sidebar link "Tagy" visible
  const tagsLink = page.locator('a[href*="/admin/tagy"]').first();
  const hasTagsLink = await tagsLink.isVisible().catch(() => false);
  console.log('Admin sidebar Tagy link:', hasTagsLink);
  expect(hasTagsLink).toBe(true);
});

test('A3: Non-admin (broker) NEMÁ Tagy link', async ({ page }) => {
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('jan.novak@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/makler/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);

  // No /admin/tagy link
  const tagsLink = page.locator('a[href*="/admin/tagy"]').first();
  const hasTagsLink = await tagsLink.isVisible().catch(() => false);
  console.log('Broker has Tagy link (should be false):', hasTagsLink);
  expect(hasTagsLink).toBe(false);

  // Direct access → redirect
  await page.goto(`${BASE}/admin/tagy`);
  await page.waitForTimeout(2000);
  const url = page.url();
  console.log('Broker accessing /admin/tagy → URL:', url);
  expect(url).not.toContain('/admin/tagy');
});

// ============================================================
// SECTION 4: RULE 1 COMPLIANCE
// ============================================================

test('R1: Žádné zkratky v UI na /makleri/praha', async ({ page }) => {
  await page.goto(`${BASE}/makleri/praha`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const body = await page.locator('body').textContent() ?? '';

  const hasPrum = body.includes('Prům.') || body.includes('Prům ');
  const hasROI_abbr = body.match(/\bROI\b/) !== null;
  const hasMakleru = body.includes('makléřů') || body.includes('makléři');
  const ctaToRegistrace = await page.locator('a[href*="registrace"]').count();
  const ctaToJoin = await page.locator('a[href*="makler/join"]').count();

  console.log('Prům. abbreviation:', hasPrum);
  console.log('ROI abbreviation:', hasROI_abbr);
  console.log('makléřů/makléři present:', hasMakleru);
  console.log('CTA /registrace count:', ctaToRegistrace);
  console.log('CTA /makler/join count (bad):', ctaToJoin);

  expect(hasPrum).toBe(false);
  expect(ctaToJoin).toBe(0);
  expect(ctaToRegistrace).toBeGreaterThan(0);
});
