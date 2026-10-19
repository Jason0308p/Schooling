/**
 * 全站外框：頂部導覽列 + 主內容區。
 */
import { h, icon } from './dom.js';

export function renderShell(app) {
  const streak = h('span', { class: 'streak', title: '連續學習天數' });
  const paintStreak = () => {
    const n = app.progress.streak();
    streak.replaceChildren(icon('flame'), h('span', {}, n ? `${n} 天` : '0 天'));
    streak.classList.toggle('on', n > 0);
  };
  app.progress.onChange(paintStreak);
  paintStreak();

  const nav = [
    ['home', '#/', '所有課程'],
    ['playground', '#/playground', '練習場'],
    ['data', '#/data', '資料表'],
    ['progress', '#/progress', '我的進度'],
  ];

  const header = h('header', { class: 'topbar' },
    h('div', { class: 'topbar-inner' },
      h('a', { class: 'brand', href: '#/' },
        h('span', { class: 'brand-mark' }, app.config.brand.logoMark),
        h('span', { class: 'brand-name' }, app.config.brand.name)),
      h('nav', { class: 'topnav', 'aria-label': '主選單' },
        nav.map(([key, href, label]) => h('a', { href, 'data-nav': key }, label))),
      h('div', { class: 'topbar-actions' },
        streak,
        h('button', { class: 'icon-btn', type: 'button', title: '資料表參考', 'aria-label': '資料表參考', onclick: () => app.openSchema(), id: 'schema-btn' }, icon('db')),
        h('button', { class: 'icon-btn', type: 'button', title: '切換深色 / 淺色', 'aria-label': '切換深色 / 淺色', onclick: () => app.toggleTheme() }, icon('moon')))));

  const main = h('main', { id: 'view', tabindex: '-1' });
  document.getElementById('app').replaceChildren(header, main);
  return { main };
}

export function setActiveNav(key) {
  document.querySelectorAll('.topnav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === key));
}
