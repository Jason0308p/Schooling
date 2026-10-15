const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'prd-u03',
  title: '需求優先級框架',
  lessons: [
    {
      id: 'prd-u03-l01',
      title: 'RICE、MoSCoW、ICE：何時用哪個',
      minutes: 25,
      objectives: [
        '說明 RICE、MoSCoW、ICE 三種優先級框架的計算方式與適用情境',
        '識別每個框架的限制與常見誤用',
        '根據團隊與需求特性選擇合適的框架',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'prd.u03.l01.q01',
          type: 'mcq',
          title: 'RICE 分數計算',
          question: '一個功能的評估結果如下：\n\n- **Reach（觸及人數）**：每季 500 人\n- **Impact（影響度）**：3（高）\n- **Confidence（信心度）**：80%（= 0.8）\n- **Effort（工作量）**：4 人週\n\n**RICE 分數**是多少？',
          options: [
            'A. 150',
            'B. 300',
            'C. 375',
            'D. 480',
          ],
          answer: 1,
          explanation: `RICE 公式：**(Reach × Impact × Confidence) / Effort**

計算過程：
- 分子：500 × 3 × 0.8 = **1200**
- 分母：4
- RICE 分數：1200 / 4 = **300**

RICE 分數越高，代表功能的「影響力 / 成本比」越高，應優先執行。

注意 Confidence 必須以小數表示（80% = 0.8），這是初學者最常算錯的地方。`,
        },
        {
          id: 'prd.u03.l01.q02',
          type: 'mcq',
          title: 'MoSCoW 的 Should Have',
          question: '在 MoSCoW 框架中，**Should Have** 的正確定義是什麼？',
          options: [
            'A. 這個版本不做，但列入下次規劃',
            'B. 重要但不緊急，如果時間允許應該包含，缺少它不會導致發布失敗',
            'C. 必須在這個版本做完，否則不發布',
            'D. 僅限特定付費用戶使用的功能',
          ],
          answer: 1,
          explanation: `MoSCoW 四個等級：

- **Must Have**：這個版本必須有，否則產品無法運作或不能發布
- **Should Have**：重要但非致命，如果 Sprint 時間不夠可以推遲，但應盡快完成
- **Could Have**：「有更好，沒有也沒關係」的錦上添花功能
- **Won't Have**（this time）：這次範圍外，但未來可能做

**Should Have 的關鍵是「不會阻擋發布」**——這是它和 Must Have 的核心差異。許多 PM 在壓力下會把太多需求放進 Must Have，導致 Scope Creep。`,
        },
        {
          id: 'prd.u03.l01.q03',
          type: 'mcq',
          title: '選擇優先級框架',
          question: '你是一個早期新創的 PM，產品剛推出 MVP，有大量未驗證的功能想法，需要快速做出優先級決策。哪個框架**最不適合**這個情境？',
          options: [
            'A. ICE（Impact / Confidence / Ease）',
            'B. MoSCoW',
            'C. RICE（Reach / Impact / Confidence / Effort）',
            'D. 直覺排序 + 團隊討論',
          ],
          answer: 2,
          explanation: `**RICE 最不適合早期新創的原因：**

RICE 需要可靠的 **Reach 數據**（觸及多少人）。早期新創的用戶數少、數據不穩定，Reach 數字很難準確估算，導致 RICE 分數的比較沒有實際意義。

**早期新創更適合的方式：**
- **ICE**：三個維度（Impact、Confidence、Ease）都可以用相對估算，不依賴精確數據
- **MoSCoW**：快速分類「必做 vs 可推遲」，適合資源有限的早期團隊
- 團隊討論：資訊不足時，集體智慧比精確計算更可靠

RICE 適合已有一定用戶規模、有數據追蹤基礎設施的成長期產品。`,
        },
      ],
    },
  ],
};
