import { h } from '../dom.js';
import { translateError } from '../../core/errorTranslator.js';

/** 把查詢結果（sqlEngine.runSql 的回傳）畫成表格 */
export function resultView(run, { maxRows = 200, title = null } = {}) {
  if (!run.ok) return errorView(run.error);
  const r = run.last;
  if (!r) {
    const msg = run.changes ? `執行成功，影響 ${run.changes} 列。` : '執行成功，沒有回傳結果表。';
    return h('div', { class: 'result-empty' }, msg);
  }
  return dataTable(r, { maxRows, title, meta: `${r.values.length} 列 · ${r.columns.length} 欄 · ${run.ms} ms` });
}

export function dataTable(r, { maxRows = 200, title = null, meta = null } = {}) {
  const rows = r.values.slice(0, maxRows);
  return h('div', { class: 'result' },
    (title || meta) && h('div', { class: 'result-head' },
      title && h('span', { class: 'result-title' }, title),
      meta && h('span', { class: 'result-meta' }, meta)),
    h('div', { class: 'table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {}, h('th', { class: 'rownum' }, '#'), r.columns.map((c) => h('th', {}, c)))),
        h('tbody', {}, rows.map((row, i) =>
          h('tr', {}, h('td', { class: 'rownum' }, i + 1), row.map((v) => cell(v))))))),
    r.values.length > maxRows && h('div', { class: 'result-more' }, `只顯示前 ${maxRows} 列，共 ${r.values.length} 列。`));
}

function cell(v) {
  if (v === null) return h('td', { class: 'null' }, 'NULL');
  // 不加千分位：ID、年份這類欄位加了反而誤導
  if (typeof v === 'number') return h('td', { class: 'num' }, Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000));
  return h('td', {}, String(v));
}

export function errorView(raw) {
  const e = translateError(raw);
  return h('div', { class: 'feedback feedback-error', role: 'alert' },
    h('div', { class: 'feedback-title' }, e.title),
    h('div', { class: 'feedback-body' }, e.tip),
    h('code', { class: 'feedback-raw' }, e.raw));
}
