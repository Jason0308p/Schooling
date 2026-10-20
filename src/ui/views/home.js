/**
 * 首頁：品牌主視覺 + 課程目錄 + 學習方法。
 */
import { h, icon } from '../dom.js';
import { listCatalog, courseStats, nextLesson } from '../../core/courseRegistry.js';
import { runIsolated } from '../../core/sqlEngine.js';
import { dataTable } from '../components/resultTable.js';
import { highlightBlocks } from '../components/sqlEditor.js';

const DEMO_SQL = `SELECT sales_channel,
       COUNT(*)          AS orders,
       SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY sales_channel
ORDER BY revenue DESC;`;

export async function renderHome(app) {
  const catalog = listCatalog();
  const sqlCourse = await app.getCourse();
  const stats = courseStats(sqlCourse, app.progress);
  const started = stats.exSolved > 0;
  const next = nextLesson(sqlCourse, app.progress);
  const totalCourses = catalog.filter(c => c.load).length;
  const totalPlanned = catalog.reduce((sum, c) => sum + (c.plannedExercises || 0), 0) || stats.plannedExercises;

  const view = h('div', { class: 'page page-home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('p', { class: 'kicker' }, '真實工作技能的互動學習平台'),
        h('h1', {}, '學到用得上的技能，', h('br'), '在瀏覽器裡直接練'),
        h('p', { class: 'lead' },
          '從 SQL 分析、GA4 追蹤、Looker Studio 報表，到 PRD 寫作——每門課都有真實情境練習，寫完立刻批改，附解說與常見錯誤。'),
        h('div', { class: 'hero-cta' },
          h('a', { class: 'btn btn-primary btn-lg', href: '#/' + (started ? `learn/${sqlCourse.id}/${next.lesson.id}` : '') },
            started ? `繼續：${next.lesson.title}` : '免費開始學習', icon('right')),
          h('a', { class: 'btn btn-secondary btn-lg', href: `#/course/${sqlCourse.id}` }, '看 SQL 課程大綱')),
        h('ul', { class: 'hero-points' },
          h('li', {}, icon('check'), '免安裝，瀏覽器內直接練習'),
          h('li', {}, icon('check'), '即時批改，比對結果不是比對字串'),
          h('li', {}, icon('check'), '進度自動儲存，隨時繼續'))),
      h('div', { class: 'hero-courses', 'aria-label': '課程預覽' },
        h('div', { class: 'course-preview-grid' },
          catalog.filter(c => c.load).slice(0, 3).map(c =>
            h('a', { class: 'course-preview-card', href: `#/course/${c.id}` },
              h('span', { class: 'tag' }, c.level),
              h('strong', {}, c.title),
              c.blurb && h('p', {}, c.blurb)))))),

    h('section', { class: 'stat-strip' },
      [[totalCourses, '門課程'], [250, '道練習題'], [10, '種實務技能'], [0, '元費用']].map(([n, l]) =>
        h('div', { class: 'stat' }, h('strong', {}, n), h('span', {}, l)))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '所有課程'),
      catalogSection(catalog, sqlCourse, stats)),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '為什麼選 Schooling'),
      h('div', { class: 'feature-grid' },
        feature('真實工作情境', '每一題都有「誰在要、為什麼要」。練的是把業務問題轉成可執行的解法，不是背語法。'),
        feature('即時批改 + 解說', '答錯告訴你哪裡錯，答對建議看標準解法。學到能舉一反三，不是對答案。'),
        feature('多種課程，一個帳號', 'SQL、GA4、Looker Studio、PRD……工作裡用得到的技能，都在同一個地方學。'),
        feature('不用安裝任何東西', '瀏覽器開啟就能用。SQL 課連資料庫都在瀏覽器裡跑，真的執行、真的出結果。'))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '每一課的學習方式'),
      h('ol', { class: 'steps' },
        step('讀課文', '短篇說明 + 圖解，10-30 分鐘讀完一課。'),
        step('跑範例', '課文裡的範例可以直接執行，也能修改後自己跑。'),
        step('做練習', '真實情境題，依難度排列。SQL 課即時批改，選擇題即時對答。'),
        step('看解說', '標準答案、其他寫法、常見錯誤——答對了也建議看一遍。'))),

    h('footer', { class: 'site-footer' },
      h('span', {}, `${app.config.brand.name} · v${app.config.appVersion}`),
      h('span', {}, '練習資料為虛構的模擬資料')));

  return view;
}

const feature = (t, d) => h('div', { class: 'feature card' }, h('h3', {}, t), h('p', {}, d));
const step = (t, d) => h('li', { class: 'step' }, h('strong', {}, t), h('span', {}, d));

const FILTERS = [
  { key: 'all',  label: '全部' },
  { key: 'sql',  label: 'SQL 分析', match: c => c.tags?.some(t => ['SQL','BigQuery','GA4'].includes(t)) },
  { key: 'ai',   label: 'AI 工具',  match: c => c.tags?.some(t => ['AI','Prompt','ChatGPT','Claude'].includes(t)) },
  { key: 'pm',   label: 'PM 實務',  match: c => c.tags?.some(t => ['PM','PRD','Growth'].includes(t)) },
];

function catalogSection(catalog, sqlCourse, stats) {
  let active = 'all';
  const grid = h('div', { class: 'catalog-grid' });

  const render = () => {
    const f = FILTERS.find(f => f.key === active);
    const list = f.match ? catalog.filter(c => c.load && f.match(c)) : catalog.filter(c => c.load);
    grid.replaceChildren(...list.map(c => catalogCard(c, c.id === sqlCourse?.id ? stats : null)));
  };

  const tabs = h('div', { class: 'filter-tabs' },
    ...FILTERS.map(f => {
      const btn = h('button', {
        class: `filter-tab${f.key === active ? ' is-active' : ''}`,
        type: 'button',
        onclick: () => {
          active = f.key;
          tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.toggle('is-active', b === btn));
          render();
        },
      }, f.label);
      return btn;
    }));

  render();
  return h('div', {}, tabs, grid);
}

function catalogCard(c, stats) {
  const available = !!c.load;
  return h(available ? 'a' : 'div', { class: `catalog-card card${available ? '' : ' is-soon'}`, href: available ? `#/course/${c.id}` : null },
    h('div', { class: 'catalog-top' },
      h('span', { class: 'tag' }, c.level),
      !available && h('span', { class: 'badge' }, '即將推出')),
    h('h3', {}, c.title),
    c.blurb && h('p', { class: 'muted' }, c.blurb),
    h('div', { class: 'tag-row' }, c.tags.map((t) => h('span', { class: 'tag tag-soft' }, t))),
    stats && h('div', { class: 'catalog-progress' },
      h('div', { class: 'bar' }, h('i', { style: `width:${stats.pct}%` })),
      h('span', {}, `已完成 ${stats.exSolved} / ${stats.exTotal} 題`)));
}
