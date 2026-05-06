import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'Administrator';
const PASSWORD = 'admin1234@';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
}

test.describe('Authentication', () => {
  test('shows login page at root', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(/login/);
  });

  test('logs in successfully', async ({ page }) => {
    await login(page);
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill('wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('.text-destructive, [class*="destructive"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
  });

  test('shows KPI cards', async ({ page }) => {
    await expect(page.locator('text=/total|stock|item|invoice/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('sidebar has main nav items', async ({ page }) => {
    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Invoices')).toBeVisible();
    await expect(page.locator('text=Stock Entry')).toBeVisible();
  });
});

test.describe('Items', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/items`);
  });

  test('items page loads', async ({ page }) => {
    await expect(page).toHaveURL(/items/);
    await expect(page.locator('text=/item|product|add/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('Add Item button is visible', async ({ page }) => {
    await expect(page.locator('text=/add item/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Stock Entries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/stock-entries/new`);
  });

  test('new stock entry form loads', async ({ page }) => {
    await expect(page.locator('text=/new stock entry/i')).toBeVisible({ timeout: 10000 });
  });

  test('has entry type selector', async ({ page }) => {
    await expect(page.locator('text=/material receipt/i')).toBeVisible({ timeout: 10000 });
  });

  test('has Add Item button', async ({ page }) => {
    await expect(page.locator('text=/add item/i')).toBeVisible({ timeout: 10000 });
  });
});
