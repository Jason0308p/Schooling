const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ai-u04',
  title: 'SEO 與內容行銷',
  lessons: [
    {
      id: 'ai-u04-l01',
      title: 'AI 輔助關鍵字研究、文章架構與內容再利用',
      minutes: 20,
      objectives: [
        '用 AI 輔助關鍵字發想與分群',
        '用 AI 快速生成 SEO 文章架構',
        '把一篇文章「再利用」成多種內容格式',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ai.u04.l01.q01',
          type: 'mcq',
          title: 'AI 關鍵字研究限制',
          question: '用 AI 做關鍵字研究的最大限制是什麼？',
          options: [
            'A. AI 不懂繁體中文的 SEO',
            'B. AI 無法提供真實的搜尋量、競爭度等數據，需搭配 Google Keyword Planner 等工具',
            'C. AI 生成的關鍵字都太長尾，沒有流量',
            'D. AI 只能做英文關鍵字研究',
          ],
          answer: 1,
          explanation: 'AI 可以幫你快速發想大量關鍵字、分析用戶意圖、把關鍵字分群，但它無法提供真實的搜尋量、CPC 或競爭度數據。關鍵字研究的完整流程是：用 AI 發想關鍵字清單 → 用 Google Keyword Planner、Ahrefs 或 Ubersuggest 確認搜尋量和競爭度 → 選出值得寫的目標關鍵字。',
        },
        {
          id: 'ai.u04.l01.q02',
          type: 'mcq',
          title: 'SEO 文章架構',
          question: '你要請 AI 生成「[產品類別] 怎麼選」這類 SEO 文章的架構，最重要的 prompt 元素是什麼？',
          options: [
            'A. 要求 AI 使用越多關鍵字越好',
            'B. 告訴 AI 目標關鍵字、讀者搜尋意圖（想知道什麼）、和競品文章已覆蓋的角度（讓 AI 找差異點）',
            'C. 要求 AI 寫超過 3000 字確保 SEO 效果',
            'D. 只需要提供關鍵字，AI 自己知道怎麼寫',
          ],
          answer: 1,
          explanation: '好的 SEO 文章架構需要三個輸入：目標關鍵字（告訴 AI 要優化什麼）、讀者意圖（想解決什麼問題、做什麼決策）、競品分析（避免重複已有的內容，找出可以做差異化的角度）。字數多寡不是排名的直接因素，關鍵是回答讀者問題的品質。',
        },
        {
          id: 'ai.u04.l01.q03',
          type: 'mcq',
          title: '內容再利用',
          question: '「內容再利用（Content Repurposing）」用 AI 最有效率的做法是哪一個？',
          options: [
            'A. 把同一篇文章重複發布在不同平台，不做任何修改',
            'B. 用 AI 把一篇核心文章改寫成針對不同平台格式優化的版本，保留核心觀點但調整長度和語氣',
            'C. 讓 AI 把文章翻成英文，這樣就有了兩份內容',
            'D. 每篇文章只能用一次，再利用會被 Google 視為重複內容',
          ],
          answer: 1,
          explanation: '內容再利用的核心是「同一個觀點，多種格式」。一篇部落格文章可以再製成：IG 懶人包貼文、LinkedIn 洞察分享、YouTube 影片腳本、Email 電子報、Podcast 大綱。AI 可以快速完成格式轉換和語氣調整。重複發布相同文字才會有 SEO 問題；格式和語氣不同的再製內容不算重複。',
        },
      ],
    },
  ],
};
