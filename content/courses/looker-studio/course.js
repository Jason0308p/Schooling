/**
 * 課程設定檔：Looker Studio 報表設計
 */
export const course = {
  id: 'looker-studio',
  title: 'Looker Studio 報表設計：GA4 × 廣告數據儀表板',
  subtitle: 'Google Looker Studio × GA4 — build dashboards your team actually uses.',
  level: '實務',
  estimatedHours: 4,
  dataset: null,
  audience: [
    '行銷人員想自己做 GA4 流量報表，不依賴工程師',
    'PM 需要每週追蹤廣告成效，想整合 Google Ads 與 GA4 數據',
    '剛開始接觸數據視覺化，尋找免費工具的初學者',
  ],
  outcomes: [
    '連接 GA4 與 Google Ads 資料來源，建立第一個 Looker Studio 報表',
    '選擇合適的圖表元件（Scorecard、Time Series、Table、Pivot）並正確設定維度與指標',
    '建立包含 Sessions Trend、轉換漏斗、流量來源分析的 GA4 監控儀表板',
    '使用 Blended Data 合併 GA4 與 Ads 資料，計算 ROAS / CTR / CPC 計算欄位',
  ],
  units: [
    {
      id: 'ls-u01', no: 1, title: 'Looker Studio 入門', status: 'published', access: 'free', plannedExercises: 3,
      summary: '什麼是 Looker Studio、免費方案限制、與其他工具比較，以及連接 GA4 資料來源的完整步驟。',
      load: () => import('./units/u01-intro/unit.js'),
    },
    {
      id: 'ls-u02', no: 2, title: '核心圖表元件', status: 'published', access: 'free', plannedExercises: 6,
      summary: 'Scorecard、Time Series、Bar、Pie、Table with Heatmap、Pivot Table 與 Blended Data 的適用場景與設定方式。',
      load: () => import('./units/u02-charts/unit.js'),
    },
    {
      id: 'ls-u03', no: 3, title: 'GA4 數據儀表板實戰', status: 'published', access: 'free', plannedExercises: 3,
      summary: '建立標準 GA4 監控儀表板：Sessions Trend、轉換漏斗、流量來源分析，逐區塊說明設定步驟。',
      load: () => import('./units/u03-ga4-dashboard/unit.js'),
    },
    {
      id: 'ls-u04', no: 4, title: '廣告成效儀表板（Google Ads + GA4）', status: 'published', access: 'free', plannedExercises: 3,
      summary: '連接 Google Ads 資料來源、用 Blended Data 合併 GA4 + Ads，設定 ROAS / CTR / CPC 計算欄位。',
      load: () => import('./units/u04-ads-dashboard/unit.js'),
    },
  ],
};
