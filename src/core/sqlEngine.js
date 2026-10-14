/**
 * SQL 執行引擎：包裝 sql.js（瀏覽器內的 SQLite）。
 *
 * 設計：
 * - 啟動時用資料集的 build() 建一次資料庫，匯出成「快照」(Uint8Array)。
 * - 練習題的「執行」與「送出」每次都從快照開新的資料庫 → 學員就算下了 DELETE 也不會弄壞資料，
 *   批改結果也不受前一次操作影響。
 * - 練習場 (playground) 使用一個長駐的工作資料庫，可以自由修改，按「重置」才還原。
 */

let SQL = null;
const snapshots = new Map(); // datasetId -> Uint8Array

export async function initEngine({ wasmDir }) {
  if (SQL) return SQL;
  if (typeof window.initSqlJs !== 'function') throw new Error('sql.js 未載入');
  SQL = await window.initSqlJs({ locateFile: (file) => `${wasmDir}/${file}` });
  return SQL;
}

/** 建立（或取得快取的）資料集快照 */
export function ensureDataset(dataset) {
  if (!snapshots.has(dataset.id)) {
    const db = new SQL.Database();
    dataset.build(db);
    snapshots.set(dataset.id, db.export());
    db.close();
  }
  return snapshots.get(dataset.id);
}

/** 從快照開一個全新的資料庫，用完請 close() */
export function openFresh(dataset) {
  return new SQL.Database(ensureDataset(dataset));
}

/**
 * 執行 SQL，回傳統一格式：
 * { ok: true, results: [{columns, values}], last: {columns, values}|null, ms, changes }
 * { ok: false, error: '原始錯誤訊息', ms }
 */
export function runSql(db, sql) {
  const t0 = performance.now();
  try {
    const results = db.exec(sql);
    return {
      ok: true,
      results,
      last: results.length ? results[results.length - 1] : null,
      changes: db.getRowsModified(),
      ms: Math.round(performance.now() - t0),
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e), ms: Math.round(performance.now() - t0) };
  }
}

/** 一次性執行：開新資料庫 → 跑 → 關閉 */
export function runIsolated(dataset, sql, { after } = {}) {
  const db = openFresh(dataset);
  try {
    const r = runSql(db, sql);
    if (r.ok && after) r.check = runSql(db, after);
    return r;
  } finally {
    db.close();
  }
}

/** 練習場用的長駐資料庫 */
const workspaces = new Map();
export function workspace(dataset, { reset = false } = {}) {
  if (reset && workspaces.has(dataset.id)) {
    workspaces.get(dataset.id).close();
    workspaces.delete(dataset.id);
  }
  if (!workspaces.has(dataset.id)) workspaces.set(dataset.id, openFresh(dataset));
  return workspaces.get(dataset.id);
}
