const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'pm-u02',
  title: '留存分析（Retention Curve）',
  lessons: [
    {
      id: 'pm-u02-l01',
      title: 'Day 1 / Day 7 / Day 30 留存率',
      minutes: 35,
      objectives: [
        '理解次日留存、7日留存、30日留存的定義',
        '用 julianday 計算天數差',
        '用 LEFT JOIN + CASE 計算各期留存率',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'pm.u02.l01.e01',
          title: '計算整體 Day 7 留存率',
          difficulty: 2,
          scenario: '你們剛上線一個新手引導流程，想知道整體 Day 7 留存率是否有改善。',
          prompt: `計算所有用戶的 **Day 7 留存率**。

定義：用戶在 **signup_date + 7 天**（±1 天容差，即第 6–8 天）有出現在 \`daily_active\` 中，視為 Day 7 留存。

**步驟：**
1. 從 \`users\` 取所有用戶的 \`signup_date\`
2. LEFT JOIN \`daily_active\` 找出是否在第 6–8 天有活躍紀錄
3. 計算留存率 = 有留存的用戶數 / 總用戶數 × 100

**回傳欄位：** \`total_users\`、\`retained_users\`、\`day7_retention_pct\`（保留兩位小數）`,
          starter: '',
          answer: `SELECT
  COUNT(DISTINCT u.user_id)                      AS total_users,
  COUNT(DISTINCT da.user_id)                     AS retained_users,
  ROUND(COUNT(DISTINCT da.user_id) * 100.0
        / COUNT(DISTINCT u.user_id), 2)          AS day7_retention_pct
FROM users u
LEFT JOIN daily_active da
  ON  da.user_id  = u.user_id
  AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;`,
          hints: [
            '用 julianday() 計算兩個日期的天數差',
            'LEFT JOIN 可保留沒有留存紀錄的用戶（分母需要包含他們）',
            'BETWEEN 6 AND 8 = 容差 ±1 天的第 7 天',
          ],
          explanation: `**julianday 技巧：** SQLite 用 \`julianday(date2) - julianday(date1)\` 計算天數差，等同其他資料庫的 DATEDIFF。

**容差設計：** 實務上用戶不一定剛好在第 7 天登入，±1 天容差更合理。不同公司定義不同，務必統一。

**常見錯誤：** 用字串相減或忘記 LEFT JOIN 導致分母只有有留存的用戶。`,
          negatives: [
            `SELECT COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT da.user_id) AS retained_users, ROUND(COUNT(DISTINCT da.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS day7_retention_pct FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;`,
            `SELECT COUNT(*) AS total_users, SUM(CASE WHEN da.user_id IS NOT NULL THEN 1 ELSE 0 END) AS retained_users, ROUND(SUM(CASE WHEN da.user_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS day7_retention_pct FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) = 7;`,
          ],
        },
        {
          id: 'pm.u02.l01.e02',
          title: '同時計算 Day 1 / Day 7 / Day 30 留存率',
          difficulty: 3,
          scenario: '你需要向 CEO 報告一張「留存快照」表，同時呈現 D1、D7、D30 三個數字。',
          prompt: `在同一個查詢中，計算所有用戶的 **Day 1、Day 7、Day 30 留存率**。

容差定義：
- Day 1 留存：signup_date 後第 1–2 天有活躍（差距 1–2 天）
- Day 7 留存：signup_date 後第 6–8 天有活躍
- Day 30 留存：signup_date 後第 28–32 天有活躍

**回傳欄位：** \`total_users\`、\`d1_pct\`、\`d7_pct\`、\`d30_pct\`（百分比，保留兩位小數）`,
          starter: '',
          answer: `WITH retention AS (
  SELECT
    u.user_id,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 1 AND 2   THEN 1 ELSE 0 END) AS d1,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8   THEN 1 ELSE 0 END) AS d7,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  GROUP BY u.user_id
)
SELECT
  COUNT(*)                              AS total_users,
  ROUND(SUM(d1)  * 100.0 / COUNT(*), 2) AS d1_pct,
  ROUND(SUM(d7)  * 100.0 / COUNT(*), 2) AS d7_pct,
  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct
FROM retention;`,
          hints: [
            '在 CTE 中為每位用戶打三個 flag（d1/d7/d30），再彙總',
            '用 MAX(CASE WHEN ... THEN 1 ELSE 0 END) 偵測是否有任何一天落在區間內',
            'LEFT JOIN 確保沒有任何留存的用戶也被計入分母',
          ],
          explanation: `**多期留存一次查詢的技巧：** 用 MAX(CASE WHEN) 對每位用戶打 flag，一次 LEFT JOIN 掃完所有天數後再彙總，避免多次掃表。

**留存曲線形狀：** 健康 App 的 D1 > 40%、D7 > 20%、D30 > 10% 是基本目標（依產品類型差異很大）。`,
          negatives: [`WITH cohort AS (SELECT user_id, signup_date, DATE(signup_date, '+1 days') AS d1 FROM users), ret AS (SELECT c.user_id FROM cohort c JOIN daily_active da ON da.user_id = c.user_id AND da.log_date = c.d1) SELECT COUNT(*) AS d1_retained, (SELECT COUNT(*) FROM users) AS total_users FROM ret`],
        },
        {
          id: 'pm.u02.l01.e03',
          title: '比較 Pro vs Free 用戶的 Day 30 留存率',
          difficulty: 3,
          scenario: '產品假設 Pro 用戶的長期留存率高於 Free 用戶，需要數據驗證。',
          prompt: `分別計算 \`pro\` 和 \`free\` 方案用戶的 **Day 30 留存率**（±2 天容差，第 28–32 天）。

**回傳欄位：** \`plan\`、\`total_users\`、\`retained_d30\`、\`d30_pct\`（保留兩位小數）

**排序：** \`d30_pct DESC\``,
          starter: '',
          answer: `WITH retention AS (
  SELECT
    u.user_id,
    u.plan,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  WHERE u.plan IN ('pro', 'free')
  GROUP BY u.user_id, u.plan
)
SELECT
  plan,
  COUNT(*)                               AS total_users,
  SUM(d30)                               AS retained_d30,
  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct
FROM retention
GROUP BY plan
ORDER BY d30_pct DESC;`,
          hints: [
            '在 CTE 加上 u.plan 欄位，最後 GROUP BY plan',
            'WHERE u.plan IN (\'pro\', \'free\') 只取這兩個方案',
          ],
          explanation: `**分群留存分析：** 比較不同方案的留存率，是找出「付費升級是否提升長期留存」的關鍵指標。

若 Pro 留存率顯著高於 Free，說明 Pro 功能有黏性，值得加強引導升級。`,
          negatives: [`WITH cohort AS (SELECT user_id, signup_date FROM users), d7 AS (SELECT c.user_id FROM cohort c JOIN daily_active da ON da.user_id = c.user_id AND da.log_date = DATE(c.signup_date, '+8 days')), d30 AS (SELECT c.user_id FROM cohort c JOIN daily_active da ON da.user_id = c.user_id AND da.log_date = DATE(c.signup_date, '+31 days')) SELECT ROUND(COUNT(DISTINCT d7.user_id) * 100.0 / COUNT(DISTINCT cohort.user_id), 1) AS d7_rate, ROUND(COUNT(DISTINCT d30.user_id) * 100.0 / COUNT(DISTINCT cohort.user_id), 1) AS d30_rate FROM cohort LEFT JOIN d7 ON d7.user_id = cohort.user_id LEFT JOIN d30 ON d30.user_id = cohort.user_id`],
        },
      ],
    },
    {
      id: 'pm-u02-l02',
      title: 'Cohort 留存表',
      minutes: 40,
      objectives: [
        '理解 Cohort 分析的概念（按註冊月分組）',
        '用 strftime 取出 Cohort 月份',
        '計算各 Cohort 在 Week 1、Week 2、Week 4 的留存率',
        '解讀 Cohort 留存表，找出改善節點',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'pm.u02.l02.e01',
          title: '按 Cohort 月計算 Week 1 留存率',
          difficulty: 3,
          scenario: '你想知道不同月份加入的用戶，他們的第一週留存率是否有提升（用來評估新手引導的改版效果）。',
          prompt: `按用戶的**註冊月份（Cohort）**，計算各 Cohort 的 **Week 1 留存率**。

Week 1 留存定義：用戶在 signup_date 後第 1–7 天內有任何一天出現在 \`daily_active\` 中。

**回傳欄位：** \`cohort_month\`（YYYY-MM）、\`cohort_size\`（Cohort 人數）、\`w1_retained\`、\`w1_pct\`（保留兩位小數）

**排序：** \`cohort_month ASC\`

**只計算 2025-01 ~ 2025-06 的 Cohort**（確保有足夠的後續觀察時間）`,
          starter: '',
          answer: `WITH cohort_retention AS (
  SELECT
    strftime('%Y-%m', u.signup_date) AS cohort_month,
    u.user_id,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 1 AND 7
             THEN 1 ELSE 0 END) AS w1
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30'
  GROUP BY u.user_id, cohort_month
)
SELECT
  cohort_month,
  COUNT(*)                              AS cohort_size,
  SUM(w1)                               AS w1_retained,
  ROUND(SUM(w1) * 100.0 / COUNT(*), 2) AS w1_pct
FROM cohort_retention
GROUP BY cohort_month
ORDER BY cohort_month;`,
          hints: [
            '用 strftime(\'%Y-%m\', signup_date) 取出 Cohort 月份',
            '在 CTE 對每位用戶打 w1 flag，再 GROUP BY cohort_month 彙總',
            'WHERE signup_date BETWEEN \'2025-01-01\' AND \'2025-06-30\' 限制 Cohort 範圍',
          ],
          explanation: `**Cohort 分析的價值：** 可以看到「較新加入的用戶」留存率是否比「較早加入的用戶」更高，用來評估產品改版效果。

如果 2025-04 之後的 Cohort 留存率明顯上升，說明該月的功能改版有效。`,
          negatives: [`WITH first_active AS (SELECT user_id, MIN(log_date) AS first_date FROM daily_active GROUP BY user_id), cohort_month AS (SELECT user_id, strftime('%Y-%m', first_date) AS cohort FROM first_active), activity AS (SELECT da.user_id, strftime('%Y-%m', da.log_date) AS active_month FROM daily_active da GROUP BY da.user_id, active_month) SELECT cm.cohort, COUNT(DISTINCT cm.user_id) AS cohort_size, COUNT(DISTINCT a.user_id) AS retained FROM cohort_month cm LEFT JOIN activity a ON a.user_id = cm.user_id GROUP BY cm.cohort ORDER BY cm.cohort`],
        },
        {
          id: 'pm.u02.l02.e02',
          title: '完整 Cohort 留存表（W1 / W2 / W4）',
          difficulty: 3,
          scenario: '你需要製作一張 Cohort 留存表，呈現在 Board 上，讓大家看到各個月份用戶的留存趨勢。',
          prompt: `計算 2025-01 ~ 2025-06 各 Cohort 的 **W1（第 1–7 天）、W2（第 8–14 天）、W4（第 22–28 天）留存率**。

**回傳欄位：** \`cohort_month\`、\`cohort_size\`、\`w1_pct\`、\`w2_pct\`、\`w4_pct\`（百分比，保留一位小數）

**排序：** \`cohort_month ASC\``,
          starter: '',
          answer: `WITH flags AS (
  SELECT
    strftime('%Y-%m', u.signup_date) AS cohort_month,
    u.user_id,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 8  AND 14 THEN 1 ELSE 0 END) AS w2,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30'
  GROUP BY u.user_id, cohort_month
)
SELECT
  cohort_month,
  COUNT(*)                              AS cohort_size,
  ROUND(SUM(w1) * 100.0 / COUNT(*), 1) AS w1_pct,
  ROUND(SUM(w2) * 100.0 / COUNT(*), 1) AS w2_pct,
  ROUND(SUM(w4) * 100.0 / COUNT(*), 1) AS w4_pct
FROM flags
GROUP BY cohort_month
ORDER BY cohort_month;`,
          hints: [
            '在 CTE 中一次打三個 flag（w1/w2/w4），避免多次 JOIN',
            'W4 定義為第 22–28 天（非第 4 週開始，而是 4 週後的觀察窗）',
          ],
          explanation: `**Cohort 留存表解讀：**
- 每一列是一個 Cohort（同月份加入的用戶），看同一列的 W1→W4 衰減幅度
- 每一欄是同一時間點，看不同 Cohort 的差異（越新的 Cohort 是否改善）
- W1 → W2 衰減大：用戶在第一週後就不回來，新手引導可能有問題
- W4 留存持平：長期留存穩定，產品有核心價值`,
          negatives: [
            `WITH flags AS (SELECT strftime('%Y-%m', u.signup_date) AS cohort_month, u.user_id, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) AS w1, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 8 AND 14 THEN 1 ELSE 0 END) AS w2, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4 FROM users u JOIN daily_active da ON da.user_id = u.user_id WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30' GROUP BY u.user_id, cohort_month) SELECT cohort_month, COUNT(*) AS cohort_size, ROUND(SUM(w1)*100.0/COUNT(*),1) AS w1_pct, ROUND(SUM(w2)*100.0/COUNT(*),1) AS w2_pct, ROUND(SUM(w4)*100.0/COUNT(*),1) AS w4_pct FROM flags GROUP BY cohort_month ORDER BY cohort_month;`,
          ],
        },
        {
          id: 'pm.u02.l02.e03',
          title: '找出留存率最差的 Cohort',
          difficulty: 2,
          scenario: '你懷疑某個月份的新用戶留存特別差，想找出 W1 留存最低的兩個 Cohort 月份來深入調查。',
          prompt: `找出 2025-01 ~ 2025-06 中，**Week 1 留存率最低的 2 個 Cohort 月份**。

W1 定義：signup_date 後第 1–7 天有活躍。

**回傳欄位：** \`cohort_month\`、\`cohort_size\`、\`w1_retained\`、\`w1_pct\`（保留兩位小數）

**排序：** \`w1_pct ASC\`，只回傳前 2 筆`,
          starter: '',
          answer: `WITH flags AS (
  SELECT
    strftime('%Y-%m', u.signup_date) AS cohort_month,
    u.user_id,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1 AND 7
             THEN 1 ELSE 0 END) AS w1
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30'
  GROUP BY u.user_id, cohort_month
)
SELECT
  cohort_month,
  COUNT(*)                              AS cohort_size,
  SUM(w1)                               AS w1_retained,
  ROUND(SUM(w1) * 100.0 / COUNT(*), 2) AS w1_pct
FROM flags
GROUP BY cohort_month
ORDER BY w1_pct ASC
LIMIT 2;`,
          hints: ['在 Cohort 留存查詢結尾加上 ORDER BY w1_pct ASC LIMIT 2'],
          explanation: `找出最差 Cohort 後，可以去翻當月的版本記錄、行銷活動來源，找出可能的原因（例如：某個行銷渠道帶來低品質用戶、某次更新造成新手體驗問題）。`,
          negatives: [
            `WITH flags AS (SELECT strftime('%Y-%m', u.signup_date) AS cohort_month, u.user_id, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) AS w1 FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30' GROUP BY u.user_id, cohort_month) SELECT cohort_month, COUNT(*) AS cohort_size, SUM(w1) AS w1_retained, ROUND(SUM(w1)*100.0/COUNT(*),2) AS w1_pct FROM flags GROUP BY cohort_month ORDER BY w1_pct DESC LIMIT 2;`,
          ],
        },
      ],
    },
  ],
};
