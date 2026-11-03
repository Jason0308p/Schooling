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
        '用 COUNT(DISTINCT customer_id) 計算已識別會員數（不是 GA4 Users）',
        '用 events 表計算 Pageviews 和 Events per Session',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ga4.u02.l01.e01',
          title: '計算 Sessions 與 Users',
          difficulty: 1,
          scenario: '行銷主管想看整體流量概況，需要 Sessions 和 Users 兩個核心指標。',
          prompt: `計算整體的 **Sessions 數**（不重複 session_id）和 **已識別會員數**（有 customer_id 的不重複 customer_id，非 GA4 Users）。

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
          explanation: `本模擬資料以不重複 session_id 計算工作階段，不保證等於 GA4 後台 Sessions。

GA4 的 \`Users\` 包含未登入訪客（用 cookie 識別），本資料集只記錄已登入的 \`customer_id\`，這是已識別會員數，不是 GA4 報表的 Active users 或 Total users，不能直接比對。

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
            `SELECT strftime('%Y-%m', session_start) AS month, COUNT(DISTINCT sessions.session_id) AS sessions, COUNT(*) AS pageviews FROM sessions LEFT JOIN events ON sessions.session_id = events.session_id GROUP BY month ORDER BY month ASC`,
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
      title: 'Session 深度與自訂單事件率',
      minutes: 20,
      objectives: [
        '定義並計算 Session 深度（每個 session 的事件數）',
        '定義自訂單事件率（只有 1 個 page_view 事件的 session 比例）',
        '用 CTE 分層計算複合指標',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'ga4.u02.l02.e01',
          title: '計算整體自訂單事件率',
          difficulty: 2,
          scenario: '產品主管想了解網站整體的使用者黏著度，自訂單事件率是衡量到達頁品質的關鍵指標。',
          prompt: `計算整體**自訂單事件率**：只有 1 個 \`page_view\` 事件（且沒有任何其他事件）的 session 比例。

定義：session 的 event 總數 = 1，且唯一的事件是 \`page_view\`。

回傳欄位：\`total_sessions\`、\`single_event_sessions\`、\`single_event_rate\`（% 百分比，ROUND 1 位小數），單列結果。`,
          answer: `WITH session_events AS (
  SELECT
    session_id,
    COUNT(*) AS event_count,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count
  FROM events
  GROUP BY session_id
),
single_event_flags AS (
  SELECT
    s.session_id,
    CASE WHEN COALESCE(se.event_count, 0) = 1
              AND COALESCE(se.pv_count, 0) = 1
         THEN 1 ELSE 0 END AS is_single_event
  FROM sessions s
  LEFT JOIN session_events se ON s.session_id = se.session_id
)
SELECT
  COUNT(*) AS total_sessions,
  SUM(is_single_event) AS single_event_sessions,
  ROUND(SUM(is_single_event) * 100.0 / NULLIF(COUNT(*), 0), 1) AS single_event_rate
FROM single_event_flags;`,
          hints: [
            '第一個 CTE：對每個 session_id 計算 event 總數和 page_view 數',
            '第二個 CTE：用 CASE WHEN 標記 is_single_event',
            '最後 SUM(is_single_event) / COUNT(*) * 100',
          ],
          explanation: `本題是自訂單事件率，不是 GA4 跳出率。分子只計唯一事件為 page_view 的 session，分母包含 sessions 表的所有 session（含零事件）。GA4 互動判定還需要時間、關鍵事件與瀏覽次數等資訊，不能用本題條件替代。

\`COALESCE(se.event_count, 0)\` 處理 LEFT JOIN 後沒有 event 的 session（event_count 為 NULL 時視為 0）。`,
          negatives: [
            `WITH session_events AS (SELECT session_id, COUNT(*) AS event_count FROM events GROUP BY session_id) SELECT COUNT(*) AS total_sessions, SUM(CASE WHEN COALESCE(event_count, 0) <= 2 THEN 1 ELSE 0 END) AS single_event_sessions, ROUND(SUM(CASE WHEN COALESCE(event_count, 0) <= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS single_event_rate FROM sessions LEFT JOIN session_events USING(session_id)`,
          ],
        },
        {
          id: 'ga4.u02.l02.e02',
          title: '各裝置的自訂單事件率比較',
          difficulty: 2,
          scenario: 'UX 設計師懷疑手機版介面較差導致自訂單事件率偏高，想按裝置類型比較自訂單事件率。',
          prompt: `計算各裝置類型（\`device\`）的自訂單事件率。

自訂單事件定義同上題（session 只有 1 個 page_view 且無其他事件）。

回傳欄位：\`device\`、\`total_sessions\`、\`single_event_sessions\`、\`single_event_rate\`（% 百分比，ROUND 1 位小數），依 \`single_event_rate\` DESC 排序。`,
          answer: `WITH session_events AS (
  SELECT
    session_id,
    COUNT(*) AS event_count,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count
  FROM events
  GROUP BY session_id
),
single_event_flags AS (
  SELECT
    s.session_id,
    s.device,
    CASE WHEN COALESCE(se.event_count, 0) = 1
              AND COALESCE(se.pv_count, 0) = 1
         THEN 1 ELSE 0 END AS is_single_event
  FROM sessions s
  LEFT JOIN session_events se ON s.session_id = se.session_id
)
SELECT
  device,
  COUNT(*) AS total_sessions,
  SUM(is_single_event) AS single_event_sessions,
  ROUND(SUM(is_single_event) * 100.0 / NULLIF(COUNT(*), 0), 1) AS single_event_rate
FROM single_event_flags
GROUP BY device
ORDER BY single_event_rate DESC;`,
          hints: [
            '前兩個 CTE 和上題相同，在 single_event_flags 加入 s.device',
            '最後 GROUP BY device',
          ],
          explanation: `自訂單事件率只能描述本資料的事件分布；裝置差異不能直接證明 UX 問題或 GA4 跳出率差異，還需檢查埋點完整性與流量組成。`,
          negatives: [
            `WITH session_events AS (SELECT session_id, COUNT(*) AS event_count FROM events WHERE event_name = 'page_view' GROUP BY session_id) SELECT s.device, COUNT(*) AS total_sessions, SUM(CASE WHEN se.event_count = 1 THEN 1 ELSE 0 END) AS single_event_sessions, ROUND(SUM(CASE WHEN se.event_count = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS single_event_rate FROM sessions s LEFT JOIN session_events se ON s.session_id = se.session_id GROUP BY s.device ORDER BY single_event_rate DESC`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
