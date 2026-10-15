const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'prd-u02',
  title: 'User Story 與 Acceptance Criteria',
  lessons: [
    {
      id: 'prd-u02-l01',
      title: 'User Story：As a / I want / So that',
      minutes: 20,
      objectives: [
        '用標準格式寫出有效的 User Story',
        '識別常見的錯誤寫法並加以修正',
        '說明 User Story 與功能清單的本質差異',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'prd.u02.l01.q01',
          type: 'mcq',
          title: 'User Story 格式的核心目的',
          question: 'User Story 格式「**As a** [使用者], **I want** [功能], **so that** [目的]」中，**so that** 的部分最重要的原因是什麼？',
          options: [
            'A. 讓需求文件看起來更完整、更正式',
            'B. 強迫撰寫者說明功能背後的使用者價值，避免為功能而功能',
            'C. 提供工程師實作時的技術指引',
            'D. 方便 PM 在 Sprint Planning 上向團隊解釋需求',
          ],
          answer: 1,
          explanation: `**So that** 是 User Story 最容易被省略、卻最關鍵的部分。

它強迫 PM 回答：「這個功能對使用者的實際價值是什麼？」

如果你寫不出合理的 so that，通常代表：
- 這個需求是假設，不是真正的使用者需求
- 或者你還不夠了解使用者為什麼需要這個功能

工程師看到 so that，也能在實作時做出更好的判斷——因為他們知道目標，不只是規格。`,
        },
        {
          id: 'prd.u02.l01.q02',
          type: 'mcq',
          title: '識別錯誤的 User Story',
          question: '下列哪一個是**錯誤**的 User Story 寫法？',
          options: [
            'A. As a 訂閱用戶, I want to receive a weekly digest email, so that I can stay updated without visiting the app every day.',
            'B. As a system, I want to send push notifications to all users at 9am, so that users are reminded.',
            'C. As a first-time buyer, I want to see a checkout progress bar, so that I know how many steps are left.',
            'D. As a store manager, I want to export sales reports as CSV, so that I can analyze them in Excel.',
          ],
          answer: 1,
          explanation: `選項 B 的問題：**"As a system"** 不是使用者角色。

User Story 的主詞應該是**真實的使用者類型**（或人物誌 Persona），而不是系統、後台、或技術元件。

「系統要在 9am 發通知」是一個技術實作描述，不是 User Story。正確改法：
> As a **busy user**, I want to receive a morning reminder at 9am, so that I don't miss important updates.

其他選項都有明確的使用者角色（訂閱用戶、首購者、店長）和具體的使用者價值。`,
        },
        {
          id: 'prd.u02.l01.q03',
          type: 'mcq',
          title: 'User Story 粒度',
          question: '下列哪種情況，**最需要**把一個 User Story 拆成更小的 Story？',
          options: [
            'A. Story 的 so that 描述了多個不同的使用者目的',
            'B. Story 的標題超過 15 個字',
            'C. 工程師預估工時超過 2 天',
            'D. Story 包含超過 3 個 Acceptance Criteria',
          ],
          answer: 0,
          explanation: `當一個 User Story 的 **so that** 描述了多個不同目的時，代表這個 Story 混合了不同的使用者需求——這是拆分的最強信號。

範例（需要拆分）：
> As a user, I want a profile page, so that **I can update my info** and **other users can see my activity**.

這其實是兩個 Story：
1. 更新個人資訊（設定功能）
2. 查看他人活動（社交功能）

**工時**是工程考量，不是需求邊界。**Acceptance Criteria 的數量**也不是拆分標準——一個複雜功能可以有多個 AC。`,
        },
      ],
    },
    {
      id: 'prd-u02-l02',
      title: 'Acceptance Criteria：Given / When / Then',
      minutes: 20,
      objectives: [
        '用 Given / When / Then 格式撰寫明確的驗收標準',
        '識別並處理 Edge cases',
        '區分 Acceptance Criteria 與測試案例的差異',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'prd.u02.l02.q01',
          type: 'mcq',
          title: 'Given/When/Then 的角色',
          question: '在 **Given / When / Then** 格式中，**Given** 主要描述什麼？',
          options: [
            'A. 功能執行後，系統應有的輸出或狀態變化',
            'B. 使用者執行的動作或操作',
            'C. 前置條件：功能發生時，系統或使用者的初始狀態',
            'D. 功能的目標使用者類型',
          ],
          answer: 2,
          explanation: `**Given / When / Then** 三部分分別對應：

- **Given**（前置條件）：情境的初始狀態。*例：Given 使用者已登入且購物車中有 2 件商品*
- **When**（觸發動作）：使用者或系統執行了什麼。*例：When 使用者點擊「結帳」按鈕*
- **Then**（預期結果）：系統應該有什麼反應。*例：Then 系統應導向付款頁面，並顯示正確的商品清單和總金額*

Given 確立了「在什麼情況下」這個 AC 才適用，不同的初始狀態會產生不同的行為路徑。`,
        },
        {
          id: 'prd.u02.l02.q02',
          type: 'mcq',
          title: '識別缺失的 Edge Case',
          question: '一個登入功能的 Acceptance Criteria 只寫了「Given 使用者輸入正確的帳號密碼，When 點擊登入，Then 成功進入首頁」。下列哪個 Edge Case **最應該**被補上？',
          options: [
            'A. Given 使用者在行動裝置上登入的情境',
            'B. Given 使用者輸入錯誤密碼連續 5 次的情境',
            'C. Given 使用者使用 Chrome 以外的瀏覽器',
            'D. Given 使用者在半夜登入的情境',
          ],
          answer: 1,
          explanation: `**連續輸入錯誤密碼**是登入功能中最關鍵的 Edge Case，涉及安全性（防暴力破解）和使用者體驗（帳號鎖定提示）。

如果沒有定義這個情境，工程師可能：
- 不做帳號鎖定
- 鎖定後沒有提供解鎖方式
- 不顯示剩餘嘗試次數

Edge Case 的選取原則：優先考慮**影響安全性、資料完整性、或使用者重要流程**的情境，而非僅考慮設備或環境差異。`,
        },
        {
          id: 'prd.u02.l02.q03',
          type: 'mcq',
          title: 'AC 與測試案例的差異',
          question: '關於 **Acceptance Criteria（AC）** 與 **Test Cases（測試案例）** 的關係，下列哪個描述最正確？',
          options: [
            'A. AC 和 Test Cases 是同一件事，只是命名不同',
            'B. AC 由 PM 定義「完成的條件」，Test Cases 由 QA 根據 AC 展開具體的測試步驟',
            'C. Test Cases 比 AC 更高層次，AC 是 Test Cases 的細化',
            'D. AC 只需要描述正常流程（Happy Path），Edge Cases 屬於 Test Cases 的範疇',
          ],
          answer: 1,
          explanation: `**AC（Acceptance Criteria）** 定義功能「完成了嗎」的判斷標準，是 PM 的責任。

**Test Cases** 是 QA 基於 AC 設計的具體測試步驟，包含測試資料、操作步驟、預期結果——是 AC 的執行面展開。

一個 AC 可以衍生出多個 Test Cases（正常輸入、邊界值、錯誤格式、跨瀏覽器等）。

AC 也應該涵蓋重要的 Edge Cases——「只寫 Happy Path」是一個常見的錯誤。PM 應該在 AC 中標示出關鍵的失敗路徑，讓工程師知道這些情境需要處理。`,
        },
      ],
    },
  ],
};
