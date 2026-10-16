/**
 * 單元 1：Excel 欄位選取 = SQL SELECT
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'xl-u01',
  lessons: [
    {
      id: 'xl-u01-l01',
      title: 'SELECT、WHERE、ORDER BY：三個關鍵字取代滑鼠操作',
      minutes: 20,
      objectives: [
        '把「選欄位」對應到 SELECT',
        '把「篩選器」對應到 WHERE',
        '把「排序」對應到 ORDER BY',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'xl.u01.l01.e01',
          title: '商品目錄：選欄位',
          difficulty: 1,
          scenario: '行銷主管：「把商品名稱、分類、售價整理成一份清單給我，我要貼到簡報。」',
          prompt: '從 `products` 取出 `product_name`、`category`、`price`，全部商品都要。',
          starter: 'SELECT \nFROM products;',
          answer: 'SELECT product_name, category, price\nFROM products;',
          hints: ['欄位之間用逗號隔開', 'FROM 後面接資料表名稱'],
          explanation: '`SELECT 欄位1, 欄位2 FROM 表名` 就是 Excel 裡「選欄位複製」的 SQL 版本。欄位的順序由你決定。',
          negatives: [
            'SELECT product_name, category, price FROM products LIMIT 5;',
          ],
        },
        {
          id: 'xl.u01.l01.e02',
          title: '已完成訂單篩選',
          difficulty: 1,
          scenario: '財務：「只要已完成（completed）的訂單，幫我列出訂單編號、日期、金額。」',
          prompt: "從 `orders` 找出 `status` 是 `completed` 的訂單，取出 `order_id`、`order_date`、`total_amount`。",
          starter: '',
          answer: "SELECT order_id, order_date, total_amount\nFROM orders\nWHERE status = 'completed';",
          hints: ["WHERE 後面接條件", "文字值要用單引號：'completed'"],
          explanation: "WHERE 就是 Excel 篩選器。`status = 'completed'` 只留下狀態是「已完成」的列，其他都丟掉。",
          negatives: [
            "SELECT order_id, order_date, total_amount FROM orders WHERE status = 'cancelled';",
          ],
        },
        {
          id: 'xl.u01.l01.e03',
          title: '價格最高的 5 個商品',
          difficulty: 2,
          scenario: '業務：「給我最貴的 5 個商品，用來當企業客戶的推薦清單。」',
          prompt: '從 `products` 取出 `product_name`、`price`，依價格**由高到低**排序，只取前 **5** 筆。',
          starter: '',
          answer: 'SELECT product_name, price\nFROM products\nORDER BY price DESC\nLIMIT 5;',
          ordered: true,
          hints: ['ORDER BY price DESC 表示由大到小', 'LIMIT 5 只取前 5 筆'],
          explanation: 'Excel 需要點「Z→A」排序再手動刪掉後面的列。SQL 一行搞定：`ORDER BY price DESC LIMIT 5`。',
          negatives: [
            'SELECT product_name, price FROM products ORDER BY price LIMIT 5;',
          ],
        },
      ],
    },
  ],
};
