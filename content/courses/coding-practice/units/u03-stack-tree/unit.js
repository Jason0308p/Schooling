const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: "cp-u03",
  title: "堆疊與樹：描述狀態和走訪",
  lessons: [
    {
      id: "cp-u03-l01",
      title: "編輯器括號提示",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l01.md'),
      exercises: [
        {
          id: "cp.u03.l01.q01",
          type: 'mcq',
          title: "字串 \"([)]\" 的結果？",
          question: "字串 \"([)]\" 的結果？",
          options: ["A. true，數量相同", "B. false，遇到 ) 時頂端是 [", "C. true，括號可以交錯", "D. false，因為含方括號"],
          answer: 1,
          explanation: "配對要求後進先出；遇到 ) 時頂端 [ 不符。"
        },
        {
          id: "cp.u03.l01.q02",
          type: 'mcq',
          title: "掃描完仍有開括號時怎麼處理？",
          question: "掃描完仍有開括號時怎麼處理？",
          options: ["A. 回傳 true", "B. 自動補齊", "C. 回傳 false", "D. 排序後再檢查"],
          answer: 2,
          explanation: "沒有閉括號消去殘留開括號，配對尚未完成。"
        },
      ],
    },
    {
      id: "cp-u03-l02",
      title: "組織樹的逐層通知",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l02.md'),
      exercises: [
        {
          id: "cp.u03.l02.q01",
          type: 'mcq',
          title: "範例樹的輸出是？",
          question: "範例樹的輸出是？",
          options: ["A. [A,B,D,C]", "B. [D,B,C,A]", "C. [A,B,C,D]", "D. [A,C,B,D]"],
          answer: 2,
          explanation: "佇列先加入 B、C，再由 B 加入 D，因此 C 在 D 前面。"
        },
        {
          id: "cp.u03.l02.q02",
          type: 'mcq',
          title: "為何用 head 索引而非每輪 shift？",
          question: "為何用 head 索引而非每輪 shift？",
          options: ["A. 可以不儲存節點", "B. 避免陣列前端移除可能造成搬移成本", "C. 讓樹變成排序陣列", "D. 讓空根節點變成 A"],
          answer: 1,
          explanation: "head 只往前走，不需要每輪刪除陣列第一格。"
        },
      ],
    },
  ],
};
