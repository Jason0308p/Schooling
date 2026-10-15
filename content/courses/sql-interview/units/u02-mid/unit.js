const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'int-u02',
  title: '中級題組（工作 2–4 年）',
  lessons: [
    {
      id: 'int-u02-l01',
      title: '中級面試題：Cohort、RFM、ROAS、交叉購買',
      minutes: 50,
      objectives: [
        '計算月份 Cohort 留存率（M0 ~ M3）',
        '完成 RFM 分群並計算各群組占總營收比例',
        '找出年內活躍且近期購買的會員名單',
        '用 sessions + orders + campaigns 計算廣告 ROAS',
        '計算商品交叉購買率（co-purchase analysis）',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'int.u02.l01.e01',
          title: '月份 Cohort 留存率（M0–M3）',
          difficulty: 3,
          scenario: '這是我們 Growth 團隊面試的核心筆試題。請計算 2025-07 ~ 2025-09 三個 Cohort 的 M0 到 M3 留存率。',
          prompt: `計算 **2025-07、2025-08、2025-09** 三個月首購 Cohort 的留存率（M0 ~ M3）。

**定義：**
- **Cohort 月份**：顧客第一筆 \`completed\` 訂單所在的月份
- **M0**：在 Cohort 月份有 completed 訂單的人數（= Cohort size）
- **M1**：在 Cohort 月份 +1 個自然月有 completed 訂單的人數
- **M2 / M3**：以此類推
- **留存率**：M1 / M0 × 100%，ROUND 1 位小數

**回傳欄位：** \`cohort_month\`, \`m0_size\`, \`m1_retained\`, \`m2_retained\`, \`m3_retained\`, \`m1_pct\`, \`m2_pct\`, \`m3_pct\`

**排序：** \`cohort_month ASC\``,
          starter: '',
          answer: `WITH first_order AS (
  SELECT customer_id,
         SUBSTR(MIN(order_date), 1, 7) AS cohort_month
  FROM   orders
  WHERE  status = 'completed'
  GROUP  BY customer_id
),
active_months AS (
  SELECT DISTINCT o.customer_id,
         SUBSTR(o.order_date, 1, 7) AS active_month
  FROM   orders o
  WHERE  o.status = 'completed'
),
cohort_activity AS (
  SELECT f.cohort_month,
         f.customer_id,
         CAST(
           (CAST(SUBSTR(am.active_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(am.active_month, 6, 2) AS INT))
           - (CAST(SUBSTR(f.cohort_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(f.cohort_month, 6, 2) AS INT))
         AS INT) AS period
  FROM   first_order f
  JOIN   active_months am ON am.customer_id = f.customer_id
  WHERE  f.cohort_month IN ('2025-07', '2025-08', '2025-09')
)
SELECT
  cohort_month,
  SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END)                                              AS m0_size,
  SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END)                                              AS m1_retained,
  SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END)                                              AS m2_retained,
  SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END)                                              AS m3_retained,
  ROUND(SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END) * 100.0
        / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1)                       AS m1_pct,
  ROUND(SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END) * 100.0
        / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1)                       AS m2_pct,
  ROUND(SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END) * 100.0
        / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1)                       AS m3_pct
FROM cohort_activity
GROUP BY cohort_month
ORDER BY cohort_month ASC;`,
          hints: [],
          explanation: `**三步拆解：**
1. \`first_order\`：每位顧客的首購月份（MIN order_date）
2. \`active_months\`：每位顧客每個月有沒有下單（DISTINCT customer_id + month）
3. \`cohort_activity\`：計算每次下單距離首購月份幾個月（整數月數差）

**月數差的計算：**
- SQLite 沒有 \`DATEDIFF('month', ...)\`
- 用「年×12 + 月」相減得到整數月數差

**常見扣分點：**
- 用 \`DATEDIFF(active_month, cohort_month) / 30\` 計算月數（不準確，2 月只有 28 天）
- M0 size 用 \`COUNT(DISTINCT customer_id)\` 但漏掉把 period=0 的人當母數
- 留存率分母不正確（用所有顧客而不是 Cohort size）

**追問方向：**
- 「如果顧客 M0 買了 3 次，M1 留存算幾次？」（只算有/沒有，不算次數）`,
          negatives: [
            `WITH first_order AS (SELECT customer_id, SUBSTR(MIN(order_date), 1, 7) AS cohort_month FROM orders GROUP BY customer_id), active_months AS (SELECT DISTINCT o.customer_id, SUBSTR(o.order_date, 1, 7) AS active_month FROM orders o WHERE o.status = 'completed'), cohort_activity AS (SELECT f.cohort_month, f.customer_id, CAST((CAST(SUBSTR(am.active_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(am.active_month, 6, 2) AS INT)) - (CAST(SUBSTR(f.cohort_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(f.cohort_month, 6, 2) AS INT)) AS INT) AS period FROM first_order f JOIN active_months am ON am.customer_id = f.customer_id WHERE f.cohort_month IN ('2025-07', '2025-08', '2025-09')) SELECT cohort_month, SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END) AS m0_size, SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END) AS m1_retained, SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END) AS m2_retained, SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END) AS m3_retained, ROUND(SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1) AS m1_pct, ROUND(SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1) AS m2_pct, ROUND(SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END), 0), 1) AS m3_pct FROM cohort_activity GROUP BY cohort_month ORDER BY cohort_month ASC;`,
            `WITH first_order AS (SELECT customer_id, SUBSTR(MIN(order_date), 1, 7) AS cohort_month FROM orders WHERE status = 'completed' GROUP BY customer_id), active_months AS (SELECT DISTINCT o.customer_id, SUBSTR(o.order_date, 1, 7) AS active_month FROM orders o WHERE o.status = 'completed'), cohort_activity AS (SELECT f.cohort_month, f.customer_id, CAST((CAST(SUBSTR(am.active_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(am.active_month, 6, 2) AS INT)) - (CAST(SUBSTR(f.cohort_month, 1, 4) AS INT) * 12 + CAST(SUBSTR(f.cohort_month, 6, 2) AS INT)) AS INT) AS period FROM first_order f JOIN active_months am ON am.customer_id = f.customer_id WHERE f.cohort_month IN ('2025-07', '2025-08', '2025-09')) SELECT cohort_month, SUM(CASE WHEN period = 0 THEN 1 ELSE 0 END) AS m0_size, SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END) AS m1_retained, SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END) AS m2_retained, SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END) AS m3_retained, ROUND(SUM(CASE WHEN period = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT f.customer_id), 1) AS m1_pct, ROUND(SUM(CASE WHEN period = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT f.customer_id), 1) AS m2_pct, ROUND(SUM(CASE WHEN period = 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT f.customer_id), 1) AS m3_pct FROM cohort_activity GROUP BY cohort_month ORDER BY cohort_month ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u02.l01.e02',
          title: 'RFM 分群各組占總營收比例',
          difficulty: 3,
          scenario: '面試官說：「請用 RFM 框架，把顧客分成高價值和低價值兩組，算出每組占全體 completed 訂單總營收的比例。基準日用 2026-06-30。」',
          prompt: `用以下 **RFM 簡化分群**，計算各群組的顧客數與占總營收比例。

**RFM 定義（只計算 \`completed\` 訂單，基準日 2026-06-30）：**
- **R（最近購買天數）**：距基準日最後一筆 completed 訂單的天數
- **F（購買頻率）**：completed 訂單筆數
- **M（總消費）**：completed 訂單 total_amount 加總

**分群規則：**
- **高價值**：R <= 90 且 F >= 3 且 M >= 2000
- **低價值**：其他（R > 90 或 F < 3 或 M < 2000）

**要求：**
- \`customer_count\`：各群組的顧客人數
- \`group_revenue\`：各群組的總 M（ROUND 整數）
- \`revenue_pct\`：group_revenue / 全體總 M × 100，ROUND 1 位小數

**回傳欄位：** \`segment\`, \`customer_count\`, \`group_revenue\`, \`revenue_pct\`

**排序：** \`revenue_pct DESC\``,
          starter: '',
          answer: `WITH rfm AS (
  SELECT
    customer_id,
    CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INT) AS r_days,
    COUNT(*)                                                            AS f_count,
    SUM(total_amount)                                                   AS m_total
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
segmented AS (
  SELECT *,
    CASE
      WHEN r_days <= 90 AND f_count >= 3 AND m_total >= 2000 THEN '高價值'
      ELSE '低價值'
    END AS segment
  FROM rfm
),
total_rev AS (
  SELECT SUM(m_total) AS grand_total FROM segmented
)
SELECT
  s.segment,
  COUNT(*)                                                        AS customer_count,
  ROUND(SUM(s.m_total))                                           AS group_revenue,
  ROUND(SUM(s.m_total) * 100.0 / t.grand_total, 1)               AS revenue_pct
FROM segmented s
CROSS JOIN total_rev t
GROUP BY s.segment, t.grand_total
ORDER BY revenue_pct DESC;`,
          hints: [],
          explanation: `**CROSS JOIN total_rev 的技巧：**
total_rev 只有一列（整體總計），CROSS JOIN 後每列都能取到 grand_total，避免需要用子查詢重複計算。

**julianday 計算天數：**
SQLite 的 \`julianday()\` 回傳儒略日（浮點），兩者相減即為天數差，CAST 成 INT 取整。

**常見扣分點：**
- R 的方向搞反（R 小 = 最近購買，是好事；R 大 = 很久沒買，是壞事）
- 分母用所有顧客的 M 加總，但分子是篩選後的 group_revenue，造成比例計算錯誤
- CROSS JOIN 未使用，改用子查詢但子查詢寫在 WHERE 導致無法在 SELECT 引用

**追問方向：**
- 「你的 RFM 是用 percentile 分組嗎？還是固定閾值？各有什麼優缺點？」`,
          negatives: [
            `WITH rfm AS (SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INT) AS r_days, COUNT(*) AS f_count, SUM(total_amount) AS m_total FROM orders GROUP BY customer_id), segmented AS (SELECT *, CASE WHEN r_days <= 90 AND f_count >= 5 AND m_total >= 10000 THEN 'VIP' WHEN f_count >= 3 OR m_total >= 5000 THEN '活躍' WHEN r_days > 180 THEN '沉睡' ELSE '其他' END AS segment FROM rfm) SELECT s.segment, COUNT(*) AS customer_count, ROUND(SUM(s.m_total)) AS group_revenue, ROUND(SUM(s.m_total) * 100.0 / (SELECT SUM(total_amount) FROM orders WHERE status = 'completed'), 1) AS revenue_pct FROM segmented s GROUP BY s.segment ORDER BY revenue_pct DESC;`,
            `WITH rfm AS (SELECT customer_id, CAST(julianday('2026-06-30') - julianday(MAX(order_date)) AS INT) AS r_days, COUNT(*) AS f_count, SUM(total_amount) AS m_total FROM orders GROUP BY customer_id), segmented AS (SELECT *, CASE WHEN r_days <= 90 AND f_count >= 3 AND m_total >= 2000 THEN '高價值' ELSE '低價值' END AS segment FROM rfm), total_rev AS (SELECT SUM(m_total) AS grand_total FROM segmented) SELECT s.segment, COUNT(*) AS customer_count, ROUND(SUM(s.m_total)) AS group_revenue, ROUND(SUM(s.m_total) * 100.0 / t.grand_total, 1) AS revenue_pct FROM segmented s CROSS JOIN total_rev t GROUP BY s.segment, t.grand_total ORDER BY revenue_pct DESC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u02.l01.e03',
          title: '年內活躍且近期購買的會員名單',
          difficulty: 3,
          scenario: '行銷主管要一份「2025-07-01 以來購買次數 ≥ 3、且最後一筆在近 90 天內」的活躍會員名單，作為忠誠方案的邀請對象。基準日 2026-06-30。',
          prompt: `找出符合以下條件的會員，作為活躍忠誠計畫邀請名單。

**條件（只計算 \`completed\` 訂單）：**
- 2025-07-01 以來的 completed 訂單筆數 \`>= 3\`
- 最後一筆 completed 訂單距 2026-06-30 的天數 \`<= 90\`（即 order_date >= date('2026-06-30', '-90 days')）

**要求：**
- \`order_count\`：2025-07-01 以來的 completed 訂單筆數
- \`last_order_date\`：最後一筆 completed 訂單日期
- \`days_since_last\`：距 2026-06-30 的整數天數（用 julianday 計算）

**回傳欄位：** \`customer_id\`, \`name\`, \`email\`, \`membership_tier\`, \`order_count\`, \`last_order_date\`, \`days_since_last\`

**排序：** \`days_since_last ASC\``,
          starter: '',
          answer: `SELECT
  c.customer_id,
  c.name,
  c.email,
  c.membership_tier,
  COUNT(o.order_id)                                                      AS order_count,
  MAX(o.order_date)                                                      AS last_order_date,
  CAST(julianday('2026-06-30') - julianday(MAX(o.order_date)) AS INT)   AS days_since_last
FROM customers c
JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.status      = 'completed'
 AND o.order_date  >= '2025-07-01'
GROUP BY c.customer_id, c.name, c.email, c.membership_tier
HAVING COUNT(o.order_id) >= 3
   AND MAX(o.order_date) >= date('2026-06-30', '-90 days')
ORDER BY days_since_last ASC;`,
          hints: [],
          explanation: `**關鍵：篩選條件放 ON 還是 WHERE 還是 HAVING？**
- \`order_date >= '2025-07-01'\` 和 \`status = 'completed'\` → 放 \`JOIN ... ON\`（篩選 JOIN 前的訂單）
- \`COUNT >= 3\` 和 \`MAX(order_date) >= ...\` → 聚合後的條件 → 放 \`HAVING\`

**常見扣分點：**
- 把 \`MAX(order_date) >= ...\` 放在 WHERE（此時還沒 GROUP BY，MAX 不能用）
- \`days_since_last\` 算成 90 - 天數（概念搞反）
- 忘了 CAST 成整數，julianday 相減得到浮點數

**追問方向：**
- 「如果我要加上這些人的 lifetime value（LTV），你會怎麼延伸這個查詢？」`,
          negatives: [
            `SELECT c.customer_id, c.name, c.email, c.membership_tier, COUNT(o.order_id) AS order_count, MAX(o.order_date) AS last_order_date, CAST(julianday('2026-06-30') - julianday(MAX(o.order_date)) AS INT) AS days_since_last FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' AND o.order_date >= '2025-07-01' GROUP BY c.customer_id, c.name, c.email, c.membership_tier HAVING COUNT(o.order_id) >= 5 AND MAX(o.order_date) >= date('2026-06-30', '-90 days') ORDER BY days_since_last ASC;`,
            `SELECT c.customer_id, c.name, c.email, c.membership_tier, COUNT(o.order_id) AS order_count, MAX(o.order_date) AS last_order_date, CAST(julianday('2026-06-30') - julianday(MAX(o.order_date)) AS INT) AS days_since_last FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' AND o.order_date >= '2025-07-01' GROUP BY c.customer_id, c.name, c.email, c.membership_tier HAVING COUNT(o.order_id) >= 3 ORDER BY days_since_last ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u02.l01.e04',
          title: '廣告活動 ROAS 分析',
          difficulty: 3,
          scenario: '這是行銷科技團隊的面試題。請計算 2025 年第四季（10–12 月）各廣告活動的 ROAS，並保留沒有歸因訂單的活動。',
          prompt: `計算 **2025-10 ~ 2025-12** 各廣告活動的 ROAS。

**歸因邏輯：**
- \`sessions.campaign_id\` → 找到活動帶來的 session
- session 的 \`customer_id\` 不為 NULL
- 同期間（2025-10-01 ~ 2025-12-31）有 \`completed\` 訂單的顧客，訂單計入該活動的 \`attributed_revenue\`

**要求：**
- \`total_cost\`：\`ad_spend\` 該期間的花費加總（ROUND 整數）
- \`attributed_revenue\`：歸因訂單 \`total_amount\` 加總（ROUND 整數），沒有歸因則顯示 NULL
- \`roas\`：attributed_revenue / total_cost，ROUND 2 位小數；沒有歸因顯示 NULL
- 用 NULLIF 防止除以零
- **保留**沒有歸因訂單的活動

**回傳欄位：** \`campaign_name\`, \`platform\`, \`total_cost\`, \`attributed_revenue\`, \`roas\`

**排序：** \`roas DESC NULLS LAST\``,
          starter: '',
          answer: `WITH spend AS (
  SELECT
    c.campaign_id,
    c.campaign_name,
    c.platform,
    ROUND(SUM(a.cost)) AS total_cost
  FROM campaigns c
  JOIN ad_spend a ON a.campaign_id = c.campaign_id
  WHERE a.spend_date >= '2025-10-01'
    AND a.spend_date <  '2026-01-01'
  GROUP BY c.campaign_id, c.campaign_name, c.platform
),
attributed AS (
  SELECT
    s.campaign_id,
    ROUND(SUM(o.total_amount)) AS attributed_revenue
  FROM sessions s
  JOIN orders o ON o.customer_id = s.customer_id
  WHERE s.session_start >= '2025-10-01'
    AND s.session_start <  '2026-01-01'
    AND o.order_date    >= '2025-10-01'
    AND o.order_date    <  '2026-01-01'
    AND o.status        = 'completed'
    AND s.customer_id   IS NOT NULL
    AND s.campaign_id   IS NOT NULL
  GROUP BY s.campaign_id
)
SELECT
  sp.campaign_name,
  sp.platform,
  sp.total_cost,
  at.attributed_revenue,
  ROUND(at.attributed_revenue * 1.0 / NULLIF(sp.total_cost, 0), 2) AS roas
FROM spend sp
LEFT JOIN attributed at ON at.campaign_id = sp.campaign_id
ORDER BY roas DESC NULLS LAST;`,
          hints: [],
          explanation: `**兩個 CTE 分開計算的原因：**
花費（ad_spend）和歸因訂單（sessions → orders）是兩條不同的資料路徑，直接一次 JOIN 會產生笛卡爾積。分開算再 LEFT JOIN 是標準做法。

**LEFT JOIN 的必要性：**
用 INNER JOIN 的話，沒有歸因訂單的活動會消失，面試官通常特別強調「要保留所有有花費的活動」。

**常見扣分點：**
- 忘記過濾 \`s.campaign_id IS NOT NULL\`（匿名 session 無法歸因）
- ROAS 分子分母寫反（ROAS = Revenue / Cost，不是 Cost / Revenue）
- 時間條件用 \`BETWEEN\`，但 BETWEEN 在字串日期是 inclusive，要確認邊界

**追問方向：**
- 「這個歸因邏輯有什麼問題？同一個顧客被多個活動的 session 觸達怎麼算？」`,
          negatives: [
            `WITH spend AS (SELECT c.campaign_id, c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost FROM campaigns c JOIN ad_spend a ON a.campaign_id = c.campaign_id WHERE a.spend_date >= '2025-10-01' AND a.spend_date < '2026-01-01' GROUP BY c.campaign_id, c.campaign_name, c.platform), attributed AS (SELECT s.campaign_id, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id WHERE s.session_start >= '2025-10-01' AND s.session_start < '2026-01-01' AND o.order_date >= '2025-10-01' AND o.order_date < '2026-01-01' AND o.status = 'completed' AND s.customer_id IS NOT NULL AND s.campaign_id IS NOT NULL GROUP BY s.campaign_id) SELECT sp.campaign_name, sp.platform, sp.total_cost, at.attributed_revenue, ROUND(sp.total_cost * 1.0 / NULLIF(at.attributed_revenue, 0), 2) AS roas FROM spend sp LEFT JOIN attributed at ON at.campaign_id = sp.campaign_id ORDER BY roas DESC NULLS LAST;`,
            `WITH spend AS (SELECT c.campaign_id, c.campaign_name, c.platform, ROUND(SUM(a.cost)) AS total_cost FROM campaigns c JOIN ad_spend a ON a.campaign_id = c.campaign_id WHERE a.spend_date >= '2025-10-01' AND a.spend_date < '2026-01-01' GROUP BY c.campaign_id, c.campaign_name, c.platform), attributed AS (SELECT s.campaign_id, ROUND(SUM(o.total_amount)) AS attributed_revenue FROM sessions s JOIN orders o ON o.customer_id = s.customer_id WHERE s.session_start >= '2025-10-01' AND s.session_start < '2026-01-01' AND o.order_date >= '2025-10-01' AND o.order_date < '2026-01-01' AND o.status = 'completed' AND s.customer_id IS NOT NULL AND s.campaign_id IS NOT NULL GROUP BY s.campaign_id) SELECT sp.campaign_name, sp.platform, sp.total_cost, at.attributed_revenue, ROUND(sp.total_cost * 1.0 / NULLIF(at.attributed_revenue, 0), 2) AS roas FROM spend sp LEFT JOIN attributed at ON at.campaign_id = sp.campaign_id ORDER BY roas DESC NULLS LAST;`,
          ],
          ordered: true,
        },
        {
          id: 'int.u02.l01.e05',
          title: '購買保溫杯的人中，同時也買了馬克杯的占比',
          difficulty: 3,
          scenario: '面試官說：「我想知道買過保溫杯的顧客裡，有多少比例也買過馬克杯？這種分析我們叫 co-purchase analysis。請算出這個比例。」',
          prompt: `計算**買過\`保溫杯\`的顧客**中，同時也購買過**\`馬克杯\`**的人數與占比。

**要求：**
- 只計算 \`status = 'completed'\` 的訂單
- \`buyers_of_a\`：購買過保溫杯的不重複顧客數
- \`also_bought_b\`：在購買過保溫杯的人中，也購買過馬克杯的不重複顧客數
- \`copurchase_pct\`：also_bought_b / buyers_of_a × 100，ROUND 1 位小數

**回傳欄位：** \`buyers_of_a\`, \`also_bought_b\`, \`copurchase_pct\``,
          starter: '',
          answer: `WITH buyers_a AS (
  SELECT DISTINCT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id  = o.order_id
  JOIN products   p  ON p.product_id  = oi.product_id
  WHERE o.status    = 'completed'
    AND p.category  = '保溫杯'
),
also_b AS (
  SELECT DISTINCT ba.customer_id
  FROM buyers_a ba
  JOIN orders      o  ON o.customer_id = ba.customer_id AND o.status = 'completed'
  JOIN order_items oi ON oi.order_id   = o.order_id
  JOIN products    p  ON p.product_id  = oi.product_id AND p.category = '馬克杯'
)
SELECT
  (SELECT COUNT(*) FROM buyers_a)                                        AS buyers_of_a,
  (SELECT COUNT(*) FROM also_b)                                          AS also_bought_b,
  ROUND((SELECT COUNT(*) FROM also_b) * 100.0
        / NULLIF((SELECT COUNT(*) FROM buyers_a), 0), 1)                AS copurchase_pct;`,
          hints: [],
          explanation: `**分子 / 分母定義要先說清楚：**
- 分母：買過保溫杯的不重複顧客（buyers_a）
- 分子：在 buyers_a 中，也買過馬克杯的不重複顧客

**常見扣分點：**
- 分母用全部顧客，而不是「買過保溫杯的人」
- 沒有 DISTINCT，同一顧客買了 3 次保溫杯算 3 個人
- JOIN 方向錯誤：should be FROM buyers_a → JOIN 馬克杯訂單，而不是反過來

**追問方向：**
- 「如果想反過來算，買馬克杯的人中有多少也買了保溫杯，SQL 要怎麼改？」
- 「這個指標在業務上的應用是什麼？」（→ 捆綁促銷、推薦系統的基礎）`,
          negatives: [
            `WITH buyers_a AS (SELECT DISTINCT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' AND p.category = '保溫杯'), also_b AS (SELECT DISTINCT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' AND p.category = '馬克杯') SELECT (SELECT COUNT(*) FROM buyers_a) AS buyers_of_a, (SELECT COUNT(*) FROM also_b) AS also_bought_b, ROUND((SELECT COUNT(*) FROM also_b) * 100.0 / NULLIF((SELECT COUNT(*) FROM buyers_a), 0), 1) AS copurchase_pct;`,
            `WITH buyers_a AS (SELECT DISTINCT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' AND p.category = '保溫杯'), also_b AS (SELECT DISTINCT ba.customer_id FROM buyers_a ba JOIN orders o ON o.customer_id = ba.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id AND p.category = '馬克杯') SELECT (SELECT COUNT(*) FROM buyers_a) AS buyers_of_a, (SELECT COUNT(*) FROM also_b) AS also_bought_b, ROUND((SELECT COUNT(*) FROM also_b) * 100.0 / (SELECT COUNT(*) FROM (SELECT DISTINCT customer_id FROM orders WHERE status = 'completed')), 1) AS copurchase_pct;`,
          ],
        },
      ],
    },
  ],
};
