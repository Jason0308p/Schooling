const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u06',
  lessons: [
    {
      id: 'u06-l01',
      title: 'ROW_NUMBER、RANK、DENSE_RANK：排名函數',
      minutes: 25,
      objectives: [
        '說明 ROW_NUMBER、RANK、DENSE_RANK 在並列時的不同行為',
        '寫出 OVER (ORDER BY col DESC) 的基本視窗函數語法',
        '用 CTE + 視窗函數過濾 Top N 列',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u06.l01.e01',
          title: '商品依售價 ROW_NUMBER 排名',
          difficulty: 2,
          prompt:
            '用 `ROW_NUMBER() OVER (ORDER BY price DESC)` 給所有商品按售價從高到低編號。回傳欄位：`rn`、`product_name`、`category`、`price`，依 `rn` ASC 排序。',
          answer: `SELECT
  ROW_NUMBER() OVER (ORDER BY price DESC) AS rn,
  product_name,
  category,
  price
FROM products
ORDER BY rn;`,
          hints: ['視窗函數寫在 SELECT 的欄位清單中，不需要 GROUP BY。'],
          explanation:
            '`ROW_NUMBER() OVER (ORDER BY price DESC)` 給每一列一個唯一序號，價格最高的商品排第 1。與 `RANK` 不同，`ROW_NUMBER` 遇到相同價格時仍然給不同序號，結果是確定性的（但相同價格的排列順序不確定，可加 `product_id` 作決勝欄位）。',
          negatives: [`SELECT
  ROW_NUMBER() OVER (ORDER BY price ASC) AS rn,
  product_name, category, price
FROM products
ORDER BY rn;`, `SELECT
  RANK() OVER (ORDER BY price DESC) AS rn,
  product_name, category, price
FROM products
ORDER BY rn;`],
        },
        {
          id: 'sqlf.u06.l01.e02',
          title: 'completed 訂單前 20 名（RANK）',
          difficulty: 2,
          prompt:
            '對 `completed` 訂單計算 `total_amount` 的 `RANK()`，只取排名前 20 名（`rnk <= 20`）。回傳欄位：`rnk`、`order_id`、`customer_id`、`order_date`、`total_amount`，依 `rnk` ASC 排序。請用 CTE 或子查詢包住視窗函數。',
          answer: `WITH ranked AS (
  SELECT
    RANK() OVER (ORDER BY total_amount DESC) AS rnk,
    order_id,
    customer_id,
    order_date,
    total_amount
  FROM orders
  WHERE status = 'completed'
)
SELECT *
FROM ranked
WHERE rnk <= 20
ORDER BY rnk;`,
          hints: ['視窗函數的結果不能直接用在同層的 WHERE，需要先用 CTE 或子查詢包一層。'],
          explanation:
            '視窗函數不能直接在同層 `WHERE` 中使用（執行順序：FROM→WHERE→GROUP BY→SELECT），必須先用 CTE 或子查詢把視窗函數結果「物化」，外層再用 `WHERE rnk <= 20` 篩選。`RANK` 的特性：並列時跳號（如 1, 2, 2, 4），所以前 20 名可能多於 20 列。',
          negatives: [`SELECT
  RANK() OVER (ORDER BY total_amount DESC) AS rnk,
  order_id, customer_id, order_date, total_amount
FROM orders
WHERE status = 'completed' AND rnk <= 20
ORDER BY rnk;`, `WITH ranked AS (
  SELECT
    RANK() OVER (ORDER BY total_amount DESC) AS rnk,
    order_id, customer_id, order_date, total_amount
  FROM orders
)
SELECT * FROM ranked WHERE rnk <= 20 ORDER BY rnk;`],
        },
        {
          id: 'sqlf.u06.l01.e03',
          title: '各月 completed 訂單最高金額',
          difficulty: 3,
          prompt:
            '找出各月（`strftime(\'%Y-%m\', order_date)`）`completed` 訂單中 `total_amount` 排第一的訂單（用 `ROW_NUMBER` 後取 `rn = 1`）。回傳欄位：`month`、`order_id`、`customer_id`、`total_amount`，依 `month` ASC 排序。',
          answer: `WITH monthly_ranked AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    order_id,
    customer_id,
    total_amount,
    ROW_NUMBER() OVER (
      PARTITION BY strftime('%Y-%m', order_date)
      ORDER BY total_amount DESC, order_id
    ) AS rn
  FROM orders
  WHERE status = 'completed'
)
SELECT month, order_id, customer_id, total_amount
FROM monthly_ranked
WHERE rn = 1
ORDER BY month;`,
          hints: ['需要在 OVER 中用 PARTITION BY 月份，才能讓每個月的排名從 1 開始。'],
          explanation:
            '`ROW_NUMBER() OVER (PARTITION BY month ORDER BY total_amount DESC, order_id)` 讓排名在每個月內獨立從 1 開始。`ORDER BY total_amount DESC, order_id` 加上 `order_id` 作決勝，確保同月內 total_amount 相同時排名確定。最後 `WHERE rn = 1` 只取每月第一名。',
          negatives: [`WITH monthly_ranked AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    order_id, customer_id, total_amount,
    ROW_NUMBER() OVER (ORDER BY total_amount DESC) AS rn
  FROM orders
  WHERE status = 'completed'
)
SELECT month, order_id, customer_id, total_amount
FROM monthly_ranked WHERE rn = 1 ORDER BY month;`],
        },
      ],
    },
    {
      id: 'u06-l02',
      title: 'PARTITION BY：分組排名',
      minutes: 25,
      objectives: [
        '說明 PARTITION BY 與 GROUP BY 的本質差異',
        '用 PARTITION BY 實作分組內排名',
        '取各分組的第一筆記錄（rn = 1 模式）',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u06.l02.e01',
          title: '各分類商品 DENSE_RANK 分組排名',
          difficulty: 2,
          prompt:
            '用 `DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC)` 給各分類商品排名（只含 `is_active = 1` 的商品）。回傳欄位：`category_rank`、`product_name`、`category`、`price`，依 `category` ASC、`category_rank` ASC 排序。',
          answer: `SELECT
  DENSE_RANK() OVER (
    PARTITION BY category
    ORDER BY price DESC
  ) AS category_rank,
  product_name,
  category,
  price
FROM products
WHERE is_active = 1
ORDER BY category, category_rank;`,
          hints: ['PARTITION BY 讓排名在每個 category 內重新從 1 開始。'],
          explanation:
            '`PARTITION BY category` 讓 DENSE_RANK 在每個分類內獨立計算——保溫杯最貴的排第 1，馬克杯最貴的也排第 1，互不影響。`DENSE_RANK` 在並列時不跳號（1, 2, 2, 3），讓同價位商品有相同名次。',
          negatives: [`SELECT
  DENSE_RANK() OVER (ORDER BY price DESC) AS category_rank,
  product_name, category, price
FROM products
WHERE is_active = 1
ORDER BY category, category_rank;`],
        },
        {
          id: 'sqlf.u06.l02.e02',
          title: '每位會員第一張 completed 訂單',
          difficulty: 3,
          prompt:
            '找出每位有 `completed` 訂單的會員的「第一張訂單」（依 `order_date` ASC 排序，同日期再依 `order_id` ASC 決定順序，取 `rn = 1`）。回傳欄位：`customer_id`、`order_id`、`order_date`、`total_amount`，依 `customer_id` ASC 排序。',
          answer: `WITH first_orders AS (
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
)
SELECT customer_id, order_id, order_date, total_amount
FROM first_orders
WHERE rn = 1
ORDER BY customer_id;`,
          hints: ['用 PARTITION BY customer_id，讓每位客戶的排名獨立計算；取 rn = 1 就是第一張。'],
          explanation:
            '`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id)` 讓每位客戶的訂單獨立排序，`order_id` 作決勝欄位保證結果確定。`WHERE rn = 1` 取每位客戶排第 1 的訂單，就是第一張訂單。不能用 `GROUP BY + MIN(order_date)` 因為無法同時取 order_id 和 total_amount。',
          negatives: [`SELECT customer_id, MIN(order_date) AS order_date
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
ORDER BY customer_id;`, `WITH first_orders AS (
  SELECT
    customer_id, order_id, order_date, total_amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, order_id
    ) AS rn
  FROM orders
  WHERE status = 'completed'
)
SELECT customer_id, order_id, order_date, total_amount
FROM first_orders WHERE rn = 1 ORDER BY customer_id;`],
        },
        {
          id: 'sqlf.u06.l02.e03',
          title: '訂單佔通路當月營收比例',
          difficulty: 3,
          prompt:
            '計算每筆 `completed` 訂單的 `total_amount` 佔同一 `sales_channel` 當月（`strftime(\'%Y-%m\', order_date)`）總營收的百分比。回傳欄位：`order_id`、`order_date`、`sales_channel`、`total_amount`、`channel_monthly_revenue`（當月通路總營收）、`pct`（百分比，四捨五入1位），只取前 30 筆（依 `order_date` ASC、`sales_channel` ASC）。',
          answer: `WITH base AS (
  SELECT
    order_id,
    order_date,
    sales_channel,
    total_amount,
    strftime('%Y-%m', order_date) AS month,
    SUM(total_amount) OVER (
      PARTITION BY sales_channel, strftime('%Y-%m', order_date)
    ) AS channel_monthly_revenue
  FROM orders
  WHERE status = 'completed'
)
SELECT
  order_id,
  order_date,
  sales_channel,
  total_amount,
  ROUND(channel_monthly_revenue, 0) AS channel_monthly_revenue,
  ROUND(total_amount / channel_monthly_revenue * 100.0, 1) AS pct
FROM base
ORDER BY order_date, sales_channel
LIMIT 30;`,
          hints: ['SUM OVER (PARTITION BY sales_channel, month) 不加 ORDER BY，就是整個分區的加總（非累計）。'],
          explanation:
            '`SUM(total_amount) OVER (PARTITION BY sales_channel, month)` 不加 ORDER BY，計算的是整個分區（同通路同月）的總和（非累計）。這樣每張訂單都能看到自己佔當月通路總量的百分比，而不需要先 GROUP BY 再 JOIN 回來。',
          negatives: [`WITH base AS (
  SELECT
    order_id, order_date, sales_channel, total_amount,
    SUM(total_amount) OVER (
      PARTITION BY sales_channel
    ) AS channel_monthly_revenue
  FROM orders
  WHERE status = 'completed'
)
SELECT order_id, order_date, sales_channel, total_amount,
  ROUND(channel_monthly_revenue, 0) AS channel_monthly_revenue,
  ROUND(total_amount / channel_monthly_revenue * 100.0, 1) AS pct
FROM base ORDER BY order_date, sales_channel LIMIT 30;`],
        },
      ],
    },
    {
      id: 'u06-l03',
      title: 'LAG 和 LEAD：前後期比較',
      minutes: 25,
      objectives: [
        '用 LAG/LEAD 取前後列的值，不使用 self-join',
        '以 CTE + LAG 計算月環比增長率',
        '用 PARTITION BY + LAG 計算每位客戶的購買間隔',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u06.l03.e01',
          title: '月營收與上月營收（LAG）',
          difficulty: 2,
          prompt:
            '用 CTE 彙總每月（`strftime(\'%Y-%m\', order_date)`）`completed` 訂單的營收，再用 `LAG` 取上月營收。回傳欄位：`month`、`revenue`（四捨五入到整數）、`prev_revenue`（四捨五入到整數，第一個月顯示 NULL），依 `month` ASC 排序。',
          answer: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0)   AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
)
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_revenue
FROM monthly
ORDER BY month;`,
          hints: ['LAG 的預設偏移量是 1，不指定時自動取前一列。第一列沒有前列，回傳 NULL。'],
          explanation:
            '先用 CTE 按月 GROUP BY 得到月營收，再對月營收套 `LAG(revenue) OVER (ORDER BY month)`。`LAG` 取前一列的值，第一個月沒有前列，回傳 NULL。這個「先彙總再算視窗函數」的模式是實務中最常見的用法。',
          negatives: [`WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0) AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
)
SELECT
  month,
  revenue,
  LEAD(revenue) OVER (ORDER BY month) AS prev_revenue
FROM monthly
ORDER BY month;`, `WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0) AS revenue
  FROM orders
  GROUP BY month
)
SELECT
  month, revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_revenue
FROM monthly ORDER BY month;`],
        },
        {
          id: 'sqlf.u06.l03.e02',
          title: '月環比增長率（mom_growth）',
          difficulty: 3,
          prompt:
            '在月營收 CTE 基礎上，計算月環比增長率 `mom_growth`（百分比，四捨五入1位）。上月為 NULL 或 0 時，`mom_growth` 顯示 NULL（用 `NULLIF` 防除以零）。回傳欄位：`month`、`revenue`、`prev_revenue`、`mom_growth`，依 `month` ASC 排序。',
          answer: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0)   AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
),
with_lag AS (
  SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue
  FROM monthly
)
SELECT
  month,
  revenue,
  prev_revenue,
  ROUND(
    (revenue - prev_revenue) / NULLIF(prev_revenue, 0) * 100.0,
    1
  ) AS mom_growth
FROM with_lag
ORDER BY month;`,
          hints: ['NULLIF(prev_revenue, 0) 讓除以零變成 NULL 而非錯誤；ROUND 對 NULL 也回傳 NULL，不需要額外處理。'],
          explanation:
            '月環比 = (本月 - 上月) / 上月 × 100。分母用 `NULLIF(prev_revenue, 0)` 防止除以零——第一個月的 `prev_revenue` 是 NULL，NULL 除法得 NULL，不需要額外處理。兩個 CTE 讓邏輯分層清晰：先算月總，再算環比。',
          negatives: [`WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0) AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
),
with_lag AS (
  SELECT month, revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue
  FROM monthly
)
SELECT month, revenue, prev_revenue,
  ROUND((prev_revenue - revenue) / NULLIF(prev_revenue, 0) * 100.0, 1) AS mom_growth
FROM with_lag ORDER BY month;`],
        },
        {
          id: 'sqlf.u06.l03.e03',
          title: '每位會員平均購買間隔天數',
          difficulty: 3,
          prompt:
            '計算每位有至少 2 筆 `completed` 訂單的會員的「平均購買間隔天數」`avg_days`（用 `julianday` 計算相鄰訂單間隔，`ROUND` 到 0 位）。回傳欄位：`customer_id`、`order_count`、`avg_days`，只顯示 `order_count >= 2` 的會員，依 `avg_days` ASC 排序，取前 20 筆。',
          answer: `WITH customer_orders AS (
  SELECT
    customer_id,
    order_date,
    LAG(order_date) OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
    ) AS prev_order_date
  FROM orders
  WHERE status = 'completed'
),
intervals AS (
  SELECT
    customer_id,
    julianday(order_date) - julianday(prev_order_date) AS gap_days
  FROM customer_orders
  WHERE prev_order_date IS NOT NULL
)
SELECT
  customer_id,
  COUNT(*) + 1          AS order_count,
  ROUND(AVG(gap_days), 0) AS avg_days
FROM intervals
GROUP BY customer_id
ORDER BY avg_days ASC
LIMIT 20;`,
          hints: ['LAG 後 prev_order_date 為 NULL 的列是各客戶第一筆訂單，代表沒有間隔，排除它再算 AVG。intervals 每列代表一個間隔，間隔數 = 訂單數 - 1，所以 order_count = COUNT(*) + 1。'],
          explanation:
            '`LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id)` 取前一張訂單的日期。第一張訂單的 `prev_order_date` 為 NULL，代表沒有間隔，用 `WHERE prev_order_date IS NOT NULL` 排除。每個間隔算一列，`COUNT(*) + 1` 還原訂單數（間隔數 = 訂單數 - 1）。',
          negatives: [`WITH customer_orders AS (
  SELECT
    customer_id, order_date,
    LAG(order_date) OVER (ORDER BY order_date) AS prev_date
  FROM orders WHERE status = 'completed'
)
SELECT
  customer_id,
  COUNT(*) AS order_count,
  ROUND(AVG(julianday(order_date) - julianday(prev_date)), 0) AS avg_days
FROM customer_orders
WHERE prev_date IS NOT NULL
GROUP BY customer_id
HAVING order_count >= 2
ORDER BY avg_days LIMIT 20;`],
        },
      ],
    },
    {
      id: 'u06-l04',
      title: '累計與移動平均',
      minutes: 20,
      objectives: [
        '用 SUM OVER (ORDER BY ...) 計算累計加總',
        '用 ROWS BETWEEN 實作 N 期移動平均',
        '說明 ROWS BETWEEN 與 RANGE BETWEEN 的差異',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u06.l04.e01',
          title: '月營收與累計營收',
          difficulty: 2,
          prompt:
            '計算每個月（`strftime(\'%Y-%m\', order_date)`）`completed` 訂單的月營收和累計營收（`SUM OVER ORDER BY month`）。回傳欄位：`month`、`monthly_revenue`（四捨五入到整數）、`cumulative_revenue`（四捨五入到整數），依 `month` ASC 排序。',
          answer: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0)   AS monthly_revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
)
SELECT
  month,
  monthly_revenue,
  ROUND(SUM(monthly_revenue) OVER (ORDER BY month), 0) AS cumulative_revenue
FROM monthly
ORDER BY month;`,
          hints: ['SUM OVER (ORDER BY month) 不加 PARTITION BY，就是全域從第一月累加到當前月。'],
          explanation:
            '`SUM(monthly_revenue) OVER (ORDER BY month)` 預設 frame 是 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`，就是從第一列一路累加到當前列。不加 `PARTITION BY` 是全域累計；加了 `PARTITION BY` 就是分組內累計。',
          negatives: [`WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date) AS month,
    ROUND(SUM(total_amount), 0) AS monthly_revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
)
SELECT
  month,
  monthly_revenue,
  ROUND(SUM(monthly_revenue) OVER (), 0) AS cumulative_revenue
FROM monthly ORDER BY month;`, `SELECT
  strftime('%Y-%m', order_date) AS month,
  ROUND(SUM(total_amount), 0) AS monthly_revenue,
  ROUND(SUM(total_amount), 0) AS cumulative_revenue
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month;`],
        },
        {
          id: 'sqlf.u06.l04.e02',
          title: '廣告花費 7 日移動平均',
          difficulty: 3,
          prompt:
            '對 `ad_spend` 資料，先用 CTE 按 `spend_date` 彙總所有活動的每日總花費，再計算「7 日移動平均花費」（`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`）。回傳欄位：`spend_date`、`daily_cost`（四捨五入到整數）、`ma7_cost`（7 日移動平均，四捨五入到整數），依 `spend_date` ASC 排序。',
          answer: `WITH daily AS (
  SELECT
    spend_date,
    ROUND(SUM(cost), 0) AS daily_cost
  FROM ad_spend
  GROUP BY spend_date
)
SELECT
  spend_date,
  daily_cost,
  ROUND(
    AVG(daily_cost) OVER (
      ORDER BY spend_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ),
    0
  ) AS ma7_cost
FROM daily
ORDER BY spend_date;`,
          hints: ['ROWS BETWEEN 6 PRECEDING AND CURRENT ROW 取當前列和前 6 列，共 7 列計算平均。前 6 天資料不足時，SQLite 只用已有的列計算。'],
          explanation:
            '`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` 取當前列和往前 6 列，共 7 列計算 AVG。前 6 天資料不足時，只用有的列（SQLite 不補 NULL）。一定要用 `ROWS BETWEEN` 而非 `RANGE BETWEEN`——後者在字串日期欄位上無法按數值範圍計算。',
          negatives: [`WITH daily AS (
  SELECT spend_date, ROUND(SUM(cost), 0) AS daily_cost
  FROM ad_spend GROUP BY spend_date
)
SELECT
  spend_date, daily_cost,
  ROUND(AVG(daily_cost) OVER (
    ORDER BY spend_date
    RANGE BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 0) AS ma7_cost
FROM daily ORDER BY spend_date;`, `WITH daily AS (
  SELECT spend_date, ROUND(SUM(cost), 0) AS daily_cost
  FROM ad_spend GROUP BY spend_date
)
SELECT
  spend_date, daily_cost,
  ROUND(AVG(daily_cost) OVER (
    ORDER BY spend_date
    ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
  ), 0) AS ma7_cost
FROM daily ORDER BY spend_date;`],
        },
      ],
    },
  ],
};
