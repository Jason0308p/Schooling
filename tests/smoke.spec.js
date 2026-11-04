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

test('首頁：顯示 13 張課程卡、不載入 SQL 引擎', async ({ page }) => {
  const errors = watchErrors(page);
  const sqlRequests = [];
  page.on('request', (r) => { if (/sql-wasm/.test(r.url())) sqlRequests.push(r.url()); });

  await page.goto('/');
  await expect(page.locator('.catalog-card')).toHaveCount(13);
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

test('程式面試分類只顯示三門新課', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: '程式面試' }).click();
  await expect(page.locator('.catalog-card')).toHaveCount(3);
  await expect(page.locator('.catalog-card').nth(0)).toContainText('資料結構');
  await expect(page.locator('.catalog-card').nth(1)).toContainText('演算法');
  await expect(page.locator('.catalog-card').nth(2)).toContainText('面試題');
  await page.getByRole('tab', { name: 'SQL 分析' }).click();
  await expect(page.locator('.catalog-card')).toHaveCount(5);
});

test('手機版程式面試路徑與課程沒有水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('程式面試路徑')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/#/course/data-structures');
  await expect(page.locator('h1').first()).toContainText('資料結構');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const courseId of ['data-structures', 'algorithm-interview', 'coding-practice']) {
  test(`${courseId}：課程與觀念題可開啟、答錯及答對`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/#/course/${courseId}`);
    await expect(page.locator('h1').first()).toBeVisible();
    const { lessonId, answers } = await page.evaluate(async (id) => {
      const { loadCourse } = await import('/src/core/courseRegistry.js');
      const course = await loadCourse(id);
      const lesson = course.flat[0].lesson;
      return { lessonId: lesson.id, answers: lesson.exercises.slice(0, 2).map(ex => ex.answer) };
    }, courseId);
    await page.goto(`/#/learn/${courseId}/${lessonId}`);
    await page.waitForLoadState('networkidle');
    const exercises = page.locator('.exercise');
    await expect(exercises).toHaveCount(2);
    await exercises.nth(0).locator('.mcq-option').nth((answers[0] + 1) % 4).click();
    await expect(exercises.nth(0).locator('.feedback-fail')).toBeVisible();
    await exercises.nth(1).locator('.mcq-option').nth(answers[1]).click();
    await expect(exercises.nth(1)).toHaveClass(/is-solved/);
    expect(errors).toEqual([]);
  });
}

test('練習場與資料表頁可開啟', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/playground');
  await expect(page.locator('.CodeMirror').first()).toBeVisible({ timeout: 15_000 });

  await page.goto('/#/data');
  await expect(page.locator('main, #app').first()).toContainText('customers', { timeout: 15_000 });
  expect(errors).toEqual([]);
});
