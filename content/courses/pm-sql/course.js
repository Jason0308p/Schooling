/**
 * PM SQL 數據課：用資料做產品決策
 * 對象：具備基礎 SQL 知識的 PM，想自己查核心產品指標
 */
export const course = {
  id: 'pm-sql',
  title: 'PM SQL 數據課：用資料做產品決策',
  subtitle: '不依賴工程師，用 SQL 自己查 DAU/MAU、Retention、Feature Adoption、A/B Test。',
  level: '進階',
  estimatedHours: 8,
  dataset: () => import('../../datasets/app-product/index.js'),
  audience: [
    '已具備基礎 SQL 能力，想深入產品指標分析的 PM',
    '需要自己從資料庫查 DAU/MAU、Retention 的產品人',
    '想用數據支撐 PRD 決策、做 A/B Test 分析的人',
  ],
  outcomes: [
    '獨立計算 DAU、MAU、Stickiness，不依賴 BI 工具',
    '用 SQL 寫出 Day 1/7/30 留存率與 Cohort 留存表',
    '計算各功能採用率，找出高價值功能',
    '分析 A/B Test 轉換率差異，判斷統計顯著性',
    '將 SQL 查詢結果組合成數據驅動的產品決策依據',
  ],
  units: [
    {
      id: 'pm-u01', no: 1, title: '產品核心指標（DAU / MAU / Stickiness）', status: 'published', access: 'free',
      summary: '用 SQL 計算每日活躍用戶（DAU）、每月活躍用戶（MAU），以及衡量用戶黏性的 Stickiness = DAU/MAU。',
      load: () => import('./units/u01-dau-mau/unit.js'),
    },
    {
      id: 'pm-u02', no: 2, title: '留存分析（Retention Curve）', status: 'published', access: 'free',
      summary: '計算 Day 1/7/30 留存率，以及按月 Cohort 的留存曲線，找出用戶流失關鍵節點。',
      load: () => import('./units/u02-retention/unit.js'),
    },
    {
      id: 'pm-u03', no: 3, title: '功能採用率（Feature Adoption）', status: 'published', access: 'free',
      summary: '計算各功能的採用率（使用過的用戶 / 總活躍用戶），識別明星功能與待推廣功能。',
      load: () => import('./units/u03-feature-adoption/unit.js'),
    },
    {
      id: 'pm-u04', no: 4, title: 'A/B Test 數據分析', status: 'published', access: 'free',
      summary: '用 SQL 計算 A/B Test 的轉換率、每用戶收入，並判斷結果是否達到統計顯著性。',
      load: () => import('./units/u04-ab-test/unit.js'),
    },
    {
      id: 'pm-u05', no: 5, title: '數據驅動 PRD 決策', status: 'published', access: 'free',
      summary: '綜合運用前四單元的技巧，從數據出發撰寫有依據的產品決策。',
      load: () => import('./units/u05-prd-decision/unit.js'),
    },
  ],
};
