const md = (f) => new URL(f, import.meta.url).href;
export const unit = {
  id: 'alg-u02', title: '雙指標與滑動視窗', lessons: [
    { id: 'alg-u02-l01', title: '排序資料的雙指標', minutes: 20, objectives: ['說明移動方向', '檢查排序前提'], body: md('./l01.md'), exercises: [
      { id: 'alg.u02.l01.q01', type: 'mcq', title: '排除哪一端', question: '已排序票價 [2,4,7,11]，目標 15；先試 2+11=13。為什麼可以排除 2？', options: ['因為 2 是最小值，任何目標都不需要它', '因為固定 2，換目前區間內更便宜的票只會讓和更小', '因為 11 一定要和 4 配對', '因為每次只能試一次 2'], answer: 1, explanation: '排序使 11 已是剩餘候選中最大的；2+11 仍不足 15，2 搭其他候選只會更小。不能因為 2 最小就對所有目標都排除它，也不能先假定 11 的搭檔。' },
      { id: 'alg.u02.l01.q02', type: 'mcq', title: '找出排序反例', question: '未排序卻直接執行兩端指標，哪組輸入會錯誤回傳 false，雖然存在兩個不同索引之和等於目標？', options: ['[2,4,7,11]，目標 15', '[2,1,4]，目標 5', '[4,4]，目標 8', '[]，目標 5'], answer: 1, explanation: '在 [2,1,4] 中先試 2+4=6，右端移向 1；再試 2+1=3，左端移動後相遇並回傳 false，但 1+4=5。未排序時無法安全整批排除候選。' },
    ] },
    { id: 'alg-u02-l02', title: '固定長度滑動視窗', minutes: 20, objectives: ['維持視窗和', '分析負數對可變視窗的影響'], body: md('./l02.md'), exercises: [
      { id: 'alg.u02.l02.q01', type: 'mcq', title: '視窗狀態乾跑', question: '每日請求數 [3,1,4,2]、k=2。若初始 best=4，處理完最後一段 [4,2] 後，sum 與 best 應是多少？', options: ['sum=6、best=6', 'sum=5、best=6', 'sum=6、best=5', 'sum=10、best=10'], answer: 0, explanation: '第一段 3+1=4；扣 3 加 4 得 5；再扣 1 加 2 得 6，因此最後 sum=6，最大值 best=6。best 記錄看過的區間，不是所有天數相加。' },
      { id: 'alg.u02.l02.q02', type: 'mcq', title: '負數反例', question: '固定長度 maxWindow([-5,-2,-3], 2) 應回傳 -5。哪個修改會讓結果錯誤變成 0？', options: ['把 best 初始化為 0', '先把前兩個值相加', '每次扣掉離開的值', '把 k=0 視為無效輸入'], answer: 0, explanation: '兩段和分別為 -7 與 -5，最大值仍是 -5。若 best 從 0 開始，負數結果都無法更新它；應以第一段和初始化。固定長視窗本身可以處理負數。' },
    ] },
  ],
};
