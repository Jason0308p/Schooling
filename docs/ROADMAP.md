# 擴充與商業化路線

## 現況（v0.1.0，2026-10-14）

- 主課程第 0～2 單元開放：10 課、28 題（規劃共 39 課、92 題）
- 單機版：進度存瀏覽器、無帳號、全部免費
- 已預留：`config.features`（paywall / accounts / remoteProgressSync 開關）、課程與單元的 `access` 欄位、進度儲存的 Adapter 介面

## 階段規劃

| 階段 | 內容 | 技術變動 | 需要後端 |
|---|---|---|---|
| **1. 內容完成** | 單元 3～9 | 只加 content/ 檔案 | 否 |
| **2. 上線試用** | Cloudflare Pages 部署、自訂網域、GA4 追蹤學習行為 | index.html 加追蹤碼 | 否 |
| **3. 帳號與雲端進度** | 登入、跨裝置同步、結業證書 | 新增 `RemoteAdapter` + Cloudflare Workers + D1；`features.accounts = true` | 是 |
| **4. 付費** | 部分單元 `access: 'pro'`、付款 | 付款服務（Stripe / 綠界 / TapPay）+ 授權檢查；`features.paywall = true` | 是 |
| **5. 更多課程** | BigQuery × GA4、面試題庫 | 新資料集（GA4 巢狀結構）；目錄已預留 | 否 |

## 第 3 階段的接法（已預留介面）

```text
現在：ProgressStore ── LocalStorageAdapter ── localStorage
之後：ProgressStore ── RemoteAdapter ──┬── localStorage（離線快取）
                                       └── fetch('/api/progress') → Worker → D1
```

`ProgressStore` 和所有畫面不用改，只要實作一個有 `load()`、`save(data)`、`clear()` 的新 Adapter，在 `main.js` 換掉。

## 第 4 階段的接法

- 在 `course.js` 把要收費的單元設 `access: 'pro'`。
- 新增 `src/core/entitlements.js`：`canAccess(user, unit)`。
- 在 `courseRegistry.loadCourse()` 載入單元前、以及 `lesson.js` 顯示前檢查權限；沒權限顯示購買頁。
- **注意**：純前端的付費牆擋不住懂技術的人，因為內容檔案在靜態主機上可以被直接下載。真的要收費時，付費單元的內容要改由 Worker 驗證身分後才回傳。

## 其他可加的功能

| 功能 | 價值 | 難度 |
|---|---|---|
| 結業測驗（計時、不能看提示） | 驗證學習成效、證書依據 | 中 |
| 間隔複習（錯題隔天重做） | 提升記憶 | 低（progress 已有作答紀錄） |
| AI 解說（把錯誤 SQL 送給 Claude API 解釋） | 個人化回饋 | 中（需要後端保護 API key） |
| 題目回報按鈕 | 收集題目問題 | 低 |
| 英文版 | 擴大市場 | 中（內容要翻譯，介面字串要抽出） |
