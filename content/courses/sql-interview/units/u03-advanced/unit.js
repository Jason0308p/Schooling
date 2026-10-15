const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'int-u03',
  title: '高難題組（Lead / 筆試）',
  lessons: [
    {
      id: 'int-u03-l01',
      title: '高難面試題：連續日期、多期間對比、分類排名、跨表歸因',
      minutes: 60,
      objectives: [
        '用 ROW_NUMBER 減日期法找出連續 N 天的日期區間',
        '用單一 SQL 做 30 / 60 / 90 天多期間營收對比',
        '用 PARTITION BY + ROW_NUMBER 取每分類每日前 N 名',
        '跨 sessions 和 orders 計算曝光到首次購買的平均天數',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'int.u03.l01.e01',
          title: '找出連續 3 天以上有 completed 訂單的日期區間',
          difficulty: 3,
          scenario: '面試官說：「請找出哪些日期區間內，每天都有 completed 訂單，且連續天數達 3 天以上。回傳每個連續區間的起始日、結束日和連續天數。」',
          prompt: `找出所有「連續 3 天以上每天都有 \`completed\` 訂單」的**日期區間**。

**定義：**
- 只計算 \`status = 'completed'\` 的訂單
- 「有訂單的日期」：該日有至少一筆 completed 訂單
- 「連續」：相鄰兩天的日期差剛好為 1 天
- 只回傳連續天數 **>= 3** 的區間

**回傳欄位：** \`start_date\`（區間第一天）, \`end_date\`（區間最後一天）, \`consecutive_days\`（連續天數）

**排序：** \`start_date ASC\``,
          starter: '',
          answer: `WITH order_dates AS (
  SELECT DISTINCT order_date
  FROM   orders
  WHERE  status = 'completed'
),
numbered AS (
  SELECT
    order_date,
    date(order_date, '-' || (ROW_NUMBER() OVER (ORDER BY order_date) - 1) || ' days') AS grp
  FROM order_dates
),
groups AS (
  SELECT
    grp,
    MIN(order_date) AS start_date,
    MAX(order_date) AS end_date,
    COUNT(*)        AS consecutive_days
  FROM numbered
  GROUP BY grp
)
SELECT start_date, end_date, consecutive_days
FROM   groups
WHERE  consecutive_days >= 3
ORDER BY start_date ASC;`,
          hints: [],
          explanation: `**ROW_NUMBER 減日期法的核心邏輯：**

如果日期是連續的，每天的 \`order_date - ROW_NUMBER\` 都會得到**相同的值**（grp）。一旦中間有一天缺口，ROW_NUMBER 繼續遞增但日期跳過一天，grp 就變不同了。

**例子：**
\`\`\`
order_date  | rn | order_date - (rn-1) days = grp
2026-01-01  | 1  | 2026-01-01 - 0 = 2026-01-01
2026-01-02  | 2  | 2026-01-02 - 1 = 2026-01-01  ← 同 grp
2026-01-03  | 3  | 2026-01-03 - 2 = 2026-01-01  ← 同 grp
2026-01-05  | 4  | 2026-01-05 - 3 = 2026-01-02  ← 新 grp
\`\`\`

**常見扣分點：**
- 沒有先 \`DISTINCT order_date\`，同天有多筆訂單導致 ROW_NUMBER 跳號
- 用 \`LEAD/LAG\` 找「相差 1 天」，只能找連續 2 天，無法找 N 天的區間
- SQLite 的 \`date(order_date, '-N days')\` 語法中 N 必須用字串拼接，不能直接用變數

**追問方向：**
- 「如果改成連續 5 天，你的 SQL 要改哪裡？」（只改 WHERE consecutive_days >= 5）
- 「如果同一天有多種 status 的訂單，你的邏輯還成立嗎？」`,
          negatives: [
            `WITH order_dates AS (SELECT order_date FROM orders WHERE status = 'completed'), numbered AS (SELECT order_date, date(order_date, '-' || (ROW_NUMBER() OVER (ORDER BY order_date) - 1) || ' days') AS grp FROM order_dates), groups AS (SELECT grp, MIN(order_date) AS start_date, MAX(order_date) AS end_date, COUNT(*) AS consecutive_days FROM numbered GROUP BY grp) SELECT start_date, end_date, consecutive_days FROM groups WHERE consecutive_days >= 3 ORDER BY start_date ASC;`,
            `WITH order_dates AS (SELECT DISTINCT order_date FROM orders WHERE status = 'completed'), lagged AS (SELECT order_date, LAG(order_date) OVER (ORDER BY order_date) AS prev_date FROM order_dates), gaps AS (SELECT order_date, CASE WHEN julianday(order_date) - julianday(prev_date) = 1 THEN 0 ELSE 1 END AS is_new_group FROM lagged), grp_assign AS (SELECT order_date, SUM(is_new_group) OVER (ORDER BY order_date) AS grp FROM gaps), counted AS (SELECT grp, MIN(order_date) AS start_date, MAX(order_date) AS end_date, COUNT(*) AS consecutive_days FROM grp_assign GROUP BY grp) SELECT start_date, end_date, consecutive_days FROM counted WHERE consecutive_days >= 2 ORDER BY start_date;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u03.l01.e02',
          title: '單一 SQL：最近 30 / 60 / 90 天營收對比',
          difficulty: 3,
          scenario: '面試官說：「請用一個 SQL，算出截至 2026-06-30 最近 30 天、60 天、90 天的 completed 訂單營收，放在同一列回傳，方便直接看趨勢。」',
          prompt: `用**單一 SQL**（不用多個查詢），計算截至 **2026-06-30** 的多期間營收對比。

**定義：**
- 只計算 \`status = 'completed'\` 的訂單
- **最近 30 天**：order_date >= date('2026-06-30', '-29 days')
- **最近 60 天**：order_date >= date('2026-06-30', '-59 days')
- **最近 90 天**：order_date >= date('2026-06-30', '-89 days')
- 所有期間的截止日都是 2026-06-30（含）

**回傳欄位：** \`rev_30d\`（ROUND 整數）, \`rev_60d\`（ROUND 整數）, \`rev_90d\`（ROUND 整數）`,
          starter: '',
          answer: `SELECT
  ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-29 days') THEN total_amount ELSE 0 END)) AS rev_30d,
  ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-59 days') THEN total_amount ELSE 0 END)) AS rev_60d,
  ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-89 days') THEN total_amount ELSE 0 END)) AS rev_90d
FROM orders
WHERE status     = 'completed'
  AND order_date >= date('2026-06-30', '-89 days')
  AND order_date <= '2026-06-30';`,
          hints: [],
          explanation: `**CASE WHEN pivot 技巧：**
只掃描一次資料表（WHERE 先限縮到 90 天範圍），再用三個 \`CASE WHEN\` 分別把各期間的金額加進不同的欄位。

**常見扣分點：**
- 用三個子查詢各自算，雖然正確但不是「單一 SQL」的解法
- 「最近 30 天」用 \`'-30 days'\` 得到 31 天的資料（date('2026-06-30', '-30 days') = 2026-05-31，不含 05-31 到 06-30 共 31 天）
- 忘記 AND order_date <= '2026-06-30'（如果基準日不是資料最後一天，會算到未來）
- CASE WHEN 的 ELSE 漏掉或寫成 NULL（NULL 加進 SUM 不影響結果，但寫 0 更清楚）

**追問方向：**
- 「如果要加第四個期間（最近 120 天），你怎麼改？」（加一行 CASE WHEN + 調整 WHERE）
- 「rev_90d 一定 >= rev_60d >= rev_30d 嗎？為什麼？」（因為都是從同一截止日往前算，90天包含60天包含30天的範圍）`,
          negatives: [
            `SELECT ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-30 days') THEN total_amount ELSE 0 END)) AS rev_30d, ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-60 days') THEN total_amount ELSE 0 END)) AS rev_60d, ROUND(SUM(CASE WHEN order_date >= date('2026-06-30', '-90 days') THEN total_amount ELSE 0 END)) AS rev_90d FROM orders WHERE status = 'completed' AND order_date >= date('2026-06-30', '-90 days') AND order_date <= '2026-06-30';`,
            `SELECT (SELECT ROUND(SUM(total_amount)) FROM orders WHERE status = 'completed' AND order_date >= date('2026-06-30', '-30 days') AND order_date <= '2026-06-30') AS rev_30d, (SELECT ROUND(SUM(total_amount)) FROM orders WHERE status = 'completed' AND order_date >= date('2026-06-30', '-60 days') AND order_date <= '2026-06-30') AS rev_60d, (SELECT ROUND(SUM(total_amount)) FROM orders WHERE status = 'completed' AND order_date >= date('2026-06-30', '-90 days') AND order_date <= '2026-06-30') AS rev_90d;`,
          ],
        },
        {
          id: 'int.u03.l01.e03',
          title: '每天各分類銷售第一名商品',
          difficulty: 3,
          scenario: '面試官說：「請找出 2026 年 6 月每一天，每個商品分類裡銷售數量最多的那一件商品。如果有同名次，只取其中一筆。」',
          prompt: `找出 **2026 年 6 月**每一天，每個分類中**銷售數量最多的商品**（取第一名）。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`daily_qty\`：該商品該天在該分類的 \`quantity\` 加總
- 同名次只取一筆（用 \`ROW_NUMBER\`，不用 \`RANK\`）
- 只回傳每天每分類的第一名

**回傳欄位：** \`order_date\`, \`category\`, \`product_name\`, \`daily_qty\`

**排序：** \`order_date ASC\`, \`category ASC\``,
          starter: '',
          answer: `WITH daily_sales AS (
  SELECT
    o.order_date,
    p.category,
    p.product_id,
    p.product_name,
    SUM(oi.quantity) AS daily_qty
  FROM order_items oi
  JOIN products p ON p.product_id  = oi.product_id
  JOIN orders   o ON o.order_id    = oi.order_id
  WHERE o.status     = 'completed'
    AND o.order_date >= '2026-06-01'
    AND o.order_date <  '2026-07-01'
  GROUP BY o.order_date, p.category, p.product_id, p.product_name
),
ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY order_date, category
      ORDER BY daily_qty DESC
    ) AS rn
  FROM daily_sales
)
SELECT order_date, category, product_name, daily_qty
FROM   ranked
WHERE  rn = 1
ORDER BY order_date ASC, category ASC;`,
          hints: [],
          explanation: `**三步拆解：**
1. \`daily_sales\`：先彙總到「日期 × 分類 × 商品」層級，算出 daily_qty
2. \`ranked\`：用 ROW_NUMBER PARTITION BY (order_date, category) ORDER BY daily_qty DESC，每個日期×分類都有一個排名
3. 外層 WHERE rn = 1 取第一名

**ROW_NUMBER vs RANK vs DENSE_RANK：**
- \`ROW_NUMBER\`：同分也給不同名次（取到的恰好一筆）
- \`RANK\`：同分給相同名次，後面跳號（可能取到多筆）
- \`DENSE_RANK\`：同分給相同名次，後面不跳號

題目說「只取一筆」→ 用 ROW_NUMBER。

**常見扣分點：**
- 直接在 WHERE 用視窗函數（語法錯誤）
- GROUP BY 漏掉 product_id，導致同名商品被合併
- 用 RANK 但沒有說清楚「同分取哪一筆」的邏輯

**追問方向：**
- 「如果要取每天每分類前 3 名，你只需要改哪一行？」（WHERE rn <= 3）`,
          negatives: [
            `WITH daily_sales AS (SELECT o.order_date, p.category, p.product_id, p.product_name, SUM(oi.quantity) AS daily_qty FROM order_items oi JOIN products p ON p.product_id = oi.product_id JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'completed' AND o.order_date >= '2026-06-01' AND o.order_date < '2026-07-01' GROUP BY o.order_date, p.category, p.product_id, p.product_name), ranked AS (SELECT *, RANK() OVER (PARTITION BY order_date, category ORDER BY daily_qty DESC) AS rn FROM daily_sales) SELECT order_date, category, product_name, daily_qty FROM ranked WHERE rn = 1 ORDER BY order_date ASC, category ASC;`,
            `WITH daily_sales AS (SELECT o.order_date, p.category, p.product_name, SUM(oi.quantity) AS daily_qty FROM order_items oi JOIN products p ON p.product_id = oi.product_id JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'completed' AND o.order_date >= '2026-06-01' AND o.order_date < '2026-07-01' GROUP BY o.order_date, p.category, p.product_name) SELECT order_date, category, product_name, MAX(daily_qty) AS daily_qty FROM daily_sales GROUP BY order_date, category ORDER BY order_date ASC, category ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u03.l01.e04',
          title: '從曝光到首次購買的平均天數',
          difficulty: 3,
          scenario: '面試官說：「請計算顧客從第一次有記錄的 session，到他第一筆 completed 訂單，平均需要幾天。只計算最終有下單的顧客。」',
          prompt: `計算**有記錄 session 的顧客**，從**第一次 session** 到**第一筆 \`completed\` 訂單**的平均天數。

**要求：**
- 只計算「最終有 completed 訂單」且「有 session 記錄」的顧客
- \`first_session_date\`：該顧客最早的 session 開始日期（DATE(MIN(session_start))）
- \`first_order_date\`：該顧客最早的 completed 訂單日期
- \`days_to_purchase\`：julianday(first_order_date) - julianday(first_session_date)，取整數
- 只計算 \`days_to_purchase >= 0\` 的顧客（排除資料異常）
- \`avg_days\`：days_to_purchase 的平均，ROUND 1 位小數

**回傳欄位：** \`avg_days\`, \`customer_count\`（計算人數）`,
          starter: '',
          answer: `WITH first_sessions AS (
  SELECT
    customer_id,
    DATE(MIN(session_start)) AS first_session_date
  FROM   sessions
  WHERE  customer_id IS NOT NULL
  GROUP  BY customer_id
),
first_orders AS (
  SELECT
    customer_id,
    MIN(order_date) AS first_order_date
  FROM   orders
  WHERE  status = 'completed'
  GROUP  BY customer_id
),
journey AS (
  SELECT
    fs.customer_id,
    fs.first_session_date,
    fo.first_order_date,
    CAST(julianday(fo.first_order_date) - julianday(fs.first_session_date) AS INT) AS days_to_purchase
  FROM   first_sessions fs
  JOIN   first_orders   fo ON fo.customer_id = fs.customer_id
  WHERE  CAST(julianday(fo.first_order_date) - julianday(fs.first_session_date) AS INT) >= 0
)
SELECT
  ROUND(AVG(days_to_purchase), 1) AS avg_days,
  COUNT(*)                         AS customer_count
FROM journey;`,
          hints: [],
          explanation: `**四步拆解：**
1. \`first_sessions\`：每位顧客（非匿名）的最早 session 日期
2. \`first_orders\`：每位顧客的最早 completed 訂單日期
3. \`journey\`：JOIN 兩者，計算天數差，過濾異常（天數 < 0）
4. 最後算平均

**為什麼要過濾 days_to_purchase < 0？**
資料中可能有「下單日期早於有記錄 session 日期」的情況，通常是資料異常（session 未被記錄，或訂單資料有誤）。面試時要說清楚這個假設。

**常見扣分點：**
- 忘記 \`WHERE customer_id IS NOT NULL\`，把匿名 session 也算進去，customer_id 為 NULL 的會 JOIN 失敗但不報錯
- 用 INNER JOIN 但沒有說清楚「為什麼不用 LEFT JOIN」（→ 只要有 session 且有下單的人）
- 天數計算用字串比較（order_date > session_date 只是字串排序，雖然 YYYY-MM-DD 格式是對的，但 julianday 更精確）

**追問方向：**
- 「如果想分 acquisition_channel 看，各管道的平均天數有什麼差異，你怎麼延伸？」
- 「session 有可能有多次，你取的是第一次，這個假設合理嗎？」`,
          negatives: [
            `WITH first_sessions AS (SELECT customer_id, DATE(MIN(session_start)) AS first_session_date FROM sessions WHERE customer_id IS NOT NULL GROUP BY customer_id), first_orders AS (SELECT customer_id, MIN(order_date) AS first_order_date FROM orders GROUP BY customer_id), journey AS (SELECT fs.customer_id, fs.first_session_date, fo.first_order_date, CAST(julianday(fo.first_order_date) - julianday(fs.first_session_date) AS INT) AS days_to_purchase FROM first_sessions fs JOIN first_orders fo ON fo.customer_id = fs.customer_id WHERE CAST(julianday(fo.first_order_date) - julianday(fs.first_session_date) AS INT) >= 0) SELECT ROUND(AVG(days_to_purchase), 1) AS avg_days, COUNT(*) AS customer_count FROM journey;`,
            `WITH first_sessions AS (SELECT customer_id, DATE(MIN(session_start)) AS first_session_date FROM sessions WHERE customer_id IS NOT NULL GROUP BY customer_id), first_orders AS (SELECT customer_id, MIN(order_date) AS first_order_date FROM orders WHERE status = 'completed' GROUP BY customer_id), journey AS (SELECT fs.customer_id, fs.first_session_date, fo.first_order_date, CAST(julianday(fo.first_order_date) - julianday(fs.first_session_date) AS INT) AS days_to_purchase FROM first_sessions fs JOIN first_orders fo ON fo.customer_id = fs.customer_id) SELECT ROUND(AVG(days_to_purchase), 1) AS avg_days, COUNT(*) AS customer_count FROM journey;`,
          ],
        },
      ],
    },
  ],
};
