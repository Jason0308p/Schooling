const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: 'alg-u02', title: '雙指標與滑動視窗', lessons: [
    { id: 'alg-u02-l01', title: '排序資料的雙指標', minutes: 20, objectives: ['說明移動方向', '檢查排序前提'], body: md('./l01.md'), exercises: [
      { id: 'alg.u02.l01.q01', type: 'mcq', title: '和太小', question: '排序陣列兩端之和小於目標時，應移動哪端？', options: ['右端往左', '左端往右', '同時往外', '直接停止'], answer: 1, explanation: '右端往左只會讓和更小；要增加較小的左端值。' },
      { id: 'alg.u02.l01.q02', type: 'mcq', title: '排序前提', question: '未排序陣列直接套用兩端指標，主要問題是？', options: ['不能存負數', '無法安全排除候選配對', '一定超時', '不能有空陣列'], answer: 1, explanation: '移動時排除候選值的論證依賴排序。' },
    ] },
    { id: 'alg-u02-l02', title: '固定長度滑動視窗', minutes: 20, objectives: ['維持視窗和', '分析負數對可變視窗的影響'], body: md('./l02.md'), exercises: [
      { id: 'alg.u02.l02.q01', type: 'mcq', title: '滑動更新', question: '從 [3,1] 滑到 [1,4] 時如何更新總和？', options: ['加 3 減 4', '加 4 減 3', '只加 4', '重新設零'], answer: 1, explanation: '移出 3、加入 4，原本的和 4 變成 5。' },
      { id: 'alg.u02.l02.q02', type: 'mcq', title: '可變視窗限制', question: '含負數時，依總和門檻縮小可變長視窗為何可能失效？', options: ['負數不能相加', '增減元素後總和不再單調', '陣列不能存負數', '只會影響空間'], answer: 1, explanation: '加入負數可能降低和、移出負數可能提高和，單調判斷不成立。' },
    ] },
  ],
};
