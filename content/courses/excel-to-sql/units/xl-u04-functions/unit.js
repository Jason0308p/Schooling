/**
 * 單元 4：Excel 常用函數 = SQL 函數
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'xl-u04',
  lessons: [
    {
      id: 'xl-u04-l01',
      title: 'IF、IFERROR、TEXT、CONCATENATE 的 SQL 翻譯',
      minutes: 20,
      objectives: [
        '把 Excel IF 改寫成 CASE WHEN',
        '把 IFERROR/IFNA 改寫成 COALESCE',
        '用 || 串接文字',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'xl.u04.l01.e01',
          title: '訂單狀態中文標籤',
          difficulty: 2,
          scenario: '客服主管：「訂單狀態都是英文，能不能給我中文版？completed=已完成、cancelled=已取消、refunded=已退款、其他=處理中。」',
          prompt: "從 `orders` 取出 `order_id`、`order_date`、`total_amount`，以及用 CASE WHEN 把 `status` 轉成中文標籤（欄位命名為 `status_label`）：`completed`→`已完成`、`cancelled`→`已取消`、`refunded`→`已退款`，其餘→`處理中`。只取前 20 筆。",
          starter: '',
          answer: "SELECT\n  order_id,\n  order_date,\n  total_amount,\n  CASE status\n    WHEN 'completed' THEN '已完成'\n    WHEN 'cancelled' THEN '已取消'\n    WHEN 'refunded' THEN '已退款'\n    ELSE '處理中'\n  END AS status_label\nFROM orders\nLIMIT 20;",
          hints: [
            'CASE status WHEN ... THEN ... END',
            'ELSE 對應 Excel IF 的「否則」',
          ],
          explanation: 'CASE WHEN 是 SQL 的 IF/IFS。`CASE 欄位 WHEN 值 THEN 結果 … ELSE 預設 END` 是最簡潔的寫法，等同於 Excel 的 `IFS(status="completed","已完成",status="cancelled","已取消",...)`。',
          negatives: [
            "SELECT order_id, order_date, total_amount, CASE status WHEN 'completed' THEN '已完成訂單' WHEN 'cancelled' THEN '已取消' WHEN 'refunded' THEN '已退款' ELSE '處理中' END AS status_label FROM orders LIMIT 20;",
          ],
        },
        {
          id: 'xl.u04.l01.e02',
          title: '會員完整顯示名稱（處理 NULL）',
          difficulty: 2,
          scenario: '行銷：「顯示每位會員的「姓名（城市）」格式，沒有城市的就顯示「姓名（未填寫）」。」',
          prompt: "從 `customers` 取出 `customer_id`，以及用 `||` 串接 `name`、固定文字 `' ('`、`COALESCE(city, '未填寫')`、固定文字 `')'`，欄位命名為 `display_name`，依 `customer_id` 排序，只取前 15 筆。",
          starter: '',
          answer: "SELECT\n  customer_id,\n  name || ' (' || COALESCE(city, '未填寫') || ')' AS display_name\nFROM customers\nORDER BY customer_id\nLIMIT 15;",
          ordered: true,
          hints: [
            "COALESCE(city, '未填寫') — city 是 NULL 就換成「未填寫」",
            '|| 串接文字',
          ],
          explanation: "COALESCE 是 Excel `IFERROR` 的 SQL 版：第一個不是 NULL 的值就回傳。`name || ' (' || COALESCE(city, '未填寫') || ')'` 等同於 Excel 的 `=A2&\" (\"&IFERROR(B2,\"未填寫\")&\")\"`。",
          negatives: [
            "SELECT customer_id, name || ' (' || COALESCE(city, '未填寫') || ')' AS display_name FROM customers ORDER BY customer_id DESC LIMIT 15;",
          ],
        },
      ],
    },
  ],
};
