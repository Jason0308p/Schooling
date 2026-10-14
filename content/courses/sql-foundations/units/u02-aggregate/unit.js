/**
 * 單元 2：彙總分析 GROUP BY 與 HAVING
 * 欄位規格見 docs/CONTENT_GUIDE.md。id 一經發布不可改名。
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u02',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'u02-l01',
      title: '彙總函數：COUNT、SUM、AVG、MIN、MAX',
      minutes: 20,
      objectives: ['用彙總函數算出 KPI', '分清楚 COUNT(*)、COUNT(欄位)、COUNT(DISTINCT)', '理解彙總函數忽略 NULL'],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u02.l01.e01',
          title: '年度營收 KPI',
          difficulty: 1,
          scenario: '老闆：「這一年總共成交幾張訂單、營收多少、平均一張多少錢？」',
          prompt:
            '只計算 `status` 為 `completed` 的訂單，回傳**一列**三個欄位：\n\n' +
            '1. 訂單數 `order_count`\n2. 營收（`total_amount` 加總）`revenue`\n3. 平均客單價 `aov`，**四捨五入到整數**',
          starter: '',
          answer:
            "SELECT\n  COUNT(*)                 AS order_count,\n  SUM(total_amount)        AS revenue,\n  ROUND(AVG(total_amount)) AS aov\nFROM orders\nWHERE status = 'completed';",
          hints: ['COUNT(*)、SUM(total_amount)、AVG(total_amount)', 'ROUND(AVG(total_amount)) 四捨五入到整數'],
          explanation:
            'WHERE 先篩出已完成訂單，三個彙總函數再對這些訂單計算。\n\n' +
            '客單價（AOV, Average Order Value）= 營收 ÷ 訂單數，跟 `AVG(total_amount)` 是同一件事。',
          alternatives: [
            { sql: "SELECT COUNT(*), SUM(total_amount), ROUND(SUM(total_amount) * 1.0 / COUNT(*))\nFROM orders\nWHERE status = 'completed';", note: '用營收 ÷ 訂單數算客單價，結果相同' },
          ],
          mistakes: ['沒排除退款和取消的訂單，營收被高估'],
        },
        {
          id: 'sqlf.u02.l01.e02',
          title: '會員資料完整度',
          difficulty: 2,
          scenario: 'CRM 主管：「我們的會員資料填得有多完整？我要知道城市和出生年各有多少人填。」',
          prompt:
            '從 `customers` 回傳**一列**三個欄位：\n\n' +
            '1. 會員總數 `total_members`\n2. 有填 `city` 的人數 `with_city`\n3. 有填 `birth_year` 的人數 `with_birth_year`',
          starter: '',
          answer:
            'SELECT\n  COUNT(*)          AS total_members,\n  COUNT(city)       AS with_city,\n  COUNT(birth_year) AS with_birth_year\nFROM customers;',
          hints: ['COUNT(欄位) 只會算不是 NULL 的列'],
          explanation: '`COUNT(*)` 算全部列，`COUNT(city)` 只算 city 不是 NULL 的列。兩者相減就是沒填的人數，相除就是填寫率。',
          mistakes: ['三個都寫 COUNT(*)，結果三個數字一樣'],
        },
        {
          id: 'sqlf.u02.l01.e03',
          title: '有消費的會員有幾位',
          difficulty: 2,
          scenario: '行銷總監：「480 個會員裡面，到底有幾個人真的買過東西？」',
          prompt: '從 `orders` 計算有**至少一張 `completed` 訂單**的**不重複會員數**，回傳一列一個欄位 `buyers`。',
          starter: '',
          answer: "SELECT COUNT(DISTINCT customer_id) AS buyers\nFROM orders\nWHERE status = 'completed';",
          hints: ['一個會員可能有很多張訂單，不能直接 COUNT(*)', 'COUNT(DISTINCT customer_id)'],
          explanation:
            '`COUNT(*)` 算的是訂單數，同一個人下 3 單會被算 3 次。`COUNT(DISTINCT customer_id)` 才是「人數」。\n\n' +
            '這個數字除以總會員數，就是「會員購買轉換率」，是 CRM 很常看的指標。',
          negatives: [
            "SELECT COUNT(customer_id) AS buyers FROM orders WHERE status = 'completed';",
          ],
          mistakes: ['用 COUNT(*) 算成訂單數', '用 COUNT(customer_id)：一樣會重複計算'],
        },
        {
          id: 'sqlf.u02.l01.e04',
          title: '商品價格帶',
          difficulty: 1,
          scenario: '商品企劃：「我們販售中的商品，最便宜、最貴、平均價格各是多少？」',
          prompt:
            '只看 `is_active = 1` 的商品，回傳一列：最低價 `min_price`、最高價 `max_price`、平均價 `avg_price`（**四捨五入到整數**）。',
          starter: '',
          answer:
            'SELECT\n  MIN(price)        AS min_price,\n  MAX(price)        AS max_price,\n  ROUND(AVG(price)) AS avg_price\nFROM products\nWHERE is_active = 1;',
          hints: ['MIN、MAX、AVG 可以寫在同一個 SELECT 裡'],
          explanation: '多個彙總函數可以放在同一個 SELECT，一次算出多個指標。',
          mistakes: ['漏了 is_active = 1，把下架商品也算進去'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u02-l02',
      title: 'GROUP BY：分組彙總',
      minutes: 25,
      objectives: ['用 GROUP BY 做出樞紐分析表', '遵守 GROUP BY 鐵則', '做出月份趨勢報表', '多欄位分組'],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u02.l02.e01',
          title: '各通路業績',
          difficulty: 1,
          scenario: '營運主管：「三個通路各貢獻多少營收？營收高的排前面。」',
          prompt:
            '只看 `completed` 訂單，依 `sales_channel` 分組，回傳 `sales_channel`、訂單數 `order_count`、營收 `revenue`。\n\n' +
            '依 `revenue` **由高到低**排序。',
          starter: '',
          answer:
            "SELECT\n  sales_channel,\n  COUNT(*)          AS order_count,\n  SUM(total_amount) AS revenue\nFROM orders\nWHERE status = 'completed'\nGROUP BY sales_channel\nORDER BY revenue DESC;",
          ordered: true,
          hints: ['GROUP BY sales_channel', 'ORDER BY 可以用別名 revenue'],
          explanation:
            '每個通路一列。你會發現 B2B 訂單數最少，但每張金額很大，這就是為什麼要同時看「訂單數」和「營收」，' +
            '只看其中一個會誤判通路價值。',
          mistakes: ['SELECT 了沒放進 GROUP BY 的欄位'],
        },
        {
          id: 'sqlf.u02.l02.e02',
          title: '月營收趨勢',
          difficulty: 2,
          scenario: '老闆：「給我每個月的營收趨勢，我要看旺季淡季。」',
          prompt:
            '只看 `completed` 訂單，依**月份**分組（格式 `YYYY-MM`，例如 `2025-12`），回傳 `month`、`order_count`、`revenue`。\n\n' +
            '依 `month` **由舊到新**排序。',
          starter: '',
          answer:
            "SELECT\n  substr(order_date, 1, 7) AS month,\n  COUNT(*)                 AS order_count,\n  SUM(total_amount)        AS revenue\nFROM orders\nWHERE status = 'completed'\nGROUP BY substr(order_date, 1, 7)\nORDER BY month;",
          ordered: true,
          hints: ['substr(order_date, 1, 7) 取出年-月', 'GROUP BY 跟 SELECT 用同一個運算式'],
          explanation:
            '`substr(order_date, 1, 7)` 把 `2025-12-25` 變成 `2025-12`，再依此分組。\n\n' +
            '看結果可以發現 11 月起營收明顯上升，這是禮品業的旺季（聖誕、尾牙、春節）。',
          alternatives: [
            { sql: "SELECT strftime('%Y-%m', order_date) AS month, COUNT(*), SUM(total_amount)\nFROM orders\nWHERE status = 'completed'\nGROUP BY 1\nORDER BY 1;", note: 'strftime 是 SQLite 的日期格式化函數，第 4 單元會教' },
          ],
          mistakes: ['GROUP BY order_date：會變成每天一列', '忘了 ORDER BY，月份順序不保證'],
        },
        {
          id: 'sqlf.u02.l02.e03',
          title: '各分類商品組合',
          difficulty: 1,
          scenario: '商品企劃：「每個分類目前在賣的有幾個商品？平均價格多少？」',
          prompt:
            '只看 `is_active = 1` 的商品，依 `category` 分組，回傳 `category`、商品數 `product_count`、平均價 `avg_price`（**四捨五入到整數**）。',
          starter: '',
          answer:
            'SELECT\n  category,\n  COUNT(*)          AS product_count,\n  ROUND(AVG(price)) AS avg_price\nFROM products\nWHERE is_active = 1\nGROUP BY category;',
          hints: ['WHERE 先篩 is_active，再 GROUP BY category'],
          explanation: '先用 WHERE 排除下架商品，再分組計算。WHERE 一定寫在 GROUP BY 前面。',
          mistakes: [],
        },
        {
          id: 'sqlf.u02.l02.e04',
          title: '各通路的訂單狀態分佈',
          difficulty: 2,
          scenario: '客服主管：「我懷疑某個通路的退款特別多，給我各通路、各狀態的訂單數。」',
          prompt: '從 `orders`（所有狀態）依 `sales_channel` 和 `status` 兩個欄位分組，回傳 `sales_channel`、`status`、`order_count`。',
          starter: '',
          answer:
            'SELECT\n  sales_channel,\n  status,\n  COUNT(*) AS order_count\nFROM orders\nGROUP BY sales_channel, status;',
          hints: ['GROUP BY 可以放兩個欄位，用逗號隔開'],
          explanation:
            '`GROUP BY sales_channel, status` 會產生「通路 × 狀態」的每一種組合。' +
            '下一步通常會再算「退款率」= 退款數 ÷ 總數，第 4 單元學了 `CASE WHEN` 就能在一個查詢裡算出來。',
          mistakes: ['這題不需要 WHERE status = ...，因為要看全部狀態'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u02-l03',
      title: 'HAVING 與 SQL 的執行順序',
      minutes: 25,
      objectives: ['用 HAVING 篩選分組結果', '分清楚 WHERE 與 HAVING', '記住 SQL 執行順序', '正確計算比率指標'],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u02.l03.e01',
          title: '忠實顧客名單',
          difficulty: 2,
          scenario: 'CRM 專員：「我要辦忠實顧客感謝活動，找出成交 5 次以上的會員。」',
          prompt:
            '只看 `completed` 訂單，找出訂單數**大於等於 5** 的會員，回傳 `customer_id`、`order_count`。\n\n' +
            '依 `order_count` **由多到少**，相同時依 `customer_id` 由小到大。**本題必須使用 HAVING。**',
          starter: '',
          answer:
            "SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nWHERE status = 'completed'\nGROUP BY customer_id\nHAVING COUNT(*) >= 5\nORDER BY order_count DESC, customer_id;",
          ordered: true,
          rules: [{ pattern: /\bHAVING\b/i, message: '這題要練習 HAVING，請用 HAVING 篩選分組結果。' }],
          hints: ['先 GROUP BY customer_id', 'HAVING COUNT(*) >= 5'],
          explanation:
            '`WHERE` 篩選訂單（只要已完成的），`HAVING` 篩選會員（只要訂單數 ≥ 5 的）。' +
            '兩個條件作用在不同層級，所以一個放 WHERE、一個放 HAVING。',
          mistakes: ['把 COUNT(*) >= 5 寫在 WHERE → misuse of aggregate', '把 status 條件寫在 HAVING：語法錯誤或結果不對'],
        },
        {
          id: 'sqlf.u02.l03.e02',
          title: '高花費活動的 CPC',
          difficulty: 3,
          scenario: '廣告投手：「總花費超過 10 萬的活動，平均每次點擊花多少錢（CPC）？」',
          prompt:
            '從 `ad_spend` 依 `campaign_id` 分組，只保留**總花費 `SUM(cost)` 大於 100000** 的活動，回傳：\n\n' +
            '1. `campaign_id`\n2. 總花費 `total_cost`（四捨五入到整數）\n3. 總點擊 `total_clicks`\n' +
            '4. `cpc` = 總花費 ÷ 總點擊（四捨五入到小數第 2 位）\n\n依 `cpc` **由高到低**排序。',
          starter: '',
          answer:
            'SELECT\n  campaign_id,\n  ROUND(SUM(cost))                AS total_cost,\n  SUM(clicks)                     AS total_clicks,\n  ROUND(SUM(cost) / SUM(clicks), 2) AS cpc\nFROM ad_spend\nGROUP BY campaign_id\nHAVING SUM(cost) > 100000\nORDER BY cpc DESC;',
          ordered: true,
          hints: ['CPC 要用「總花費 ÷ 總點擊」，不是每天 CPC 的平均', 'HAVING SUM(cost) > 100000', 'cost 是小數型別，所以這裡相除不會遇到整數除法問題'],
          explanation:
            'CPC 是比率指標，要**先加總、再相除**：`SUM(cost) / SUM(clicks)`。' +
            '如果寫成 `AVG(cost / clicks)`，點擊很少的日子（CPC 特別高或低）會跟點擊很多的日子有一樣的權重，數字會偏掉。\n\n' +
            '這題也示範了 HAVING 的條件不一定要出現在 SELECT 裡，但這裡剛好有。',
          negatives: [
            'SELECT campaign_id, ROUND(SUM(cost)), SUM(clicks), ROUND(AVG(cost / clicks), 2) AS cpc FROM ad_spend GROUP BY campaign_id HAVING SUM(cost) > 100000 ORDER BY cpc DESC;',
          ],
          mistakes: ['用 AVG(cost / clicks)：數值會不同', '把花費條件寫在 WHERE cost > 100000：那是篩「單日」花費'],
        },
        {
          id: 'sqlf.u02.l03.e03',
          title: '折扣碼成效',
          difficulty: 2,
          scenario: '行銷經理：「每個折扣碼被用了幾次、總共折掉多少錢？只看用超過 10 次的。」',
          prompt:
            '只看 `completed` 且**有使用折扣碼**的訂單，依 `coupon_code` 分組，' +
            '保留使用次數**大於等於 10** 的折扣碼，回傳 `coupon_code`、使用次數 `uses`、總折扣金額 `total_discount`。',
          starter: '',
          answer:
            "SELECT\n  coupon_code,\n  COUNT(*)      AS uses,\n  SUM(discount) AS total_discount\nFROM orders\nWHERE status = 'completed'\n  AND coupon_code IS NOT NULL\nGROUP BY coupon_code\nHAVING COUNT(*) >= 10;",
          hints: ['「有使用折扣碼」= coupon_code IS NOT NULL，這是對原始列的條件，放 WHERE', '使用次數 ≥ 10 是對分組的條件，放 HAVING'],
          explanation:
            '把條件放對位置：\n\n- 「已完成」「有折扣碼」是針對**每張訂單**的條件 → WHERE\n- 「使用 10 次以上」是針對**每個折扣碼**的條件 → HAVING\n\n' +
            '如果沒排除 NULL，所有沒用折扣碼的訂單會被分成一組 NULL，而且通常是最大的一組。',
          negatives: [
            "SELECT coupon_code, COUNT(*), SUM(discount) FROM orders WHERE status = 'completed' GROUP BY coupon_code HAVING COUNT(*) >= 10;",
          ],
          mistakes: ['忘了排除 NULL，結果多出一列 coupon_code 為空的'],
        },
      ],
    },
  ],
};
