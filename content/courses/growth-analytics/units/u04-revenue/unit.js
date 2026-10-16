const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'gh-u04',
  title: 'Revenue：營收分析',
  lessons: [
    {
      id: 'gh-u04-l01',
      title: 'MRR、ARPU、LTV 計算',
      minutes: 25,
      objectives: [
        '用 A/B test 收入資料估算各方案的 ARPU',
        '計算簡化版 LTV（ARPU × 活躍月數）',
        '分析渠道的付費轉換率，找出高 LTV 來源',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'gh.u04.l01.e01',
          title: '各方案 ARPU 計算',
          difficulty: 2,
          scenario: '財務主管想知道各訂閱方案的 ARPU（每用戶平均收入），評估定價策略是否合理。',
          prompt: `計算各 \`plan\` 的 **ARPU**（每用戶平均收入）。

使用 \`ab_tests\` 的 \`revenue\` 欄位，對每位用戶加總其所有 A/B 測試的轉換收入，再除以該方案的總用戶數。

**回傳欄位：** \`plan\`、\`total_users\`、\`total_revenue\`（保留兩位小數）、\`arpu\`（保留兩位小數）

**排序：** \`arpu DESC\``,
          answer: `WITH user_rev AS (
  SELECT
    u.user_id,
    u.plan,
    COALESCE(SUM(ab.revenue), 0) AS user_revenue
  FROM users u
  LEFT JOIN ab_tests ab ON ab.user_id = u.user_id
  GROUP BY u.user_id, u.plan
)
SELECT
  plan,
  COUNT(*)                                AS total_users,
  ROUND(SUM(user_revenue), 2)             AS total_revenue,
  ROUND(SUM(user_revenue) / COUNT(*), 2)  AS arpu
FROM user_rev
GROUP BY plan
ORDER BY arpu DESC;`,
          hints: [
            'LEFT JOIN 確保沒有 A/B 測試紀錄的用戶也計入（revenue = 0）',
            'COALESCE(SUM(ab.revenue), 0) 把 NULL 換成 0',
            'CTE 先算每位用戶的總收入，再 GROUP BY plan 彙總',
          ],
          explanation: `**ARPU** 是評估定價效益的核心指標。Enterprise 的 ARPU 通常遠高於 Pro 和 Free——若差距不明顯，可能代表 Enterprise 功能與 Pro 差異不夠大，或定價策略需要調整。`,
          negatives: [
            `WITH user_rev AS (SELECT u.user_id, u.plan, COALESCE(SUM(ab.revenue), 0) AS user_revenue FROM users u LEFT JOIN ab_tests ab ON ab.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS total_users, ROUND(SUM(user_revenue), 2) AS total_revenue, ROUND(SUM(user_revenue) / COUNT(*), 2) AS arpu FROM user_rev GROUP BY plan ORDER BY arpu ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'gh.u04.l01.e02',
          title: '簡化版 LTV 估算',
          difficulty: 3,
          scenario: '你要估算各方案的 LTV（生命週期價值），用「平均活躍月數 × 月均收入」做簡化版計算。',
          prompt: `計算各方案的簡化版 **LTV**。

計算步驟：
1. 對每位用戶：統計有活躍紀錄的**月份數**（\`daily_active\` 中 \`log_date\` 的不重複 YYYY-MM 數）
2. 對每位用戶：加總 \`ab_tests.revenue\`
3. 按方案彙總：計算平均活躍月數、ARPU、估算年化 LTV（ARPU / 平均月數 × 12）

**回傳欄位：** \`plan\`、\`users\`、\`avg_active_months\`（保留一位小數）、\`arpu\`（保留兩位小數）、\`estimated_annual_ltv\`（保留兩位小數）

**排序：** \`estimated_annual_ltv DESC\``,
          answer: `WITH user_stats AS (
  SELECT
    u.user_id,
    u.plan,
    COUNT(DISTINCT strftime('%Y-%m', da.log_date)) AS active_months,
    COALESCE(SUM(ab.revenue), 0)                   AS total_revenue
  FROM users u
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  LEFT JOIN ab_tests ab ON ab.user_id = u.user_id
  GROUP BY u.user_id, u.plan
)
SELECT
  plan,
  COUNT(*)                                                       AS users,
  ROUND(AVG(active_months), 1)                                   AS avg_active_months,
  ROUND(SUM(total_revenue) / COUNT(*), 2)                        AS arpu,
  ROUND(SUM(total_revenue) / COUNT(*) / NULLIF(AVG(active_months), 0) * 12, 2) AS estimated_annual_ltv
FROM user_stats
GROUP BY plan
ORDER BY estimated_annual_ltv DESC;`,
          hints: [
            "COUNT(DISTINCT strftime('%Y-%m', da.log_date)) 計算不重複的活躍月數",
            'NULLIF(AVG(active_months), 0) 避免除以零',
            'arpu / avg_active_months × 12 = 年化 LTV 估算',
          ],
          explanation: `**LTV** 是 Growth 最重要的財務指標之一，影響「願意花多少 CAC 獲客」的決策。

這個 LTV 是簡化估算，實際應使用 Churn Rate：LTV = ARPU / Churn Rate。
但簡化版已能快速判斷各方案的相對價值，指出哪個方案值得加大行銷投入。`,
          negatives: [
            `WITH user_stats AS (SELECT u.user_id, u.plan, COUNT(DISTINCT strftime('%Y-%m', da.log_date)) AS active_months, COALESCE(SUM(ab.revenue), 0) AS total_revenue FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id LEFT JOIN ab_tests ab ON ab.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS users, ROUND(AVG(active_months), 1) AS avg_active_months, ROUND(SUM(total_revenue)/COUNT(*), 2) AS arpu, ROUND(SUM(total_revenue)/COUNT(*)/NULLIF(AVG(active_months),0)*12, 2) AS estimated_annual_ltv FROM user_stats GROUP BY plan ORDER BY estimated_annual_ltv ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'gh.u04.l01.e03',
          title: '各渠道付費轉換率與收入貢獻',
          difficulty: 3,
          scenario: '行銷主管要決定下季度把預算集中在哪些渠道，你需要同時提供「付費轉換率」和「每用戶平均收入」兩個維度。',
          prompt: `計算各 **acquisition_channel** 的：
- 付費用戶比例（plan 為 \`pro\` 或 \`enterprise\`）
- 每用戶平均 A/B 測試收入（ARPU）

**回傳欄位：** \`acquisition_channel\`、\`total_users\`、\`paid_users\`、\`paid_rate_pct\`（保留一位小數）、\`arpu\`（保留兩位小數）

**排序：** \`arpu DESC\``,
          answer: `WITH user_rev AS (
  SELECT
    u.user_id,
    u.acquisition_channel,
    u.plan,
    COALESCE(SUM(ab.revenue), 0) AS user_revenue
  FROM users u
  LEFT JOIN ab_tests ab ON ab.user_id = u.user_id
  GROUP BY u.user_id, u.acquisition_channel, u.plan
)
SELECT
  acquisition_channel,
  COUNT(*)                                                          AS total_users,
  SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)   AS paid_users,
  ROUND(SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)
        * 100.0 / COUNT(*), 1)                                      AS paid_rate_pct,
  ROUND(SUM(user_revenue) / COUNT(*), 2)                           AS arpu
FROM user_rev
GROUP BY acquisition_channel
ORDER BY arpu DESC;`,
          hints: [
            'CTE 先對每位用戶 JOIN ab_tests 算出 user_revenue',
            'paid_rate_pct 用 CASE WHEN plan IN ... 計算付費比例',
          ],
          explanation: `**渠道 ARPU 排名** 幫助行銷決策：

- paid_rate_pct 高但 arpu 低 → 用戶轉換了，但方案偏低（可能大多轉 Pro 而非 Enterprise）
- arpu 高但 paid_rate_pct 低 → 少數高價值用戶，適合精準行銷

綜合兩個維度，才能找到真正值得加大投入的渠道。`,
          negatives: [
            `WITH user_rev AS (SELECT u.user_id, u.acquisition_channel, u.plan, COALESCE(SUM(ab.revenue), 0) AS user_revenue FROM users u LEFT JOIN ab_tests ab ON ab.user_id = u.user_id GROUP BY u.user_id, u.acquisition_channel, u.plan) SELECT acquisition_channel, COUNT(*) AS total_users, SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END) AS paid_users, ROUND(SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)*100.0/COUNT(*),1) AS paid_rate_pct, ROUND(SUM(user_revenue)/COUNT(*),2) AS arpu FROM user_rev GROUP BY acquisition_channel ORDER BY paid_rate_pct DESC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
