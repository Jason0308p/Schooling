const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ga4-u02',
  title: 'GA4 核心指標計算',
  lessons: [
    {
      id: 'ga4-u02-l01',
      title: 'Sessions、Users 與 Pageviews',
      minutes: 20,
      objectives: [
        '用 COUNT(DISTINCT session_id) 計算 Sessions 指標',
        '用 COUNT(DISTINCT customer_id) 計算 Users 指標（已登入）',
        '用 events 表計算 Pageviews 和 Events per Session',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u02.l01.e01',
          title: '計算 Sessions 與 Users',
          difficulty: 1,
          scenario: '行銷主管想看整體流量概況，需要 Sessions 和 Users 兩個核心指標。',
          prompt: `計算整體的 **Sessions 數**（不重複 session_id）和 **Users 數**（有 customer_id 的不重複 customer_id）。

欄位命名：\`total_sessions\`、\`logged_in_users\`。

回傳單列結果。`,
          answer: `SELECT
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT customer_id) AS logged_in_users
FROM sessions;`,
          hints: [
            'COUNT(DISTINCT session_id) 計算 Sessions',
            'COUNT(DISTINCT customer_id) 計算已登入 Users（NULL 自動排除）',
          ],
          explanation: `GA4 的 \`Sessions\` 指標對應 \`COUNT(DISTINCT session_id)\`。

GA4 的 \`Users\` 包含未登入訪客（用 cookie 識別），本資料集只記錄已登入的 \`customer_id\`，所以 \`logged_in_users\` 會少於 \`total_sessions\`。

\`COUNT(DISTINCT customer_id)\` 自動忽略 NULL（訪客），不需要額外 WHERE 條件。`,
          negatives: [
            `SELECT COUNT(DISTINCT session_id) AS total_sessions, COUNT(customer_id) AS logged_in_users FROM sessions`,
            `SELECT COUNT(DISTINCT session_id) AS total_sessions, COUNT(customer_id) AS logged_in_users FROM sessions`,
          ],
        },
        {
          id: 'ga4.u02.l01.e02',
          title: '各月份 Sessions 與 Pageviews',
          difficulty: 2,
          scenario: '行銷分析師要做月度流量報表，同時看 Sessions 和 Pageviews 的趨勢。',
          prompt: `計算每個月（\`strftime('%Y-%m', session_start)\`）的 Sessions 數和 Pageviews 數。

- Sessions：sessions 表的不重複 session_id
- Pageviews：events 表中 event_name = 'page_view' 的筆數

需要 JOIN sessions 和 events 兩張表。

回傳欄位：\`month\`、\`sessions\`、\`pageviews\`，依 \`month\` ASC 排序。`,
          answer: `SELECT
  strftime('%Y-%m', s.session_start) AS month,
  COUNT(DISTINCT s.session_id) AS sessions,
  COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) AS pageviews
FROM sessions s
LEFT JOIN events e ON s.session_id = e.session_id
GROUP BY month
ORDER BY month ASC;`,
          hints: [
            'LEFT JOIN events ON session_id，讓沒有事件的 session 也計入',
            'COUNT(CASE WHEN event_name = \'page_view\' THEN 1 END) 只計 page_view 事件',
            'GROUP BY strftime(\'%Y-%m\', session_start)',
          ],
          explanation: `用 LEFT JOIN 確保沒有任何 event 的 session（極少數情況）也被計入 sessions 數。

\`COUNT(CASE WHEN ... THEN 1 END)\` 是條件計數的標準寫法，等同於 BigQuery 的 \`COUNTIF(event_name = 'page_view')\`。`,
          negatives: [
            `SELECT strftime('%Y-%m', session_start) AS month, COUNT(DISTINCT session_id) AS sessions, COUNT(*) AS pageviews FROM sessions LEFT JOIN events ON sessions.session_id = events.session_id GROUP BY month ORDER BY month ASC`,
            `SELECT strftime('%Y-%m', s.session_start) AS month, COUNT(DISTINCT s.session_id) AS sessions, COUNT(DISTINCT CASE WHEN e.event_name = 'page_view' THEN e.session_id END) AS pageviews FROM sessions s LEFT JOIN events e ON s.session_id = e.session_id GROUP BY month ORDER BY month ASC`,
          ],
          ordered: true,
        },
        {
          id: 'ga4.u02.l01.e03',
          title: '各流量來源的平均每 Session 頁數',
          difficulty: 2,
          scenario: 'SEO 和 SEM 主管爭論哪個來源的流量品質更好，想用「平均每 Session 頁數」來衡量。',
          prompt: `計算各流量來源（\`source\`）的平均每 Session 頁數（pageviews / sessions），欄位命名為 \`avg_pages_per_session\`，ROUND 至 2 位小數。

回傳欄位：\`source\`、\`sessions\`、\`pageviews\`、\`avg_pages_per_session\`，依 \`avg_pages_per_session\` DESC 排序。`,
          answer: `SELECT
  s.source,
  COUNT(DISTINCT s.session_id) AS sessions,
  COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) AS pageviews,
  ROUND(
    COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) * 1.0
    / NULLIF(COUNT(DISTINCT s.session_id), 0),
    2
  ) AS avg_pages_per_session
FROM sessions s
LEFT JOIN events e ON s.session_id = e.session_id
GROUP BY s.source
ORDER BY avg_pages_per_session DESC;`,
          hints: [
            'pageviews / sessions，用 NULLIF(sessions, 0) 防零',
            '* 1.0 強制浮點除法',
            'LEFT JOIN events，GROUP BY source',
          ],
          explanation: `平均每 Session 頁數是衡量流量「黏著度」的指標，越高表示使用者越願意深入瀏覽。

\`NULLIF(COUNT(DISTINCT session_id), 0)\` 防止分母為零時出現除法錯誤（在本資料集不會發生，但在生產環境是良好習慣）。`,
          negatives: [
            `SELECT s.source, COUNT(DISTINCT s.session_id) AS sessions, COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) AS pageviews, ROUND(COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) / COUNT(DISTINCT s.session_id), 2) AS avg_pages_per_session FROM sessions s LEFT JOIN events e ON s.session_id = e.session_id GROUP BY s.source ORDER BY avg_pages_per_session DESC`,
          ],
          ordered: true,
        },
      ],
    },
    {
      id: 'ga4-u02-l02',
      title: 'Session 深度與跳出率',
      minutes: 20,
      objectives: [
        '定義並計算 Session 深度（每個 session 的事件數）',
        '定義跳出率（只有 1 個 page_view 事件的 session 比例）',
        '用 CTE 分層計算複合指標',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'ga4.u02.l02.e01',
          title: '計算整體跳出率',
          difficulty: 2,
          scenario: '產品主管想了解網站整體的使用者黏著度，跳出率是衡量到達頁品質的關鍵指標。',
          prompt: `計算整體**跳出率**：只有 1 個 \`page_view\` 事件（且沒有任何其他事件）的 session 比例。

定義：session 的 event 總數 = 1，且唯一的事件是 \`page_view\`。

回傳欄位：\`total_sessions\`、\`bounced_sessions\`、\`bounce_rate\`（% 百分比，ROUND 1 位小數），單列結果。`,
          answer: `WITH session_events AS (
  SELECT
    session_id,
    COUNT(*) AS event_count,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count
  FROM events
  GROUP BY session_id
),
bounce_flags AS (
  SELECT
    s.session_id,
    CASE WHEN COALESCE(se.event_count, 0) = 1
              AND COALESCE(se.pv_count, 0) = 1
         THEN 1 ELSE 0 END AS is_bounce
  FROM sessions s
  LEFT JOIN session_events se ON s.session_id = se.session_id
)
SELECT
  COUNT(*) AS total_sessions,
  SUM(is_bounce) AS bounced_sessions,
  ROUND(SUM(is_bounce) * 100.0 / NULLIF(COUNT(*), 0), 1) AS bounce_rate
FROM bounce_flags;`,
          hints: [
            '第一個 CTE：對每個 session_id 計算 event 總數和 page_view 數',
            '第二個 CTE：用 CASE WHEN 標記 is_bounce',
            '最後 SUM(is_bounce) / COUNT(*) * 100',
          ],
          explanation: `GA4 對跳出（Bounce）的定義是：session 只有一個事件（沒有任何互動）。本題用「event_count = 1 且唯一事件是 page_view」來模擬這個定義。

\`COALESCE(se.event_count, 0)\` 處理 LEFT JOIN 後沒有 event 的 session（event_count 為 NULL 時視為 0）。`,
          negatives: [
            `WITH session_events AS (SELECT session_id, COUNT(*) AS event_count FROM events GROUP BY session_id) SELECT COUNT(*) AS total_sessions, SUM(CASE WHEN COALESCE(event_count, 0) <= 2 THEN 1 ELSE 0 END) AS bounced_sessions, ROUND(SUM(CASE WHEN COALESCE(event_count, 0) <= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS bounce_rate FROM sessions LEFT JOIN session_events USING(session_id)`,
          ],
        },
        {
          id: 'ga4.u02.l02.e02',
          title: '各裝置的跳出率比較',
          difficulty: 2,
          scenario: 'UX 設計師懷疑手機版介面較差導致跳出率偏高，想按裝置類型比較跳出率。',
          prompt: `計算各裝置類型（\`device\`）的跳出率。

跳出定義同上題（session 只有 1 個 page_view 且無其他事件）。

回傳欄位：\`device\`、\`total_sessions\`、\`bounced_sessions\`、\`bounce_rate\`（% 百分比，ROUND 1 位小數），依 \`bounce_rate\` DESC 排序。`,
          answer: `WITH session_events AS (
  SELECT
    session_id,
    COUNT(*) AS event_count,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count
  FROM events
  GROUP BY session_id
),
bounce_flags AS (
  SELECT
    s.session_id,
    s.device,
    CASE WHEN COALESCE(se.event_count, 0) = 1
              AND COALESCE(se.pv_count, 0) = 1
         THEN 1 ELSE 0 END AS is_bounce
  FROM sessions s
  LEFT JOIN session_events se ON s.session_id = se.session_id
)
SELECT
  device,
  COUNT(*) AS total_sessions,
  SUM(is_bounce) AS bounced_sessions,
  ROUND(SUM(is_bounce) * 100.0 / NULLIF(COUNT(*), 0), 1) AS bounce_rate
FROM bounce_flags
GROUP BY device
ORDER BY bounce_rate DESC;`,
          hints: [
            '前兩個 CTE 和上題相同，在 bounce_flags 加入 s.device',
            '最後 GROUP BY device',
          ],
          explanation: `行動裝置的跳出率通常高於桌機，這可能反映：頁面載入速度較慢、版面不適合觸控、或行動版使用者的瀏覽意圖本來就較短暫。`,
          negatives: [
            `WITH session_events AS (SELECT session_id, COUNT(*) AS event_count FROM events WHERE event_name = 'page_view' GROUP BY session_id) SELECT s.device, COUNT(*) AS total_sessions, SUM(CASE WHEN se.event_count = 1 THEN 1 ELSE 0 END) AS bounced_sessions, ROUND(SUM(CASE WHEN se.event_count = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS bounce_rate FROM sessions s LEFT JOIN session_events se ON s.session_id = se.session_id GROUP BY s.device ORDER BY bounce_rate DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
