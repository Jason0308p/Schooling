import { test, expect } from '@playwright/test';

// 煙霧測試：確認主要頁面能開、核心互動能運作。
// 每個測試都用乾淨的瀏覽器 context，localStorage 不會互相污染。

const SQL_LESSON = '/#/learn/sql-foundations/u00-l01';
const MCQ_LESSON = '/#/learn/prompt-engineering/pe-u01-l01';

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('首頁：顯示 10 張課程卡、不載入 SQL 引擎', async ({ page }) => {
  const errors = watchErrors(page);
  const sqlRequests = [];
  page.on('request', (r) => { if (/sql-wasm/.test(r.url())) sqlRequests.push(r.url()); });

  await page.goto('/');
  await expect(page.locator('.catalog-card')).toHaveCount(10);
  expect(sqlRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('首頁：搜尋可篩選課程', async ({ page }) => {
  await page.goto('/');
  await page.locator('.course-search').fill('Prompt');
  await expect(page.locator('.catalog-card')).toHaveCount(1);
  await expect(page.locator('.catalog-card')).toContainText('Prompt');
});

test('非 SQL 課：MCQ 作答後顯示回饋與進度', async ({ page }) => {
  const errors = watchErrors(page);
  const sqlRequests = [];
  page.on('request', (r) => { if (/sql-wasm/.test(r.url())) sqlRequests.push(r.url()); });

  await page.goto(MCQ_LESSON);
  const first = page.locator('.exercise').first();
  await expect(first).toBeVisible();
  await expect(first.locator('.mcq-option')).toHaveCount(4);

  await first.locator('.mcq-option').first().click();
  await expect(first.locator('.mcq-feedback')).toBeVisible();
  await expect(first.locator('.mcq-option[disabled]')).toHaveCount(4);
  expect(sqlRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('SQL 課：執行並送出標準答案後標記已完成', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(SQL_LESSON);

  const first = page.locator('.exercise').first();
  await expect(first.locator('.CodeMirror')).toBeVisible();

  await page.evaluate(() => {
    document.querySelector('.exercise .CodeMirror').CodeMirror
      .setValue('SELECT *\nFROM customers\nLIMIT 10;');
  });
  await first.getByRole('button', { name: /送出答案/ }).click();
  await expect(first.locator('.badge-ok')).toContainText('已完成', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('Dashboard：答題後顯示進度與推薦', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(MCQ_LESSON);
  await page.locator('.exercise').first().locator('.mcq-option').first().click();

  await page.goto('/#/progress');
  await expect(page.locator('.dashboard-page')).toBeVisible();
  await expect(page.locator('.kpi-grid')).toBeVisible();
  await expect(page.locator('.dashboard-recommendation')).toBeVisible();
  expect(errors).toEqual([]);
});

test('練習場與資料表頁可開啟', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/playground');
  await expect(page.locator('.CodeMirror').first()).toBeVisible({ timeout: 15_000 });

  await page.goto('/#/data');
  await expect(page.locator('main, #app').first()).toContainText('customers', { timeout: 15_000 });
  expect(errors).toEqual([]);
});
