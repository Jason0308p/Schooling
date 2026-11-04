const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: "cp-u02",
  title: "雙指標與滑動視窗：維持不變量",
  lessons: [
    {
      id: "cp-u02-l01",
      title: "已排序價格的組合",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l01.md'),
      exercises: [
        {
          id: "cp.u02.l01.q01",
          type: 'mcq',
          title: "目標 11，首輪 1+9=10 後移動哪端？",
          question: "目標 11，首輪 1+9=10 後移動哪端？",
          options: ["A. 右端左移", "B. 左端右移", "C. 兩端同時移動", "D. 直接回傳 null"],
          answer: 1,
          explanation: "總和偏小，需要提高左端值；有序性使移動理由成立。"
        },
        {
          id: "cp.u02.l01.q02",
          type: 'mcq',
          title: "哪種輸入會破壞此方法的保證？",
          question: "哪種輸入會破壞此方法的保證？",
          options: ["A. 有重複值", "B. 有負數", "C. 未排序的陣列", "D. 空陣列"],
          answer: 2,
          explanation: "指標移動的單調性依賴有序前提。"
        },
      ],
    },
    {
      id: "cp-u02-l02",
      title: "最長可承受時段",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l02.md'),
      exercises: [
        {
          id: "cp.u02.l02.q01",
          type: 'mcq',
          title: "上述輸入 limit=5 的答案是？",
          question: "上述輸入 limit=5 的答案是？",
          options: ["A. 1", "B. 2", "C. 3", "D. 4"],
          answer: 1,
          explanation: "合法最長視窗長度是 2，例如 [3,2]；三格 [2,1,3] 和為 6。"
        },
        {
          id: "cp.u02.l02.q02",
          type: 'mcq',
          title: "如果負載可為負數，哪句正確？",
          question: "如果負載可為負數，哪句正確？",
          options: ["A. 原法仍保證正確", "B. 只改為 if 即可", "C. 縮窗後可能錯過較長合法區間", "D. 必須先排序"],
          answer: 2,
          explanation: "負數可能讓擴窗後總和下降，超標時立即縮窗不再安全。"
        },
      ],
    },
  ],
};
