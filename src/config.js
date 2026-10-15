/**
 * 全站設定：品牌、儲存鍵、功能開關。
 * 商業化時要改的東西集中在這裡，不要散落在各元件。
 */
export const config = {
  brand: {
    name: 'Schooling',
    tagline: '真實工作技能的互動學習平台',
    logoMark: 'S',
  },
  appVersion: '0.1.0',
  storage: {
    // 進度存在瀏覽器 localStorage；資料結構改版時把 v1 → v2 並寫 migration（見 docs/ARCHITECTURE.md）
    progressKey: 'sqlte.progress.v1',
    prefsKey: 'sqlte.prefs.v1',
  },
  features: {
    // 未來商業化開關：目前全部關閉，所有內容免費開放
    paywall: false,
    accounts: false,
    remoteProgressSync: false,
  },
  defaultCourseId: 'sql-foundations',
};
