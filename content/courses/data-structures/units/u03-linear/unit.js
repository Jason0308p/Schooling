const md = (f) => new URL(f, import.meta.url).href;
export const unit = { id: 'ds-u03', title: '堆疊、佇列與鏈結串列', lessons: [
  { id: 'ds-u03-l01', title: '後進先出與先進先出', minutes: 15, objectives: ['判斷 LIFO 與 FIFO', '避免用 shift 製造重複搬移'], body: md('./l01.md'), exercises: [
    { id: 'ds.u03.l01.q01', type: 'mcq', title: '堆疊出列', question: '空堆疊依序 push(4)、push(9)，再 pop()；取出的值是？', options: ['4', '9', 'undefined', '13'], answer: 1, explanation: '堆疊後進先出，最後放入的 9 最先取出。' },
    { id: 'ds.u03.l01.q02', type: 'mcq', title: '佇列實作', question: '以 JS 陣列實作大量入隊與出隊，哪種出隊方式避免每次 shift 導致其餘元素搬移？', options: ['每次 sort', '每次 unshift', '維持 head 索引並讀取 queue[head++]', '每次 reverse'], answer: 2, explanation: 'head 索引讓取出元素不必位移後續項目；使用完可偶爾切掉舊前綴，避免長期佔用記憶體。' },
  ] },
  { id: 'ds-u03-l02', title: '鏈結串列的節點與指標', minutes: 15, objectives: ['重接 next 指標', '說明搜尋與已知節點插入的差異'], body: md('./l02.md'), exercises: [
    { id: 'ds.u03.l02.q01', type: 'mcq', title: '已知節點後插入', question: '已持有單向鏈結串列中的節點 p 與新節點 x，要將 x 插在 p 後面，正確順序是？', options: ['先 p.next = x，再 x.next = p.next', '先 x.next = p.next，再 p.next = x', '只做 p.next = x', '先 x.next = p'], answer: 1, explanation: '先保存原本的後繼到 x.next，再將 p.next 指向 x，才不會遺失剩餘鏈。' },
    { id: 'ds.u03.l02.q02', type: 'mcq', title: '搜尋成本', question: '只有單向鏈結串列的 head，欲找最後一個節點（長度 n > 0），時間複雜度為？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: '沒有尾指標與隨機索引時，必須沿 next 最多走訪 n 個節點。' },
  ] },
] };
