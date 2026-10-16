const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'gh-u05',
  title: 'Referral：A/B Test 分析',
  lessons: [
    {
      id: 'gh-u05-l01',
      title: 'A/B Test 結果分析與 Viral Coefficient',
      minutes: 25,
      objectives: [
        '計算各 A/B Test 實驗組的轉換率與 Lift',
        '從收入角度評估 Treatment 的 ARPU 提升',
        '理解 Viral Coefficient（K factor）概念',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'gh.u05.l01.e01',
          title: 'A/B Test 轉換率比較',
          difficulty: 2,
          scenario: '產品團隊跑了三個 A/B 實驗，你需要一次比較所有實驗的 Control vs Treatment 轉換率。',
          prompt: `計算所有 A/B 測試實驗的各組（\`control\` / \`treatment\`）的：
- 用戶數
- 轉換數
- 轉換率（CVR）

**回傳欄位：** \`test_name\`、\`variant\`、\`users\`、\`conversions\`、\`cvr_pct\`（保留兩位小數）

**排序：** \`test_name ASC\`，\`variant ASC\``,
          answer: `SELECT
  test_name,
  variant,
  COUNT(*)                                       AS users,
  SUM(converted)                                 AS conversions,
  ROUND(SUM(converted) * 100.0 / COUNT(*), 2)   AS cvr_pct
FROM ab_tests
GROUP BY test_name, variant
ORDER BY test_name, variant;`,
          hints: [
            'SUM(converted) 計算轉換數（converted 是 0/1 整數）',
            'GROUP BY test_name, variant 得到每個實驗組的統計',
          ],
          explanation: `A/B Test 的第一步永遠是確認**樣本數夠大**再看 CVR 差異。

若 control 和 treatment 的用戶數差很多（不是 50/50），要先確認分配邏輯是否有 bug，否則 CVR 比較沒有意義。`,
          negatives: [
            `SELECT test_name, variant, COUNT(*) AS users, SUM(converted) AS conversions, ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS cvr_pct FROM ab_tests GROUP BY test_name, variant ORDER BY test_name DESC, variant ASC;`,
          ],
          ordered: true,
        },
        {
          id: 'gh.u05.l01.e02',
          title: '計算各實驗的相對 Lift',
          difficulty: 3,
          scenario: '你要向 CEO 報告三個 A/B Test 的結果，需要計算每個實驗 Treatment 相對 Control 的 CVR 相對提升幅度。',
          prompt: `計算每個實驗的 **CVR Lift**：

- \`control_cvr_pct\`：control 組的轉換率
- \`treatment_cvr_pct\`：treatment 組的轉換率  
- \`absolute_lift_pct\`：treatment - control（百分點差）
- \`relative_lift_pct\`：(treatment - control) / control × 100（相對提升 %）

**回傳欄位：** \`test_name\`、\`control_cvr_pct\`、\`treatment_cvr_pct\`、\`absolute_lift_pct\`、\`relative_lift_pct\`（均保留兩位小數）

**排序：** \`relative_lift_pct DESC\``,
          answer: `WITH stats AS (
  SELECT
    test_name,
    variant,
    COUNT(*)                                     AS n,
    ROUND(SUM(converted) * 100.0 / COUNT(*), 4) AS cvr
  FROM ab_tests
  GROUP BY test_name, variant
)
SELECT
  c.test_name,
  ROUND(c.cvr, 2)                                     AS control_cvr_pct,
  ROUND(t.cvr, 2)                                     AS treatment_cvr_pct,
  ROUND(t.cvr - c.cvr, 2)                             AS absolute_lift_pct,
  ROUND((t.cvr - c.cvr) / NULLIF(c.cvr, 0) * 100, 2) AS relative_lift_pct
FROM stats c
JOIN stats t
  ON  t.test_name = c.test_name
  AND t.variant   = 'treatment'
WHERE c.variant = 'control'
ORDER BY relative_lift_pct DESC;`,
          hints: [
            'CTE 先算每個 test_name + variant 的 CVR',
            'Self-join：c 是 control 那列，t 是 treatment 那列',
            'NULLIF(c.cvr, 0) 避免除以零',
          ],
          explanation: `**Relative Lift** 比 Absolute Lift 更直觀：「提升了 20%」比「提升了 0.02 個百分點」更有溝通價值。

但注意：高 relative lift 不等於高業務價值——如果 base CVR 只有 1%，提升 50% 也只是 1.5%。要結合**樣本數**和**收入 Lift** 一起評估。`,
          negatives: [
            `WITH stats AS (SELECT test_name, variant, COUNT(*) AS n, ROUND(SUM(converted)*100.0/COUNT(*),4) AS cvr FROM ab_tests GROUP BY test_name, variant) SELECT c.test_name, ROUND(c.cvr, 2) AS control_cvr_pct, ROUND(t.cvr, 2) AS treatment_cvr_pct, ROUND(c.cvr - t.cvr, 2) AS absolute_lift_pct, ROUND((c.cvr - t.cvr) / NULLIF(t.cvr, 0) * 100, 2) AS relative_lift_pct FROM stats c JOIN stats t ON t.test_name = c.test_name AND t.variant = 'treatment' WHERE c.variant = 'control' ORDER BY relative_lift_pct DESC;`,
          ],
          ordered: true,
        },
        {
          id: 'gh.u05.l01.e03',
          title: 'Revenue Lift：哪個實驗帶來最多收入提升？',
          difficulty: 3,
          scenario: '除了轉換率，你還需要評估每個實驗帶來的 ARPU Lift——因為 Treatment 可能轉換率高但每筆收入低，導致總收入不如預期。',
          prompt: `計算每個 A/B 測試的 **ARPU Lift**（以每位實驗參與者計算，包含未轉換的）。

- \`control_arpu\`：control 組的 avg(revenue)（包含 revenue=0 的用戶）
- \`treatment_arpu\`：treatment 組的 avg(revenue)
- \`arpu_lift\`：treatment_arpu - control_arpu
- \`arpu_lift_pct\`：arpu_lift / control_arpu × 100（保留一位小數）

**回傳欄位：** \`test_name\`、\`control_arpu\`、\`treatment_arpu\`、\`arpu_lift\`、\`arpu_lift_pct\`

**排序：** \`arpu_lift DESC\``,
          answer: `WITH rev AS (
  SELECT
    test_name,
    variant,
    COUNT(*)               AS n,
    ROUND(AVG(revenue), 4) AS arpu
  FROM ab_tests
  GROUP BY test_name, variant
)
SELECT
  c.test_name,
  ROUND(c.arpu, 2)                                    AS control_arpu,
  ROUND(t.arpu, 2)                                    AS treatment_arpu,
  ROUND(t.arpu - c.arpu, 2)                           AS arpu_lift,
  ROUND((t.arpu - c.arpu) / NULLIF(c.arpu, 0) * 100, 1) AS arpu_lift_pct
FROM rev c
JOIN rev t
  ON  t.test_name = c.test_name
  AND t.variant   = 'treatment'
WHERE c.variant = 'control'
ORDER BY arpu_lift DESC;`,
          hints: [
            'AVG(revenue) 自動包含 revenue=0 的未轉換用戶，這樣才能做公平比較',
            'Self-join 邏輯與前一題相同：c = control，t = treatment',
          ],
          explanation: `**ARPU Lift** 是比 CVR Lift 更貼近業務目標的指標。

若某個實驗 CVR Lift 高但 ARPU Lift 低，代表 Treatment 帶來的轉換雖然多，但每筆金額較小（可能是促銷降價導致的）。

最終決策標準：ARPU Lift × 實驗規模 = 預估增量收入，這才是真正要優化的數字。`,
          negatives: [
            `WITH rev AS (SELECT test_name, variant, COUNT(*) AS n, ROUND(AVG(revenue), 4) AS arpu FROM ab_tests GROUP BY test_name, variant) SELECT c.test_name, ROUND(c.arpu, 2) AS control_arpu, ROUND(t.arpu, 2) AS treatment_arpu, ROUND(t.arpu - c.arpu, 2) AS arpu_lift, ROUND((t.arpu - c.arpu) / NULLIF(c.arpu, 0) * 100, 1) AS arpu_lift_pct FROM rev c JOIN rev t ON t.test_name = c.test_name AND t.variant = 'treatment' WHERE c.variant = 'control' ORDER BY arpu_lift ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
