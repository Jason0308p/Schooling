export const course = {
  id: 'data-structures',
  title: '資料結構基礎：從選擇容器到說清楚複雜度',
  subtitle: '用 JavaScript 的具體情境練習陣列、雜湊、線性結構與樹圖的取捨。',
  level: '入門',
  estimatedHours: 3,
  dataset: null,
  audience: ['準備技術面試的初學者', '想理解效能取捨的 JavaScript 開發者'],
  outcomes: ['依操作需求選擇合適的資料結構', '分析時間與額外空間複雜度並指出假設', '以邊界案例口頭驗證演算法'],
  units: [
    { id: 'ds-u01', no: 1, title: '陣列與字串', status: 'published', access: 'free', plannedExercises: 4, summary: '索引、雙指標與字串不可變性。', load: () => import('./units/u01-arrays-strings/unit.js') },
    { id: 'ds-u02', no: 2, title: 'Hash Map 與 Set', status: 'published', access: 'free', plannedExercises: 4, summary: '用雜湊查找換取時間，理解鍵與碰撞假設。', load: () => import('./units/u02-hash/unit.js') },
    { id: 'ds-u03', no: 3, title: '堆疊、佇列與鏈結串列', status: 'published', access: 'free', plannedExercises: 4, summary: '操作順序、佇列頭指標與節點重接。', load: () => import('./units/u03-linear/unit.js') },
    { id: 'ds-u04', no: 4, title: '樹、堆積與圖', status: 'published', access: 'free', plannedExercises: 6, summary: '層序走訪、優先佇列與圖遍歷的邊界。', load: () => import('./units/u04-nonlinear/unit.js') },
  ],
};
