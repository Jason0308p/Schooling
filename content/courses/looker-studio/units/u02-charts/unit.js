const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ls-u02',
  title: '核心圖表元件',
  lessons: [
    {
      id: 'ls-u02-l01',
      title: 'Scorecard、Time Series、Bar Chart、Pie Chart',
      minutes: 20,
      objectives: [
        '說明 Scorecard 的適用場景與 Comparison Date Range 設定',
        '設定 Time Series 圖表的維度、指標與時間粒度',
        '區分 Bar Chart 與 Pie Chart 的適用情境，避免常見誤用',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ls.u02.l01.q01',
          type: 'mcq',
          title: 'Scorecard 比較期間',
          question: '想在 Scorecard 顯示「本月 Sessions 比上月成長多少 %」，應該設定哪個選項？',
          options: [
            'A. 在指標欄位旁勾選「顯示目標值（Show target）」',
            'B. 在 Scorecard 設定中開啟「比較日期範圍（Comparison date range）」並選擇「上一個時段」',
            'C. 新增第二個 Scorecard，手動計算成長率',
            'D. 在篩選器（Filter）中設定日期條件',
          ],
          answer: 1,
          explanation: 'Scorecard 元件有內建的「比較日期範圍（Comparison date range）」功能，可以選擇「上一個時段（Previous period）」或「上一年同期（Previous year）」，系統會自動計算差異值與百分比變化，並用綠色（正成長）或紅色（負成長）顯示，不需要手動計算。',
        },
        {
          id: 'ls.u02.l01.q02',
          type: 'mcq',
          title: 'Time Series 時間粒度',
          question: 'Time Series 圖表預設顯示每日數據，但報表需要顯示每週趨勢以減少雜訊，應該調整哪個設定？',
          options: [
            'A. 將時間維度從「Date」換成「Week」（或 ISO Year Week）',
            'B. 在資料來源新增計算欄位，將日期除以 7',
            'C. 在篩選器只保留每週一的資料',
            'D. 將圖表類型換成 Bar Chart',
          ],
          answer: 0,
          explanation: 'Time Series 的時間粒度由「時間維度（Time dimension）」控制。Looker Studio 提供 Date（日）、Week（週）、Month（月）、Quarter（季）、Year（年）等選項，直接在圖表設定的「維度」欄位將「Date」換成「Year Week（ISO）」即可切換為週粒度，不需要建立計算欄位。',
        },
        {
          id: 'ls.u02.l01.q03',
          type: 'mcq',
          title: 'Pie Chart 使用限制',
          question: '以下哪個情境**不適合**使用 Pie Chart（圓餅圖）？',
          options: [
            'A. 顯示各流量來源（Organic / Paid / Direct）佔總 Sessions 的比例',
            'B. 顯示各裝置類型（Mobile / Desktop / Tablet）的用戶分佈',
            'C. 比較過去 12 個月每月的 Revenue 趨勢',
            'D. 顯示 3 個廣告活動各自佔總預算的比例',
          ],
          answer: 2,
          explanation: '圓餅圖適合呈現**組成比例**（各部分加總為 100%），且類別數不超過 5–6 個。比較 12 個月的趨勢是時序資料，應使用 Time Series 或 Bar Chart；圓餅圖無法有效呈現時間先後順序，會讓讀者難以判斷趨勢方向。',
        },
      ],
    },
    {
      id: 'ls-u02-l02',
      title: 'Table with Heatmap、Pivot Table、Blended Data',
      minutes: 20,
      objectives: [
        '在 Table 元件開啟 Heatmap 並解讀視覺化含義',
        '說明 Pivot Table 的列維度、欄維度與指標設定方式',
        '描述 Blended Data 的概念與兩個資料來源的 Join Key 設定',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'ls.u02.l02.q01',
          type: 'mcq',
          title: 'Table Heatmap 設定',
          question: '在 Table 元件中，要讓「轉換率」欄位以背景色深淺呈現高低，應該怎麼設定？',
          options: [
            'A. 將表格類型從 Table 換成 Scorecard',
            'B. 在圖表設定的「樣式（Style）」分頁，對該指標欄位開啟「Show heatmap」',
            'C. 在資料來源新增條件式格式化計算欄位',
            'D. 在報表層級開啟「主題與版面（Theme and layout）」中的色彩模式',
          ],
          answer: 1,
          explanation: '在 Table 元件的「樣式（Style）」分頁，每個數值指標欄位旁邊都有「Show heatmap」選項，開啟後系統會根據欄位數值的相對大小，自動以漸層背景色（預設為白色到藍色）呈現，值越大背景色越深，讓讀者一眼看出哪些列的表現最好或最差。',
        },
        {
          id: 'ls.u02.l02.q02',
          type: 'mcq',
          title: 'Pivot Table 設定',
          question: '想用 Pivot Table 顯示「各流量來源 × 各裝置類型 的 Sessions 交叉表」，正確的設定是？',
          options: [
            'A. 列維度：Sessions；欄維度：流量來源；指標：裝置類型',
            'B. 列維度：流量來源；欄維度：裝置類型；指標：Sessions',
            'C. 列維度：裝置類型；指標：流量來源 + Sessions',
            'D. 只能用 Table 呈現，Pivot Table 不支援兩個維度',
          ],
          answer: 1,
          explanation: 'Pivot Table 的設定邏輯：**列維度（Row dimension）** 決定左側的分組項目，**欄維度（Column dimension）** 決定頂部的分組項目，**指標（Metric）** 是交叉格子裡顯示的數值。因此「流量來源」放列維度、「裝置類型」放欄維度、「Sessions」放指標，就能得到正確的交叉分析表。',
        },
        {
          id: 'ls.u02.l02.q03',
          type: 'mcq',
          title: 'Blended Data Join Key',
          question: '想混合 GA4 資料來源（含 `Session source`）和 Google Ads 資料來源（含 `Campaign`），以便在同一張表顯示廣告點擊與網站行為，最合適的 Join Key 是？',
          options: [
            'A. 使用者 ID（User ID）',
            'B. 日期（Date）+ 廣告活動名稱（Campaign name）',
            'C. 網頁 URL（Page URL）',
            'D. 裝置類型（Device category）',
          ],
          answer: 1,
          explanation: '要合併 GA4 與 Google Ads 資料，通常用**日期（Date）+ 廣告活動名稱（Campaign name）**作為 Join Key，因為這兩個欄位在兩個資料來源中都存在，且能精確對應到同一個廣告活動在同一天的表現。用單一「Date」會導致一個日期對應多個廣告活動而產生數據錯誤；用「User ID」則通常因為隱私設定而大量缺失。',
        },
      ],
    },
  ],
};
