# GitHub Actions 品質檢查

Schooling 使用 GitHub Actions 在程式碼進入 `main` 或建立 Pull Request 時自動驗證品質。這個 Workflow **不部署網站**；正式站仍由 Cloudflare Workers 負責。

## 觸發時機

- Push 到 `main`
- 對 `main` 建立或更新 Pull Request
- 在 GitHub Actions 頁面手動執行 `workflow_dispatch`

## 自動檢查

1. 使用標準 `ubuntu-latest` runner 與 Node.js 22。
2. 對 `src/`、`content/`、`tools/` 內所有 `.js`、`.mjs` 執行 `node --check`。
3. 執行 `npm run validate`，驗證全部課程、題目、SQL、MCQ 與課文範例。
4. 確認生成的 `dist/` 沒有被 Git 追蹤。

## 結果判讀

- 綠色勾勾：全部檢查通過。
- 紅色叉叉：至少一項失敗；點進該次 Workflow 查看失敗步驟與錯誤訊息。
- 新的 push 會取消同一分支上仍在執行的舊檢查，避免浪費執行時間。

## 與 Cloudflare 的關係

```text
GitHub Actions → 驗證原始碼與課程內容
Cloudflare Workers → 部署並提供正式網站
```

GitHub Actions 通過不代表網站已部署；Cloudflare 部署成功也不代表瀏覽器功能一定正常。正式部署後仍要依 `docs/DEPLOY.md` 執行線上瀏覽器驗證。

## 本機執行同等檢查

```bash
find src content tools -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
npm run validate

git ls-files 'dist/**'
```

最後一個指令應該沒有輸出。
