/**
 * 課程設定檔（manifest）。
 * - units 的順序 = 課程順序。
 * - status: 'published'（已開放，需有 load）或 'coming_soon'（只顯示大綱）。
 * - access: 'free' | 'pro'。目前 config.features.paywall=false，全部開放；預留給未來商業化。
 * - plannedExercises：規劃題數，用來在總覽頁顯示整門課的規模。
 */
export const course = {
  id: 'sql-foundations',
  title: 'SQL 實戰分析：從零到能接需求',
  subtitle: '用一間電商公司的真實型態資料，學會行銷、營運、數據分析工作每天在用的 SQL。',
  level: '零基礎可上',
  estimatedHours: 24,
  dataset: () => import('../../datasets/ecommerce/index.js'),
  audience: [
    '想轉職 / 正在投遞數據分析、Growth、Marketing Ops、電商營運職缺的人',
    '每天在 Excel 拉樞紐分析表、想改用 SQL 直接查資料的人',
    '看得懂 GA4 / 廣告後台報表，但想自己從原始資料算指標的人',
  ],
  outcomes: [
    '獨立寫出 JOIN、彙總、子查詢、視窗函數的查詢',
    '算出營收、客單價、回購率、轉換漏斗、Cohort 留存、ROAS 等常見指標',
    '拿到一個模糊的業務問題，能拆解成 SQL 步驟並驗證結果',
    '知道 SQLite / PostgreSQL / MySQL / BigQuery 之間的語法差異',
  ],
  schedule: [
    { week: 1, title: '讀得到資料', units: ['u00', 'u01', 'u02'], goal: '能從單一張表篩選、排序、彙總出報表數字' },
    { week: 2, title: '串得起資料', units: ['u03', 'u04', 'u05'], goal: '能把多張表接起來，處理髒資料，把複雜問題拆步驟' },
    { week: 3, title: '分析得出洞察', units: ['u06', 'u07'], goal: '能用視窗函數做趨勢與排名，產出行銷分析常見報表' },
    { week: 4, title: '交付得了工作', units: ['u08', 'u09'], goal: '理解資料寫入與表設計，獨立完成綜合案例' },
  ],
  units: [
    {
      id: 'u00', no: 0, title: '認識資料庫與本課程', status: 'published', access: 'free', plannedExercises: 3,
      summary: '資料庫、資料表、欄與列是什麼；認識整門課使用的電商資料；學會使用練習系統。',
      load: () => import('./units/u00-intro/unit.js'),
    },
    {
      id: 'u01', no: 1, title: '查詢基礎：SELECT 與 WHERE', status: 'published', access: 'free', plannedExercises: 14,
      summary: '選欄位、算欄位、篩選資料、排序、取前幾名、去除重複。這是所有 SQL 的地基。',
      load: () => import('./units/u01-select/unit.js'),
    },
    {
      id: 'u02', no: 2, title: '彙總分析：GROUP BY 與 HAVING', status: 'published', access: 'free', plannedExercises: 11,
      summary: '把明細變成報表：計數、加總、平均，以及分組後再篩選。學會 SQL 的執行順序。',
      load: () => import('./units/u02-aggregate/unit.js'),
    },
    {
      id: 'u03', no: 3, title: '多表關聯：JOIN', status: 'published', access: 'free', plannedExercises: 10,
      summary: '把訂單接上會員和商品，找出從未購買的會員，理解 JOIN 會讓資料「變多」的陷阱。',
      load: () => import('./units/u03-join/unit.js'),
    },
    {
      id: 'u04', no: 4, title: '資料清理：CASE、NULL、字串與日期', status: 'published', access: 'free', plannedExercises: 13,
      summary: '處理真實世界的髒資料：空值、大小寫、寫法不一致，以及按日 / 週 / 月彙總。',
      load: () => import('./units/u04-cleaning/unit.js'),
    },
    {
      id: 'u05', no: 5, title: '子查詢與 CTE', status: 'published', access: 'free', plannedExercises: 8,
      summary: '用 WITH 把複雜問題拆成一步一步，寫出別人看得懂、自己改得動的 SQL。',
      load: () => import('./units/u05-cte/unit.js'),
    },
    {
      id: 'u06', no: 6, title: '視窗函數', status: 'published', access: 'free', plannedExercises: 11,
      summary: '不用把資料壓扁也能排名、算累計、比較前一期 —— 分析師面試的必考題。',
      load: () => import('./units/u06-window/unit.js'),
    },
    {
      id: 'u07', no: 7, title: '行銷分析實戰', status: 'published', access: 'free', plannedExercises: 12,
      summary: '把前面學的組合起來，做出 Growth / MarTech 團隊每週在看的報表。',
      load: () => import('./units/u07-marketing/unit.js'),
    },
    {
      id: 'u08', no: 8, title: '寫入資料與資料表設計', status: 'published', access: 'free', plannedExercises: 6,
      summary: '知道怎麼安全地改資料，看得懂資料表設計，跟工程師溝通不卡關。',
      load: () => import('./units/u08-write/unit.js'),
    },
    {
      id: 'u09', no: 9, title: '綜合案例：主管丟需求給你', status: 'published', access: 'free', plannedExercises: 8,
      summary: '沒有提示的開放題：從模糊需求拆解、寫查詢、驗證數字、寫結論。',
      load: () => import('./units/u09-capstone/unit.js'),
    },
  ],
};
