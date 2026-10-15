const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ls-u01',
  title: 'Looker Studio 入門',
  lessons: [
    {
      id: 'ls-u01-l01',
      title: '認識 Looker Studio：連接 GA4 資料來源',
      minutes: 20,
      objectives: [
        '說明 Looker Studio 是什麼，以及免費方案的功能與限制',
        '比較 Looker Studio 與 Tableau、Power BI 的定位差異',
        '完成連接 GA4 資料來源的完整操作步驟',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ls.u01.l01.q01',
          type: 'mcq',
          title: 'Looker Studio 免費方案限制',
          question: '下列關於 Looker Studio 免費版的描述，何者**正確**？',
          options: [
            'A. 每個帳號只能建立 5 份報表',
            'B. 連接 GA4 資料來源需要付費升級',
            'C. 報表可以免費與他人共用檢視，不需要對方有 Google 帳號',
            'D. 免費版可建立無限報表，並免費共用；GA4 連接器無需付費',
          ],
          answer: 3,
          explanation: 'Looker Studio 免費版沒有報表數量上限，也可以免費共用報表（收件人可以用 Google 帳號登入後檢視）。連接 GA4、Google Ads、Google Sheets 等 Google 原生資料來源均免費；第三方連接器（如 Facebook Ads）才需要付費。',
        },
        {
          id: 'ls.u01.l01.q02',
          type: 'mcq',
          title: 'Looker Studio vs Tableau',
          question: '行銷人員想快速製作 GA4 週報並分享給主管，下列哪個工具**最適合**？',
          options: [
            'A. Tableau Public，因為視覺化樣式最豐富',
            'B. Power BI Desktop，因為可以離線使用',
            'C. Looker Studio，因為免費且原生整合 GA4',
            'D. Excel，因為公司已經有授權',
          ],
          answer: 2,
          explanation: 'Looker Studio 與 GA4 原生整合（同為 Google 生態系），無需匯出資料即可直接連接，並可即時共享報表連結。Tableau 視覺化更豐富但需要授權；Power BI Desktop 離線為主，與 GA4 整合需要額外設定；Excel 需要手動匯入數據，無法自動更新。',
        },
        {
          id: 'ls.u01.l01.q03',
          type: 'mcq',
          title: '連接 GA4 資料來源的步驟',
          question: '在 Looker Studio 新報表中連接 GA4 資料來源，正確的操作順序是？',
          options: [
            'A. 新增圖表 → 選擇資料來源 → 選 Google Analytics → 選 GA4 屬性',
            'B. 資源 → 管理新增的資料來源 → 選 Google Analytics → 選 GA4 屬性 → 連線',
            'C. 報表設定 → 資料集 → 匯入 CSV → 選 GA4 屬性',
            'D. 工具列 → 資料混合 → 選 Google Analytics → 完成',
          ],
          answer: 1,
          explanation: '正確路徑：在編輯模式下點選上方工具列「資源（Resource）」→「管理新增的資料來源（Manage added data sources）」→「新增資料來源」→ 搜尋並選擇「Google Analytics」連接器 → 授權後選擇對應的 GA4 屬性（Property）→ 按「連線（Connect）」→「新增至報表」。這是官方建議的標準流程。',
        },
      ],
    },
  ],
};
