/**
 * 我的學習 Dashboard：全站統計、繼續學習、各課程進度、活動、錯題與備份。
 */
import { h, icon, toast } from '../dom.js';
import { listCatalog, loadCourse, courseStats, nextLesson } from '../../core/courseRegistry.js';

export async function renderProgress(app) {
  const catalog = listCatalog().filter(c => c.load);
  const courses = (await Promise.all(catalog.map(c => loadCourse(c.id)))).filter(Boolean);
  const catalogById = new Map(catalog.map(c => [c.id, c]));
  const statsById = new Map(courses.map(course => [course.id, courseStats(course, app.progress)]));
  const d = app.progress.data;

  const totals = courses.reduce((sum, course) => {
    const stats = statsById.get(course.id);
    sum.exTotal += stats.exTotal;
    sum.exSolved += stats.exSolved;
    sum.lessonsTotal += stats.lessonsTotal;
    sum.lessonsDone += stats.lessonsDone;
    return sum;
  }, { exTotal: 0, exSolved: 0, lessonsTotal: 0, lessonsDone: 0 });
  const overallPct = totals.exTotal ? Math.round((totals.exSolved / totals.exTotal) * 100) : 0;
  const attempts = Object.values(d.exercises).reduce((sum, state) => sum + (state.attempts || 0), 0);
  const weekDays = activeDaysInLast(7, d.activity);
  const completedCourses = courses.filter(course => statsById.get(course.id).pct === 100);
  const continueTarget = resolveContinueTarget(courses, statsById, app.progress, d.last);
  const wrongExs = collectWrongExercises(courses, app.progress);
  const reviewPanel = wrongReviewPanel(app, wrongExs);

  const io = h('textarea', { class: 'io-box', rows: 6, spellcheck: 'false', placeholder: '貼上之前匯出的進度 JSON，再按「匯入」' });
  const resetConfirm = h('span', { class: 'inline-confirm', hidden: true },
    h('span', {}, '所有作答紀錄都會刪除，確定？'),
    h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { app.progress.reset(); toast('進度已清除'); location.reload(); } }, '確定清除'),
    h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { resetConfirm.hidden = true; } }, '取消'));

  return h('div', { class: 'page page-progress dashboard-page' },
    h('header', { class: 'dashboard-head' },
      h('div', {},
        h('p', { class: 'kicker' }, greeting()),
        h('h1', {}, '我的學習 Dashboard'),
        h('p', { class: 'muted' }, overallPct ? `全站進度 ${overallPct}% · 已完成 ${totals.exSolved} / ${totals.exTotal} 題` : '選一條學習路徑，開始累積你的第一筆進度。')),
      continueTarget && h('a', { class: 'btn btn-primary btn-lg', href: `#/learn/${continueTarget.course.id}/${continueTarget.lesson.id}` },
        '繼續上次學習', icon('right'))),

    h('section', { class: 'kpi-grid dashboard-kpis' },
      kpi(`${overallPct}%`, '全站完成率'),
      kpi(`${totals.exSolved}`, `/ ${totals.exTotal} 題已完成`),
      kpi(`${weekDays}`, '天本週有學習'),
      kpi(`${app.progress.streak()}`, '天連續學習')),

    continueTarget && h('section', { class: 'section dashboard-continue' },
      h('h2', { class: 'section-title' }, '繼續學習'),
      h('div', { class: 'continue-card card' },
        h('div', { class: 'continue-main' },
          h('span', { class: 'tag' }, continueTarget.entry.level),
          h('h3', {}, continueTarget.course.title),
          h('p', { class: 'muted' }, `下一課：${continueTarget.lesson.title}`),
          h('div', { class: 'catalog-progress' },
            h('div', { class: 'bar' }, h('i', { style: `width:${continueTarget.stats.pct}%` })),
            h('span', {}, `${continueTarget.stats.exSolved} / ${continueTarget.stats.exTotal} 題 · ${continueTarget.stats.pct}%`))),
        h('a', { class: 'btn btn-primary', href: `#/learn/${continueTarget.course.id}/${continueTarget.lesson.id}` }, '繼續', icon('right')))),

    h('section', { class: 'section' },
      h('div', { class: 'section-heading' },
        h('div', {}, h('h2', { class: 'section-title' }, '我的課程'), h('p', { class: 'muted' }, '每門課的進度都會獨立記錄。')),
        h('span', { class: 'badge' }, `${courses.filter(course => hasStarted(course, app.progress)).length} 門已開始`)),
      h('div', { class: 'dashboard-course-grid' }, courses.map(course => dashboardCourseCard(course, catalogById.get(course.id), statsById.get(course.id), app.progress)))),

    h('section', { class: 'section dashboard-split' },
      h('div', {},
        h('h2', { class: 'section-title' }, '最近 12 週'),
        h('div', { class: 'card' }, heatmap(d.activity))),
      h('div', {},
        h('h2', { class: 'section-title' }, '學習摘要'),
        h('div', { class: 'card summary-list' },
          summaryRow('已完成課程', `${completedCourses.length} / ${courses.length}`),
          summaryRow('已完成課數', `${totals.lessonsDone} / ${totals.lessonsTotal}`),
          summaryRow('累計送出', `${attempts} 次`),
          summaryRow('待複習題目', `${wrongExs.length} 題`)))),

    h('section', { class: 'section' },
      h('div', { class: 'section-heading' },
        h('div', {}, h('h2', { class: 'section-title' }, icon('bulb'), ' 錯題複習'), h('p', { class: 'muted' }, '依課程篩選錯題，或隨機抽一題重新練習。')),
        wrongExs.length > 0 && h('span', { class: 'badge badge-warn' }, `${wrongExs.length} 題待複習`)),
      reviewPanel),

    h('section', { class: 'section' },
      h('div', { class: 'section-heading' },
        h('div', {}, h('h2', { class: 'section-title' }, '我的證書'), h('p', { class: 'muted' }, '完成全部練習題後即可查看並列印證書。')),
        h('span', { class: 'badge badge-ok' }, `${completedCourses.length} 張已取得`)),
      completedCourses.length === 0
        ? h('div', { class: 'card dashboard-empty' }, h('strong', {}, '還沒有取得證書'), h('p', { class: 'muted' }, '完成任一門課的全部練習題，證書就會出現在這裡。'))
        : h('div', { class: 'certificate-grid' }, completedCourses.map(course =>
          h('a', { class: 'certificate-mini card', href: `#/course/${course.id}` }, icon('check'), h('span', {}, course.title), h('strong', {}, '查看證書'))))),

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

function resolveContinueTarget(courses, statsById, progress, last) {
  let course = last ? courses.find(c => c.id === last.courseId) : null;
  if (!course || statsById.get(course.id).pct === 100) {
    course = courses.find(c => statsById.get(c.id).exSolved > 0 && statsById.get(c.id).pct < 100)
      || courses.find(c => statsById.get(c.id).pct < 100)
      || courses[0];
  }
  if (!course) return null;
  const next = nextLesson(course, progress);
  const entry = listCatalog().find(c => c.id === course.id);
  return { course, lesson: next.lesson, stats: statsById.get(course.id), entry };
}

function dashboardCourseCard(course, entry, stats, progress) {
  const next = nextLesson(course, progress);
  const started = hasStarted(course, progress);
  const state = stats.pct === 100 ? '已完成' : started ? '學習中' : '尚未開始';
  const href = stats.pct === 100 ? `#/course/${course.id}` : `#/learn/${course.id}/${next.lesson.id}`;
  return h('article', { class: `dashboard-course card${started ? ' is-started' : ''}${stats.pct === 100 ? ' is-complete' : ''}` },
    h('span', { class: 'catalog-rail', 'aria-hidden': 'true' }),
    h('div', { class: 'dashboard-course-body' },
      h('div', { class: 'catalog-top' }, h('span', { class: 'tag' }, entry.level), h('span', { class: `badge${stats.pct === 100 ? ' badge-ok' : ''}` }, state)),
      h('h3', {}, course.title)),
    h('div', { class: 'dashboard-course-action' },
      h('div', { class: 'catalog-progress' },
        h('div', { class: 'bar' }, h('i', { style: `width:${stats.pct}%` })),
        h('span', {}, `${stats.exSolved} / ${stats.exTotal} 題 · ${stats.pct}%`)),
      h('a', { class: 'btn btn-primary btn-sm', href }, stats.pct === 100 ? '查看課程與證書' : started ? '繼續學習' : '開始課程')));
}

function hasStarted(course, progress) {
  return course.flat.some(({ lesson }) => {
    if (progress.data.lessons[`${course.id}/${lesson.id}`]?.visitedAt) return true;
    return (lesson.exercises || []).some(ex => !!progress.ex(ex.id));
  });
}

function wrongReviewPanel(app, wrongExs) {
  if (wrongExs.length === 0) {
    return h('div', { class: 'card dashboard-empty' },
      h('strong', {}, '目前沒有待複習題目'),
      h('p', { class: 'muted' }, '答錯的題目會自動出現在這裡；答對後會自動移出。'));
  }

  let courseId = 'all';
  const list = h('div', { class: 'wrong-ex-list' });
  const count = h('span', { class: 'review-count muted' });
  const courseOptions = [...new Map(wrongExs.map(row => [row.course.id, row.course.title])).entries()];
  const select = h('select', { class: 'review-filter', 'aria-label': '依課程篩選錯題', onchange: (event) => { courseId = event.target.value; paint(); } },
    h('option', { value: 'all' }, '全部課程'),
    courseOptions.map(([id, title]) => h('option', { value: id }, title)));

  const filtered = () => courseId === 'all' ? wrongExs : wrongExs.filter(row => row.course.id === courseId);
  const openReview = (row) => app.openReview(row.course.id, row.lesson.id, row.ex.id);
  const randomBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: () => {
    const rows = filtered();
    if (!rows.length) return;
    openReview(rows[Math.floor(Math.random() * rows.length)]);
  } }, icon('play'), h('span', {}, '隨機抽一題'));

  const paint = () => {
    const rows = filtered();
    count.textContent = `顯示 ${rows.length} 題`;
    randomBtn.disabled = rows.length === 0;
    list.replaceChildren(...rows.map(({ course, lesson, ex, attempts, lastAttemptAt }) =>
      h('div', { class: 'wrong-ex-item' },
        h('div', { class: 'wrong-ex-main' },
          h('span', { class: 'wrong-ex-course' }, course.title),
          h('strong', { class: 'wrong-ex-title' }, ex.title || ex.question || '未命名題目'),
          h('span', { class: 'wrong-ex-time' }, `上次作答：${formatReviewTime(lastAttemptAt)}`)),
        h('span', { class: 'wrong-ex-attempts' }, `答錯 ${attempts} 次`),
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => openReview({ course, lesson, ex }) }, '重新作答'))));
  };

  const panel = h('div', { class: 'card review-panel' },
    h('div', { class: 'review-toolbar' }, select, count, h('span', { class: 'spacer' }), randomBtn),
    list);
  paint();
  return panel;
}

function formatReviewTime(value) {
  if (!value) return '較早的紀錄';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '較早的紀錄';
  return date.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function collectWrongExercises(courses, progress) {
  const rows = [];
  courses.forEach(course => course.flat.forEach(({ lesson }) => (lesson.exercises || []).forEach(ex => {
    const state = progress.ex(ex.id);
    if (state?.attempts > 0 && state.status !== 'solved') rows.push({
      course, lesson, ex, attempts: state.attempts, lastAttemptAt: state.lastAttemptAt || state.lastWrongAt || null,
    });
  })));
  return rows.sort((a, b) => {
    const timeDiff = new Date(b.lastAttemptAt || 0) - new Date(a.lastAttemptAt || 0);
    return timeDiff || b.attempts - a.attempts;
  });
}

function activeDaysInLast(days, activity) {
  let total = 0;
  const d = new Date();
  for (let i = 0; i < days; i += 1) {
    const key = localDate(d);
    if ((activity[key] || 0) > 0) total += 1;
    d.setDate(d.getDate() - 1);
  }
  return total;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return '早安，今天想學什麼？';
  if (hour < 18) return '繼續累積你的技能';
  return '晚安，完成一小課也算進步';
}

function localDate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const kpi = (number, label) => h('div', { class: 'kpi card' }, h('strong', {}, number), h('span', {}, label));
const summaryRow = (label, value) => h('div', { class: 'summary-row' }, h('span', {}, label), h('strong', {}, value));

function heatmap(activity) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7 * 12 + 1 - end.getDay());
  const cells = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = localDate(d);
    const n = activity[key] || 0;
    const level = n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : 3;
    cells.push(h('i', { class: `lv${level}`, title: `${key}：${n} 次` }));
  }
  return h('div', { class: 'heatmap-wrap' },
    h('div', { class: 'heatmap', role: 'img', 'aria-label': '最近 12 週的學習紀錄' }, cells),
    h('div', { class: 'heatmap-legend muted' }, '少', [0, 1, 2, 3].map(level => h('i', { class: `lv${level}` })), '多'));
}
