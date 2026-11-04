const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: "cp-u01",
  title: "陣列與雜湊：先說清楚資料",
  lessons: [
    {
      id: "cp-u01-l01",
      title: "庫存異常的第一筆",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l01.md'),
      exercises: [
        {
          id: "cp.u01.l01.q01",
          type: 'mcq',
          title: "若輸入 [8,3,8,3]，應回傳？",
          question: "若輸入 [8,3,8,3]，應回傳？",
          options: ["A. 3", "B. 8", "C. null", "D. [8,3]"],
          answer: 1,
          explanation: "第三格的 8 是掃描時第一個再次出現的值。"
        },
        {
          id: "cp.u01.l01.q02",
          type: 'mcq',
          title: "為何不先排序？",
          question: "為何不先排序？",
          options: ["A. 排序會改變掃描次序", "B. Set 不能存數字", "C. 排序一定需要 O(n²)", "D. 排序不能處理負數"],
          answer: 0,
          explanation: "要求依原始掃描順序判斷第一次重複；排序可能破壞此順序。"
        },
      ],
    },
    {
      id: "cp-u01-l02",
      title: "兩筆金額湊預算",
      minutes: 20,
      objectives: ["將情境轉成可驗證的輸入與輸出", "乾跑演算法並說明邊界與複雜度", "用清楚的不變量向面試官解釋做法"],
      body: md('./l02.md'),
      exercises: [
        {
          id: "cp.u01.l02.q01",
          type: 'mcq',
          title: "輸入 [5,5]、目標 10 的結果是？",
          question: "輸入 [5,5]、目標 10 的結果是？",
          options: ["A. [0,0]", "B. null", "C. [0,1]", "D. [5,5]"],
          answer: 2,
          explanation: "第二筆查詢時 Map 已存第一筆的索引 0，兩個位置不同。"
        },
        {
          id: "cp.u01.l02.q02",
          type: 'mcq',
          title: "為何先查補數再存當前值？",
          question: "為何先查補數再存當前值？",
          options: ["A. 保證索引遞減", "B. 避免單筆 5 配自己", "C. 減少記憶體到 O(1)", "D. 自動排序"],
          answer: 1,
          explanation: "先存會讓目標為兩倍當前值時誤用同一筆。"
        },
      ],
    },
  ],
};
