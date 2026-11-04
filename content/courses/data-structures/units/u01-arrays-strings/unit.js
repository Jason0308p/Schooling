const md = (f) => new URL(f, import.meta.url).href;
export const unit = { id: 'ds-u01', title: '陣列與字串', lessons: [
  { id: 'ds-u01-l01', title: '陣列索引與雙指標', minutes: 15, objectives: ['辨識索引與插入成本', '使用雙指標掃描有序資料'], body: md('./l01.md'), exercises: [
    { id: 'ds.u01.l01.q01', type: 'mcq', title: '陣列開頭插入', question: '長度為 n 的 JavaScript 陣列在開頭插入一筆，最壞情況下需要移動多少既有元素？', options: ['0 個', '1 個', '約 n 個', '約 log n 個'], answer: 2, explanation: '開頭騰出位置時原有 n 個元素都可能要往後移一格，因此是 O(n)。' },
    { id: 'ds.u01.l01.q02', type: 'mcq', title: '雙指標成本', question: '已排序陣列用左右指標找目標和，兩指標每步只向內移動一次；最多總共移動幾次（n 為長度）？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: '兩指標每次縮小搜尋區間，總移動次數不超過 n−1；不需額外查找表。' },
  ] },
  { id: 'ds-u01-l02', title: '字串掃描與組裝', minutes: 15, objectives: ['處理字串與 Unicode 邊界', '比較反覆串接與陣列組裝'], body: md('./l02.md'), exercises: [
    { id: 'ds.u01.l02.q01', type: 'mcq', title: '字元單位', question: '在 JavaScript 中，對字串「😀」取 .length，得到多少？', options: ['0', '1', '2', '4'], answer: 2, explanation: 'length 計算 UTF-16 code unit，這個表情符號占兩個單位；以 Unicode code point 迭代可用 Array.from。' },
    { id: 'ds.u01.l02.q02', type: 'mcq', title: '字串組裝', question: '要依序收集 n 個片段後輸出一個字串，哪種方式能避免每次迴圈都建立逐漸變長的前綴副本？', options: ['每輪用 slice 複製前綴', '把片段 push 到陣列，最後 join 一次', '每輪用 split 再 join', '每輪重建完整字串的所有字元'], answer: 1, explanation: '先收集片段，最後 join 一次可避免明確重建每個累積前綴；仍需 O(輸出總長度) 空間與輸出成本。' },
  ] },
] };
