/**
 * 單元 1：查詢基礎 SELECT 與 WHERE
 * 欄位規格見 docs/CONTENT_GUIDE.md。id 一經發布不可改名。
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u01',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'u01-l01',
      title: 'SELECT：選欄位、算欄位、取別名',
      minutes: 20,
      objectives: ['只選需要的欄位', '用運算產生新欄位', '用 AS 取別名', '避開整數除法陷阱'],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u01.l01.e01',
          title: '商品價目表',
          difficulty: 1,
          scenario: '業務：「客戶要一份商品價目表，給我商品名稱、分類、價格就好。」',
          prompt: '從 `products` 取出 `product_name`、`category`、`price` 三個欄位（依此順序），全部商品都要。',
          starter: 'SELECT \nFROM products;',
          answer: 'SELECT product_name, category, price\nFROM products;',
          hints: ['欄位之間用逗號隔開', '最後一個欄位後面不要加逗號'],
          explanation: '列出需要的欄位、用逗號分隔即可。結果欄位的順序就是你寫的順序。',
          mistakes: ['最後一個欄位後面多一個逗號 → syntax error', '欄位順序跟題目不同（會判對但會提醒）'],
        },
        {
          id: 'sqlf.u01.l01.e02',
          title: '每個商品賺多少',
          difficulty: 1,
          scenario: '財務：「我想知道每個商品賣一個能賺多少錢。」',
          prompt: '從 `products` 取出 `product_name`、`price`、`cost`，以及**毛利**（`price - cost`），毛利欄位命名為 `gross_profit`。',
          starter: '',
          answer: 'SELECT\n  product_name,\n  price,\n  cost,\n  price - cost AS gross_profit\nFROM products;',
          hints: ['在 SELECT 裡直接寫 price - cost', '用 AS 取別名：price - cost AS gross_profit'],
          explanation: 'SELECT 可以直接放運算式。`AS gross_profit` 讓欄位名稱好讀，批改不看別名，但交付報表時請一定取。',
          mistakes: ['寫成 cost - price，結果變負數'],
        },
        {
          id: 'sqlf.u01.l01.e03',
          title: '毛利率排行',
          difficulty: 2,
          scenario: '財務：「毛利金額不好比較，給我毛利率，用百分比、小數一位。」',
          prompt:
            '從 `products` 取出 `product_name` 和**毛利率百分比** `margin_pct`。\n\n' +
            '毛利率 = (price - cost) ÷ price × 100，**四捨五入到小數第 1 位**。例如 52.345 → 52.3。',
          starter: 'SELECT\n  product_name,\n  \nFROM products;',
          answer: 'SELECT\n  product_name,\n  ROUND((price - cost) * 100.0 / price, 1) AS margin_pct\nFROM products;',
          hints: [
            'price 和 cost 都是整數，直接相除會變 0',
            '乘上 100.0（有小數點）讓運算變成小數運算',
            'ROUND(數值, 1) 四捨五入到小數第 1 位',
          ],
          explanation:
            '關鍵是**先乘 100.0 再除**：`(price - cost) * 100.0 / price`。只要運算中有一個小數，整個結果就是小數。\n\n' +
            '如果寫成 `(price - cost) / price * 100`，會先做整數除法得到 0，再乘 100 還是 0。',
          alternatives: [
            { sql: 'SELECT product_name, ROUND(1.0 * (price - cost) / price * 100, 1) AS margin_pct\nFROM products;', note: '先乘 1.0 轉成小數也可以' },
            { sql: 'SELECT product_name, ROUND(CAST(price - cost AS REAL) / price * 100, 1) AS margin_pct\nFROM products;', note: '用 CAST 明確轉型，意圖最清楚' },
          ],
          negatives: [
            'SELECT product_name, ROUND((price - cost) / price * 100, 1) AS margin_pct FROM products;',
          ],
          mistakes: ['整數除法得到全部 0', '忘記 ROUND 或 ROUND 位數不對'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u01-l02',
      title: 'WHERE：篩選資料與組合條件',
      minutes: 20,
      objectives: ['用比較運算子篩選', '正確比較日期區間', '組合 AND / OR，知道何時要加括號'],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u01.l02.e01',
          title: '金卡會員名單',
          difficulty: 1,
          scenario: 'CRM 專員：「下週要寄金卡會員專屬禮，給我金卡會員名單。」',
          prompt: '從 `customers` 找出 `membership_tier` 是 `金卡` 的會員，取出 `customer_id`、`name`、`city`。',
          starter: '',
          answer: "SELECT customer_id, name, city\nFROM customers\nWHERE membership_tier = '金卡';",
          hints: ['文字值要用單引號：\'金卡\''],
          explanation: '`WHERE 欄位 = \'值\'` 是最基本的篩選。文字一定要加單引號，否則資料庫會把「金卡」當成欄位名稱。',
          mistakes: ['用雙引號 "金卡"（在標準 SQL 裡雙引號代表欄位名稱）'],
        },
        {
          id: 'sqlf.u01.l02.e02',
          title: '12 月成交訂單',
          difficulty: 2,
          scenario: '營運主管：「把 2025 年 12 月所有已完成的訂單拉出來，我要對帳。」',
          prompt:
            '從 `orders` 找出 **2025 年 12 月**（12/1～12/31）且 `status` 為 `completed` 的訂單，' +
            '取出 `order_id`、`order_date`、`total_amount`。',
          starter: '',
          answer:
            "SELECT order_id, order_date, total_amount\nFROM orders\nWHERE order_date >= '2025-12-01'\n  AND order_date < '2026-01-01'\n  AND status = 'completed';",
          hints: ['三個條件都要成立，用 AND 串起來', "日期區間：order_date >= '2025-12-01' AND order_date < '2026-01-01'"],
          explanation:
            '日期用「大於等於起點、小於下一期起點」的左閉右開寫法，這樣不管欄位有沒有包含時間都正確。\n\n' +
            '對帳類需求要特別注意 `status`：退款和取消的訂單不應該算進營收。',
          alternatives: [
            { sql: "SELECT order_id, order_date, total_amount\nFROM orders\nWHERE order_date LIKE '2025-12%'\n  AND status = 'completed';", note: '用 LIKE 比對前綴也行，但無法使用索引，資料量大時較慢' },
          ],
          negatives: [
            "SELECT order_id, order_date, total_amount FROM orders WHERE order_date >= '2025-12-01' AND order_date < '2026-01-01';",
          ],
          mistakes: ["寫成 order_date <= '2025-12-31'：本題剛好對，但欄位含時間時會漏掉最後一天", '漏了 status 條件'],
        },
        {
          id: 'sqlf.u01.l02.e03',
          title: 'B2C 大單',
          difficulty: 2,
          scenario: '電商經理：「想看看一般消費者的大單：官網或 LINE 商店、已完成、實付 2000 元以上的訂單。」',
          prompt:
            '從 `orders` 找出同時符合以下條件的訂單，取出 `order_id`、`sales_channel`、`total_amount`：\n\n' +
            '- `status` 是 `completed`\n- `sales_channel` 是 `online_store` **或** `line_shop`\n- `total_amount` 大於等於 2000',
          starter: '',
          answer:
            "SELECT order_id, sales_channel, total_amount\nFROM orders\nWHERE status = 'completed'\n  AND (sales_channel = 'online_store' OR sales_channel = 'line_shop')\n  AND total_amount >= 2000;",
          hints: ['這題有 AND 也有 OR', '把兩個通路的 OR 條件用括號包起來'],
          explanation:
            'AND 的優先順序比 OR 高。沒有括號時，`A AND B OR C` 會被解讀成 `(A AND B) OR C`，' +
            '導致所有 LINE 商店的訂單（不管金額、不管狀態）都跑進結果。用括號明確表達「通路是兩者之一」。',
          alternatives: [
            { sql: "SELECT order_id, sales_channel, total_amount\nFROM orders\nWHERE status = 'completed'\n  AND sales_channel <> 'b2b'\n  AND total_amount >= 2000;", note: '因為通路只有三種，排除 b2b 也等價。但如果未來新增通路，這種寫法會悄悄把新通路算進去，明確列出比較安全' },
          ],
          negatives: [
            "SELECT order_id, sales_channel, total_amount FROM orders WHERE status = 'completed' AND sales_channel = 'online_store' OR sales_channel = 'line_shop' AND total_amount >= 2000;",
          ],
          mistakes: ['沒加括號，筆數會多很多'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u01-l03',
      title: 'IN、BETWEEN、LIKE 與 NULL',
      minutes: 20,
      objectives: ['用 IN 比對多個值', '用 LIKE 做模糊搜尋', '正確處理 NULL'],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u01.l03.e01',
          title: '非信用卡付款的訂單',
          difficulty: 1,
          scenario: '財務：「2026 年 6 月有哪些訂單是用 LINE Pay 或貨到付款？我要核對金流對帳單。」',
          prompt:
            '從 `orders` 找出 `order_date` 在 **2026 年 6 月**、且 `payment_method` 是 `line_pay` 或 `cod` 的訂單，' +
            '取出 `order_id`、`payment_method`、`total_amount`。（不限訂單狀態）',
          starter: '',
          answer:
            "SELECT order_id, payment_method, total_amount\nFROM orders\nWHERE order_date >= '2026-06-01'\n  AND order_date < '2026-07-01'\n  AND payment_method IN ('line_pay', 'cod');",
          hints: ["payment_method IN ('line_pay', 'cod')", '加上 6 月的日期區間'],
          explanation: '`IN (...)` 比一串 OR 好讀，而且跟其他 AND 條件組合時不用擔心括號問題。',
          mistakes: [],
        },
        {
          id: 'sqlf.u01.l03.e02',
          title: '保溫系列商品',
          difficulty: 1,
          scenario: '商品企劃：「冬季要推保溫系列，名稱裡有『保溫』兩個字的商品都列出來。」',
          prompt: '從 `products` 找出 `product_name` **包含**「保溫」的商品，取出 `product_id`、`product_name`、`price`。',
          starter: '',
          answer: "SELECT product_id, product_name, price\nFROM products\nWHERE product_name LIKE '%保溫%';",
          hints: ['「包含」要在前後都加 %'],
          explanation: '`%保溫%` 代表前後可以有任意文字。只寫 `保溫%` 就只會找到「保溫」開頭的商品。',
          mistakes: ["用 = '保溫' 只會找到名稱剛好是「保溫」的商品", '只在一邊加 %'],
        },
        {
          id: 'sqlf.u01.l03.e03',
          title: '資料不完整的會員',
          difficulty: 1,
          scenario: 'CRM 專員：「我要寄信請會員補資料，先找出沒填城市的人。」',
          prompt: '從 `customers` 找出 `city` 是空值（NULL）的會員，取出 `customer_id`、`name`、`email`。',
          starter: '',
          answer: 'SELECT customer_id, name, email\nFROM customers\nWHERE city IS NULL;',
          hints: ['NULL 不能用 = 比較'],
          explanation: '`city = NULL` 永遠不會成立（NULL 跟任何東西比較都是「未知」），要用 `IS NULL`。',
          mistakes: ['寫 city = NULL → 0 筆', "寫 city = '' → 空字串和 NULL 是不同的東西"],
        },
        {
          id: 'sqlf.u01.l03.e04',
          title: '高雄以外的投放名單',
          difficulty: 2,
          scenario: '行銷：「高雄門市活動另外處理，其他人都要寄電子報，沒填城市的也要寄。」',
          prompt:
            '從 `customers` 找出**不是住在 `高雄市`** 的會員，**包含 `city` 為 NULL 的人**，取出 `customer_id`、`city`。',
          starter: '',
          answer: "SELECT customer_id, city\nFROM customers\nWHERE city <> '高雄市'\n   OR city IS NULL;",
          hints: ["只寫 city <> '高雄市' 會漏掉 NULL", '再用 OR 把 IS NULL 的人加回來'],
          explanation:
            "`NULL <> '高雄市'` 的結果是「未知」而不是「真」，所以 NULL 的列會被 WHERE 濾掉。" +
            '需要包含 NULL 時，要明確寫 `OR city IS NULL`。\n\n這是實務上**最常讓數字對不起來**的原因之一。',
          alternatives: [
            { sql: "SELECT customer_id, city\nFROM customers\nWHERE COALESCE(city, '') <> '高雄市';", note: 'COALESCE 把 NULL 換成空字串再比較，第 4 單元會教' },
          ],
          negatives: [
            "SELECT customer_id, city FROM customers WHERE city <> '高雄市';",
          ],
          mistakes: ["只寫 city <> '高雄市'，筆數會少"],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u01-l04',
      title: 'ORDER BY、LIMIT 與 DISTINCT',
      minutes: 20,
      objectives: ['單欄與多欄排序', '用 ORDER BY + LIMIT 做排行', '用 DISTINCT 去除重複', '確定性排序'],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u01.l04.e01',
          title: '最貴的 5 個商品',
          difficulty: 1,
          scenario: '業務：「企業客戶預算比較高，推薦清單先給我最貴的 5 個商品。」',
          prompt:
            '從 `products` 取出**價格最高的 5 個**商品：`product_name`、`category`、`price`。\n\n' +
            '依價格由高到低排；**價格相同時依 `product_id` 由小到大**。',
          starter: '',
          answer: 'SELECT product_name, category, price\nFROM products\nORDER BY price DESC, product_id\nLIMIT 5;',
          ordered: true,
          hints: ['ORDER BY price DESC 由高到低', '第二個排序欄位：product_id（預設 ASC）', 'LIMIT 5'],
          explanation:
            '`ORDER BY price DESC, product_id` 先依價格降冪，同價時依 product_id 升冪。' +
            '決勝欄位可以確保第 5 名和第 6 名同價時，結果每次都一樣。',
          mistakes: ['忘記 DESC，拿到最便宜的 5 個', 'LIMIT 寫在 ORDER BY 前面 → syntax error'],
        },
        {
          id: 'sqlf.u01.l04.e02',
          title: '最近的企業訂單',
          difficulty: 2,
          scenario: 'B2B 業務主管：「最近的 10 張企業訂單給我，最新的在最上面。」',
          prompt:
            '從 `orders` 找出 `sales_channel` 為 `b2b` 的訂單，取出 `order_id`、`order_date`、`total_amount`。\n\n' +
            '依 `order_date` **由新到舊**；同一天的依 `order_id` **由大到小**。只要前 **10** 筆。',
          starter: '',
          answer:
            "SELECT order_id, order_date, total_amount\nFROM orders\nWHERE sales_channel = 'b2b'\nORDER BY order_date DESC, order_id DESC\nLIMIT 10;",
          ordered: true,
          hints: ['WHERE 篩選 → ORDER BY 排序 → LIMIT 取前幾筆', '兩個排序欄位都是 DESC，要各自寫'],
          explanation: '每個排序欄位都要各自指定方向：`ORDER BY order_date DESC, order_id DESC`。只在最後寫一次 DESC 的話，第一個欄位會是預設的 ASC。',
          negatives: [
            "SELECT order_id, order_date, total_amount FROM orders WHERE sales_channel = 'b2b' ORDER BY order_date, order_id DESC LIMIT 10;",
          ],
          mistakes: ['寫成 ORDER BY order_date, order_id DESC：order_date 會變成由舊到新'],
        },
        {
          id: 'sqlf.u01.l04.e03',
          title: '會員分佈在哪些城市',
          difficulty: 1,
          scenario: '行銷：「我們的會員分佈在哪些縣市？列出來就好，不用數量。」',
          prompt: '從 `customers` 列出所有**不重複**的 `city`，**排除 NULL**，依 `city` 排序（ASC）。',
          starter: '',
          answer: 'SELECT DISTINCT city\nFROM customers\nWHERE city IS NOT NULL\nORDER BY city;',
          ordered: true,
          hints: ['SELECT DISTINCT city', '排除 NULL：WHERE city IS NOT NULL'],
          explanation:
            '`DISTINCT` 去除重複。結果中你會看到「台北市」和「臺北市」同時出現，這就是資料不一致的問題，' +
            '真實的 CRM 資料幾乎一定有這種問題。第 4 單元會教你怎麼用 `REPLACE` 統一寫法。',
          mistakes: ['沒排除 NULL，結果多一列空值'],
        },
        {
          id: 'sqlf.u01.l04.e04',
          title: '金卡會員依城市整理',
          difficulty: 2,
          scenario: 'CRM 專員：「金卡名單請依城市分好，同城市的最新加入的放前面，方便分區業務認領。」',
          prompt:
            '從 `customers` 找出 `金卡` 會員，取出 `name`、`city`、`signup_date`。\n\n' +
            '先依 `city` **由小到大**排序；同城市依 `signup_date` **由新到舊**；如果還相同，依 `customer_id` 由小到大。',
          starter: '',
          answer:
            "SELECT name, city, signup_date\nFROM customers\nWHERE membership_tier = '金卡'\nORDER BY city, signup_date DESC, customer_id;",
          ordered: true,
          hints: ['ORDER BY 可以放不在 SELECT 裡的欄位（例如 customer_id）', 'city ASC, signup_date DESC, customer_id ASC'],
          explanation:
            '`ORDER BY` 可以使用沒有出現在 SELECT 的欄位，所以 `customer_id` 可以只用來決勝、不顯示。\n\n' +
            '注意 city 為 NULL 的會員：在 SQLite 中 NULL 排在最前面。',
          mistakes: ['忘記 signup_date 要 DESC'],
        },
      ],
    },
  ],
};
