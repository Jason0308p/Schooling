/**
 * 課程設定檔：BigQuery × GA4
 */
export const course = {
  id: 'bigquery-ga4',
  title: 'BigQuery × GA4：用 SQL 分析網站行為',
  subtitle: '用熟悉的電商資料，以 GA4 視角學習核心指標、轉換漏斗與 UTM 歸因，並對照 BigQuery 的 UNNEST 寫法。',
  level: '進階（需先完成 SQL 實戰分析課程）',
  estimatedHours: 6,
  dataset: () => import('../../datasets/ecommerce/index.js'),
  audience: [
    '完成 SQL 入門課程，想進一步學習 GA4 資料分析的人',
    '在 GA4 後台看得懂報表，但想自己從原始資料算指標的分析師',
    '準備使用 BigQuery 查詢 GA4 匯出資料的工程師或分析師',
  ],
  outcomes: [
    '理解 GA4 事件模型與 BigQuery 匯出格式，以及 UNNEST event_params 的用途',
    '用 SQL 計算 Sessions、Users、Pageviews、跳出率等核心指標',
    '建立完整轉換漏斗並按裝置、流量來源拆分',
    '用 UTM 參數串聯廣告活動與訂單，進行多通路歸因分析',
  ],
  units: [
    {
      id: 'ga4-u01', no: 1, title: 'GA4 資料結構', status: 'published', access: 'free', plannedExercises: 2,
      summary: 'sessions 和 events 表如何對應 GA4 BigQuery 匯出格式；event_params 的概念與 UNNEST 的必要性。',
      load: () => import('./units/u01-ga4-structure/unit.js'),
    },
    {
      id: 'ga4-u02', no: 2, title: 'GA4 核心指標計算', status: 'published', access: 'free', plannedExercises: 5,
      summary: '用 SQL 計算 Sessions、Users、Pageviews、Session 深度、跳出率等 GA4 核心指標。',
      load: () => import('./units/u02-ga4-metrics/unit.js'),
    },
    {
      id: 'ga4-u03', no: 3, title: 'GA4 漏斗分析', status: 'published', access: 'free', plannedExercises: 3,
      summary: '用 events 表建立完整轉換漏斗，並按裝置類型和流量來源拆分各階段轉換率。',
      load: () => import('./units/u03-ga4-funnels/unit.js'),
    },
    {
      id: 'ga4-u04', no: 4, title: 'GA4 歸因分析', status: 'published', access: 'free', plannedExercises: 3,
      summary: '用 UTM 參數（source/medium/campaign）串聯廣告花費與訂單，計算各通路的歸因績效。',
      load: () => import('./units/u04-ga4-attribution/unit.js'),
    },
  ],
};
