const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'pm-u03',
  title: '功能採用率（Feature Adoption）',
  lessons: [
    {
      id: 'pm-u03-l01',
      title: '計算各功能的採用率',
      minutes: 30,
      objectives: [
        '理解功能採用率（Feature Adoption Rate）的定義',
        '用 COUNT DISTINCT 計算使用過某功能的用戶數',
        '計算各功能的採用率並做排名',
        '比較不同方案用戶的功能使用差異',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'pm.u03.l01.e01',
          title: '計算各功能的整體採用率',
          difficulty: 2,
          scenario: '你的團隊想知道哪些功能已經被用戶廣泛使用，哪些功能還需要推廣。',
          prompt: `計算每個 **\`feature_name\`** 的**採用率**。

定義：採用率 = 使用過該功能的不重複用戶數 ÷ 所有活躍用戶總數 × 100

「使用過」定義：在 \`feature_events\` 中有任何 \`event_type\` 紀錄皆算。

活躍用戶基數：\`users\` 表中 \`is_active = 1\` 的用戶數。

**回傳欄位：** \`feature_name\`、\`unique_users\`（使用過的不重複用戶數）、\`adoption_pct\`（保留兩位小數）

**排序：** \`adoption_pct DESC\``,
          starter: '',
          answer: `WITH active_base AS (
  SELECT COUNT(*) AS total_active FROM users WHERE is_active = 1
)
SELECT
  fe.feature_name,
  COUNT(DISTINCT fe.user_id)                             AS unique_users,
  ROUND(COUNT(DISTINCT fe.user_id) * 100.0
        / (SELECT total_active FROM active_base), 2)    AS adoption_pct
FROM feature_events fe
JOIN users u ON u.user_id = fe.user_id AND u.is_active = 1
GROUP BY fe.feature_name
ORDER BY adoption_pct DESC;`,
          hints: [
            '分母是所有活躍用戶（is_active = 1），不是用過某功能的用戶',
            '用 CTE 或子查詢先算出總活躍用戶數',
            'JOIN users 並過濾 is_active = 1，確保只計算活躍用戶的使用行為',
          ],
          explanation: `**採用率 vs 使用率：**
- 採用率（Adoption Rate）= 有多少用戶「用過」某功能（一個人多次只算一次）
- 使用率（Usage Rate）= 每位用戶平均使用幾次（更關注使用深度）

**業務應用：** 採用率低的功能可能是「藏太深找不到」或「功能本身吸引力不足」，需要區分原因。`,
          negatives: [
            `SELECT feature_name, COUNT(DISTINCT user_id) AS unique_users, ROUND(COUNT(DISTINCT user_id)*100.0/(SELECT COUNT(*) FROM users), 2) AS adoption_pct FROM feature_events GROUP BY feature_name ORDER BY adoption_pct DESC;`,
            `SELECT feature_name, COUNT(*) AS unique_users, ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM users WHERE is_active=1),2) AS adoption_pct FROM feature_events GROUP BY feature_name ORDER BY adoption_pct DESC;`,
          ],
        },
        {
          id: 'pm.u03.l01.e02',
          title: '各方案用戶的功能採用率差異',
          difficulty: 3,
          scenario: '你想了解哪些功能是 Pro / Enterprise 的「專屬高使用功能」，來規劃功能定價策略。',
          prompt: `計算 **\`free\`**、**\`pro\`**、**\`enterprise\`** 用戶各自對每個功能的**採用率**。

採用率 = 該方案中使用過該功能的用戶數 ÷ 該方案活躍用戶總數 × 100

**回傳欄位：** \`plan\`、\`feature_name\`、\`users_adopted\`、\`plan_active_users\`（該方案活躍用戶總數）、\`adoption_pct\`（保留一位小數）

**排序：** \`plan ASC\`，再 \`adoption_pct DESC\``,
          starter: '',
          answer: `WITH plan_base AS (
  SELECT plan, COUNT(*) AS plan_active_users
  FROM users
  WHERE is_active = 1
  GROUP BY plan
),
feature_adoption AS (
  SELECT
    u.plan,
    fe.feature_name,
    COUNT(DISTINCT fe.user_id) AS users_adopted
  FROM feature_events fe
  JOIN users u ON u.user_id = fe.user_id AND u.is_active = 1
  GROUP BY u.plan, fe.feature_name
)
SELECT
  fa.plan,
  fa.feature_name,
  fa.users_adopted,
  pb.plan_active_users,
  ROUND(fa.users_adopted * 100.0 / pb.plan_active_users, 1) AS adoption_pct
FROM feature_adoption fa
JOIN plan_base pb ON pb.plan = fa.plan
ORDER BY fa.plan, adoption_pct DESC;`,
          hints: [
            '先建立每個 plan 的活躍用戶基數（plan_base）',
            '再計算每個 plan × feature_name 組合的採用用戶數',
            '最後 JOIN 兩個 CTE 計算採用率',
          ],
          explanation: `**功能定價策略依據：** 若 api、integration 功能在 enterprise 採用率遠高於 free，說明這些功能是「企業功能」的象徵，可以作為升級到 enterprise 的核心賣點。

**常見錯誤：** 分母用全體用戶而非該方案用戶，導致採用率被稀釋。`,
          negatives: [
            `SELECT u.plan, fe.feature_name, COUNT(DISTINCT fe.user_id) AS users_adopted, (SELECT COUNT(*) FROM users WHERE is_active=1) AS plan_active_users, ROUND(COUNT(DISTINCT fe.user_id)*100.0/(SELECT COUNT(*) FROM users WHERE is_active=1),1) AS adoption_pct FROM feature_events fe JOIN users u ON u.user_id=fe.user_id AND u.is_active=1 GROUP BY u.plan, fe.feature_name ORDER BY u.plan, adoption_pct DESC;`,
          ],
        },
        {
          id: 'pm.u03.l01.e03',
          title: '找出「只看過但從未完成」的功能',
          difficulty: 3,
          scenario: '你懷疑部分功能用戶只是打開看了一眼就放棄（viewed 但沒有 completed），這代表功能設計或引導有問題。',
          prompt: `找出所有 **有 \`viewed\` 事件、但從未有 \`completed\` 事件** 的（user_id, feature_name）組合，計算每個功能的這類「放棄用戶數」。

**回傳欄位：** \`feature_name\`、\`abandoned_users\`（有 viewed 但沒 completed 的用戶數）

**排序：** \`abandoned_users DESC\``,
          starter: '',
          answer: `WITH viewed AS (
  SELECT DISTINCT user_id, feature_name
  FROM feature_events
  WHERE event_type = 'viewed'
),
completed AS (
  SELECT DISTINCT user_id, feature_name
  FROM feature_events
  WHERE event_type = 'completed'
)
SELECT
  v.feature_name,
  COUNT(*) AS abandoned_users
FROM viewed v
WHERE NOT EXISTS (
  SELECT 1 FROM completed c
  WHERE c.user_id = v.user_id AND c.feature_name = v.feature_name
)
GROUP BY v.feature_name
ORDER BY abandoned_users DESC;`,
          hints: [
            '用兩個 CTE 分別找出 viewed 和 completed 的（user_id, feature_name）組合',
            '用 NOT EXISTS 或 LEFT JOIN ... WHERE IS NULL 找出沒有 completed 的用戶',
          ],
          explanation: `**漏斗分析的應用：** viewed → used → completed 是功能使用漏斗。「viewed 但沒 completed」代表用戶進入了功能但沒有完成，可能是 UX 問題、功能太複雜、或缺少引導。

**NOT EXISTS vs LEFT JOIN ... IS NULL：** 兩種寫法效果相同，NOT EXISTS 可讀性更高。`,
          negatives: [
            `SELECT feature_name, COUNT(DISTINCT user_id) AS abandoned_users FROM feature_events WHERE event_type='viewed' AND user_id NOT IN (SELECT user_id FROM feature_events WHERE event_type='completed') GROUP BY feature_name ORDER BY abandoned_users DESC;`,
          ],
        },
      ],
    },
  ],
};
