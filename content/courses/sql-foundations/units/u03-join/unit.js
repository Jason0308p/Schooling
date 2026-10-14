/**
 * 單元 3：多表關聯 JOIN
 * 欄位規格見 docs/CONTENT_GUIDE.md。id 一經發布不可改名。
 *
 * 出題前已用實際資料確認（資料集 v1）：每個商品都有賣出、每個活動都有造訪，
 * 所以「找沒賣過的商品」這類題會是 0 筆，不能出。LEFT JOIN 找缺漏改用「從未下單的會員」。
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u03',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'u03-l01',
      title: 'INNER JOIN：把兩張表接起來',
      minutes: 20,
      objectives: ['理解 JOIN 與 ON 的意思', '用別名與欄位前綴寫 JOIN', '在 JOIN 後使用 WHERE / GROUP BY', 'JOIN 之後檢查列數'],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u03.l01.e01',
          title: '6 月成交訂單與會員資料',
          difficulty: 1,
          scenario: '客服主管：「6 月的成交訂單，我要看每一張是誰下的、住哪個城市，方便安排物流。」',
          prompt:
            '找出 **2026 年 6 月**（6/1～6/30）、`status` 為 `completed` 的訂單，取出：\n\n' +
            '`order_id`、`order_date`（來自 `orders`），`name`、`city`（來自 `customers`）。',
          starter: 'SELECT \nFROM orders AS o\nJOIN customers AS c\n  ON ',
          answer:
            `SELECT o.order_id, o.order_date, c.name, c.city
FROM orders AS o
JOIN customers AS c
  ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
  AND o.order_date >= '2026-06-01'
  AND o.order_date < '2026-07-01';`,
          negatives: [
            `SELECT o.order_id, o.order_date, c.name, c.city FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE o.order_date >= '2026-06-01' AND o.order_date < '2026-07-01';`,
          ],
          hints: [
            '接起來的條件是 ON c.customer_id = o.customer_id',
            '欄位都加上別名前綴，例如 o.order_id、c.name',
            '篩選條件照舊寫在 WHERE：狀態和日期區間',
          ],
          explanation:
            '`JOIN` 把訂單和會員用 `customer_id` 接起來，之後的 `WHERE` 照常篩選。\n\n' +
            '漏掉 `status = completed` 會把退款、取消的訂單也列進來，物流會多寄東西。',
          mistakes: ['忘了 status 條件', '欄位沒加前綴，customer_id 之類的欄位會 ambiguous', '日期區間寫成 <= 2026-06-30（欄位含時間時會漏）'],
        },
        {
          id: 'sqlf.u03.l01.e02',
          title: '各城市成交營收',
          difficulty: 2,
          scenario: '電商經理：「想知道各城市的訂單數和營收，評估要不要在某個城市辦實體活動。」',
          prompt:
            '只計算 `completed` 訂單，依會員的 `city` 分組，回傳 `city`、訂單數 `order_count`、營收 `revenue`（`total_amount` 加總）。\n\n' +
            '不用處理城市為 NULL 或「臺北市／台北市」寫法不同的問題，照原樣分組即可（第 4 單元再清理）。',
          starter: '',
          answer:
            `SELECT
  c.city,
  COUNT(*)            AS order_count,
  SUM(o.total_amount) AS revenue
FROM orders AS o
JOIN customers AS c
  ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.city;`,
          negatives: [
            `SELECT c.city, COUNT(*) AS order_count, SUM(o.total_amount) AS revenue FROM orders o JOIN customers c ON c.customer_id = o.customer_id GROUP BY c.city;`,
          ],
          hints: ['城市在 customers，金額在 orders，需要 JOIN', '分組欄位是 c.city'],
          explanation:
            '先 JOIN 把城市帶進訂單，再 `WHERE` 篩成交、`GROUP BY` 依城市彙總。\n\n' +
            '結果裡會看到一列 `city` 是 NULL（沒填城市的會員），以及「台北市」和「臺北市」被分成兩列：這是資料品質問題，' +
            '不是你寫錯。實務上遇到要先跟需求方說明，再決定怎麼合併（第 4 單元會教）。',
          mistakes: ['沒有篩 status，營收被高估'],
        },
        {
          id: 'sqlf.u03.l01.e03',
          title: '廣告活動花費排行',
          difficulty: 2,
          scenario: '行銷經理：「今年各個廣告活動總共花了多少錢、帶來多少點擊？花最多的排最前面。」',
          prompt:
            '`ad_spend` 是每個活動每天一列。把它和 `campaigns` JOIN，依活動分組，回傳：\n\n' +
            '1. `campaign_name`\n2. `platform`\n3. 總花費 `total_cost`（`cost` 加總，**四捨五入到整數**）\n4. 總點擊 `total_clicks`\n\n' +
            '依 `total_cost` **由高到低**排序；花費相同時依活動編號 `campaign_id` 由小到大。',
          starter: '',
          answer:
            `SELECT
  c.campaign_name,
  c.platform,
  ROUND(SUM(a.cost)) AS total_cost,
  SUM(a.clicks)      AS total_clicks
FROM campaigns AS c
JOIN ad_spend  AS a
  ON a.campaign_id = c.campaign_id
GROUP BY c.campaign_id, c.campaign_name, c.platform
ORDER BY total_cost DESC, c.campaign_id;`,
          ordered: true,
          negatives: [
            `SELECT c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost, SUM(a.clicks) AS total_clicks FROM campaigns c JOIN ad_spend a ON a.campaign_id = c.campaign_id GROUP BY c.campaign_id, c.campaign_name, c.platform ORDER BY total_cost, c.campaign_id;`,
          ],
          hints: ['名稱在 campaigns，花費和點擊在 ad_spend', 'GROUP BY 要包含 SELECT 裡沒有被彙總的欄位', 'ORDER BY total_cost DESC, c.campaign_id'],
          explanation:
            '`campaigns` 是「一」、`ad_spend` 是「多」（一個活動對應很多天）。JOIN 後依活動分組，把每天的花費和點擊加總起來。\n\n' +
            '`GROUP BY c.campaign_id, c.campaign_name, c.platform` 把三個欄位都列出來：SELECT 裡沒有被彙總函數包住的欄位，都要出現在 GROUP BY。' +
            '用 `campaign_id` 分組可以避免兩個活動剛好同名時被誤併。',
          mistakes: ['忘了 DESC，結果由低到高', '只 GROUP BY campaign_name，漏掉 platform（SQLite 不會報錯，但寫法不嚴謹）'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u03-l02',
      title: 'LEFT JOIN：找出缺漏的資料',
      minutes: 25,
      objectives: ['理解 LEFT JOIN 保留左表全部', '用 LEFT JOIN + IS NULL 找缺漏', '分清楚條件放 ON 還是 WHERE', 'LEFT JOIN 後用 COUNT(右表主鍵)'],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u03.l02.e01',
          title: '註冊了卻從未下單的會員',
          difficulty: 1,
          scenario: 'CRM 專員：「想寄一封『首購優惠』給註冊了卻從來沒買過東西的人，給我名單。」',
          prompt: '找出**從未下過任何訂單**（不論訂單狀態）的會員，取出 `customer_id`、`name`、`signup_date`。',
          starter: '',
          answer:
            `SELECT c.customer_id, c.name, c.signup_date
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;`,
          negatives: [
            `SELECT c.customer_id, c.name, c.signup_date FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id = NULL;`,
            `SELECT c.customer_id, c.name, c.signup_date FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;`,
          ],
          hints: ['要用 LEFT JOIN，左邊是 customers', '右邊對不到的列，o.order_id 會是 NULL', 'NULL 要用 IS NULL，不能用 ='],
          explanation:
            '這是標準的 **anti-join** 模板：`LEFT JOIN ... WHERE 右表主鍵 IS NULL`。\n\n' +
            '用 INNER JOIN 會把沒訂單的會員整個丟掉，結果是 0 筆；寫成 `= NULL` 也是 0 筆，因為任何值跟 NULL 用 `=` 比較都不成立。',
          alternatives: [
            { sql: `SELECT customer_id, name, signup_date\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders);`, note: '用子查詢（第 5 單元會教）也能得到一樣的結果。注意 NOT IN 遇到子查詢結果含 NULL 時會整個失效，LEFT JOIN 寫法比較不容易踩雷' },
          ],
          mistakes: ['用 INNER JOIN，結果 0 筆', 'WHERE o.order_id = NULL，結果 0 筆', '用不一定有值的欄位（例如 o.coupon_code）判斷對不到'],
        },
        {
          id: 'sqlf.u03.l02.e02',
          title: '沒有成交過的會員',
          difficulty: 3,
          scenario: '行銷總監：「上一題是從沒下過單的人。但還有一種人是下過單、結果全部取消或退款。我要的是『沒有任何一張成交訂單』的所有會員，兩種人都算。」',
          prompt:
            '找出**沒有任何 `completed` 訂單**的會員（包含從未下單的，以及只有取消、退款、處理中訂單的），取出 `customer_id`、`name`、`membership_tier`。',
          starter: '',
          answer:
            `SELECT c.customer_id, c.name, c.membership_tier
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
 AND o.status = 'completed'
WHERE o.order_id IS NULL;`,
          negatives: [
            // 把 status 條件忘掉：只找到「從未下單」的人
            `SELECT c.customer_id, c.name, c.membership_tier FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;`,
            // 把 status 條件放 WHERE：會抓到「有成交、但另外也有取消單」的人，且同一人會重複出現
            `SELECT c.customer_id, c.name, c.membership_tier FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.status <> 'completed' OR o.order_id IS NULL;`,
          ],
          hints: [
            '用上一題的 anti-join 模板，但「對得上」的定義要改成：有一張成交訂單',
            '成交的條件放進 ON：ON ... AND o.status = \'completed\'',
            '最後一樣用 WHERE o.order_id IS NULL 找對不到的人',
          ],
          explanation:
            '關鍵在「**對得上**」的定義。這題要找的是「找不到成交訂單」的會員，所以 ON 裡除了鍵相等，還要加上 `o.status = \'completed\'`。' +
            '這樣只有成交的訂單會被接上，其他狀態的訂單視同「沒接上」，右表欄位變 NULL，再用 `WHERE o.order_id IS NULL` 撈出來。\n\n' +
            '如果把 status 放在 WHERE（`WHERE o.status <> \'completed\' ...`），那是在 JOIN 之後才過濾，找到的是「有一張非成交訂單的人」，' +
            '一個人有成交單、又有取消單也會被抓進來，而且會重複出現。這就是「條件放 ON 還是 WHERE」的差別。',
          alternatives: [
            { sql: `SELECT customer_id, name, membership_tier\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders WHERE status = 'completed');`, note: '子查詢寫法（第 5 單元）。意思更直白：「不在成交會員名單裡的人」' },
          ],
          mistakes: ['沒加 status 條件，只找到從未下單的人', 'status 條件放 WHERE，抓到錯的人而且重複出現'],
        },
        {
          id: 'sqlf.u03.l02.e03',
          title: '新會員的成交次數（含 0 次）',
          difficulty: 3,
          scenario: '成長團隊：「2026 年 4 月之後註冊的新會員，每個人成交了幾次？沒買過的也要在名單裡，顯示 0，我要看新會員的轉換狀況。」',
          prompt:
            '針對 `signup_date` 在 **2026-04-01（含）之後**註冊的會員，回傳 `customer_id`、`name`、成交訂單數 `completed_orders`（只算 `completed`）。\n\n' +
            '**沒有成交訂單的會員也必須出現在結果中，訂單數為 0。**',
          starter: '',
          answer:
            `SELECT
  c.customer_id,
  c.name,
  COUNT(o.order_id) AS completed_orders
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
 AND o.status = 'completed'
WHERE c.signup_date >= '2026-04-01'
GROUP BY c.customer_id, c.name;`,
          negatives: [
            // status 放 WHERE：沒有成交的新會員整批消失
            `SELECT c.customer_id, c.name, COUNT(o.order_id) AS completed_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE c.signup_date >= '2026-04-01' AND o.status = 'completed' GROUP BY c.customer_id, c.name;`,
            // COUNT(*)：沒有訂單的人被算成 1
            `SELECT c.customer_id, c.name, COUNT(*) AS completed_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' WHERE c.signup_date >= '2026-04-01' GROUP BY c.customer_id, c.name;`,
          ],
          hints: [
            '要保留沒有訂單的會員，所以用 LEFT JOIN，會員表在左邊',
            '成交的條件放 ON（右表的條件），註冊日期的條件放 WHERE（左表的條件）',
            '數訂單用 COUNT(o.order_id)，不要用 COUNT(*)',
          ],
          explanation:
            '這題同時考了兩個陷阱：\n\n' +
            '1. **右表的條件放 ON**：`o.status = \'completed\'` 放 ON，沒有成交訂單的會員還是會保留（右邊補 NULL）。放 WHERE 就會被濾掉，LEFT JOIN 等於變回 INNER JOIN。\n' +
            '2. **數筆數用右表主鍵**：沒有訂單的會員仍占一列（右邊全 NULL），`COUNT(*)` 會得到 1，`COUNT(o.order_id)` 才是 0。\n\n' +
            '左表的條件（註冊日期）放 WHERE 沒問題，因為它是在決定「要看哪些會員」。',
          mistakes: ['status 條件放 WHERE，零成交的會員全部消失', '用 COUNT(*)，零成交的會員變成 1'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u03-l03',
      title: '多表 JOIN 與重複計算的陷阱',
      minutes: 25,
      objectives: ['串接三張以上的表', '辨認一對多造成的重複計算', '只加總同一層的金額欄位', '用 COUNT(DISTINCT) 數單數與人數'],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u03.l03.e01',
          title: '各商品分類的成交營收',
          difficulty: 2,
          scenario: '商品企劃：「各個分類一年賣了多少錢？我要決定明年主打哪個分類。」',
          prompt:
            '只計算 `completed` 訂單，依商品 `category` 分組，回傳 `category` 與營收 `revenue`。\n\n' +
            '營收請用**明細層**計算：`quantity × unit_price` 加總。依 `revenue` **由高到低**排序，相同時依 `category` 由小到大。',
          starter: '',
          answer:
            `SELECT
  p.category,
  SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items AS oi
JOIN orders   AS o ON o.order_id   = oi.order_id
JOIN products AS p ON p.product_id = oi.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY revenue DESC, p.category;`,
          ordered: true,
          negatives: [
            // 用訂單層金額加總 → 一張訂單多個商品會重複計算
            `SELECT p.category, SUM(o.total_amount) AS revenue FROM order_items oi JOIN orders o ON o.order_id = oi.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' GROUP BY p.category ORDER BY revenue DESC, p.category;`,
            // 忘了篩成交
            `SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN orders o ON o.order_id = oi.order_id JOIN products p ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC, p.category;`,
          ],
          hints: [
            '從最細的 order_items 出發，接上 orders（拿狀態）和 products（拿分類）',
            '每個 JOIN 各自有 ON',
            '營收 = SUM(oi.quantity * oi.unit_price)',
          ],
          explanation:
            '分類在 `products`、狀態在 `orders`、數量和單價在 `order_items`，所以三張表都要接，從最細的明細表開始。\n\n' +
            '金額用**明細層**的 `quantity * unit_price` 加總，這是這個粒度下正確的金額。如果改用 `SUM(o.total_amount)`，' +
            '一張訂單有 3 個商品，就會被加 3 次，而且訂單金額還包含運費與折扣，不能直接歸給某個分類。',
          mistakes: ['用 SUM(o.total_amount)：重複計算', '沒篩 status'],
        },
        {
          id: 'sqlf.u03.l03.e02',
          title: '修正偏高的營收報表',
          difficulty: 3,
          scenario: '財務：「這份各城市營收報表，數字比我們對帳的大概多了一倍。是不是 SQL 有問題？」',
          prompt:
            '下面是同事寫的查詢（已放在編輯器裡），執行後營收明顯偏高。請**修正**它，讓它回傳正確的：\n\n' +
            '`city`、成交訂單數 `order_count`、營收 `revenue`（`total_amount` 加總），只算 `completed`。\n\n' +
            '提示：先執行看看，想想為什麼數字變大。',
          starter:
            `SELECT
  c.city,
  COUNT(*)            AS order_count,
  SUM(o.total_amount) AS revenue
FROM customers AS c
JOIN orders      AS o  ON o.customer_id = c.customer_id
JOIN order_items AS oi ON oi.order_id   = o.order_id
WHERE o.status = 'completed'
GROUP BY c.city;`,
          answer:
            `SELECT
  c.city,
  COUNT(*)            AS order_count,
  SUM(o.total_amount) AS revenue
FROM customers AS c
JOIN orders AS o
  ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.city;`,
          negatives: [
            `SELECT c.city, COUNT(*) AS order_count, SUM(o.total_amount) AS revenue FROM customers AS c JOIN orders AS o ON o.customer_id = c.customer_id JOIN order_items AS oi ON oi.order_id = o.order_id WHERE o.status = 'completed' GROUP BY c.city;`,
            // 只修訂單數、金額仍重複
            `SELECT c.city, COUNT(DISTINCT o.order_id) AS order_count, SUM(o.total_amount) AS revenue FROM customers AS c JOIN orders AS o ON o.customer_id = c.customer_id JOIN order_items AS oi ON oi.order_id = o.order_id WHERE o.status = 'completed' GROUP BY c.city;`,
          ],
          hints: [
            '比較 JOIN 前後的列數：訂單接上 order_items 之後，一張訂單會變成幾列？',
            '這題需要的欄位（城市、訂單金額、訂單狀態）在 customers 和 orders 就夠了',
            '不需要的 JOIN 直接拿掉',
          ],
          explanation:
            '`order_items` 比 `orders` 更細：一張訂單有幾個商品，JOIN 之後就變成幾列，每一列都帶著同一個 `total_amount`，加總時被重複計算。\n\n' +
            '**這題的正解是拿掉不需要的 JOIN**：城市、訂單金額、狀態都不需要商品明細，多接一張更細的表只會引入錯誤。\n\n' +
            '常見的「半修」是只把訂單數改成 `COUNT(DISTINCT o.order_id)`，訂單數是對了，但 `SUM(o.total_amount)` 仍然重複，營收還是錯的。' +
            '**判斷原則：金額屬於哪一層，就不要 JOIN 比它更細的表。**',
          mistakes: ['只改 COUNT(DISTINCT)，金額還是偏高', '不確定錯在哪時，先用 COUNT(*) 比較 JOIN 前後列數'],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'u03-l04',
      title: 'UNION：把結果縱向合併',
      minutes: 15,
      objectives: ['分清楚 JOIN（橫向）與 UNION（縱向）', '選對 UNION 與 UNION ALL', '用標籤欄做分段報表'],
      body: md('./l04.md'),
      exercises: [
        {
          id: 'sqlf.u03.l04.e01',
          title: '再行銷名單（不重複）',
          difficulty: 2,
          scenario: '行銷：「聖誕檔期要寄信給兩種人：所有金卡會員，以及 2026 年 4 月起有成交的會員。兩邊重疊的人只能寄一次。」',
          prompt:
            '合併以下兩個名單，**每位會員只出現一次**，只回傳 `customer_id`：\n\n' +
            '1. `membership_tier` 為 `金卡` 的會員（來自 `customers`）\n' +
            '2. 在 **2026-04-01（含）之後**有 `completed` 訂單的會員（來自 `orders`）',
          starter: '',
          answer:
            `SELECT customer_id
FROM customers
WHERE membership_tier = '金卡'

UNION

SELECT customer_id
FROM orders
WHERE status = 'completed'
  AND order_date >= '2026-04-01';`,
          negatives: [
            `SELECT customer_id FROM customers WHERE membership_tier = '金卡' UNION ALL SELECT customer_id FROM orders WHERE status = 'completed' AND order_date >= '2026-04-01';`,
          ],
          hints: ['兩個 SELECT 都只選 customer_id，中間用 UNION 連接', '要去除重複用 UNION，不是 UNION ALL'],
          explanation:
            '`UNION` 會把兩邊疊起來之後**去除完全重複的列**，所以既是金卡、近期又有購買的會員只會出現一次，這正好是「同一個人只寄一次」的需求。\n\n' +
            '換成 `UNION ALL` 會保留重複，同一人最多出現很多次（近期每買一張訂單就出現一次）。',
          alternatives: [
            { sql: `SELECT DISTINCT customer_id\nFROM (\n  SELECT customer_id FROM customers WHERE membership_tier = '金卡'\n  UNION ALL\n  SELECT customer_id FROM orders WHERE status = 'completed' AND order_date >= '2026-04-01'\n);`, note: '先 UNION ALL 再 DISTINCT，結果相同（子查詢第 5 單元會教）。直接用 UNION 比較簡潔' },
          ],
          mistakes: ['用 UNION ALL，名單重複'],
        },
        {
          id: 'sqlf.u03.l04.e02',
          title: 'B2B 與 B2C 營收對照',
          difficulty: 2,
          scenario: '老闆：「企業訂單和一般消費者訂單，營收各是多少？我要一張兩列的小表。」',
          prompt:
            '只計算 `completed` 訂單，回傳**兩列**，欄位為 `segment` 和 `revenue`（`total_amount` 加總）：\n\n' +
            '- `segment` 為 `b2b`：`sales_channel` 是 `b2b` 的訂單\n' +
            '- `segment` 為 `b2c`：`sales_channel` 不是 `b2b` 的訂單（官網加 LINE 商店）\n\n' +
            '標籤請照上面小寫的 `b2b`、`b2c` 寫。',
          starter: '',
          answer:
            `SELECT 'b2b' AS segment, SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
  AND sales_channel = 'b2b'

UNION ALL

SELECT 'b2c' AS segment, SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
  AND sales_channel <> 'b2b';`,
          negatives: [
            // 不合併 b2c：變成 3 列
            `SELECT sales_channel AS segment, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY sales_channel;`,
          ],
          hints: ['每一段各寫一個 SELECT，第一欄是自己寫的文字標籤，例如 \'b2b\' AS segment', '用 UNION ALL 疊起來'],
          explanation:
            '這是分段報表的標準寫法：**每一段各算一個查詢，用文字標籤欄標示，再用 `UNION ALL` 疊成一張表**。\n\n' +
            '這裡用 `UNION ALL` 而不是 `UNION`：兩列的標籤不同、本來就不會重複；而且就算金額剛好相同，`UNION` 也可能誤刪一列。' +
            '分段報表請養成用 `UNION ALL` 的習慣。\n\n' +
            '（第 4 單元學了 `CASE WHEN` 之後，這題可以只用一個查詢搭配 `GROUP BY` 完成。）',
          mistakes: ['直接 GROUP BY sales_channel，會是三列而不是兩列', '標籤大小寫與題目不同'],
        },
      ],
    },
  ],
};
