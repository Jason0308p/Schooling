const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ls-u03',
  title: 'GA4 數據儀表板實戰',
  lessons: [
    {
      id: 'ls-u03-l01',
      title: '建立標準 GA4 監控儀表板',
      minutes: 30,
      objectives: [
        '建立包含 Sessions Trend 的時間序列圖，並加入日期範圍控制項',
        '用 Table 或 Funnel 元件呈現轉換漏斗各階段的數量與轉換率',
        '用 Bar Chart 或 Table 呈現流量來源分析，識別主要獲客管道',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ls.u03.l01.q01',
          type: 'mcq',
          title: '日期範圍控制項',
          question: '想讓報表使用者可以自由切換查看「過去 7 天」或「過去 30 天」的數據，應該使用哪個元件？',
          options: [
            'A. 在每個圖表的設定中個別修改日期範圍',
            'B. 新增「日期範圍控制項（Date range control）」，讓使用者互動式選擇',
            'C. 建立兩份不同的報表，各自固定日期範圍',
            'D. 在資料來源層級設定預設日期篩選',
          ],
          answer: 1,
          explanation: '「日期範圍控制項（Date range control）」是 Looker Studio 的互動元件，插入後報表使用者可以在預覽模式下自行選擇日期範圍，所有連結到同一資料來源的圖表會同步更新。路徑：插入（Insert）→ 日期範圍控制項（Date range control）。可以設定預設範圍（例如過去 28 天），使用者點選後可以改成任意日期。',
        },
        {
          id: 'ls.u03.l01.q02',
          type: 'mcq',
          title: '轉換漏斗呈現方式',
          question: '要在 Looker Studio 呈現「工作階段 → 產品頁瀏覽 → 加入購物車 → 購買」的轉換漏斗，最適合的方法是？',
          options: [
            'A. 用 Pie Chart，每個扇形代表一個漏斗步驟',
            'B. 用 4 個 Scorecard 分別顯示各步驟數量，並在下方加一個 Table 顯示各步驟轉換率',
            'C. 用 Time Series 圖，每條線代表一個漏斗步驟',
            'D. 用單一 Bar Chart，X 軸為漏斗步驟，Y 軸為數量，搭配計算欄位的轉換率標籤',
          ],
          answer: 1,
          explanation: 'Looker Studio 沒有內建漏斗圖元件（需要付費的 Community Connector）。最實用的替代方案是：頂部放 4 個 Scorecard 顯示各步驟絕對數量，讀者可以直觀看到每個階段的流失幅度；下方加一個 Table 顯示各步驟的轉換率（需要建立計算欄位）。這個組合在大多數行銷儀表板中都夠用，而且設定簡單。',
        },
        {
          id: 'ls.u03.l01.q03',
          type: 'mcq',
          title: '流量來源分析設定',
          question: '要分析 GA4 的流量來源，以「Session source / medium」為維度，Sessions 為指標建立報表，下列哪個設定可以**只顯示付費流量**？',
          options: [
            'A. 在 Table 的「指標」欄位設定篩選條件：medium 包含 "cpc"',
            'B. 新增圖表層級「篩選器（Filter）」，條件設定為 Session medium 包含（contains）"cpc"',
            'C. 在 GA4 資料來源的設定中刪除有機流量的欄位',
            'D. 在報表層級設定「資料來源篩選」排除 medium = "organic"',
          ],
          answer: 1,
          explanation: '在 Looker Studio 中篩選特定流量的正確方式是使用**圖表層級篩選器（Chart-level filter）**。設定路徑：點選圖表 → 右側「設定」分頁下方找到「篩選器（Filter）」區塊 → 「新增篩選器（Add a filter）」→ 條件設定為「Session medium」「包含（Contains）」「cpc」。這樣只有 medium 包含 "cpc" 的資料會顯示在這個圖表中，其他圖表不受影響。',
        },
      ],
    },
  ],
};
