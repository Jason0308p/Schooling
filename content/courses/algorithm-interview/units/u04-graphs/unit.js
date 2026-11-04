const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: 'alg-u04', title: '遞迴、圖搜尋與面試表達', lessons: [
    { id: 'alg-u04-l01', title: '遞迴與 DFS', minutes: 20, objectives: ['設定遞迴停止條件', '避免圖的環'], body: md('./l01.md'), exercises: [
      { id: 'alg.u04.l01.q01', type: 'mcq', title: '循環邊', question: '圖有 A→B→A，遞迴 DFS 若沒有 visited 會如何？', options: ['自動停止', '反覆呼叫直到堆疊耗盡', '只訪問 A', '變成 BFS'], answer: 1, explanation: '循環邊令兩節點互相遞迴；visited 可阻止重複展開。' },
      { id: 'alg.u04.l01.q02', type: 'mcq', title: '深圖取捨', question: '圖很深時，遞迴 DFS 的特殊風險是？', options: ['無法找可達節點', '呼叫堆疊溢位', '一定變成 O(V²)', '必須先排序'], answer: 1, explanation: '每層遞迴都使用呼叫堆疊；可改用顯式堆疊。' },
    ] },
    { id: 'alg-u04-l02', title: 'BFS 與面試解題說明', minutes: 20, objectives: ['辨識最少邊數需求', '口述規格、驗證與取捨'], body: md('./l02.md'), exercises: [
      { id: 'alg.u04.l02.q01', type: 'mcq', title: '入列標記', question: 'BFS 何時標記 seen 可避免重複入列？', options: ['入列時', '全數出列後', '找到終點後', '不必標記'], answer: 0, explanation: '入列時立刻標記，其他鄰居便不會重複加入該節點。' },
      { id: 'alg.u04.l02.q02', type: 'mcq', title: '最少轉運', question: '無權圖要求最少轉運步數，適合先說明哪個選擇？', options: ['DFS 首條路必定最短', 'BFS 逐層找且需要 O(V) 額外空間', '不必確認環', '二分搜尋任意圖'], answer: 1, explanation: 'BFS 首次到達目標的層數最少，佇列與 visited 會使用 O(V) 空間。' },
    ] },
  ],
};
