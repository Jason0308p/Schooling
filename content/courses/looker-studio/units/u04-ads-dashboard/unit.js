const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ls-u04',
  title: '廣告成效儀表板（Google Ads + GA4）',
  lessons: [
    {
      id: 'ls-u04-l01',
      title: '整合 Google Ads 與 GA4：ROAS 儀表板',
      minutes: 25,
      objectives: [
        '在 Looker Studio 連接 Google Ads 資料來源並識別核心指標欄位',
        '用 Blended Data 以 Date + Campaign 為 Join Key 合併 GA4 與 Ads 資料',
        '建立 ROAS、CTR、CPC 計算欄位並套用到 Scorecard 與 Table',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ls.u04.l01.q01',
          type: 'mcq',
          title: 'Google Ads 連接器欄位',
          question: '連接 Google Ads 資料來源後，想計算「每次點擊費用（CPC）」，應該使用哪兩個原始欄位？',
          options: [
            'A. Impressions（曝光數）÷ Clicks（點擊數）',
            'B. Cost（費用）÷ Clicks（點擊數）',
            'C. Conversions（轉換數）÷ Cost（費用）',
            'D. Cost（費用）÷ Impressions（曝光數）',
          ],
          answer: 1,
          explanation: 'CPC（Cost Per Click，每次點擊費用）= 總費用（Cost）÷ 點擊數（Clicks）。這兩個欄位在 Google Ads 連接器中都有提供。在 Looker Studio 建立計算欄位時，公式寫成 `Cost / Clicks`，並建議用 `NULLIF(Clicks, 0)` 避免除以零的錯誤：`Cost / NULLIF(Clicks, 0)`。',
        },
        {
          id: 'ls.u04.l01.q02',
          type: 'mcq',
          title: 'ROAS 計算欄位',
          question: '在 Blended Data 的計算欄位中，ROAS（Return on Ad Spend，廣告投資報酬率）的正確公式是？',
          options: [
            'A. Cost / Revenue',
            'B. Revenue / Cost',
            'C. (Revenue - Cost) / Cost',
            'D. Clicks / Cost',
          ],
          answer: 1,
          explanation: 'ROAS = 廣告帶來的營收（Revenue）÷ 廣告費用（Cost）。例如花了 10,000 元廣告費帶來 50,000 元營收，ROAS = 5（或 500%）。注意 ROAS 與 ROI 不同：ROI = (Revenue - Cost) / Cost，ROAS 不扣除成本。在 Looker Studio 計算欄位中寫：`SUM(Revenue) / NULLIF(SUM(Cost), 0)`，其中 Revenue 來自 GA4 資料來源，Cost 來自 Google Ads 資料來源。',
        },
        {
          id: 'ls.u04.l01.q03',
          type: 'mcq',
          title: 'Blended Data 數據異常排查',
          question: '合併 GA4 與 Google Ads 後，發現 Scorecard 顯示的 Sessions 數值是 GA4 後台數值的 3 倍，最可能的原因是？',
          options: [
            'A. GA4 資料來源的時區設定與 Google Ads 不一致',
            'B. Blended Data 的 Join Key 不夠精確，導致一對多 Join 產生重複計算',
            'C. Scorecard 的指標設定為「加總（Sum）」而非「唯一值（Count Distinct）」',
            'D. Google Ads 連接器的資料有延遲，導致日期不同步',
          ],
          answer: 1,
          explanation: '當 Blended Data Join 後數值變成倍數（2x、3x），幾乎都是 **Join Key 不夠精確**造成的。例如只用「Date」作為 Join Key，但一個日期有 3 個廣告活動，GA4 的每一個 row 就會對應到 3 個 Ads row，Sessions 被加總了 3 次。解決方法：在 Join Key 中加入「Campaign name」讓配對更精確，或檢查兩個資料來源的 Campaign 名稱是否完全一致（大小寫、空格都要匹配）。',
        },
      ],
    },
  ],
};
