const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'int-u01',
  title: '初級題組（工作 1–2 年）',
  lessons: [
    {
      id: 'int-u01-l01',
      title: '初級面試題：JOIN、彙總、子查詢、視窗函數',
      minutes: 40,
      objectives: [
        '在無提示情境下寫出正確的多表 JOIN 查詢',
        '用 NOT EXISTS 處理「買了 A 卻沒買 B」的排除邏輯',
        '用 CTE + 子查詢找出高於平均的記錄',
        '用視窗函數比較個人 vs 個人歷史',
        '用 LAG 計算月環比增長率',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'int.u01.l01.e01',
          title: '各分類銷售前五名商品',
          difficulty: 2,
          scenario: '這是我們數據分析師二面的第一題。請在 15 分鐘內完成。',
          prompt: `找出所有 \`completed\` 訂單中，**銷售數量最多的前 5 件商品**，並附上其所屬分類。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`total_qty\`：該商品所有 completed 訂單的 \`quantity\` 加總
- 回傳商品的 \`category\`、\`product_name\`、\`total_qty\`

**排序：** \`total_qty DESC\`

**回傳筆數：** 前 5 筆`,
          starter: '',
          answer: `SELECT
  p.category,
  p.product_name,
  SUM(oi.quantity) AS total_qty
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders   o ON o.order_id   = oi.order_id
WHERE o.status = 'completed'
GROUP BY p.product_id, p.category, p.product_name
ORDER BY total_qty DESC
LIMIT 5;`,
          hints: [],
          explanation: `**核心思路：** order_items（數量） → JOIN products（名稱/分類） → JOIN orders（篩狀態）。

**常見扣分點：**
- 忘記 \`WHERE o.status = 'completed'\`，把退款/取消訂單的數量也加進去
- GROUP BY 只寫 \`product_name\` 而漏掉 \`product_id\`（同名商品可能有不同 id）
- 用 \`COUNT(*)\` 算訂單筆數，而不是 \`SUM(oi.quantity)\` 算總數量（題目問「銷售數量」）

**追問方向：**
- 「如果要改成各分類分別取前 5，你的 SQL 要怎麼改？」（→ 視窗函數 RANK/ROW_NUMBER）`,
          negatives: [
            `SELECT p.category, p.product_name, COUNT(oi.order_item_id) AS total_qty FROM order_items oi JOIN products p ON p.product_id = oi.product_id JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'completed' GROUP BY p.product_id, p.category, p.product_name ORDER BY total_qty DESC LIMIT 5;`,
            `SELECT p.category, p.product_name, SUM(oi.quantity) AS total_qty FROM order_items oi JOIN products p ON p.product_id = oi.product_id GROUP BY p.product_id, p.category, p.product_name ORDER BY total_qty DESC LIMIT 5;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u01.l01.e02',
          title: '買了保溫杯卻從未買過帆布袋的會員',
          difficulty: 2,
          scenario: '行銷主管想做交叉銷售推廣，需要一份「有買保溫杯、但沒買過帆布袋」的會員名單。這是筆試第二題。',
          prompt: `找出「曾在 completed 訂單中購買過\`保溫杯\`，但從未購買過\`帆布袋\`」的會員。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- 用 \`NOT EXISTS\` 或 \`NOT IN\` 實作排除邏輯

**回傳欄位：** \`customer_id\`, \`name\`, \`email\`

**排序：** \`customer_id ASC\``,
          starter: '',
          answer: `SELECT DISTINCT
  c.customer_id,
  c.name,
  c.email
FROM customers c
JOIN orders     o  ON o.customer_id  = c.customer_id AND o.status = 'completed'
JOIN order_items oi ON oi.order_id   = o.order_id
JOIN products   p  ON p.product_id   = oi.product_id AND p.category = '保溫杯'
WHERE NOT EXISTS (
  SELECT 1
  FROM orders      o2
  JOIN order_items oi2 ON oi2.order_id  = o2.order_id
  JOIN products    p2  ON p2.product_id  = oi2.product_id
  WHERE o2.customer_id = c.customer_id
    AND o2.status      = 'completed'
    AND p2.category    = '帆布袋'
)
ORDER BY c.customer_id;`,
          hints: [],
          explanation: `**思路拆解：**
1. 先找「買過保溫杯」的會員（外層 JOIN）
2. 再用 NOT EXISTS 排除「也買過帆布袋」的人

**常見扣分點：**
- 外層忘加 \`DISTINCT\`，同一個人買了 3 次保溫杯就出現 3 列
- NOT EXISTS 子查詢裡沒有 \`WHERE o2.customer_id = c.customer_id\`（忘了關聯外層）
- 用 NOT IN 時沒處理 NULL（如果子查詢回傳 NULL，NOT IN 的結果也是 NULL，導致篩不到任何人）

**追問方向：**
- 「NOT EXISTS 和 NOT IN 在有 NULL 的情況下行為一樣嗎？」`,
          negatives: [
            `SELECT DISTINCT c.customer_id, c.name, c.email FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.category = '保溫杯' AND p.category != '帆布袋' ORDER BY c.customer_id;`,
            `SELECT c.customer_id, c.name, c.email FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id AND p.category = '保溫杯' WHERE NOT EXISTS (SELECT 1 FROM orders o2 JOIN order_items oi2 ON oi2.order_id = o2.order_id JOIN products p2 ON p2.product_id = oi2.product_id WHERE o2.status = 'completed' AND p2.category = '帆布袋') ORDER BY c.customer_id;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u01.l01.e03',
          title: '找出高於全體平均客單價的會員',
          difficulty: 2,
          scenario: '面試官說：「我們想知道哪些會員的平均消費能力比整體高，這些人值得做 VIP 分級。請用你覺得最清楚的寫法。」',
          prompt: `計算每位會員的**平均訂單金額**，找出高於**全體會員平均客單價**的會員。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`avg_order_value\`：該會員所有 completed 訂單的 \`total_amount\` 平均，ROUND 至整數
- 比較對象是「全體 completed 訂單的整體平均金額」（不是個人平均的平均）

**回傳欄位：** \`customer_id\`, \`name\`, \`avg_order_value\`

**排序：** \`avg_order_value DESC\``,
          starter: '',
          answer: `WITH cust_avg AS (
  SELECT
    customer_id,
    ROUND(AVG(total_amount)) AS avg_order_value
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  ca.customer_id,
  c.name,
  ca.avg_order_value
FROM cust_avg ca
JOIN customers c ON c.customer_id = ca.customer_id
WHERE ca.avg_order_value > (
  SELECT AVG(total_amount)
  FROM orders
  WHERE status = 'completed'
)
ORDER BY avg_order_value DESC;`,
          hints: [],
          explanation: `**兩層計算的思路：**
- 第一層：每位會員的平均（GROUP BY customer_id）
- 第二層：全體的平均（整張表的 AVG，無 GROUP BY）
- 過濾條件：個人平均 > 全體平均

**常見扣分點：**
- 把「個人平均的平均」（AVG(AVG(total_amount))）當成全體平均，這是錯的
- 子查詢放在 HAVING 而不是 WHERE（HAVING 可以，但需要重新寫聚合函數）
- 比較方向寫反（>= vs >，以及業務定義是否包含等於）

**追問方向：**
- 「如果改用視窗函數，不用 CTE，能做嗎？」（AVG(...) OVER () 不加 PARTITION BY 即為整體平均）`,
          negatives: [
            `WITH cust_avg AS (SELECT customer_id, ROUND(AVG(total_amount)) AS avg_order_value FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT ca.customer_id, c.name, ca.avg_order_value FROM cust_avg ca JOIN customers c ON c.customer_id = ca.customer_id WHERE ca.avg_order_value > (SELECT AVG(avg_order_value) FROM cust_avg) ORDER BY avg_order_value DESC;`,
            `SELECT o.customer_id, c.name, ROUND(AVG(o.total_amount)) AS avg_order_value FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE o.status = 'completed' GROUP BY o.customer_id, c.name HAVING AVG(o.total_amount) > AVG(AVG(o.total_amount)) ORDER BY avg_order_value DESC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u01.l01.e04',
          title: '找出每筆訂單金額高於該會員自身歷史平均的訂單',
          difficulty: 2,
          scenario: '面試官說：「我想找出哪些訂單是這個人破紀錄的消費，也就是這筆訂單金額超過他自己的歷史平均。請用視窗函數實作。」',
          prompt: `找出每筆 \`completed\` 訂單中，\`total_amount\` **高於該顧客自身歷史平均金額**的訂單。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`cust_avg\`：該顧客所有 completed 訂單的平均（用視窗函數計算），ROUND 整數
- 過濾：\`total_amount > cust_avg\`

**回傳欄位：** \`order_id\`, \`customer_id\`, \`order_date\`, \`total_amount\`, \`cust_avg\`

**排序：** \`customer_id ASC\`, \`order_date ASC\``,
          starter: '',
          answer: `WITH base AS (
  SELECT
    order_id,
    customer_id,
    order_date,
    total_amount,
    ROUND(AVG(total_amount) OVER (PARTITION BY customer_id)) AS cust_avg
  FROM orders
  WHERE status = 'completed'
)
SELECT order_id, customer_id, order_date, total_amount, cust_avg
FROM base
WHERE total_amount > cust_avg
ORDER BY customer_id ASC, order_date ASC;`,
          hints: [],
          explanation: `**為什麼不能直接在 WHERE 用視窗函數？**

視窗函數在 SQL 執行順序中屬於 SELECT 階段，WHERE 在此之前就跑完了，所以 \`WHERE total_amount > AVG(...) OVER (...)\` 會報語法錯誤。解法：把視窗函數放在 CTE 或子查詢裡，外層再 WHERE 過濾。

**常見扣分點：**
- 直接寫 \`WHERE total_amount > AVG(total_amount) OVER (PARTITION BY customer_id)\`（報錯）
- 漏掉 \`PARTITION BY customer_id\`，變成全體平均而不是個人平均
- 用 GROUP BY 試圖做視窗函數的事（無法在保留每列明細的同時做聚合）

**追問方向：**
- 「PARTITION BY 和 GROUP BY 的差異是什麼？」`,
          negatives: [
            `SELECT order_id, customer_id, order_date, total_amount, ROUND(AVG(total_amount) OVER ()) AS cust_avg FROM orders WHERE status = 'completed' AND total_amount > AVG(total_amount) OVER (PARTITION BY customer_id) ORDER BY customer_id ASC, order_date ASC;`,
            `WITH base AS (SELECT order_id, customer_id, order_date, total_amount, ROUND(AVG(total_amount) OVER ()) AS cust_avg FROM orders WHERE status = 'completed') SELECT order_id, customer_id, order_date, total_amount, cust_avg FROM base WHERE total_amount > cust_avg ORDER BY customer_id ASC, order_date ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u01.l01.e05',
          title: '月營收趨勢與環比增長',
          difficulty: 2,
          scenario: '面試官說：「請用一個 SQL，算出每個月的 completed 訂單營收，以及和上個月相比的成長率（環比），結果按月份排序。」',
          prompt: `計算每月 \`completed\` 訂單的營收，並用 LAG 計算**月環比增長率**。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`revenue\`：當月 \`total_amount\` 加總，ROUND 整數
- \`prev_revenue\`：上個月的 revenue（用 LAG），沒有上月的顯示 NULL
- \`mom_pct\`：(revenue - prev_revenue) / prev_revenue × 100，ROUND 1 位小數，沒有上月的顯示 NULL

**回傳欄位：** \`month\`, \`revenue\`, \`prev_revenue\`, \`mom_pct\`

**排序：** \`month ASC\``,
          starter: '',
          answer: `WITH monthly AS (
  SELECT
    SUBSTR(order_date, 1, 7)   AS month,
    ROUND(SUM(total_amount))   AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY SUBSTR(order_date, 1, 7)
)
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month)                                          AS prev_revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0
    / LAG(revenue) OVER (ORDER BY month),
    1
  )                                                                           AS mom_pct
FROM monthly
ORDER BY month ASC;`,
          hints: [],
          explanation: `**結構拆解：**
- CTE 先彙總到月份層級（SUBSTR 取 YYYY-MM）
- 外層用 LAG(revenue) OVER (ORDER BY month) 取上月值
- 增長率 = (本月 - 上月) × 100.0 / 上月，乘以 1.0 避免整數除法

**常見扣分點：**
- 整數除法：(revenue - prev_revenue) / prev_revenue 在 SQLite 中是整數除法，結果永遠是 0 或 -1；要乘以 \`100.0\` 或 \`1.0\` 強制轉成浮點
- LAG 的排序寫成 \`ORDER BY month DESC\` 取到的是下個月，而非上個月
- 在 CTE 以外直接用 LAG 但沒有先彙總月份，導致視窗在訂單層級運算

**追問方向：**
- 「如果要改成季環比，你的 SQL 要怎麼調？」
- 「LAG 和 LEAD 的差別是什麼？」`,
          negatives: [
            `WITH monthly AS (SELECT SUBSTR(order_date, 1, 7) AS month, ROUND(SUM(total_amount)) AS revenue FROM orders GROUP BY SUBSTR(order_date, 1, 7)) SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue, ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 / LAG(revenue) OVER (ORDER BY month), 1) AS mom_pct FROM monthly ORDER BY month ASC;`,
            `WITH monthly AS (SELECT SUBSTR(order_date, 1, 7) AS month, ROUND(SUM(total_amount)) AS revenue FROM orders WHERE status = 'completed' GROUP BY SUBSTR(order_date, 1, 7)) SELECT month, revenue, LAG(revenue) OVER (ORDER BY month DESC) AS prev_revenue, ROUND((revenue - LAG(revenue) OVER (ORDER BY month DESC)) * 100.0 / LAG(revenue) OVER (ORDER BY month DESC), 1) AS mom_pct FROM monthly ORDER BY month ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
