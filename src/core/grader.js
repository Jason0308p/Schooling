/**
 * 批改器（純函式，不碰 DOM，Node 驗證工具也會用它）。
 *
 * 核心原則：比的是「查詢結果」，不是 SQL 字串。
 * - 欄位名稱不比（學員可以自由取別名）。
 * - 題目 ordered=false 時，列的順序不比。
 * - 數值四捨五入到小數 2 位後比較（避免浮點誤差 / ROUND 寫法差異）。
 * - 欄位順序不同但內容完全一致 → 判對，但提醒照題目順序。
 */

const NUM_DIGITS = 2;

function normCell(v) {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') {
    const r = Math.round(v * 10 ** NUM_DIGITS) / 10 ** NUM_DIGITS;
    return 'n:' + (Object.is(r, -0) ? 0 : r);
  }
  if (v instanceof Uint8Array) return 'b:' + Array.from(v).join(',');
  return 's:' + String(v);
}

const rowKey = (row) => row.map(normCell).join('␟');

function sameRows(a, b, ordered) {
  if (a.length !== b.length) return false;
  const ka = a.map(rowKey);
  const kb = b.map(rowKey);
  if (!ordered) { ka.sort(); kb.sort(); }
  return ka.every((k, i) => k === kb[i]);
}

/** 嘗試把 actual 的欄位重新排列成 expected 的順序（以整欄內容比對） */
function findColumnPermutation(exp, act) {
  const n = exp.columns.length;
  const colSig = (rows, j) => rows.map((r) => normCell(r[j])).sort().join('␞');
  const expSig = Array.from({ length: n }, (_, j) => colSig(exp.values, j));
  const actSig = Array.from({ length: n }, (_, j) => colSig(act.values, j));
  const used = new Set();
  const perm = [];
  for (let j = 0; j < n; j++) {
    const k = actSig.findIndex((s, idx) => !used.has(idx) && s === expSig[j]);
    if (k < 0) return null;
    used.add(k);
    perm.push(k);
  }
  return perm.every((k, j) => k === j) ? null : perm;
}

const empty = { columns: [], values: [] };

/**
 * @param {object} p
 * @param {object} p.expected  標準答案的執行結果（runSql 的回傳）
 * @param {object} p.actual    學員的執行結果
 * @param {boolean} p.ordered  是否要求列順序
 * @param {string}  p.sql      學員原始 SQL（給規則檢查用）
 * @param {Array}   p.rules    額外規則 [{ pattern: RegExp, message, mustNot?: true }]
 * @returns {{correct:boolean, code:string, message:string, detail?:object, notes:string[]}}
 */
export function grade({ expected, actual, ordered = false, sql = '', rules = [] }) {
  const notes = [];
  if (!sql.trim()) return { correct: false, code: 'empty_sql', message: '還沒有輸入 SQL。', notes };
  if (!actual.ok) return { correct: false, code: 'error', message: actual.error, notes };
  if (!expected.ok) {
    return { correct: false, code: 'answer_broken', message: '標準答案執行失敗（課程內容錯誤，請回報）：' + expected.error, notes };
  }

  const exp = expected.last || empty;
  const act = actual.last;
  if (!act) {
    return {
      correct: false,
      code: 'no_result',
      message: '你的 SQL 執行成功，但沒有回傳任何結果表。這題需要用 SELECT 查詢出結果。',
      notes,
    };
  }

  const expCols = exp.columns.length;
  const actCols = act.columns.length;
  if (expCols !== actCols) {
    return {
      correct: false,
      code: 'col_count',
      message: `欄位數量不對：你的結果有 ${actCols} 個欄位，題目要的是 ${expCols} 個。`,
      detail: { expectedColumns: exp.columns, actualColumns: act.columns },
      notes,
    };
  }

  const expRows = exp.values.length;
  const actRows = act.values.length;
  if (expRows !== actRows) {
    const hint = actRows > expRows
      ? '你的結果比較多，可能是篩選條件太寬、少了某個條件，或需要 DISTINCT / GROUP BY。'
      : '你的結果比較少，可能是篩選條件太嚴、多了某個條件，或 LIMIT 數字不對。';
    return {
      correct: false,
      code: 'row_count',
      message: `筆數不對：你的結果有 ${actRows} 筆，預期是 ${expRows} 筆。${hint}`,
      notes,
    };
  }

  let pass = sameRows(exp.values, act.values, ordered);
  let code = 'ok';
  if (!pass) {
    const perm = findColumnPermutation(exp, act);
    if (perm) {
      const reordered = act.values.map((r) => perm.map((k) => r[k]));
      if (sameRows(exp.values, reordered, ordered)) {
        pass = true;
        code = 'ok_col_order';
        notes.push('內容正確，但欄位順序跟題目要求不同。實務上交付報表時，欄位順序最好照需求方要的排。');
      }
    }
  }

  if (!pass) {
    if (ordered && sameRows(exp.values, act.values, false)) {
      return {
        correct: false,
        code: 'order',
        message: '資料內容都對了，但排列順序不對。檢查 ORDER BY 的欄位和方向（ASC 由小到大、DESC 由大到小）。',
        notes,
      };
    }
    const firstDiff = firstDifferentRow(exp.values, act.values, ordered);
    return {
      correct: false,
      code: 'values',
      message: '欄位數和筆數都對，但有些數值不一樣。比對一下下方的「預期結果」。',
      detail: firstDiff,
      notes,
    };
  }

  // 規則檢查（例如：這題要求一定要用 HAVING）
  for (const r of rules) {
    const hit = r.pattern.test(sql);
    if ((r.mustNot && hit) || (!r.mustNot && !hit)) {
      return { correct: false, code: 'rule', message: '結果正確，但不符合本題要求：' + r.message, notes };
    }
  }

  return { correct: true, code, message: '答對了！', notes };
}

function firstDifferentRow(expValues, actValues, ordered) {
  if (ordered) {
    for (let i = 0; i < expValues.length; i++) {
      if (rowKey(expValues[i]) !== rowKey(actValues[i])) return { rowIndex: i, expected: expValues[i], actual: actValues[i] };
    }
    return null;
  }
  const expSet = new Map();
  expValues.forEach((r) => expSet.set(rowKey(r), (expSet.get(rowKey(r)) || 0) + 1));
  for (const r of actValues) {
    const k = rowKey(r);
    if (expSet.get(k)) expSet.set(k, expSet.get(k) - 1);
    else return { rowIndex: null, expected: null, actual: r };
  }
  return null;
}
