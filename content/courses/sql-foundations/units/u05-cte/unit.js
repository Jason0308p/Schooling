const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u05',
  title: '子查詢與 CTE',
  lessons: [
    {
      id: 'u05-l01',
      title: 'WHERE 子查詢與 FROM 子查詢',
      minutes: 25,
      objectives: [
        '寫出回傳單一值的 scalar 子查詢，用於 WHERE 條件',
        '用 IN 子查詢從另一張表篩選符合條件的記錄',
        '把 SELECT 放進 FROM 後面當成衍生表（需加別名）',
        '理解子查詢的執行順序：內層先跑，外層再用結果',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u05.l01.e01',
          title: '高於平均的訂單',
          difficulty: 2,
          scenario: '業務主管想找出金額高於所有 completed 訂單平均值的訂單，列出清單檢視高價值交易。',
          prompt: `找出 \`total_amount\` 高於所有 \`completed\` 訂單平均值的訂單。

回傳欄位：\`order_id\`、\`customer_id\`、\`order_date\`、\`total_amount\`

篩選條件：
- \`status = 'completed'\`
- \`total_amount\` 高於所有 completed 訂單的平均 total_amount（用 scalar 子查詢）

排序：\`total_amount DESC\``,
          starter: `SELECT
  order_id,
  customer_id,
  order_date,
  total_amount
FROM orders
WHERE status = 'completed'
  AND total_amount > (
    -- 在這裡寫 scalar 子查詢
  )
ORDER BY total_amount DESC;`,
          answer: `SELECT
  order_id,
  customer_id,
  order_date,
  total_amount
FROM orders
WHERE status = 'completed'
  AND total_amount > (
    SELECT AVG(total_amount)
    FROM orders
    WHERE status = 'completed'
  )
ORDER BY total_amount DESC;`,
          hints: [
            '子查詢放在 `> (...)` 的括號內',
            '子查詢本身也要加 `WHERE status = \'completed\'`，否則算的是所有訂單的平均',
            '子查詢回傳一個數字（AVG），外層拿這個數字做比較',
          ],
          explanation: `scalar 子查詢先計算所有 completed 訂單的平均金額（一個數字），外層查詢再用這個數字當門檻篩選。

關鍵點：子查詢的 \`WHERE status = 'completed'\` 不能省略——如果省略，平均值會包含 refunded 和 cancelled 訂單，門檻就會偏低，篩出來的結果不準確。`,
          negatives: [
            `SELECT order_id, customer_id, order_date, total_amount FROM orders WHERE total_amount > (SELECT AVG(total_amount) FROM orders WHERE status = 'completed') ORDER BY total_amount DESC;`,
          ],
          mistakes: [],
          ordered: true,
        },
        {
          id: 'sqlf.u05.l01.e02',
          title: '購買次數高於平均的會員',
          difficulty: 3,
          scenario: '會員經營團隊想找出購買頻率高於平均的活躍會員，作為忠誠計畫的優先邀請名單。',
          prompt: `找出購買次數（completed 訂單數）**高於**所有有過 completed 訂單的會員的平均購買次數的會員。

步驟提示：
1. 用 FROM 子查詢（或先思考如何用子查詢）算出每位會員的 completed 訂單數 \`order_count\`
2. 再用 scalar 子查詢算出這些會員的平均 order_count
3. 篩選高於平均的會員

回傳欄位：\`customer_id\`、\`order_count\`

排序：\`order_count DESC\``,
          starter: `SELECT customer_id, order_count
FROM (
  -- 先算每位會員的訂單數
  SELECT customer_id, COUNT(*) AS order_count
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
) AS customer_counts
WHERE order_count > (
  -- 再算平均訂單數
)
ORDER BY order_count DESC;`,
          answer: `SELECT customer_id, order_count
FROM (
  SELECT customer_id, COUNT(*) AS order_count
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
) AS customer_counts
WHERE order_count > (
  SELECT AVG(order_count)
  FROM (
    SELECT customer_id, COUNT(*) AS order_count
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
  )
)
ORDER BY order_count DESC;`,
          hints: [
            'FROM 子查詢算出每人的訂單數，需要給別名（如 `AS customer_counts`）',
            '平均訂單數也要用子查詢算，子查詢的結構和 FROM 子查詢一樣',
            '注意：AVG 算的是「每位有購買記錄的會員的平均訂單數」，不是全體會員',
          ],
          explanation: `這題需要兩層子查詢：

1. **FROM 子查詢**：把每位會員的訂單數算出來，作為「衍生表」
2. **scalar 子查詢**：在 WHERE 中，再用同樣邏輯算出平均訂單數

雖然寫起來有點重複，但邏輯是正確的——L03 會介紹 CTE，可以大幅簡化這種重複。`,
          negatives: [
            `-- 錯誤：直接對 orders 算 AVG(COUNT(*)) 會報錯（不能對聚合函數再聚合）
SELECT customer_id, COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING COUNT(*) > (SELECT AVG(COUNT(*)) FROM orders WHERE status = 'completed' GROUP BY customer_id);`,
          ],
          mistakes: [],
          ordered: true,
        },
      ],
    },
    {
      id: 'u05-l02',
      title: 'EXISTS 與 NOT EXISTS',
      minutes: 20,
      objectives: [
        '理解 EXISTS 的語義：只關心子查詢是否回傳至少一列',
        '用 NOT EXISTS 找出「另一張表沒有對應記錄」的情況',
        '說明 NOT EXISTS 相比 NOT IN 在 NULL 處理上的優勢',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u05.l02.e01',
          title: '從未下過 completed 訂單的會員',
          difficulty: 2,
          scenario: '行銷團隊要對「從未完成購買」的會員發送喚回優惠，需要圈出這批名單。',
          prompt: `用 \`NOT EXISTS\` 找出**從未下過 completed 訂單**的會員。

回傳欄位：\`customer_id\`、\`name\`、\`signup_date\`

排序：\`signup_date ASC\``,
          starter: `SELECT
  customer_id,
  name,
  signup_date
FROM customers c
WHERE NOT EXISTS (
  -- 在這裡寫：對應到 c.customer_id 且 status = 'completed' 的訂單
)
ORDER BY signup_date ASC;`,
          answer: `SELECT
  customer_id,
  name,
  signup_date
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.status = 'completed'
)
ORDER BY signup_date ASC;`,
          hints: [
            '`NOT EXISTS` 後面的子查詢用 `SELECT 1`，表示我只在意有沒有，不在意值',
            '子查詢必須包含關聯條件 `o.customer_id = c.customer_id`',
            '再加一個條件 `AND o.status = \'completed\'`',
          ],
          explanation: `\`NOT EXISTS\` 對 \`customers\` 裡的每一列，都去 \`orders\` 確認：「這個 customer_id 有沒有 completed 訂單？」如果沒有，\`NOT EXISTS\` 為 TRUE，這位會員就被選入結果。

為什麼用 \`NOT EXISTS\` 而不是 \`NOT IN\`？如果有會員的 \`customer_id\` 為 NULL（雖然本資料集不太可能），\`NOT IN\` 會因為 NULL 導致整個條件失效，返回空結果。\`NOT EXISTS\` 沒有這個問題。`,
          negatives: [
            `-- 錯誤：找到的是「有 completed 訂單」的會員，邏輯反了
SELECT customer_id, name, signup_date
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.customer_id AND o.status = 'completed'
)
ORDER BY signup_date ASC;`,
          ],
          mistakes: [],
          ordered: true,
        },
        {
          id: 'sqlf.u05.l02.e02',
          title: '有曝光但當天無購買事件的廣告日期',
          difficulty: 3,
          scenario: '廣告效益分析師要找出「廣告有曝光但當天平台完全沒有購買事件」的日期和活動，評估這些廣告是否有轉換問題。',
          prompt: `找出 \`ad_spend\` 中 \`impressions > 0\`，但**當天（同一個 spend_date 的日期）在 \`events\` 表中沒有任何 \`event_name = 'purchase'\` 的事件**的記錄。

注意：\`ad_spend\` 和 \`events\` 之間沒有直接的 key，需要透過日期比對：
- \`ad_spend.spend_date\`（格式 YYYY-MM-DD）
- \`events.event_time\` 是完整時間戳，取日期部分用 \`DATE(events.event_time)\`

用 \`NOT EXISTS\` 關聯這兩張表。

回傳欄位：\`spend_date\`、\`campaign_id\`

排序：\`spend_date ASC\`、\`campaign_id ASC\`

只取前 **15** 筆`,
          starter: `SELECT
  spend_date,
  campaign_id
FROM ad_spend
WHERE impressions > 0
  AND NOT EXISTS (
    -- 在這裡：當天有 purchase 事件
  )
ORDER BY spend_date, campaign_id
LIMIT 15;`,
          answer: `SELECT
  spend_date,
  campaign_id
FROM ad_spend
WHERE impressions > 0
  AND NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE DATE(e.event_time) = ad_spend.spend_date
      AND e.event_name = 'purchase'
  )
ORDER BY spend_date, campaign_id
LIMIT 15;`,
          hints: [
            '`NOT EXISTS` 的子查詢從 `events` 表查',
            '日期比對：`DATE(e.event_time) = ad_spend.spend_date`',
            '加上 `e.event_name = \'purchase\'`',
            '注意：這裡比的是「當天整體有無購買事件」，不是「這個 campaign 帶來的購買」',
          ],
          explanation: `這題的 \`NOT EXISTS\` 子查詢用**日期**做關聯，而不是 key。

\`DATE(e.event_time) = ad_spend.spend_date\` 把 events 的時間戳轉成日期，和 ad_spend 的日期欄位比對。

這個查詢找到的是「廣告有曝光，但當天整個平台完全沒有 purchase 事件」的情況——這可能代表那天的轉換漏斗完全斷掉，值得特別調查。`,
          negatives: [
            `-- 錯誤：沒有用 DATE() 轉換 event_time，直接比對會因格式不同而無法匹配
SELECT spend_date, campaign_id
FROM ad_spend
WHERE impressions > 0
  AND NOT EXISTS (
    SELECT 1 FROM events e
    WHERE e.event_time = ad_spend.spend_date
      AND e.event_name = 'purchase'
  )
ORDER BY spend_date, campaign_id
LIMIT 15;`,
          ],
          mistakes: [],
          ordered: true,
        },
      ],
    },
    {
      id: 'u05-l03',
      title: 'WITH（CTE）基礎',
      minutes: 25,
      objectives: [
        '寫出基本的 WITH ... AS (...) SELECT ... 語法',
        '解釋 CTE 和子查詢在可讀性上的差異',
        '用 CTE 把複雜查詢拆成「先計算、再篩選」的兩個步驟',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u05.l03.e01',
          title: '高總消費會員',
          difficulty: 2,
          scenario: '會員經營部門要找出高價值客戶，定義為 completed 訂單總金額超過 5000 元的會員。',
          prompt: `用一個 **CTE** 先計算每位會員的 completed 訂單總金額 \`total_spent\`，然後在外層找 \`total_spent > 5000\` 的會員，同時 JOIN \`customers\` 取得名稱。

回傳欄位：\`customer_id\`、\`name\`、\`total_spent\`（四捨五入到整數）

排序：\`total_spent DESC\``,
          starter: `WITH customer_spending AS (
  -- 在這裡計算每位會員的 completed 訂單總金額
)
SELECT
  c.customer_id,
  c.name,
  cs.total_spent
FROM customers c
JOIN customer_spending cs ON c.customer_id = cs.customer_id
WHERE cs.total_spent > 5000
ORDER BY cs.total_spent DESC;`,
          answer: `WITH customer_spending AS (
  SELECT
    customer_id,
    ROUND(SUM(total_amount), 0) AS total_spent
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  c.customer_id,
  c.name,
  cs.total_spent
FROM customers c
JOIN customer_spending cs ON c.customer_id = cs.customer_id
WHERE cs.total_spent > 5000
ORDER BY cs.total_spent DESC;`,
          hints: [
            'CTE 內部：`SELECT customer_id, ROUND(SUM(total_amount), 0) AS total_spent FROM orders WHERE status = \'completed\' GROUP BY customer_id`',
            '外層 JOIN customers 取得 name',
            'WHERE 條件放在外層：`cs.total_spent > 5000`',
          ],
          explanation: `CTE \`customer_spending\` 先把每位會員的消費總額算好，外層再 JOIN \`customers\` 補上名稱，並用 WHERE 篩選。

這比把 SUM 放進 HAVING 或用子查詢更清楚：CTE 名稱 \`customer_spending\` 已經說明了它代表什麼，外層查詢讀起來就像自然語言：「從 customers 找出消費 > 5000 的人」。`,
          negatives: [
            `WITH customer_spending AS (SELECT customer_id, ROUND(SUM(total_amount), 0) AS total_spent FROM orders GROUP BY customer_id) SELECT c.customer_id, c.name, cs.total_spent FROM customers c JOIN customer_spending cs ON c.customer_id = cs.customer_id WHERE cs.total_spent > 5000 ORDER BY cs.total_spent DESC;`,
          ],
          mistakes: [],
          ordered: true,
        },
        {
          id: 'sqlf.u05.l03.e02',
          title: '廣告活動 CPA 分析',
          difficulty: 2,
          scenario: '數位廣告團隊要計算每個廣告活動的 CPA（每次轉換成本），評估各活動效益。',
          prompt: `用一個 **CTE** 先從 \`ad_spend\` 計算每個 \`campaign_id\` 的：
- \`total_cost\`：SUM(cost)
- \`total_conversions\`：SUM(conversions)

然後在外層計算：
- \`cpa\`：total_cost / total_conversions，用 \`NULLIF(total_conversions, 0)\` 防止除以零，四捨五入 2 位

只顯示 \`total_conversions > 0\` 的活動。

回傳欄位：\`campaign_id\`、\`total_cost\`（四捨五入2位）、\`total_conversions\`、\`cpa\`

排序：\`cpa ASC\``,
          starter: `WITH campaign_stats AS (
  -- 在這裡彙總每個 campaign 的花費和轉換數
)
SELECT
  campaign_id,
  ROUND(total_cost, 2)                              AS total_cost,
  total_conversions,
  ROUND(total_cost / NULLIF(total_conversions, 0), 2) AS cpa
FROM campaign_stats
WHERE total_conversions > 0
ORDER BY cpa ASC;`,
          answer: `WITH campaign_stats AS (
  SELECT
    campaign_id,
    SUM(cost)        AS total_cost,
    SUM(conversions) AS total_conversions
  FROM ad_spend
  GROUP BY campaign_id
)
SELECT
  campaign_id,
  ROUND(total_cost, 2)                                AS total_cost,
  total_conversions,
  ROUND(total_cost / NULLIF(total_conversions, 0), 2) AS cpa
FROM campaign_stats
WHERE total_conversions > 0
ORDER BY cpa ASC;`,
          hints: [
            'CTE 內：`GROUP BY campaign_id`，算 `SUM(cost)` 和 `SUM(conversions)`',
            '外層：`NULLIF(total_conversions, 0)` 讓分母為 0 時回傳 NULL 而非報錯',
            '`WHERE total_conversions > 0` 放在外層，篩掉沒有轉換的活動',
          ],
          explanation: `\`NULLIF(x, 0)\` 的用途：當 x = 0 時回傳 NULL，任何數除以 NULL 得 NULL（而不是錯誤）。這是 SQL 防除以零的標準寫法。

CPA 越低代表每次轉換的成本越低，廣告效益越好。這個查詢讓廣告團隊快速看出哪個活動的獲客成本最划算。`,
          negatives: [
            `WITH campaign_stats AS (SELECT campaign_id, SUM(cost) AS total_cost, SUM(conversions) AS total_conversions FROM ad_spend GROUP BY campaign_id) SELECT campaign_id, ROUND(total_cost, 2) AS total_cost, total_conversions, ROUND(total_conversions / NULLIF(total_cost, 0), 2) AS cpa FROM campaign_stats WHERE total_conversions > 0 ORDER BY cpa ASC;`,
          ],
          mistakes: [],
          ordered: true,
        },
      ],
    },
    {
      id: 'u05-l04',
      title: '多步驟 CTE 與可讀性',
      minutes: 20,
      objectives: [
        '用逗號串接多個 CTE，後面的 CTE 可引用前面的',
        '為 CTE 取能反映業務意義的名稱',
        '判斷何時應該拆成多個 CTE，何時保持簡單',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u05.l04.e01',
          title: '會員消費分層彙總',
          difficulty: 3,
          scenario: '行銷策略會議需要了解會員的消費分布，將會員分成低/中/高消費三層，分析各層規模和平均消費。',
          prompt: `用**兩個 CTE** 完成：

**CTE 1** \`customer_spending\`：計算每位會員的 completed 訂單總金額 \`total_spent\`

**CTE 2** \`customer_tiers\`：用 CASE 將會員分層：
- \`total_spent < 2000\` → \`'低消費'\`
- \`2000 <= total_spent < 10000\` → \`'中消費'\`
- \`total_spent >= 10000\` → \`'高消費'\`

**外層**：彙總各層的人數 \`customer_count\` 和平均消費 \`avg_spent\`（四捨五入 0 位）

回傳欄位：\`tier\`、\`customer_count\`、\`avg_spent\`

排序：\`tier ASC\`（低消費 / 中消費 / 高消費）`,
          starter: `WITH customer_spending AS (
  -- CTE 1: 每位會員的 completed 訂單總金額
),
customer_tiers AS (
  -- CTE 2: 根據 total_spent 分層
  SELECT
    customer_id,
    total_spent,
    CASE
      WHEN total_spent < 2000  THEN '低消費'
      WHEN total_spent < 10000 THEN '中消費'
      ELSE                          '高消費'
    END AS tier
  FROM customer_spending
)
SELECT
  tier,
  COUNT(*) AS customer_count,
  ROUND(AVG(total_spent), 0) AS avg_spent
FROM customer_tiers
GROUP BY tier
ORDER BY tier ASC;`,
          answer: `WITH customer_spending AS (
  SELECT
    customer_id,
    SUM(total_amount) AS total_spent
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
customer_tiers AS (
  SELECT
    customer_id,
    total_spent,
    CASE
      WHEN total_spent < 2000  THEN '低消費'
      WHEN total_spent < 10000 THEN '中消費'
      ELSE                          '高消費'
    END AS tier
  FROM customer_spending
)
SELECT
  tier,
  COUNT(*) AS customer_count,
  ROUND(AVG(total_spent), 0) AS avg_spent
FROM customer_tiers
GROUP BY tier
ORDER BY tier ASC;`,
          hints: [
            'CTE 1 只需要：`SELECT customer_id, SUM(total_amount) AS total_spent FROM orders WHERE status = \'completed\' GROUP BY customer_id`',
            'CTE 2 從 CTE 1 讀取，加 CASE 分層',
            '注意 CASE 的邊界：`< 2000` 和 `< 10000`，ELSE 涵蓋 >= 10000',
            '排序 `tier ASC` 會按照中文字母順序：低→中→高（剛好正確）',
          ],
          explanation: `兩個 CTE 讓邏輯清晰：先算錢（CTE 1），再分類（CTE 2），最後彙總（外層）。

CASE 的順序很重要：從最小值開始判斷，\`WHEN total_spent < 2000\` 先過濾掉低消費，\`WHEN total_spent < 10000\` 剩下的都是 2000~9999，ELSE 就是 >= 10000。這種寫法比 \`BETWEEN\` 更簡潔，也避免邊界值的混淆。`,
          negatives: [
            `-- 錯誤：CASE 順序寫反，所有人都會落在第一個條件（< 10000 包含了 < 2000）
WITH customer_spending AS (
  SELECT customer_id, SUM(total_amount) AS total_spent
  FROM orders WHERE status = 'completed' GROUP BY customer_id
),
customer_tiers AS (
  SELECT customer_id, total_spent,
    CASE
      WHEN total_spent < 10000 THEN '中消費'
      WHEN total_spent < 2000  THEN '低消費'
      ELSE '高消費'
    END AS tier
  FROM customer_spending
)
SELECT tier, COUNT(*) AS customer_count, ROUND(AVG(total_spent), 0) AS avg_spent
FROM customer_tiers GROUP BY tier ORDER BY tier ASC;`,
          ],
          mistakes: [],
          ordered: true,
        },
        {
          id: 'sqlf.u05.l04.e02',
          title: '廣告活動 ROI 儀表板',
          difficulty: 3,
          scenario: '行銷長要在月度會議上展示各廣告活動的預算執行率和獲客成本，需要一個完整的效益分析表。',
          prompt: `用**兩個 CTE** 完成：

**CTE 1** \`campaign_raw\`：JOIN \`campaigns\` 和 \`ad_spend\`，計算每個活動的：
- \`budget\`（來自 campaigns）
- \`actual_cost\`：SUM(ad_spend.cost)
- \`conversions\`：SUM(ad_spend.conversions)

**CTE 2** \`campaign_metrics\`：從 CTE 1 計算：
- \`cost_efficiency\`：actual_cost / budget * 100，四捨五入 1 位（百分比，預算執行率）
- \`cpa\`：actual_cost / NULLIF(conversions, 0)，四捨五入 0 位

**外層**：回傳所有活動的完整資訊。

回傳欄位：\`campaign_name\`、\`platform\`、\`actual_cost\`（四捨五入0位）、\`conversions\`、\`cost_efficiency\`、\`cpa\`

排序：\`cpa ASC NULLS LAST\``,
          starter: `WITH campaign_raw AS (
  -- CTE 1: JOIN campaigns 和 ad_spend，算預算、花費、轉換數
),
campaign_metrics AS (
  -- CTE 2: 從 CTE 1 計算 cost_efficiency 和 cpa
)
SELECT
  campaign_name,
  platform,
  ROUND(actual_cost, 0)    AS actual_cost,
  conversions,
  cost_efficiency,
  cpa
FROM campaign_metrics
ORDER BY cpa ASC NULLS LAST;`,
          answer: `WITH campaign_raw AS (
  SELECT
    c.campaign_id,
    c.campaign_name,
    c.platform,
    c.budget,
    SUM(a.cost)        AS actual_cost,
    SUM(a.conversions) AS conversions
  FROM campaigns c
  JOIN ad_spend a ON c.campaign_id = a.campaign_id
  GROUP BY c.campaign_id, c.campaign_name, c.platform, c.budget
),
campaign_metrics AS (
  SELECT
    campaign_name,
    platform,
    actual_cost,
    conversions,
    ROUND(actual_cost / NULLIF(budget, 0) * 100, 1)       AS cost_efficiency,
    ROUND(actual_cost / NULLIF(conversions, 0), 0)         AS cpa
  FROM campaign_raw
)
SELECT
  campaign_name,
  platform,
  ROUND(actual_cost, 0) AS actual_cost,
  conversions,
  cost_efficiency,
  cpa
FROM campaign_metrics
ORDER BY cpa ASC NULLS LAST;`,
          hints: [
            'CTE 1 的 GROUP BY 要包含所有非聚合欄位：`campaign_id, campaign_name, platform, budget`',
            'CTE 2 從 CTE 1 讀取，計算的公式：`actual_cost / NULLIF(budget, 0) * 100` 是執行率',
            '`NULLIF(conversions, 0)` 讓 conversions = 0 時 cpa 回傳 NULL',
            '`ORDER BY cpa ASC NULLS LAST` 讓 NULL（沒有轉換的活動）排在最後',
          ],
          explanation: `兩個 CTE 的分工：CTE 1 負責「資料準備」（JOIN + 彙總），CTE 2 負責「指標計算」（公式）。這樣的分層讓每個 CTE 只做一件事。

\`NULLS LAST\` 很重要：如果有活動沒有任何轉換，cpa 為 NULL，用 \`ASC NULLS LAST\` 讓這些活動排在最後，而不是最前面（SQLite 預設 NULL 排在最前）。`,
          negatives: [
            `-- 錯誤：cost_efficiency 計算少乘 100，結果是小數而非百分比
WITH campaign_raw AS (
  SELECT c.campaign_id, c.campaign_name, c.platform, c.budget,
    SUM(a.cost) AS actual_cost, SUM(a.conversions) AS conversions
  FROM campaigns c JOIN ad_spend a ON c.campaign_id = a.campaign_id
  GROUP BY c.campaign_id, c.campaign_name, c.platform, c.budget
),
campaign_metrics AS (
  SELECT campaign_name, platform, actual_cost, conversions,
    ROUND(actual_cost / NULLIF(budget, 0), 1) AS cost_efficiency,
    ROUND(actual_cost / NULLIF(conversions, 0), 0) AS cpa
  FROM campaign_raw
)
SELECT campaign_name, platform, ROUND(actual_cost, 0) AS actual_cost,
  conversions, cost_efficiency, cpa
FROM campaign_metrics ORDER BY cpa ASC NULLS LAST;`,
          ],
          mistakes: [],
          ordered: true,
        },
      ],
    },
  ],
};
