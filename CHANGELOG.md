# Changelog

格式參考 [Keep a Changelog](https://keepachangelog.com/)，版本號採 [Semantic Versioning](https://semver.org/lang/zh-TW/)。
只記錄使用者可感知的變更；長期架構決策見 `docs/AGENT_CHANGELOG.md`。

## [Unreleased]

### Fixed
- SQL Foundations／面試題：修正整數除法、歸因營收重複加總、排序決勝條件、日期上界與資料庫方言說明；修正無法執行的錯誤答案範例。
- Excel → SQL：修正空白值與 NULL 的對照說明，補齊排序規則。
- PM SQL：修正 DAU 平均、成熟 cohort 留存分母、採用率母體、雙尾檢定與前置分群時間窗。
- Growth Analytics：修正 Rolling Retention、收入 JOIN 重複加總，區分年化收入代理值與 LTV；移除資料不足以支持的推薦係數計算。
- PRD：補齊密碼重設驗收情境，修正 MoSCoW 工作量口徑及題目、模板說明的一致性。

### Changed
- 新增資料結構、演算法與面試解題、原創 Easy 題三門課；合計 13 門、113 課、296 題。程式碼範例供閱讀與自行練習，本站目前僅用 MCQ 檢核觀念，沒有 JavaScript 自動判題。
- 新增程式面試學習路徑、首頁分類與三門課的瀏覽器煙霧測試。
- PM 課程補充可執行範例；全站目前有 204 個可執行課文範例。
- 既有課程、單元、課與題目 ID 保持不變。

## [0.2.0] - 2026-10-28

### Added
- 學習路徑課程推薦：Dashboard 顯示下一門適合的課，完課後推薦同路徑下一階段
- 錯題複習：依課程篩選、隨機抽題、直接定位並高亮原題
- 我的學習 Dashboard：完成率、連續學習、繼續學習、證書摘要
- 首頁四條學習路徑、課程搜尋、分類與逐課進度
- GitHub Actions 品質檢查（語法、內容驗證、`dist/` 未追蹤）

### Changed
- 首頁課程卡改為清單決策型，操作區與資訊區分離
- SQL 引擎改為按需載入，首頁與非 SQL 課不再下載 sql.js／WASM

### Fixed
- 非 SQL 課程 `dataset: null` 導致的載入錯誤

## [0.1.0] - 2026-10

### Added
- 10 門課、90 課、250 題：SQL Foundations、Excel → SQL、BigQuery × GA4、SQL 面試題庫、PM SQL、Growth Analytics、Looker Studio、PRD 寫作、AI 工作術、Prompt Engineering
- SQL 即時批改（瀏覽器內 SQLite）與 MCQ 即時回饋
- 結業證書、Open Graph 分享圖、GA4 追蹤
- 部署至 Cloudflare Workers
