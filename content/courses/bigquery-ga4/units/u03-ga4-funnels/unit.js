const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ga4-u03',
  title: 'GA4 漏斗分析',
  lessons: [
    {
      id: 'ga4-u03-l01',
      title: '用 events 建立事件觸及分析（非序列漏斗）',
      minutes: 25,
      objectives: [
        '用 COUNT(DISTINCT session_id) 計算各獨立事件的不重複 session 數',
        '用 CTE + LAG 計算相鄰事件觸及數比值（不是序列轉換率）',
        '將事件觸及按裝置類型和流量來源拆分',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u03.l01.e01',
          title: '建立 GA4 事件觸及表',
          difficulty: 2,
          scenario: 'Growth 團隊想看網站整體的 5 步驟事件觸及分析（非序列漏斗），先檢查事件觸及與埋點，再規劃序列漏斗。',
          prompt: `計算各事件獨立觸及統計，包含 5 個階段：\`page_view\`、\`view_item\`、\`add_to_cart\`、\`begin_checkout\`、\`purchase\`。

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
          explanation: `本題按事件獨立計算不重複 session，沒有檢查前置步驟或時間順序，因此不是序列漏斗。比值可能超過 100%，不能解讀為同一群人的流失率。JOIN 僅加入工作階段維度，COALESCE 將缺少購買的計數補零。`,
          negatives: [
            `SELECT event_name, COUNT(*) AS sessions FROM events WHERE event_name IN ('page_view','view_item','add_to_cart','begin_checkout','purchase') GROUP BY event_name ORDER BY sessions DESC`,
            `SELECT event_name, COUNT(DISTINCT session_id) AS sessions FROM events GROUP BY event_name ORDER BY sessions DESC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u03.l01.e02',
          title: '按裝置拆分事件觸及',
          difficulty: 2,
          scenario: '產品主管想知道手機 vs 桌機的事件觸及差異，評估是否需要優先改善行動版的結帳流程。',
          prompt: `計算各**裝置類型**的事件觸及分析（非序列漏斗）（只看 3 個關鍵階段：\`page_view\`、\`add_to_cart\`、\`purchase\`）。

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
          explanation: `本題按事件獨立計算不重複 session，沒有檢查前置步驟或時間順序，因此不是序列漏斗。比值可能超過 100%，不能解讀為同一群人的流失率。JOIN 僅加入工作階段維度，COALESCE 將缺少購買的計數補零。`,
          negatives: [
            `SELECT e.event_name, COUNT(DISTINCT e.session_id) AS sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name IN ('page_view','add_to_cart','purchase') GROUP BY s.device, e.event_name ORDER BY s.device ASC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u03.l01.e03',
          title: '按來源計算購買／瀏覽觸及比',
          difficulty: 3,
          scenario: '行銷主管想知道哪個流量來源的購買／瀏覽觸及比最高，作為後續分析的線索。',
          prompt: `計算各**流量來源**（\`source\`）purchase 與 page_view 的獨立 session 數比值（不要求同一 session 先瀏覽後購買）。

用 CTE 計算：
1. 各來源的 page_view session 數
2. 各來源的 purchase session 數
3. 比值 = purchase_sessions / page_view_sessions（%，ROUND 2 位小數）

回傳欄位：\`source\`、\`pv_sessions\`、\`purchase_sessions\`、\`purchase_pv_ratio\`，只顯示 \`pv_sessions >= 50\`，依 \`purchase_pv_ratio\` DESC 排序。`,
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
  ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS purchase_pv_ratio
FROM pv
LEFT JOIN pur ON pv.source = pur.source
WHERE pv.pv_sessions >= 50
ORDER BY purchase_pv_ratio DESC;`,
          hints: [
            '第一個 CTE：WHERE event_name = \'page_view\'，GROUP BY source',
            '第二個 CTE：WHERE event_name = \'purchase\'，GROUP BY source',
            'LEFT JOIN 因為有些 source 可能沒有 purchase',
            'COALESCE(purchase_sessions, 0) 處理沒有購買的來源',
          ],
          explanation: `本題按事件獨立計算不重複 session，沒有檢查前置步驟或時間順序，因此不是序列漏斗。比值可能超過 100%，不能解讀為同一群人的流失率。JOIN 僅加入工作階段維度，COALESCE 將缺少購買的計數補零。`,
          negatives: [
            `WITH pv AS (SELECT s.source, COUNT(*) AS pv_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'page_view' GROUP BY s.source), pur AS (SELECT s.source, COUNT(*) AS purchase_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'purchase' GROUP BY s.source) SELECT pv.source, pv.pv_sessions, COALESCE(pur.purchase_sessions, 0) AS purchase_sessions, ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS purchase_pv_ratio FROM pv LEFT JOIN pur ON pv.source = pur.source WHERE pv.pv_sessions >= 50 ORDER BY purchase_pv_ratio DESC`,
            `WITH pv AS (SELECT s.source, COUNT(*) AS pv_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'page_view' GROUP BY s.source), pur AS (SELECT s.source, COUNT(*) AS purchase_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'purchase' GROUP BY s.source) SELECT pv.source, pv.pv_sessions, COALESCE(pur.purchase_sessions, 0) AS purchase_sessions, ROUND(COALESCE(pur.purchase_sessions, 0) * 100.0 / NULLIF(pv.pv_sessions, 0), 2) AS purchase_pv_ratio FROM pv LEFT JOIN pur ON pv.source = pur.source WHERE pv.pv_sessions >= 50 ORDER BY purchase_pv_ratio DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
