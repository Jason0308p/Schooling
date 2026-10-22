# Schooling

Schooling 是一個以真實工作情境為核心的免費互動學習平台。SQL 課程透過 sql.js 在瀏覽器內執行 SQLite，非 SQL 課程使用互動式選擇題；不需要後端、Docker 或外部資料庫。

- 線上網站：`https://schooling.jason0308p.workers.dev`
- 目前規模：10 門課、90 課、250 題、179 個課文範例
- 課程領域：SQL、GA4、Looker Studio、產品數據、PRD、AI 工作術與 Prompt Engineering
- 學習功能：SQL 即時批改、MCQ 即時回饋、錯題複習、學習進度與完課證書

---

## 怎麼開啟

**雙擊 `start.bat`。**瀏覽器會自動打開 `http://localhost:8090/`。要關掉網站，就關掉那個黑色視窗。

> 為什麼不能直接雙擊 `index.html`？
> 瀏覽器的安全規則不允許從本機檔案（`file://`）載入資料庫引擎（WebAssembly）和程式模組，所以需要一個本機小伺服器。`start.bat` 只是用 Python 開一個本機伺服器，不會連到外部網路。

需要：Python 3（你的電腦已經有）。

## 檔案在哪

```text
Schooling/
├─ AGENTS.md             跨 Agent 共用規範
├─ CLAUDE.md             Claude 專用的既有專案資料
├─ index.html            網站入口與 SEO / OG 標籤
├─ og-image.png          社群分享預覽圖
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
│  ├─ courses/           10 門課程的設定、單元、課文與題目
│  └─ datasets/          電商與 App 產品模擬資料集
└─ tools/
   ├─ validate-content.mjs   內容驗證（新增/修改課程後必跑）
   └─ serve.py               本機伺服器（不快取）
```

## 文件

| 文件 | 給誰看 | 內容 |
|---|---|---|
| [AGENTS.md](AGENTS.md) | AI Agent | 跨模型共同規範、驗證要求與安全限制 |
| [docs/AGENT_CHANGELOG.md](docs/AGENT_CHANGELOG.md) | 開發者 / AI Agent | 長期架構與流程決策紀錄 |
| [docs/CURRICULUM.md](docs/CURRICULUM.md) | 學員 / 課程規劃 | 完整課程版圖與建議學習路徑 |
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
