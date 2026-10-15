const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ga4-u01',
  title: 'GA4 資料結構',
  lessons: [
    {
      id: 'ga4-u01-l01',
      title: 'sessions 與 events：從 GA4 視角認識資料',
      minutes: 20,
      objectives: [
        '理解 sessions 和 events 表如何對應 GA4 BigQuery 匯出格式',
        '說明 event_params 巢狀結構的概念與 UNNEST 的用途',
        '用 sessions 表查詢裝置類型和到達頁分布',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u01.l01.e01',
          title: '各裝置類型的 Session 數',
          difficulty: 1,
          scenario: '行銷分析師想了解網站流量來自哪些裝置，以便決定是否優先優化行動版體驗。',
          prompt: `計算各裝置類型（\`device\`）的不重複 session 數，欄位命名為 \`session_count\`。

回傳欄位：\`device\`、\`session_count\`，依 \`session_count\` DESC 排序。`,
          answer: `SELECT
  device,
  COUNT(DISTINCT session_id) AS session_count
FROM sessions
GROUP BY device
ORDER BY session_count DESC;`,
          hints: [
            'COUNT(DISTINCT session_id) 計算不重複 session 數',
            'GROUP BY device 依裝置分組',
          ],
          explanation: `GA4 的 \`device.category\` 欄位對應本資料集的 \`device\` 欄（mobile / desktop / tablet）。

\`COUNT(DISTINCT session_id)\` 確保每個 session 只計一次，與 GA4 後台「工作階段」指標的計算邏輯相同。`,
          negatives: [
            `SELECT device, COUNT(DISTINCT customer_id) AS session_count FROM sessions GROUP BY device ORDER BY session_count DESC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u01.l01.e02',
          title: '各到達頁的不重複訪客數',
          difficulty: 1,
          scenario: 'SEO 專員想知道哪些落地頁帶來最多訪客，找出最值得優化的頁面。',
          prompt: `計算各到達頁（\`landing_page\`）的不重複訪客數，對應 GA4 的「不重複工作階段」。

以 \`session_id\` 計算不重複數量，欄位命名為 \`sessions\`。

回傳欄位：\`landing_page\`、\`sessions\`，依 \`sessions\` DESC 排序。`,
          answer: `SELECT
  landing_page,
  COUNT(DISTINCT session_id) AS sessions
FROM sessions
GROUP BY landing_page
ORDER BY sessions DESC;`,
          hints: [
            'GROUP BY landing_page',
            'COUNT(DISTINCT session_id) 計算不重複 session 數',
          ],
          explanation: `GA4 的「到達頁面」維度對應 \`landing_page\` 欄，記錄使用者進入網站時第一個看到的頁面路徑。

排序後可快速找出流量最大的落地頁，這些頁面的轉換率改善對整體業績影響最大。`,
          negatives: [
            `SELECT landing_page, COUNT(DISTINCT customer_id) AS sessions FROM sessions WHERE customer_id IS NOT NULL GROUP BY landing_page ORDER BY sessions DESC`,
            `SELECT landing_page, COUNT(DISTINCT customer_id) AS sessions FROM sessions GROUP BY landing_page ORDER BY sessions DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
