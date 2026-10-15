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
          title: '各 Campaign 帶來的訂單數',
          difficulty: 3,
          scenario: '行銷主管要評估各廣告活動的實際成效，用「帶來的訂單數和營收」做為績效指標。',
          prompt: `計算每個廣告活動（\`campaign_id\`）透過 sessions 帶來的 \`completed\` 訂單數和訂單金額。

串接邏輯：\`sessions.campaign_id\` → \`sessions.customer_id\` → \`orders.customer_id\`，且訂單日期（\`order_date\`）必須 >= session 開始日期（\`DATE(session_start)\`）。

只計有 \`campaign_id\` 的 session（IS NOT NULL）。

用 \`campaigns\` 表取得 \`campaign_name\`。

回傳欄位：\`campaign_id\`、\`campaign_name\`、\`attributed_orders\`（COUNT DISTINCT order_id）、\`attributed_revenue\`（SUM total_amount，ROUND 整數），只顯示 \`attributed_orders > 0\`，依 \`attributed_revenue\` DESC 排序。`,
          answer: `SELECT
  s.campaign_id,
  c.campaign_name,
  COUNT(DISTINCT o.order_id) AS attributed_orders,
  ROUND(SUM(o.total_amount)) AS attributed_revenue
FROM sessions s
JOIN campaigns c ON s.campaign_id = c.campaign_id
JOIN orders o
  ON  o.customer_id = s.customer_id
  AND o.order_date >= DATE(s.session_start)
  AND o.status = 'completed'
WHERE s.campaign_id IS NOT NULL
GROUP BY s.campaign_id, c.campaign_name
HAVING COUNT(DISTINCT o.order_id) > 0
ORDER BY attributed_revenue DESC;`,
          hints: [
            'JOIN campaigns ON campaign_id 取得名稱',
            'JOIN orders ON customer_id，加條件 o.order_date >= DATE(s.session_start)',
            'WHERE s.campaign_id IS NOT NULL',
            'HAVING COUNT(DISTINCT o.order_id) > 0',
          ],
          explanation: `歸因邏輯：同一位會員，在點擊廣告（session 發生）之後下的訂單，才算是這個廣告帶來的。

\`COUNT(DISTINCT o.order_id)\` 確保同一訂單只計一次，即使這位客戶有多個來自同一 campaign 的 session。

這是「最後點擊（Last Click）歸因」的簡化版本，實務上還會考慮多觸點歸因（Linear、Data-Driven 等）。`,
          negatives: [
            `SELECT s.campaign_id, c.campaign_name, COUNT(DISTINCT o.order_id) AS attributed_orders, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN campaigns c ON s.campaign_id = c.campaign_id JOIN orders o ON o.customer_id = s.customer_id AND o.status = 'completed' WHERE s.campaign_id IS NOT NULL GROUP BY s.campaign_id, c.campaign_name HAVING COUNT(DISTINCT o.order_id) > 0 ORDER BY attributed_revenue DESC`,
            `SELECT s.campaign_id, c.campaign_name, COUNT(o.order_id) AS attributed_orders, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN campaigns c ON s.campaign_id = c.campaign_id JOIN orders o ON o.customer_id = s.customer_id AND o.order_date >= DATE(s.session_start) AND o.status = 'completed' WHERE s.campaign_id IS NOT NULL GROUP BY s.campaign_id, c.campaign_name HAVING COUNT(o.order_id) > 0 ORDER BY attributed_revenue DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
