const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u07',
  title: '行銷分析實戰',
  lessons: [
    {
      id: 'u07-l01',
      title: '轉換漏斗',
      minutes: 20,
      objectives: [
        '用 COUNT(DISTINCT session_id) 計算各漏斗階段的不重複 session 數',
        '以 CTE 建立多階段漏斗並一次呈現',
        '用 LAG() 和 NULLIF 計算相鄰階段轉換率',
        '理解為何漏斗分析應使用 session 而非 event 計數',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u07.l01.e01',
          title: '建立完整轉換漏斗',
          difficulty: 2,
          scenario: '產品經理想了解目前網站整體的轉換漏斗，從瀏覽到購買各階段有多少不重複 session。',
          prompt: `計算完整轉換漏斗，包含 5 個階段：\`page_view\`、\`view_item\`、\`add_to_cart\`、\`begin_checkout\`、\`purchase\`。

每個階段統計不重複的 \`session_id\` 數量，欄位命名為 \`sessions\`。

用 \`CASE\` 產生 \`step\` 欄位（1–5 依序對應上述 event_name）。

回傳欄位：\`step\`、\`event_name\`、\`sessions\`，依 \`step\` ASC 排序。`,
          starter: `SELECT
  event_name,
  COUNT(DISTINCT session_id) AS sessions
FROM events
GROUP BY event_name;`,
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
            '用 CTE 先計算各 event_name 的不重複 session 數',
            'CASE WHEN event_name = \'page_view\' THEN 1 ... END AS step',
            'WHERE 子句只保留這 5 種 event_name',
          ],
          explanation: `漏斗分析的關鍵是用 \`COUNT(DISTINCT session_id)\` 而非 \`COUNT(*)\`，避免同一 session 多次觸發同一事件被重複計算。

\`CASE\` 產生自訂排序欄位 \`step\`，讓漏斗能依業務邏輯（而非字母順序）排列。`,
          negatives: [
            `SELECT event_name, COUNT(*) AS sessions FROM events WHERE event_name IN ('page_view','view_item','add_to_cart','begin_checkout','purchase') GROUP BY event_name ORDER BY sessions DESC`,
            `SELECT event_name, COUNT(DISTINCT session_id) AS sessions FROM events GROUP BY event_name ORDER BY sessions DESC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l01.e02',
          title: '漏斗加入相鄰階段轉換率',
          difficulty: 3,
          scenario: '行銷主管看完漏斗後，想知道每個環節的轉換率，找出流失最嚴重的瓶頸。',
          prompt: `在轉換漏斗基礎上，加入相鄰階段轉換率 \`conv_rate\`（%，四捨五入至 1 位小數）。

第一階段（\`page_view\`）的 \`conv_rate\` 為 \`NULL\`（無前一階段）。

用**兩個 CTE** 完成：第一個 CTE 計算各階段 session 數與 step，第二個 CTE 用 \`LAG()\` 取前一階段 session 數。

回傳欄位：\`step\`、\`event_name\`、\`sessions\`、\`conv_rate\`，依 \`step\` ASC 排序。`,
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
),
funnel_lag AS (
  SELECT
    step,
    event_name,
    sessions,
    LAG(sessions) OVER (ORDER BY step) AS prev_sessions
  FROM funnel
)
SELECT
  step,
  event_name,
  sessions,
  ROUND(sessions * 100.0 / NULLIF(prev_sessions, 0), 1) AS conv_rate
FROM funnel_lag
ORDER BY step;`,
          hints: [
            '第一個 CTE 和上一題相同，計算 step 和 sessions',
            '第二個 CTE：LAG(sessions) OVER (ORDER BY step) AS prev_sessions',
            '最後 SELECT：ROUND(sessions * 100.0 / NULLIF(prev_sessions, 0), 1)',
          ],
          explanation: `\`LAG(col) OVER (ORDER BY step)\` 取上一列的值，第一列自然回傳 NULL，所以 \`page_view\` 的 \`conv_rate\` 就是 NULL。

\`NULLIF(prev_sessions, 0)\` 是防禦性寫法：當前一階段 session 數為 0 時避免除以零。\`100.0\` 強制浮點除法，否則整數除法在 SQLite 會捨去小數。`,
          negatives: [
            `SELECT
  event_name,
  COUNT(*) AS sessions
FROM events
WHERE event_name IN ('page_view', 'view_item', 'add_to_cart')
GROUP BY event_name
ORDER BY sessions DESC`,
            `WITH funnel AS (SELECT CASE event_name WHEN 'page_view' THEN 1 WHEN 'view_item' THEN 2 WHEN 'add_to_cart' THEN 3 WHEN 'begin_checkout' THEN 4 WHEN 'purchase' THEN 5 END AS step, event_name, COUNT(*) AS sessions FROM events WHERE event_name IN ('page_view','view_item','add_to_cart','begin_checkout','purchase') GROUP BY event_name), funnel_lag AS (SELECT step, event_name, sessions, LAG(sessions) OVER (ORDER BY step) AS prev_sessions FROM funnel) SELECT step, event_name, sessions, ROUND(sessions * 100.0 / NULLIF(prev_sessions, 0), 1) AS conv_rate FROM funnel_lag ORDER BY step`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u07-l02',
      title: '新客 vs 回購客',
      minutes: 20,
      objectives: [
        '用 ROW_NUMBER() PARTITION BY customer_id ORDER BY order_date 找出每位會員首購訂單',
        '用 CASE 標記新客與回購客',
        '計算各月份新客與回購客的訂單數和營收',
        '計算首購到次購的間隔天數',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u07.l02.e01',
          title: '每月新客與回購客統計',
          difficulty: 2,
          scenario: '行銷主管想看每個月的訂單中，新客和回購客各自的訂單數和營收，評估品牌的新客獲取能力和回購率。',
          prompt: `計算每個月（\`strftime('%Y-%m', order_date)\`）的 \`completed\` 訂單中，**新客**（該客戶的第一筆 completed 訂單）vs **回購**客的訂單數和營收。

用 **CTE + ROW_NUMBER()** 實作：先用視窗函數標記每位會員的第一筆 completed 訂單（rn=1 為新客），再用 CASE 貼標籤。

回傳欄位：\`month\`、\`customer_type\`（'新客' 或 '回購'）、\`order_count\`、\`revenue\`（ROUND 整數），依 \`month\` ASC、\`customer_type\` ASC 排序。`,
          answer: `WITH ranked AS (
  SELECT
    customer_id,
    order_id,
    order_date,
    total_amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
    ) AS rn
  FROM orders
  WHERE status = 'completed'
),
labeled AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    CASE WHEN rn = 1 THEN '新客' ELSE '回購' END AS customer_type,
    total_amount
  FROM ranked
)
SELECT
  month,
  customer_type,
  COUNT(*) AS order_count,
  ROUND(SUM(total_amount)) AS revenue
FROM labeled
GROUP BY month, customer_type
ORDER BY month ASC, customer_type ASC;`,
          hints: [
            'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn',
            'rn = 1 是該會員的首購，標記為「新客」',
            '最後 GROUP BY month, customer_type',
          ],
          explanation: `\`ROW_NUMBER()\` 為每位會員的訂單依時間順序編號，\`rn = 1\` 就是首購。注意 \`WHERE status = 'completed'\` 要在視窗函數計算前就過濾，否則退款訂單可能搶先佔據 rn=1 的位置。`,
          negatives: [
            `WITH ranked AS (SELECT customer_id, order_id, order_date, total_amount, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn FROM orders) SELECT strftime('%Y-%m', order_date) AS month, CASE WHEN rn = 1 THEN '新客' ELSE '回購' END AS customer_type, COUNT(*) AS order_count, ROUND(SUM(total_amount)) AS revenue FROM ranked WHERE status = 'completed' GROUP BY month, customer_type ORDER BY month ASC, customer_type ASC`,
            `WITH first_orders AS (SELECT customer_id, MIN(order_date) AS first_date FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT strftime('%Y-%m', o.order_date) AS month, CASE WHEN o.order_date = f.first_date THEN '新客' ELSE '回購' END AS customer_type, COUNT(*) AS order_count, ROUND(SUM(o.total_amount)) AS revenue FROM orders o JOIN first_orders f ON o.customer_id = f.customer_id WHERE o.status = 'completed' GROUP BY month, customer_type ORDER BY month ASC, customer_type ASC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l02.e02',
          title: '首購到次購的間隔天數',
          difficulty: 3,
          scenario: '顧客成功團隊想了解會員從首購到回購的典型間隔，以決定何時發送「喚回」促購通知。',
          prompt: `計算每位會員的首購日期、次購日期（第二筆 completed 訂單的日期），以及首購到次購的間隔天數 \`days_to_repurchase\`。

只顯示**有次購**的會員（即有第二筆 completed 訂單的會員）。

間隔天數用 \`julianday\` 差計算，\`ROUND\` 到整數。

回傳欄位：\`customer_id\`、\`first_order_date\`、\`second_order_date\`、\`days_to_repurchase\`，依 \`days_to_repurchase\` ASC，取前 20 筆。`,
          answer: `WITH ranked AS (
  SELECT
    customer_id,
    order_date,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
    ) AS rn
  FROM orders
  WHERE status = 'completed'
),
pivoted AS (
  SELECT
    customer_id,
    MAX(CASE WHEN rn = 1 THEN order_date END) AS first_order_date,
    MAX(CASE WHEN rn = 2 THEN order_date END) AS second_order_date
  FROM ranked
  GROUP BY customer_id
)
SELECT
  customer_id,
  first_order_date,
  second_order_date,
  ROUND(julianday(second_order_date) - julianday(first_order_date)) AS days_to_repurchase
FROM pivoted
WHERE second_order_date IS NOT NULL
ORDER BY days_to_repurchase ASC
LIMIT 20;`,
          hints: [
            'ROW_NUMBER() 標記 rn=1（首購）和 rn=2（次購）',
            '用 MAX(CASE WHEN rn=1 THEN order_date END) 做行轉列',
            'julianday(second_order_date) - julianday(first_order_date) 計算天數差',
            'WHERE second_order_date IS NOT NULL 過濾掉只有一次購買的會員',
          ],
          explanation: `這題的技巧在於「行轉列（Pivot）」：用 \`MAX(CASE WHEN rn=N THEN col END)\` 把同一個 customer_id 的第 1、第 2 筆訂單日期放到同一列，再計算差值。

\`WHERE second_order_date IS NOT NULL\` 自然過濾掉只有一次購買的會員，因為他們的 rn=2 那個 CASE 不會有值，MAX 回傳 NULL。`,
          negatives: [
            `WITH first AS (SELECT customer_id, MIN(order_date) AS first_order_date FROM orders WHERE status='completed' GROUP BY customer_id), second AS (SELECT customer_id, MIN(order_date) AS second_order_date FROM orders WHERE status='completed' GROUP BY customer_id) SELECT f.customer_id, f.first_order_date, s.second_order_date, ROUND(julianday(s.second_order_date)-julianday(f.first_order_date)) AS days_to_repurchase FROM first f JOIN second s ON f.customer_id=s.customer_id WHERE s.second_order_date IS NOT NULL ORDER BY days_to_repurchase ASC LIMIT 20`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u07-l03',
      title: 'RFM 客戶分群',
      minutes: 25,
      objectives: [
        '計算 Recency（最後購買距今天數）、Frequency（購買次數）、Monetary（總消費）',
        '用 julianday 計算日期差',
        '用 CASE WHEN 實作多條件分群',
        '理解 CASE WHEN 的條件優先順序',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u07.l03.e01',
          title: '計算每位會員的 RFM',
          difficulty: 2,
          scenario: '行銷分析師要為 CRM 系統準備 RFM 基礎資料，方便後續行銷活動的精準分眾。',
          prompt: `計算每位有 \`completed\` 訂單的會員的 RFM 指標：

- \`recency\`：距 2026-06-30 的天數（\`julianday\` 差，\`CAST\` 為整數）
- \`frequency\`：completed 訂單數
- \`monetary\`：SUM total_amount，\`ROUND\` 整數

回傳欄位：\`customer_id\`、\`recency\`、\`frequency\`、\`monetary\`，依 \`monetary\` DESC，取前 20 筆。`,
          answer: `SELECT
  customer_id,
  CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency,
  COUNT(DISTINCT order_id) AS frequency,
  ROUND(SUM(total_amount)) AS monetary
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
ORDER BY monetary DESC
LIMIT 20;`,
          hints: [
            'julianday(\'2026-06-30\') - julianday(MAX(order_date)) 計算天數',
            'CAST(... AS INTEGER) 轉整數',
            'COUNT(DISTINCT order_id) 計算訂單數',
          ],
          explanation: `\`julianday\` 是 SQLite 計算日期差的標準做法。\`MAX(order_date)\` 取最後一筆訂單日期，用基準日減去它就是 Recency。\`COUNT(DISTINCT order_id)\` 確保即使同一訂單有多筆 order_items 也不會重複計算。`,
          negatives: [
            `SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MIN(order_date)) AS INTEGER) AS recency, COUNT(order_id) AS frequency, ROUND(SUM(total_amount)) AS monetary FROM orders WHERE status = 'completed' GROUP BY customer_id ORDER BY monetary DESC LIMIT 20`,
            `SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency, COUNT(DISTINCT order_id) AS frequency, ROUND(SUM(total_amount)) AS monetary FROM orders GROUP BY customer_id ORDER BY monetary DESC LIMIT 20`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l03.e02',
          title: 'RFM 分群統計',
          difficulty: 3,
          scenario: '行銷主管想知道各客戶分群的人數分佈和平均消費，以便規劃不同群體的行銷預算。',
          prompt: `在 RFM 基礎上，用 \`CASE WHEN\` 分群（**條件依序判斷，先符合先套用**）：

- **VIP**：frequency >= 5 且 monetary >= 10000
- **活躍**：frequency >= 3 或 monetary >= 5000
- **沉睡**：recency <= 180
- **其他**：以上皆不符合

用 **CTE** 先算 RFM 再分群。

回傳欄位：\`segment\`、\`customer_count\`、\`avg_monetary\`（ROUND 整數），依 \`customer_count\` DESC 排序。`,
          answer: `WITH rfm AS (
  SELECT
    customer_id,
    CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency,
    COUNT(DISTINCT order_id) AS frequency,
    ROUND(SUM(total_amount)) AS monetary
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
segmented AS (
  SELECT
    customer_id,
    monetary,
    CASE
      WHEN frequency >= 5 AND monetary >= 10000 THEN 'VIP'
      WHEN frequency >= 3 OR  monetary >= 5000  THEN '活躍'
      WHEN recency <= 180                        THEN '沉睡'
      ELSE '其他'
    END AS segment
  FROM rfm
)
SELECT
  segment,
  COUNT(*) AS customer_count,
  ROUND(AVG(monetary)) AS avg_monetary
FROM segmented
GROUP BY segment
ORDER BY customer_count DESC;`,
          hints: [
            '第一個 CTE 計算 RFM（同上題）',
            '第二個 CTE 加 CASE WHEN 分群',
            '最後 SELECT 做 GROUP BY segment',
            'CASE WHEN 順序很重要：VIP 條件放最前',
          ],
          explanation: `\`CASE WHEN\` 短路求值：遇到第一個符合的條件就停止。VIP 放最前面確保高頻高消費客戶優先被分到 VIP，不會落入「活躍」群。

兩個 CTE 的設計讓程式碼更清晰：第一層算指標，第二層做分群，最後一層做彙總統計。`,
          negatives: [
            `WITH rfm AS (SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency, COUNT(DISTINCT order_id) AS frequency, ROUND(SUM(total_amount)) AS monetary FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT CASE WHEN frequency >= 3 OR monetary >= 5000 THEN '活躍' WHEN frequency >= 5 AND monetary >= 10000 THEN 'VIP' WHEN recency <= 180 THEN '沉睡' ELSE '其他' END AS segment, COUNT(*) AS customer_count, ROUND(AVG(monetary)) AS avg_monetary FROM rfm GROUP BY segment ORDER BY customer_count DESC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l03.e03',
          title: '找出沉睡高價值客戶',
          difficulty: 3,
          scenario: 'CRM 專員想發送喚醒郵件給「很久沒買，但歷史消費高」的會員，這批人是最值得挽回的。',
          prompt: `找出「沉睡高價值客戶」：

- \`recency\` > 90（最後購買距今超過 90 天）
- \`monetary\` > 5000（歷史消費超過 5000）

RFM 定義同前（completed 訂單，基準日 2026-06-30）。

回傳欄位：\`customer_id\`、\`recency\`、\`frequency\`、\`monetary\`，依 \`monetary\` DESC 排序。`,
          answer: `WITH rfm AS (
  SELECT
    customer_id,
    CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency,
    COUNT(DISTINCT order_id) AS frequency,
    ROUND(SUM(total_amount)) AS monetary
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  customer_id,
  recency,
  frequency,
  monetary
FROM rfm
WHERE recency > 90
  AND monetary > 5000
ORDER BY monetary DESC;`,
          hints: [
            'CTE 先算 RFM（和 e01 一樣）',
            '外層 WHERE recency > 90 AND monetary > 5000',
          ],
          explanation: `這題展示了 CTE 的一大優點：先把複雜的計算封裝起來，外層就能像查普通資料表一樣用 \`WHERE\` 篩選。

沉睡高價值客戶對業績的潛在貢獻最大，是 CRM 行動的優先目標。`,
          negatives: [
            `WITH rfm AS (SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency, COUNT(DISTINCT order_id) AS frequency, ROUND(SUM(total_amount)) AS monetary FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT customer_id, recency, frequency, monetary FROM rfm WHERE recency > 90 OR monetary > 5000 ORDER BY monetary DESC`,
            `WITH rfm AS (SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INTEGER) AS recency, COUNT(DISTINCT order_id) AS frequency, ROUND(SUM(total_amount)) AS monetary FROM orders GROUP BY customer_id) SELECT customer_id, recency, frequency, monetary FROM rfm WHERE recency > 90 AND monetary > 5000 ORDER BY monetary DESC`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u07-l04',
      title: '廣告 ROAS 分析',
      minutes: 20,
      objectives: [
        '計算各廣告活動的總花費',
        '透過 sessions 將廣告活動與訂單串接',
        '計算 ROAS 並用 NULLIF 防零錯誤',
        '用 NULLS LAST 處理空值排序',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u07.l04.e01',
          title: '各活動廣告花費排行',
          difficulty: 2,
          scenario: '財務主管想核對各廣告活動的實際花費，確認是否在預算範圍內。',
          prompt: `計算每個 campaign 的總廣告花費 \`total_cost\`（從 \`ad_spend\` SUM \`cost\`），JOIN \`campaigns\` 取得名稱和平台。

回傳欄位：\`campaign_id\`、\`campaign_name\`、\`platform\`、\`total_cost\`（ROUND 0 位），依 \`total_cost\` DESC 排序。`,
          answer: `SELECT
  a.campaign_id,
  c.campaign_name,
  c.platform,
  ROUND(SUM(a.cost)) AS total_cost
FROM ad_spend a
JOIN campaigns c ON a.campaign_id = c.campaign_id
GROUP BY a.campaign_id, c.campaign_name, c.platform
ORDER BY total_cost DESC;`,
          hints: [
            'SUM(a.cost) 加總 ad_spend 的花費',
            'JOIN campaigns 取得名稱和平台',
            'GROUP BY campaign_id, campaign_name, platform',
          ],
          explanation: `\`ad_spend\` 每一列是一天的花費，\`SUM(cost)\` 加總整個活動期間的總花費。JOIN \`campaigns\` 是為了取得可讀的名稱和平台資訊。`,
          negatives: [
            `SELECT campaign_id, campaign_name, platform, budget AS total_cost FROM campaigns ORDER BY total_cost DESC`,
            `SELECT a.campaign_id, c.campaign_name, c.platform, ROUND(AVG(a.cost)) AS total_cost FROM ad_spend a JOIN campaigns c ON a.campaign_id = c.campaign_id GROUP BY a.campaign_id, c.campaign_name, c.platform ORDER BY total_cost DESC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l04.e02',
          title: '活動歸因訂單數與營收',
          difficulty: 3,
          scenario: '行銷分析師要計算各廣告活動實際帶來了多少訂單和營收，為下一季的預算分配提供依據。',
          prompt: `計算每個 campaign 透過 \`sessions\` 帶來的 \`completed\` 訂單數 \`attributed_orders\` 和營收 \`attributed_revenue\`。

串接邏輯：\`sessions.campaign_id\` → \`sessions.customer_id\` → \`orders.customer_id\`，且訂單日期（\`order_date\`）必須 >= session 開始日期（\`DATE(session_start)\`）。

只計有 \`campaign_id\` 的 session（\`IS NOT NULL\`）。

回傳欄位：\`campaign_id\`、\`attributed_orders\`、\`attributed_revenue\`（ROUND 整數），只顯示 \`attributed_orders > 0\`，依 \`attributed_revenue\` DESC 排序。`,
          answer: `SELECT
  s.campaign_id,
  COUNT(DISTINCT o.order_id)   AS attributed_orders,
  ROUND(SUM(o.total_amount))   AS attributed_revenue
FROM sessions s
JOIN orders o
  ON  o.customer_id = s.customer_id
  AND o.order_date >= DATE(s.session_start)
  AND o.status = 'completed'
WHERE s.campaign_id IS NOT NULL
GROUP BY s.campaign_id
HAVING COUNT(DISTINCT o.order_id) > 0
ORDER BY attributed_revenue DESC;`,
          hints: [
            'FROM sessions s JOIN orders o ON o.customer_id = s.customer_id',
            '加條件：AND o.order_date >= DATE(s.session_start)',
            'WHERE s.campaign_id IS NOT NULL',
            'HAVING COUNT(DISTINCT o.order_id) > 0',
          ],
          explanation: `廣告歸因的邏輯是：同一位客戶，在 session 發生之後才下的訂單，才算是這個廣告活動帶來的。\`COUNT(DISTINCT o.order_id)\` 確保同一訂單只計一次，即使這位客戶有多個來自同一 campaign 的 session。`,
          negatives: [
            `SELECT s.campaign_id, COUNT(DISTINCT o.order_id) AS attributed_orders, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id WHERE s.campaign_id IS NOT NULL AND o.status = 'completed' GROUP BY s.campaign_id HAVING COUNT(DISTINCT o.order_id) > 0 ORDER BY attributed_revenue DESC`,
            `SELECT s.campaign_id, COUNT(o.order_id) AS attributed_orders, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id AND o.order_date >= DATE(s.session_start) AND o.status = 'completed' WHERE s.campaign_id IS NOT NULL GROUP BY s.campaign_id HAVING COUNT(o.order_id) > 0 ORDER BY attributed_revenue DESC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l04.e03',
          title: '合併計算 ROAS',
          difficulty: 3,
          scenario: '行銷主管要看各活動的 ROAS 排行榜，決定哪些活動要加碼投放、哪些要暫停。',
          prompt: `結合廣告花費和歸因營收，計算 ROAS：

\`roas = attributed_revenue / total_cost\`（用 NULLIF 防零，ROUND 2位小數）

回傳欄位：\`campaign_name\`、\`platform\`、\`total_cost\`、\`attributed_revenue\`、\`roas\`。

只顯示 \`total_cost > 0\`，依 \`roas\` DESC NULLS LAST 排序。`,
          answer: `WITH spend AS (
  SELECT
    a.campaign_id,
    c.campaign_name,
    c.platform,
    ROUND(SUM(a.cost)) AS total_cost
  FROM ad_spend a
  JOIN campaigns c ON a.campaign_id = c.campaign_id
  GROUP BY a.campaign_id, c.campaign_name, c.platform
),
revenue AS (
  SELECT
    s.campaign_id,
    COUNT(DISTINCT o.order_id)  AS attributed_orders,
    ROUND(SUM(o.total_amount))  AS attributed_revenue
  FROM sessions s
  JOIN orders o
    ON  o.customer_id = s.customer_id
    AND o.order_date >= DATE(s.session_start)
    AND o.status = 'completed'
  WHERE s.campaign_id IS NOT NULL
  GROUP BY s.campaign_id
)
SELECT
  sp.campaign_name,
  sp.platform,
  sp.total_cost,
  COALESCE(rv.attributed_revenue, 0) AS attributed_revenue,
  ROUND(COALESCE(rv.attributed_revenue, 0) / NULLIF(sp.total_cost, 0), 2) AS roas
FROM spend sp
LEFT JOIN revenue rv ON sp.campaign_id = rv.campaign_id
WHERE sp.total_cost > 0
ORDER BY roas DESC NULLS LAST;`,
          hints: [
            '第一個 CTE：廣告花費（同 e01）',
            '第二個 CTE：歸因營收（同 e02）',
            'LEFT JOIN revenue 因為有些 campaign 可能沒有帶來訂單',
            'COALESCE(rv.attributed_revenue, 0) 處理沒有歸因的活動',
            'ROUND(revenue / NULLIF(cost, 0), 2) 計算 ROAS',
          ],
          explanation: `用 \`LEFT JOIN\` 確保即使某個 campaign 沒有帶來任何訂單，也會出現在結果中（attributed_revenue 為 NULL，經 COALESCE 轉為 0）。

\`NULLS LAST\` 讓 ROAS 無法計算（NULL）的列排在最後，而非最前面，符合業務閱讀習慣。`,
          negatives: [
            `WITH spend AS (SELECT a.campaign_id, c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost FROM ad_spend a JOIN campaigns c ON a.campaign_id = c.campaign_id GROUP BY a.campaign_id, c.campaign_name, c.platform), revenue AS (SELECT s.campaign_id, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id AND o.order_date >= DATE(s.session_start) AND o.status = 'completed' WHERE s.campaign_id IS NOT NULL GROUP BY s.campaign_id) SELECT sp.campaign_name, sp.platform, sp.total_cost, rv.attributed_revenue, ROUND(sp.total_cost / NULLIF(rv.attributed_revenue, 0), 2) AS roas FROM spend sp JOIN revenue rv ON sp.campaign_id = rv.campaign_id WHERE sp.total_cost > 0 ORDER BY roas DESC NULLS LAST`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'u07-l05',
      title: '月 Cohort 留存',
      minutes: 25,
      objectives: [
        '定義 Cohort 為首購月份，計算每位會員所屬的 Cohort',
        '計算每位會員各購買月份距首購的月差',
        '統計各 Cohort 在不同月差的留存人數',
        '計算留存率並理解其業務意義',
      ],
      body: md('./l05.md'),
      exercises: [
        {
          id: 'sqlf.u07.l05.e01',
          title: 'Cohort 留存人數',
          difficulty: 3,
          scenario: '行銷分析師要建立 Cohort 留存報表，了解不同月份加入的客戶，在後續月份的回購狀況。',
          prompt: `計算每個 Cohort（首購月份）在 \`month_diff = 0, 1, 2, 3\` 時的留存人數（有 \`completed\` 訂單的不重複 \`customer_id\` 數），欄位命名 \`retained_customers\`。

用 **CTE** 實作：
1. 第一個 CTE：計算每位會員的首購月份（\`cohort_month\`）
2. 第二個 CTE：找出每位會員每個月的購買記錄（不重複 \`customer_id\` + \`order_month\`）
3. 第三個 CTE：計算月差

月差公式：\`(年差 × 12) + 月差\`，其中年月從各自的 YYYY-MM 字串解析。

只顯示 \`month_diff <= 3\`，回傳 \`cohort_month\`、\`month_diff\`、\`retained_customers\`，依 \`cohort_month\` ASC、\`month_diff\` ASC 排序。`,
          answer: `WITH first_orders AS (
  SELECT
    customer_id,
    MIN(order_date)                    AS first_order_date,
    strftime('%Y-%m', MIN(order_date)) AS cohort_month
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
monthly_orders AS (
  SELECT DISTINCT
    customer_id,
    strftime('%Y-%m', order_date) AS order_month
  FROM orders
  WHERE status = 'completed'
),
cohort_data AS (
  SELECT
    f.cohort_month,
    m.customer_id,
    (
      (CAST(strftime('%Y', m.order_month || '-01') AS INTEGER) -
       CAST(strftime('%Y', f.first_order_date)     AS INTEGER)) * 12
      +
      (CAST(strftime('%m', m.order_month || '-01') AS INTEGER) -
       CAST(strftime('%m', f.first_order_date)     AS INTEGER))
    ) AS month_diff
  FROM first_orders f
  JOIN monthly_orders m ON f.customer_id = m.customer_id
)
SELECT
  cohort_month,
  month_diff,
  COUNT(DISTINCT customer_id) AS retained_customers
FROM cohort_data
WHERE month_diff <= 3
GROUP BY cohort_month, month_diff
ORDER BY cohort_month ASC, month_diff ASC;`,
          hints: [
            '第一個 CTE：GROUP BY customer_id，MIN(order_date) 取首購日期',
            '第二個 CTE：SELECT DISTINCT customer_id, strftime(\'%Y-%m\', order_date) 取各月份',
            '月差 = (年差 × 12) + 月差，年月分別用 CAST(strftime(\'%Y\'/\'%m\', ...) AS INTEGER)',
            'WHERE month_diff <= 3 篩選前 4 個月',
          ],
          explanation: `Cohort 分析的核心是「月差」計算。\`month_diff = 0\` 是首購月本身（cohort size），\`month_diff = 1\` 是下個月，以此類推。

\`SELECT DISTINCT customer_id, order_month\` 確保同一客戶在同一月份不管買幾次，只計算一次留存。`,
          negatives: [
            `WITH first_orders AS (SELECT customer_id, MIN(order_date) AS first_order_date, strftime('%Y-%m', MIN(order_date)) AS cohort_month FROM orders WHERE status='completed' GROUP BY customer_id), monthly_orders AS (SELECT customer_id, strftime('%Y-%m', order_date) AS order_month FROM orders WHERE status='completed'), cohort_data AS (SELECT f.cohort_month, m.customer_id, (CAST(strftime('%Y', m.order_month) AS INTEGER) - CAST(strftime('%Y', f.first_order_date) AS INTEGER)) * 12 AS month_diff FROM first_orders f JOIN monthly_orders m ON f.customer_id = m.customer_id) SELECT cohort_month, month_diff, COUNT(DISTINCT customer_id) AS retained_customers FROM cohort_data WHERE month_diff <= 3 GROUP BY cohort_month, month_diff ORDER BY cohort_month ASC, month_diff ASC`,
          ],
          ordered: true,
        },
        {
          id: 'sqlf.u07.l05.e02',
          title: 'Cohort 留存率',
          difficulty: 3,
          scenario: '行銷主管想看以百分比表示的 Cohort 留存率，評估不同月份加入的客戶黏著度是否有改善趨勢。',
          prompt: `在上題基礎上，計算留存率 \`retention_rate\`（% = retained_customers / cohort_size × 100，ROUND 1 位）。

\`cohort_size\` = 該 Cohort 在 \`month_diff = 0\` 時的留存人數（即首購月的不重複 customer 數）。

用 **3 個 CTE** 完成：
1. 計算各 Cohort 各月差的留存人數（同上題）
2. 從留存人數取出 cohort_size（month_diff = 0 的那列）
3. 合併計算留存率

只顯示 \`month_diff <= 3\`，回傳 \`cohort_month\`、\`month_diff\`、\`cohort_size\`、\`retained_customers\`、\`retention_rate\`，依 \`cohort_month\` ASC、\`month_diff\` ASC 排序。`,
          answer: `WITH first_orders AS (
  SELECT
    customer_id,
    MIN(order_date)                    AS first_order_date,
    strftime('%Y-%m', MIN(order_date)) AS cohort_month
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
monthly_orders AS (
  SELECT DISTINCT
    customer_id,
    strftime('%Y-%m', order_date) AS order_month
  FROM orders
  WHERE status = 'completed'
),
cohort_data AS (
  SELECT
    f.cohort_month,
    m.customer_id,
    (
      (CAST(strftime('%Y', m.order_month || '-01') AS INTEGER) -
       CAST(strftime('%Y', f.first_order_date)     AS INTEGER)) * 12
      +
      (CAST(strftime('%m', m.order_month || '-01') AS INTEGER) -
       CAST(strftime('%m', f.first_order_date)     AS INTEGER))
    ) AS month_diff
  FROM first_orders f
  JOIN monthly_orders m ON f.customer_id = m.customer_id
),
cohort_retained AS (
  SELECT
    cohort_month,
    month_diff,
    COUNT(DISTINCT customer_id) AS retained_customers
  FROM cohort_data
  GROUP BY cohort_month, month_diff
),
cohort_size AS (
  SELECT
    cohort_month,
    retained_customers AS cohort_size
  FROM cohort_retained
  WHERE month_diff = 0
)
SELECT
  r.cohort_month,
  r.month_diff,
  s.cohort_size,
  r.retained_customers,
  ROUND(r.retained_customers * 100.0 / NULLIF(s.cohort_size, 0), 1) AS retention_rate
FROM cohort_retained r
JOIN cohort_size s ON r.cohort_month = s.cohort_month
WHERE r.month_diff <= 3
ORDER BY r.cohort_month ASC, r.month_diff ASC;`,
          hints: [
            '前三個 CTE 和上題相同（first_orders, monthly_orders, cohort_data）',
            '第四個 CTE：GROUP BY cohort_month, month_diff，COUNT(DISTINCT customer_id)',
            '第五個 CTE：WHERE month_diff = 0 取出 cohort_size',
            'JOIN cohort_size ON cohort_month，計算 retained_customers * 100.0 / cohort_size',
          ],
          explanation: `留存率的關鍵在於把 \`cohort_size\`（month_diff=0 的人數）單獨取出後再 JOIN 回去，這樣每個 cohort_month 的所有月差列都能除以相同的分母。

\`ROUND(..., 1)\` 保留一位小數，\`NULLIF(cohort_size, 0)\` 防除以零。\`100.0\` 確保浮點數除法。`,
          negatives: [
            `WITH first_orders AS (SELECT customer_id, MIN(order_date) AS first_order_date, strftime('%Y-%m', MIN(order_date)) AS cohort_month FROM orders WHERE status='completed' GROUP BY customer_id), monthly_orders AS (SELECT DISTINCT customer_id, strftime('%Y-%m', order_date) AS order_month FROM orders WHERE status='completed'), cohort_data AS (SELECT f.cohort_month, m.customer_id, (CAST(strftime('%Y', m.order_month || '-01') AS INTEGER) - CAST(strftime('%Y', f.first_order_date) AS INTEGER)) * 12 + (CAST(strftime('%m', m.order_month || '-01') AS INTEGER) - CAST(strftime('%m', f.first_order_date) AS INTEGER)) AS month_diff FROM first_orders f JOIN monthly_orders m ON f.customer_id = m.customer_id), cohort_retained AS (SELECT cohort_month, month_diff, COUNT(DISTINCT customer_id) AS retained_customers FROM cohort_data GROUP BY cohort_month, month_diff), cohort_size AS (SELECT cohort_month, retained_customers AS cohort_size FROM cohort_retained WHERE month_diff = 0) SELECT r.cohort_month, r.month_diff, s.cohort_size, r.retained_customers, ROUND(r.retained_customers * 100.0 / NULLIF(s.cohort_size, 0), 1) AS retention_rate FROM cohort_retained r JOIN cohort_size s ON r.cohort_month = s.cohort_month ORDER BY r.cohort_month ASC, r.month_diff ASC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
