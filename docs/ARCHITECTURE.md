# 系統架構

## 一句話

**純前端靜態網站。**SQLite（sql.js，WebAssembly）在瀏覽器裡跑，課程內容是一般檔案，學習進度存 localStorage。沒有伺服器端程式，所以可以放到任何靜態主機（Cloudflare Pages、GitHub Pages、Netlify、S3）。

## 為什麼這樣設計

| 決策 | 選擇 | 理由 | 放棄了什麼 |
|---|---|---|---|
| 資料庫在哪跑 | 瀏覽器內 SQLite（sql.js） | 免安裝、免伺服器、零營運成本、離線可用、學員弄壞資料也不影響別人 | 不能練 PostgreSQL / BigQuery 專屬語法（用「方言差異」說明補足） |
| 前端框架 | 不用框架，原生 ES Modules | 沒有建置步驟（不用 npm install / build），任何人改完存檔就生效；元件數量少，框架的好處不明顯 | 元件很多以後，狀態管理會變麻煩（見下方「何時該換框架」） |
| 課程內容格式 | 課文 `.md` + 題目 `.js` | 課文用 Markdown 好寫；題目是結構化資料，放 JS 可以有註解、正規表示式（rules） | 非工程師要改題目時，要看得懂 JS 物件格式 |
| 路由 | Hash 路由（`#/learn/...`） | 靜態主機不需要設定 rewrite 規則 | 網址比較醜；SEO 較差（課程頁本來就不需要被搜尋引擎逐頁收錄） |
| 第三方套件 | 下載到 `src/vendor/` | 不依賴外部 CDN，離線可用、不會因為 CDN 改版壞掉 | 升級要手動換檔 |
| 批改方式 | 執行標準答案 vs 執行學員答案，比對結果 | 寫法不同但結果對就算對；改資料不會讓題目失效 | 少數題目需要額外規則（rules）限制寫法 |

## 分層

```text
┌──────────────────────────────────────────────────────────┐
│ content/  課程內容（純資料，不含畫面邏輯）                 │
│   catalog.js → course.js → unit.js + lXX.md               │
│   datasets/ecommerce/index.js（表結構 + 產生資料的函式）   │
└───────────────▲──────────────────────────────────────────┘
                │ import / fetch
┌───────────────┴──────────────────────────────────────────┐
│ src/core/  引擎（不碰 DOM 的邏輯；大部分能在 Node 跑）     │
│   sqlEngine.js       包裝 sql.js：建資料庫、快照、執行      │
│   grader.js          批改（純函式，Node 驗證工具共用）      │
│   errorTranslator.js 錯誤訊息翻譯                         │
│   progressStore.js   學習進度（Store + StorageAdapter）     │
│   courseRegistry.js  載入課程、攤平課程地圖、統計          │
│   markdown.js        課文 Markdown → HTML（純函式）        │
│   router.js          Hash 路由                            │
└───────────────▲──────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────┐
│ src/ui/  畫面                                             │
│   shell.js           頂部導覽列                            │
│   views/             一個路由一個檔案：home / course /     │
│                      lesson / playground / data / progress │
│   components/        可重用元件：sqlEditor / resultTable / │
│                      exerciseCard / schemaDrawer /         │
│                      runnableExample                       │
│   dom.js             h() 建立元素、icon、toast             │
└───────────────▲──────────────────────────────────────────┘
                │
           src/main.js  建立 app 物件、啟動路由
```

**規則：依賴只能往上指。**`core` 不 import `ui`；`content` 不 import `src`（除了驗證工具）。`grader.js` 和 `markdown.js` 不能碰 `window` / `document`，因為 `tools/validate-content.mjs` 在 Node 裡用它們。

## app 物件

`main.js` 建立一個 `app`，傳給每個畫面，畫面只透過它取用共用服務：

| 成員 | 用途 |
|---|---|
| `app.config` | `src/config.js` 的設定 |
| `app.progress` | `ProgressStore`：答題紀錄、草稿、連續天數 |
| `app.prefs` | 偏好設定（主題、練習場草稿），跟進度分開存 |
| `app.getCourse(id)` | 載入課程（含所有已發布單元與資料集），有快取 |
| `app.openSchema()` | 打開右側資料表參考面板 |
| `app.openInPlayground(sql)` | 帶著一段 SQL 跳到練習場 |
| `app.toggleTheme()` | 切換深色 / 淺色 |

## 資料庫生命週期

```text
啟動 → initEngine() 載入 sql-wasm.wasm
     → ensureDataset(dataset)：建一次資料庫 → db.export() 存成快照（約 1.4 MB 的 Uint8Array）
練習題「執行」/「送出」→ openFresh()：從快照開全新資料庫 → 跑 → close()
練習場 → workspace()：長駐資料庫，可以被修改；「重置」= 關掉重開
```

從快照開新資料庫只要幾毫秒，所以每次批改都用乾淨的資料庫，學員就算下 `DELETE` 也不會影響下一題。

## 批改流程（grader.js）

```text
學員 SQL ─執行→ actual ┐
                       ├→ grade() → { correct, code, message, detail, notes }
標準答案 ─執行→ expected┘
```

依序檢查，第一個不符合就回傳：

1. 空白 → `empty_sql`
2. 執行錯誤 → `error`（交給 errorTranslator 翻成中文）
3. 沒有回傳結果表 → `no_result`
4. 欄位數不同 → `col_count`（附上預期的欄位名稱）
5. 列數不同 → `row_count`（附上可能原因）
6. 值不同 → 先試著重排欄位順序（欄位對但順序錯 → 判對但提醒 `ok_col_order`）；`ordered` 題若只是順序錯 → `order`；否則 `values`
7. 結果全對但違反 `rules`（例如規定要用 HAVING）→ `rule`

數值比較前四捨五入到小數 2 位；欄位別名不比；`ordered: false` 時列順序不比。

## 進度資料結構（localStorage `sqlte.progress.v1`）

```json
{
  "schema": 1,
  "exercises": { "sqlf.u01.l01.e03": { "status": "solved", "attempts": 3, "revealed": false, "solvedAt": "…", "draft": "SELECT …" } },
  "lessons":   { "sql-foundations/u01-l01": { "visitedAt": "…", "completedAt": "…" } },
  "activity":  { "2026-10-14": 12 },
  "last":      { "courseId": "sql-foundations", "lessonId": "u01-l01", "at": "…" }
}
```

- **改資料結構**：`schema` 加 1，在 `ProgressStore.migrate()` 寫轉換，舊資料不能丟。
- **換儲存方式**（例如要做帳號、雲端同步）：寫一個新的 Adapter（實作 `load()` / `save()` / `clear()`），在 `main.js` 換掉 `LocalStorageAdapter`，畫面程式完全不用改。

## 擴充點

| 想做的事 | 改哪裡 | 需要改程式嗎 |
|---|---|---|
| 新增一課 / 一題 | `content/courses/<課程>/units/<單元>/` | 不用 |
| 開放一個「即將推出」的單元 | 建資料夾 + 在 `course.js` 把 status 改成 published、加 load | 不用 |
| 新增一門課 | `content/courses/<新課程>/` + `catalog.js` 加一筆 | 不用 |
| 新的練習資料集 | `content/datasets/<名稱>/index.js`，課程的 `dataset` 指過去 | 不用 |
| 新的錯誤訊息翻譯 | `src/core/errorTranslator.js` 加規則 | 改一行 |
| 新頁面 | `src/ui/views/` 加檔案 + `main.js` 加路由 | 要 |
| 付費牆 / 帳號 / 雲端進度 | 見 `docs/ROADMAP.md` | 要，但已預留介面 |

## 何時該換框架 / 加建置流程

出現以下任一項時，考慮改用 Vite + 框架（React / Svelte）：

- 需要登入、付款、多人共用狀態（有後端以後）
- 元件之間要同步的狀態變多，手動 re-render 開始出錯
- 需要 TypeScript 型別檢查課程內容格式

在那之前，零建置是優勢：任何人改完檔案存檔、重新整理就生效。
