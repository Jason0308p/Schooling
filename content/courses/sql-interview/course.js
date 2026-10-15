/**
 * SQL 面試題庫課程設定檔
 * 面向數據分析師 / Growth 職缺，分初級、中級、高難三組。
 * 每題沒有提示、沒有起始程式，模擬真實面試情境。
 */
export const course = {
  id: 'sql-interview',
  title: 'SQL 面試題庫：數據分析師 / Growth 職缺',
  subtitle: '模擬真實面試情境，沒有提示、沒有起始程式，自己從需求寫到正確答案。',
  level: '進階',
  estimatedHours: 4,
  dataset: () => import('../../datasets/ecommerce/index.js'),
  audience: [
    '準備數據分析師、Growth、Marketing Ops 面試的人',
    '已學完 SQL 基礎，想用真實面試題測試自己的人',
    '想了解面試官怎麼出題、怎麼追問的人',
  ],
  outcomes: [
    '能在無提示情境下，從需求拆解到 SQL 正確答案',
    '掌握面試高頻考點：Cohort、RFM、ROAS、連續日期、視窗函數',
    '了解常見扣分點與追問方向',
  ],
  units: [
    {
      id: 'int-u01', no: 1, title: '初級題組（工作 1–2 年）', status: 'published', access: 'free', plannedExercises: 5,
      summary: 'JOIN + 彙總 + 子查詢 + 視窗函數基礎。考驗你能否在壓力下把基本功寫對。',
      load: () => import('./units/u01-junior/unit.js'),
    },
    {
      id: 'int-u02', no: 2, title: '中級題組（工作 2–4 年）', status: 'published', access: 'free', plannedExercises: 5,
      summary: 'Cohort、RFM、ROAS、交叉購買分析。考驗你對業務指標的理解深度。',
      load: () => import('./units/u02-mid/unit.js'),
    },
    {
      id: 'int-u03', no: 3, title: '高難題組（Lead / 筆試）', status: 'published', access: 'free', plannedExercises: 4,
      summary: '連續日期、多期間對比、PARTITION BY 取前 N、跨表歸因。面試中真實出現的筆試難題。',
      load: () => import('./units/u03-advanced/unit.js'),
    },
  ],
};
