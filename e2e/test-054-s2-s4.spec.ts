/**
 * S2 fix: proper waitForURL navigation check
 * S4 fix: proper tag input inspection
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function acceptCookies(page: any) {
  const btn = page.getByRole('button', { name: 'Příjmout vše' });
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
  }
}

test('S2-fix: CTA navigates to /registrace', async ({ page }) => {
  await page.goto(`${BASE}/makleri/praha`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);
  await page.waitForTimeout(500);

  // Scroll to find a /registrace link
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);

  const registraceLinks = await page.locator('a[href*="/registrace"]').count();
  const joinLinks = await page.locator('a[href*="makler/join"]').count();
  console.log('/registrace link count:', registraceLinks);
  console.log('/makler/join link count (should be 0):', joinLinks);

  // Verify /registrace page itself loads
  await page.goto(`${BASE}/registrace`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const registraceUrl = page.url();
  const registraceH1 = await page.locator('h1').first().textContent().catch(() => null);
  await page.screenshot({ path: '/tmp/054s2-registrace-page.png' });
  console.log('Registrace URL:', registraceUrl);
  console.log('Registrace H1:', registraceH1);
  const registraceLoads = !registraceUrl.includes('/prihlaseni') && !registraceUrl.includes('error');
  console.log('Registrace page loads:', registraceLoads);
  expect(registraceLinks).toBeGreaterThan(0);
  expect(joinLinks).toBe(0);
  expect(registraceLoads).toBe(true);
});

test('S4-fix: Max 10 tagů — inspect TagInput structure', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('jan.novak@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  const loginUrl = page.url();
  console.log('Login URL:', loginUrl);

  await page.goto(`${BASE}/muj-ucet/profil`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await acceptCookies(page);

  // Full page screenshot for analysis
  await page.screenshot({ path: '/tmp/054s4-full-profil.png', fullPage: true });

  // Find TagInput by checking the HTML structure
  const pageHTML = await page.locator('body').innerHTML().catch(() => '');
  const tagInputIdx = pageHTML.indexOf('TagInput') !== -1 ? pageHTML.indexOf('TagInput') : pageHTML.indexOf('tag');
  console.log('Page HTML length:', pageHTML.length);

  // Look for any input that could be tag-related
  const inputs = await page.locator('input').evaluateAll((els: any[]) =>
    els.map(el => ({
      type: el.type,
      placeholder: el.placeholder,
      name: el.name,
      id: el.id,
      className: el.className.slice(0, 50),
    }))
  );
  console.log('All inputs:', JSON.stringify(inputs, null, 2));

  // Look for tag pills currently on profile
  const tagLinks = await page.locator('a[href^="/makleri/"]').evaluateAll((els: any[]) =>
    els.map(el => ({ href: el.href, text: el.textContent?.trim() }))
  );
  console.log('Tag links on muj-ucet/profil:', JSON.stringify(tagLinks, null, 2));

  // Check page text around tags section
  const fullText = await page.locator('body').textContent() ?? '';
  const tagIdx = fullText.toLowerCase().indexOf('hashta');
  const tagCtx = tagIdx > -1 ? fullText.slice(Math.max(0, tagIdx - 50), tagIdx + 200) : 'NOT FOUND';
  console.log('Hashtag context:', tagCtx);

  // Also check for "max" or "10" near tag section
  const maxIdx = fullText.indexOf('Max 10') !== -1 ? fullText.indexOf('Max 10') :
                 fullText.indexOf('max 10') !== -1 ? fullText.indexOf('max 10') :
                 fullText.indexOf('maximálně') !== -1 ? fullText.indexOf('maximálně') : -1;
  const maxCtx = maxIdx > -1 ? fullText.slice(Math.max(0, maxIdx - 30), maxIdx + 100) : 'NOT FOUND';
  console.log('Max context:', maxCtx);
});
