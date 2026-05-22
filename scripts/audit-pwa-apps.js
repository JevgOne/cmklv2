const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://carmakler.cz';

const PAGES = {
  'PWA MAKLÉŘ': [
    '/makler',
    '/makler/dashboard',
    '/makler/vehicles',
    '/makler/vehicles/new',
    '/makler/contracts',
    '/makler/contacts',
    '/makler/leads',
    '/makler/leaderboard',
    '/makler/commissions',
    '/makler/stats',
    '/makler/profile',
    '/makler/settings',
    '/makler/onboarding',
    '/makler/offline',
  ],
  'PWA PARTNER': [
    '/partner/dashboard',
    '/partner/vehicles',
    '/partner/parts',
    '/partner/orders',
    '/partner/leads',
    '/partner/profile',
    '/partner/stats',
    '/partner/billing',
    '/partner/onboarding',
  ],
  'PWA PARTS SUPPLIER': [
    '/parts',
    '/parts/my',
    '/parts/new',
    '/parts/import',
    '/parts/orders',
    '/parts/profile',
    '/parts/onboarding',
  ],
  'AUTH PAGES': [
    '/prihlaseni',
    '/registrace/makler',
    '/registrace/partner',
    '/registrace/dodavatel',
  ],
};

const ASSETS = ['/sw.js', '/manifest.json', '/manifest.webmanifest'];

async function checkPage(page, url) {
  const result = {
    url,
    finalUrl: null,
    status: null,
    redirectedTo: null,
    title: null,
    hasError: false,
    errorMessage: null,
    hasNavbar: false,
    navbarType: null,
    hasInstallBanner: false,
    hasCrash: false,
    crashMessage: null,
    consoleErrors: [],
    notes: [],
  };

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  let responseStatus = null;
  page.on('response', (response) => {
    if (response.url() === BASE_URL + url || response.url() === BASE_URL + url + '/') {
      if (responseStatus === null) responseStatus = response.status();
    }
  });

  try {
    const response = await page.goto(BASE_URL + url, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    result.finalUrl = page.url().replace(BASE_URL, '');
    result.status = response ? response.status() : null;

    if (result.finalUrl !== url && result.finalUrl !== url + '/') {
      result.redirectedTo = result.finalUrl;
    }

    await page.waitForTimeout(1000);

    result.title = await page.title();

    // Check for crash/error pages
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const h1Text = await page.locator('h1').first().textContent().catch(() => '');

    if (
      bodyText.includes('Application error') ||
      bodyText.includes('Internal Server Error') ||
      bodyText.includes('500') ||
      bodyText.includes('Error: ')
    ) {
      result.hasCrash = true;
      result.crashMessage = h1Text || 'Application error detected';
    }

    // Check for Next.js error overlay
    const hasNextError = await page.locator('[data-nextjs-dialog]').count();
    if (hasNextError > 0) {
      result.hasCrash = true;
      result.crashMessage = 'Next.js error overlay visible';
    }

    // Check for 404 pages
    if (
      bodyText.toLowerCase().includes('404') ||
      bodyText.toLowerCase().includes('page not found') ||
      bodyText.toLowerCase().includes('stránka nenalezena')
    ) {
      result.hasError = true;
      result.errorMessage = '404 - Page not found';
    }

    // Check for PWA navbar
    const pwaNav = await page.locator('nav').count();
    const bottomNav = await page
      .locator('[class*="bottom"], [class*="nav-bottom"], nav[class*="fixed"]')
      .count();
    const maklerNav = await page.locator('[data-testid="makler-nav"], [class*="makler"]').count();

    if (pwaNav > 0) {
      result.hasNavbar = true;
      if (bottomNav > 0) {
        result.navbarType = 'PWA bottom nav';
      } else {
        result.navbarType = 'Standard nav';
      }
    }

    // Check for install banner / PWA-specific elements
    const hasInstallPrompt = await page.locator('[class*="install"], [class*="pwa"]').count();
    result.hasInstallBanner = hasInstallPrompt > 0;

    // Check for auth redirect indicators
    if (
      result.redirectedTo &&
      (result.redirectedTo.includes('/prihlaseni') ||
        result.redirectedTo.includes('/login') ||
        result.redirectedTo.includes('/auth'))
    ) {
      result.notes.push('✅ Properly redirected to login');
    } else if (!result.redirectedTo && url.startsWith('/makler') && url !== '/makler/offline') {
      // Should redirect unless public
      if (!result.hasCrash && !result.hasError) {
        result.notes.push('⚠️ Protected route loaded without redirect — check auth');
      }
    }

    // Check form elements for auth pages
    if (url.includes('/prihlaseni') || url.includes('/registrace')) {
      const forms = await page.locator('form').count();
      const inputs = await page.locator('input').count();
      if (forms > 0 && inputs > 0) {
        result.notes.push(`✅ Form found (${inputs} inputs)`);
      } else {
        result.notes.push('⚠️ No form found on auth page');
      }
    }

    result.consoleErrors = consoleErrors.slice(0, 5); // limit to 5 errors
  } catch (err) {
    result.hasError = true;
    result.errorMessage = err.message.substring(0, 200);
  }

  return result;
}

async function checkAsset(url) {
  const result = { url, status: null, contentType: null, error: null };
  try {
    const response = await fetch(BASE_URL + url);
    result.status = response.status;
    result.contentType = response.headers.get('content-type');
  } catch (err) {
    result.error = err.message;
  }
  return result;
}

function renderResult(r) {
  const lines = [];
  const status = r.hasCrash ? '💥 CRASH' : r.hasError ? '❌ ERROR' : r.redirectedTo ? '🔀 REDIRECT' : '✅ OK';
  lines.push(`### \`${r.url}\` — ${status}`);
  lines.push(`- **Title:** ${r.title || '(none)'}`);
  lines.push(`- **HTTP Status:** ${r.status}`);
  if (r.redirectedTo) lines.push(`- **Redirected to:** \`${r.redirectedTo}\``);
  if (r.hasCrash) lines.push(`- **CRASH:** ${r.crashMessage}`);
  if (r.hasError && r.errorMessage) lines.push(`- **Error:** ${r.errorMessage}`);
  lines.push(`- **Navbar:** ${r.hasNavbar ? r.navbarType : 'None'}`);
  if (r.consoleErrors.length > 0) {
    lines.push(`- **Console errors (${r.consoleErrors.length}):**`);
    r.consoleErrors.forEach((e) => lines.push(`  - \`${e.substring(0, 120)}\``));
  }
  if (r.notes.length > 0) {
    r.notes.forEach((n) => lines.push(`- ${n}`));
  }
  return lines.join('\n');
}

async function main() {
  console.log('Starting PWA audit...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro size — realistic PWA viewport
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const report = [];
  report.push('# PWA Apps Audit — 2026-04-23');
  report.push('');
  report.push(`**Base URL:** ${BASE_URL}`);
  report.push(`**Viewport:** 390×844 (iPhone 14 Pro)`);
  report.push(`**Auth:** Unauthenticated (testing protection + public rendering)`);
  report.push('');

  // Check assets first
  report.push('## Service Worker & Manifest');
  report.push('');
  for (const assetUrl of ASSETS) {
    const r = await checkAsset(assetUrl);
    const icon = r.status === 200 ? '✅' : r.status === 404 ? '❌' : '⚠️';
    report.push(`- ${icon} \`${assetUrl}\` → HTTP ${r.status || 'ERROR: ' + r.error} | ${r.contentType || 'n/a'}`);
  }
  report.push('');

  // Check each group
  for (const [group, urls] of Object.entries(PAGES)) {
    report.push(`## ${group}`);
    report.push('');

    const results = [];
    for (const url of urls) {
      console.log(`  Checking ${url}...`);
      const r = await checkPage(page, url);
      results.push(r);
      report.push(renderResult(r));
      report.push('');
    }

    // Summary for group
    const ok = results.filter((r) => !r.hasCrash && !r.hasError).length;
    const crashes = results.filter((r) => r.hasCrash).length;
    const errors = results.filter((r) => r.hasError && !r.hasCrash).length;
    const redirects = results.filter((r) => r.redirectedTo).length;
    report.push(
      `**Group summary:** ${ok} OK | ${crashes} crashes | ${errors} errors | ${redirects} redirects`
    );
    report.push('');
    report.push('---');
    report.push('');
  }

  // Overall summary
  const allResults = Object.values(PAGES)
    .flat()
    .map((url) => ({ url })); // placeholder — real results are in renders above

  report.push('## Overall Assessment');
  report.push('');
  report.push('See group summaries above for details.');

  await browser.close();

  const reportPath =
    '/Users/zen/Projects/cmklv2/cmklv2/.claude-context/tasks/audit-pwa-apps-production-20260423.md';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log(`\nReport written to: ${reportPath}`);
}

main().catch(console.error);
