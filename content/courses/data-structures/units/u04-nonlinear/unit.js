const md = (f) => new URL(f, import.meta.url).href;
export const unit = { id: 'ds-u04', title: '樹、堆積與圖', lessons: [
  { id: 'ds-u04-l01', title: '樹的走訪與高度', minutes: 15, objectives: ['用佇列完成層序走訪', '區分平衡與退化樹高度'], body: md('./l01.md'), exercises: [
    { id: 'ds.u04.l01.q01', type: 'mcq', title: '層序順序', question: '二元樹根為 A，左子 B、右子 C，B 的左子 D；從左到右層序走訪結果？', options: ['A,B,D,C', 'D,B,A,C', 'A,B,C,D', 'A,C,B,D'], answer: 2, explanation: '按深度逐層，先根 A，再 B、C，最後 D；可用 FIFO 佇列處理。' },
    { id: 'ds.u04.l01.q02', type: 'mcq', title: '退化高度', question: '一棵有 n 個節點、每個節點最多只有一個子節點的二元樹，高度（以邊數計）是多少？', options: ['0', 'log₂ n', 'n−1', 'n²'], answer: 2, explanation: '整棵樹形成一條鏈，根到最深葉共有 n−1 條邊；n=1 時高度為 0。' },
  ] },
  { id: 'ds-u04-l02', title: '二元堆積與優先佇列', minutes: 15, objectives: ['區分堆積與排序陣列', '推導插入和取最小值成本'], body: md('./l02.md'), exercises: [
    { id: 'ds.u04.l02.q01', type: 'mcq', title: '最小堆根', question: '有效最小堆存有 8、3、5、1，根節點的值是？', options: ['8', '5', '3', '1'], answer: 3, explanation: '最小堆保證每個父節點不大於子節點，所以整體最小值 1 在根；其他節點未必全域排序。' },
    { id: 'ds.u04.l02.q02', type: 'mcq', title: '堆積插入', question: '二元堆積有 n 個元素，插入新值並向上調整，最壞時間複雜度為？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 1, explanation: '完全二元樹高度為 O(log n)，新值最多沿父節點一路向上交換。' },
  ] },
  { id: 'ds-u04-l03', title: '圖的鄰接表與遍歷', minutes: 15, objectives: ['建立鄰接表並標記走訪', '說明 BFS 與 DFS 的用途及複雜度'], body: md('./l03.md'), exercises: [
    { id: 'ds.u04.l03.q01', type: 'mcq', title: '避免循環', question: '無向圖 A—B—C—A 從 A 遍歷，哪個機制能避免反覆走環？', options: ['每次將邊排序', '走訪前或入隊時記錄 visited', '只看節點名稱長度', '改用遞迴即可'], answer: 1, explanation: '以 visited 集合記錄已發現節點，遇到環中的節點便不重複入隊或遞迴。' },
    { id: 'ds.u04.l03.q02', type: 'mcq', title: '無權最短路', question: '在每條邊權重相同的圖中，從起點找最少邊數到某節點，應先選哪種遍歷？', options: ['BFS（佇列）', '任意順序 DFS 且首次到達就停止', '對節點名稱排序', '只掃起點的鄰居'], answer: 0, explanation: 'BFS 按邊數一層一層探索，首次發現目標即為最少邊數；一般 DFS 首次到達不保證最短。' },
  ] },
] };
