/**
 * 單元 2：Excel 樞紐分析表 = SQL GROUP BY
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'xl-u02',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'xl-u02-l01',
      title: '樞紐分析表基礎：GROUP BY + 聚合函數',
      minutes: 20,
      objectives: [
        '把 Excel 樞紐分析表對應到 GROUP BY',
        '用 COUNT() 計數、SUM() 加總',
        '理解 GROUP BY 的執行邏輯',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'xl.u02.l01.e01',
          title: '各通路訂單數',
          difficulty: 1,
          scenario: '電商主管：「各銷售通路分別有幾張訂單？我要比較通路績效。」',
          prompt: '從 `orders` 計算每個 `sales_channel` 的訂單數，欄位命名為 `order_count`，依訂單數由多到少排序。',
          starter: '',
          answer: 'SELECT sales_channel, COUNT(*) AS order_count\nFROM orders\nGROUP BY sales_channel\nORDER BY order_count DESC;',
          ordered: true,
          hints: ['GROUP BY sales_channel 把同一通路的訂單分成一組', 'COUNT(*) 計算每組的列數'],
          explanation: '`GROUP BY sales_channel` 就是在樞紐分析表裡把「銷售通路」拉到列區域；`COUNT(*)` 就是值欄位選「計數」。',
          negatives: [
            'SELECT sales_channel, COUNT(*) AS order_count FROM orders GROUP BY sales_channel ORDER BY order_count;',
          ],
        },
        {
          id: 'xl.u02.l01.e02',
          title: '各會員等級人數',
          difficulty: 1,
          scenario: 'CRM 專員：「現在一般、銀卡、金卡各有幾個人？」',
          prompt: '從 `customers` 計算每個 `membership_tier` 的會員人數，欄位命名為 `member_count`。',
          starter: '',
          answer: 'SELECT membership_tier, COUNT(*) AS member_count\nFROM customers\nGROUP BY membership_tier;',
          hints: ['COUNT(*) 計算每組的人數'],
          explanation: 'GROUP BY + COUNT 是最常用的「分組計數」組合，等同於樞紐分析表的「計數」。',
          negatives: [
            "SELECT membership_tier, COUNT(*) AS member_count FROM customers WHERE membership_tier = '金卡' GROUP BY membership_tier;",
          ],
        },
        {
          id: 'xl.u02.l01.e03',
          title: '各月總營收',
          difficulty: 2,
          scenario: '財務：「列出每個月已完成訂單的總營收，只看完成的，依月份由舊到新排。」',
          prompt: "從 `orders` 計算每個月（格式：`YYYY-MM`）`status` 為 `completed` 的 `total_amount` 加總，欄位命名為 `revenue`，依月份升冪排序。",
          starter: '',
          answer: "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue\nFROM orders\nWHERE status = 'completed'\nGROUP BY month\nORDER BY month;",
          ordered: true,
          hints: [
            "strftime('%Y-%m', order_date) 把日期截成年月",
            'WHERE 要放在 GROUP BY 前面',
            'SUM(total_amount) 加總金額',
          ],
          explanation: '先用 WHERE 篩掉非完成訂單，再用 GROUP BY 按月分組，最後 SUM 加總。這就是 Excel「先篩選再做樞紐分析表」的 SQL 版本。',
          negatives: [
            "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY month ORDER BY month;",
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'xl-u02-l02',
      title: '篩選樞紐結果：HAVING 與多個聚合',
      minutes: 20,
      objectives: [
        '用 HAVING 過濾彙總後的結果',
        '理解 WHERE 和 HAVING 的差別',
        '同時計算多個聚合值',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'xl.u02.l02.e01',
          title: '高流量月份',
          difficulty: 2,
          scenario: '行銷：「只告訴我訂單數超過 100 張的月份，方便我找促銷效果好的時間點。」',
          prompt: "從 `orders` 計算每個月（`strftime('%Y-%m', order_date)`）的訂單數 `order_count`，只顯示 `order_count` **大於 100** 的月份，依訂單數由多到少排序。",
          starter: '',
          answer: "SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS order_count\nFROM orders\nGROUP BY month\nHAVING order_count > 100\nORDER BY order_count DESC;",
          ordered: true,
          hints: [
            'HAVING 放在 GROUP BY 後面',
            'HAVING order_count > 100 過濾彙總後的結果',
          ],
          explanation: 'HAVING 就是樞紐分析表裡的「值篩選器」：先把所有月份的訂單數算完，再把不符合的月份去掉。WHERE 是在彙總前篩資料列，HAVING 是在彙總後篩結果。',
          negatives: [
            "SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS order_count FROM orders GROUP BY month HAVING order_count > 100 ORDER BY month;",
          ],
        },
        {
          id: 'xl.u02.l02.e02',
          title: '通路績效全貌',
          difficulty: 2,
          scenario: '電商主管：「各通路的訂單數、總營收、平均客單價，只顯示已完成訂單，平均客單價四捨五入到整數。」',
          prompt: "從 `orders` 篩選 `status = 'completed'`，計算每個 `sales_channel` 的訂單數 `order_count`、總營收 `revenue`、平均客單價 `avg_order_value`（ROUND 到整數），依 `revenue` 由多到少排序。",
          starter: '',
          answer: "SELECT\n  sales_channel,\n  COUNT(*) AS order_count,\n  SUM(total_amount) AS revenue,\n  ROUND(AVG(total_amount), 0) AS avg_order_value\nFROM orders\nWHERE status = 'completed'\nGROUP BY sales_channel\nORDER BY revenue DESC;",
          ordered: true,
          hints: [
            'AVG() 計算平均值',
            'ROUND(值, 0) 四捨五入到整數',
            'SELECT 裡可以同時放多個聚合函數',
          ],
          explanation: '一個 GROUP BY 查詢可以同時輸出多個聚合欄位，等同於樞紐分析表「值區域」放了多個欄位。這就是 SQL 比 Excel 樞紐分析表更靈活的地方。',
          negatives: [
            "SELECT sales_channel, COUNT(*) AS order_count, SUM(total_amount) AS revenue, ROUND(AVG(total_amount), 0) AS avg_order_value FROM orders WHERE status = 'completed' GROUP BY sales_channel ORDER BY order_count DESC;",
          ],
        },
        {
          id: 'xl.u02.l02.e03',
          title: '高價值通路篩選',
          difficulty: 3,
          scenario: '行銷主管：「找出平均客單價超過 1500 的通路，只看已完成訂單。」',
          prompt: "從 `orders` 篩選 `status = 'completed'`，計算每個 `sales_channel` 的平均客單價，只保留平均客單價 **大於 1500** 的通路，依平均客單價由高到低排序。",
          starter: '',
          answer: "SELECT sales_channel, ROUND(AVG(total_amount), 0) AS avg_order_value\nFROM orders\nWHERE status = 'completed'\nGROUP BY sales_channel\nHAVING AVG(total_amount) > 1500\nORDER BY avg_order_value DESC;",
          ordered: true,
          hints: [
            'WHERE 篩資料列（彙總前），HAVING 篩彙總結果（彙總後）',
            'HAVING AVG(total_amount) > 1500',
          ],
          explanation: 'WHERE 不能用聚合函數（因為彙總還沒發生），要過濾彙總結果就用 HAVING。這是 SQL 初學者最常卡住的地方。',
          negatives: [
            "SELECT sales_channel, ROUND(AVG(total_amount), 0) AS avg_order_value FROM orders WHERE status = 'completed' GROUP BY sales_channel HAVING AVG(total_amount) > 500 ORDER BY avg_order_value DESC;",
          ],
        },
      ],
    },
  ],
};
