const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ai-u01',
  title: 'AI 工具全景',
  lessons: [
    {
      id: 'ai-u01-l01',
      title: 'ChatGPT、Claude、Gemini — 各自的強項與使用時機',
      minutes: 25,
      objectives: [
        '分辨三大 AI 工具的定位與差異',
        '判斷哪些工作情境適合用 AI，哪些不適合',
        '了解 AI 的三個核心限制：幻覺、時效性、著作權',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ai.u01.l01.q01',
          type: 'mcq',
          title: '選對工具',
          question: '你需要針對一份 20 頁的英文市調報告做**中文摘要與重點整理**，下列哪個工具最適合？',
          options: [
            'A. Midjourney — 專門處理長文件',
            'B. Claude — 擅長長文閱讀與結構化整理',
            'C. Stable Diffusion — 支援多語言翻譯',
            'D. Google Analytics — 提供文件分析功能',
          ],
          answer: 1,
          explanation: 'Claude 的 context window 大（可達 200K tokens），擅長閱讀長文、整理重點、產出結構化摘要，是處理大量文字的首選。Midjourney 和 Stable Diffusion 是圖片生成工具，Google Analytics 是數據分析平台，都無法執行文字整理工作。',
        },
        {
          id: 'ai.u01.l01.q02',
          type: 'mcq',
          title: 'AI 幻覺風險',
          question: '你請 ChatGPT 提供「台灣前五大電商平台 2024 年的 GMV 數據」，它給出一份看起來很完整的數字。你應該怎麼做？',
          options: [
            'A. 直接貼進報告，AI 的數據通常很準確',
            'B. 去官方財報或產業研究報告交叉驗證後才使用',
            'C. 把數字乘以 0.9 做保守估計',
            'D. 換問 Claude，因為 Claude 不會產生幻覺',
          ],
          answer: 1,
          explanation: 'AI 工具（包含 ChatGPT 和 Claude）都可能「幻覺」出看似合理但實際錯誤的數字，尤其是具體統計數據。正確做法是把 AI 的輸出當作草稿，再去官方來源（公司財報、MIC、資策會等產業研究）驗證。所有 AI 都有幻覺風險，不是換工具就能解決。',
        },
        {
          id: 'ai.u01.l01.q03',
          type: 'mcq',
          title: '適合 vs 不適合',
          question: '下列哪個工作情境**最不適合**直接依賴 AI 完成？',
          options: [
            'A. 為一篇部落格文章草稿做文法修飾',
            'B. 根據已知數據生成報告框架與初稿',
            'C. 確認昨天某競品是否有發佈新聞稿',
            'D. 將英文 FAQ 翻譯成繁體中文草稿',
          ],
          answer: 2,
          explanation: 'AI 的訓練資料有時效限制，無法即時查詢昨天的新聞或最新事件（除非使用了外掛搜尋功能）。確認最新動態應直接去官方網站、Google 新聞或競品 PR 頁面查找。文法修飾、框架生成、翻譯草稿都是 AI 的強項。',
        },
      ],
    },
  ],
};
