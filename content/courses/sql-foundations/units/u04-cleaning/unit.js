/**
 * 單元 4：資料清理
 * CASE WHEN 分類、NULL 處理、字串函數、日期函數。
 * 所有 answer SQL 已針對「好禮客製」電商資料集（SQLite）驗證。
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u04',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'u04-l01',
      title: 'CASE WHEN：分類與分級',
      minutes: 25,
      objectives: [
        '用 Searched CASE 依條件貼標籤',
        '用 Simple CASE 做值對值轉換',
        '用 CASE 在 GROUP BY 裡把連續值分桶',
        '用 SUM(CASE WHEN ... THEN 1 ELSE 0 END) 做條件計數',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u04.l01.e01',
          title: '商品類型分類',
          difficulty: 1,
          scenario: '商品企劃：「幫我把商品分成飲料容器和其他兩類，方便做初步的分類報表。」',
          prompt:
            '從 `products` 取出所有商品，用 `CASE` 把 `category` 分成：\n\n' +
            '- `飲料容器`：`保溫杯`、`馬克杯`\n' +
            '- `其他`：其餘分類\n\n' +
            '回傳 `product_name`、`category`、`product_type`（新欄位），依 `product_type` **ASC** 排序。',
          starter: 'SELECT\n  product_name,\n  category,\n  CASE\n    WHEN \n    ELSE \n  END AS product_type\nFROM products\nORDER BY product_type;',
          answer:
`SELECT
  product_name,
  category,
  CASE
    WHEN category IN ('保溫杯', '馬克杯') THEN '飲料容器'
    ELSE '其他'
  END AS product_type
FROM products
ORDER BY product_type;`,
          ordered: true,
          hints: [
            'CASE WHEN category IN (...) THEN ... 可以一次比對多個值',
            'ELSE 處理所有不符合條件的列',
            'ORDER BY 直接用別名 product_type',
          ],
          explanation:
            '`IN (...)` 是 `OR` 的簡寫：`category = \'保溫杯\' OR category = \'馬克杯\'`。\n\n' +
            '用 `ELSE \'其他\'` 處理所有其餘分類，不需要一一列舉。',
          negatives: [
            `SELECT product_name, category, CASE WHEN category = '保溫杯' THEN '飲料容器' WHEN category = '馬克杯' THEN '飲料容器' ELSE '其他' END AS product_type FROM products ORDER BY category;`,
          ],
          mistakes: ['忘記排序', '兩個 WHEN 分開寫沒問題，但 IN 更簡潔'],
        },
        {
          id: 'sqlf.u04.l01.e02',
          title: '訂單狀態統計與佔比',
          difficulty: 2,
          scenario: '營運主管：「各狀態的訂單各有幾張、佔幾趴？用中文標籤顯示狀態名稱。」',
          prompt:
            '計算 `orders` 各 `status` 的訂單數與佔比，用 `CASE` 加中文標籤：\n\n' +
            '- `completed` → `完成`\n- `refunded` → `退款`\n- `cancelled` → `取消`\n- `pending` → `處理中`\n\n' +
            '回傳 `status_label`、`order_count`、`pct`（百分比，四捨五入 1 位小數）。\n依 `order_count` **DESC** 排序。',
          starter: '',
          answer:
`SELECT
  CASE status
    WHEN 'completed' THEN '完成'
    WHEN 'refunded'  THEN '退款'
    WHEN 'cancelled' THEN '取消'
    WHEN 'pending'   THEN '處理中'
    ELSE status
  END                                                  AS status_label,
  COUNT(*)                                             AS order_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 1) AS pct
FROM orders
GROUP BY status
ORDER BY order_count DESC;`,
          ordered: true,
          hints: [
            'Simple CASE：CASE status WHEN \'completed\' THEN \'完成\' ...',
            '佔比 = 該狀態筆數 / 全部筆數 × 100；全部筆數用 (SELECT COUNT(*) FROM orders)',
            '乘以 100.0（浮點）才能得到小數',
          ],
          explanation:
            'Simple CASE 在值對值轉換時比 Searched CASE 更簡潔。\n\n' +
            '佔比的分母用子查詢 `(SELECT COUNT(*) FROM orders)` 取總筆數——這是在 `SELECT` 清單裡用純量子查詢的經典場景（第 5 單元會詳細介紹）。\n' +
            '乘以 `100.0` 讓 SQLite 用浮點除法，否則整數除法會直接截斷小數。',
          negatives: [
            `SELECT CASE status WHEN 'completed' THEN '完成' WHEN 'refunded' THEN '退款' WHEN 'cancelled' THEN '取消' WHEN 'pending' THEN '處理中' ELSE status END AS status_label, COUNT(*) AS order_count, ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM orders), 1) AS pct FROM orders GROUP BY status ORDER BY order_count DESC;`,
          ],
          mistakes: ['用 100 而非 100.0，小數全被截斷', 'ELSE 忘記放，未知狀態顯示 NULL'],
        },
        {
          id: 'sqlf.u04.l01.e03',
          title: '完成訂單金額級距分析',
          difficulty: 2,
          scenario: '財務：「completed 訂單裡，小單、中單、大單各有幾張？方便估算客單分布。」',
          prompt:
            '只分析 `status = \'completed\'` 的訂單，用 `CASE` 把 `total_amount` 分成：\n\n' +
            '- `小單`：`total_amount < 1000`\n' +
            '- `中單`：`1000 ≤ total_amount < 5000`\n' +
            '- `大單`：`total_amount ≥ 5000`\n\n' +
            '回傳 `tier`、`count`，依 `tier` **ASC**（字母順序）排序。',
          starter: '',
          answer:
`SELECT
  CASE
    WHEN total_amount < 1000  THEN '小單'
    WHEN total_amount < 5000  THEN '中單'
    ELSE                           '大單'
  END AS tier,
  COUNT(*) AS count
FROM orders
WHERE status = 'completed'
GROUP BY tier
ORDER BY tier;`,
          ordered: true,
          hints: [
            'CASE 條件從上往下比，第一個成立即停止——所以先判斷 < 1000，再判斷 < 5000 就夠了',
            'GROUP BY 直接用別名 tier',
            '排序用 tier ASC，SQLite 字串比較：大單 < 小單 < 中單（Unicode 順序）',
          ],
          explanation:
            '`CASE` 條件從上往下匹配：第一個 `< 1000` 成立就走小單；剩下的都 ≥ 1000，第二個 `< 5000` 成立就走中單；最後只剩 ≥ 5000 的走 `ELSE 大單`。\n\n' +
            '這比寫 `BETWEEN 1000 AND 4999` 少了一個邊界，也更不容易漏掉 `4999.99` 這類邊際值。',
          negatives: [
            `SELECT CASE WHEN total_amount < 1000 THEN '小單' WHEN total_amount < 5000 THEN '中單' ELSE '大單' END AS tier, COUNT(*) AS count FROM orders GROUP BY tier ORDER BY tier;`,
          ],
          mistakes: ['忘了篩 completed，把取消和退款的訂單也算進去'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u04-l02',
      title: '處理 NULL：COALESCE、NULLIF、IS NULL',
      minutes: 20,
      objectives: [
        '用 IS NULL / IS NOT NULL 篩選空值',
        '用 COALESCE 給 NULL 欄位設定預設值',
        '用 NULLIF 防止除以零',
        '理解 NULL 在算術和 COUNT 中的行為',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u04.l02.e01',
          title: '會員城市補全顯示',
          difficulty: 1,
          scenario: 'CRM 專員：「會員清單裡，城市欄位是 NULL 的顯示成「未填」，不然匯出的報表看起來很空。」',
          prompt:
            '從 `customers` 取出所有會員的 `name`、`city`。\n\n' +
            '`city` 若為 `NULL` 顯示為 `未填`（用 `COALESCE`），欄位命名 `display_city`。\n依 `name` **ASC** 排序。',
          starter: 'SELECT\n  name,\n  COALESCE(   ) AS display_city\nFROM customers\nORDER BY name;',
          answer:
`SELECT
  name,
  COALESCE(city, '未填') AS display_city
FROM customers
ORDER BY name;`,
          ordered: true,
          hints: [
            'COALESCE(city, \'未填\') — 若 city 不是 NULL 直接回傳 city，否則回傳 \'未填\'',
          ],
          explanation:
            '`COALESCE` 接受任意數量的參數，回傳第一個非 NULL 的值。\n\n' +
            '`IFNULL(city, \'未填\')` 在 SQLite 也能得到相同結果，但 `COALESCE` 是 SQL 標準，移植到其他資料庫不需要改寫。',
          negatives: [
            `SELECT name, CASE WHEN city = NULL THEN '未填' ELSE city END AS display_city FROM customers ORDER BY name;`,
          ],
          mistakes: ['用 city = NULL：任何值跟 NULL 用 = 比較都是 NULL（false），所有城市都會顯示 \'未填\''],
        },
        {
          id: 'sqlf.u04.l02.e02',
          title: '廣告 CTR 計算（防除以零）',
          difficulty: 2,
          scenario: '行銷分析師：「每天每個活動的點擊率是多少？注意 impressions 可能是 0，不要讓查詢報錯。」',
          prompt:
            '計算 `ad_spend` 每一列的 CTR（`clicks / impressions × 100`），但 `impressions` 可能為 0。\n\n' +
            '用 `NULLIF` 防止除以零；CTR 四捨五入到小數 2 位，`impressions = 0` 時 CTR 保留為 `NULL`。\n\n' +
            '回傳 `spend_date`、`campaign_id`、`impressions`、`clicks`、`ctr`。\n依 `spend_date`、`campaign_id` **ASC** 排序，只取前 20 筆（`LIMIT 20`）。',
          starter: '',
          answer:
`SELECT
  spend_date,
  campaign_id,
  impressions,
  clicks,
  ROUND(
    CAST(clicks AS REAL) * 100.0 / NULLIF(impressions, 0),
    2
  ) AS ctr
FROM ad_spend
ORDER BY spend_date, campaign_id
LIMIT 20;`,
          ordered: true,
          hints: [
            'NULLIF(impressions, 0)：impressions 為 0 時回傳 NULL，讓整個除法結果也是 NULL',
            'SQLite 整數相除得整數，加上 CAST(clicks AS REAL) 或乘以 1.0 轉浮點',
            'ROUND(..., 2) 四捨五入到 2 位小數',
          ],
          explanation:
            '`NULLIF(impressions, 0)` 讓分母在等於 0 時變成 `NULL`，整個除法結果也就是 `NULL`，避免「除以零」錯誤。\n\n' +
            '`CAST(clicks AS REAL)` 讓 SQLite 用浮點除法——不加的話，整數 ÷ 整數 = 整數，CTR 只會是 0 或 1。',
          negatives: [
            `SELECT spend_date, campaign_id, impressions, clicks, ROUND(clicks * 1.0 / NULLIF(impressions, 0), 2) AS ctr FROM ad_spend ORDER BY spend_date, campaign_id LIMIT 20;`,
          ],
          mistakes: ['不加 NULLIF，impressions = 0 時 SQLite 會回傳 NULL 而不是報錯，但在其他資料庫（PostgreSQL）會拋出例外'],
        },
        {
          id: 'sqlf.u04.l02.e03',
          title: '未填性別的會員統計',
          difficulty: 2,
          scenario: 'CRM 分析師：「會員裡有多少人沒填性別？佔整體幾趴？要評估資料完整度。」',
          prompt:
            '從 `customers` 統計 `gender` 為 `NULL` 的會員數及佔總會員的百分比。\n\n' +
            '回傳 `null_count`（NULL 的人數）和 `null_pct`（百分比，四捨五入 1 位小數）。',
          starter: '',
          answer:
`SELECT
  COUNT(*) - COUNT(gender)                                          AS null_count,
  ROUND(
    (COUNT(*) - COUNT(gender)) * 100.0 / COUNT(*),
    1
  )                                                                 AS null_pct
FROM customers;`,
          hints: [
            'COUNT(欄位) 不計 NULL；COUNT(*) 計所有列',
            'NULL 數量 = COUNT(*) - COUNT(gender)',
            '乘以 100.0 才能得到小數百分比',
          ],
          explanation:
            '`COUNT(gender)` 只計非 NULL 的列，`COUNT(*) - COUNT(gender)` 就是 NULL 的數量。\n\n' +
            '這個技巧可以在不加 `WHERE gender IS NULL` 的前提下，只用一個查詢同時得到總數和 NULL 數，效率更高。',
          negatives: [
            `SELECT COUNT(*) AS null_count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 1) AS null_pct FROM customers;`,
          ],
          mistakes: [
            '用 WHERE gender IS NULL 然後 COUNT(*) 也能得到 null_count，但沒辦法在同一個查詢裡算佔比（分母消失了）',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u04-l03',
      title: '字串函數：清理文字資料',
      minutes: 20,
      objectives: [
        '用 TRIM / LOWER 清理 email',
        '用 REPLACE 統一城市名稱',
        '用 SUBSTR 取日期的年月部分',
        '用 LIKE 做模糊比對',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u04.l03.e01',
          title: '找出不乾淨的 email',
          difficulty: 1,
          scenario: '資料工程師：「看看哪些會員的 email 有前後空白或大寫，把髒資料列出來。」',
          prompt:
            '從 `customers` 取出 `customer_id`、原始 `email`、`cleaned_email`（`LOWER` + `TRIM` 後的結果）、\n' +
            '以及 `is_dirty`（若兩者不同則為 `1`，否則為 `0`，用 `CASE` 判斷）。\n\n' +
            '**只顯示 `email` 不等於 `cleaned_email` 的列**，依 `customer_id` **ASC** 排序。',
          starter: '',
          answer:
`SELECT
  customer_id,
  email,
  LOWER(TRIM(email)) AS cleaned_email,
  1                  AS is_dirty
FROM customers
WHERE email != LOWER(TRIM(email))
ORDER BY customer_id;`,
          ordered: true,
          hints: [
            'LOWER(TRIM(email)) 先去空白再轉小寫',
            'WHERE email != LOWER(TRIM(email)) 篩出不一樣的列',
            '既然已經篩選過，is_dirty 一定是 1，直接寫 1 即可',
          ],
          explanation:
            '只顯示 `is_dirty = 1` 的列，所以在 `WHERE` 直接比較原始 email 和清理後的結果，`is_dirty` 欄位就不需要用 `CASE`，直接給常數 `1`。\n\n' +
            '這類查詢常用於「資料品質審計」：找出有問題的列，再決定要不要用 `UPDATE` 修正原始資料。',
          negatives: [
            `SELECT customer_id, email, LOWER(TRIM(email)) AS cleaned_email, CASE WHEN email != LOWER(TRIM(email)) THEN 1 ELSE 0 END AS is_dirty FROM customers ORDER BY customer_id;`,
          ],
          mistakes: ['沒加 WHERE，把乾淨的 email 也顯示出來'],
        },
        {
          id: 'sqlf.u04.l03.e02',
          title: '統一城市名稱後計算會員數',
          difficulty: 2,
          scenario: '行銷分析師：「台北市和臺北市其實是同一個城市，能不能統一之後再算各城市有多少會員？」',
          prompt:
            '把 `customers` 的 `city` 做以下清理，再計算各城市的會員數：\n\n' +
            '1. `NULL` → `未知`（用 `COALESCE`）\n' +
            '2. `臺北市` → `台北市`（用 `REPLACE`）\n\n' +
            '回傳 `city`（清理後）、`count`，依 `count` **DESC** 排序。',
          starter: '',
          answer:
`SELECT
  REPLACE(COALESCE(city, '未知'), '臺北市', '台北市') AS city,
  COUNT(*) AS count
FROM customers
GROUP BY REPLACE(COALESCE(city, '未知'), '臺北市', '台北市')
ORDER BY count DESC;`,
          ordered: true,
          hints: [
            '先 COALESCE 把 NULL 換成 \'未知\'，再 REPLACE 換城市名',
            'GROUP BY 要寫和 SELECT 相同的運算式（或用子查詢包一層）',
          ],
          explanation:
            '函數可以巢狀：`REPLACE(COALESCE(city, \'未知\'), \'臺北市\', \'台北市\')` 先處理 NULL，再做取代。\n\n' +
            '`GROUP BY` 必須包含和 `SELECT` 相同的運算式——BigQuery 不支援在 `GROUP BY` 用別名，所以養成重複寫運算式的習慣最保險。',
          negatives: [
            `SELECT REPLACE(COALESCE(city, '未知'), '臺北市', '台北市') AS city, COUNT(*) AS count FROM customers GROUP BY city ORDER BY count DESC;`,
          ],
          mistakes: ['GROUP BY city（用原始欄位）：清理後「臺北市」和「台北市」仍然是兩列'],
        },
        {
          id: 'sqlf.u04.l03.e03',
          title: '月度成交訂單與營收',
          difficulty: 2,
          scenario: '電商經理：「每個月 completed 訂單有幾張、總營收多少？」',
          prompt:
            '從 `orders` 用 `SUBSTR(order_date, 1, 7)` 取年月，計算每月 `completed` 訂單的：\n\n' +
            '- `month`（格式 `yyyy-mm`）\n- `order_count`\n- `revenue`（`SUM(total_amount)`，四捨五入整數）\n\n' +
            '依 `month` **ASC** 排序。',
          starter: '',
          answer:
`SELECT
  SUBSTR(order_date, 1, 7)    AS month,
  COUNT(*)                    AS order_count,
  ROUND(SUM(total_amount))    AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month;`,
          ordered: true,
          hints: [
            'SUBSTR(order_date, 1, 7) 取 \'2025-07\' 這樣的年月字串',
            'GROUP BY month（用別名，SQLite 支援）',
          ],
          explanation:
            '`SUBSTR(str, 1, 7)` 從位置 1 取 7 個字元，`YYYY-MM-DD` 的前 7 個字元剛好是年月。\n\n' +
            '`strftime(\'%Y-%m\', order_date)` 也能達到相同效果（L04 的主題）。`SUBSTR` 更直覺，不需要記格式符號。',
          negatives: [
            `SELECT SUBSTR(order_date, 1, 7) AS month, COUNT(*) AS order_count, ROUND(SUM(total_amount)) AS revenue FROM orders GROUP BY month ORDER BY month;`,
          ],
          mistakes: ['忘了篩 completed，把退款和取消的也算進去'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u04-l04',
      title: '日期函數：按時間彙總',
      minutes: 25,
      objectives: [
        '用 strftime 取年月、年份、週數',
        '用 date() 做日期加減',
        '用 julianday() 計算天數差',
        '用 CASE WHEN + strftime 按季彙總',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u04.l04.e01',
          title: '每月完成訂單數',
          difficulty: 1,
          scenario: '電商經理：「每個月有幾張成交訂單？先看趨勢。」',
          prompt:
            '計算 `orders` 中 `status = \'completed\'` 的訂單，依年月分組，回傳 `month`（格式 `yyyy-mm`）和 `order_count`。\n依 `month` **ASC** 排序。',
          starter: '',
          answer:
`SELECT
  strftime('%Y-%m', order_date) AS month,
  COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month;`,
          ordered: true,
          hints: [
            'strftime(\'%Y-%m\', order_date) 取年月字串',
            'GROUP BY month（SQLite 允許用別名）',
          ],
          explanation:
            '`strftime(\'%Y-%m\', ...)` 和 `SUBSTR(order_date, 1, 7)` 得到相同結果，都是 `YYYY-MM` 格式。\n\n' +
            '`strftime` 語意更明確（明確說明這是日期操作），建議日期相關的提取都用 `strftime`。',
          negatives: [
            `SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month;`,
          ],
          mistakes: ['忘了 WHERE status = \'completed\'，把取消和退款也算進去'],
        },
        {
          id: 'sqlf.u04.l04.e02',
          title: '2026 年 Q1/Q2 季度營收',
          difficulty: 2,
          scenario: '財務分析師：「2026 年上半年兩個季度的成交營收各是多少？」',
          prompt:
            '只計算 **2026 年** `status = \'completed\'` 的訂單，用 `CASE` 把月份分成：\n\n' +
            '- `Q1`：1～3 月\n- `Q2`：4～6 月\n\n' +
            '回傳 `quarter`、`revenue`（`SUM(total_amount)`，四捨五入整數），依 `quarter` **ASC** 排序。',
          starter: '',
          answer:
`SELECT
  CASE
    WHEN strftime('%m', order_date) BETWEEN '01' AND '03' THEN 'Q1'
    ELSE 'Q2'
  END                          AS quarter,
  ROUND(SUM(total_amount))     AS revenue
FROM orders
WHERE status = 'completed'
  AND strftime('%Y', order_date) = '2026'
GROUP BY quarter
ORDER BY quarter;`,
          ordered: true,
          hints: [
            'strftime(\'%Y\', order_date) = \'2026\' 篩出 2026 年的訂單',
            'strftime(\'%m\', ...) 回傳兩位月份字串：\'01\'～\'12\'',
            '只有兩個季度，CASE 只需一個 WHEN，剩下的用 ELSE',
          ],
          explanation:
            '`strftime(\'%m\', ...)` 回傳的是字串（`\'01\'`～`\'12\'`），`BETWEEN \'01\' AND \'03\'` 是字串比較——格式固定為兩位，所以字串排序和數字排序結果相同。\n\n' +
            '篩 2026 年用 `strftime(\'%Y\', ...) = \'2026\'`，也可以用 `order_date >= \'2026-01-01\' AND order_date < \'2027-01-01\'`，後者在有日期索引時效能更好。',
          negatives: [
            `SELECT CASE WHEN strftime('%m', order_date) BETWEEN '01' AND '03' THEN 'Q1' ELSE 'Q2' END AS quarter, ROUND(SUM(total_amount)) AS revenue FROM orders WHERE status = 'completed' GROUP BY quarter ORDER BY quarter;`,
          ],
          mistakes: ['忘了篩 2026 年，把 2025 年的也算進去'],
        },
        {
          id: 'sqlf.u04.l04.e03',
          title: '會員年資排行（前 10 名）',
          difficulty: 2,
          scenario: 'CRM 分析師：「最早加入的 10 位會員是誰？他們加入多少天了？」',
          prompt:
            '計算每位會員從 `signup_date` 到 `2026-06-30` 的「會員天數」`member_days`（用 `julianday` 計算，`CAST` 為整數）。\n\n' +
            '回傳 `customer_id`、`name`、`signup_date`、`member_days`，依 `member_days` **DESC** 排序，只取前 10 名。',
          starter: '',
          answer:
`SELECT
  customer_id,
  name,
  signup_date,
  CAST(julianday('2026-06-30') - julianday(signup_date) AS INTEGER) AS member_days
FROM customers
ORDER BY member_days DESC
LIMIT 10;`,
          ordered: true,
          hints: [
            'julianday(\'2026-06-30\') - julianday(signup_date) 得到浮點天數',
            'CAST(... AS INTEGER) 截斷小數',
            'ORDER BY member_days DESC LIMIT 10',
          ],
          explanation:
            '`julianday()` 把日期轉成儒略日（一個浮點數），相減得到兩日期相差的天數（含小數部分，因為 julianday 精確到秒）。\n\n' +
            '`CAST(... AS INTEGER)` 直接截斷小數（不是四捨五入）；若要四捨五入可用 `ROUND(..., 0)`。',
          negatives: [
            `SELECT customer_id, name, signup_date, CAST(julianday('2026-06-30') - julianday(signup_date) AS INTEGER) AS member_days FROM customers ORDER BY member_days ASC LIMIT 10;`,
          ],
          mistakes: ['沒有 CAST，member_days 是浮點數（例如 365.0）'],
        },
        {
          id: 'sqlf.u04.l04.e04',
          title: '最近 30 天每日訂單數',
          difficulty: 3,
          scenario: '運營主管：「最近 30 天，每天有幾張成交訂單？觀察近期趨勢。」',
          prompt:
            '找出 `order_date >= date(\'2026-06-30\', \'-29 days\')`（含）的 `completed` 訂單，\n計算每天的 `daily_orders`。\n\n' +
            '無訂單的日期**不需要補零**，只顯示有訂單的日期。\n回傳 `order_date`、`daily_orders`，依 `order_date` **ASC** 排序。',
          starter: '',
          answer:
`SELECT
  order_date,
  COUNT(*) AS daily_orders
FROM orders
WHERE status = 'completed'
  AND order_date >= date('2026-06-30', '-29 days')
GROUP BY order_date
ORDER BY order_date;`,
          ordered: true,
          hints: [
            'date(\'2026-06-30\', \'-29 days\') 計算 30 天前的日期（含今日共 30 天）',
            'GROUP BY order_date 每天一列',
          ],
          explanation:
            '`date(\'2026-06-30\', \'-29 days\')` 算出 `2026-06-01`，加上 `2026-06-30` 共 30 天。\n\n' +
            '若需要補齊無訂單的日期（讓每天都有一列），需要用「日期維度表」或遞迴 CTE 產生連續日期再 LEFT JOIN，這是進階主題。',
          negatives: [
            `SELECT order_date, COUNT(*) AS daily_orders FROM orders WHERE status = 'completed' AND order_date >= date('2026-06-30', '-30 days') GROUP BY order_date ORDER BY order_date;`,
          ],
          mistakes: [
            '\'-30 days\' 會多算一天（共 31 天），應用 \'-29 days\'',
            '忘了 WHERE status = \'completed\'',
          ],
        },
      ],
    },
  ],
};
