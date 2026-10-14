/**
 * 單元 0：認識資料庫與本課程
 * 欄位規格見 docs/CONTENT_GUIDE.md。id 一經發布不可改名。
 */
const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'u00',
  lessons: [
    {
      id: 'u00-l01',
      title: 'SQL 是什麼？資料庫怎麼組成',
      minutes: 10,
      objectives: ['理解資料庫、資料表、欄、列', '寫出第一個 SELECT', '分清楚 SQL 與 MySQL / BigQuery 的關係'],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'sqlf.u00.l01.e01',
          title: '看看會員資料長什麼樣',
          difficulty: 1,
          scenario: '你第一天上班，主管說：「先去看看會員資料表有哪些欄位，熟悉一下。」',
          prompt: '從 `customers` 資料表取出**所有欄位**，只要**前 10 筆**。',
          starter: 'SELECT ',
          answer: 'SELECT *\nFROM customers\nLIMIT 10;',
          hints: [
            '格式是：SELECT 要的欄位 FROM 資料表 LIMIT 筆數',
            '「所有欄位」用星號 * 表示',
          ],
          explanation:
            '`SELECT *` 代表全部欄位，`FROM customers` 指定資料表，`LIMIT 10` 限制只回傳 10 筆。\n\n' +
            '實務上第一次接觸一張表時，最常做的就是 `SELECT * ... LIMIT 10`：快速看欄位和資料長相，又不會一次撈出幾百萬筆把系統拖慢。',
          mistakes: ['把 LIMIT 寫在 FROM 前面，SQL 子句有固定順序', '表名拼錯成 customer（少了 s）'],
        },
      ],
    },
    {
      id: 'u00-l02',
      title: '認識練習資料：好禮客製電商',
      minutes: 12,
      objectives: ['認識 8 張資料表各代表什麼', '理解主鍵、外鍵、一對多關係', '知道 status 與 NULL 的意義'],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'sqlf.u00.l02.e01',
          title: '盤點行銷活動',
          difficulty: 1,
          scenario: '行銷經理：「我們今年跑了哪些活動？全部列給我看。」',
          prompt: '列出 `campaigns` 資料表的**全部資料**（所有欄位、所有列）。',
          starter: '',
          answer: 'SELECT *\nFROM campaigns;',
          hints: ['不需要 LIMIT，因為要全部的資料'],
          explanation:
            '不加 `LIMIT` 就會回傳整張表。`campaigns` 只有 8 筆，直接全撈沒問題。\n\n' +
            '但面對 `events` 這種動輒上千萬筆的表，實務上**一定**先加 LIMIT 看樣子。在 BigQuery 上，撈越多欄位、越多資料就**付越多錢**（按掃描量計費）。',
          mistakes: [],
        },
      ],
    },
    {
      id: 'u00-l03',
      title: '如何使用練習系統與 SQL 書寫慣例',
      minutes: 8,
      objectives: ['知道執行與送出的差別', '理解批改規則', '養成 SQL 書寫慣例'],
      body: md('./l03.md'),
      exercises: [
        {
          id: 'sqlf.u00.l03.e01',
          title: '照慣例寫一次',
          difficulty: 1,
          scenario: '同事要接手你的查詢，請你寫得整齊一點。',
          prompt: '取出 `products` 資料表的**所有欄位、所有列**。試著用「關鍵字大寫、每個子句一行、結尾加分號」的格式寫，並加一行 `--` 註解。',
          starter: '-- 查看所有商品\n',
          answer: '-- 查看所有商品\nSELECT *\nFROM products;',
          hints: ['註解不影響結果，有沒有寫都會判對，但請養成習慣'],
          explanation:
            '這題的重點是格式。批改只看結果，所以單行的 `select * from products` 也會判對。' +
            '但實際工作上，你的 SQL 會被同事讀、被自己三個月後重讀，**排版就是可讀性**。',
          mistakes: [],
        },
      ],
    },
  ],
};
