const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'prd-u01',
  title: '什麼是好的 PRD？',
  lessons: [
    {
      id: 'prd-u01-l01',
      title: 'PRD 的本質：Clear、Testable、Minimal',
      minutes: 20,
      objectives: [
        '區分 PRD、Spec、RFC 三種文件的適用情境',
        '說明好的 PRD 具備的三個核心特質',
        '識別一份 PRD 的關鍵必要章節',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'prd.u01.l01.q01',
          type: 'mcq',
          title: 'PRD vs RFC 的主要差異',
          question: '下列哪一項最能描述 **PRD（Product Requirements Document）** 與 **RFC（Request for Comments）** 的核心差異？',
          options: [
            'A. PRD 由工程師撰寫，RFC 由 PM 撰寫',
            'B. PRD 定義「要做什麼、為什麼做」，RFC 提出技術方案並徵求技術社群意見',
            'C. PRD 只用於新功能，RFC 用於 Bug 修復',
            'D. 兩者在現代敏捷團隊中已完全被 User Story 取代',
          ],
          answer: 1,
          explanation: `**PRD** 的核心是「What & Why」—— 描述使用者問題、業務目標與功能範圍，讓設計師和工程師理解要解決什麼。

**RFC（Request for Comments）** 源自網路工程社群，在軟體開發中通常用於提出技術架構或有爭議性的設計決策，目的是廣徵意見後達成共識。

選項 A 錯誤：PRD 主要由 PM 撰寫；選項 C 錯誤：兩者都可用於各類型改動；選項 D 錯誤：User Story 是 PRD 的一部分，不是替代品。`,
        },
        {
          id: 'prd.u01.l01.q02',
          type: 'mcq',
          title: 'Testable 需求的特徵',
          question: '下列四個需求描述，哪一個最符合 **Testable（可驗證）** 的特質？',
          options: [
            'A. 「系統應該要快」',
            'B. 「使用者應該喜歡這個功能」',
            'C. 「商品頁的圖片載入時間應在 2G 網路下不超過 3 秒」',
            'D. 「改善用戶體驗」',
          ],
          answer: 2,
          explanation: `**Testable** 意味著需求有明確的驗收條件，QA 工程師可以設計測試案例來確認是否達標。

選項 C 具體指定了：**情境**（2G 網路）、**指標**（圖片載入時間）、**門檻值**（不超過 3 秒）——這三個要素讓需求變得可測試。

- 選項 A「要快」沒有量化標準
- 選項 B「喜歡」主觀無法測試
- 選項 D「改善」沒有具體可測量的目標`,
        },
        {
          id: 'prd.u01.l01.q03',
          type: 'mcq',
          title: 'Minimal PRD 的精神',
          question: '關於 PRD 的 **Minimal（最小化）** 原則，下列哪個說法最正確？',
          options: [
            'A. PRD 越短越好，最好只有一頁',
            'B. PRD 只需要描述 MVP 功能，未來擴充不用寫進去',
            'C. PRD 應包含解決問題所需的最少資訊，避免過度規格化實作細節',
            'D. Minimal 代表可以省略驗收標準，留給工程師自行判斷',
          ],
          answer: 2,
          explanation: `**Minimal** 的精神不是「短」，而是「不過度規格化（over-specification）」。

好的 PRD 定義清楚**問題和目標**，但避免規定工程師「要用什麼技術」或設計師「按鈕要放哪裡」——這些細節應該留給執行端決定。

過度規格化的 PRD 會：
- 讓工程師失去自主空間，降低解決問題的彈性
- 需求變動時需要大幅修改文件
- 造成 PM 和工程師的溝通摩擦

驗收標準（Acceptance Criteria）是必要的，不屬於「過度規格化」的範疇。`,
        },
      ],
    },
  ],
};
