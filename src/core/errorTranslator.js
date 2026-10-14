/**
 * 把 SQLite 的英文錯誤訊息翻成白話中文 + 排錯建議。
 * 新增規則：在 RULES 加一筆 { test: RegExp, explain: (match) => ({ title, tip }) }。
 */
const RULES = [
  {
    test: /no such column: (.+)$/i,
    explain: (m) => ({
      title: `找不到欄位「${m[1]}」`,
      tip: '檢查欄位名稱拼字（可以打開右上角「資料表」查看）；如果欄位在別張表，要先 JOIN 那張表；字串值要用單引號 \'...\' 包起來，否則會被當成欄位名稱。',
    }),
  },
  {
    test: /no such table: (.+)$/i,
    explain: (m) => ({ title: `找不到資料表「${m[1]}」`, tip: '檢查表名拼字，本課程的表名都是英文小寫，例如 customers、orders。' }),
  },
  {
    test: /near "(.+?)": syntax error/i,
    explain: (m) => ({
      title: `語法錯誤，問題出在「${m[1]}」附近`,
      tip: '常見原因：關鍵字順序錯（正確順序是 SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT）、欄位之間少了逗號或多了逗號、括號沒有成對。',
    }),
  },
  {
    test: /incomplete input/i,
    explain: () => ({ title: 'SQL 沒有寫完', tip: '檢查括號或單引號是否成對，以及句子是否停在一半（例如 WHERE 後面沒寫條件）。' }),
  },
  {
    test: /unrecognized token: "(.+?)"/i,
    explain: (m) => ({ title: `無法辨識的符號「${m[1]}」`, tip: '常見原因：用了中文全形符號（，＝（）’），或字串用了雙引號 / 沒關好引號。SQL 的字串請用英文單引號 \'...\'。' }),
  },
  {
    test: /ambiguous column name: (.+)$/i,
    explain: (m) => ({ title: `欄位「${m[1]}」不明確`, tip: '多張表都有這個欄位名稱，要寫成「表名.欄位」或「別名.欄位」，例如 o.customer_id。' }),
  },
  {
    test: /misuse of aggregate/i,
    explain: () => ({ title: '彙總函數用錯地方', tip: 'COUNT / SUM / AVG 這類彙總函數不能放在 WHERE 裡。要篩選彙總後的結果，請用 HAVING。' }),
  },
  {
    test: /a GROUP BY clause is required before HAVING/i,
    explain: () => ({ title: 'HAVING 前面要有 GROUP BY', tip: 'HAVING 是篩選「分組後」的結果，必須搭配 GROUP BY 使用。' }),
  },
  {
    test: /wrong number of arguments to function (\w+)/i,
    explain: (m) => ({ title: `函數 ${m[1]} 的參數數量不對`, tip: '檢查括號裡面的參數個數，參數之間用逗號隔開。' }),
  },
  {
    test: /no such function: (\w+)/i,
    explain: (m) => ({
      title: `這個資料庫沒有 ${m[1]} 函數`,
      tip: '本課程使用 SQLite。有些函數名稱跟 MySQL / BigQuery 不同，例如日期要用 strftime() 或 date()，請參考該課的「方言差異」說明。',
    }),
  },
  {
    test: /UNIQUE constraint failed: (.+)$/i,
    explain: (m) => ({ title: `違反唯一性限制（${m[1]}）`, tip: '你要寫入的主鍵或唯一值已經存在了。' }),
  },
  {
    test: /NOT NULL constraint failed: (.+)$/i,
    explain: (m) => ({ title: `欄位 ${m[1]} 不能是空值`, tip: '這個欄位有 NOT NULL 限制，寫入時一定要給值。' }),
  },
  {
    test: /(\d+) values for (\d+) columns/i,
    explain: (m) => ({ title: `給了 ${m[1]} 個值，但有 ${m[2]} 個欄位`, tip: 'INSERT 的欄位清單和 VALUES 的數量要一致。' }),
  },
  {
    test: /SELECTs to the left and right of (UNION|UNION ALL|INTERSECT|EXCEPT) do not have the same number of result columns/i,
    explain: (m) => ({ title: `${m[1]} 兩邊的欄位數不同`, tip: '上下兩個 SELECT 必須回傳一樣多的欄位。' }),
  },
];

export function translateError(raw) {
  const msg = String(raw || '').replace(/^Error:\s*/, '');
  for (const r of RULES) {
    const m = msg.match(r.test);
    if (m) return { ...r.explain(m), raw: msg };
  }
  return { title: '執行時發生錯誤', tip: '閱讀下方原始錯誤訊息；若看不懂，先把 SQL 縮短成最小可執行的版本，再一段一段加回去。', raw: msg };
}
