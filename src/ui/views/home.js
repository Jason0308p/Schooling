/**
 * 首頁：品牌主視覺、學習路徑、課程搜尋與個別進度。
 */
import { h, icon } from '../dom.js';
import { listCatalog, loadCourse, courseStats, nextLesson } from '../../core/courseRegistry.js';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'sql', label: 'SQL 分析', match: c => c.tags?.some(t => ['SQL', 'BigQuery', 'GA4', '資料分析', '面試'].includes(t)) },
  { key: 'ai', label: 'AI 工具', match: c => c.tags?.some(t => ['AI', 'Prompt', 'ChatGPT', 'Claude'].includes(t)) },
  { key: 'pm', label: 'PM 實務', match: c => c.tags?.some(t => ['PM', 'PRD', 'Product', 'Growth', 'AARRR'].includes(t)) },
];

const LEARNING_PATHS = [
  { title: 'SQL 分析師路徑', audience: 'Excel 使用者、數據分析初學者', hours: '約 20 小時', outcome: '從試算表思維走到能獨立完成 SQL 分析與面試題。', courses: ['excel-to-sql', 'sql-foundations', 'sql-interview'] },
  { title: '行銷數據路徑', audience: '行銷、Growth、電商營運', hours: '約 24 小時', outcome: '從資料查詢、GA4 事件分析到成長與儀表板決策。', courses: ['sql-foundations', 'bigquery-ga4', 'looker-studio', 'growth-analytics'] },
  { title: 'PM 產品路徑', audience: 'PM、產品營運、創業團隊', hours: '約 20 小時', outcome: '用數據做產品決策，並把需求寫成可執行的 PRD。', courses: ['pm-sql', 'growth-analytics', 'prd-writing', 'ai-workflow'] },
  { title: 'AI 生產力路徑', audience: '行銷、PM、內容與知識工作者', hours: '約 9 小時', outcome: '建立可靠的 AI 工作流程，寫出可重複使用的 Prompt。', courses: ['ai-workflow', 'prompt-engineering'] },
];

export async function renderHome(app) {
  const catalog = listCatalog().filter(c => c.load);
  const loadedCourses = (await Promise.all(catalog.map(c => loadCourse(c.id)))).filter(Boolean);
  const courseById = new Map(loadedCourses.map(c => [c.id, c]));
  const statsById = new Map(loadedCourses.map(c => [c.id, courseStats(c, app.progress)]));
  const defaultCourse = await app.getCourse();
  const defaultStats = statsById.get(defaultCourse.id);
  const started = defaultStats.exSolved > 0;
  const next = nextLesson(defaultCourse, app.progress);
  const totals = loadedCourses.reduce((sum, course) => {
    const stats = statsById.get(course.id);
    sum.lessons += stats.lessonsTotal;
    sum.exercises += stats.exTotal;
    return sum;
  }, { lessons: 0, exercises: 0 });

  return h('div', { class: 'page page-home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('p', { class: 'kicker' }, '真實工作技能的互動學習平台'),
        h('h1', {}, '學到用得上的技能，', h('br'), '在瀏覽器裡直接練'),
        h('p', { class: 'lead' }, '從 SQL、GA4、Growth、PRD 到 AI 工作術——依照你的職涯目標選一條路徑，每一課都有互動練習與即時解說。'),
        h('div', { class: 'hero-cta' },
          h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => {
            if (started) location.hash = `#/learn/${defaultCourse.id}/${next.lesson.id}`;
            else document.getElementById('learning-paths')?.scrollIntoView({ behavior: 'smooth' });
          } }, started ? `繼續：${next.lesson.title}` : '選擇學習路徑', icon('right')),
          h('button', { class: 'btn btn-secondary btn-lg', type: 'button', onclick: () => document.getElementById('course-catalog')?.scrollIntoView({ behavior: 'smooth' }) }, '瀏覽全部課程')),
        h('ul', { class: 'hero-points' },
          h('li', {}, icon('check'), '免安裝，瀏覽器內直接練習'),
          h('li', {}, icon('check'), 'SQL 實作與選擇題即時回饋'),
          h('li', {}, icon('check'), '進度自動儲存，隨時繼續'))),
      h('div', { class: 'hero-courses', 'aria-label': '課程預覽' },
        h('div', { class: 'course-preview-grid' }, catalog.slice(0, 3).map(c => coursePreview(c, statsById.get(c.id)))))),

    h('section', { class: 'stat-strip', 'aria-label': '平台內容統計' },
      [[catalog.length, '門課程'], [totals.lessons, '課'], [totals.exercises, '道練習題'], [0, '元費用']].map(([n, label]) =>
        h('div', { class: 'stat' }, h('strong', {}, n), h('span', {}, label)))),

    h('section', { class: 'section', id: 'learning-paths' },
      h('div', { class: 'section-heading' },
        h('div', {}, h('p', { class: 'kicker' }, '不知道從哪裡開始？'), h('h2', { class: 'section-title' }, '依你的目標選一條學習路徑')),
        h('p', { class: 'muted' }, '路徑只是建議，你仍可以自由選修任何一門課。')),
      h('div', { class: 'path-grid' }, LEARNING_PATHS.map(path => learningPathCard(path, catalog, courseById, statsById, app.progress)))),

    h('section', { class: 'section', id: 'course-catalog' },
      h('div', { class: 'section-heading' },
        h('div', {}, h('p', { class: 'kicker' }, '依技能自由選修'), h('h2', { class: 'section-title' }, '所有課程')),
        h('p', { class: 'muted' }, '可搜尋課程名稱、工具或技能標籤。')),
      catalogSection(catalog, statsById)),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '為什麼選 Schooling'),
      h('div', { class: 'feature-grid' },
        feature('真實工作情境', '練的是把業務問題轉成可執行的解法，不是背語法。'),
        feature('即時批改 + 解說', 'SQL 比對實際結果，選擇題即時回饋，答對後仍能看完整解說。'),
        feature('跨技能學習路徑', '從 SQL、GA4、產品分析到 AI 工作術，依職涯目標循序學習。'),
        feature('不用安裝任何東西', '開啟瀏覽器即可開始，SQL 資料庫也直接在本機瀏覽器執行。'))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '每一課的學習方式'),
      h('ol', { class: 'steps' },
        step('讀課文', '短篇說明與真實案例，先理解為什麼需要這項技能。'),
        step('跑範例', 'SQL 課可直接執行與修改範例；實務課提供可複製模板。'),
        step('做練習', 'SQL 題即時批改，選擇題即時對答。'),
        step('複習與延伸', '查看標準解法、常見錯誤、錯題清單與下一門推薦課程。'))),

    h('footer', { class: 'site-footer' },
      h('span', {}, `${app.config.brand.name} · v${app.config.appVersion}`),
      h('span', {}, '練習資料為虛構的模擬資料')));
}

function coursePreview(course, stats) {
  return h('a', { class: 'course-preview-card', href: courseHref(course.id, stats) },
    h('div', { class: 'catalog-top' }, h('span', { class: 'tag' }, course.level), stats.pct === 100 && h('span', { class: 'badge badge-ok' }, '已完成')),
    h('strong', {}, course.title),
    course.blurb && h('p', {}, course.blurb),
    progressSummary(stats));
}

function learningPathCard(path, catalog, courseById, statsById, progress) {
  const entries = path.courses.map(id => catalog.find(c => c.id === id)).filter(Boolean);
  const solved = entries.reduce((sum, c) => sum + statsById.get(c.id).exSolved, 0);
  const total = entries.reduce((sum, c) => sum + statsById.get(c.id).exTotal, 0);
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const current = entries.find(c => statsById.get(c.id).pct < 100) || entries[entries.length - 1];
  const currentStats = statsById.get(current.id);
  const loaded = courseById.get(current.id);
  const next = loaded ? nextLesson(loaded, progress) : null;
  const href = currentStats.exSolved > 0 && next ? `#/learn/${loaded.id}/${next.lesson.id}` : `#/course/${current.id}`;

  return h('article', { class: 'path-card card' },
    h('div', { class: 'path-head' },
      h('div', {}, h('h3', {}, path.title), h('p', { class: 'muted' }, path.audience)),
      h('span', { class: 'badge' }, path.hours)),
    h('p', { class: 'path-outcome' }, path.outcome),
    h('ol', { class: 'path-course-list' }, entries.map((c, i) => {
      const done = statsById.get(c.id).pct === 100;
      return h('li', { class: done ? 'is-done' : '' },
        h('span', { class: 'path-step-no' }, done ? '✓' : i + 1),
        h('a', { href: `#/course/${c.id}` }, c.title));
    })),
    h('div', { class: 'catalog-progress' },
      h('div', { class: 'bar' }, h('i', { style: `width:${pct}%` })),
      h('span', {}, pct ? `路徑進度 ${pct}%` : `${entries.length} 門課 · 尚未開始`)),
    h('a', { class: 'btn btn-secondary', href }, pct ? '繼續這條路徑' : '開始這條路徑', icon('right')));
}

function catalogSection(catalog, statsById) {
  let active = 'all';
  let query = '';
  const grid = h('div', { class: 'catalog-grid' });
  const count = h('span', { class: 'catalog-count' });

  const render = () => {
    const filter = FILTERS.find(f => f.key === active);
    const keyword = query.trim().toLocaleLowerCase('zh-TW');
    const list = catalog.filter(c => {
      const matchesFilter = !filter.match || filter.match(c);
      const haystack = [c.title, c.blurb, c.level, ...(c.tags || [])].filter(Boolean).join(' ').toLocaleLowerCase('zh-TW');
      return matchesFilter && (!keyword || haystack.includes(keyword));
    });
    count.textContent = `${list.length} 門課`;
    grid.replaceChildren(...(list.length
      ? list.map(c => catalogCard(c, statsById.get(c.id)))
      : [h('div', { class: 'catalog-empty card' }, h('strong', {}, '找不到符合的課程'), h('p', { class: 'muted' }, '試試其他關鍵字，或切換回「全部」。'))]));
  };

  const search = h('input', {
    class: 'course-search', type: 'search', placeholder: '搜尋課程、技能或工具，例如 SQL、GA4、AI', 'aria-label': '搜尋課程',
    oninput: e => { query = e.target.value; render(); },
  });

  const tabs = h('div', { class: 'filter-tabs', role: 'tablist', 'aria-label': '課程分類' },
    ...FILTERS.map(filter => {
      const btn = h('button', {
        class: `filter-tab${filter.key === active ? ' is-active' : ''}`, type: 'button', role: 'tab', 'aria-selected': filter.key === active ? 'true' : 'false',
        onclick: () => {
          active = filter.key;
          tabs.querySelectorAll('.filter-tab').forEach(b => {
            const selected = b === btn;
            b.classList.toggle('is-active', selected);
            b.setAttribute('aria-selected', String(selected));
          });
          render();
        },
      }, filter.label);
      return btn;
    }));

  render();
  return h('div', { class: 'catalog-browser' }, h('div', { class: 'catalog-tools' }, search, count), tabs, grid);
}

function catalogCard(course, stats) {
  return h('a', { class: 'catalog-card card', href: courseHref(course.id, stats) },
    h('div', { class: 'catalog-top' },
      h('span', { class: 'tag' }, course.level),
      stats.pct === 100 ? h('span', { class: 'badge badge-ok' }, '已完成') : stats.exSolved > 0 ? h('span', { class: 'badge' }, '學習中') : h('span', { class: 'badge badge-soft' }, '尚未開始')),
    h('h3', {}, course.title),
    course.blurb && h('p', { class: 'muted' }, course.blurb),
    h('div', { class: 'tag-row' }, (course.tags || []).map(tag => h('span', { class: 'tag tag-soft' }, tag))),
    progressSummary(stats));
}

function progressSummary(stats) {
  const label = stats.pct === 100 ? `已完成全部 ${stats.exTotal} 題` : stats.exSolved > 0 ? `已完成 ${stats.exSolved} / ${stats.exTotal} 題 · ${stats.pct}%` : `${stats.lessonsTotal} 課 · ${stats.exTotal} 題`;
  return h('div', { class: 'catalog-progress' }, h('div', { class: 'bar' }, h('i', { style: `width:${stats.pct}%` })), h('span', {}, label));
}

function courseHref(courseId, stats) {
  return `#/course/${courseId}`;
}

const feature = (title, description) => h('div', { class: 'feature card' }, h('h3', {}, title), h('p', {}, description));
const step = (title, description) => h('li', { class: 'step' }, h('strong', {}, title), h('span', {}, description));
