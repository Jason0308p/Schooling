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
          ordered: true,
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

**排序：** \`high_value_users DESC\`
活躍天數與功能事件皆限 [2025-01-01, 2026-01-01)。同分依 plan ASC、country ASC。`,
          starter: '',
          answer: `WITH active_days AS (
  SELECT user_id, COUNT(DISTINCT log_date) AS active_day_count
  FROM daily_active
  WHERE log_date >= '2025-01-01' AND log_date < '2026-01-01'
  GROUP BY user_id
),
power_users AS (
  SELECT DISTINCT fe.user_id
  FROM feature_events fe
  WHERE fe.feature_name IN ('api', 'integration') AND fe.event_date >= '2025-01-01' AND fe.event_date < '2026-01-01'
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
ORDER BY high_value_users DESC, u.plan ASC, u.country ASC;`,
          hints: [
            '用 CTE 先分別算出：① 活躍天數 ② 用過 api/integration 的用戶 ③ 各方案活躍用戶總數',
            '三個 CTE 用 JOIN 組合，篩選符合所有條件的用戶',
            '最後 GROUP BY plan, country 得到分群統計',
          ],
          explanation: `本查詢只量化當前活躍付費用戶中符合行為條件的族群規模與地理分布，沒有估計流失率、CS 成本或 CS 帶來的增量收益。不能以族群占比超過某門檻宣稱專屬 CS ROI 為正。需另外估計成本、毛利、增量留存與服務效果，最好以受控試點驗證。`,
          negatives: [
            `SELECT u.plan, u.country, COUNT(DISTINCT u.user_id) AS high_value_users FROM users u WHERE u.is_active=1 AND u.plan IN ('pro','enterprise') AND (SELECT COUNT(DISTINCT log_date) FROM daily_active WHERE user_id=u.user_id) >= 20 AND EXISTS (SELECT 1 FROM feature_events WHERE user_id=u.user_id AND feature_name IN ('api','integration')) GROUP BY u.plan, u.country ORDER BY high_value_users DESC;`,
          ],
        },
        {
          id: 'pm.u05.l01.e02',
          title: '功能採用率 × 留存率交叉分析',
          difficulty: 3,
          ordered: true,
          scenario: '你想先描述早期 report 接觸者與未接觸者的 Day 30 留存差異，以規劃後續隨機推廣實驗；本題不做顯著性或因果判斷。',
          prompt: `比較「**使用過 \`report\` 功能**」和「**未使用過 \`report\` 功能**」的用戶，在 Day 30 的留存率差異。

Day 30 定義：signup_date 後第 28–32 天有出現在 daily_active 中。

只計算 2025-01 ~ 2025-06 注冊的用戶（確保有足夠的 30 天觀察期）。

**回傳欄位：**
- \`used_report\`（1 = 用過，0 = 未用過）
- \`total_users\`
- \`retained_d30\`
- \`d30_pct\`（保留兩位小數）

**排序：** \`used_report DESC\`

先依註冊後 D0–D7（含）是否有 report 的任何事件固定 used_report，再觀察 D28–D32 留存。事件日期採 YYYY-MM-DD；D8 及之後事件不得用於分群。資料起點/截止為 2025-01-01/2025-12-31，僅納入 signup_date + 32 天 <= 截止的成熟用戶，兩組相同資格分母。`,
          starter: '',
          answer: `WITH report_users AS (
  SELECT DISTINCT fe.user_id, 1 AS used_report
  FROM feature_events fe JOIN users u ON u.user_id = fe.user_id
  WHERE fe.feature_name = 'report'
    AND fe.event_date >= u.signup_date
    AND fe.event_date < date(u.signup_date, '+8 days')
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
    AND date(u.signup_date, '+32 days') <= '2025-12-31'
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
            '先依每位用戶 signup_date 至 signup_date+7 天的 report 事件建立分群。',
            'D8 起的 report 事件不可用於分群，避免未來資訊洩漏。',
            '只保留已完整觀察 D32 的用戶，再 LEFT JOIN 活躍資料打 D28–32 flag。',
          ],
          explanation: `先以 D0–7 的功能接觸固定分群，再觀察較晚的 D28–32，避免使用留存窗內或之後的事件回頭分群。此表僅呈現早期接觸與留存的相關性，未作顯著性檢定，也沒有排除原有黏性、方案或來源等混淆，不能證明功能因果效益。需隨機實驗驗證推廣策略。`,
          negatives: [
            `WITH report_users AS (
  SELECT DISTINCT fe.user_id, 1 AS used_report
  FROM feature_events fe JOIN users u ON u.user_id = fe.user_id
  WHERE fe.feature_name = 'report'

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
    AND date(u.signup_date, '+32 days') <= '2025-12-31'
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
          ],
        },
      ],
    },
  ],
};
