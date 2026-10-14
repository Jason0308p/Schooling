# SQL 實戰營（Schooling）— AI 助手入場說明

互動式 SQL 線上課程，純靜態網站（瀏覽器內 SQLite / sql.js），無後端、無建置步驟。
使用者 Jason 自學 SQL 用，架構預留商業化擴充。

- 主資料夾：`C:\Users\syf\Desktop\code\Schooling`（這個 git repo 就是它，remote = `Jason0308p/Schooling`）
- 線上網址：https://schooling.jason0308p.workers.dev
- 舊的 `n8n_project\SQL_te` 已刪除，不要再建立或參考。

## 先讀

- `README.md`：怎麼開、檔案在哪
- `docs/ARCHITECTURE.md`：分層、資料流、批改流程、擴充點
- `docs/CONTENT_GUIDE.md`：寫課程的欄位規格與鐵則（**改內容前必讀**）
- `docs/DEPLOY.md`：部署流程

## 鐵則

1. **題目 / 課 / 單元的 id 發布後不可改名**：學員進度靠 id 記錄。
2. **改任何 content/ 之後必跑** `node tools/validate-content.mjs`，全部通過才算完成；新題目要附 `negatives`（常見錯誤寫法，驗證會確認它被判錯）。
3. `src/core/grader.js`、`src/core/markdown.js`、`content/**` 必須保持純 JS（不碰 window/document），Node 驗證工具會載入它們。
4. 依賴方向：`ui → core → content`，不可反向。
5. 不要在課文寫死資料數字（資料集改版會變）。
6. 驗證畫面要真的開瀏覽器看，不能只看程式碼。直接開 `file://` 不會動，這是預期行為，要用 `start.bat`（埠 8090）。
7. **這個 repo 是公開的**：不可提交任何金鑰、憑證、個人資料、其他私人專案的資訊。
8. `start.bat` 必須是 **CRLF 換行、純 ASCII**（LF 或中文會讓 Windows cmd 出錯）；`.gitattributes` 已設定，編輯時注意不要破壞。

## 工作流程

```text
改檔案 → node tools/validate-content.mjs → 本機 start.bat 看過 → git commit / push
→ 部署（見 docs/DEPLOY.md；Git 自動部署連好之前要手動 wrangler deploy）→ 用線上網址實測
```

部署與推送是對外動作，先跟使用者確認再做。

## 目前進度

- 已開放：單元 0～3（14 課、38 題），驗證全過。
- 下一步：單元 4 資料清理（大綱在 `content/courses/sql-foundations/course.js` 的 outline 與 `docs/CURRICULUM.md`）。
- 之後：AI 新聞功能（尚未決定：放哪、是否用 AI 摘要、是否放廣告）。

## 常用指令

```bash
node tools/validate-content.mjs     # 內容驗證
python tools/serve.py 8090          # 本機伺服器（不快取）；使用者用 start.bat
```
