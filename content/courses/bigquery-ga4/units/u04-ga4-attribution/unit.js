const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ga4-u04',
  title: 'GA4 歸因分析',
  lessons: [
    {
      id: 'ga4-u04-l01',
      title: 'UTM 參數與多通路歸因',
      minutes: 25,
      objectives: [
        '理解 UTM 參數（source/medium/campaign）如何串聯廣告與訂單',
        '用 sessions JOIN orders 計算各來源帶來的訂單數和營收',
        '計算各 campaign 的歸因訂單數，並與廣告花費結合評估 ROAS',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u04.l01.e01',
          title: '各流量來源的 Session 數統計',
          difficulty: 1,
          scenario: '行銷分析師要製作流量來源報表，了解各管道的引流規模。',
          prompt: `計算各流量來源組合（\`source\` + \`medium\`）的不重複 session 數，欄位命名為 \`sessions\`。

回傳欄位：\`source\`、\`medium\`、\`sessions\`，依 \`sessions\` DESC 排序，取前 10 筆。`,
          answer: `SELECT
  source,
  medium,
  COUNT(DISTINCT session_id) AS sessions
FROM sessions
GROUP BY source, medium
ORDER BY sessions DESC
LIMIT 10;`,
          hints: [
            'GROUP BY source, medium',
            'COUNT(DISTINCT session_id)',
          ],
          explanation: `UTM 參數中，\`source\` 是流量來源（google、facebook 等），\`medium\` 是媒介（cpc、organic 等）。兩者組合才能完整描述一個流量管道。

GA4 後台的「管道分組」報表就是根據 source + medium 的規則自動分類，這裡我們直接看原始組合。`,
          negatives: [
            `SELECT source, medium, COUNT(DISTINCT customer_id) AS sessions FROM sessions GROUP BY source, medium ORDER BY sessions DESC LIMIT 10`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u04.l01.e02',
          title: '有購買的 Session 比例（各來源）',
          difficulty: 2,
          scenario: 'Growth 分析師想知道哪個流量來源的訪客「最有購買意願」，用購買 session 比例衡量流量品質。',
          prompt: `計算各流量來源（\`source\`）中，有 \`purchase\` 事件的 session 佔該來源所有 session 的比例。

- 分子：有 purchase 事件的不重複 session_id 數，欄位 \`purchase_sessions\`
- 分母：各來源的總不重複 session_id 數，欄位 \`total_sessions\`
- 比例：\`purchase_rate\`（%，ROUND 2 位小數）

只顯示 \`total_sessions >= 50\`，依 \`purchase_rate\` DESC 排序。`,
          answer: `WITH all_sessions AS (
  SELECT
    source,
    COUNT(DISTINCT session_id) AS total_sessions
  FROM sessions
  GROUP BY source
),
purchase_sessions AS (
  SELECT
    s.source,
    COUNT(DISTINCT e.session_id) AS purchase_sessions
  FROM events e
  JOIN sessions s ON e.session_id = s.session_id
  WHERE e.event_name = 'purchase'
  GROUP BY s.source
)
SELECT
  a.source,
  a.total_sessions,
  COALESCE(p.purchase_sessions, 0) AS purchase_sessions,
  ROUND(COALESCE(p.purchase_sessions, 0) * 100.0 / NULLIF(a.total_sessions, 0), 2) AS purchase_rate
FROM all_sessions a
LEFT JOIN purchase_sessions p ON a.source = p.source
WHERE a.total_sessions >= 50
ORDER BY purchase_rate DESC;`,
          hints: [
            '第一個 CTE：各來源總 session 數',
            '第二個 CTE：JOIN events，WHERE event_name = \'purchase\'',
            'LEFT JOIN 因為有些來源可能沒有 purchase',
          ],
          explanation: `購買 Session 比例 = 有購買的 session 數 / 總 session 數，衡量流量「轉換效率」。

電子報（newsletter）和 email 的購買率通常高於付費廣告，因為這些使用者已經是對品牌有興趣的訂閱者。`,
          negatives: [
            `WITH all_sessions AS (SELECT source, COUNT(DISTINCT customer_id) AS total_sessions FROM sessions WHERE customer_id IS NOT NULL GROUP BY source), purchase_sessions AS (SELECT s.source, COUNT(DISTINCT e.session_id) AS purchase_sessions FROM events e JOIN sessions s ON e.session_id = s.session_id WHERE e.event_name = 'purchase' GROUP BY s.source) SELECT a.source, a.total_sessions, COALESCE(p.purchase_sessions, 0) AS purchase_sessions, ROUND(COALESCE(p.purchase_sessions, 0) * 100.0 / NULLIF(a.total_sessions, 0), 2) AS purchase_rate FROM all_sessions a LEFT JOIN purchase_sessions p ON a.source = p.source WHERE a.total_sessions >= 50 ORDER BY purchase_rate DESC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u04.l01.e03',
          title: '自訂回溯窗的單一活動歸因',
          difficulty: 3,
          scenario: '行銷主管需要可重現、且不重複加總訂單金額的教學歸因報表。',
          prompt: `本課自訂「前 30 個完整日、最後有活動的 session」模型：同會員、completed 訂單，session 日期在訂單日往前 30 日（含）至訂單日前一日（含）；因 order_date 只有日期，不猜同日先後，排除訂單當日。只在 campaign_id 非 NULL 的候選中選 session_start 最大者，同時間以 session_id DESC 決勝。每單唯一歸屬，無候選不歸因。這不是 GA4 Last Click，也不處理匿名跨裝置、direct 規則或因果推論。

JOIN campaigns 取得名稱。回傳 campaign_id、campaign_name、attributed_orders（每單只計一次）、attributed_revenue（SUM total_amount，ROUND 整數）。只顯示有歸因訂單的活動，依 attributed_revenue DESC、campaign_id ASC 排序。`,
          answer: `WITH ranked_touches AS (
  SELECT o.order_id, o.total_amount, s.campaign_id,
    ROW_NUMBER() OVER (
      PARTITION BY o.order_id
      ORDER BY s.session_start DESC, s.session_id DESC
    ) AS touch_rank
  FROM orders o
  JOIN sessions s ON s.customer_id = o.customer_id
    AND DATE(s.session_start) >= DATE(o.order_date, '-30 days')
    AND DATE(s.session_start) < DATE(o.order_date)
  WHERE o.status = 'completed' AND s.campaign_id IS NOT NULL
),
winners AS (
  SELECT order_id, total_amount, campaign_id
  FROM ranked_touches WHERE touch_rank = 1
)
SELECT w.campaign_id, c.campaign_name,
  COUNT(*) AS attributed_orders,
  ROUND(SUM(w.total_amount)) AS attributed_revenue
FROM winners w
JOIN campaigns c ON w.campaign_id = c.campaign_id
GROUP BY w.campaign_id, c.campaign_name
ORDER BY attributed_revenue DESC, w.campaign_id ASC;`,
          hints: [
            '先 JOIN 產生窗內候選，再 ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY session_start DESC, session_id DESC)',
            '先 WHERE touch_rank = 1，再按 campaign 彙總；不可只對訂單數 DISTINCT 卻重複 SUM 金額',
          ],
          explanation: `本課自訂「前 30 個完整日、最後有活動的 session」模型：同會員、completed 訂單，session 日期在訂單日往前 30 日（含）至訂單日前一日（含）；因 order_date 只有日期，不猜同日先後，排除訂單當日。只在 campaign_id 非 NULL 的候選中選 session_start 最大者，同時間以 session_id DESC 決勝。每單唯一歸屬，無候選不歸因。這不是 GA4 Last Click，也不處理匿名跨裝置、direct 規則或因果推論。 先挑每單唯一 winner，再 SUM，才不會同單被多個 session 或活動重複認領。SUM(DISTINCT total_amount) 也不對，因為不同訂單可以同額。ROAS 僅是此模型與選定資料期間的教學比值，不證明廣告增量效果。`,
          negatives: [
            `WITH ranked_touches AS (
  SELECT o.order_id, o.total_amount, s.campaign_id,
    ROW_NUMBER() OVER (
      PARTITION BY o.order_id
      ORDER BY s.session_start DESC, s.session_id DESC
    ) AS touch_rank
  FROM orders o
  JOIN sessions s ON s.customer_id = o.customer_id
    AND DATE(s.session_start) >= DATE(o.order_date, '-30 days')
    AND DATE(s.session_start) < DATE(o.order_date)
  WHERE o.status = 'completed' AND s.campaign_id IS NOT NULL
),
winners AS (
  SELECT order_id, total_amount, campaign_id
  FROM ranked_touches WHERE touch_rank = 1
)
SELECT w.campaign_id, c.campaign_name, COUNT(*) AS attributed_orders, ROUND(SUM(w.total_amount)) AS attributed_revenue
FROM ranked_touches w JOIN campaigns c ON w.campaign_id = c.campaign_id
GROUP BY w.campaign_id, c.campaign_name ORDER BY attributed_revenue DESC, w.campaign_id ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
