const md = (f) => new URL(f, import.meta.url).href;
export const unit = { id: 'ds-u02', title: 'Hash Map 與 Set', lessons: [
  { id: 'ds-u02-l01', title: 'Map 計數與鍵的語意', minutes: 15, objectives: ['用 Map 建立頻率表', '區分鍵的相等規則與平均成本'], body: md('./l01.md'), exercises: [
    { id: 'ds.u02.l01.q01', type: 'mcq', title: '頻率表', question: '依序處理 ["a", "b", "a"] 並每次對 Map 的計數加一，最後 get("a") 是？', options: ['0', '1', '2', '3'], answer: 2, explanation: '字串 a 出現兩次，各次將同一個鍵的計數加一，結果為 2。' },
    { id: 'ds.u02.l01.q02', type: 'mcq', title: '物件鍵', question: 'const a = {}; const b = {}; const m = new Map([[a, 7]]); m.get(b) 是什麼？', options: ['7', '0', 'undefined', 'null'], answer: 2, explanation: 'a 與 b 是不同物件參照；Map 的物件鍵依參照辨識，未命中的 get 回傳 undefined。' },
  ] },
  { id: 'ds-u02-l02', title: 'Set 去重與滑動視窗', minutes: 15, objectives: ['使用 Set 表達成員資格', '維持視窗不重複的不變條件'], body: md('./l02.md'), exercises: [
    { id: 'ds.u02.l02.q01', type: 'mcq', title: '去重結果', question: 'new Set([3, 3, 1, 3]).size 是多少？', options: ['1', '2', '3', '4'], answer: 1, explanation: 'Set 只保留不同的值，這裡只有 3 和 1，size 為 2。' },
    { id: 'ds.u02.l02.q02', type: 'mcq', title: '視窗移動', question: '掃描 ["a", "b", "a"]，維持不含重複字串的連續視窗；讀到最後一個 a 時，先從左端移除什麼？', options: ['第一個 a', '最後一個 a', '所有 b', '不必移除'], answer: 0, explanation: '先移除左端的第一個 a，才可加入新 a；視窗 [b,a] 仍無重複。' },
  ] },
] };
