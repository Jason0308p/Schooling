const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: 'alg-u01', title: '讀題與複雜度', lessons: [
    { id: 'alg-u01-l01', title: 'Big O 從工作量推導：去重與排序', minutes: 20, objectives: ['以同一案例比較線性、平方與 n log n 的成本來源', '區分複製、排序的時間與額外空間', '用不平均拆分反例檢驗推理'], body: md('./l01.md'), exercises: [
      { id: 'alg.u01.l01.q01', type: 'mcq', title: '改變拆分條件', question: '某合併演算法每次把 n 筆拆成 1 筆與 n−1 筆，合併目前這一組要 O(n)。最壞總時間與原因是哪一項？', options: ['O(log n)：只要使用遞迴就會對半減少', 'O(n)：每層只合併一次', 'O(n log n)：所有合併演算法層數都相同', 'O(n²)：約 n 層，逐層成本從 n 遞減到 1'], answer: 3, explanation: '不平均拆分令最長路徑每次只減少 1，約有 n 層；成本 n + (n−1) + … + 1 呈平方級。只有規模持續按比例縮小才有約 log n 層。' },
      { id: 'alg.u01.l01.q02', type: 'mcq', title: '複製與排序的成本', question: '對 n 個數字執行 `const out = [...arr].sort((a,b) => a-b)`；若以高效比較排序的 O(n log n) 作面試分析模型，下列哪個推論最合理？', options: ['複製 O(n) 加排序 O(n log n)，總時間以 O(n log n) 為主；複本至少要 O(n) 空間', '兩步驟相乘，時間 O(n² log n)；不需額外空間', '複製後原陣列變短，因此排序是 O(1)', '所有 JavaScript 引擎的 sort 最壞時間與額外空間都由規格保證相同'], answer: 0, explanation: '依序執行的成本相加，O(n)+O(n log n) 由後者主導；展開複製至少佔 n 個元素。JavaScript 規格未規定各引擎排序演算法及其複雜度；這是一般面試分析模型，不是跨引擎保證。' },
    ] },
    { id: 'alg-u01-l02', title: '邊界案例與不變量', minutes: 20, objectives: ['定義空輸入契約', '用不變量驗證掃描'], body: md('./l02.md'), exercises: [
      { id: 'alg.u01.l02.q01', type: 'mcq', title: '負數陷阱', question: '最大值掃描若以 0 初始化，對 [-5,-2] 會發生什麼事？', options: ['得到 -2', '錯誤得到 0', '得到 -5', '拋出例外'], answer: 1, explanation: '0 不在輸入中；全部是負數時應從第一個元素開始初始化。' },
      { id: 'alg.u01.l02.q02', type: 'mcq', title: '掃描不變量', question: '讀完前 i 筆後，best 應代表什麼？', options: ['最後一筆', '未讀資料的最大值', '已讀資料的最大值', '固定為零'], answer: 2, explanation: '每次比較更新後，best 保持為已讀元素的最大值。' },
    ] },
  ],
};
