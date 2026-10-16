/**
 * Growth Analytics：用數據找增長機會
 * 對象：Growth 操作人員、行銷分析師
 * 框架：AARRR（Acquisition / Activation / Retention / Revenue / Referral）
 */
export const course = {
  id: 'growth-analytics',
  title: 'Growth Analytics：用數據找增長機會',
  subtitle: '用 AARRR 框架拆解增長——每個環節都有 SQL 查詢和業務解讀。',
  level: '進階',
  estimatedHours: 6,
  dataset: () => import('../../datasets/app-product/index.js'),
  audience: [
    '想用 SQL 找增長槓桿的 Growth 操作人員',
    '需要自己查渠道成效、留存、LTV 的行銷分析師',
    '想理解 AARRR 指標背後 SQL 邏輯的產品人',
  ],
  outcomes: [
    '計算各渠道新用戶數、渠道品質，找出高 ROI 來源',
    '用 SQL 衡量 Onboarding 完成率與 Time-to-value',
    '實作 N-day retention 與 Rolling retention，理解兩者差異',
    '計算 MRR、ARPU、LTV，評估方案升級機會',
    '分析 A/B Test 結果、轉換率提升與統計顯著性',
  ],
  units: [
    {
      id: 'gh-u01', no: 1, title: 'Acquisition：獲客分析', status: 'published', access: 'free',
      summary: '各渠道新用戶數、渠道品質指標，找出 CPA 最低、留存最高的獲客來源。',
      load: () => import('./units/u01-acquisition/unit.js'),
    },
    {
      id: 'gh-u02', no: 2, title: 'Activation：啟動分析', status: 'published', access: 'free',
      summary: 'Onboarding 完成率、Time-to-value——用戶第一次使用核心功能要多久？',
      load: () => import('./units/u02-activation/unit.js'),
    },
    {
      id: 'gh-u03', no: 3, title: 'Retention：留存分析', status: 'published', access: 'free',
      summary: 'N-day retention（Day 7/30）與 Rolling retention，找出流失關鍵節點。',
      load: () => import('./units/u03-retention/unit.js'),
    },
    {
      id: 'gh-u04', no: 4, title: 'Revenue：營收分析', status: 'published', access: 'free',
      summary: 'MRR、ARPU、LTV 計算，以及方案升級（Free→Pro）的收入貢獻分析。',
      load: () => import('./units/u04-revenue/unit.js'),
    },
    {
      id: 'gh-u05', no: 5, title: 'Referral：A/B Test 分析', status: 'published', access: 'free',
      summary: 'A/B Test 轉換率差異、統計顯著性判斷、Viral coefficient 概念。',
      load: () => import('./units/u05-referral/unit.js'),
    },
  ],
};
