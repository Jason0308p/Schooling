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
    id: 'looker-studio',
    title: 'Looker Studio 報表設計：GA4 × 廣告儀表板',
    level: '實務',
    tags: ['Looker Studio', 'GA4', '廣告', '儀表板'],
    blurb: '用免費的 Google Looker Studio 連接 GA4 + 廣告資料，30 分鐘建出 ROAS 儀表板。',
    load: () => import('./courses/looker-studio/course.js'),
  },
  {
    id: 'sql-interview',
    title: 'SQL 面試題庫：數據分析師 / Growth 職缺',
    level: '進階',
    tags: ['面試', '題庫'],
    blurb: '模擬真實面試情境，分初級、中級、高難三組。面試題答對要從需求拆解起，訓練真實場景意識。',
    load: () => import('./courses/sql-interview/course.js'),
  },
  {
    id: 'pm-sql',
    title: 'PM SQL 數據課：用資料做產品決策',
    level: '進階',
    tags: ['Product', 'DAU/MAU', 'Retention', 'A/B Test'],
    blurb: '不依賴工程師，用 SQL 自己查核心產品指標。',
    load: () => import('./courses/pm-sql/course.js'),
  },
  {
    id: 'excel-to-sql',
    title: 'Excel → SQL：報表人的 SQL 入門',
    level: '入門',
    tags: ['Excel', 'SQL', '入門', '轉換'],
    blurb: '已經會 VLOOKUP 和樞紐分析表？30 分鐘把你會的 Excel 操作翻譯成 SQL。',
    load: () => import('./courses/excel-to-sql/course.js'),
  },
  {
    id: 'growth-analytics',
    title: 'Growth Analytics：用數據找增長機會',
    level: '進階',
    tags: ['Growth', 'AARRR', 'Retention', 'A/B Test'],
    blurb: '用 AARRR 框架拆解增長——獲客、啟動、留存、營收、推薦，每個環節都有 SQL 查詢。',
    load: () => import('./courses/growth-analytics/course.js'),
  },
  {
    id: 'ai-workflow',
    title: 'AI 工作術：行銷與 PM 的 AI 工具實戰',
    level: '實務',
    tags: ['AI', 'ChatGPT', 'Claude', '行銷', 'PM'],
    blurb: '不用寫一行程式碼，用 AI 工具提升文案、報告、SEO 和廣告素材的效率。',
    load: () => import('./courses/ai-workflow/course.js'),
  },
  {
    id: 'prd-writing',
    title: 'PRD 寫作課：從需求到可執行的產品文件',
    level: '實務',
    tags: ['PRD', 'Product', 'User Story', 'PM'],
    blurb: '學會寫工程師和設計師都能執行的需求文件，從 User Story 到驗收標準。',
    load: () => import('./courses/prd-writing/course.js'),
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering 中文實戰：讓 AI 輸出一致結果',
    level: '實務',
    tags: ['Prompt', 'AI', 'ChatGPT', 'Claude'],
    blurb: '四個維度寫出可預期的 Prompt—Role/Task/Format/Context—附行銷、PM、分析師的實用模板庫。',
    load: () => import('./courses/prompt-engineering/course.js'),
  },
];
