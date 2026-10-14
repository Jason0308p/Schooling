/**
 * 上課頁：左側課程目錄 + 課文 + 練習題 + 上一課 / 下一課。
 */
import { h, icon } from '../dom.js';
import { findLesson, unitStats, courseStats } from '../../core/courseRegistry.js';
import { renderMarkdown } from '../../core/markdown.js';
import { highlightBlocks } from '../components/sqlEditor.js';
import { hydrateRunnables, stashRawSql } from '../components/runnableExample.js';
import { exerciseCard } from '../components/exerciseCard.js';

const bodyCache = new Map();
async function loadBody(url) {
  if (!bodyCache.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`無法載入課文（${res.status}）`);
    bodyCache.set(url, await res.text());
  }
  return bodyCache.get(url);
}

export async function renderLesson(app, { courseId, lessonId }) {
  const course = await app.getCourse(courseId);
  const found = course && findLesson(course, lessonId);
  if (!found) return h('div', { class: 'page' }, h('h1', {}, '找不到這一課'), h('a', { href: `#/course/${courseId}` }, '回課程總覽'));
  const { unit, lesson, prev, next } = found;
  app.progress.visitLesson(course.id, lesson.id);

  const sidebar = h('aside', { class: 'lesson-sidebar', 'aria-label': '課程目錄' });
  const paintSidebar = () => sidebar.replaceChildren(...sidebarContent(app, course, lesson.id));
  paintSidebar();

  const article = h('article', { class: 'prose lesson-article' }, h('div', { class: 'skeleton' }, '載入課文中…'));
  const exercises = lesson.exercises || [];
  const completion = h('div', { class: 'completion' });

  const paintCompletion = () => {
    const done = app.progress.isLessonDone(course.id, lesson);
    completion.replaceChildren();
    if (!done) {
      const solved = exercises.filter((e) => app.progress.ex(e.id)?.status === 'solved').length;
      completion.append(h('p', { class: 'muted' }, `完成本課 ${exercises.length} 題練習即可結業本課（目前 ${solved} / ${exercises.length}）。`));
      return;
    }
    app.progress.completeLesson(course.id, lesson.id);
    completion.append(h('div', { class: 'completion-card card' },
      h('div', { class: 'completion-icon' }, icon('check')),
      h('div', {},
        h('h3', {}, '本課完成！'),
        h('p', { class: 'muted' }, next ? `下一課：${next.lesson.title}` : '你已完成目前開放的所有課程，新單元陸續推出中。')),
      next && h('a', { class: 'btn btn-primary', href: `#/learn/${course.id}/${next.lesson.id}` }, '下一課', icon('right'))));
  };

  const cards = exercises.map((ex, i) => exerciseCard(app, {
    course, exercise: ex, index: i,
    onSolved: () => { paintSidebar(); paintCompletion(); },
  }));

  const unitLabel = `單元 ${unit.no}`;
  const lessonNo = unit.lessons.findIndex((l) => l.id === lesson.id) + 1;
  const sidebarToggle = h('button', { class: 'btn btn-ghost btn-sm sidebar-toggle', type: 'button',
    onclick: () => document.body.classList.toggle('sidebar-open') }, icon('menu'), h('span', {}, '課程目錄'));

  const view = h('div', { class: 'lesson-layout' },
    sidebar,
    h('div', { class: 'sidebar-scrim', onclick: () => document.body.classList.remove('sidebar-open') }),
    h('div', { class: 'lesson-main' },
      sidebarToggle,
      h('nav', { class: 'breadcrumb', 'aria-label': '位置' },
        h('a', { href: `#/course/${course.id}` }, course.title), h('span', {}, '/'),
        h('span', {}, `${unitLabel} ${unit.title}`)),
      h('header', { class: 'lesson-head' },
        h('p', { class: 'kicker' }, `${unitLabel} · 第 ${lessonNo} 課`),
        h('h1', {}, lesson.title),
        h('div', { class: 'meta-row' },
          h('span', {}, icon('clock'), ` ${lesson.minutes} 分鐘`),
          h('span', {}, `${exercises.length} 道練習`)),
        lesson.objectives?.length > 0 && h('div', { class: 'objectives card' },
          h('div', { class: 'objectives-title' }, '本課學習目標'),
          h('ul', {}, lesson.objectives.map((o) => h('li', {}, o))))),
      article,
      exercises.length > 0 && h('section', { class: 'exercise-section' },
        h('h2', { class: 'section-title' }, '練習題'),
        h('p', { class: 'muted' }, '先按「執行」看結果，確認合理再「送出答案」。答對後建議看一下解說。'),
        cards.map((c) => c.el)),
      completion,
      h('nav', { class: 'pager', 'aria-label': '上一課 / 下一課' },
        prev ? h('a', { class: 'pager-link', href: `#/learn/${course.id}/${prev.lesson.id}` },
          h('span', { class: 'pager-dir' }, icon('left'), ' 上一課'), h('span', { class: 'pager-title' }, prev.lesson.title)) : h('span'),
        next ? h('a', { class: 'pager-link next', href: `#/learn/${course.id}/${next.lesson.id}` },
          h('span', { class: 'pager-dir' }, '下一課 ', icon('right')), h('span', { class: 'pager-title' }, next.lesson.title)) : h('span'))));

  paintCompletion();

  // 課文非同步載入
  loadBody(lesson.body).then((md) => {
    article.innerHTML = renderMarkdown(md);
    stashRawSql(article);
    highlightBlocks(article);
    hydrateRunnables(article, app, course.dataset);
  }).catch((e) => {
    article.replaceChildren(h('div', { class: 'feedback feedback-error' }, e.message,
      h('div', { class: 'feedback-body' }, '如果你是直接雙擊 index.html 開啟，請改用 start.bat 啟動（見 README）。')));
  });

  // 元件掛到畫面後 CodeMirror 需要 refresh 才能量對尺寸
  requestAnimationFrame(() => cards.forEach((c) => c.refresh()));
  document.body.classList.remove('sidebar-open');
  return view;
}

function sidebarContent(app, course, currentId) {
  const stats = courseStats(course, app.progress);
  return [
    h('div', { class: 'sidebar-head' },
      h('a', { class: 'sidebar-course', href: `#/course/${course.id}` }, course.title),
      h('div', { class: 'bar' }, h('i', { style: `width:${stats.pct}%` })),
      h('div', { class: 'sidebar-stat' }, `${stats.exSolved} / ${stats.exTotal} 題 · ${stats.pct}%`)),
    h('div', { class: 'sidebar-units' }, course.units.map((u) => {
      if (u.status !== 'published') {
        return h('div', { class: 'side-unit is-soon' }, h('div', { class: 'side-unit-title' }, h('span', {}, `${u.no}. ${u.title}`), icon('lock')));
      }
      const s = unitStats(course, u, app.progress);
      const hasCurrent = u.lessons.some((l) => l.id === currentId);
      return h('details', { class: 'side-unit', open: hasCurrent },
        h('summary', { class: 'side-unit-title' }, h('span', {}, `${u.no}. ${u.title}`), h('span', { class: 'side-unit-pct' }, `${s.pct}%`)),
        h('ol', {}, u.lessons.map((l) => {
          const done = app.progress.isLessonDone(course.id, l);
          const partial = !done && (l.exercises || []).some((e) => app.progress.ex(e.id)?.attempts);
          return h('li', {},
            h('a', { href: `#/learn/${course.id}/${l.id}`, class: l.id === currentId ? 'current' : '', 'aria-current': l.id === currentId ? 'page' : null },
              h('span', { class: `dot${done ? ' done' : partial ? ' partial' : ''}` }, done ? icon('check') : ''),
              h('span', {}, l.title)));
        })));
    })),
  ];
}

