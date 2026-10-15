const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'pm-u05',
  title: '數據驅動 PRD 決策',
  lessons: [
    {
      id: 'pm-u05-l01',
      title: '用數據支撐產品決策',
      minutes: 40,
      objectives: [
        '學會將多個數據維度組合成產品決策依據',
        '識別用戶分群中的高價值族群',
        '用數據框架回答「要不要做這個功能？」的問題',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'pm.u05.l01.e01',
          title: '找出值得重點維護的高黏性付費用戶',
          difficulty: 3,
          scenario: '你在評估「是否要為 Pro / Enterprise 用戶建立專屬 CS 服務」。你需要找出哪些用戶是「高黏性 + 高價值」的族群，並量化這個族群的規模。',
          prompt: `找出符合以下條件的用戶（定義為「高價值用戶」）：
1. \`plan\` 為 \`pro\` 或 \`enterprise\`
2. \`is_active = 1\`
3. 在 2025 年的活躍天數 ≥ 20 天（在 \`daily_active\` 中出現 ≥ 20 個不同日期）
4. 曾使用過 \`api\` 或 \`integration\` 功能（在 \`feature_events\` 中有紀錄）

**回傳：**
- \`plan\`
- \`country\`
- \`high_value_users\`（符合條件的用戶數）
- \`pct_of_plan\`（占該方案所有活躍用戶的百分比，保留一位小數）

**排序：** \`high_value_users DESC\``,
          starter: '',
          answer: `WITH active_days AS (
  SELECT user_id, COUNT(DISTINCT log_date) AS active_day_count
  FROM daily_active
  GROUP BY user_id
),
power_users AS (
  SELECT DISTINCT fe.user_id
  FROM feature_events fe
  WHERE fe.feature_name IN ('api', 'integration')
),
plan_base AS (
  SELECT plan, COUNT(*) AS plan_active_total
  FROM users
  WHERE is_active = 1 AND plan IN ('pro', 'enterprise')
  GROUP BY plan
)
SELECT
  u.plan,
  u.country,
  COUNT(DISTINCT u.user_id)                             AS high_value_users,
  ROUND(COUNT(DISTINCT u.user_id) * 100.0
        / pb.plan_active_total, 1)                      AS pct_of_plan
FROM users u
JOIN active_days ad ON ad.user_id = u.user_id AND ad.active_day_count >= 20
JOIN power_users pu ON pu.user_id = u.user_id
JOIN plan_base pb ON pb.plan = u.plan
WHERE u.is_active = 1
  AND u.plan IN ('pro', 'enterprise')
GROUP BY u.plan, u.country
ORDER BY high_value_users DESC;`,
          hints: [
            '用 CTE 先分別算出：① 活躍天數 ② 用過 api/integration 的用戶 ③ 各方案活躍用戶總數',
            '三個 CTE 用 JOIN 組合，篩選符合所有條件的用戶',
            '最後 GROUP BY plan, country 得到分群統計',
          ],
          explanation: `**PRD 決策框架：**
1. 量化目標族群規模（高價值用戶佔多少 %）
2. 了解地理分佈（哪個 country 最多，決定 CS 語言需求）
3. 方案分佈（pro vs enterprise 比例，影響 CS 服務分級）

如果高價值用戶佔 Pro/Enterprise 的 30% 以上，且這個族群流失率較低，就有數據支持「建立專屬 CS 服務」的 ROI 論述。`,
          negatives: [
            `SELECT u.plan, u.country, COUNT(DISTINCT u.user_id) AS high_value_users FROM users u WHERE u.is_active=1 AND u.plan IN ('pro','enterprise') AND (SELECT COUNT(DISTINCT log_date) FROM daily_active WHERE user_id=u.user_id) >= 20 AND EXISTS (SELECT 1 FROM feature_events WHERE user_id=u.user_id AND feature_name IN ('api','integration')) GROUP BY u.plan, u.country ORDER BY high_value_users DESC;`,
          ],
        },
        {
          id: 'pm.u05.l01.e02',
          title: '功能採用率 × 留存率交叉分析',
          difficulty: 3,
          scenario: '你想提出「推廣 report 功能使用，可以提升長期留存率」的假設，需要數據佐證：使用過 report 功能的用戶，其 Day 30 留存率是否顯著高於未使用過的用戶。',
          prompt: `比較「**使用過 \`report\` 功能**」和「**未使用過 \`report\` 功能**」的用戶，在 Day 30 的留存率差異。

Day 30 定義：signup_date 後第 28–32 天有出現在 daily_active 中。

只計算 2025-01 ~ 2025-06 注冊的用戶（確保有足夠的 30 天觀察期）。

**回傳欄位：**
- \`used_report\`（1 = 用過，0 = 未用過）
- \`total_users\`
- \`retained_d30\`
- \`d30_pct\`（保留兩位小數）

**排序：** \`used_report DESC\``,
          starter: '',
          answer: `WITH report_users AS (
  SELECT DISTINCT user_id, 1 AS used_report
  FROM feature_events
  WHERE feature_name = 'report'
),
retention AS (
  SELECT
    u.user_id,
    COALESCE(ru.used_report, 0)                          AS used_report,
    MAX(CASE WHEN julianday(da.log_date) - julianday(u.signup_date) BETWEEN 28 AND 32
             THEN 1 ELSE 0 END)                          AS d30
  FROM users u
  LEFT JOIN report_users ru ON ru.user_id = u.user_id
  LEFT JOIN daily_active da ON da.user_id = u.user_id
  WHERE u.signup_date BETWEEN '2025-01-01' AND '2025-06-30'
  GROUP BY u.user_id, used_report
)
SELECT
  used_report,
  COUNT(*)                               AS total_users,
  SUM(d30)                               AS retained_d30,
  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct
FROM retention
GROUP BY used_report
ORDER BY used_report DESC;`,
          hints: [
            '先用 CTE 標記「有用過 report 功能」的用戶（DISTINCT user_id）',
            '在主查詢 LEFT JOIN 這個 CTE，COALESCE(ru.used_report, 0) 標記未使用者',
            '計算 Day 30 留存率的方式和 U02 相同',
          ],
          explanation: `**相關性 ≠ 因果性的注意事項：**

這個查詢只能證明「使用 report 的用戶留存率更高」（相關性）。

要主張「推廣 report 可以提升留存」（因果），需要進行 A/B Test（實驗性介入），讓 treatment 組接受 report 功能推廣，才能排除「本來就高黏性的用戶更可能用 report」的混淆因素。

**但這個數據仍然有用：** 它支持了 A/B Test 假設，讓 PM 有理由去跑這個實驗。`,
          negatives: [`SELECT u.plan, f.feature_name, COUNT(DISTINCT f.user_id) AS adopters, COUNT(DISTINCT u.user_id) AS total_users, ROUND(COUNT(DISTINCT f.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 1) AS adoption_rate FROM users u LEFT JOIN feature_events f ON u.user_id = f.user_id AND f.event_type = 'used' WHERE u.plan != 'free' GROUP BY u.plan, f.feature_name ORDER BY u.plan, adoption_rate DESC`],
        },
      ],
    },
  ],
};
