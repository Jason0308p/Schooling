/**
 * 我的進度：統計、學習日曆、各單元進度、進度備份 / 還原 / 重設。
 */
import { h, icon, toast } from '../dom.js';
import { courseStats, unitStats } from '../../core/courseRegistry.js';

export async function renderProgress(app) {
  const course = await app.getCourse();
  const stats = courseStats(course, app.progress);
  const d = app.progress.data;
  const revealed = Object.values(d.exercises).filter((e) => e.revealed).length;
  const attempts = Object.values(d.exercises).reduce((s, e) => s + (e.attempts || 0), 0);

  const io = h('textarea', { class: 'io-box', rows: 6, spellcheck: 'false', placeholder: '貼上之前匯出的進度 JSON，再按「匯入」' });
  const resetConfirm = h('span', { class: 'inline-confirm', hidden: true },
    h('span', {}, '所有作答紀錄都會刪除，確定？'),
    h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { app.progress.reset(); toast('進度已清除'); location.reload(); } }, '確定清除'),
    h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { resetConfirm.hidden = true; } }, '取消'));

  return h('div', { class: 'page page-progress' },
    h('header', { class: 'page-head' }, h('div', {}, h('h1', {}, '我的學習進度'), h('p', { class: 'muted' }, course.title))),
    h('section', { class: 'kpi-grid' },
      kpi(`${stats.exSolved}`, `/ ${stats.exTotal} 題已完成`),
      kpi(`${stats.lessonsDone}`, `/ ${stats.lessonsTotal} 課已完成`),
      kpi(`${app.progress.streak()}`, '天連續學習'),
      kpi(`${attempts}`, `次送出 · ${revealed} 題看過解答`)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '最近 12 週'),
      h('div', { class: 'card' }, heatmap(d.activity))),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '各單元'),
      h('div', { class: 'card unit-bars' }, course.units.map((u) => {
        if (u.status !== 'published') return h('div', { class: 'unit-bar is-soon' }, h('span', {}, `${u.no}. ${u.title}`), h('span', { class: 'muted' }, '即將推出'));
        const s = unitStats(course, u, app.progress);
        return h('div', { class: 'unit-bar' },
          h('a', { href: `#/learn/${course.id}/${u.lessons[0].id}` }, `${u.no}. ${u.title}`),
          h('span', { class: 'bar' }, h('i', { style: `width:${s.pct}%` })),
          h('span', { class: 'num' }, `${s.solved}/${s.total}`));
      }))),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '備份與還原'),
      h('div', { class: 'card stack' },
        h('p', { class: 'muted' }, '進度只存在這台電腦的這個瀏覽器。換電腦或清除瀏覽器資料前，先匯出備份。'),
        io,
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { io.value = app.progress.exportJSON(); io.select(); toast('已產生備份，請複製保存', 'info'); } }, '匯出進度'),
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => {
            try { app.progress.importJSON(io.value); toast('進度已匯入'); location.reload(); } catch (e) { toast('匯入失敗：' + e.message, 'error'); }
          } }, '匯入'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-ghost danger-text', type: 'button', onclick: () => { resetConfirm.hidden = false; } }, icon('reset'), h('span', {}, '清除所有進度')),
          resetConfirm))));
}

const kpi = (n, label) => h('div', { class: 'kpi card' }, h('strong', {}, n), h('span', {}, label));

function heatmap(activity) {
  const p = (n) => String(n).padStart(2, '0');
  const key = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7 * 12 + 1 - end.getDay());
  const cells = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const n = activity[key(d)] || 0;
    const lv = n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : 3;
    cells.push(h('i', { class: `lv${lv}`, title: `${key(d)}：${n} 次` }));
  }
  return h('div', { class: 'heatmap-wrap' },
    h('div', { class: 'heatmap', role: 'img', 'aria-label': '最近 12 週的學習紀錄' }, cells),
    h('div', { class: 'heatmap-legend muted' }, '少', [0, 1, 2, 3].map((l) => h('i', { class: `lv${l}` })), '多'));
}
