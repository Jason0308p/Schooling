const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'gh-u02',
  title: 'Activation：啟動分析',
  lessons: [
    {
      id: 'gh-u02-l01',
      title: 'Onboarding 完成率與 Time-to-value',
      minutes: 20,
      objectives: [
        '計算 Activation rate（首次使用核心功能的用戶比例）',
        '計算 Time-to-value（從註冊到第一次用 dashboard 的天數）',
        '比較各渠道的 Activation rate，找出 Onboarding 問題',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'gh.u02.l01.e01',
          title: '計算整體 Activation Rate',
          difficulty: 2,
          scenario: '產品剛改版了 Onboarding 流程，你需要計算「有多少比例的用戶在註冊後曾使用過 dashboard 功能」，作為 Activation 的衡量指標。',
          prompt: `計算所有用戶的 **Activation Rate**。

定義：曾在 \`feature_events\` 中有 \`feature_name = 'dashboard'\` 的用戶，視為「已啟動」。

**回傳欄位：** \`total_users\`、\`activated_users\`、\`activation_rate_pct\`（保留一位小數）`,
          answer: `SELECT
  COUNT(DISTINCT u.user_id)                                    AS total_users,
  COUNT(DISTINCT fe.user_id)                                   AS activated_users,
  ROUND(COUNT(DISTINCT fe.user_id) * 100.0
        / COUNT(DISTINCT u.user_id), 1)                        AS activation_rate_pct
FROM users u
LEFT JOIN feature_events fe
  ON  fe.user_id = u.user_id
  AND fe.feature_name = 'dashboard';`,
          hints: [
            'LEFT JOIN 確保沒有使用 dashboard 的用戶也被計入分母',
            'COUNT(DISTINCT fe.user_id) 只計算有 JOIN 到紀錄的用戶（已啟動）',
          ],
          explanation: `**Activation Rate** 是 Onboarding 改版成效最直接的衡量。若啟動率低，可能代表：核心功能太難找、引導步驟太多、或 Aha Moment 不夠明顯。

LEFT JOIN 不可改成 INNER JOIN——INNER JOIN 只保留有啟動的用戶，分母錯誤，Activation Rate 會變成 100%。`,
          negatives: [
            `SELECT COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT fe.user_id) AS activated_users, ROUND(COUNT(DISTINCT fe.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 1) AS activation_rate_pct FROM users u JOIN feature_events fe ON fe.user_id = u.user_id AND fe.feature_name = 'dashboard';`,
          ],
        },
        {
          id: 'gh.u02.l01.e02',
          title: '計算平均 Time-to-value',
          difficulty: 2,
          scenario: '你想知道用戶從「註冊」到「第一次使用 dashboard」平均需要幾天，這個數字越小代表 Onboarding 效率越高。',
          prompt: `計算有啟動的用戶（曾使用 \`dashboard\`）的**平均 Time-to-value**（天數）。

Time-to-value = 第一次使用 \`dashboard\` 的日期 − \`signup_date\`（天數，用 julianday 計算）

**回傳欄位：** \`activated_users\`、\`avg_days_to_value\`（保留一位小數）、\`median_approx\`（用整數近似中位數：對 days_to_value 排序後取中間值，SQLite 用 MIN(days) OVER ... 近似即可，或直接省略改回傳 \`min_days\`、\`max_days\`）

簡化版：只回傳 \`activated_users\`、\`avg_days_to_value\`、\`min_days\`、\`max_days\``,
          answer: `WITH ttv AS (
  SELECT
    u.user_id,
    CAST(julianday(MIN(fe.event_date)) - julianday(u.signup_date) AS INTEGER) AS days_to_value
  FROM users u
  JOIN feature_events fe
    ON  fe.user_id = u.user_id
    AND fe.feature_name = 'dashboard'
  GROUP BY u.user_id, u.signup_date
)
SELECT
  COUNT(*)                         AS activated_users,
  ROUND(AVG(days_to_value), 1)     AS avg_days_to_value,
  MIN(days_to_value)               AS min_days,
  MAX(days_to_value)               AS max_days
FROM ttv;`,
          hints: [
            "用 MIN(fe.event_date) 找每個用戶第一次使用 dashboard 的日期",
            'julianday(event_date) - julianday(signup_date) 計算天數差',
            'CAST(... AS INTEGER) 把浮點天數轉為整數',
          ],
          explanation: `**Time-to-value** 是量化 Onboarding 效率的最佳指標。平均天數越短，代表用戶越快感受到產品價值。

avg + min + max 三個數字一起看：如果 avg 遠大於 min，代表有少數用戶拖高平均值，應該進一步看分布（TTV bucket 分析）。`,
          negatives: [
            `WITH ttv AS (SELECT u.user_id, CAST(julianday(MIN(fe.event_date)) - julianday(u.signup_date) AS INTEGER) AS days_to_value FROM users u JOIN feature_events fe ON fe.user_id = u.user_id AND fe.feature_name = 'dashboard' GROUP BY u.user_id, u.signup_date) SELECT COUNT(*) AS activated_users, ROUND(AVG(days_to_value), 1) AS avg_days_to_value, MIN(days_to_value) AS min_days, MAX(days_to_value) AS max_days FROM ttv WHERE days_to_value < 0;`,
          ],
        },
        {
          id: 'gh.u02.l01.e03',
          title: '各渠道 Activation Rate 比較',
          difficulty: 3,
          scenario: '行銷主管想知道：哪個渠道帶來的用戶 Activation Rate 最高？這代表哪個渠道帶來的用戶最適合這個產品。',
          prompt: `計算各 **acquisition_channel** 的 Activation Rate，並同時計算**平均 Time-to-value**（只算有啟動的用戶）。

**回傳欄位：** \`acquisition_channel\`、\`total_users\`、\`activated_users\`、\`activation_rate_pct\`（保留一位小數）、\`avg_days_to_value\`（保留一位小數，NULL 表示沒有啟動用戶）

**排序：** \`activation_rate_pct DESC\``,
          answer: `WITH activation AS (
  SELECT
    u.user_id,
    u.acquisition_channel,
    MIN(fe.event_date) AS first_dashboard_date,
    u.signup_date
  FROM users u
  LEFT JOIN feature_events fe
    ON  fe.user_id = u.user_id
    AND fe.feature_name = 'dashboard'
  GROUP BY u.user_id, u.acquisition_channel, u.signup_date
)
SELECT
  acquisition_channel,
  COUNT(*)                                                           AS total_users,
  COUNT(first_dashboard_date)                                        AS activated_users,
  ROUND(COUNT(first_dashboard_date) * 100.0 / COUNT(*), 1)          AS activation_rate_pct,
  ROUND(AVG(
    CASE WHEN first_dashboard_date IS NOT NULL
         THEN julianday(first_dashboard_date) - julianday(signup_date)
    END
  ), 1)                                                              AS avg_days_to_value
FROM activation
GROUP BY acquisition_channel
ORDER BY activation_rate_pct DESC;`,
          hints: [
            'CTE 先對每位用戶找出 first_dashboard_date（NULL = 沒啟動）',
            'COUNT(first_dashboard_date) 自動略過 NULL，等同 activated_users',
            'AVG 中用 CASE WHEN 排除 NULL 值，只平均已啟動用戶的天數',
          ],
          explanation: `**渠道 Activation 比較** 幫助行銷找到「不只帶來用戶、還帶來真正使用者」的高品質渠道。

avg_days_to_value 也很重要：若某渠道用戶啟動率高但 TTV 很長，可能代表他們在探索產品，需要更好的 Onboarding 指引。`,
          negatives: [
            `WITH activation AS (SELECT u.user_id, u.acquisition_channel, MIN(fe.event_date) AS first_dashboard_date, u.signup_date FROM users u LEFT JOIN feature_events fe ON fe.user_id = u.user_id AND fe.feature_name = 'dashboard' GROUP BY u.user_id, u.acquisition_channel, u.signup_date) SELECT acquisition_channel, COUNT(*) AS total_users, COUNT(first_dashboard_date) AS activated_users, ROUND(COUNT(first_dashboard_date) * 100.0 / COUNT(*), 1) AS activation_rate_pct, ROUND(AVG(CASE WHEN first_dashboard_date IS NOT NULL THEN julianday(first_dashboard_date) - julianday(signup_date) END), 1) AS avg_days_to_value FROM activation GROUP BY acquisition_channel ORDER BY activation_rate_pct ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
