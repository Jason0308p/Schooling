/**
 * 課程內容驗證工具：node tools/validate-content.mjs   （或 npm run validate）
 *
 * 檢查項目（任何一項失敗 → exit code 1）：
 *  1. 課程 / 單元 / 課 / 題目 id 不重複，必填欄位齊全
 *  2. 每一課的 .md 檔存在，且裡面所有 ```sql run 範例都能執行
 *  3. 每一題的標準答案能執行、回傳至少 1 列
 *  4. 標準答案拿去給批改器批自己 → 必須判對（含 rules 規則）
 *  5. 每個 alternatives 替代解法 → 批改器必須判對
 *  6. ordered: true 的題目，標準答案必須含 ORDER BY
 *  7. 每個 negatives 常見錯誤寫法 → 批改器必須判錯（防止批改太寬鬆）
 * 另外輸出警告（不會失敗）：已發布單元的實際題數 ≠ plannedExercises。
 *
 * 新增或修改任何課程內容後都要跑一次。
 */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { grade } from '../src/core/grader.js';
import { extractRunnable } from '../src/core/markdown.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const initSqlJs = require(path.join(ROOT, 'src/vendor/sqljs/sql-wasm.js'));
const SQL = await initSqlJs({ locateFile: (f) => path.join(ROOT, 'src/vendor/sqljs', f) });

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where, msg) => warns.push(`! ${where}: ${msg}`);

function run(snapshot, sql) {
  const db = new SQL.Database(snapshot);
  try {
    const results = db.exec(sql);
    return { ok: true, results, last: results.length ? results[results.length - 1] : null };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  } finally {
    db.close();
  }
}

const { catalog } = await import(pathToFileURL(path.join(ROOT, 'content/catalog.js')));
const seenIds = new Set();
const uniq = (id, where) => {
  if (!id) return err(where, '缺少 id');
  if (seenIds.has(id)) err(where, `id 重複：${id}`);
  seenIds.add(id);
};

let lessonCount = 0, exerciseCount = 0, exampleCount = 0;

for (const entry of catalog) {
  uniq(entry.id, `catalog`);
  if (!entry.load) continue;
  const { course } = await entry.load();
  const { dataset } = await course.dataset();
  const db = new SQL.Database();
  dataset.build(db);
  const snapshot = db.export();
  db.close();

  for (const u of course.units) {
    uniq(u.id, `course ${course.id}`);
    if (u.status !== 'published') continue;
    if (!u.load) { err(u.id, 'status=published 但沒有 load'); continue; }
    const { unit } = await u.load();
    if (unit.id !== u.id) err(u.id, `unit.js 的 id (${unit.id}) 與 course.js 不一致`);
    let unitEx = 0;

    for (const l of unit.lessons) {
      lessonCount++;
      const where = `${course.id}/${l.id}`;
      uniq(l.id, where);
      for (const f of ['title', 'minutes', 'body']) if (!l[f]) err(where, `缺少 ${f}`);
      let md = '';
      try { md = await readFile(fileURLToPath(l.body), 'utf8'); } catch { err(where, `課文檔不存在：${l.body}`); }
      extractRunnable(md).forEach((sql, i) => {
        exampleCount++;
        const r = run(snapshot, sql);
        if (!r.ok) err(`${where} 範例 #${i + 1}`, r.error);
      });

      for (const ex of l.exercises || []) {
        exerciseCount++; unitEx++;
        const w = `${where} ${ex.id}`;
        uniq(ex.id, w);
        for (const f of ['title', 'prompt', 'answer', 'explanation']) if (!ex[f]) err(w, `缺少 ${f}`);
        if (![1, 2, 3].includes(ex.difficulty)) err(w, 'difficulty 必須是 1/2/3');
        const expected = run(snapshot, ex.answer);
        if (!expected.ok) { err(w, `標準答案執行失敗：${expected.error}`); continue; }
        if (!expected.last || !expected.last.values.length) err(w, '標準答案回傳 0 列（題目沒有可比對的結果）');
        if (ex.ordered && !/ORDER\s+BY/i.test(ex.answer)) err(w, 'ordered: true 但標準答案沒有 ORDER BY');
        const self = grade({ expected, actual: expected, ordered: !!ex.ordered, sql: ex.answer, rules: ex.rules || [] });
        if (!self.correct) err(w, `標準答案批改自己不通過：${self.message}`);
        (ex.alternatives || []).forEach((alt, i) => {
          const actual = run(snapshot, alt.sql);
          const g = grade({ expected, actual, ordered: !!ex.ordered, sql: alt.sql, rules: ex.rules || [] });
          if (!g.correct) err(`${w} 替代解 #${i + 1}`, g.message);
        });
        (ex.negatives || []).forEach((sql, i) => {
          const actual = run(snapshot, sql);
          const g = grade({ expected, actual, ordered: !!ex.ordered, sql, rules: ex.rules || [] });
          if (g.correct) err(`${w} 錯誤寫法 #${i + 1}`, '應該判錯，但批改器判對了（題目或批改太寬鬆）');
        });
      }
    }
    if (u.plannedExercises && unitEx !== u.plannedExercises) warn(u.id, `plannedExercises=${u.plannedExercises}，實際 ${unitEx} 題`);
  }
}

console.log(`檢查完成：${lessonCount} 課、${exerciseCount} 題、${exampleCount} 個課文範例`);
warns.forEach((w) => console.log(w));
if (errors.length) {
  errors.forEach((e) => console.log(e));
  console.log(`\n共 ${errors.length} 個錯誤`);
  process.exit(1);
}
console.log('全部通過 ✓');
