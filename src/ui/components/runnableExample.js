/**
 * 課文裡 ```sql run 區塊的互動：執行、帶到練習場。
 */
import { h, icon, clear } from '../dom.js';
import { runIsolated } from '../../core/sqlEngine.js';
import { resultView } from './resultTable.js';

export function hydrateRunnables(root, app, dataset) {
  root.querySelectorAll('.runnable').forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = '1';
    const pre = box.querySelector('pre');
    const sql = pre.dataset.raw || pre.textContent;
    const out = h('div', { class: 'runnable-out' });
    const bar = h('div', { class: 'runnable-bar' },
      h('span', { class: 'runnable-label' }, '範例'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => app.openInPlayground(sql) }, '在練習場修改'),
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => {
        clear(out).append(resultView(runIsolated(dataset, sql), { maxRows: 50 }));
      } }, icon('play'), h('span', {}, '執行')));
    box.prepend(bar);
    box.append(out);
  });
}

/** 在上色前記下原始 SQL（上色會把 textContent 拆成 span，但 textContent 仍相同；保留以防萬一） */
export function stashRawSql(root) {
  root.querySelectorAll('.runnable pre').forEach((pre) => { pre.dataset.raw = pre.textContent; });
}
