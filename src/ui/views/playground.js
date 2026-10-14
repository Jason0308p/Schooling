/**
 * 練習場：自由寫 SQL，可以修改資料；按「重置資料庫」還原。
 */
import { h, icon, clear, toast } from '../dom.js';
import { workspace, runSql } from '../../core/sqlEngine.js';
import { createSqlEditor, hintTables } from '../components/sqlEditor.js';
import { resultView } from '../components/resultTable.js';

const DEFAULT_SQL = '-- 自由練習區：可以寫任何 SQL，包括 INSERT / UPDATE / DELETE\n-- 弄亂了按右上角「重置資料庫」即可還原\nSELECT *\nFROM orders\nLIMIT 10;';

export async function renderPlayground(app) {
  const course = await app.getCourse();
  const dataset = course.dataset;
  const pending = app.takePlaygroundSql();
  const initial = pending ?? app.prefs.get('playgroundSql') ?? DEFAULT_SQL;

  const output = h('div', { class: 'pg-output' }, h('div', { class: 'result-empty' }, '按「執行」或 Ctrl + Enter 查看結果。'));
  const editorHost = h('div', { class: 'editor-host' });

  const run = () => {
    const sql = editor.getValue();
    clear(output);
    if (!sql.trim()) return;
    const r = runSql(workspace(dataset), sql);
    output.append(resultView(r, { title: '結果', maxRows: 500 }));
    if (r.ok && r.results.length > 1) output.prepend(h('p', { class: 'muted' }, `共執行 ${r.results.length} 個查詢，顯示最後一個的結果。`));
  };
  const resetBox = h('span', { class: 'inline-confirm', hidden: true },
    h('span', {}, '確定要還原所有資料？'),
    h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => {
      workspace(dataset, { reset: true });
      resetBox.hidden = true;
      toast('資料庫已還原成初始狀態');
    } }, '還原'),
    h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { resetBox.hidden = true; } }, '取消'));

  const view = h('div', { class: 'page page-playground' },
    h('header', { class: 'page-head' },
      h('div', {},
        h('h1', {}, '練習場'),
        h('p', { class: 'muted' }, '這裡的資料庫會保留你的修改（重新整理頁面後還原）。課程練習題則每次都用全新的資料庫批改，不受這裡影響。')),
      h('div', { class: 'page-head-actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => app.openSchema() }, icon('db'), h('span', {}, '資料表')),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { resetBox.hidden = false; } }, icon('reset'), h('span', {}, '重置資料庫')),
        resetBox)),
    h('div', { class: 'editor-frame card' },
      editorHost,
      h('div', { class: 'editor-toolbar' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: run }, icon('play'), h('span', {}, '執行')),
        h('span', { class: 'kbd-hint' }, 'Ctrl + Enter 執行 · Ctrl + Space 自動完成'))),
    output);

  const editor = createSqlEditor(editorHost, {
    value: initial,
    tables: hintTables(dataset),
    onRun: run,
    minLines: 10,
    onChange: (v) => app.prefs.set('playgroundSql', v),
  });
  requestAnimationFrame(() => { editor.refresh(); editor.focus(); if (pending) run(); });
  return view;
}
