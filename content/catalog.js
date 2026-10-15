/**
 * 課程目錄：首頁顯示的所有課程。
 * 新增課程：在 content/courses/<course-id>/ 建立 course.js，然後在這裡加一筆（見 docs/CONTENT_GUIDE.md）。
 * 沒有 load 的項目會顯示為「即將推出」。
 */
export const catalog = [
  {
    id: 'sql-foundations',
    title: 'SQL 實戰分析：從零到能接需求',
    level: '入門 → 進階',
    tags: ['SQL', '資料分析', '電商', '行銷分析'],
    load: () => import('./courses/sql-foundations/course.js'),
  },
  {
    id: 'bigquery-ga4',
    title: 'BigQuery × GA4：用 SQL 分析網站行為',
    level: '進階',
    tags: ['BigQuery', 'GA4', 'UNNEST'],
    blurb: '學完主課程後的延伸：GA4 事件模型、核心指標、轉換漏斗、UTM 歸因分析，附 BigQuery 對應寫法。',
    load: () => import('./courses/bigquery-ga4/course.js'),
  },
  {
    id: 'sql-interview',
    title: 'SQL 面試題庫：數據分析師 / Growth 職缺',
    level: '進階',
    tags: ['面試', '題庫'],
    blurb: '模擬真實面試情境，分初級、中級、高難三組。面試題答對要從需求拆解起，訓練真實場景意識。',
    load: () => import('./courses/sql-interview/course.js'),
  },
];
