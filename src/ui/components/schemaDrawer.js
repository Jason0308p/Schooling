/**
 * 右側滑出的「資料表」參考面板。點欄位名稱 → 插入到最後使用的編輯器。
 */
import { h, icon, toast } from '../dom.js';
import { getLastFocusedEditor } from './sqlEditor.js';

let drawer = null;

export function openSchemaDrawer(dataset) {
  if (!drawer) drawer = buildDrawer(dataset);
  drawer.classList.add('open');
  document.body.classList.add('drawer-open');
  drawer.querySelector('.drawer-close').focus();
}

export function closeSchemaDrawer() {
  if (!drawer) return;
  drawer.classList.remove('open');
  document.body.classList.remove('drawer-open');
}

function insert(text) {
  const ed = getLastFocusedEditor();
  if (!ed) { toast('先點一下要輸入的編輯器，再點欄位名稱', 'info'); return; }
  ed.insert(text);
  toast(`已插入 ${text}`, 'info');
}

function buildDrawer(dataset) {
  const el = h('aside', { class: 'drawer', 'aria-label': '資料表參考' },
    h('div', { class: 'drawer-head' },
      h('div', {},
        h('div', { class: 'drawer-kicker' }, icon('db'), ' 資料表參考'),
        h('div', { class: 'drawer-title' }, dataset.name)),
      h('button', { class: 'icon-btn drawer-close', type: 'button', 'aria-label': '關閉', onclick: closeSchemaDrawer }, icon('close'))),
    h('p', { class: 'drawer-tip' }, '點表名或欄位名稱，會插入到你最後使用的編輯器。'),
    h('div', { class: 'drawer-body' },
      dataset.tables.map((t, i) => h('details', { class: 'schema-table', open: i < 2 },
        h('summary', {},
          h('button', { class: 'chip chip-table', type: 'button', onclick: (e) => { e.preventDefault(); insert(t.name); } }, t.name),
          h('span', { class: 'schema-label' }, t.label)),
        h('p', { class: 'schema-desc' }, t.description),
        h('table', { class: 'schema-cols' },
          h('tbody', {}, t.columns.map(([name, type, desc]) => h('tr', {},
            h('td', {}, h('button', { class: 'chip', type: 'button', onclick: () => insert(name) }, name)),
            h('td', { class: 'col-type' }, type),
            h('td', { class: 'col-desc' }, desc)))))))));
  document.body.append(el);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSchemaDrawer(); });
  return el;
}
