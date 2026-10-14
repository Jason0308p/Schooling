/**
 * 資料表說明頁：資料集介紹、關聯圖、每張表的欄位與資料預覽。
 */
import { h, icon, clear } from '../dom.js';
import { runIsolated } from '../../core/sqlEngine.js';
import { resultView } from '../components/resultTable.js';

const RELATIONS = `一 ──< 多         關聯欄位
customers ──< orders         customer_id   一位會員可以有多張訂單
orders    ──< order_items    order_id      一張訂單可以有多個商品
products  ──< order_items    product_id    一個商品出現在多筆明細
customers ──< sessions       customer_id   登入會員的網站造訪（訪客為 NULL）
sessions  ──< events         session_id    一次造訪有多個事件
products  ──< events         product_id    商品相關事件
campaigns ──< ad_spend       campaign_id   一個活動每天一列成效
campaigns ──< sessions       campaign_id   從廣告點進來的造訪`;

export async function renderData(app) {
  const course = await app.getCourse();
  const ds = course.dataset;
  const counts = Object.fromEntries(ds.tables.map((t) => {
    const r = runIsolated(ds, `SELECT COUNT(*) FROM ${t.name}`);
    return [t.name, r.ok ? r.last.values[0][0] : '?'];
  }));

  return h('div', { class: 'page page-data' },
    h('header', { class: 'page-head' },
      h('div', {},
        h('h1', {}, ds.name),
        h('p', { class: 'lead' }, ds.description))),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '資料表關聯'),
      h('div', { class: 'card' }, h('pre', { class: 'code relation' }, RELATIONS)),
      h('p', { class: 'muted' }, '注意：sessions / events 是網站追蹤資料（像 GA4），orders 是後台訂單。兩邊的「購買」數字本來就不會完全一致，第 9 單元會討論為什麼。')),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '資料表'),
      h('div', { class: 'table-cards' }, ds.tables.map((t) => tableCard(ds, t, counts[t.name])))));
}

function tableCard(ds, t, count) {
  const preview = h('div', { class: 'preview' });
  return h('section', { class: 'table-card card', id: `table-${t.name}` },
    h('header', {},
      h('h3', {}, h('code', {}, t.name), ' ', h('span', { class: 'muted' }, t.label)),
      h('span', { class: 'tag tag-soft' }, `${count} 列`)),
    h('p', {}, t.description),
    h('div', { class: 'table-wrap' },
      h('table', { class: 'data-table schema' },
        h('thead', {}, h('tr', {}, h('th', {}, '欄位'), h('th', {}, '型別'), h('th', {}, '說明'))),
        h('tbody', {}, t.columns.map(([n, ty, d]) => h('tr', {}, h('td', {}, h('code', {}, n)), h('td', { class: 'col-type' }, ty), h('td', {}, d)))))),
    h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => {
      clear(preview).append(resultView(runIsolated(ds, `SELECT * FROM ${t.name} LIMIT 5`), { title: `SELECT * FROM ${t.name} LIMIT 5` }));
    } }, icon('play'), h('span', {}, '預覽前 5 列')),
    preview);
}
