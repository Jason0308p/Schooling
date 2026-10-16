const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'gh-u01',
  title: 'Acquisition：獲客分析',
  lessons: [
    {
      id: 'gh-u01-l01',
      title: '渠道品質分析：不只看數量，更看留存',
      minutes: 20,
      objectives: [
        '計算各獲客渠道的用戶數與佔比',
        '比較各渠道的活躍率與付費轉換率',
        '理解渠道品質指標的業務意義',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'gh.u01.l01.e01',
          title: '各渠道新用戶數與佔比',
          difficulty: 2,
          scenario: '行銷團隊想知道哪個渠道帶來最多用戶，以及各渠道佔整體的比例，作為預算分配參考。',
          prompt: `計算各 **acquisition_channel** 的用戶數與佔整體的百分比。

**回傳欄位：** \`acquisition_channel\`、\`total_users\`、\`pct\`（百分比，保留一位小數）

**排序：** \`total_users DESC\``,
          answer: `SELECT
  acquisition_channel,
  COUNT(*)                                              AS total_users,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 1) AS pct
FROM users
GROUP BY acquisition_channel
ORDER BY total_users DESC;`,
          hints: [
            '用子查詢 (SELECT COUNT(*) FROM users) 作為分母計算佔比',
            'GROUP BY acquisition_channel 後 COUNT(*) 取各渠道人數',
          ],
          explanation: `**渠道佔比分析** 是廣告預算分配的起點：先知道每個渠道帶來多少用戶，再對照後續的留存率，才能算出 CPA（Cost Per Acquisition）的真實效益。`,
          negatives: [
            `SELECT acquisition_channel, COUNT(*) AS total_users, ROUND(COUNT(*) * 1.0 / (SELECT COUNT(*) FROM users), 1) AS pct FROM users GROUP BY acquisition_channel ORDER BY total_users DESC;`,
          ],
        },
        {
          id: 'gh.u01.l01.e02',
          title: '渠道活躍率比較',
          difficulty: 2,
          scenario: '你懷疑 paid_search 帶來的用戶品質較差（活躍率低），需要數據驗證。',
          prompt: `計算各渠道的**活躍用戶比例**（\`is_active = 1\` 的比例）。

**回傳欄位：** \`acquisition_channel\`、\`total_users\`、\`active_users\`、\`active_rate_pct\`（保留一位小數）

**排序：** \`active_rate_pct DESC\``,
          answer: `SELECT
  acquisition_channel,
  COUNT(*)                                         AS total_users,
  SUM(is_active)                                   AS active_users,
  ROUND(SUM(is_active) * 100.0 / COUNT(*), 1)     AS active_rate_pct
FROM users
GROUP BY acquisition_channel
ORDER BY active_rate_pct DESC;`,
          hints: [
            'is_active 是 0/1 整數，可以直接 SUM() 計算活躍用戶數',
            'SUM(is_active) / COUNT(*) 即為活躍率',
          ],
          explanation: `**渠道活躍率** 反映渠道帶來的用戶品質。活躍率低的渠道即使帶來大量用戶，也可能在留存分析中表現很差。

若 paid_search 活躍率顯著低於 organic，可能代表廣告受眾設定不精準，需要優化 targeting。`,
          negatives: [
            `SELECT acquisition_channel, COUNT(*) AS total_users, SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS active_users, ROUND(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS active_rate_pct FROM users GROUP BY acquisition_channel ORDER BY active_rate_pct DESC;`,
          ],
        },
        {
          id: 'gh.u01.l01.e03',
          title: '渠道付費轉換率 × 平台交叉分析',
          difficulty: 3,
          scenario: '你想找出：哪個渠道在哪個平台的付費轉換率最高，作為行銷投放組合的建議依據。',
          prompt: `計算各 **acquisition_channel × platform** 組合的**付費轉換率**（plan 為 \`pro\` 或 \`enterprise\` 的比例）。

只保留用戶數 **≥ 20** 的組合，避免小樣本雜訊。

**回傳欄位：** \`acquisition_channel\`、\`platform\`、\`total_users\`、\`paid_users\`、\`paid_rate_pct\`（保留一位小數）

**排序：** \`paid_rate_pct DESC\``,
          answer: `SELECT
  acquisition_channel,
  platform,
  COUNT(*)                                                          AS total_users,
  SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)   AS paid_users,
  ROUND(
    SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END)
    * 100.0 / COUNT(*), 1
  )                                                                 AS paid_rate_pct
FROM users
GROUP BY acquisition_channel, platform
HAVING COUNT(*) >= 20
ORDER BY paid_rate_pct DESC;`,
          hints: [
            "用 CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END 標記付費用戶",
            'HAVING COUNT(*) >= 20 過濾小樣本',
            'GROUP BY 兩個欄位做交叉分析',
          ],
          explanation: `**渠道 × 平台交叉分析** 可以找到「最高 ROI 的投放組合」。例如：referral 在 web 平台的付費率可能遠高於 social 在 iOS 的付費率，幫助廣告預算精準分配。

HAVING 過濾小樣本是防止 100% 或 0% 這類極端數字誤導決策的好習慣。`,
          negatives: [
            `SELECT acquisition_channel, platform, COUNT(*) AS total_users, SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END) AS paid_users, ROUND(SUM(CASE WHEN plan IN ('pro', 'enterprise') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS paid_rate_pct FROM users GROUP BY acquisition_channel, platform HAVING COUNT(*) >= 20 ORDER BY paid_rate_pct ASC;`,
          ],
          ordered: true,
        },
      ],
    },
  ],
};
