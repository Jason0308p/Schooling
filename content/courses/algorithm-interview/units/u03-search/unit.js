const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: 'alg-u03', title: '前綴和與二分搜尋', lessons: [
    { id: 'alg-u03-l01', title: '前綴和與半開區間', minutes: 20, objectives: ['建立前綴和', '計算區間差'], body: md('./l01.md'), exercises: [
      { id: 'alg.u03.l01.q01', type: 'mcq', title: '區間差', question: 'prefix=[0,2,7,8]，區間 [1,3) 總和為何？', options: ['5', '6', '7', '8'], answer: 1, explanation: 'prefix[3]-prefix[1]=8-2=6。' },
      { id: 'alg.u03.l01.q02', type: 'mcq', title: '預處理代價', question: '只有一次短區間查詢時，前綴和的代價是？', options: ['不能計算空區間', '先做 O(n) 預處理並占 O(n) 空間', '每次查詢 O(n²)', '必定修改原陣列'], answer: 1, explanation: '多次查詢才容易攤平預處理成本；單次短區間可直接掃描。' },
    ] },
    { id: 'alg-u03-l02', title: '二分搜尋的左邊界', minutes: 20, objectives: ['維護搜尋區間', '處理重複與無解'], body: md('./l02.md'), exercises: [
      { id: 'alg.u03.l02.q01', type: 'mcq', title: '第一個符合值', question: 'lowerBound([1,3,3,8],3) 回傳哪個索引？', options: ['0', '1', '2', '4'], answer: 1, explanation: '第一個不小於 3 的元素位於索引 1。' },
      { id: 'alg.u03.l02.q02', type: 'mcq', title: '縮小左界', question: 'sorted[mid] < target 時如何更新？', options: ['right=mid', 'left=mid+1', 'right=mid-1', '直接回傳 mid'], answer: 1, explanation: 'mid 及左側都太小，第一個符合值只可能在右側。' },
    ] },
  ],
};
