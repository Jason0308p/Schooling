# 課程內容撰寫指南

本文件說明怎麼新增或修改課程內容。**內容和程式是分開的**：寫課程不需要改 `src/` 底下任何檔案。

## 內容層級

```text
Catalog（課程目錄）       content/catalog.js
└─ Course（課程）         content/courses/<course-id>/course.js
   └─ Unit（單元）        content/courses/<course-id>/units/<uXX-名稱>/unit.js
      └─ Lesson（課）     unit.js 裡的 lessons[]，課文是同資料夾的 lXX.md
         └─ Exercise（題）lesson.exercises[]
```

## 鐵則：ID 發布後不能改

學員的進度是用 ID 記錄的。改了 ID，所有學員那一題 / 那一課的進度就消失了。

| 層級 | ID 格式 | 範例 |
|---|---|---|
| 單元 | `uXX` | `u03` |
| 課 | `uXX-lYY` | `u03-l02` |
| 題 | `<課程縮寫>.uXX.lYY.eZZ` | `sqlf.u03.l02.e01` |

可以改標題、內容、答案，**不要改 ID**。要刪掉一題就整題刪掉，不要把 ID 拿給別的題目用。

---

## 新增一課

1. 在單元資料夾新增課文：`units/u01-select/l05.md`
2. 在同資料夾 `unit.js` 的 `lessons` 陣列加一筆：

```js
{
  id: 'u01-l05',
  title: '課的標題',
  minutes: 20,                       // 預估學習時間（分）
  objectives: ['學習目標 1', '學習目標 2'],
  body: md('./l05.md'),              // 課文檔
  exercises: [ /* 見下方 */ ],
},
```

3. 跑 `node tools/validate-content.mjs`。

## 開放一個新單元（例如第 3 單元 JOIN）

1. 建資料夾 `content/courses/sql-foundations/units/u03-join/`，放 `unit.js` 和 `l01.md`…
2. `unit.js` 的格式照 `u01-select/unit.js`，`id: 'u03'`。
3. 在 `course.js` 找到 `u03` 那一筆：
   - `status: 'coming_soon'` → `status: 'published'`
   - 加上 `load: () => import('./units/u03-join/unit.js'),`
   - `outline` 可以刪掉（已發布的單元會顯示真正的課程清單）
4. 跑驗證工具。

## 新增一門課

1. 建 `content/courses/<新 id>/course.js`，格式照 `sql-foundations/course.js`。
2. 在 `content/catalog.js` 加一筆，要有 `load`。
3. 如果需要不同的練習資料，在 `content/datasets/` 建新資料集，`course.js` 的 `dataset` 指過去。

---

## 練習題欄位規格

```js
{
  id: 'sqlf.u01.l02.e03',          // 必填，發布後不可改
  title: 'B2C 大單',                // 必填，短標題
  difficulty: 2,                   // 必填，1 基礎 / 2 進階 / 3 挑戰
  scenario: '電商經理：「…」',      // 建議填：誰要、為什麼要（工作情境）
  prompt: '從 `orders` 找出…',      // 必填，Markdown，要精確寫出要哪些欄位、順序、排序方式
  starter: 'SELECT ',              // 選填，編輯器預設內容
  answer: 'SELECT …',              // 必填，標準答案
  ordered: true,                   // 選填，true = 列的順序也要比（題目有要求排序時才設）
  hints: ['提示 1', '提示 2'],       // 選填，由抽象到具體，一次顯示一個
  explanation: '解說…',            // 必填，Markdown，講「為什麼」，不只是「怎麼寫」
  alternatives: [                  // 選填，其他正確寫法（驗證工具會確認它們真的被判對）
    { sql: 'SELECT …', note: '這種寫法的優缺點' },
  ],
  negatives: [                     // 選填但強烈建議，常見錯誤寫法（驗證工具會確認它們被判錯）
    'SELECT … 少了括號的版本',
  ],
  mistakes: ['常見錯誤的文字說明'],   // 選填，顯示在解答區
  rules: [                         // 選填，結果正確之外的寫法限制
    { pattern: /\bHAVING\b/i, message: '這題要用 HAVING' },
    { pattern: /\bLIMIT\b/i, mustNot: true, message: '這題不能用 LIMIT' },
  ],
}
```

### 出題原則

1. **題目要能唯一決定結果。**寫清楚要哪些欄位、什麼順序、要不要排除 NULL、四捨五入到幾位。學員寫對了卻被判錯，是最傷信任的事。
2. **排序題一定要有決勝欄位。**「價格最高的 5 個」要寫「價格相同時依 product_id」，標準答案的 ORDER BY 也要包含它。
3. **每題都要有工作情境。**誰在要、要來做什麼。這是本課程跟語法教學網站的差別。
4. **把常見錯誤寫進 `negatives`。**例如整數除法、AND/OR 沒括號、漏掉 NULL。這能證明這題真的有在考那個觀念。
5. **難度循序：**每課 3～4 題，從 1 星到 2～3 星。
6. **不要在題目或課文寫死資料數字**（例如「答案是 513 筆」）。資料集改版時數字會變。

### 字串引號注意

`unit.js` 裡的字串用**單引號**，Markdown 的行內程式碼（反引號）就能直接寫：

```js
prompt: '從 `orders` 找出 `status` 為 `completed` 的訂單',
```

字串內容如果有單引號（例如 SQL 的 `'completed'`），改用雙引號包整個字串，或用 `\'` 跳脫。

---

## 課文 Markdown 支援的語法

| 語法 | 寫法 |
|---|---|
| 標題 | `## 大標`、`### 小標`（不要用 `#`，頁面標題已經是 h1） |
| 粗體 / 斜體 / 行內程式碼 / 連結 | `**粗**`、`*斜*`、`` `code` ``、`[文字](網址)` |
| 清單 | `- 項目` 或 `1. 項目` |
| 表格 | 標準 `\| a \| b \|` 格式（第二列是分隔線） |
| 純展示程式碼 | ` ```sql ` … ` ``` ` |
| **可執行範例** | ` ```sql run ` … ` ``` `（頁面上會有「執行」按鈕，驗證工具會檢查它能跑） |
| 提示框 | `> [!TIP] 標題` 接著每行 `> 內容` |

提示框類型：

| 類型 | 用途 | 顏色 |
|---|---|---|
| `TIP` | 小技巧、好習慣 | 綠 |
| `WARN` | 常見錯誤、陷阱 | 紅 |
| `BIZ` | 實務情境、為什麼業界這樣做 | 橘 |
| `DIALECT` | PostgreSQL / MySQL / BigQuery 寫法差異 | 藍 |
| `NOTE` | 補充說明 | 品牌色 |

### 課文寫作原則

- 一課 10～25 分鐘讀完。超過就拆成兩課。
- 每個觀念配一個 ` ```sql run ` 範例，讓學員馬上看到結果。
- 每課至少一個 `DIALECT` 框（如果該語法有差異），這是本課程的特色。
- 先講「為什麼需要」，再講「怎麼寫」，最後講「哪裡會錯」。

---

## 驗證

每次修改內容後：

```bash
node tools/validate-content.mjs
```

會檢查：ID 不重複、必填欄位、課文檔存在、所有可執行範例能跑、每題標準答案能跑且有結果、標準答案批改自己會通過、`alternatives` 會被判對、`negatives` 會被判錯、`ordered` 題有 ORDER BY。

全部通過才算完成。另外要在瀏覽器實際做一次新題目（至少答錯一次、答對一次），確認題目描述清楚。
