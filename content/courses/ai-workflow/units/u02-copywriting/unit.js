const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ai-u02',
  title: '文案生成實戰',
  lessons: [
    {
      id: 'ai-u02-l01',
      title: '廣告文案：Facebook、Google 廣告、EDM 標題',
      minutes: 25,
      objectives: [
        '用 AI 生成符合各平台規格的廣告文案',
        '學會用角色設定與範例引導 AI 輸出高轉換率文案',
        '避免 AI 文案常見的平淡與過度誇張問題',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ai.u02.l01.q01',
          type: 'mcq',
          title: 'Prompt 品質判斷',
          question: '下列哪個 prompt 最可能產出高品質的 Facebook 廣告文案？',
          options: [
            'A. 「幫我寫廣告文案」',
            'B. 「幫我寫一個賣保養品的廣告」',
            'C. 「你是電商文案專家。幫我寫一個 Facebook 廣告，產品是玻尿酸精華液，目標受眾是 30–45 歲上班族女性，主打補水不油膩，輸出：標題（10字內）+ 內文（50字內）+ CTA」',
            'D. 「用很吸引人的語氣幫我寫廣告，要有創意，要讓人想買」',
          ],
          answer: 2,
          explanation: '好的廣告 prompt 需要包含：角色設定（電商文案專家）、完整背景（產品、受眾、賣點）、輸出格式規格（字數、結構）。選項 A 和 B 資訊太少，AI 只能猜測。選項 D 的指示模糊（「有創意」「吸引人」沒有具體標準），輸出品質不穩定。',
        },
        {
          id: 'ai.u02.l01.q02',
          type: 'mcq',
          title: 'Google 廣告字數限制',
          question: 'Google 搜尋廣告的標題（Headline）每個字段的**字元上限**是多少？',
          options: [
            'A. 25 個字元',
            'B. 30 個字元',
            'C. 45 個字元',
            'D. 60 個字元',
          ],
          answer: 1,
          explanation: 'Google 搜尋廣告（RAS）每個標題欄位上限是 30 個字元（英文），說明文字（Description）是 90 個字元。在用 AI 生成廣告文案時，一定要在 prompt 中明確說明字元限制，否則 AI 很容易超出規格。',
        },
        {
          id: 'ai.u02.l01.q03',
          type: 'mcq',
          title: 'EDM 主旨優化',
          question: '你想用 AI 優化 EDM 主旨行（Subject Line）的開信率，下列哪個做法最有效？',
          options: [
            'A. 請 AI 「寫一個好的主旨」',
            'B. 請 AI 一次生成 10 個主旨變體，並指定包含數字型、問句型、緊迫感型各幾個，然後自己或用 A/B 測試選擇',
            'C. 請 AI 寫一個全大寫的主旨，因為大寫最吸睛',
            'D. 讓 AI 模仿競品的主旨格式原封不動複製',
          ],
          answer: 1,
          explanation: '生成多個變體再測試是提升 EDM 開信率的最佳策略。不同類型（數字型如「7 個方法…」、問句型如「你知道嗎…」、緊迫感型如「最後 24 小時…」）對不同受眾反應不同，A/B 測試才能找到真正有效的版本。全大寫主旨容易被垃圾郵件過濾器攔截，直接複製競品則缺乏差異性。',
        },
      ],
    },
    {
      id: 'ai-u02-l02',
      title: '社群內容：IG、LinkedIn、Dcard、部落格',
      minutes: 25,
      objectives: [
        '了解不同平台的語氣與格式差異',
        '用 AI 把一份核心內容「再製」成多個平台版本',
        '生成貼文、hashtag、部落格文章架構',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'ai.u02.l02.q01',
          type: 'mcq',
          title: '平台語氣差異',
          question: '同樣是宣傳一款新的 SaaS 產品，IG 貼文和 LinkedIn 貼文的語氣差異，下列描述哪個最正確？',
          options: [
            'A. 兩個平台的語氣應該完全一樣，才能維持品牌一致性',
            'B. IG 偏向視覺驅動、輕鬆口語；LinkedIn 偏向專業論述、數據佐證',
            'C. LinkedIn 比較隨意，IG 比較正式',
            'D. 兩個平台都應該使用大量 emoji 增加互動',
          ],
          answer: 1,
          explanation: 'IG 用戶習慣快速滑動，貼文需要視覺強烈、語氣輕鬆、hashtag 豐富。LinkedIn 受眾是職場專業人士，期待看到商業價值、數據、案例研究，語氣偏正式。在 prompt 中明確指定平台和受眾，AI 才能調整對應的語氣與格式。',
        },
        {
          id: 'ai.u02.l02.q02',
          type: 'mcq',
          title: '內容再製效率',
          question: '你剛寫完一篇 1500 字的部落格文章，想把它「再製」成 IG 貼文、LinkedIn 貼文、Dcard 討論串。用 AI 的最佳做法是什麼？',
          options: [
            'A. 把原文貼三次，每次分別要求不同格式',
            'B. 把原文貼給 AI，一次給出三個任務（指定每個平台的格式、字數、語氣），請 AI 一次輸出三個版本',
            'C. 先叫 AI 縮短文章，再叫 AI 翻譯成英文，再叫 AI 加 hashtag',
            'D. 不需要 AI，手動改寫比較快',
          ],
          answer: 1,
          explanation: '一次 prompt 同時請 AI 輸出多個版本是最有效率的做法，減少來回次數。在同一個 prompt 中清楚說明每個平台的需求（例如：IG 用 5–7 個 hashtag、LinkedIn 開頭要有數據鉤子、Dcard 要用口語問句帶動討論），AI 就能一次輸出可用的草稿。',
        },
        {
          id: 'ai.u02.l02.q03',
          type: 'mcq',
          title: 'Hashtag 策略',
          question: '請 AI 生成 IG hashtag 時，下列哪個做法可以讓 hashtag 的觸及效果最好？',
          options: [
            'A. 請 AI 生成 30 個最熱門的 hashtag',
            'B. 請 AI 生成 3 個大眾標（100萬+ 貼文）、5 個中眾標（10–100萬）、5 個利基標（1–10萬），共 13 個',
            'C. 只用品牌自創 hashtag 保持一致性',
            'D. 每次都用完全相同的 hashtag 組合',
          ],
          answer: 1,
          explanation: 'IG 演算法對 hashtag 的最佳策略是「大中小搭配」：大眾標帶來曝光機會但競爭激烈；中眾標平衡觸及與競爭；利基標精準觸及目標受眾。每次都用相同 hashtag 會被演算法視為 spam 而降低觸及。在 prompt 中明確要求這個分層結構，AI 就能輸出更有策略的 hashtag 組合。',
        },
      ],
    },
  ],
};
