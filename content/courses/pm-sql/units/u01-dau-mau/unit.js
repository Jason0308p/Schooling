const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'pm-u01',
  title: '產品核心指標（DAU / MAU / Stickiness）',
  lessons: [
    {
      id: 'pm-u01-l01',
      title: 'DAU 與 MAU：日活躍 vs 月活躍用戶',
      minutes: 30,
      objectives: [
        '理解 DAU（每日活躍用戶）與 MAU（每月活躍用戶）的定義與差異',
        '用 COUNT DISTINCT + GROUP BY 計算每日 DAU',
        '用 strftime 取年月，計算每月 MAU',
        '比較不同方案（plan）的活躍用戶分佈',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'pm.u01.l01.e01',
          title: '計算 2025 年每月 DAU 平均值',
          difficulty: 1,
          ordered: true,
          scenario: '你的 CEO 每週一看「上週平均 DAU」，你需要用 SQL 算出每個月的平均 DAU。',
          prompt: `計算 2025 年**每個月的平均 DAU**（每日活躍用戶數的月平均）。

**步驟：**
1. 先用子查詢或 CTE 算出每天的 DAU（\`daily_active\` 中每天的不重複 \`user_id\` 數）
2. 再依月份分組，取 \`AVG\`

**回傳欄位：** \`month\`（格式 YYYY-MM）、\`avg_dau\`（四捨五入到整數）

**排序：** \`month ASC\`

先建立完整 2025 日曆並 LEFT JOIN 活躍資料，無活躍日補 0，再按月平均。`,
          starter: '',
          answer: `WITH RECURSIVE calendar(log_date) AS (
  SELECT '2025-01-01'
  UNION ALL SELECT date(log_date, '+1 day') FROM calendar WHERE log_date < '2025-12-31'
), daily_dau AS (
  SELECT strftime('%Y-%m', c.log_date) AS month, c.log_date,
         COUNT(DISTINCT da.user_id) AS dau
  FROM calendar c LEFT JOIN daily_active da ON da.log_date = c.log_date
  GROUP BY c.log_date
)
SELECT
  month,
  ROUND(AVG(dau)) AS avg_dau
FROM daily_dau
GROUP BY month
ORDER BY month;`,
          hints: [
            '遞迴 CTE 建立 2025-01-01 至 2025-12-31 的日曆，無活躍日仍保留。',
            '先算每天的 DAU（每天有幾位不重複用戶），再按月取平均',
            '用 strftime(\'%Y-%m\', log_date) 取出年月',
            '外層 SELECT 對 month 分組，AVG(dau) 即月平均 DAU',
          ],
          explanation: `**核心思路：** 兩層聚合 — 先 GROUP BY 日期得到每日 DAU，再 GROUP BY 月份取平均。

**常見錯誤：**
- 直接 \`COUNT(DISTINCT user_id)\` 配合 \`GROUP BY month\`：這樣得到的是「當月有出現過的不重複用戶數」（即 MAU），不是 DAU 平均
- 忘記 \`DISTINCT\`：同一用戶同天多筆紀錄時會重複計算

**業務意義：** 平均 DAU 比單日 DAU 更穩定，適合用來追蹤趨勢。
無紀錄日補零才是完整月份平均，不可僅平均有紀錄日。`,
          negatives: [
            `SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS avg_dau FROM daily_active GROUP BY month ORDER BY month;`,
            `SELECT strftime('%Y-%m', log_date) AS month, COUNT(*) / COUNT(DISTINCT log_date) AS avg_dau FROM daily_active GROUP BY month ORDER BY month;`,
          ],
        },
        {
          id: 'pm.u01.l01.e02',
          title: '計算 2025 年每月 MAU',
          difficulty: 1,
          ordered: true,
          scenario: '投資人問：「你們的月活是多少？」你需要從資料庫裡直接查出每月 MAU。',
          prompt: `計算 2025 年**每個月的 MAU**（月活躍用戶數）。

定義：某月只要在 \`daily_active\` 中有任何一筆紀錄，就算該月活躍。

**回傳欄位：** \`month\`（格式 YYYY-MM）、\`mau\`

**排序：** \`month ASC\``,
          starter: '',
          answer: `SELECT
  strftime('%Y-%m', log_date) AS month,
  COUNT(DISTINCT user_id) AS mau
FROM daily_active
WHERE log_date >= '2025-01-01' AND log_date < '2026-01-01'
GROUP BY month
ORDER BY month;`,
          hints: [
            'MAU = 該月有出現過的不重複用戶數',
            '用 strftime(\'%Y-%m\', log_date) 取出年月再 GROUP BY',
          ],
          explanation: `**MAU 定義：** 該月至少有一天活躍的不重複用戶數。一行 COUNT DISTINCT 搞定。

**常見錯誤：**
- 忘記 DISTINCT：同一用戶當月有多天紀錄會被重複計算`,
          negatives: [
            `SELECT strftime('%Y-%m', log_date) AS month, COUNT(user_id) AS mau FROM daily_active GROUP BY month ORDER BY month;`,
          ],
        },
        {
          id: 'pm.u01.l01.e03',
          title: '各方案用戶的月活比較',
          difficulty: 2,
          ordered: true,
          scenario: '你想了解 free、pro、enterprise 用戶的活躍程度差異，以決定是否要針對 free 用戶設計轉換推廣活動。',
          prompt: `計算 2025 年每個月、每種 **\`plan\`** 的 MAU。

需要 JOIN \`users\` 表取得方案資訊。

**回傳欄位：** \`month\`、\`plan\`、\`mau\`

**排序：** \`month ASC\`，同月內依 \`plan\` 字母排序`,
          starter: '',
          answer: `SELECT
  strftime('%Y-%m', da.log_date) AS month,
  u.plan,
  COUNT(DISTINCT da.user_id) AS mau
FROM daily_active da
JOIN users u ON u.user_id = da.user_id
WHERE da.log_date >= '2025-01-01' AND da.log_date < '2026-01-01'
GROUP BY month, u.plan
ORDER BY month, u.plan;`,
          hints: [
            'JOIN users 取得 plan 欄位',
            '在 GROUP BY 加上 u.plan 做分組',
          ],
          explanation: `**思路：** 在 MAU 查詢基礎上加一個 JOIN + GROUP BY plan。

**業務應用：** 描述當前方案標籤下的月活分布；沒有歷史方案與試用期資料，不能由此直接判斷試用期後流失。`,
          negatives: [
            `SELECT strftime('%Y-%m', da.log_date) AS month, u.plan, COUNT(da.user_id) AS mau FROM daily_active da JOIN users u ON u.user_id = da.user_id GROUP BY month, u.plan ORDER BY month, u.plan;`,
          ],
        },
      ],
    },
    {
      id: 'pm-u01-l02',
      title: 'Stickiness = DAU / MAU',
      minutes: 25,
      objectives: [
        '理解 Stickiness 的業務意義（用戶黏性）',
        '用 CTE 組合 DAU 與 MAU 計算 Stickiness',
        '比較不同月份的 Stickiness 趨勢',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'pm.u01.l02.e01',
          title: '計算每月 Stickiness',
          difficulty: 2,
          ordered: true,
          scenario: '你的產品 Lead 說：「Stickiness 低於 20% 就要警惕。」你需要每月追蹤這個數字。',
          prompt: `計算 2025 年**每個月的 Stickiness**（= 當月平均 DAU ÷ MAU × 100%）。

**步驟建議：**
1. CTE 1：計算每天的 DAU
2. CTE 2：每月的平均 DAU（avg_dau）和 MAU
3. 最後計算 stickiness_pct

**回傳欄位：** \`month\`、\`avg_dau\`、\`mau\`、\`stickiness_pct\`（百分比，保留兩位小數）

**排序：** \`month ASC\`

完整涵蓋 2025 年日曆，每個無紀錄日視為 DAU = 0（假設資料完整，不能把漏送資料當真實零）。平均以當月日曆天數為分母。DAU 與 MAU 分別聚合到月後再 JOIN，禁止接回逐人明細造成 DAU 加權。avg_dau 顯示兩位小數，比例用未四捨五入平均值計算；MAU 為 0 時比例回傳 NULL。`,
          starter: '',
          answer: `WITH RECURSIVE calendar(log_date) AS (
  SELECT '2025-01-01'
  UNION ALL SELECT date(log_date, '+1 day') FROM calendar WHERE log_date < '2025-12-31'
), daily_dau AS (
  SELECT strftime('%Y-%m', c.log_date) AS month, c.log_date,
         COUNT(DISTINCT da.user_id) AS dau
  FROM calendar c LEFT JOIN daily_active da ON da.log_date = c.log_date
  GROUP BY c.log_date
), monthly_dau AS (
  SELECT month, AVG(dau) AS avg_dau FROM daily_dau GROUP BY month
), monthly_mau AS (
  SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS mau
  FROM daily_active WHERE log_date >= '2025-01-01' AND log_date < '2026-01-01'
  GROUP BY month
), monthly AS (
  SELECT d.month, d.avg_dau, COALESCE(m.mau, 0) AS mau
  FROM monthly_dau d LEFT JOIN monthly_mau m ON m.month = d.month
)
SELECT
  month,
  ROUND(avg_dau, 2) AS avg_dau,
  mau,
  ROUND(avg_dau * 100.0 / NULLIF(mau, 0), 2) AS stickiness_pct
FROM monthly
ORDER BY month;`,
          hints: [
            '先用日曆 LEFT JOIN daily_active 計算每日 DAU，缺日補零。',
            '每日 DAU 按月平均；MAU 從原表獨立 COUNT(DISTINCT user_id)，以月份 JOIN。',
            '以未四捨五入的平均 DAU 算百分比；排序依題目決勝欄位。',
          ],
          explanation: `平均 DAU 的每一天權重相同。若每日聚合後再 JOIN 到逐人明細，高 DAU 日會重複更多次，AVG 會變成不正確的加權平均。日曆補零、DAU/MAU 分別聚合，再以月份合併。這是描述性黏性指標，不能直接推論功能帶來成長。`,
          negatives: [
            `WITH daily_dau AS (SELECT log_date, strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS dau FROM daily_active GROUP BY log_date) SELECT d.month, ROUND(AVG(d.dau),2) AS avg_dau, COUNT(DISTINCT a.user_id) AS mau, ROUND(AVG(d.dau)*100.0/COUNT(DISTINCT a.user_id),2) AS stickiness_pct FROM daily_dau d JOIN daily_active a ON a.log_date=d.log_date GROUP BY d.month ORDER BY d.month;`,
          ],
        },
        {
          id: 'pm.u01.l02.e02',
          title: '找出 Stickiness 最高的前 3 個月',
          difficulty: 2,
          ordered: true,
          scenario: '你想找出用戶黏性最好的季節，來規劃下一年的推廣時程。',
          prompt: `找出 2025 年 **Stickiness 最高的前 3 個月**。

Stickiness = 當月平均 DAU ÷ MAU × 100

**回傳欄位：** \`month\`、\`stickiness_pct\`（保留兩位小數）

**排序：** \`stickiness_pct DESC\`，同分依 month ASC，只回傳前 3 筆

完整涵蓋 2025 年日曆，每個無紀錄日視為 DAU = 0（假設資料完整，不能把漏送資料當真實零）。平均以當月日曆天數為分母。DAU 與 MAU 分別聚合到月後再 JOIN，禁止接回逐人明細造成 DAU 加權。avg_dau 顯示兩位小數，比例用未四捨五入平均值計算；MAU 為 0 時比例回傳 NULL。`,
          starter: '',
          answer: `WITH RECURSIVE calendar(log_date) AS (
  SELECT '2025-01-01'
  UNION ALL SELECT date(log_date, '+1 day') FROM calendar WHERE log_date < '2025-12-31'
), daily_dau AS (
  SELECT strftime('%Y-%m', c.log_date) AS month, c.log_date,
         COUNT(DISTINCT da.user_id) AS dau
  FROM calendar c LEFT JOIN daily_active da ON da.log_date = c.log_date
  GROUP BY c.log_date
), monthly_dau AS (
  SELECT month, AVG(dau) AS avg_dau FROM daily_dau GROUP BY month
), monthly_mau AS (
  SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS mau
  FROM daily_active WHERE log_date >= '2025-01-01' AND log_date < '2026-01-01'
  GROUP BY month
), monthly AS (
  SELECT d.month, d.avg_dau, COALESCE(m.mau, 0) AS mau
  FROM monthly_dau d LEFT JOIN monthly_mau m ON m.month = d.month
)
SELECT
  month,
  ROUND(avg_dau * 100.0 / NULLIF(mau, 0), 2) AS stickiness_pct
FROM monthly
ORDER BY stickiness_pct DESC, month ASC
LIMIT 3;`,
          hints: [
            '先用日曆 LEFT JOIN daily_active 計算每日 DAU，缺日補零。',
            '每日 DAU 按月平均；MAU 從原表獨立 COUNT(DISTINCT user_id)，以月份 JOIN。',
            '以未四捨五入的平均 DAU 算百分比；排序依題目決勝欄位。',
          ],
          explanation: `平均 DAU 的每一天權重相同。若每日聚合後再 JOIN 到逐人明細，高 DAU 日會重複更多次，AVG 會變成不正確的加權平均。日曆補零、DAU/MAU 分別聚合，再以月份合併。這是描述性黏性指標，不能直接推論功能帶來成長。`,
          negatives: [
            `WITH daily_dau AS (SELECT log_date, COUNT(DISTINCT user_id) AS dau FROM daily_active GROUP BY log_date), monthly_mau AS (SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS mau FROM daily_active GROUP BY month) SELECT d.month, ROUND(AVG(d.dau), 1) AS avg_dau, m.mau, ROUND(AVG(d.dau) * 100.0 / m.mau, 1) AS stickiness FROM (SELECT strftime('%Y-%m', log_date) AS month, dau FROM daily_dau) d JOIN monthly_mau m ON d.month = m.month GROUP BY d.month ORDER BY d.month`,
          ],
        },
        {
          id: 'pm.u01.l02.e03',
          title: `Pro vs Free：平均 DAU / YAU 年度比率`,
          difficulty: 3,
          ordered: true,
          scenario: 'PM 想描述 Pro 與 Free 用戶的年度活躍比率差異；本題不是顯著性檢定，也不判斷付費功能的因果效果。',
          prompt: `分別計算 **\`pro\`** 和 **\`free\`** 用戶在 2025 年全年的平均 DAU / YAU 年度活躍比率。

定義：
- 全年平均 DAU = SUM(該方案的每日活躍用戶數) ÷ 365
- 全年 YAU = 全年在 daily_active 中出現過的不重複用戶數
- 年度比率 = 全年平均 DAU ÷ 全年 YAU × 100

**回傳欄位：** \`plan\`、\`avg_daily_dau\`（保留兩位小數）、\`yau\`、\`stickiness_pct\`（保留兩位小數）

**排序：** \`stickiness_pct DESC\`

**只回傳 plan = 'pro' 和 'free' 的資料**

YAU 是年度活躍用戶，不是 MAU。本題欄位 stickiness_pct 保留既有名稱，但代表平均 DAU/YAU，不能和月 DAU/MAU 直接比較。每日活躍及 YAU 僅限 [2025-01-01, 2026-01-01)，同分依 plan ASC。`,
          starter: '',
          answer: `WITH plan_daily AS (
  SELECT
    u.plan,
    da.log_date,
    COUNT(DISTINCT da.user_id) AS daily_active_count
  FROM daily_active da
  JOIN users u ON u.user_id = da.user_id
  WHERE u.plan IN ('pro', 'free') AND da.log_date >= '2025-01-01' AND da.log_date < '2026-01-01'
  GROUP BY u.plan, da.log_date
)
SELECT
  plan,
  ROUND(SUM(daily_active_count) * 1.0 / 365, 2) AS avg_daily_dau,
  (SELECT COUNT(DISTINCT da2.user_id)
   FROM daily_active da2
   JOIN users u2 ON u2.user_id = da2.user_id
   WHERE u2.plan = pd.plan AND da2.log_date >= '2025-01-01' AND da2.log_date < '2026-01-01') AS yau,
  ROUND(
    SUM(daily_active_count) * 100.0 / 365 /
    (SELECT COUNT(DISTINCT da2.user_id)
     FROM daily_active da2
     JOIN users u2 ON u2.user_id = da2.user_id
     WHERE u2.plan = pd.plan AND da2.log_date >= '2025-01-01' AND da2.log_date < '2026-01-01'),
  2) AS stickiness_pct
FROM plan_daily pd
GROUP BY plan
ORDER BY stickiness_pct DESC, plan ASC;`,
          hints: [
            '全年每日 DAU 加總除以 365，缺日等同零。',
            'YAU = 同一年度不重複活躍用戶，不是 MAU。',
            '當前方案標籤不代表歷史方案；差異只支持相關性。',
          ],
          explanation: `YAU 是全年不重複活躍用戶，平均 DAU/YAU 與月 Stickiness 不同。只描述目前方案分群的使用差異，無法證明付費功能造成黏性提升；需要控制自選偏差或隨機實驗。`,
          negatives: [
            `SELECT u.plan, ROUND(COUNT(DISTINCT da.user_id) * 1.0 / COUNT(DISTINCT da.log_date), 1) AS stickiness FROM users u JOIN daily_active da ON u.user_id = da.user_id GROUP BY u.plan ORDER BY stickiness DESC`,
          ],
        },
      ],
    },
  ],
};
