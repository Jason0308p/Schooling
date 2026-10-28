/**
 * 課程總覽頁：課程介紹、進度、4 週學習計畫、完整大綱。
 */
import { h, icon, toast } from '../dom.js';
import { courseStats, unitStats, nextLesson, listCatalog, loadCourse } from '../../core/courseRegistry.js';
import { recommendNextCourse } from '../../core/learningPaths.js';

export async function renderCourse(app, { courseId }) {
  const course = await app.getCourse(courseId);
  if (!course) return h('div', { class: 'page' }, h('h1', {}, '找不到這門課'));
  const stats = courseStats(course, app.progress);
  const next = nextLesson(course, app.progress);
  const started = stats.exSolved > 0;
  const unitById = Object.fromEntries(course.units.map((u) => [u.id, u]));
  const publishedLessons = course.flat.length;
  let recommendation = null;
  if (stats.pct === 100) {
    const catalog = listCatalog().filter(entry => entry.load);
    const courses = (await Promise.all(catalog.map(entry => loadCourse(entry.id)))).filter(Boolean);
    const statsById = new Map(courses.map(item => [item.id, courseStats(item, app.progress)]));
    const result = recommendNextCourse(catalog, statsById, { afterCourseId: course.id, onlyUnstarted: true });
    const nextCourse = result ? courses.find(item => item.id === result.entry.id) : null;
    if (result && nextCourse) recommendation = { ...result, course: nextCourse };
  }

  return h('div', { class: 'page page-course' },
    h('section', { class: 'course-hero' },
      h('div', { class: 'course-hero-main' },
        h('a', { class: 'crumb', href: '#/' }, '所有課程'),
        h('h1', {}, course.title),
        h('p', { class: 'lead' }, course.subtitle),
        h('div', { class: 'meta-row' },
          h('span', {}, icon('clock'), ` 約 ${course.estimatedHours} 小時`),
          h('span', {}, `${course.units.length} 個單元`),
          h('span', {}, `${stats.plannedExercises} 道練習`),
          h('span', {}, course.level)),
        h('div', { class: 'hero-cta' },
          h('a', { class: 'btn btn-primary btn-lg', href: `#/learn/${course.id}/${next.lesson.id}` },
            started ? '繼續學習' : '開始第一課', icon('right')))),
      h('div', { class: 'course-hero-side card' },
        progressRing(stats.pct),
        h('div', { class: 'ring-caption' },
          h('strong', {}, `${stats.exSolved} / ${stats.exTotal} 題`),
          h('span', {}, `已開放 ${publishedLessons} 課 · 完成 ${stats.lessonsDone} 課`)),
        started && h('div', { class: 'next-up' },
          h('span', { class: 'muted' }, '下一課'),
          h('a', { href: `#/learn/${course.id}/${next.lesson.id}` }, next.lesson.title)))),

    h('div', { class: 'course-body' },
      h('section', { class: 'section' },
        h('h2', { class: 'section-title' }, '學完你會'),
        h('ul', { class: 'check-list' }, course.outcomes.map((o) => h('li', {}, icon('check'), h('span', {}, o))))),

      course.schedule?.length > 0 && h('section', { class: 'section' },
        h('h2', { class: 'section-title' }, '建議進度：4 週，每天約 1 小時'),
        h('div', { class: 'schedule' }, course.schedule.map((w) => h('div', { class: 'week card' },
          h('div', { class: 'week-no' }, `第 ${w.week} 週`),
          h('h3', {}, w.title),
          h('p', { class: 'muted' }, w.goal),
          h('ul', {}, w.units.map((id) => h('li', {}, `${unitById[id]?.no ?? ''} ${unitById[id]?.title ?? id}`))))))),

      h('section', { class: 'section' },
        h('h2', { class: 'section-title' }, '課程大綱'),
        h('div', { class: 'syllabus' }, course.units.map((u) => unitBlock(app, course, u)))),

      h('section', { class: 'section' },
        h('h2', { class: 'section-title' }, '適合誰'),
        h('ul', { class: 'check-list' }, (course.audience || []).map((o) => h('li', {}, icon('user'), h('span', {}, o)))),
        course.dataset && h('p', { class: 'muted' }, '練習資料：', h('a', { href: '#/data' }, course.dataset.name), '，' + course.dataset.description)),

      stats.pct === 100 && h('section', { class: 'section' },
        h('div', { class: 'certificate card', id: 'certificate' },
          h('div', { class: 'cert-badge' }, icon('check')),
          h('p', { class: 'cert-label' }, '結業證書'),
          h('h2', { class: 'cert-title' }, course.title),
          h('p', { class: 'cert-desc' }, `恭喜你完成了全部 ${stats.exTotal} 道練習題！`),
          h('p', { class: 'cert-date' }, `完成日期：${new Date().toLocaleDateString('zh-TW')}`),
          h('div', { class: 'cert-actions' },
            h('button', { class: 'btn btn-primary', onclick: () => window.print() }, '列印 / 存成 PDF'),
            h('button', { class: 'btn btn-secondary', onclick: () => {
              navigator.share ? navigator.share({ title: '我完成了 ' + course.title, url: location.href })
                : navigator.clipboard.writeText(location.href).then(() => toast('連結已複製'));
            }}, '分享')))),

      recommendation && h('section', { class: 'section' },
        h('p', { class: 'kicker' }, '完成之後學什麼？'),
        h('h2', { class: 'section-title' }, '推薦下一門課'),
        courseRecommendationCard(recommendation))));
}

function courseRecommendationCard(recommendation) {
  const firstLesson = recommendation.course.flat[0]?.lesson;
  return h('article', { class: 'recommendation-card card' },
    h('div', { class: 'recommendation-main' },
      h('div', { class: 'catalog-top' },
        h('span', { class: 'tag' }, recommendation.entry.level),
        h('span', { class: 'badge' }, recommendation.path.title)),
      h('h3', {}, recommendation.course.title),
      h('p', { class: 'muted' }, recommendation.reason),
      recommendation.entry.blurb && h('p', { class: 'recommendation-blurb' }, recommendation.entry.blurb)),
    h('div', { class: 'recommendation-action' },
      h('a', { class: 'btn btn-primary', href: firstLesson ? `#/learn/${recommendation.course.id}/${firstLesson.id}` : `#/course/${recommendation.course.id}` }, '開始下一門課', icon('right')),
      h('a', { class: 'btn btn-secondary btn-sm', href: `#/course/${recommendation.course.id}` }, '查看課程介紹')));
}

function unitBlock(app, course, u) {
  const published = u.status === 'published';
  const s = published ? unitStats(course, u, app.progress) : null;
  return h('details', { class: `unit card${published ? '' : ' is-soon'}`, open: published && s.pct < 100 },
    h('summary', {},
      h('span', { class: 'unit-no' }, String(u.no).padStart(2, '0')),
      h('span', { class: 'unit-main' },
        h('span', { class: 'unit-title' }, u.title),
        h('span', { class: 'unit-summary' }, u.summary)),
      published
        ? h('span', { class: 'unit-meta' }, h('span', {}, `${s.solved}/${s.total} 題`), h('span', { class: 'bar' }, h('i', { style: `width:${s.pct}%` })))
        : h('span', { class: 'badge' }, icon('lock'), ' 即將推出')),
    published
      ? h('ol', { class: 'lesson-list' }, u.lessons.map((l) => {
        const done = app.progress.isLessonDone(course.id, l);
        return h('li', { class: done ? 'done' : '' },
          h('a', { href: `#/learn/${course.id}/${l.id}` },
            h('span', { class: `dot${done ? ' done' : ''}` }, done ? icon('check') : ''),
            h('span', { class: 'lesson-name' }, l.title),
            h('span', { class: 'lesson-meta' }, `${l.minutes} 分 · ${(l.exercises || []).length} 題`)));
      }))
      : h('ol', { class: 'lesson-list soon' }, (u.outline || []).map((t) => h('li', {}, h('span', { class: 'dot' }), h('span', { class: 'lesson-name' }, t)))));
}

function progressRing(pct) {
  const r = 46, c = 2 * Math.PI * r;
  const el = h('div', { class: 'ring', role: 'img', 'aria-label': `完成 ${pct}%` });
  el.innerHTML = `<svg viewBox="0 0 110 110" width="132" height="132">
    <circle cx="55" cy="55" r="${r}" class="ring-track"/>
    <circle cx="55" cy="55" r="${r}" class="ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 55 55)"/>
    <text x="55" y="61" text-anchor="middle" class="ring-text">${pct}%</text></svg>`;
  return el;
}
