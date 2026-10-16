const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'gh-u03',
  title: 'Retention：留存分析',
  lessons: [
    {
      id: 'gh-u03-l01',
      title: 'N-Day Retention（Day 7 & Day 30）',
      minutes: 25,
      objectives: [
        '理解 N-day retention 的定義與容差設計',
        '用 julianday 計算留存標記',
        '比較各方案（free/pro/enterprise）的 Day 7 和 Day 30 留存率',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'gh.u03.l01.e01',
          title: '計算整體 Day 7 留存率',
          difficulty: 2,
          scenario: 'Growth 團隊想評估整體 Day 7 留存率，確認是否達到業界 15% 的最低標準。',
          prompt: `計算所有用戶的 **Day 7 留存率**。

定義：用戶在 signup_date 後第 **6–8 天**（±1 天容差）有出現在 \`daily_active\`，視為留存。

**回傳欄位：** \`total_users\`、\`retained_d7\`、\`d7_retention_pct\`（保留兩位小數）`,
          answer: `SELECT
  COUNT(DISTINCT u.user_id)                             AS total_users,
  COUNT(DISTINCT da.user_id)                            AS retained_d7,
  ROUND(COUNT(DISTINCT da.user_id) * 100.0
        / COUNT(DISTINCT u.user_id), 2)                 AS d7_retention_pct
FROM users u
LEFT JOIN daily_active da
  ON  da.user_id = u.user_id
  AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;`,
          hints: [
            'LEFT JOIN 確保沒有留存的用戶也計入分母',
            'julianday(log_date) - julianday(signup_date) BETWEEN 6 AND 8 = Day 7 ±1 天',
          ],
          explanation: `**Day 7 留存率** 是衡量新手引導成效的關鍵指標，反映用戶第一週後是否還記得回來。

容差 ±1 天（BETWEEN 6 AND 8）是業界常見設計，因為用戶不一定剛好在第 7 天登入。左 JOIN 是防止分母縮小的必要手段。`,
          negatives: [
            `SELECT COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT da.user_id) AS retained_d7, ROUND(COUNT(DISTINCT da.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS d7_retention_pct FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;`,
          ],
        },
        {
          id: 'gh.u03.l01.e02',
          title: '同時計算 Day 7 和 Day 30 留存率',
          difficulty: 3,
          scenario: 'CEO 要求一張「留存快照」報告，需要同時看到 D7 和 D30 兩個數字。',
          prompt: `在**同一個查詢**中計算所有用戶的 **Day 7** 和 **Day 30** 留存率。

容差定義：
- Day 7：第 6–8 天
- Day 30：第 28–32 天

**回傳欄位：** \`total_users\`、\`d7_pct\`、\`d30_pct\`（百分比，保留兩位小數）`,
          answer: `WITH flags AS (
  SELECT
    u.user_id,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 6  AND 8  THEN 1 ELSE 0 END) AS d7,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  GROUP BY u.user_id
)
SELECT
  COUNT(*)                               AS total_users,
  ROUND(SUM(d7)  * 100.0 / COUNT(*), 2) AS d7_pct,
  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct
FROM flags;`,
          hints: [
            '在 CTE 中用 MAX(CASE WHEN) 為每位用戶打 d7/d30 flag',
            'MAX 確保只要有任一天落在區間，就標記為 1',
          ],
          explanation: `**多期留存一次計算** 技巧：CTE 中每位用戶打 flag，避免 JOIN 兩次資料表。

D7 到 D30 的衰減幅度是評估長期黏性的關鍵——若 D30 遠低於 D7 的一半，代表中期流失嚴重，需要找出觸發回訪的機制。`,
          negatives: [
            `WITH d7 AS (SELECT u.user_id FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) = 7), d30 AS (SELECT u.user_id FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) = 30) SELECT (SELECT COUNT(*) FROM users) AS total_users, ROUND(COUNT(DISTINCT d7.user_id) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS d7_pct, ROUND(COUNT(DISTINCT d30.user_id) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS d30_pct FROM users LEFT JOIN d7 USING(user_id) LEFT JOIN d30 USING(user_id);`,
          ],
        },
        {
          id: 'gh.u03.l01.e03',
          title: '各方案的 Day 30 留存率比較',
          difficulty: 3,
          scenario: '你要驗證「付費方案的長期留存率是否顯著高於免費方案」，以支持加大升級引導投入的決策。',
          prompt: `分別計算 \`free\`、\`pro\`、\`enterprise\` 三個方案的 **Day 30 留存率**（第 28–32 天容差）。

**回傳欄位：** \`plan\`、\`total_users\`、\`retained_d30\`、\`d30_pct\`（保留兩位小數）

**排序：** \`d30_pct DESC\``,
          answer: `WITH flags AS (
  SELECT
    u.user_id,
    u.plan,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32
             THEN 1 ELSE 0 END) AS d30
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  GROUP BY u.user_id, u.plan
)
SELECT
  plan,
  COUNT(*)                               AS total_users,
  SUM(d30)                               AS retained_d30,
  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct
FROM flags
GROUP BY plan
ORDER BY d30_pct DESC;`,
          hints: [
            'CTE 加入 u.plan 欄位，最後 GROUP BY plan',
            'LEFT JOIN + MAX(CASE WHEN) 確保每位用戶只有一列',
          ],
          explanation: `**方案留存率差異** 是評估「付費方案是否真的更有黏性」的直接證據。

若 enterprise 留存率明顯高於 free，代表功能深度和使用習慣真的不同，值得加強 Free → Pro 的升級引導。`,
          negatives: [
            `WITH flags AS (SELECT u.user_id, u.plan, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30 FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS total_users, SUM(d30) AS retained_d30, ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct FROM flags GROUP BY plan ORDER BY d30_pct ASC;`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'gh-u03-l02',
      title: 'Rolling Retention vs Bracket Retention',
      minutes: 25,
      objectives: [
        '理解 Rolling retention 與 Bracket retention 的差異與適用場景',
        '計算按月 Cohort 的 Week 1 留存率',
        '比較各方案的 W1 vs W4 留存衰減幅度',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'gh.u03.l02.e01',
          title: 'Rolling Day 7 Retention',
          difficulty: 2,
          scenario: '你的產品是低頻工具（每週用幾次就夠），決定改用 Rolling retention 評估留存。',
          prompt: `計算所有用戶的 **Rolling Day 7 Retention**。

定義：用戶在 signup_date 後**第 1–7 天內**（含第 7 天）有任何一次活躍，視為留存。

**回傳欄位：** \`total_users\`、\`rolling_d7_retained\`、\`rolling_d7_pct\`（保留兩位小數）`,
          answer: `SELECT
  COUNT(DISTINCT u.user_id)                              AS total_users,
  COUNT(DISTINCT da.user_id)                             AS rolling_d7_retained,
  ROUND(COUNT(DISTINCT da.user_id) * 100.0
        / COUNT(DISTINCT u.user_id), 2)                  AS rolling_d7_pct
FROM users u
LEFT JOIN daily_active da
  ON  da.user_id = u.user_id
  AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 1 AND 7;`,
          hints: [
            'BETWEEN 1 AND 7 = 第 1 天到第 7 天（Rolling 7 天視窗）',
            'LEFT JOIN 保留沒有活躍的用戶',
          ],
          explanation: `**Rolling retention** 計算視窗內「有任何一次活躍」的比例，比 N-day retention 寬鬆。

比較：Rolling D7 和 N-day D7 的差距越大，代表用戶越不規律（不固定在第 7 天，但有在前 7 天內回來）。`,
          negatives: [
            `SELECT COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT da.user_id) AS rolling_d7_retained, ROUND(COUNT(DISTINCT da.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS rolling_d7_pct FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 0 AND 6;`,
          ],
        },
        {
          id: 'gh.u03.l02.e02',
          title: 'Cohort 月留存表（W1 / W2 / W4）',
          difficulty: 3,
          scenario: '你想做一張 Cohort 留存表，向團隊展示不同月份加入的用戶，他們的週留存趨勢是否在改善。',
          prompt: `計算 **2025-01 ~ 2025-06** 各 Cohort 月的 **W1（1–7天）、W2（8–14天）、W4（22–28天）** 留存率。

**回傳欄位：** \`cohort_month\`（YYYY-MM）、\`cohort_size\`、\`w1_pct\`、\`w2_pct\`、\`w4_pct\`（保留一位小數）

**排序：** \`cohort_month ASC\``,
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
            "strftime('%Y-%m', signup_date) 取 Cohort 月份",
            'WHERE 限制 Cohort 在 2025-01 ~ 2025-06（確保有 28 天以上觀察期）',
            '一次打三個 flag 避免多次掃表',
          ],
          explanation: `**Cohort 留存表** 是最重要的 Growth 報表之一。

閱讀方式：
- 同一列（同 Cohort）看 W1→W4 衰減，衡量核心黏性
- 同一欄（同時間點）看不同 Cohort，判斷產品改版是否帶來改善`,
          negatives: [
            `WITH flags AS (SELECT strftime('%Y-%m', u.signup_date) AS cohort_month, u.user_id, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) AS w1, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 8 AND 14 THEN 1 ELSE 0 END) AS w2, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4 FROM users u JOIN daily_active da ON da.user_id = u.user_id WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30' GROUP BY u.user_id, cohort_month) SELECT cohort_month, COUNT(*) AS cohort_size, ROUND(SUM(w1)*100.0/COUNT(*),1) AS w1_pct, ROUND(SUM(w2)*100.0/COUNT(*),1) AS w2_pct, ROUND(SUM(w4)*100.0/COUNT(*),1) AS w4_pct FROM flags GROUP BY cohort_month ORDER BY cohort_month;`,
          ],
          ordered: true,
        },
        {
          id: 'gh.u03.l02.e03',
          title: '各方案的 W1 vs W4 留存衰減',
          difficulty: 3,
          scenario: '你要找出哪個付費方案的長期黏性最好（W4 留存最高），以及哪個方案從 W1 到 W4 的衰減幅度最大（流失風險最高）。',
          prompt: `計算 \`free\`、\`pro\`、\`enterprise\` 各方案的 **W1（1–7天）和 W4（22–28天）留存率**，以及 W1 到 W4 的**衰減百分點**。

**回傳欄位：** \`plan\`、\`total_users\`、\`w1_pct\`、\`w4_pct\`、\`drop_points\`（W1 - W4，保留一位小數）

**排序：** \`w4_pct DESC\``,
          answer: `WITH brackets AS (
  SELECT
    u.user_id,
    u.plan,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,
    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  GROUP BY u.user_id, u.plan
)
SELECT
  plan,
  COUNT(*)                                                          AS total_users,
  ROUND(SUM(w1) * 100.0 / COUNT(*), 1)                             AS w1_pct,
  ROUND(SUM(w4) * 100.0 / COUNT(*), 1)                             AS w4_pct,
  ROUND((SUM(w1) - SUM(w4)) * 100.0 / COUNT(*), 1)                 AS drop_points
FROM brackets
GROUP BY plan
ORDER BY w4_pct DESC;`,
          hints: [
            'drop_points = (SUM(w1) - SUM(w4)) * 100.0 / COUNT(*)',
            '注意 drop_points 是百分點差（不是相對比）',
          ],
          explanation: `**留存衰減分析** 幫助找出哪個用戶群需要優先關注：

- drop_points 大 + w4_pct 低 → 高流失風險，需要 re-engagement 策略
- drop_points 小 + w4_pct 高 → 核心黏性用戶，值得加大資源

Enterprise 通常衰減最小（公司帳號，即使個人不用也不會流失）；Free 衰減最快。`,
          negatives: [
            `WITH brackets AS (SELECT u.user_id, u.plan, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) AS w1, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4 FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS total_users, ROUND(SUM(w1)*100.0/COUNT(*),1) AS w1_pct, ROUND(SUM(w4)*100.0/COUNT(*),1) AS w4_pct, ROUND((SUM(w1)-SUM(w4))*100.0/COUNT(*),1) AS drop_points FROM brackets GROUP BY plan ORDER BY w4_pct ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
