/**
 * 課程設定檔：PRD 寫作課
 */
export const course = {
  id: 'prd-writing',
  title: 'PRD 寫作課：從需求到可執行的產品文件',
  subtitle: 'Product Requirements Document — write specs that teams actually ship.',
  level: '實務',
  estimatedHours: 5,
  dataset: null,
  audience: ['PM', '產品設計師', 'Engineering Lead', '想轉 PM 的工程師'],
  outcomes: [
    '寫出工程師和設計師都看得懂的需求文件',
    '用 User Story + Acceptance Criteria 定義清楚的驗收標準',
    '用數據支撐需求優先級決策',
    '避免需求文件的常見地雷',
  ],
  units: [
    {
      id: 'prd-u01', no: 1, title: '什麼是好的 PRD？', status: 'published', access: 'free', plannedExercises: 3,
      summary: 'PRD vs Spec vs RFC 的差異；好的 PRD 具備的三個特質：Clear、Testable、Minimal。',
      load: () => import('./units/u01-what-is-prd/unit.js'),
    },
    {
      id: 'prd-u02', no: 2, title: 'User Story 與 Acceptance Criteria', status: 'published', access: 'free', plannedExercises: 6,
      summary: 'As a / I want / So that 格式、常見錯誤寫法；以及 Given / When / Then 驗收標準與 Edge case 處理。',
      load: () => import('./units/u02-user-story/unit.js'),
    },
    {
      id: 'prd-u03', no: 3, title: '需求優先級框架', status: 'published', access: 'free', plannedExercises: 3,
      summary: 'RICE / MoSCoW / ICE 框架比較；如何依情境選擇合適的框架。',
      load: () => import('./units/u03-prioritization/unit.js'),
    },
    {
      id: 'prd-u04', no: 4, title: '用數據支撐需求決策', status: 'published', access: 'free', plannedExercises: 3,
      summary: '從數據中找需求信號；定義 Baseline 基準指標與 Success Metric 成功指標。',
      load: () => import('./units/u04-data-driven/unit.js'),
    },
    {
      id: 'prd-u05', no: 5, title: 'PRD 常見地雷', status: 'published', access: 'free', plannedExercises: 3,
      summary: '10 種 PRD 常見錯誤：過度設計、解決方案導向、缺乏驗收標準等，以及如何避免。',
      load: () => import('./units/u05-pitfalls/unit.js'),
    },
    {
      id: 'prd-u06', no: 6, title: '完整 PRD 模板實戰', status: 'published', access: 'free', plannedExercises: 3,
      summary: '一份完整的 PRD 模板（中英雙語），逐區塊說明每個章節的用途與填寫方法。',
      load: () => import('./units/u06-template/unit.js'),
    },
  ],
};
