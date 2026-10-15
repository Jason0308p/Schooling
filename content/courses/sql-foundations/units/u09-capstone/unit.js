const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u09',
  title: '綜合案例',
  lessons: [
    {
      id: 'u09-l01',
      title: '上個月營收為什麼掉了？',
      minutes: 25,
      objectives: [
        '用 CASE WHEN 動態產生月份欄位',
        '用 CTE + self-join 計算月環比',
        '找出下滑最多的通路並量化降幅',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u09.l01.e01',
          title: '各通路月訂單數與營收',
          difficulty: 2,
          scenario: '主管要求你整理 2026 年 4 月和 5 月各銷售通路的 completed 訂單表現，作為環比分析的基礎數據。',
          prompt: `計算 2026 年 4 月和 5 月各 \`sales_channel\` 的 completed 訂單數和營收。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- 只取 2026-04 和 2026-05 兩個月
- 用 \`CASE\` 產生 \`month\` 欄位（值為 \`'2026-04'\` 或 \`'2026-05'\`）
- \`revenue\` 用 \`ROUND\` 取整數

**回傳欄位：** \`month\`, \`sales_channel\`, \`order_count\`, \`revenue\`

**排序：** \`month ASC\`, \`revenue DESC\``,
          answer: `SELECT
  CASE
    WHEN order_date LIKE '2026-04%' THEN '2026-04'
    WHEN order_date LIKE '2026-05%' THEN '2026-05'
  END                        AS month,
  sales_channel,
  COUNT(*)                   AS order_count,
  ROUND(SUM(total_amount))   AS revenue
FROM orders
WHERE status = 'completed'
  AND order_date >= '2026-04-01'
  AND order_date <  '2026-06-01'
GROUP BY month, sales_channel
ORDER BY month ASC, revenue DESC;`,
          hints: [
            '用 CASE WHEN order_date LIKE \'2026-04%\' THEN \'2026-04\' 產生月份欄位',
            'WHERE 條件用 order_date >= \'2026-04-01\' AND order_date < \'2026-06-01\' 確保只取兩個月',
            'GROUP BY 要同時包含 month 和 sales_channel',
          ],
          explanation: `這題的核心技巧是用 \`CASE WHEN\` 把日期字串轉成月份標籤，再 \`GROUP BY\` 這個衍生欄位。

**注意事項：**
- SQLite 沒有 \`DATE_FORMAT\`，用 \`SUBSTR(order_date, 1, 7)\` 或 \`LIKE\` 都可以取月份
- \`WHERE\` 用範圍過濾比 \`LIKE\` 效能更好，也更安全
- \`ROUND(SUM(...))\` 先加總再取整，順序不能反過來`,
          negatives: [
            `SELECT SUBSTR(order_date,1,7) AS month, sales_channel, COUNT(*) AS order_count, ROUND(SUM(total_amount)) AS revenue FROM orders WHERE status = 'completed' GROUP BY month, sales_channel ORDER BY month ASC, revenue DESC;`,
            `SELECT strftime('%Y-%m', order_date) AS month, sales_channel, COUNT(*) AS order_count, ROUND(SUM(total_amount)) AS revenue FROM orders WHERE status = 'completed' GROUP BY month, sales_channel ORDER BY month ASC, revenue DESC LIMIT 6;`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u09.l01.e02',
          title: '通路月環比分析',
          difficulty: 3,
          scenario: '主管看完分月數據後說：「我要看每個通路 5 月比 4 月到底掉了多少、掉了幾趴，下滑最多的排前面。」',
          prompt: `在上題基礎上，計算各通路 2026 年 5 月 vs 4 月的月環比。

**要求：**
- 用 CTE 先算各月各通路的 \`revenue\`（ROUND 整數）
- 再用 self-join（或 LAG）計算差異
- \`revenue_change\` = 5月營收 − 4月營收
- \`growth_pct\` = (5月 − 4月) / 4月 × 100，ROUND 1 位小數
- 只回傳兩個月都有資料的通路

**回傳欄位：** \`sales_channel\`, \`apr_revenue\`, \`may_revenue\`, \`revenue_change\`, \`growth_pct\`

**排序：** \`revenue_change ASC\`（下滑最多的排最前）`,
          answer: `WITH monthly AS (
  SELECT
    CASE
      WHEN order_date LIKE '2026-04%' THEN '2026-04'
      WHEN order_date LIKE '2026-05%' THEN '2026-05'
    END                       AS month,
    sales_channel,
    ROUND(SUM(total_amount))  AS revenue
  FROM orders
  WHERE status = 'completed'
    AND order_date >= '2026-04-01'
    AND order_date <  '2026-06-01'
  GROUP BY month, sales_channel
)
SELECT
  m5.sales_channel,
  m4.revenue                                                  AS apr_revenue,
  m5.revenue                                                  AS may_revenue,
  m5.revenue - m4.revenue                                     AS revenue_change,
  ROUND((m5.revenue - m4.revenue) * 100.0 / m4.revenue, 1)   AS growth_pct
FROM       monthly m5
JOIN       monthly m4
  ON  m5.sales_channel = m4.sales_channel
  AND m4.month = '2026-04'
  AND m5.month = '2026-05'
ORDER BY revenue_change ASC;`,
          hints: [
            'CTE 先算出 month, sales_channel, revenue 三欄',
            'self-join 時用 m4.month = \'2026-04\' 和 m5.month = \'2026-05\' 區分兩份資料',
            '除法記得乘以 1.0 避免整數除法，例如 (m5.revenue - m4.revenue) * 100.0 / m4.revenue',
          ],
          explanation: `**self-join 的思維模型：**

把同一張 CTE 想成兩張表——一張代表 4 月（\`m4\`），一張代表 5 月（\`m5\`）。用 \`sales_channel\` 把兩者連起來，每個通路就形成一列「橫向比較」的資料。

\`\`\`
m4（4月）          m5（5月）
sales_channel │ revenue   JOIN   sales_channel │ revenue
Web           │ 120,000  ────►  Web           │ 98,000
\`\`\`

**為何用 INNER JOIN 而非 LEFT JOIN？**
- INNER JOIN 只保留兩個月都有資料的通路，避免環比計算出現 NULL
- 如果需要顯示某個月沒有資料的通路（revenue = 0），才用 LEFT JOIN + COALESCE`,
          negatives: [
            `WITH monthly_channel AS (
  SELECT
    CASE WHEN order_date LIKE '2026-04%' THEN '2026-04'
         WHEN order_date LIKE '2026-05%' THEN '2026-05' END AS month,
    sales_channel,
    ROUND(SUM(total_amount)) AS revenue
  FROM orders WHERE status = 'completed'
    AND (order_date LIKE '2026-04%' OR order_date LIKE '2026-05%')
  GROUP BY month, sales_channel
),
pivoted AS (
  SELECT sales_channel,
    MAX(CASE WHEN month = '2026-04' THEN revenue END) AS apr_revenue,
    MAX(CASE WHEN month = '2026-05' THEN revenue END) AS may_revenue
  FROM monthly_channel GROUP BY sales_channel
)
SELECT sales_channel, apr_revenue, may_revenue,
  may_revenue - apr_revenue AS revenue_change,
  ROUND(apr_revenue / NULLIF(may_revenue, 0) * 100.0, 1) AS growth_pct
FROM pivoted ORDER BY revenue_change ASC`,
            `WITH monthly_channel AS (
  SELECT strftime('%Y-%m', order_date) AS month, sales_channel,
    ROUND(SUM(total_amount)) AS revenue
  FROM orders WHERE status = 'completed'
  GROUP BY month, sales_channel
),
pivoted AS (
  SELECT sales_channel,
    MAX(CASE WHEN month = '2026-04' THEN revenue END) AS apr_revenue,
    MAX(CASE WHEN month = '2026-05' THEN revenue END) AS may_revenue
  FROM monthly_channel GROUP BY sales_channel
)
SELECT sales_channel, apr_revenue, may_revenue,
  may_revenue - apr_revenue AS revenue_change,
  ROUND((may_revenue - apr_revenue) / NULLIF(may_revenue, 0) * 100.0, 1) AS growth_pct
FROM pivoted ORDER BY revenue_change ASC`
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u09-l02',
      title: '雙 11 活動成效檢討',
      minutes: 25,
      objectives: [
        '串聯 ad_spend、sessions、orders 計算廣告歸因',
        '理解 ROAS 的計算邏輯與業務意義',
        '用 NULLIF 避免除以零，用 LEFT JOIN 保留無歸因活動',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u09.l02.e01',
          title: '11 月廣告活動花費與轉換',
          difficulty: 2,
          scenario: '行銷主管要你先整理 2025 年 11 月各廣告活動的實際花費和平台回報的轉換數，作為 ROAS 計算的分母。',
          prompt: `計算 2025 年 11 月各廣告活動的總花費和總轉換數。

**要求：**
- 從 \`ad_spend\` 取 \`spend_date\` 在 2025-11 的記錄
- JOIN \`campaigns\` 取得活動名稱和平台
- \`total_cost\` 用 \`ROUND\` 取整數（0 位小數）

**回傳欄位：** \`campaign_id\`, \`campaign_name\`, \`platform\`, \`total_cost\`, \`total_conversions\`

**排序：** \`total_cost DESC\``,
          answer: `SELECT
  c.campaign_id,
  c.campaign_name,
  c.platform,
  ROUND(SUM(a.cost))       AS total_cost,
  SUM(a.conversions)       AS total_conversions
FROM campaigns c
JOIN ad_spend a ON c.campaign_id = a.campaign_id
WHERE a.spend_date >= '2025-11-01'
  AND a.spend_date <  '2025-12-01'
GROUP BY c.campaign_id, c.campaign_name, c.platform
ORDER BY total_cost DESC;`,
          hints: [
            '從 campaigns 出發，JOIN ad_spend',
            'WHERE 條件：spend_date >= \'2025-11-01\' AND spend_date < \'2025-12-01\'',
            'GROUP BY 需要包含所有非聚合欄位：campaign_id, campaign_name, platform',
          ],
          explanation: `這題是標準的「主表 JOIN 明細表，再彙總」模式。

\`campaigns\` 是維度表（描述活動基本資料），\`ad_spend\` 是事實表（每日花費明細）。JOIN 後 GROUP BY campaign 層級，就能得到活動期間的彙總數字。

**為何用 campaign_id 而非 campaign_name GROUP BY？**
理論上 campaign_name 可能重複（不同時期的同名活動）。用 campaign_id 作為主 key 更安全，再把 name 和 platform 加進 GROUP BY 只是讓這些欄位可以被 SELECT。`,
          negatives: [
            `SELECT c.campaign_id, c.campaign_name, c.platform,
  ROUND(SUM(a.cost)) AS total_cost,
  SUM(a.conversions) AS total_conversions
FROM campaigns c JOIN ad_spend a ON c.campaign_id = a.campaign_id
GROUP BY c.campaign_id, c.campaign_name, c.platform
ORDER BY total_cost DESC`,
            `SELECT c.campaign_id, c.campaign_name, c.platform,
  ROUND(SUM(a.cost)) AS total_cost,
  SUM(a.conversions) AS total_conversions
FROM campaigns c JOIN ad_spend a ON c.campaign_id = a.campaign_id
WHERE a.spend_date LIKE '2025-10%'
GROUP BY c.campaign_id, c.campaign_name, c.platform
ORDER BY total_cost DESC`
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u09.l02.e02',
          title: '廣告活動 ROAS 計算',
          difficulty: 3,
          scenario: '主管要看 2025 年 11 月各廣告活動的 ROAS（廣告帶來的訂單營收 ÷ 廣告花費），ROAS 高的排前面，沒有歸因訂單的活動也要顯示。',
          prompt: `計算 2025-11 月各廣告活動的 ROAS。

**歸因邏輯：**
- 透過 \`sessions.campaign_id\` 找到活動帶來的 session
- session 的 \`customer_id\` 不為 NULL
- 同月（2025-11）有 \`completed\` 訂單的顧客，其訂單計入該活動的 \`attributed_revenue\`

**要求：**
- \`total_cost\`：從 \`ad_spend\`，spend_date 在 2025-11，ROUND 整數
- \`attributed_revenue\`：歸因訂單 \`total_amount\` 加總，ROUND 整數
- \`roas\`：attributed_revenue / total_cost，ROUND 2 位小數
- 用 \`NULLIF\` 防止除以零
- 沒有歸因訂單的活動也要出現（ROAS 顯示 NULL）

**回傳欄位：** \`campaign_name\`, \`platform\`, \`total_cost\`, \`attributed_revenue\`, \`roas\`

**排序：** \`roas DESC NULLS LAST\``,
          answer: `WITH spend AS (
  SELECT
    c.campaign_id,
    c.campaign_name,
    c.platform,
    ROUND(SUM(a.cost)) AS total_cost
  FROM campaigns c
  JOIN ad_spend a ON c.campaign_id = a.campaign_id
  WHERE a.spend_date >= '2025-11-01'
    AND a.spend_date <  '2025-12-01'
  GROUP BY c.campaign_id, c.campaign_name, c.platform
),
attributed AS (
  SELECT
    s.campaign_id,
    ROUND(SUM(o.total_amount)) AS attributed_revenue
  FROM sessions s
  JOIN orders   o ON o.customer_id = s.customer_id
  WHERE s.session_start >= '2025-11-01'
    AND s.session_start <  '2025-12-01'
    AND o.order_date    >= '2025-11-01'
    AND o.order_date    <  '2025-12-01'
    AND o.status = 'completed'
    AND s.campaign_id IS NOT NULL
  GROUP BY s.campaign_id
)
SELECT
  sp.campaign_name,
  sp.platform,
  sp.total_cost,
  at.attributed_revenue,
  ROUND(at.attributed_revenue * 1.0 / NULLIF(sp.total_cost, 0), 2) AS roas
FROM spend sp
LEFT JOIN attributed at ON sp.campaign_id = at.campaign_id
ORDER BY roas DESC NULLS LAST;`,
          hints: [
            '用兩個 CTE：一個算花費，一個算歸因營收',
            '歸因 CTE：sessions JOIN orders ON customer_id，再過濾 campaign_id IS NOT NULL',
            '最後用 LEFT JOIN 確保所有有花費的活動都出現，NULLIF(total_cost, 0) 避免除以零',
          ],
          explanation: `**為何要用兩個 CTE？**

花費和歸因訂單來自不同的資料路徑，強行一次 JOIN 會造成笛卡爾積（同一筆 session 對應多筆 ad_spend 記錄）。分開計算再合併是標準做法。

**歸因的限制：**
這裡的邏輯是「同月有該活動 session 的顧客，同月的訂單都算入」。實際上可能高估（顧客本來就要買），也可能低估（顧客跨月才下單）。報告時要說明歸因方法。

**NULLS LAST：**
SQLite 的 \`ORDER BY ... DESC\` 預設把 NULL 排在最前，加 \`NULLS LAST\` 讓有效 ROAS 排前面，NULL 排後面。`,
          negatives: [
            `WITH spend AS (SELECT c.campaign_id, c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost FROM campaigns c JOIN ad_spend a ON c.campaign_id = a.campaign_id WHERE a.spend_date >= '2025-11-01' AND a.spend_date < '2025-12-01' GROUP BY c.campaign_id, c.campaign_name, c.platform), attributed AS (SELECT s.campaign_id, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id WHERE s.session_start >= '2025-11-01' AND s.session_start < '2025-12-01' AND o.order_date >= '2025-11-01' AND o.order_date < '2025-12-01' AND o.status = 'completed' AND s.campaign_id IS NOT NULL GROUP BY s.campaign_id) SELECT sp.campaign_name, sp.platform, sp.total_cost, at.attributed_revenue, ROUND(sp.total_cost / NULLIF(at.attributed_revenue, 0), 2) AS roas FROM spend sp LEFT JOIN attributed at ON sp.campaign_id = at.campaign_id ORDER BY roas DESC NULLS LAST;`,
            `WITH spend AS (SELECT c.campaign_id, c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost FROM campaigns c JOIN ad_spend a ON c.campaign_id = a.campaign_id WHERE a.spend_date >= '2025-11-01' AND a.spend_date < '2025-12-01' GROUP BY c.campaign_id, c.campaign_name, c.platform), attributed AS (SELECT s.campaign_id, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id WHERE s.session_start >= '2025-11-01' AND s.session_start < '2025-12-01' AND o.order_date >= '2025-11-01' AND o.order_date < '2025-12-01' AND o.status = 'completed' AND s.campaign_id IS NOT NULL GROUP BY s.campaign_id) SELECT sp.campaign_name, sp.platform, sp.total_cost, at.attributed_revenue, ROUND(at.attributed_revenue * 1.0 / NULLIF(sp.total_cost, 0), 2) AS roas FROM spend sp JOIN attributed at ON sp.campaign_id = at.campaign_id ORDER BY roas DESC NULLS LAST;`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u09-l03',
      title: '哪些會員值得做再行銷？',
      minutes: 25,
      objectives: [
        '用 NOT EXISTS 找「符合 A 條件但不符合 B 條件」的記錄',
        '理解沉睡會員的業務定義與 SQL 實作',
        '用 SQLite date() 函數做相對日期運算',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u09.l03.e01',
          title: '高價值再行銷候選名單',
          difficulty: 2,
          scenario: '行銷專員需要一份「曾消費超過 1000 元、但最後購買日在 2026-06-01 之前」的會員名單，作為高價值再行銷的基礎。',
          prompt: `找出「最後一筆 completed 訂單在 2026-06-01 之前，且總消費超過 1000」的會員。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`last_order_date\`：該顧客最後一筆 completed 訂單的 \`order_date\`（用 MAX）
- \`total_spent\`：所有 completed 訂單的 \`total_amount\` 加總（ROUND 整數）
- 過濾條件：last_order_date < '2026-06-01' 且 total_spent > 1000

**回傳欄位：** \`customer_id\`, \`name\`, \`email\`, \`last_order_date\`, \`total_spent\`

**排序：** \`total_spent DESC\``,
          answer: `SELECT
  c.customer_id,
  c.name,
  c.email,
  MAX(o.order_date)           AS last_order_date,
  ROUND(SUM(o.total_amount))  AS total_spent
FROM customers c
JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.status = 'completed'
GROUP BY c.customer_id, c.name, c.email
HAVING MAX(o.order_date) < '2026-06-01'
   AND ROUND(SUM(o.total_amount)) > 1000
ORDER BY total_spent DESC;`,
          hints: [
            'JOIN orders 時可以在 ON 子句就加上 status = \'completed\' 的條件',
            '對聚合結果的過濾用 HAVING，不是 WHERE',
            'HAVING 裡重複寫聚合函數（MAX、SUM）或用欄位別名都可以，SQLite 支援別名',
          ],
          explanation: `**HAVING 和 WHERE 的分工：**
- \`WHERE\`：在分組前過濾原始行（這裡用於 status = 'completed'）
- \`HAVING\`：在分組後過濾聚合結果（這裡用於 last_order_date 和 total_spent）

**ON 子句加條件 vs WHERE 加條件：**
把 \`status = 'completed'\` 放在 \`JOIN ... ON\` 裡，效果等同放在 \`WHERE\`，但語意更清楚：「只 JOIN 有效訂單」。`,
          negatives: [
            `SELECT c.customer_id, c.name, c.email,
  MAX(o.order_date) AS last_order_date,
  ROUND(SUM(o.total_amount)) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
  AND o.status = 'completed'
GROUP BY c.customer_id, c.name, c.email
ORDER BY total_spent DESC`,
            `SELECT c.customer_id, c.name, c.email,
  MAX(o.order_date) AS last_order_date,
  ROUND(SUM(o.total_amount)) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
  AND o.status = 'completed'
WHERE MAX(o.order_date) < '2026-06-01'
GROUP BY c.customer_id, c.name, c.email
HAVING total_spent > 1000
ORDER BY total_spent DESC`
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u09.l03.e02',
          title: '活躍但剛沉睡的高價值會員',
          difficulty: 3,
          scenario: '行銷主管說：「只要過去 90 天有買、但近 30 天沒買的人，這批人最容易被喚回。」以 2026-06-30 為截止日。',
          prompt: `找出「過去 90 天有 completed 訂單，但近 30 天沒有 completed 訂單」的會員。

**日期定義（基準日：2026-06-30）：**
- 過去 90 天：\`order_date >= date('2026-06-30', '-89 days')\`
- 近 30 天：\`order_date >= date('2026-06-30', '-29 days')\`

**要求：**
- 用 \`NOT EXISTS\` 排除近 30 天有訂單的顧客
- \`last_order_date\`：過去 90 天內最後一筆 completed 訂單日期

**回傳欄位：** \`customer_id\`, \`name\`, \`email\`, \`last_order_date\`

**排序：** \`last_order_date DESC\``,
          answer: `SELECT
  c.customer_id,
  c.name,
  c.email,
  MAX(o.order_date) AS last_order_date
FROM customers c
JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.status      = 'completed'
 AND o.order_date  >= date('2026-06-30', '-89 days')
WHERE NOT EXISTS (
  SELECT 1
  FROM orders recent
  WHERE recent.customer_id = c.customer_id
    AND recent.status      = 'completed'
    AND recent.order_date  >= date('2026-06-30', '-29 days')
)
GROUP BY c.customer_id, c.name, c.email
ORDER BY last_order_date DESC;`,
          hints: [
            '外層 JOIN 只取 90 天內的 completed 訂單，NOT EXISTS 子查詢排除近 30 天有訂單的',
            'NOT EXISTS 的子查詢要關聯外層的 customer_id：WHERE recent.customer_id = c.customer_id',
            'date(\'2026-06-30\', \'-89 days\') 是 SQLite 的日期算術，結果是 2026-04-02',
          ],
          explanation: `**NOT EXISTS 的執行邏輯：**

對每個 customer，資料庫執行子查詢，問「這個人有沒有近 30 天的 completed 訂單？」：
- 找到 → \`EXISTS\` = true → \`NOT EXISTS\` = false → 該顧客被排除
- 找不到 → \`EXISTS\` = false → \`NOT EXISTS\` = true → 該顧客保留

**為何用 NOT EXISTS 而非 LEFT JOIN + IS NULL？**
兩者結果相同，但 NOT EXISTS 更直接表達「排除」的語意，程式碼可讀性更高。在有索引的情況下效能也相近。

**90 天 vs 「-89 days」：**
\`date('2026-06-30', '-89 days')\` = 2026-04-02，從 04-02 到 06-30 共 90 天（含兩端點）。若寫 \`-90 days\` 則是 91 天，要注意業務定義。`,
          negatives: [
            `SELECT c.customer_id, c.name, c.email,
  MAX(o.order_date) AS last_order_date
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
  AND o.status = 'completed'
  AND o.order_date >= date('2026-06-30', '-89 days')
WHERE o.order_date >= date('2026-06-30', '-29 days')
GROUP BY c.customer_id, c.name, c.email
ORDER BY last_order_date DESC`,
            `SELECT c.customer_id, c.name, c.email,
  MAX(o.order_date) AS last_order_date
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
  AND o.status = 'completed'
  AND o.order_date >= date('2026-06-30', '-89 days')
GROUP BY c.customer_id, c.name, c.email
ORDER BY last_order_date DESC`
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u09-l04',
      title: '數字對不起來怎麼辦？',
      minutes: 20,
      objectives: [
        '用 UNION 模擬 FULL OUTER JOIN 比對兩張表的每日數字',
        '用 COALESCE 處理因 LEFT JOIN 產生的 NULL',
        '用 NOT EXISTS 找「有 A 卻沒有對應 B」的記錄',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u09.l04.e01',
          title: '每日 purchase 事件 vs 訂單數比對',
          difficulty: 2,
          scenario: '主管說 GA4 和後台訂單數差很多，要你找出差異最大的前 10 天。',
          prompt: `比較每天的「events 表中 purchase 事件數」vs「orders 表中 completed 訂單數」。

**要求：**
- 用 CTE 分別計算每日數字
- \`event_purchases\`：events 表中 \`event_name = 'purchase'\` 的數量，按 \`DATE(event_time)\` 分組
- \`order_completions\`：orders 表中 \`status = 'completed'\` 的數量，按 \`order_date\` 分組
- 用 UNION 合併兩表日期清單，再 LEFT JOIN 兩個 CTE
- \`diff\` = order_completions - event_purchases
- 用 \`COALESCE(..., 0)\` 處理 NULL

**回傳欄位：** \`date_key\`, \`event_purchases\`, \`order_completions\`, \`diff\`

**排序：** \`ABS(diff) DESC\`，取前 10`,
          answer: `WITH all_dates AS (
  SELECT DATE(event_time) AS date_key
  FROM events
  WHERE event_name = 'purchase'
  UNION
  SELECT order_date AS date_key
  FROM orders
  WHERE status = 'completed'
),
daily_events AS (
  SELECT
    DATE(event_time) AS date_key,
    COUNT(*)         AS event_purchases
  FROM events
  WHERE event_name = 'purchase'
  GROUP BY DATE(event_time)
),
daily_orders AS (
  SELECT
    order_date AS date_key,
    COUNT(*)   AS order_completions
  FROM orders
  WHERE status = 'completed'
  GROUP BY order_date
)
SELECT
  ad.date_key,
  COALESCE(de.event_purchases,  0) AS event_purchases,
  COALESCE(do.order_completions,0) AS order_completions,
  COALESCE(do.order_completions,0)
    - COALESCE(de.event_purchases, 0) AS diff
FROM all_dates ad
LEFT JOIN daily_events de ON de.date_key = ad.date_key
LEFT JOIN daily_orders do ON do.date_key = ad.date_key
ORDER BY ABS(diff) DESC
LIMIT 10;`,
          hints: [
            'all_dates CTE 用 UNION（去重）合併兩張表的日期，確保兩邊都有出現的日期都在清單裡',
            'LEFT JOIN 兩個 CTE，沒有資料的那天會是 NULL，用 COALESCE(..., 0) 轉成 0',
            'diff 用 COALESCE 包住再相減，避免 NULL 傳染（NULL - 數字 = NULL）',
          ],
          explanation: `**為什麼不能直接 JOIN events 和 orders？**

兩張表沒有直接的 key 可以 JOIN（events 是頁面事件，orders 是交易記錄），唯一的共同維度是「日期」。所以要先分別彙總到日期層級，再用日期 JOIN。

**UNION 在這裡的作用：**
\`all_dates\` CTE 收集兩張表出現過的所有日期，作為「完整日期清單」。再 LEFT JOIN 兩個明細 CTE，確保某天只有 events 或只有 orders 的情況也不會漏掉。

**COALESCE 的必要性：**
LEFT JOIN 後，某天若只有 events 沒有 orders，\`order_completions\` 是 NULL。NULL - 數字 = NULL，導致 diff 也變 NULL、無法排序。COALESCE 把 NULL 轉成 0 才能計算。`,
          negatives: [
            `WITH daily_events AS (SELECT DATE(event_time) AS date_key, COUNT(*) AS event_purchases FROM events WHERE event_name = 'purchase' GROUP BY DATE(event_time)), daily_orders AS (SELECT order_date AS date_key, COUNT(*) AS order_completions FROM orders WHERE status = 'completed' GROUP BY order_date) SELECT de.date_key, de.event_purchases, do.order_completions, do.order_completions - de.event_purchases AS diff FROM daily_events de LEFT JOIN daily_orders do ON de.date_key = do.date_key ORDER BY ABS(diff) DESC LIMIT 10;`,
            `WITH all_dates AS (SELECT DATE(event_time) AS date_key FROM events WHERE event_name = 'purchase' UNION ALL SELECT order_date AS date_key FROM orders WHERE status = 'completed'), daily_events AS (SELECT DATE(event_time) AS date_key, COUNT(*) AS event_purchases FROM events WHERE event_name = 'purchase' GROUP BY DATE(event_time)), daily_orders AS (SELECT order_date AS date_key, COUNT(*) AS order_completions FROM orders WHERE status = 'completed' GROUP BY order_date) SELECT ad.date_key, COALESCE(de.event_purchases, 0) AS event_purchases, COALESCE(do.order_completions,0) AS order_completions, COALESCE(do.order_completions,0) - COALESCE(de.event_purchases, 0) AS diff FROM all_dates ad LEFT JOIN daily_events de ON de.date_key = ad.date_key LEFT JOIN daily_orders do ON do.date_key = ad.date_key ORDER BY ABS(diff) DESC LIMIT 10;`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u09.l04.e02',
          title: '有 purchase 事件但無對應訂單的 session',
          difficulty: 3,
          scenario: '主管要你找出「sessions 表中有 purchase 事件，但對應顧客當天在 orders 表中沒有 completed 訂單」的可疑 session，排查資料異常。',
          prompt: `找出「events 有 purchase 事件，但 session 的顧客當天在 orders 中沒有 completed 訂單」的 session。

**要求：**
- JOIN \`events\` 和 \`sessions\`（on session_id）
- 只取 \`event_name = 'purchase'\` 的事件
- 只考慮 \`sessions.customer_id IS NOT NULL\` 的 session（匿名無法追蹤）
- 用 \`NOT EXISTS\` 排除當天有 completed 訂單的顧客
  - 當天 = \`order_date = DATE(event_time)\`

**回傳欄位：** \`session_id\`, \`customer_id\`, \`DATE(event_time) AS event_date\`

**排序：** \`event_date ASC\`，取前 20`,
          answer: `SELECT
  s.session_id,
  s.customer_id,
  DATE(e.event_time) AS event_date
FROM events   e
JOIN sessions s ON s.session_id = e.session_id
WHERE e.event_name      = 'purchase'
  AND s.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = s.customer_id
      AND o.status      = 'completed'
      AND o.order_date  = DATE(e.event_time)
  )
ORDER BY event_date ASC
LIMIT 20;`,
          hints: [
            '從 events JOIN sessions 取得 customer_id',
            'NOT EXISTS 子查詢：找同一顧客、同一天（DATE(event_time)）的 completed 訂單',
            'customer_id IS NOT NULL 必須在外層 WHERE，匿名 session 無法追蹤到訂單',
          ],
          explanation: `**這題的業務意義：**

當 events 有 purchase 事件，代表瀏覽器端的結帳流程「完成」了。但如果後台沒有對應訂單，可能是：
1. 結帳 API 失敗（訂單沒寫進資料庫）
2. GA4 的 purchase 事件觸發條件設錯了
3. 顧客完成結帳但用不同帳號（跨裝置問題）

這份清單可以給工程師進一步排查。

**NOT EXISTS 與 LEFT JOIN IS NULL 的等價性：**

\`\`\`sql
-- NOT EXISTS 寫法
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = s.customer_id ...)

-- LEFT JOIN 等價寫法
LEFT JOIN orders o ON o.customer_id = s.customer_id AND ...
WHERE o.order_id IS NULL
\`\`\`

兩者結果相同，NOT EXISTS 語意更清晰，LEFT JOIN 有時效能更好（視索引而定）。`,
          negatives: [
            `SELECT s.session_id, s.customer_id, DATE(e.event_time) AS event_date
FROM events e
JOIN sessions s ON s.session_id = e.session_id
WHERE e.event_name = 'purchase'
  AND s.customer_id IS NOT NULL
ORDER BY event_date ASC LIMIT 20`,
            `SELECT s.session_id, s.customer_id, DATE(e.event_time) AS event_date
FROM events e
JOIN sessions s ON s.session_id = e.session_id
JOIN orders o
  ON o.customer_id = s.customer_id
  AND o.order_date = DATE(e.event_time)
  AND o.status = 'completed'
WHERE e.event_name = 'purchase'
  AND s.customer_id IS NOT NULL
ORDER BY event_date ASC LIMIT 20`
          ],
          ordered: true,
        },
      ],
    },
  ],
};
