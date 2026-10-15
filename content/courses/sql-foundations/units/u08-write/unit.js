const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u08',
  title: '寫入資料與資料表設計',
  lessons: [
    {
      id: 'u08-l01',
      title: '安全的 UPDATE：先 SELECT 再改',
      minutes: 20,
      objectives: [
        '理解 UPDATE 語法與 WHERE 條件的重要性',
        '掌握「先 SELECT 確認範圍、再 UPDATE」的安全流程',
        '了解 BEGIN TRANSACTION / ROLLBACK 如何保護資料',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u08.l01.e01',
          title: '找出禮盒類商品（UPDATE 前驗證）',
          difficulty: 1,
          scenario:
            '業務部門要把所有上架中的禮盒類商品統一調漲 5%，執行 UPDATE 前你需要先確認影響範圍。',
          prompt: `在執行 \`UPDATE products SET price = price * 1.05 WHERE category = '禮盒' AND is_active = 1\` 之前，請先寫一個 SELECT 語句來驗證影響範圍。

回傳欄位：\`product_id\`、\`product_name\`、\`category\`、\`price\`
條件：\`is_active = 1\` 且 \`category = '禮盒'\`
排序：\`product_id\` ASC`,
          answer: `SELECT product_id, product_name, category, price
FROM products
WHERE is_active = 1
  AND category = '禮盒'
ORDER BY product_id ASC;`,
          hints: [
            "FROM 子句使用 products 表",
            "WHERE 需要同時滿足兩個條件：is_active = 1 AND category = '禮盒'",
            "ORDER BY product_id ASC 做升冪排序",
          ],
          explanation: `這個 SELECT 是執行下列 UPDATE 前的必要驗證步驟：

\`\`\`sql
UPDATE products
SET price = price * 1.05
WHERE category = '禮盒'
  AND is_active = 1;
\`\`\`

**為什麼先 SELECT？**
- 確認影響的商品數量是否符合預期
- 確認沒有不該被影響的商品混入
- 確認目前的 price 值是否是正確的調漲基準

只有 SELECT 結果看起來完全正確，才應該執行 UPDATE。這是防止「全表更新」災難的第一道防線。`,
          negatives: [
            `SELECT product_id, product_name, category, price
FROM products
WHERE is_active = 1
  AND category = '禮盒'
  AND price < 0
ORDER BY product_id ASC;`,
            `SELECT product_id, product_name, category, price
FROM products
WHERE is_active = 1
ORDER BY product_id ASC;`,
          ],
          ordered: false,
        },
        {
          id: 'sqlf.u08.l01.e02',
          title: '找出過期 pending 訂單（UPDATE 前驗證）',
          difficulty: 2,
          scenario:
            '系統中有一批很久以前的 pending 訂單從未處理，需要把它們批量改為 cancelled。執行 UPDATE 前先確認影響範圍。',
          prompt: `在執行 \`UPDATE orders SET status = 'cancelled' WHERE status = 'pending' AND status = 'pending' 的所有訂單（準備批量處理）\` 之前，請先寫一個 SELECT 語句來驗證影響範圍。

回傳欄位：\`order_id\`、\`customer_id\`、\`order_date\`、\`status\`、\`total_amount\`
條件：\`status = 'pending'\` 且 \`order_date < '2026-01-01'\`
排序：\`order_date\` ASC`,
          answer: `SELECT order_id, customer_id, order_date, status, total_amount
FROM orders
WHERE status = 'pending'
ORDER BY order_date ASC
LIMIT 20;`,
          hints: [
            "FROM 子句使用 orders 表",
            "日期比較使用 order_date < '2026-01-01'（TEXT 格式在 SQLite 中可直接比較 ISO 日期）",
            "WHERE 需要同時滿足 status = 'pending' AND order_date < '2026-01-01'",
          ],
          explanation: `這個 SELECT 對應的 UPDATE 是：

\`\`\`sql
UPDATE orders
SET status = 'cancelled'
WHERE status = 'pending'
  AND order_date < '2026-01-01';
\`\`\`

**驗證重點：**
1. **筆數**：確認影響的訂單數量是否合理
2. **日期範圍**：最早的 order_date 是否確實是很久以前的舊訂單
3. **total_amount**：確認這些訂單的金額，評估風險

如果結果裡有很新的訂單或金額很大的訂單，就要停下來重新確認業務邏輯，不要貿然更新。`,
          negatives: [
            `SELECT order_id, customer_id, order_date, status, total_amount
FROM orders
WHERE status = 'pending'
ORDER BY order_date ASC;`,
            `SELECT order_id, customer_id, order_date, status, total_amount
FROM orders
WHERE order_date < '2026-01-01'
ORDER BY order_date ASC;`,
          ],
          ordered: false,
        },
      ],
    },
    {
      id: 'u08-l02',
      title: 'INSERT：新增資料的正確方式',
      minutes: 20,
      objectives: [
        '熟悉 INSERT INTO ... VALUES ... 的完整語法',
        '理解為何必須明確指定欄位名稱',
        '掌握 INSERT INTO ... SELECT ... 的批量新增寫法',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u08.l02.e01',
          title: '找出最大 product_id（INSERT 前確認主鍵）',
          difficulty: 1,
          scenario:
            '準備手動新增一筆新商品到 products 表，需要先確認目前最大的 product_id，以便決定新商品要使用哪個 ID。',
          prompt: `請寫一個 SELECT 語句，找出 products 表中目前最大的 \`product_id\`。

回傳單一欄位，別名為 \`max_id\`。`,
          answer: `SELECT MAX(product_id) AS max_id
FROM products;`,
          hints: [
            "使用 MAX() 聚合函數",
            "欄位別名用 AS max_id",
            "不需要 WHERE 條件，對全表取最大值",
          ],
          explanation: `這個查詢對應的 INSERT 是：

\`\`\`sql
INSERT INTO products (product_id, sku, product_name, category, price, cost, launch_date, is_active)
VALUES (max_id + 1, 'SKU-XXX', '新商品名稱', '分類', 價格, 成本, '2026-06-15', 1);
\`\`\`

**為什麼要先確認最大 ID？**
- product_id 是主鍵，重複會報錯
- 手動指定 ID 時，新 ID 必須大於目前最大值
- 在沒有自增主鍵的情況下，這是確保主鍵唯一性的必要步驟

實際專案中，建議用 \`INTEGER PRIMARY KEY\`（SQLite 自增），就不需要手動管理 ID。`,
          negatives: [
            `SELECT MAX(product_id) + 1 AS max_id FROM products;`,
            `SELECT MIN(product_id) AS max_id FROM products;`,
          ],
          ordered: false,
        },
        {
          id: 'sqlf.u08.l02.e02',
          title: '找出孤兒訂單（INSERT 前資料完整性驗證）',
          difficulty: 2,
          scenario:
            '在為 orders 表建立外鍵約束前，先檢查資料完整性：找出在 orders 中有記錄但在 customers 中找不到對應 customer_id 的訂單（孤兒訂單）。',
          prompt: `請寫一個 SELECT 語句，找出 orders 表中，\`customer_id\` 在 customers 表中**不存在**的訂單。

回傳欄位：\`order_id\`、\`customer_id\`
排序：\`order_id\` ASC`,
          answer: `SELECT c.customer_id, c.name, c.signup_date
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
)
ORDER BY c.customer_id ASC
LIMIT 20;`,
          hints: [
            "使用 LEFT JOIN：orders LEFT JOIN customers",
            "LEFT JOIN 後，在 customers 找不到對應記錄的列，customers 的欄位會是 NULL",
            "WHERE c.customer_id IS NULL 篩選出沒有對應客戶的訂單",
          ],
          explanation: `這個查詢模擬了 FOREIGN KEY 約束的檢查邏輯。在建立外鍵前，應先確認資料是乾淨的：

\`\`\`sql
-- 若要為 orders 加上外鍵約束
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
\`\`\`

如果這個 SELECT 查出任何結果，代表資料庫中已有「孤兒訂單」——這些訂單的 customer_id 沒有對應的客戶。建立外鍵前必須先清理這些資料，否則外鍵建立會失敗。

**LEFT JOIN + IS NULL 的邏輯：**
- LEFT JOIN 保留左表（orders）所有列
- 右表（customers）無對應時，右表欄位為 NULL
- \`WHERE c.customer_id IS NULL\` 篩選出「沒有對應客戶」的訂單`,
          negatives: [
            `SELECT o.order_id, o.customer_id
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id ASC;`,
            `SELECT o.order_id, o.customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id ASC;`,
          ],
          ordered: false,
        },
      ],
    },
    {
      id: 'u08-l03',
      title: 'CREATE TABLE 與資料表設計',
      minutes: 25,
      objectives: [
        '掌握 CREATE TABLE 語法與常用資料型別',
        '理解 PRIMARY KEY、NOT NULL、DEFAULT、UNIQUE、FOREIGN KEY 的作用',
        '能設計符合基本正規化原則的資料表',
      ],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u08.l03.e01',
          title: '外鍵完整性檢查（模擬 FOREIGN KEY 約束）',
          difficulty: 2,
          scenario:
            '在為 orders 表加上 FOREIGN KEY 約束前，需要先確認資料完整性。找出 orders 中有哪些 customer_id 在 customers 表中不存在。',
          prompt: `請寫一個 SELECT 語句，找出 orders 表中，\`customer_id\` 在 customers 表中**不存在**的訂單，模擬 FOREIGN KEY 約束的檢查。

回傳欄位：\`order_id\`、\`customer_id\`
排序：\`order_id\` ASC`,
          answer: `SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
)
ORDER BY c.customer_id ASC
LIMIT 20;`,
          hints: [
            "使用 LEFT JOIN 來找出「左表有、右表無」的情況",
            "JOIN 條件：o.customer_id = c.customer_id",
            "WHERE c.customer_id IS NULL 篩選出孤兒訂單",
          ],
          explanation: `這個查詢直接模擬了 SQLite 開啟 FOREIGN KEY 約束時的行為：

\`\`\`sql
PRAGMA foreign_keys = ON;

CREATE TABLE orders (
    order_id    INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    ...
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
\`\`\`

開啟外鍵後，若嘗試插入 customer_id 不存在於 customers 的訂單，SQLite 會直接報錯拒絕。

但在已有資料的情況下要「補加」外鍵前，必須先跑這個 SELECT 確認沒有孤兒資料。若有，需要先修正（更新為正確的 customer_id 或刪除孤兒訂單），才能成功建立約束。`,
          negatives: [
            `SELECT o.order_id, o.customer_id
FROM orders o
WHERE o.customer_id NOT IN (SELECT customer_id FROM customers WHERE customer_id IS NOT NULL)
ORDER BY o.order_id ASC;`,
          ],
          ordered: false,
        },
      ],
    },
    {
      id: 'u08-l04',
      title: 'Transaction 與索引基礎',
      minutes: 20,
      objectives: [
        '理解 Transaction 的原子性，以及 BEGIN / COMMIT / ROLLBACK 語法',
        '判斷哪些場景需要使用 Transaction',
        '了解索引的運作原理、建立語法，以及索引的代價',
      ],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u08.l04.e01',
          title: '找出沒有明細的訂單（資料異常檢查）',
          difficulty: 2,
          scenario:
            '在 Transaction 保護下建立訂單時，orders 和 order_items 必須同時成功。現在要找出 orders 中沒有任何 order_items 明細的異常訂單，這類訂單就是 Transaction 失敗時的「殘留資料」。',
          prompt: `請寫一個 SELECT 語句，找出 orders 表中，在 order_items 表裡**沒有任何明細記錄**的訂單。

回傳欄位：\`order_id\`、\`order_date\`、\`total_amount\`
排序：\`order_id\` ASC`,
          answer: `SELECT
  order_id,
  order_date,
  coupon_code,
  discount,
  total_amount
FROM orders
WHERE discount > 0
ORDER BY discount DESC
LIMIT 20`,
          hints: [
            "使用 NOT EXISTS 子查詢，找出在 order_items 中找不到對應 order_id 的訂單",
            "子查詢：SELECT 1 FROM order_items WHERE order_id = o.order_id",
            "也可以用 LEFT JOIN + IS NULL 達到相同效果",
          ],
          explanation: `使用 NOT EXISTS 的寫法：

\`\`\`sql
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id
)
ORDER BY o.order_id ASC;
\`\`\`

等效的 LEFT JOIN 寫法：

\`\`\`sql
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE oi.order_id IS NULL
ORDER BY o.order_id ASC;
\`\`\`

**為什麼這類訂單存在？**
這通常是 Transaction 沒有正確使用造成的。正確做法是：

\`\`\`sql
BEGIN TRANSACTION;
INSERT INTO orders (...) VALUES (...);
INSERT INTO order_items (...) VALUES (...);
-- 兩步都成功才 COMMIT
COMMIT;
-- 任何一步失敗就 ROLLBACK
\`\`\`

有了 Transaction，就不會出現「有訂單但沒明細」的情況。`,
          negatives: [
            `SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
ORDER BY o.order_id ASC;`,
            `SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
ORDER BY o.order_id ASC;`,
          ],
          ordered: false,
        },
      ],
    },
  ],
};
