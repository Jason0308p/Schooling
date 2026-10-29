# Changelog

格式參考 [Keep a Changelog](https://keepachangelog.com/)，版本號採 [Semantic Versioning](https://semver.org/lang/zh-TW/)。
只記錄使用者可感知的變更；長期架構決策見 `docs/AGENT_CHANGELOG.md`。

## [Unreleased]

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
