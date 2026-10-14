# 練習資料集：好禮客製電商

定義在 `content/datasets/ecommerce/index.js`。

## 背景

虛構的客製化贈品品牌，三個通路（官網 online_store、LINE 商店 line_shop、企業訂單 b2b），資料期間 **2025-07-01 ～ 2026-06-30**。禮品業季節性明顯：11、12 月旺季，1 月（尾牙、春節）次旺。

## 產生方式

- 用**固定種子**的亂數產生器（mulberry32，seed `20250701`）產生 → 每個人、每次開啟拿到的資料一模一樣。
- 瀏覽器啟動時執行 `build(db)`，約 0.2 秒，產生約 1.4 MB 的 SQLite 資料庫。
- 這個檔案必須維持純 JS（不能碰 `window` / `document`），因為驗證工具會在 Node 裡載入它。

## 資料表與規模

| 表 | 約略筆數 | 說明 |
|---|---|---|
| customers | 480 | 會員；約 2 成從未下單（給 LEFT JOIN 找缺漏用） |
| products | 36 | 6 個分類 × 6 個商品；少數已下架 |
| orders | ~1,100 | 訂單；order_id 隨日期遞增 |
| order_items | ~2,000 | 訂單明細 |
| campaigns | 8 | 廣告活動 |
| ad_spend | ~1,600 | 每個活動每天一列 |
| sessions | 4,000 | 網站造訪（類 GA4） |
| events | ~16,000 | 網站事件，有完整的 view_item → add_to_cart → begin_checkout → purchase 漏斗 |

欄位定義見網站的「資料表」頁，或 `index.js` 裡的 `tables`（網站畫面就是讀這份）。

## 刻意埋的資料問題（教學用，不要「修好」它）

| 問題 | 位置 | 教學用途 |
|---|---|---|
| 城市 NULL（約 6%） | customers.city | 單元 1：IS NULL、`<>` 會漏掉 NULL |
| 「臺北市」與「台北市」混用 | customers.city | 單元 1 發現 → 單元 4 用 REPLACE 清理 |
| email 大寫、前後空白 | customers.email | 單元 4：TRIM、LOWER |
| 性別、出生年 NULL | customers | 單元 2：COUNT(欄位) vs COUNT(\*) |
| 退款、取消、處理中訂單 | orders.status | 算營收要排除 |
| 折扣碼 NULL | orders.coupon_code | 單元 2：GROUP BY 時 NULL 自成一組 |
| 網站購買數 ≠ 後台訂單數 | events vs orders | 單元 9：追蹤資料與交易資料對不起來是常態 |

## 修改資料集的規則

1. 改了資料邏輯（筆數、分佈、欄位），把 `version` 加 1。
2. 跑 `node tools/validate-content.mjs`，確認所有題目還有結果（例如「訂單數 ≥ 5 的會員」不能變成 0 人）。
3. 搜尋課文裡有沒有寫死的數字。原則上課文不寫具體數字。
4. **不要刪欄位或改欄位名稱**，題目的標準答案會壞。要改就新增欄位。
5. 批改是即時執行標準答案再比對，所以改資料**不會**讓題目判錯，只要標準答案本身還成立。
