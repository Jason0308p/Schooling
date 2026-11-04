export const unit = {
  "id": "gh-u04",
  "title": "Revenue：營收分析",
  "lessons": [
    {
      "id": "gh-u04-l01",
      "title": "觀察收入 ARPU 與年化教學 proxy（非 LTV）",
      "minutes": 25,
      "objectives": [
        "在可加總收入假設下計算觀察 ARPU",
        "先依用戶彙總兩張一對多表，避免 fan-out",
        "辨認年化 proxy 與 MRR / LTV 的差別"
      ],
      "body": new URL("./l01.md", import.meta.url).href,
      "exercises": [
        {
          "id": "gh.u04.l01.e01",
          "title": "各方案 ARPU 計算",
          "difficulty": 2,
          "scenario": "財務主管想知道各訂閱方案的 ARPU（每用戶平均收入），評估定價策略是否合理。",
          "prompt": "計算各 `plan` 的 **ARPU**（每用戶平均收入）。\n\n使用 `ab_tests` 的 `revenue` 欄位，對每位用戶加總其所有 A/B 測試的轉換收入，再除以該方案的總用戶數。\n\n**回傳欄位：** `plan`、`total_users`、`total_revenue`（保留兩位小數）、`arpu`（保留兩位小數）\n\n**排序：** `arpu DESC`\n模型限制：所有實驗收入假設互不重複、同幣別且可加總；這只是全觀察期的教學 ARPU，不是 MRR、LTV，也不是因果效果。plan 為當前快照，付費比例不代表歷史升級轉換率。",
          "answer": "WITH user_rev AS (\n  SELECT\n    u.user_id,\n    u.plan,\n    COALESCE(SUM(ab.revenue), 0) AS user_revenue\n  FROM users u\n  LEFT JOIN ab_tests ab ON ab.user_id = u.user_id\n  GROUP BY u.user_id, u.plan\n)\nSELECT\n  plan,\n  COUNT(*)                                AS total_users,\n  ROUND(SUM(user_revenue), 2)             AS total_revenue,\n  ROUND(SUM(user_revenue) / COUNT(*), 2)  AS arpu\nFROM user_rev\nGROUP BY plan\nORDER BY arpu DESC;",
          "hints": [
            "LEFT JOIN 確保沒有 A/B 測試紀錄的用戶也計入（revenue = 0）",
            "COALESCE(SUM(ab.revenue), 0) 把 NULL 換成 0",
            "CTE 先算每位用戶的總收入，再 GROUP BY plan 彙總"
          ],
          "explanation": "以所有用戶作分母、無收入者為零；跨實驗 revenue 只有在互斥可加總假設下才是觀察收入。方案及來源差異為描述性結果，不能單獨決定投放或推論因果。",
          "negatives": [
            "WITH user_rev AS (SELECT u.user_id, u.plan, COALESCE(SUM(ab.revenue), 0) AS user_revenue FROM users u LEFT JOIN ab_tests ab ON ab.user_id = u.user_id GROUP BY u.user_id, u.plan) SELECT plan, COUNT(*) AS total_users, ROUND(SUM(user_revenue), 2) AS total_revenue, ROUND(SUM(user_revenue) / COUNT(*), 2) AS arpu FROM user_rev GROUP BY plan ORDER BY arpu ASC;"
          ],
          "ordered": true
        },
        {
          "id": "gh.u04.l01.e02",
          "title": "年化每活躍用戶月收入 proxy（非 LTV）",
          "difficulty": 3,
          "scenario": "分析師練習以實驗收入及活躍月份建構描述性 proxy，而非估計客戶終身價值。",
          "prompt": "假設 ab_tests 每筆 revenue 是互不重複、同幣別、可加總的教學收入（實務跨實驗重複歸因時不成立）。先依 user_id 分別彙總收入與不重複活躍 YYYY-MM 數，再 LEFT JOIN users，無紀錄者收入及月數為 0。所有資料不另設期間。依 plan 計算 users、avg_active_months（一位小數）、arpu（兩位小數）、annualized_revenue_proxy（兩位小數）。proxy = 未四捨五入 ARPU / 未四捨五入平均活躍月數 × 12；平均月數為零則 NULL。這是收入 / 活躍用戶月 × 12，非 LTV、MRR 或可靠預測。依 annualized_revenue_proxy DESC、plan ASC 排序。",
          "answer": "WITH activity AS (\n SELECT user_id, COUNT(DISTINCT strftime('%Y-%m', log_date)) AS active_months\n FROM daily_active GROUP BY user_id\n), revenue AS (\n SELECT user_id, SUM(revenue) AS total_revenue FROM ab_tests GROUP BY user_id\n), user_stats AS (\n SELECT u.user_id, u.plan, COALESCE(a.active_months,0) AS active_months,\n COALESCE(r.total_revenue,0) AS total_revenue\n FROM users u LEFT JOIN activity a ON a.user_id=u.user_id\n LEFT JOIN revenue r ON r.user_id=u.user_id\n)\nSELECT plan, COUNT(*) AS users, ROUND(AVG(active_months),1) AS avg_active_months,\n ROUND(SUM(total_revenue)*1.0/COUNT(*),2) AS arpu,\n ROUND(SUM(total_revenue)*1.0/COUNT(*)/NULLIF(AVG(active_months),0)*12,2) AS annualized_revenue_proxy\nFROM user_stats GROUP BY plan ORDER BY annualized_revenue_proxy DESC, plan ASC;",
          "hints": [
            "activity 與 revenue 各自 GROUP BY user_id，再接回 users。",
            "SUM(DISTINCT revenue) 會誤刪等額但不同的收入紀錄，不是去 fan-out 的解法。",
            "NULLIF 處理零月數；不要用四捨五入後的 ARPU 或月數計算。"
          ],
          "explanation": "兩張明細直接 JOIN 會造成 活躍筆數 × 收入筆數 的 fan-out。先獨立彙總才不重複加總。此 proxy 假設每筆實驗收入獨立可加總，且觀察到的每活躍月收入可固定延伸 12 個月；活躍月不是壽命，實驗收入不是訂閱帳單，因此不能稱 LTV 或用來推論值得投入多少 CAC。",
          "negatives": [
            "WITH user_stats AS (SELECT u.user_id,u.plan,COUNT(DISTINCT strftime('%Y-%m',da.log_date)) AS active_months,COALESCE(SUM(ab.revenue),0) AS total_revenue FROM users u LEFT JOIN daily_active da ON da.user_id=u.user_id LEFT JOIN ab_tests ab ON ab.user_id=u.user_id GROUP BY u.user_id,u.plan) SELECT plan,COUNT(*) AS users,ROUND(AVG(active_months),1) AS avg_active_months,ROUND(SUM(total_revenue)*1.0/COUNT(*),2) AS arpu,ROUND(SUM(total_revenue)*1.0/COUNT(*)/NULLIF(AVG(active_months),0)*12,2) AS annualized_revenue_proxy FROM user_stats GROUP BY plan ORDER BY annualized_revenue_proxy DESC,plan ASC;"
          ],
          "ordered": true
        },
        {
          "id": "gh.u04.l01.e03",
          "title": "各渠道付費轉換率與收入貢獻",
          "difficulty": 3,
          "scenario": "行銷主管要決定下季度把預算集中在哪些渠道，你需要同時提供「付費轉換率」和「每用戶平均收入」兩個維度。",
          "prompt": "計算各 **acquisition_channel** 的：\n- 付費用戶比例（plan 為 `pro` 或 `enterprise`）\n- 每用戶平均 A/B 測試收入（ARPU）\n\n**回傳欄位：** `acquisition_channel`、`total_users`、`paid_users`、`paid_rate_pct`（保留一位小數）、`arpu`（保留兩位小數）\n\n**排序：** `arpu DESC`\n模型限制：所有實驗收入假設互不重複、同幣別且可加總；這只是全觀察期的教學 ARPU，不是 MRR、LTV，也不是因果效果。plan 為當前快照，付費比例不代表歷史升級轉換率。",
          "answer": "WITH user_rev AS (\n  SELECT\n    u.user_id,\n    u.acquisition_channel,\n    u.plan,\n    COALESCE(SUM(ab.revenue), 0) AS user_revenue\n  FROM users u\n  LEFT JOIN ab_tests ab ON ab.user_id = u.user_id\n  GROUP BY u.user_id, u.acquisition_channel, u.plan\n)\nSELECT\n  acquisition_channel,\n  COUNT(*)                                                          AS total_users,\n  SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)   AS paid_users,\n  ROUND(SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)\n        * 100.0 / COUNT(*), 1)                                      AS paid_rate_pct,\n  ROUND(SUM(user_revenue) / COUNT(*), 2)                           AS arpu\nFROM user_rev\nGROUP BY acquisition_channel\nORDER BY arpu DESC;",
          "hints": [
            "CTE 先對每位用戶 JOIN ab_tests 算出 user_revenue",
            "paid_rate_pct 用 CASE WHEN plan IN ... 計算付費比例"
          ],
          "explanation": "以所有用戶作分母、無收入者為零；跨實驗 revenue 只有在互斥可加總假設下才是觀察收入。方案及來源差異為描述性結果，不能單獨決定投放或推論因果。",
          "negatives": [
            "WITH user_rev AS (SELECT u.user_id, u.acquisition_channel, u.plan, COALESCE(SUM(ab.revenue), 0) AS user_revenue FROM users u LEFT JOIN ab_tests ab ON ab.user_id = u.user_id GROUP BY u.user_id, u.acquisition_channel, u.plan) SELECT acquisition_channel, COUNT(*) AS total_users, SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END) AS paid_users, ROUND(SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)*100.0/COUNT(*),1) AS paid_rate_pct, ROUND(SUM(user_revenue)/COUNT(*),2) AS arpu FROM user_rev GROUP BY acquisition_channel ORDER BY paid_rate_pct DESC;"
          ],
          "ordered": true
        }
      ]
    }
  ]
};
