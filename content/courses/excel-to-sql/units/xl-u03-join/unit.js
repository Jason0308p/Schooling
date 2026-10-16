/**
 * 單元 3：Excel VLOOKUP = SQL JOIN
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'xl-u03',
  lessons: [
    {
      id: 'xl-u03-l01',
      title: 'INNER JOIN 和 LEFT JOIN：告別 VLOOKUP',
      minutes: 25,
      objectives: [
        '把 VLOOKUP 對應到 INNER JOIN',
        '理解 LEFT JOIN 保留找不到的列',
        '正確寫 ON 條件',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'xl.u03.l01.e01',
          title: '訂單帶出會員名稱',
          difficulty: 1,
          scenario: '客服主管：「訂單表裡只有 customer_id，我需要知道每張訂單是誰下的，把名字也帶出來。」',
          prompt: '把 `orders` 和 `customers` 用 `customer_id` 串起來，取出 `order_id`、`order_date`、`customers.name`、`total_amount`，只看 `status = \'completed\'` 的訂單，依 `order_date` 降冪排序，只取前 10 筆。',
          starter: '',
          answer: "SELECT o.order_id, o.order_date, c.name, o.total_amount\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nWHERE o.status = 'completed'\nORDER BY o.order_date DESC\nLIMIT 10;",
          ordered: true,
          hints: [
            'JOIN customers c ON o.customer_id = c.customer_id',
            '兩張表都有 customer_id，要用「表別名.欄位名」區分',
          ],
          explanation: '`JOIN … ON` 就是 VLOOKUP 的 SQL 版：「用 customer_id 在 customers 表裡查對應的資料」。`o` 和 `c` 是表別名，讓查詢更短。',
          negatives: [
            "SELECT o.order_id, o.order_date, c.name, o.total_amount FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = 'completed' ORDER BY o.order_date LIMIT 10;",
          ],
        },
        {
          id: 'xl.u03.l01.e02',
          title: '訂單明細帶出商品名稱',
          difficulty: 2,
          scenario: '財務：「我需要每筆訂單明細的商品名稱、數量、單價，方便對帳。」',
          prompt: '把 `order_items` 和 `products` 用 `product_id` 串起來，取出 `order_id`、`products.product_name`、`order_items.quantity`、`order_items.unit_price`，依 `order_id` 升冪排序，只取前 15 筆。',
          starter: '',
          answer: 'SELECT oi.order_id, p.product_name, oi.quantity, oi.unit_price\nFROM order_items oi\nJOIN products p ON oi.product_id = p.product_id\nORDER BY oi.order_id\nLIMIT 15;',
          ordered: true,
          hints: [
            'FROM order_items oi JOIN products p ON oi.product_id = p.product_id',
          ],
          explanation: 'order_items 只有 product_id（代號），用 JOIN 串上 products 表就能帶出商品名稱。這比 VLOOKUP 可靠：資料更新時不需要重新拖公式。',
          negatives: [
            'SELECT oi.order_id, p.product_name, oi.quantity, oi.unit_price FROM order_items oi JOIN products p ON oi.product_id = p.product_id ORDER BY oi.order_id DESC LIMIT 15;',
          ],
        },
        {
          id: 'xl.u03.l01.e03',
          title: '找出從未購買的會員',
          difficulty: 2,
          scenario: 'CRM 行銷：「找出從來沒有下過訂單的會員，我要寄喚回信。」',
          prompt: '用 `LEFT JOIN` 把 `customers` 和 `orders` 串起來，找出**沒有任何訂單**的會員，取出 `customer_id`、`name`、`email`。',
          starter: '',
          answer: 'SELECT c.customer_id, c.name, c.email\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nWHERE o.order_id IS NULL;',
          hints: [
            'LEFT JOIN 保留左表（customers）的所有列',
            '沒有訂單的會員：o.order_id IS NULL',
          ],
          explanation: 'INNER JOIN 只留兩張表都有的列（買過的人）。LEFT JOIN 保留所有會員，沒有對應訂單的欄位會是 NULL。再用 `WHERE o.order_id IS NULL` 就能篩出從未購買的人。',
          negatives: [
            'SELECT c.customer_id, c.name, c.email FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;',
          ],
        },
      ],
    },
  ],
};
