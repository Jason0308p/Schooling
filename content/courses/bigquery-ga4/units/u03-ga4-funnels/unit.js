const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ga4-u03',
  title: 'GA4 漏斗分析',
  lessons: [
    {
      id: 'ga4-u03-l01',
      title: '用 events 建立轉換漏斗',
      minutes: 25,
      objectives: [
        '用 COUNT(DISTINCT session_id) 計算各漏斗階段的不重複 session 數',
        '用 CTE + LAG 計算各階段轉換率',
        '將漏斗按裝置類型和流量來源拆分',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u03.l01.e01',
          title: '建立 GA4 標準轉換漏斗',
          difficulty: 2,
          scenario: 'Growth 團隊想看網站整體的 5 步驟轉換漏斗，找出流失最多的瓶頸。',
          prompt: `計算完整轉換漏斗，包含 5 個階段：\`page_view\`、\`view_item\`、\`add_to_cart\`、\`begin_checkout\`、\`purchase\`。

每個階段統計不重複的 \`session_id\` 數量，欄位命名為 \`sessions\`。

用 \`CASE\` 產生 \`step\` 欄位（1–5 依序對應上述 event_name）。

回傳欄位：\`step\`、\`event_name\`、\`sessions\`，依 \`step\` ASC 排序。`,
          answer: `WITH funnel AS (
  SELECT
    CASE event_name
      WHEN 'page_view'      THEN 1
      WHEN 'view_item'      THEN 2
      WHEN 'add_to_cart'    THEN 3
      WHEN 'begin_checkout' THEN 4
      WHEN 'purchase'       THEN 5
    END AS step,
    event_name,
    COUNT(DISTINCT session_id) AS sessions
  FROM events
  WHERE event_name IN ('page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase')
  GROUP BY event_name
)
SELECT step, event_name, sessions
FROM funnel
ORDER BY step;`,
          hints: [
            'CASE event_name WHEN ... THEN 1 ... END AS step',
            'COUNT(DISTINCT session_id) 而非 COUNT(*)',
            'WHERE 只保留這 5 種 event_name',
          ],
          explanation: `GA4 的漏斗分析核心是用 \`COUNT(DISTINCT session_id)\`，而非 \`COUNT(*)\`。
同一個 session 可能觸發多次 \`page_view\`，但在漏斗中只應計一次。

\`CASE\` 賦予自訂排序欄位 \`step\`，讓漏斗能按業務邏輯（而非字母順序）排列。`,
          negatives: [
            `SELECT event_name, COUNT(*) AS sessions FROM events WHERE event_name IN ('page_view','view_item','add_to_cart','begin_checkout','purchase') GROUP BY event_name ORDER BY sessions DESC`,
            `SELECT event_name, COUNT(DISTINCT session_id) AS sessions FROM events GROUP BY event_name ORDER BY sessions DESC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u03.l01.e02',
          title: '按裝置拆分漏斗',
          difficulty: 2,
          scenario: '產品主管想知道手機 vs 桌機的漏斗差異，評估是否需要優先改善行動版的結帳流程。',
          prompt: `計算各**裝置類型**的轉換漏斗（只看 3 個關鍵階段：\`page_view\`、\`add_to_cart\`、\`purchase\`）。

需要 JOIN sessions 取得 device 欄位。

每個裝置 + 階段統計不重複 session 數，欄位命名為 \`sessions\`。

用 CASE 加入 \`step\` 欄位（page_view=1, add_to_cart=2, purchase=3）。

回傳欄位：\`device\`、\`step\`、\`event_name\`、\`sessions\`，依 \`device\` ASC、\`step\` ASC 排序。`,
          answer: `WITH funnel AS (
  SELECT
    s.device,
    CASE e.event_name
      WHEN 'page_view'   THEN 1
      WHEN 'add_to_cart' THEN 2
      WHEN 'purchase'    THEN 3
    END AS step,
    e.event_name,
    COUNT(DISTINCT e.session_id) AS sessions
  FROM events e
  JOIN sessions s ON e.session_id = s.session_id
  WHERE e.event_name IN ('page_view', 'add_to_cart', 'purchase')
  GROUP BY s.device, e.event_name
)
SELECT device, step, event_name, sessions
FROM funnel
ORDER BY device ASC, step ASC;`,
          hints: [
            'JOIN sessions ON session_id 取得 device',
            'GROUP BY s.device, e.event_name',
            'WHERE e.event_name IN (只保留 3 種)',
          ],
          explanation: `要按維度（裝置、來源）拆分漏斗，需要把 events 和 sessions JOIN 起來。

拆分漏斗後常見的發現：行動裝置的 page_view → add_to_cart 轉換率偏低，往往是行動版商品頁設計問題；add_to_cart → purchase 偏低，則可能是行動版結帳流程太複雜。`,
          negatives: [
            `SELECT e.event_name, COUNT(DISTINCT e.session_id) AS sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name IN ('page_view','add_to_cart','purchase') GROUP BY s.device, e.event_name ORDER BY s.device ASC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u03.l01.e03',
          title: '按流量來源拆分購買轉換率',
          difficulty: 3,
          scenario: '行銷主管想知道哪個流量來源的最終購買轉換率最高，決定廣告預算分配。',
          prompt: `計算各**流量來源**（\`source\`）從 \`page_view\` 到 \`purchase\` 的轉換率。

用 CTE 計算：
1. 各來源的 page_view session 數
2. 各來源的 purchase session 數
3. 轉換率 = purchase_sessions / page_view_sessions（%，ROUND 2 位小數）

回傳欄位：\`source\`、\`pv_sessions\`、\`purchase_sessions\`、\`conversion_rate\`，只顯示 \`pv_sessions >= 50\`，依 \`conversion_rate\` DESC 排序。`,
          answer: `WITH pv AS (
  SELECT
    s.source,
    COUNT(DISTINCT e.session_id) AS pv_sessions
  FROM events e
  JOIN sessions s ON e.session_id = s.session_id
  WHERE e.event_name = 'page_view'
  GROUP BY s.source
),
pur AS (
  SELECT
    s.source,
    COUNT(DISTINCT e.session_id) AS purchase_sessions
  FROM events e
  JOIN sessions s ON e.session_id = s.session_id
  WHERE e.event_name = 'purchase'
  GROUP BY s.source
)
SELECT
  pv.source,
  pv.pv_sessions,
  COALESCE(pur.purchase_sessions, 0) AS purchase_sessions,
  ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS conversion_rate
FROM pv
LEFT JOIN pur ON pv.source = pur.source
WHERE pv.pv_sessions >= 50
ORDER BY conversion_rate DESC;`,
          hints: [
            '第一個 CTE：WHERE event_name = \'page_view\'，GROUP BY source',
            '第二個 CTE：WHERE event_name = \'purchase\'，GROUP BY source',
            'LEFT JOIN 因為有些 source 可能沒有 purchase',
            'COALESCE(purchase_sessions, 0) 處理沒有購買的來源',
          ],
          explanation: `用兩個 CTE 分別計算漏斗頂部（page_view）和底部（purchase）的 session 數，再 LEFT JOIN 計算轉換率。

LEFT JOIN 確保即使某個 source 完全沒有 purchase，也會出現在結果中（purchase_sessions = 0）。\`COALESCE\` 把 NULL 轉為 0 才能做除法。`,
          negatives: [
            `WITH pv AS (SELECT s.source, COUNT(*) AS pv_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'page_view' GROUP BY s.source), pur AS (SELECT s.source, COUNT(*) AS purchase_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'purchase' GROUP BY s.source) SELECT pv.source, pv.pv_sessions, COALESCE(pur.purchase_sessions, 0) AS purchase_sessions, ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS conversion_rate FROM pv LEFT JOIN pur ON pv.source = pur.source WHERE pv.pv_sessions >= 50 ORDER BY conversion_rate DESC`,
            `WITH pv AS (SELECT s.source, COUNT(*) AS pv_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'page_view' GROUP BY s.source), pur AS (SELECT s.source, COUNT(*) AS purchase_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'purchase' GROUP BY s.source) SELECT pv.source, pv.pv_sessions, COALESCE(pur.purchase_sessions, 0) AS purchase_sessions, ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS conversion_rate FROM pv LEFT JOIN pur ON pv.source = pur.source WHERE pv.pv_sessions >= 50 ORDER BY conversion_rate DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
