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
  const course = await app.getCourse();
  const stats = courseStats(course, app.progress);
  const started = stats.exSolved > 0;
  const next = nextLesson(course, app.progress);
  const demo = runIsolated(course.dataset, DEMO_SQL);
  const totalPlanned = stats.plannedExercises;

  const demoPre = h('pre', { class: 'code', 'data-lang': 'sql' }, DEMO_SQL);
  const view = h('div', { class: 'page page-home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('p', { class: 'kicker' }, '互動式 SQL 實戰課程'),
        h('h1', {}, '從零開始，', h('br'), '學到能接分析需求的 SQL'),
        h('p', { class: 'lead' },
          '用一間電商公司的會員、訂單、廣告與網站行為資料，邊學邊寫。每一題都是真實工作情境，寫完立刻批改，附上解說與常見錯誤。'),
        h('div', { class: 'hero-cta' },
          h('a', { class: 'btn btn-primary btn-lg', href: `#/learn/${course.id}/${next.lesson.id}` },
            started ? `繼續學習：${next.lesson.title}` : '開始免費學習', icon('right')),
          h('a', { class: 'btn btn-secondary btn-lg', href: `#/course/${course.id}` }, '看課程大綱')),
        h('ul', { class: 'hero-points' },
          h('li', {}, icon('check'), '免安裝，瀏覽器內就是真的資料庫'),
          h('li', {}, icon('check'), '自動批改，比對結果而不是比對字串'),
          h('li', {}, icon('check'), '進度自動儲存在這台電腦'))),
      h('div', { class: 'hero-demo', 'aria-label': '範例查詢' },
        h('div', { class: 'demo-window' },
          h('div', { class: 'demo-bar' }, h('i'), h('i'), h('i'), h('span', {}, 'channel_revenue.sql')),
          demoPre,
          demo.ok && demo.last && dataTable(demo.last, { meta: `${demo.last.values.length} 列 · ${demo.ms} ms` })))),

    h('section', { class: 'stat-strip' },
      [[course.units.length, '個單元'], [totalPlanned, '道實戰練習'], [course.dataset.tables.length, '張資料表'], [course.estimatedHours, '小時學習時數']]
        .map(([n, l]) => h('div', { class: 'stat' }, h('strong', {}, n), h('span', {}, l)))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '這門課跟一般教學有什麼不同'),
      h('div', { class: 'feature-grid' },
        feature('工作情境出題', '每一題都有「誰在要資料、為什麼要」。練的是把需求翻譯成 SQL，不是背語法。'),
        feature('看得懂為什麼錯', '答錯時告訴你錯在欄位、筆數、數值還是排序，並列出預期結果讓你比對。'),
        feature('一次學會四種方言', '用 SQLite 練習，每課標註 PostgreSQL、MySQL、BigQuery 的寫法差異。'),
        feature('真的會遇到的髒資料', 'NULL、寫法不一致、重複計算、整數除法……實務上會踩的坑，課程裡先踩過一次。'))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '課程'),
      h('div', { class: 'catalog-grid' }, listCatalog().map((c) => catalogCard(c, c.id === course.id ? stats : null)))),

    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '每一課的學習流程'),
      h('ol', { class: 'steps' },
        step('讀觀念', '短篇說明，配合表格與圖解，10 分鐘內讀完。'),
        step('跑範例', '課文裡的每段 SQL 都能直接執行，也能帶到練習場修改。'),
        step('做練習', '依難度排列的情境題，可分段看提示。'),
        step('看解說', '標準答案、其他寫法、常見錯誤，答對了也建議看。'))),

    h('footer', { class: 'site-footer' },
      h('span', {}, `${app.config.brand.name} · v${app.config.appVersion}`),
      h('span', {}, '練習資料為虛構的模擬資料')));

  highlightBlocks(view);
  return view;
}

const feature = (t, d) => h('div', { class: 'feature card' }, h('h3', {}, t), h('p', {}, d));
const step = (t, d) => h('li', { class: 'step' }, h('strong', {}, t), h('span', {}, d));

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
