/**
 * 課程設定檔：Prompt Engineering 中文實戰
 */
export const course = {
  id: 'prompt-engineering',
  title: 'Prompt Engineering 中文實戰：讓 AI 輸出你想要的結果',
  subtitle: '學會寫出能帶出一致、可預期、高品質結果的 Prompt——不管你在用哪一家 AI。',
  level: '實務',
  estimatedHours: 4,
  dataset: null,
  audience: ['行銷人員', 'PM', '內容創作者', '數據分析師'],
  outcomes: [
    '用四個維度（Role / Task / Format / Context）寫出可預期結果的 Prompt',
    '看出一個 Prompt 哪裡出問題，並知道如何修正',
    '建立自己工作場景的 Prompt 模板庫',
    '用 Chain of Thought 和 Few-shot 讓 AI 輸出更穩定',
  ],
  units: [
    {
      id: 'pe-u01', no: 1, title: 'Prompt 的四個維度', status: 'published', access: 'free', plannedExercises: 6,
      summary: 'Role（角色）、Task（任務）、Format（格式）、Context（背景）四個維度，是寫出穩定 Prompt 的基礎框架。',
      load: () => import('./units/u01-four-dimensions/unit.js'),
    },
    {
      id: 'pe-u02', no: 2, title: '常見錯誤與修正策略', status: 'published', access: 'free', plannedExercises: 3,
      summary: '診斷 AI 輸出不穩定的常見原因，學會拆解複雜需求、加約束、與 AI 多輪對話的修正策略。',
      load: () => import('./units/u02-common-errors/unit.js'),
    },
    {
      id: 'pe-u03', no: 3, title: '行銷人的 Prompt 模板庫', status: 'published', access: 'free', plannedExercises: 3,
      summary: '廣告文案、SEO 文章、競品分析、報告整理——四個行銷場景的可複用 Prompt 模板。',
      load: () => import('./units/u03-marketing-templates/unit.js'),
    },
    {
      id: 'pe-u04', no: 4, title: 'PM 的 Prompt 模板庫', status: 'published', access: 'free', plannedExercises: 3,
      summary: 'PRD 起草、會議記錄整理、用戶反饋分析、A/B 測試假設——四個 PM 場景的可複用 Prompt 模板。',
      load: () => import('./units/u04-pm-templates/unit.js'),
    },
    {
      id: 'pe-u05', no: 5, title: '進階技巧：CoT、Few-shot、自我檢核', status: 'published', access: 'free', plannedExercises: 3,
      summary: 'Chain of Thought 讓 AI 展示推理過程；Few-shot 給範例讓輸出更穩定；自我檢核讓 AI 修正自己的輸出。',
      load: () => import('./units/u05-advanced/unit.js'),
    },
  ],
};
