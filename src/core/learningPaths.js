/**
 * 共用學習路徑與下一門課推薦規則。
 * 只處理課程順序與統計，不存取 DOM 或瀏覽器 API。
 */
export const LEARNING_PATHS = [
  { id: 'sql-analyst', title: 'SQL 分析師路徑', audience: 'Excel 使用者、數據分析初學者', hours: '約 20 小時', outcome: '從試算表思維走到能獨立完成 SQL 分析與面試題。', courses: ['excel-to-sql', 'sql-foundations', 'sql-interview'] },
  { id: 'marketing-data', title: '行銷數據路徑', audience: '行銷、Growth、電商營運', hours: '約 24 小時', outcome: '從資料查詢、GA4 事件分析到成長與儀表板決策。', courses: ['sql-foundations', 'bigquery-ga4', 'looker-studio', 'growth-analytics'] },
  { id: 'product-pm', title: 'PM 產品路徑', audience: 'PM、產品營運、創業團隊', hours: '約 20 小時', outcome: '用數據做產品決策，並把需求寫成可執行的 PRD。', courses: ['pm-sql', 'growth-analytics', 'prd-writing', 'ai-workflow'] },
  { id: 'ai-productivity', title: 'AI 生產力路徑', audience: '行銷、PM、內容與知識工作者', hours: '約 9 小時', outcome: '建立可靠的 AI 工作流程，寫出可重複使用的 Prompt。', courses: ['ai-workflow', 'prompt-engineering'] },
];

export function recommendNextCourse(catalog, statsById, { afterCourseId = null, onlyUnstarted = false } = {}) {
  const available = new Map(catalog.filter(entry => entry.load).map(entry => [entry.id, entry]));
  const isEligible = (id) => {
    const stats = statsById.get(id);
    return stats?.pct < 100 && (!onlyUnstarted || stats.exSolved === 0);
  };

  if (afterCourseId) {
    for (const path of LEARNING_PATHS) {
      const index = path.courses.indexOf(afterCourseId);
      if (index < 0) continue;
      const nextId = path.courses.slice(index + 1).find(id => available.has(id) && isEligible(id));
      if (nextId) {
        return {
          entry: available.get(nextId),
          path,
          reason: `你已完成上一階段，接著沿著「${path.title}」學習。`,
        };
      }
    }
  }

  const candidates = LEARNING_PATHS.map((path, pathIndex) => {
    const ids = path.courses.filter(id => available.has(id));
    const nextIndex = ids.findIndex(id => isEligible(id));
    if (nextIndex < 0) return null;
    const nextId = ids[nextIndex];
    const nextStats = statsById.get(nextId);
    const completedBefore = ids.slice(0, nextIndex).filter(id => statsById.get(id)?.pct === 100).length;
    const score = completedBefore * 10 + (nextStats?.exSolved > 0 ? 5 : 0) - pathIndex;
    return { entry: available.get(nextId), path, score, nextStats };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  const recommendation = candidates[0];
  if (!recommendation) return null;
  return {
    entry: recommendation.entry,
    path: recommendation.path,
    reason: recommendation.nextStats?.exSolved > 0
      ? `繼續完成「${recommendation.path.title}」目前的課程。`
      : `依照「${recommendation.path.title}」的順序，這門最適合作為下一步。`,
  };
}
