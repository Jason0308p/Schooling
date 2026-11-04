const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'pm-u04',
  title: 'A/B Test 數據分析',
  lessons: [
    {
      id: 'pm-u04-l01',
      title: '計算 A/B Test 基礎指標',
      minutes: 30,
      objectives: [
        '理解 A/B Test 中 control 與 treatment 的意義',
        '計算各組的樣本數、轉換率、每用戶平均收入（ARPU）',
        '計算 treatment 相對 control 的提升幅度（relative lift）',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'pm.u04.l01.e01',
          title: '計算各實驗的 control vs treatment 轉換率',
          difficulty: 2,
          ordered: true,
          scenario: '你跑了三個 A/B Test，需要向 PM Lead 報告每個實驗的基礎指標。',
          prompt: `對 \`ab_tests\` 表中的每個實驗（\`test_name\`），計算 **control** 和 **treatment** 各自的：
- 樣本數（\`n\`）
- 轉換率（\`cvr_pct\`，保留兩位小數）

**回傳欄位：** \`test_name\`、\`variant\`、\`n\`、\`cvr_pct\`

**排序：** \`test_name ASC\`，同一實驗內 \`variant ASC\`（control 排前）`,
          starter: '',
          answer: `SELECT
  test_name,
  variant,
  COUNT(*)                                  AS n,
  ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS cvr_pct
FROM ab_tests
GROUP BY test_name, variant
ORDER BY test_name, variant;`,
          hints: [
            'GROUP BY test_name, variant 分組',
            '轉換率 = SUM(converted) / COUNT(*) × 100',
          ],
          explanation: `先核對預先設計的分流比例，再以適當的樣本比例失配檢定（SRM）與預設顯著水準檢查觀察人數是否異常；差距大小取決於樣本量，且實驗不一定設計為 50/50，不能以固定 10% 當異常門檻。CVR 差異須連同不確定性解讀。`,
          negatives: [
            `SELECT variant, COUNT(*) AS users, SUM(converted) AS conversions, ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS conversion_rate FROM ab_tests GROUP BY variant ORDER BY variant`,
          ],
        },
        {
          id: 'pm.u04.l01.e02',
          title: '計算 Relative Lift（相對提升幅度）',
          difficulty: 3,
          ordered: true,
          scenario: '老闆問：「treatment 組比 control 組好多少？」你需要計算 relative lift 來回答。',
          prompt: `對每個實驗，計算 treatment 相對於 control 的**轉換率相對提升幅度（relative lift）**。

Relative Lift = (treatment CVR - control CVR) / control CVR × 100

**步驟建議：**
1. 先用 CTE 算出每個（test_name, variant）的 CVR
2. 用 CASE 或 JOIN 把 control 和 treatment 分成兩欄
3. 計算 relative lift

**回傳欄位：** \`test_name\`、\`control_cvr\`、\`treatment_cvr\`、\`relative_lift_pct\`（保留一位小數）

**排序：** \`relative_lift_pct DESC\`
上述排序同分依 test_name ASC。`,
          starter: '',
          answer: `WITH cvr AS (
  SELECT
    test_name,
    variant,
    SUM(converted) * 100.0 / COUNT(*) AS cvr
  FROM ab_tests
  GROUP BY test_name, variant
)
SELECT
  ctrl.test_name,
  ROUND(ctrl.cvr, 2)                                      AS control_cvr,
  ROUND(trt.cvr, 2)                                       AS treatment_cvr,
  ROUND((trt.cvr - ctrl.cvr) / NULLIF(ctrl.cvr, 0) * 100, 1)        AS relative_lift_pct
FROM cvr ctrl
JOIN cvr trt ON trt.test_name = ctrl.test_name AND trt.variant = 'treatment'
WHERE ctrl.variant = 'control'
ORDER BY relative_lift_pct DESC, ctrl.test_name ASC;`,
          hints: [
            '先用 CTE 算出各（test, variant）的 CVR',
            '在外層 JOIN 同一個 CTE，分別取 control 和 treatment 的 CVR',
            'Relative Lift = (T - C) / C × 100',
          ],
          explanation: `相對 lift = (T-C)/C，正負方向不可顛倒；絕對 lift 使用百分點。兩者都應呈現並說明不確定性，不應挑較大的數字誤導。control CVR 為 0 時相對 lift 回傳 NULL。`,
          negatives: [
            `WITH cvr AS (
  SELECT
    test_name,
    variant,
    SUM(converted) * 100.0 / COUNT(*) AS cvr
  FROM ab_tests
  GROUP BY test_name, variant
)
SELECT
  ctrl.test_name,
  ROUND(ctrl.cvr, 2)                                      AS control_cvr,
  ROUND(trt.cvr, 2)                                       AS treatment_cvr,
  ROUND((ctrl.cvr - trt.cvr) / NULLIF(ctrl.cvr, 0) * 100, 1)        AS relative_lift_pct
FROM cvr ctrl
JOIN cvr trt ON trt.test_name = ctrl.test_name AND trt.variant = 'treatment'
WHERE ctrl.variant = 'control'
ORDER BY relative_lift_pct DESC;`,
          ],
        },
        {
          id: 'pm.u04.l01.e03',
          title: '計算各實驗的每用戶平均收入（ARPU）',
          difficulty: 2,
          ordered: true,
          scenario: '轉換率只是一部分，你還需要知道 treatment 組帶來的收入是否更高。',
          prompt: `計算每個實驗、每個 variant 的**每用戶平均收入（ARPU）**。

ARPU = 總收入 ÷ 總用戶數（含未轉換的）

**回傳欄位：** \`test_name\`、\`variant\`、\`total_revenue\`（保留兩位小數）、\`n\`、\`arpu\`（保留兩位小數）

**排序：** \`test_name ASC\`，同一實驗內 \`variant ASC\``,
          starter: '',
          answer: `SELECT
  test_name,
  variant,
  ROUND(SUM(revenue), 2)              AS total_revenue,
  COUNT(*)                            AS n,
  ROUND(SUM(revenue) / COUNT(*), 2)  AS arpu
FROM ab_tests
GROUP BY test_name, variant
ORDER BY test_name, variant;`,
          hints: [
            'revenue 欄位在未轉換時為 0，所以 SUM(revenue) / COUNT(*) 就是 ARPU',
            '不需要過濾 converted = 1，ARPU 的分母是全部用戶',
          ],
          explanation: `**為什麼要看 ARPU？** 有時候 treatment 轉換率較高，但每次轉換金額較低，整體 ARPU 不一定更好。需要同時看轉換率和 ARPU 才能判斷實驗是否真的更好。`,
          negatives: [
            `SELECT test_name, variant, ROUND(SUM(revenue), 2) AS total_revenue, ROUND(AVG(revenue), 2) AS avg_revenue_per_user FROM ab_tests GROUP BY test_name, variant ORDER BY test_name, variant`,
          ],
        },
      ],
    },
    {
      id: 'pm-u04-l02',
      title: '判斷統計顯著性（用 SQL 近似計算）',
      minutes: 35,
      objectives: [
        '理解為什麼 A/B Test 需要統計顯著性',
        '用 SQL 計算 Z-score 來評估顯著性',
        '判斷實驗結果是否達到 雙尾 α=0.05 顯著水準（ABS(z) > 1.96）',
      ],
      body: md('./l02.md'),
      exercises: [
        {
          id: 'pm.u04.l02.e01',
          title: '計算各實驗的 Z-score',
          difficulty: 3,
          ordered: true,
          scenario: '你的實驗 lift 看起來不錯，但你需要確認是否達到統計顯著性，才能向 PM 說「這個結果可信」。',
          prompt: `對每個實驗計算轉換率差異的 **Z-score**，用來判斷統計顯著性。

**公式：**
\`\`\`
p1 = control CVR（0–1 的小數）
p2 = treatment CVR（0–1 的小數）
n1 = control 樣本數
n2 = treatment 樣本數
p_pool = (control 轉換數 + treatment 轉換數) / (n1 + n2)
se = sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
z_score = (p2 - p1) / se
\`\`\`

SQLite 的 SQRT(x) 與 POWER(x, 0.5) 都屬數學函數，內建來源需 SQLITE_ENABLE_MATH_FUNCTIONS 編譯選項啟用；未啟用時 POWER 並非保證可用的替代。本課隨附 sql.js 實跑 SQRT(0.09) 與 POWER(0.09,0.5) 都回傳 0.3，但 sqlite_compileoption_used('ENABLE_MATH_FUNCTIONS') 回傳 0；不能只憑該旗標推斷自訂建置或擴充函數的可用性，仍以實際探測為準。官方依據：https://sqlite.org/lang_mathfunc.html 。

**回傳欄位：** \`test_name\`、\`z_score\`（保留兩位小數）、\`is_significant\`（ABS(未四捨五入 z_score) > 1.96 時為 1，否則為 0）

**排序：** \`z_score DESC\`

這是雙尾 α=0.05 的常態近似：ABS(z)>1.96 判顯著，z<0 是 treatment 較差，顯著不等於值得推廣。以未四捨五入 z 判斷。標準誤為 0 時 z_score 為 NULL 且 is_significant=0；樣本不足應另行評估，不能逕稱無差異。
上述排序同分依 test_name ASC。`,
          starter: '',
          answer: `WITH stats AS (
  SELECT
    test_name,
    SUM(CASE WHEN variant = 'control'   THEN converted ELSE 0 END) AS conv_c,
    SUM(CASE WHEN variant = 'treatment' THEN converted ELSE 0 END) AS conv_t,
    SUM(CASE WHEN variant = 'control'   THEN 1 ELSE 0 END)         AS n_c,
    SUM(CASE WHEN variant = 'treatment' THEN 1 ELSE 0 END)         AS n_t
  FROM ab_tests
  GROUP BY test_name
),
z AS (
  SELECT
    test_name,
    conv_c * 1.0 / n_c                             AS p1,
    conv_t * 1.0 / n_t                             AS p2,
    (conv_c + conv_t) * 1.0 / (n_c + n_t)         AS p_pool,
    n_c, n_t
  FROM stats
)
SELECT
  test_name,
  ROUND(
    (p2 - p1) / POWER(p_pool * (1 - p_pool) * (1.0/n_c + 1.0/n_t), 0.5)
  , 2) AS z_score,
  CASE WHEN ABS((p2 - p1) / POWER(p_pool * (1 - p_pool) * (1.0/n_c + 1.0/n_t), 0.5)) > 1.96
       THEN 1 ELSE 0 END AS is_significant
FROM z
ORDER BY z_score DESC, test_name ASC;`,
          hints: [
            '先用 CTE 算出 conv_c、conv_t、n_c、n_t，再計算 p_pool 和 se',
            'SQLite 的 SQRT(x) 與 POWER(x, 0.5) 都屬數學函數，內建來源需 SQLITE_ENABLE_MATH_FUNCTIONS 編譯選項啟用；未啟用時 POWER 並非保證可用的替代。本課隨附 sql.js 實跑 SQRT(0.09) 與 POWER(0.09,0.5) 都回傳 0.3，但 sqlite_compileoption_used(\'ENABLE_MATH_FUNCTIONS\') 回傳 0；不能只憑該旗標推斷自訂建置或擴充函數的可用性，仍以實際探測為準。官方依據：https://sqlite.org/lang_mathfunc.html 。',
            'p_pool = 兩組合計轉換數 / 兩組合計樣本數',
          ],
          explanation: `雙尾檢定使用 ABS(未四捨五入 z)>1.96，包含顯著負向差異。z 或 lift 的正負決定方向，不能把 is_significant=1 解讀為勝出。p 值是在虛無假設成立時觀察到同樣或更極端資料的機率，不是虛無假設為真的機率。避免未規劃的反覆偷看，檢查常態近似、SRM、多重檢定及護欄。即使顯著正 lift，仍需商業效益及風險審查。SQLite 的 SQRT(x) 與 POWER(x, 0.5) 都屬數學函數，內建來源需 SQLITE_ENABLE_MATH_FUNCTIONS 編譯選項啟用；未啟用時 POWER 並非保證可用的替代。本課隨附 sql.js 實跑 SQRT(0.09) 與 POWER(0.09,0.5) 都回傳 0.3，但 sqlite_compileoption_used('ENABLE_MATH_FUNCTIONS') 回傳 0；不能只憑該旗標推斷自訂建置或擴充函數的可用性，仍以實際探測為準。官方依據：https://sqlite.org/lang_mathfunc.html 。`,
          negatives: [
            `WITH stats AS (
  SELECT
    test_name,
    SUM(CASE WHEN variant = 'control'   THEN converted ELSE 0 END) AS conv_c,
    SUM(CASE WHEN variant = 'treatment' THEN converted ELSE 0 END) AS conv_t,
    SUM(CASE WHEN variant = 'control'   THEN 1 ELSE 0 END)         AS n_c,
    SUM(CASE WHEN variant = 'treatment' THEN 1 ELSE 0 END)         AS n_t
  FROM ab_tests
  GROUP BY test_name
),
z AS (
  SELECT
    test_name,
    conv_c * 1.0 / n_c                             AS p1,
    conv_t * 1.0 / n_t                             AS p2,
    (conv_c + conv_t) * 1.0 / (n_c + n_t)         AS p_pool,
    n_c, n_t
  FROM stats
)
SELECT
  test_name,
  ROUND(
    (p2 - p1) / POWER(p_pool * (1 - p_pool) * (1.0/n_c + 1.0/n_t), 0.5)
  , 2) AS z_score,
  CASE WHEN ABS((p2 - p1) / POWER(p_pool * (1 - p_pool) * (1.0/n_c + 1.0/n_t), 0.5)) > 0.1
       THEN 1 ELSE 0 END AS is_significant
FROM z
ORDER BY z_score DESC;`,
          ],
        },
        {
          id: 'pm.u04.l02.e02',
          title: '完整 A/B Test 報告（一張表呈現所有指標）',
          difficulty: 3,
          ordered: true,
          scenario: '你需要製作一份 A/B Test 完整報告，讓 PM Lead 在 10 秒內判斷哪些實驗值得推廣。',
          prompt: `對每個實驗，在同一列呈現以下指標：
- \`control_n\`、\`treatment_n\`（兩組樣本數）
- \`control_cvr\`、\`treatment_cvr\`（兩組轉換率 %，保留兩位小數）
- \`relative_lift_pct\`（相對提升 %，保留一位小數）
- \`control_arpu\`、\`treatment_arpu\`（兩組 ARPU，保留兩位小數）
- \`z_score\`（保留兩位小數）
- \`is_significant\`（ABS(未四捨五入 z) > 1.96 為 1）

**排序：** \`relative_lift_pct DESC\`

這是雙尾 α=0.05 的常態近似：ABS(z)>1.96 判顯著，z<0 是 treatment 較差，顯著不等於值得推廣。以未四捨五入 z 判斷。標準誤為 0 時 z_score 為 NULL 且 is_significant=0；樣本不足應另行評估，不能逕稱無差異。
上述排序同分依 test_name ASC。`,
          starter: '',
          answer: `WITH base AS (
  SELECT
    test_name,
    SUM(CASE WHEN variant='control'   THEN 1       ELSE 0 END) AS n_c,
    SUM(CASE WHEN variant='treatment' THEN 1       ELSE 0 END) AS n_t,
    SUM(CASE WHEN variant='control'   THEN converted ELSE 0 END) AS conv_c,
    SUM(CASE WHEN variant='treatment' THEN converted ELSE 0 END) AS conv_t,
    SUM(CASE WHEN variant='control'   THEN revenue ELSE 0 END) AS rev_c,
    SUM(CASE WHEN variant='treatment' THEN revenue ELSE 0 END) AS rev_t
  FROM ab_tests
  GROUP BY test_name
),
calcs AS (
  SELECT
    test_name,
    n_c, n_t,
    conv_c * 1.0 / n_c AS p_c,
    conv_t * 1.0 / n_t AS p_t,
    (conv_c + conv_t) * 1.0 / (n_c + n_t) AS p_pool,
    rev_c * 1.0 / n_c AS arpu_c,
    rev_t * 1.0 / n_t AS arpu_t
  FROM base
)
SELECT
  test_name,
  n_c                                    AS control_n,
  n_t                                    AS treatment_n,
  ROUND(p_c * 100, 2)                    AS control_cvr,
  ROUND(p_t * 100, 2)                    AS treatment_cvr,
  ROUND((p_t - p_c) / NULLIF(p_c, 0) * 100, 1)     AS relative_lift_pct,
  ROUND(arpu_c, 2)                       AS control_arpu,
  ROUND(arpu_t, 2)                       AS treatment_arpu,
  ROUND(
    (p_t - p_c) / POWER(p_pool*(1-p_pool)*(1.0/n_c+1.0/n_t), 0.5)
  , 2)                                   AS z_score,
  CASE WHEN ABS((p_t - p_c) / POWER(p_pool*(1-p_pool)*(1.0/n_c+1.0/n_t), 0.5)) > 1.96
       THEN 1 ELSE 0 END                 AS is_significant
FROM calcs
ORDER BY relative_lift_pct DESC, test_name ASC;`,
          hints: [
            '把所有需要的數字都在第一個 CTE 算好（n, conv, rev 分 control/treatment）',
            '第二個 CTE 計算比率（p_c, p_t, p_pool, arpu）',
            '最外層做格式化和 Z-score 計算',
          ],
          explanation: `雙尾檢定使用 ABS(未四捨五入 z)>1.96，包含顯著負向差異。z 或 lift 的正負決定方向，不能把 is_significant=1 解讀為勝出。p 值是在虛無假設成立時觀察到同樣或更極端資料的機率，不是虛無假設為真的機率。避免未規劃的反覆偷看，檢查常態近似、SRM、多重檢定及護欄。即使顯著正 lift，仍需商業效益及風險審查。SQLite 的 SQRT(x) 與 POWER(x, 0.5) 都屬數學函數，內建來源需 SQLITE_ENABLE_MATH_FUNCTIONS 編譯選項啟用；未啟用時 POWER 並非保證可用的替代。本課隨附 sql.js 實跑 SQRT(0.09) 與 POWER(0.09,0.5) 都回傳 0.3，但 sqlite_compileoption_used('ENABLE_MATH_FUNCTIONS') 回傳 0；不能只憑該旗標推斷自訂建置或擴充函數的可用性，仍以實際探測為準。官方依據：https://sqlite.org/lang_mathfunc.html 。`,
          negatives: [
            `WITH base AS (
  SELECT
    test_name,
    SUM(CASE WHEN variant='control'   THEN 1       ELSE 0 END) AS n_c,
    SUM(CASE WHEN variant='treatment' THEN 1       ELSE 0 END) AS n_t,
    SUM(CASE WHEN variant='control'   THEN converted ELSE 0 END) AS conv_c,
    SUM(CASE WHEN variant='treatment' THEN converted ELSE 0 END) AS conv_t,
    SUM(CASE WHEN variant='control'   THEN revenue ELSE 0 END) AS rev_c,
    SUM(CASE WHEN variant='treatment' THEN revenue ELSE 0 END) AS rev_t
  FROM ab_tests
  GROUP BY test_name
),
calcs AS (
  SELECT
    test_name,
    n_c, n_t,
    conv_c * 1.0 / n_c AS p_c,
    conv_t * 1.0 / n_t AS p_t,
    (conv_c + conv_t) * 1.0 / (n_c + n_t) AS p_pool,
    rev_c * 1.0 / n_c AS arpu_c,
    rev_t * 1.0 / n_t AS arpu_t
  FROM base
)
SELECT
  test_name,
  n_c                                    AS control_n,
  n_t                                    AS treatment_n,
  ROUND(p_c * 100, 2)                    AS control_cvr,
  ROUND(p_t * 100, 2)                    AS treatment_cvr,
  ROUND((p_t - p_c) / p_c * 100, 1)     AS relative_lift_pct,
  ROUND(arpu_c, 2)                       AS control_arpu,
  ROUND(arpu_t, 2)                       AS treatment_arpu,
  ROUND(
    (p_t - p_c) / POWER(p_pool*(1-p_pool)*(1.0/n_c+1.0/n_t), 0.5)
  , 2)                                   AS z_score,
  CASE WHEN ABS((p_t - p_c) / POWER(p_pool*(1-p_pool)*(1.0/n_c+1.0/n_t), 0.5)) > 0.1
       THEN 1 ELSE 0 END                 AS is_significant
FROM calcs
ORDER BY relative_lift_pct DESC;`,
          ],
        },
        {
          id: 'pm.u04.l02.e03',
          title: '找出各實驗的高價值轉換用戶特徵',
          difficulty: 3,
          ordered: true,
          scenario: '你想了解 treatment 組中，哪種方案的用戶轉換後貢獻的收入最高，來優化下一次實驗的目標受眾。',
          prompt: `對 **treatment 組且 converted = 1** 的用戶，計算每個實驗中，各 \`plan\`（需要 JOIN \`users\`）的：
- 轉換用戶數（\`converted_users\`）
- 平均收入（\`avg_revenue\`，保留兩位小數）

**回傳欄位：** \`test_name\`、\`plan\`、\`converted_users\`、\`avg_revenue\`

**排序：** \`test_name ASC\`，再 \`avg_revenue DESC\`
上述排序同分依 plan ASC。`,
          starter: '',
          answer: `SELECT
  ab.test_name,
  u.plan,
  COUNT(*)                      AS converted_users,
  ROUND(AVG(ab.revenue), 2)    AS avg_revenue
FROM ab_tests ab
JOIN users u ON u.user_id = ab.user_id
WHERE ab.variant = 'treatment'
  AND ab.converted = 1
GROUP BY ab.test_name, u.plan
ORDER BY ab.test_name, avg_revenue DESC, u.plan ASC;`,
          hints: [
            'WHERE variant = \'treatment\' AND converted = 1 篩選目標用戶',
            'JOIN users 取得 plan 欄位',
            'AVG(revenue) 計算平均轉換收入',
          ],
          explanation: `只呈現已轉換 treatment 用戶的收入組成，排除未轉換者會有選擇偏差。不是全體 ARPU、增量效益或 ROI 證據，不能直接據此決定下一次只投 enterprise。`,
          negatives: [
            `SELECT ab.test_name, u.plan, COUNT(*) AS converted_users, ROUND(AVG(ab.revenue),2) AS avg_revenue FROM ab_tests ab JOIN users u ON u.user_id=ab.user_id WHERE ab.converted=1 GROUP BY ab.test_name, u.plan ORDER BY ab.test_name, avg_revenue DESC;`,
          ],
        },
      ],
    },
  ],
};
