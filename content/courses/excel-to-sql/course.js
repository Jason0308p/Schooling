/**
 * Excel → SQL 轉換課 — 課程設定檔。
 */
export const course = {
  id: 'excel-to-sql',
  title: 'Excel → SQL：報表人的 SQL 入門',
  subtitle: '你已經會 Excel VLOOKUP 和樞紐分析表——用這個起點，30 分鐘讀懂 SQL。',
  level: '入門',
  estimatedHours: 5,
  dataset: () => import('../../datasets/ecommerce/index.js'),
  audience: [
    '每天用 Excel 的行銷／營運人員',
    '想轉職數據分析師的人',
    '剛開始學 SQL 覺得難的人',
  ],
  outcomes: [
    '把 Excel 樞紐分析表改寫成 SQL GROUP BY',
    '用 SQL 取代 VLOOKUP / INDEX-MATCH',
    '在任何資料庫工具貼上 SQL 直接出報表',
  ],
  units: [
    {
      id: 'xl-u01', no: 1, title: 'Excel 欄位選取 = SQL SELECT', status: 'published', access: 'free', plannedExercises: 3,
      summary: '選欄位、篩選、排序：Excel 裡滑鼠做的事，SQL 用三個關鍵字搞定。',
      load: () => import('./units/xl-u01-select/unit.js'),
    },
    {
      id: 'xl-u02', no: 2, title: 'Excel 樞紐分析表 = SQL GROUP BY', status: 'published', access: 'free', plannedExercises: 6,
      summary: '把明細資料壓成彙總報表，再用 HAVING 過濾——就像在樞紐分析表裡設篩選條件。',
      load: () => import('./units/xl-u02-groupby/unit.js'),
    },
    {
      id: 'xl-u03', no: 3, title: 'Excel VLOOKUP = SQL JOIN', status: 'published', access: 'free', plannedExercises: 3,
      summary: '把兩張表用共同欄位串起來：INNER JOIN 找得到的，LEFT JOIN 留下找不到的。',
      load: () => import('./units/xl-u03-join/unit.js'),
    },
    {
      id: 'xl-u04', no: 4, title: 'Excel 常用函數 = SQL 函數', status: 'published', access: 'free', plannedExercises: 2,
      summary: 'IF → CASE WHEN、IFERROR → COALESCE、CONCATENATE → ||：一對一翻譯。',
      load: () => import('./units/xl-u04-functions/unit.js'),
    },
  ],
};
