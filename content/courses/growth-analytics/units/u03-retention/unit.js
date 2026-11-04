export const unit = {
  "id": "gh-u03",
  "title": "Retention：留存分析",
  "lessons": [
    {
      "id": "gh-u03-l01",
      "title": "N-Day 定義與 D7 / D30 容差區間教學",
      "minutes": 25,
      "objectives": [
        "區分精確 N-day 與自訂容差 bracket",
        "用 julianday 計算留存標記",
        "比較各方案（free/pro/enterprise）的 Day 7 和 Day 30 留存率"
      ],
      "body": new URL("./l01.md", import.meta.url).href,
      "exercises": [
        {
          "id": "gh.u03.l01.e01",
          "title": "計算整體 D7 容差區間 留存率",
          "difficulty": 2,
          "scenario": "團隊要比較明確定義的容差區間回訪比例，不套用沒有來源的業界門檻。",
          "prompt": "計算所有用戶的 **Day 7 留存率**。\n\n定義：用戶在 signup_date 後第 **6–8 天**（±1 天容差）有出現在 `daily_active`，視為留存。\n\n**回傳欄位：** `total_users`、`retained_d7`、`d7_retention_pct`（保留兩位小數）\n口徑說明：本題是自訂容差 Bracket，不是精確 N-day；N-day 是恰第 N 日。沿用全體 users 作分母（非下一課固定 cohort）；本資料早期 cohort 可能缺註冊後完整觀察，數字只描述已有紀錄，不可當無偏留存估計。",
          "answer": "SELECT\n  COUNT(DISTINCT u.user_id)                             AS total_users,\n  COUNT(DISTINCT da.user_id)                            AS retained_d7,\n  ROUND(COUNT(DISTINCT da.user_id) * 100.0\n        / COUNT(DISTINCT u.user_id), 2)                 AS d7_retention_pct\nFROM users u\nLEFT JOIN daily_active da\n  ON  da.user_id = u.user_id\n  AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;",
          "hints": [
            "LEFT JOIN 確保沒有留存的用戶也計入分母",
            "julianday(log_date) - julianday(signup_date) BETWEEN 6 AND 8 = Day 7 ±1 天"
          ],
          "explanation": "以每位用戶一次旗標計數、LEFT JOIN 保留未回訪者。D7 的 6–8 日與 D30 的 28–32 日是兩個不同 bracket，不互相包含，D30 可能高於 D7。這不是精確 N-day，不得據此宣稱因果或統計顯著差異。",
          "negatives": [
            "SELECT COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT da.user_id) AS retained_d7, ROUND(COUNT(DISTINCT da.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS d7_retention_pct FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) BETWEEN 6 AND 8;"
          ]
        },
        {
          "id": "gh.u03.l01.e02",
          "title": "同時計算 D7 容差區間 和 D30 容差區間 留存率",
          "difficulty": 3,
          "scenario": "團隊要比較明確定義的容差區間回訪比例，不套用沒有來源的業界門檻。",
          "prompt": "在**同一個查詢**中計算所有用戶的 **Day 7** 和 **Day 30** 留存率。\n\n容差定義：\n- Day 7：第 6–8 天\n- Day 30：第 28–32 天\n\n**回傳欄位：** `total_users`、`d7_pct`、`d30_pct`（百分比，保留兩位小數）\n口徑說明：本題是自訂容差 Bracket，不是精確 N-day；N-day 是恰第 N 日。沿用全體 users 作分母（非下一課固定 cohort）；本資料早期 cohort 可能缺註冊後完整觀察，數字只描述已有紀錄，不可當無偏留存估計。",
          "answer": "WITH flags AS (\n  SELECT\n    u.user_id,\n    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 6  AND 8  THEN 1 ELSE 0 END) AS d7,\n    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30\n  FROM users u\n  LEFT JOIN daily_active da ON da.user_id = u.user_id\n  GROUP BY u.user_id\n)\nSELECT\n  COUNT(*)                               AS total_users,\n  ROUND(SUM(d7)  * 100.0 / COUNT(*), 2) AS d7_pct,\n  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct\nFROM flags;",
          "hints": [
            "在 CTE 中用 MAX(CASE WHEN) 為每位用戶打 d7/d30 flag",
            "MAX 確保只要有任一天落在區間，就標記為 1"
          ],
          "explanation": "以每位用戶一次旗標計數、LEFT JOIN 保留未回訪者。D7 的 6–8 日與 D30 的 28–32 日是兩個不同 bracket，不互相包含，D30 可能高於 D7。這不是精確 N-day，不得據此宣稱因果或統計顯著差異。",
          "negatives": [
            "WITH d7 AS (SELECT u.user_id FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) = 7), d30 AS (SELECT u.user_id FROM users u JOIN daily_active da ON da.user_id = u.user_id AND julianday(da.log_date) - julianday(u.signup_date) = 30) SELECT (SELECT COUNT(*) FROM users) AS total_users, ROUND(COUNT(DISTINCT d7.user_id) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS d7_pct, ROUND(COUNT(DISTINCT d30.user_id) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS d30_pct FROM users LEFT JOIN d7 USING(user_id) LEFT JOIN d30 USING(user_id);"
          ]
        },
        {
          "id": "gh.u03.l01.e03",
          "title": "各方案的 D30 容差區間 留存率比較",
          "difficulty": 3,
          "scenario": "團隊要比較明確定義的容差區間回訪比例，不套用沒有來源的業界門檻。",
          "prompt": "分別計算 `free`、`pro`、`enterprise` 三個方案的 **Day 30 留存率**（第 28–32 天容差）。\n\n**回傳欄位：** `plan`、`total_users`、`retained_d30`、`d30_pct`（保留兩位小數）\n\n**排序：** `d30_pct DESC`\n口徑說明：本題是自訂容差 Bracket，不是精確 N-day；N-day 是恰第 N 日。沿用全體 users 作分母（非下一課固定 cohort）；本資料早期 cohort 可能缺註冊後完整觀察，數字只描述已有紀錄，不可當無偏留存估計。",
          "answer": "WITH flags AS (\n  SELECT\n    u.user_id,\n    u.plan,\n    MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32\n             THEN 1 ELSE 0 END) AS d30\n  FROM users u\n  LEFT JOIN daily_active da ON da.user_id = u.user_id\n  GROUP BY u.user_id, u.plan\n)\nSELECT\n  plan,\n  COUNT(*)                               AS total_users,\n  SUM(d30)                               AS retained_d30,\n  ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct\nFROM flags\nGROUP BY plan\nORDER BY d30_pct DESC;",
          "hints": [
            "CTE 加入 u.plan 欄位，最後 GROUP BY plan",
            "LEFT JOIN + MAX(CASE WHEN) 確保每位用戶只有一列"
          ],
          "explanation": "以每位用戶一次旗標計數、LEFT JOIN 保留未回訪者。D7 的 6–8 日與 D30 的 28–32 日是兩個不同 bracket，不互相包含，D30 可能高於 D7。這不是精確 N-day，不得據此宣稱因果或統計顯著差異。",
          "negatives": [
            "WITH flags AS (SELECT u.user_id, u.plan, MAX(CASE WHEN julianday(da.log_date)-julianday(u.signup_date) BETWEEN 28 AND 32 THEN 1 ELSE 0 END) AS d30 FROM users u LEFT JOIN daily_active da ON da.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS total_users, SUM(d30) AS retained_d30, ROUND(SUM(d30) * 100.0 / COUNT(*), 2) AS d30_pct FROM flags GROUP BY plan ORDER BY d30_pct ASC;"
          ],
          "ordered": true
        }
      ]
    },
    {
      "id": "gh-u03-l02",
      "title": "Rolling Retention vs Bracket Retention",
      "minutes": 25,
      "objectives": [
        "分辨 Rolling（第 N 日或之後）與 Bracket（指定區間）",
        "固定 cohort 和共同截止日比較 D7 / D30",
        "解讀可升可降的週區間留存差"
      ],
      "body": new URL("./l02.md", import.meta.url).href,
      "exercises": [
        {
          "id": "gh.u03.l02.e01",
          "title": "固定 cohort 的 Rolling D7 / D30",
          "difficulty": 2,
          "scenario": "你的產品是低頻工具（每週用幾次就夠），決定改用 Rolling retention 評估留存。",
          "prompt": "計算固定 cohort 的 Rolling D7 與 D30：cohort 為 2025-01-01 至 2025-06-30 註冊用戶，觀察截止日為 2025-07-31（含當日），均有完整 D30 觀察期。Rolling DN = 第 N 個日曆日或之後、截止日以前曾活躍。回傳 total_users、rolling_d7_retained、rolling_d7_pct、rolling_d30_retained、rolling_d30_pct；百分比兩位小數，空 cohort 百分比 NULL。",
          "answer": "WITH flags AS (\n SELECT u.user_id,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+7 days') THEN 1 ELSE 0 END) AS d7,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+30 days') THEN 1 ELSE 0 END) AS d30\n FROM users u LEFT JOIN daily_active da ON da.user_id=u.user_id AND date(da.log_date) <= '2025-07-31'\n WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n GROUP BY u.user_id\n)\nSELECT COUNT(*) AS total_users, COALESCE(SUM(d7),0) AS rolling_d7_retained,\n ROUND(SUM(d7)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d7_pct,\n COALESCE(SUM(d30),0) AS rolling_d30_retained,\n ROUND(SUM(d30)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d30_pct FROM flags;",
          "hints": [
            "第 1–7 天是 bracket，不是 rolling。使用 date(signup_date, +N days) 作下界。",
            "同一批用戶及同一截止日，MAX 旗標去重；D30 集合包含於 D7。"
          ],
          "explanation": "Rolling 是第 N 日或之後；固定 cohort、共同截止日之下 D30 ≤ D7。日期先 date() 正規化為日曆日，截止日含整天。不可把不同成熟度或不同 cohort 的百分比當同一條曲線。",
          "negatives": [
            "WITH flags AS (\n SELECT u.user_id,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+1 days') AND date(da.log_date) <= date(u.signup_date, '+7 days') THEN 1 ELSE 0 END) AS d7,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+30 days') THEN 1 ELSE 0 END) AS d30\n FROM users u LEFT JOIN daily_active da ON da.user_id=u.user_id AND date(da.log_date) <= '2025-07-31'\n WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n GROUP BY u.user_id\n)\nSELECT COUNT(*) AS total_users, COALESCE(SUM(d7),0) AS rolling_d7_retained,\n ROUND(SUM(d7)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d7_pct,\n COALESCE(SUM(d30),0) AS rolling_d30_retained,\n ROUND(SUM(d30)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d30_pct FROM flags;",
            "WITH flags AS (\n SELECT u.user_id,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+7 days') THEN 1 ELSE 0 END) AS d7,\n MAX(CASE WHEN date(da.log_date) >= date(u.signup_date, '+30 days') THEN 1 ELSE 0 END) AS d30\n FROM users u LEFT JOIN daily_active da ON da.user_id=u.user_id \n WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n GROUP BY u.user_id\n)\nSELECT COUNT(*) AS total_users, COALESCE(SUM(d7),0) AS rolling_d7_retained,\n ROUND(SUM(d7)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d7_pct,\n COALESCE(SUM(d30),0) AS rolling_d30_retained,\n ROUND(SUM(d30)*100.0/NULLIF(COUNT(*),0),2) AS rolling_d30_pct FROM flags;"
          ]
        },
        {
          "id": "gh.u03.l02.e02",
          "title": "Cohort 月留存表（W1 / W2 / W4）",
          "difficulty": 3,
          "scenario": "你想做一張 Cohort 留存表，向團隊展示不同月份加入的用戶，他們的週留存趨勢是否在改善。",
          "prompt": "計算 **2025-01 ~ 2025-06** 各 Cohort 月的 **W1（1–7天）、W2（8–14天）、W4（22–28天）** 留存率。\n\n**回傳欄位：** `cohort_month`（YYYY-MM）、`cohort_size`、`w1_pct`、`w2_pct`、`w4_pct`（保留一位小數）\n\n**排序：** `cohort_month ASC`\n這是 Bracket 留存；觀察截止 2025-07-31（含），date() 取日曆日。只計 2025-01-01 至 2025-06-30 註冊者；各週集合不互相包含，W4 可能高於 W1。排序相同時加 plan ASC（若有 plan 欄）。",
          "answer": "WITH flags AS (\n  SELECT\n    strftime('%Y-%m', u.signup_date) AS cohort_month,\n    u.user_id,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 8  AND 14 THEN 1 ELSE 0 END) AS w2,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4\n  FROM users u\n  LEFT JOIN daily_active da ON da.user_id = u.user_id AND date(da.log_date) <= '2025-07-31'\n  WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n  GROUP BY u.user_id, cohort_month\n)\nSELECT\n  cohort_month,\n  COUNT(*)                              AS cohort_size,\n  ROUND(SUM(w1) * 100.0 / COUNT(*), 1) AS w1_pct,\n  ROUND(SUM(w2) * 100.0 / COUNT(*), 1) AS w2_pct,\n  ROUND(SUM(w4) * 100.0 / COUNT(*), 1) AS w4_pct\nFROM flags\nGROUP BY cohort_month\nORDER BY cohort_month;",
          "hints": [
            "每位用戶用 MAX(CASE WHEN) 打各區間旗標，不因多筆活躍加權。",
            "固定 cohort 及截止日；依題目計算百分比或百分點差。"
          ],
          "explanation": "Bracket 各週分開計算，不是存活曲線；W1 − W4 是百分點差，可以為負。不足以證明流失、因果或方案優劣。共同 cohort 與截止日讓觀察期一致。",
          "negatives": [
            "WITH flags AS (\n  SELECT\n    strftime('%Y-%m', u.signup_date) AS cohort_month,\n    u.user_id,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 8  AND 14 THEN 1 ELSE 0 END) AS w2,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4\n  FROM users u\n  JOIN daily_active da ON da.user_id = u.user_id AND date(da.log_date) <= '2025-07-31'\n  WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n  GROUP BY u.user_id, cohort_month\n)\nSELECT\n  cohort_month,\n  COUNT(*)                              AS cohort_size,\n  ROUND(SUM(w1) * 100.0 / COUNT(*), 1) AS w1_pct,\n  ROUND(SUM(w2) * 100.0 / COUNT(*), 1) AS w2_pct,\n  ROUND(SUM(w4) * 100.0 / COUNT(*), 1) AS w4_pct\nFROM flags\nGROUP BY cohort_month\nORDER BY cohort_month;"
          ],
          "ordered": true
        },
        {
          "id": "gh.u03.l02.e03",
          "title": "各方案的 W1 vs W4 留存差異",
          "difficulty": 3,
          "scenario": "你要找出哪個付費方案的長期黏性最好（W4 留存最高），以及哪個方案從 W1 到 W4 的衰減幅度最大（流失風險最高）。",
          "prompt": "計算 `free`、`pro`、`enterprise` 各方案的 **W1（1–7天）和 W4（22–28天）留存率**，以及 W1 到 W4 的**衰減百分點**。\n\n**回傳欄位：** `plan`、`total_users`、`w1_pct`、`w4_pct`、`drop_points`（W1 - W4，保留一位小數）\n\n**排序：** `w4_pct DESC`\n這是 Bracket 留存；觀察截止 2025-07-31（含），date() 取日曆日。只計 2025-01-01 至 2025-06-30 註冊者；各週集合不互相包含，W4 可能高於 W1。排序相同時加 plan ASC（若有 plan 欄）。",
          "answer": "WITH brackets AS (\n  SELECT\n    u.user_id,\n    u.plan,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4\n  FROM users u\n  LEFT JOIN daily_active da ON da.user_id = u.user_id AND date(da.log_date) <= '2025-07-31'\n  WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n  GROUP BY u.user_id, u.plan\n)\nSELECT\n  plan,\n  COUNT(*)                                                          AS total_users,\n  ROUND(SUM(w1) * 100.0 / COUNT(*), 1)                             AS w1_pct,\n  ROUND(SUM(w4) * 100.0 / COUNT(*), 1)                             AS w4_pct,\n  ROUND((SUM(w1) - SUM(w4)) * 100.0 / COUNT(*), 1)                 AS drop_points\nFROM brackets\nGROUP BY plan\nORDER BY w4_pct DESC, plan ASC;",
          "hints": [
            "每位用戶用 MAX(CASE WHEN) 打各區間旗標，不因多筆活躍加權。",
            "固定 cohort 及截止日；依題目計算百分比或百分點差。"
          ],
          "explanation": "Bracket 各週分開計算，不是存活曲線；W1 − W4 是百分點差，可以為負。不足以證明流失、因果或方案優劣。共同 cohort 與截止日讓觀察期一致。",
          "negatives": [
            "WITH brackets AS (\n  SELECT\n    u.user_id,\n    u.plan,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 1  AND 7  THEN 1 ELSE 0 END) AS w1,\n    MAX(CASE WHEN julianday(date(da.log_date))-julianday(date(u.signup_date)) BETWEEN 22 AND 28 THEN 1 ELSE 0 END) AS w4\n  FROM users u\n  JOIN daily_active da ON da.user_id = u.user_id AND date(da.log_date) <= '2025-07-31'\n  WHERE date(u.signup_date) >= '2025-01-01' AND date(u.signup_date) < '2025-07-01'\n  GROUP BY u.user_id, u.plan\n)\nSELECT\n  plan,\n  COUNT(*)                                                          AS total_users,\n  ROUND(SUM(w1) * 100.0 / COUNT(*), 1)                             AS w1_pct,\n  ROUND(SUM(w4) * 100.0 / COUNT(*), 1)                             AS w4_pct,\n  ROUND((SUM(w1) - SUM(w4)) * 100.0 / COUNT(*), 1)                 AS drop_points\nFROM brackets\nGROUP BY plan\nORDER BY w4_pct DESC, plan ASC;"
          ],
          "ordered": true
        }
      ]
    }
  ]
};
