import { test, expect } from '@playwright/test';

const PAGES = [
  'index.html', 'pages/explore/index.html', 'pages/categories/index.html', 'pages/category/index.html?id=pooja-room',
  'pages/design/index.html?id=athangudi-floored-drawing-room', 'pages/collections/index.html', 'pages/moodboards/index.html',
  'pages/budget/index.html', 'pages/materials/index.html', 'pages/standards/index.html', 'pages/styles/index.html',
  'pages/settings/index.html', 'pages/patterns/index.html',
];

const skipTour = async (page) =>
  page.addInitScript(() => {
    if (!localStorage.getItem('iis.data')) localStorage.setItem('iis.data', JSON.stringify({ onboarding: { done: true }, installedVersion: '0.1.0', lastSeenVersion: '0.1.0' }));
  });

test.describe('every page', () => {
  for (const path of PAGES) {
    test(`${path} loads cleanly`, async ({ page }) => {
      await skipTour(page);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(path);
      await expect(page.locator('main h1, main .h2').first()).toBeVisible();
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test('onboarding shows once and can be skipped', async ({ page }) => {
  await page.goto('index.html');
  const tour = page.getByRole('dialog', { name: 'Welcome tour' });
  await expect(tour).toBeVisible();
  await tour.getByRole('button', { name: 'Skip' }).click();
  await expect(tour).toBeHidden();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Welcome tour' })).toBeHidden();
});

test('search narrows results and is deep-linkable', async ({ page }) => {
  await skipTour(page);
  await page.goto('pages/explore/index.html');
  await page.getByRole('searchbox', { name: 'Search designs' }).fill('pooja');
  await expect(page.locator('#count')).toHaveText(/^3 designs$/);
  expect(page.url()).toContain('q=pooja');
  await page.goto('pages/explore/index.html?style=chettinad');
  await expect(page.locator('#results .design-card').first()).toBeVisible();
  const n = await page.locator('#results .design-card').count();
  expect(n).toBeGreaterThan(0);
});

test('favourite with undo', async ({ page }) => {
  await skipTour(page);
  await page.goto('pages/explore/index.html');
  const heart = page.locator('#results [data-fav]').first();
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.toast')).toContainText('Added to favourites');
  await page.locator('.toast').getByRole('button', { name: 'Undo' }).click();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  const favs = await page.evaluate(() => JSON.parse(localStorage.getItem('iis.data')).favourites);
  expect(favs).toEqual([]);
});

test('save to a new board, remove and undo', async ({ page }) => {
  await skipTour(page);
  await page.goto('pages/design/index.html?id=teak-mandir-with-brass-bells');
  await page.getByRole('button', { name: 'Save to board' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'New board' }).click();
  await page.getByLabel('Board name').fill('Pooja ideas');
  await page.getByRole('button', { name: 'Create and save' }).click();
  await expect(page.locator('.toast')).toContainText('Saved to Pooja ideas');
  await page.goto('pages/moodboards/index.html');
  await page.getByRole('link', { name: /Pooja ideas/ }).click();
  await expect(page.locator('.board-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove from board' }).click();
  await expect(page.locator('.board-item')).toHaveCount(0);
  await page.locator('.toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.board-item')).toHaveCount(1);
});

test('locked board photos cannot be removed', async ({ page }) => {
  await skipTour(page);
  await page.addInitScript(() =>
    localStorage.setItem('iis.data', JSON.stringify({ onboarding: { done: true }, installedVersion: '0.1.0', lastSeenVersion: '0.1.0', boards: [{ id: 'b1', name: 'Test', items: [{ designId: 'teak-mandir-with-brass-bells', imageIndex: 0 }] }] })),
  );
  await page.goto('pages/moodboards/index.html?board=b1');
  await page.getByRole('button', { name: 'Lock photo' }).click();
  await expect(page.getByRole('button', { name: 'Unlock to remove' })).toBeDisabled();
});

test('budget planner shows a rupee range', async ({ page }) => {
  await skipTour(page);
  await page.goto('pages/budget/index.html?city=pune&room=modular-kitchen&finish=premium&area=90');
  await expect(page.locator('.budget-range').first()).toContainText('₹');
  await expect(page.locator('.budget-range').first()).toContainText('lakh');
});
