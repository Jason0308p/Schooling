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
          scenario: '你的 CEO 每週一看「上週平均 DAU」，你需要用 SQL 算出每個月的平均 DAU。',
          prompt: `計算 2025 年**每個月的平均 DAU**（每日活躍用戶數的月平均）。

**步驟：**
1. 先用子查詢或 CTE 算出每天的 DAU（\`daily_active\` 中每天的不重複 \`user_id\` 數）
2. 再依月份分組，取 \`AVG\`

**回傳欄位：** \`month\`（格式 YYYY-MM）、\`avg_dau\`（四捨五入到整數）

**排序：** \`month ASC\``,
          starter: '',
          answer: `WITH daily_dau AS (
  SELECT
    strftime('%Y-%m', log_date) AS month,
    log_date,
    COUNT(DISTINCT user_id) AS dau
  FROM daily_active
  GROUP BY log_date
)
SELECT
  month,
  ROUND(AVG(dau)) AS avg_dau
FROM daily_dau
GROUP BY month
ORDER BY month;`,
          hints: [
            '先算每天的 DAU（每天有幾位不重複用戶），再按月取平均',
            '用 strftime(\'%Y-%m\', log_date) 取出年月',
            '外層 SELECT 對 month 分組，AVG(dau) 即月平均 DAU',
          ],
          explanation: `**核心思路：** 兩層聚合 — 先 GROUP BY 日期得到每日 DAU，再 GROUP BY 月份取平均。

**常見錯誤：**
- 直接 \`COUNT(DISTINCT user_id)\` 配合 \`GROUP BY month\`：這樣得到的是「當月有出現過的不重複用戶數」（即 MAU），不是 DAU 平均
- 忘記 \`DISTINCT\`：同一用戶同天多筆紀錄時會重複計算

**業務意義：** 平均 DAU 比單日 DAU 更穩定，適合用來追蹤趨勢。`,
          negatives: [
            `SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS avg_dau FROM daily_active GROUP BY month ORDER BY month;`,
            `SELECT strftime('%Y-%m', log_date) AS month, COUNT(*) / COUNT(DISTINCT log_date) AS avg_dau FROM daily_active GROUP BY month ORDER BY month;`,
          ],
        },
        {
          id: 'pm.u01.l01.e02',
          title: '計算 2025 年每月 MAU',
          difficulty: 1,
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
GROUP BY month, u.plan
ORDER BY month, u.plan;`,
          hints: [
            'JOIN users 取得 plan 欄位',
            '在 GROUP BY 加上 u.plan 做分組',
          ],
          explanation: `**思路：** 在 MAU 查詢基礎上加一個 JOIN + GROUP BY plan。

**業務應用：** 觀察不同方案用戶的月活趨勢，可以發現 free 用戶在試用期後是否快速流失。`,
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
          scenario: '你的產品 Lead 說：「Stickiness 低於 20% 就要警惕。」你需要每月追蹤這個數字。',
          prompt: `計算 2025 年**每個月的 Stickiness**（= 當月平均 DAU ÷ MAU × 100%）。

**步驟建議：**
1. CTE 1：計算每天的 DAU
2. CTE 2：每月的平均 DAU（avg_dau）和 MAU
3. 最後計算 stickiness_pct

**回傳欄位：** \`month\`、\`avg_dau\`、\`mau\`、\`stickiness_pct\`（百分比，保留兩位小數）

**排序：** \`month ASC\``,
          starter: '',
          answer: `WITH daily_dau AS (
  SELECT
    log_date,
    strftime('%Y-%m', log_date) AS month,
    COUNT(DISTINCT user_id) AS dau
  FROM daily_active
  GROUP BY log_date
),
monthly AS (
  SELECT
    month,
    ROUND(AVG(dau), 2)          AS avg_dau,
    COUNT(DISTINCT sub.user_id) AS mau
  FROM daily_dau
  JOIN daily_active sub USING (log_date)
  GROUP BY month
)
SELECT
  month,
  avg_dau,
  mau,
  ROUND(avg_dau * 100.0 / mau, 2) AS stickiness_pct
FROM monthly
ORDER BY month;`,
          hints: [
            'Stickiness = 平均 DAU / MAU，兩者都需要先算好',
            '可以用兩個 CTE：一個算每日 DAU，再對月份彙總得到平均 DAU 和 MAU',
            'SQLite 整數除法會截斷，記得 * 100.0',
          ],
          explanation: `**Stickiness 意義：** 代表「活躍用戶中，平均每天有多少比例在使用」。50% 代表平均每位月活用戶每兩天用一次。

**常見錯誤：**
- 用整數除法（忘記 \`* 100.0\`）導致結果全為 0
- 混淆平均 DAU 和 MAU 的計算方式`,
          negatives: [
            `WITH daily_dau AS (SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS dau FROM daily_active GROUP BY log_date), mau_data AS (SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS mau FROM daily_active GROUP BY month) SELECT d.month, AVG(d.dau) AS avg_dau, m.mau, ROUND(AVG(d.dau) / m.mau * 100, 2) AS stickiness_pct FROM daily_dau d JOIN mau_data m ON d.month = m.month GROUP BY d.month ORDER BY d.month;`,
          ],
        },
        {
          id: 'pm.u01.l02.e02',
          title: '找出 Stickiness 最高的前 3 個月',
          difficulty: 2,
          scenario: '你想找出用戶黏性最好的季節，來規劃下一年的推廣時程。',
          prompt: `找出 2025 年 **Stickiness 最高的前 3 個月**。

Stickiness = 當月平均 DAU ÷ MAU × 100

**回傳欄位：** \`month\`、\`stickiness_pct\`（保留兩位小數）

**排序：** \`stickiness_pct DESC\`，只回傳前 3 筆`,
          starter: '',
          answer: `WITH daily_dau AS (
  SELECT
    log_date,
    COUNT(DISTINCT user_id) AS dau
  FROM daily_active
  GROUP BY log_date
),
monthly AS (
  SELECT
    strftime('%Y-%m', da.log_date) AS month,
    AVG(dd.dau)                    AS avg_dau,
    COUNT(DISTINCT da.user_id)     AS mau
  FROM daily_active da
  JOIN daily_dau dd ON dd.log_date = da.log_date
  GROUP BY month
)
SELECT
  month,
  ROUND(avg_dau * 100.0 / mau, 2) AS stickiness_pct
FROM monthly
ORDER BY stickiness_pct DESC
LIMIT 3;`,
          hints: [
            '在前一題的基礎上加 ORDER BY stickiness_pct DESC LIMIT 3',
          ],
          explanation: `**應用：** 發現高黏性月份，可分析當月有哪些新功能上線或活動，複製成功因素。`,
          negatives: [`WITH daily_dau AS (SELECT log_date, COUNT(DISTINCT user_id) AS dau FROM daily_active GROUP BY log_date), monthly_mau AS (SELECT strftime('%Y-%m', log_date) AS month, COUNT(DISTINCT user_id) AS mau FROM daily_active GROUP BY month) SELECT d.month, ROUND(AVG(d.dau), 1) AS avg_dau, m.mau, ROUND(AVG(d.dau) * 100.0 / m.mau, 1) AS stickiness FROM (SELECT strftime('%Y-%m', log_date) AS month, dau FROM daily_dau) d JOIN monthly_mau m ON d.month = m.month GROUP BY d.month ORDER BY d.month`],
        },
        {
          id: 'pm.u01.l02.e03',
          title: 'Pro 用戶 vs Free 用戶的 Stickiness 比較',
          difficulty: 3,
          scenario: 'PM 假設 Pro 用戶的黏性應該顯著高於 Free 用戶。你需要用數據驗證這個假設。',
          prompt: `分別計算 **\`pro\`** 和 **\`free\`** 用戶在 2025 年全年的整體 Stickiness。

定義：
- 全年平均 DAU = SUM(該方案的每日活躍用戶數) ÷ 365
- 全年 MAU = 全年在 daily_active 中出現過的不重複用戶數
- Stickiness = 全年平均 DAU ÷ 全年 MAU × 100

**回傳欄位：** \`plan\`、\`avg_daily_dau\`（保留兩位小數）、\`annual_mau\`、\`stickiness_pct\`（保留兩位小數）

**排序：** \`stickiness_pct DESC\`

**只回傳 plan = 'pro' 和 'free' 的資料**`,
          starter: '',
          answer: `WITH plan_daily AS (
  SELECT
    u.plan,
    da.log_date,
    COUNT(DISTINCT da.user_id) AS daily_active_count
  FROM daily_active da
  JOIN users u ON u.user_id = da.user_id
  WHERE u.plan IN ('pro', 'free')
  GROUP BY u.plan, da.log_date
)
SELECT
  plan,
  ROUND(SUM(daily_active_count) * 1.0 / 365, 2) AS avg_daily_dau,
  (SELECT COUNT(DISTINCT da2.user_id)
   FROM daily_active da2
   JOIN users u2 ON u2.user_id = da2.user_id
   WHERE u2.plan = pd.plan) AS annual_mau,
  ROUND(
    SUM(daily_active_count) * 100.0 / 365 /
    (SELECT COUNT(DISTINCT da2.user_id)
     FROM daily_active da2
     JOIN users u2 ON u2.user_id = da2.user_id
     WHERE u2.plan = pd.plan),
  2) AS stickiness_pct
FROM plan_daily pd
GROUP BY plan
ORDER BY stickiness_pct DESC;`,
          hints: [
            '先算每個 plan 每天的活躍人數，再對全年加總除以 365 得到平均 DAU',
            '全年 MAU 是全年出現過的不重複用戶數',
            '可以用相關子查詢計算每個 plan 的 annual_mau',
          ],
          explanation: `**業務驗證：** Pro 用戶的 Stickiness 通常明顯高於 Free，這支持「Pro 功能有吸引力」的假設。若差距不大，代表付費升級沒有帶來更多使用黏性，需要重新審視 Pro 功能價值。`,
          negatives: [`SELECT u.plan, ROUND(COUNT(DISTINCT da.user_id) * 1.0 / COUNT(DISTINCT da.log_date), 1) AS stickiness FROM users u JOIN daily_active da ON u.user_id = da.user_id GROUP BY u.plan ORDER BY stickiness DESC`],
        },
      ],
    },
  ],
};
