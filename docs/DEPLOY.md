# 部署

網站是純靜態檔案，部署在 **Cloudflare Workers（靜態資產）**。不需要 Docker、資料庫或自己的伺服器。

- 線上網址：https://schooling.jason0308p.workers.dev
- Worker 名稱：`schooling`（`wrangler.jsonc` 的 `name`，Git 自動部署時兩邊必須一致）
- 原始碼：https://github.com/Jason0308p/Schooling

## `wrangler.jsonc` 在做什麼

```jsonc
{
  "name": "schooling",                 // Worker 名稱，也是網址前綴
  "compatibility_date": "2026-10-01",  // 執行環境版本日期，固定即可
  "assets": { "directory": "./dist" }  // 只發布 dist，docs/ tools/ .git 不會上傳
}
```

`dist` 是部署前臨時產生的，內容固定為：`index.html`、`_headers`、`src/`、`content/`（共 59 個檔案），已被 `.gitignore` 排除。

## A. 手動部署（Windows PowerShell）

需求：Node.js、Cloudflare 帳號。

```powershell
# 1. 登入（只需一次；憑證過期時重做）
npx wrangler login
npx wrangler whoami            # 看到你的 email 即成功

# 2. 在專案根目錄建立 dist
if (Test-Path dist) { Remove-Item dist -Recurse -Force }
New-Item -ItemType Directory dist | Out-Null
Copy-Item index.html, _headers dist
Copy-Item src, content dist -Recurse

# 3. 部署
npx wrangler deploy
```

**不要**把 `wrangler deploy` 的輸出接 `| Select-Object -First N` 或 `| head`，會在上傳途中把它中斷。要看結尾請先存檔：
`cmd /c "npx wrangler deploy > out.txt 2>&1"` 再 `Get-Content out.txt -Tail 15`。

## B. Git 自動部署

Cloudflare 後台 → Workers & Pages → `schooling` → 設定 → 建置 → 連線到 Git → 選 `Schooling`。

| 欄位 | 填 |
|---|---|
| 生產分支 | `main` |
| 根目錄 | 留空 |
| 建置指令 | `mkdir dist && cp -r index.html src content _headers dist/` |
| 部署指令 | `npx wrangler deploy` |

連好之後：`git push` → 約 1 分鐘自動更新。選單名稱依 Cloudflare 當下介面為準，可能與此處略有不同。

## 部署後驗證清單

1. 首頁右側範例查詢有跑出結果表（資料庫引擎與 .wasm 載入成功）。
2. 進任一課，按課文範例「執行」有結果。
3. 做一題：答錯一次、答對一次，回饋正確。
4. 手機打開一次，版面正常。
5. 瀏覽器 Console 沒有紅色錯誤。
6. `/docs/…`、`/CLAUDE.md`、`/wrangler.jsonc`、`/.git/config` 都應回 404。

## 常見問題

| 訊息 / 現象 | 原因 | 處理 |
|---|---|---|
| `Worker schooling does not exist` | 還沒成功部署過 | 先跑一次手動部署（A） |
| `Not logged in ... token expired` | 登入過期 | `npx wrangler login` |
| `directory ... dist does not exist` | 忘了建 dist | 先做 A 的步驟 2 |
| 網頁空白或 wasm 失敗 | 瀏覽器快取舊版 | `Ctrl + F5` |
| 回到舊版本 | — | 後台「部署」頁，或 `npx wrangler rollback` |

## 其他設定

| 想做的事 | 位置 |
|---|---|
| 綁自己的網域 | `schooling` → 設定 → 網域與路由 |
| 關閉 workers.dev 網址 | 同上 |
| 加存取密碼 | Cloudflare Zero Trust → Access |

## 注意

- 網站與其練習答案都是公開可讀的（答案在前端的 `unit.js`，用開發者工具看得到）。若之後要收費，付費單元的內容要改由後端驗證後才回傳，見 `docs/ROADMAP.md`。
- 學習進度存在各瀏覽器的 localStorage，線上網址與 `localhost` 的進度是分開的。
