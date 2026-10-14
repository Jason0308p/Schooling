# SQL 實戰營

互動式 SQL 線上課程。整個網站是**純靜態網頁**：資料庫（SQLite）直接在瀏覽器裡執行，不需要後端、不需要 Docker、不需要安裝資料庫。

- 課程：SQL 實戰分析：從零到能接需求（10 單元，規劃 92 題；目前開放第 0～2 單元、10 課、28 題）
- 練習資料：「好禮客製」模擬電商公司，8 張資料表，資料期間 2025-07-01 ～ 2026-06-30
- 批改：比對**查詢結果**而不是比對 SQL 字串，答錯會告訴你錯在哪一類，並附解說

---

## 怎麼開啟

**雙擊 `start.bat`。**瀏覽器會自動打開 `http://localhost:8090/`。要關掉網站，就關掉那個黑色視窗。

> 為什麼不能直接雙擊 `index.html`？
> 瀏覽器的安全規則不允許從本機檔案（`file://`）載入資料庫引擎（WebAssembly）和程式模組，所以需要一個本機小伺服器。`start.bat` 只是用 Python 開一個本機伺服器，不會連到外部網路。

需要：Python 3（你的電腦已經有）。

## 檔案在哪

```text
SQL_te/
├─ index.html            網站入口
├─ start.bat             本機啟動（雙擊）
├─ README.md             本文件
├─ CLAUDE.md             給 AI 助手看的專案說明
├─ package.json          npm 指令：npm run validate / npm run serve
├─ docs/                 詳細文件（見下表）
├─ src/                  網站程式
│  ├─ main.js            進入點
│  ├─ config.js          品牌名稱、功能開關
│  ├─ core/              引擎：資料庫、批改、進度、路由、Markdown
│  ├─ ui/                畫面：外框、各頁面、元件
│  ├─ styles/            樣式（tokens → base → components → views）
│  └─ vendor/            第三方套件（sql.js、CodeMirror，已下載到本地）
├─ content/              課程內容（跟程式完全分開）
│  ├─ catalog.js         課程目錄
│  ├─ courses/sql-foundations/
│  │  ├─ course.js       課程設定：單元順序、學習計畫、大綱
│  │  └─ units/u01-select/
│  │     ├─ unit.js      這個單元的課與練習題
│  │     └─ l01.md …     每一課的課文
│  └─ datasets/ecommerce/index.js   練習資料庫的結構與產生邏輯
└─ tools/
   ├─ validate-content.mjs   內容驗證（新增/修改課程後必跑）
   └─ serve.py               本機伺服器（不快取）
```

## 文件

| 文件 | 給誰看 | 內容 |
|---|---|---|
| [docs/CURRICULUM.md](docs/CURRICULUM.md) | 學員 / 課程規劃 | 完整課程大綱、學習進度、各單元目標 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 開發者 | 系統架構、資料流、各模組職責、設計決策 |
| [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) | 寫課程的人 | 怎麼新增課、題目、單元、課程，欄位規格 |
| [docs/DATASET.md](docs/DATASET.md) | 寫課程的人 | 練習資料表說明、資料特性、刻意埋的髒資料 |
| [docs/DEPLOY.md](docs/DEPLOY.md) | 要上線的人 | 部署到 Cloudflare Workers、Git 自動部署、疑難排解 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 決策者 | 商業化與擴充路線 |

## 常用指令

```bash
# 啟動本機網站（等同雙擊 start.bat）
python tools/serve.py 8090

# 驗證所有課程內容：每題標準答案能跑、批改器判對、常見錯誤寫法判錯、課文範例都能執行
node tools/validate-content.mjs
```

## 學習進度存在哪

存在**這台電腦這個瀏覽器**的 localStorage。換瀏覽器、換電腦、清除瀏覽器資料都會看不到。到「我的進度」頁可以匯出備份、匯入還原。

## 授權

- sql.js：MIT（`src/vendor/sqljs/LICENSE`）
- CodeMirror 5：MIT（`src/vendor/codemirror/LICENSE`）
- 練習資料為程式產生的虛構資料，與任何真實公司、個人無關。
