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
    blurb: '學完主課程後的延伸：GA4 匯出資料的巢狀結構、UNNEST event_params、工作階段歸因。',
  },
  {
    id: 'sql-interview',
    title: 'SQL 面試題庫：數據分析師 / Growth 職缺',
    level: '進階',
    tags: ['面試', '題庫'],
    blurb: '依真實面試考法整理的計時題組，含常見追問。',
  },
];
