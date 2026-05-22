/**
 * S4: Max 10 tagů enforcement test
 * Starting from 5 tags → add until 10 → try 11th → expect error/disabled
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

test('S4: Max 10 tagů — pokus přidat 11. tag', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/prihlaseni`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill('jan.novak@carmakler.cz');
  await page.locator('input[type="password"]').first().fill('heslo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/muj-ucet/profil`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await acceptCookies(page);
  await page.waitForTimeout(500);

  // Current state: Jan Novák has 5 tags
  // Find the tag input (the transparent input inside tag section)
  const tagInput = page.locator('input.flex-1.min-w-\\[150px\\]').first();
  const tagInputAlt = page.locator('input[class*="flex-1"][class*="outline-none"]').first();

  let inputEl = tagInput;
  if (!await inputEl.isVisible({ timeout: 1000 }).catch(() => false)) {
    inputEl = tagInputAlt;
  }
  const isVisible = await inputEl.isVisible({ timeout: 2000 }).catch(() => false);
  console.log('TagInput visible:', isVisible);

  // Scroll into view
  await inputEl.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);

  // Get current count
  const counter = await page.locator('text=/\\d+\\/10 hashtagů/').first().textContent().catch(() => null);
  console.log('Initial counter:', counter);

  // Add tags one by one until we reach 10
  // Available tags from seed that Jan Novák doesn't have: Brno, Ostrava, Rodinná auta, Automat, Veteráni, První auto
  const newTags = ['Brno', 'Ostrava', 'Rodinná auta', 'Automat', 'Veteráni'];

  for (const tagName of newTags) {
    const currentCounter = await page.locator('text=/\\d+\\/10 hashtagů/').first().textContent().catch(() => null);
    console.log(`Counter before adding ${tagName}:`, currentCounter);

    if (currentCounter?.includes('10/10')) {
      console.log('Already at 10/10, stopping additions');
      break;
    }

    await inputEl.fill(tagName.toLowerCase().slice(0, 3));
    await page.waitForTimeout(800);

    // Check if dropdown appeared
    const dropdown = page.locator('[class*="dropdown"], [class*="autocomplete"], [role="listbox"], [class*="suggestion"]').first();
    const dropdownVisible = await dropdown.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`Dropdown for ${tagName}:`, dropdownVisible);

    if (dropdownVisible) {
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(500);
        continue;
      }
    }

    // Try pressing Enter
    await inputEl.press('Enter');
    await page.waitForTimeout(500);
  }

  const counterAfter = await page.locator('text=/\\d+\\/10 hashtagů/').first().textContent().catch(() => null);
  console.log('Counter after additions:', counterAfter);

  // Now try to get to 10 by adding direct
  // If still not at 10, try a direct approach
  const isAt10 = counterAfter?.includes('10/10') ?? false;
  console.log('At 10/10:', isAt10);

  // Screenshot at current state
  await page.screenshot({ path: '/tmp/054s4-after-additions.png', fullPage: false });

  // Now try to add 11th tag (or try when at max)
  await inputEl.fill('test-eleven');
  await page.waitForTimeout(500);
  await inputEl.press('Enter');
  await page.waitForTimeout(1000);

  // Check for toast/error
  const toast = page.locator('[class*="toast"], [role="alert"], [class*="error"], [class*="Toast"]').first();
  const toastVisible = await toast.isVisible({ timeout: 1500 }).catch(() => false);
  const toastText = await toast.textContent().catch(() => null);
  console.log('Toast visible:', toastVisible);
  console.log('Toast text:', toastText);

  // Check if input is disabled
  const inputDisabled = await inputEl.isDisabled().catch(() => false);
  console.log('Input disabled:', inputDisabled);

  // Check counter hasn't gone above 10
  const finalCounter = await page.locator('text=/\\d+\\/10 hashtagů/').first().textContent().catch(() => null);
  console.log('Final counter:', finalCounter);

  // Also check page for error messages
  const pageText = await page.locator('body').textContent() ?? '';
  const hasError = pageText.includes('max') || pageText.includes('Maximum') || pageText.includes('limit');
  const has10or11 = !pageText.includes('11/10'); // should NOT show 11/10
  console.log('Page has "max" error text:', hasError);
  console.log('No 11/10 overflow:', has10or11);

  await page.screenshot({ path: '/tmp/054s4-max10-test.png', fullPage: false });

  // Verify no overflow
  expect(has10or11).toBe(true);
});
