export const course = {
  id: 'algorithm-interview',
  title: '演算法與面試解題入門',
  subtitle: '從讀題、維護不變量到說明複雜度，用 JavaScript 練習可驗證的解題思路。',
  level: '入門',
  estimatedHours: 4,
  dataset: null,
  audience: ['準備技術面試的初學者', '想建立解題流程的 JavaScript 學習者'],
  outcomes: ['辨認輸入限制與邊界案例', '運用雙指標、滑動視窗、前綴和與二分搜尋', '用 DFS、BFS 與遞迴描述搜尋過程', '向面試官清楚交代不變量、測試與取捨'],
  units: [
    { id: 'alg-u01', no: 1, title: '讀題與複雜度', status: 'published', access: 'free', plannedExercises: 4, summary: '先確認規格與邊界，再估計時間和額外空間。', load: () => import('./units/u01-foundations/unit.js') },
    { id: 'alg-u02', no: 2, title: '雙指標與滑動視窗', status: 'published', access: 'free', plannedExercises: 4, summary: '用指標移動維持區間的不變量。', load: () => import('./units/u02-windows/unit.js') },
    { id: 'alg-u03', no: 3, title: '前綴和與二分搜尋', status: 'published', access: 'free', plannedExercises: 4, summary: '預處理區間查詢，並縮小有序搜尋空間。', load: () => import('./units/u03-search/unit.js') },
    { id: 'alg-u04', no: 4, title: '遞迴、圖搜尋與面試表達', status: 'published', access: 'free', plannedExercises: 4, summary: '用 DFS/BFS 探索關聯，並口述驗證過程。', load: () => import('./units/u04-graphs/unit.js') },
  ],
};
