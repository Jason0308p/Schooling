/**
 * 應用程式進入點：建立 app 物件 → 啟動路由；SQL 引擎只在 SQL 功能需要時載入。
 */
import { config } from './config.js';
import { initEngine, ensureDataset } from './core/sqlEngine.js';
import { ProgressStore, LocalStorageAdapter } from './core/progressStore.js';
import { loadCourse } from './core/courseRegistry.js';
import { createRouter } from './core/router.js';
import { h } from './ui/dom.js';
import { renderShell, setActiveNav } from './ui/shell.js';
import { openSchemaDrawer, closeSchemaDrawer } from './ui/components/schemaDrawer.js';
import { renderHome } from './ui/views/home.js';
import { renderCourse } from './ui/views/course.js';
import { renderLesson } from './ui/views/lesson.js';
import { renderPlayground } from './ui/views/playground.js';
import { renderData } from './ui/views/data.js';
import { renderProgress } from './ui/views/progress.js';

/** 偏好設定（主題、練習場草稿）：跟學習進度分開存，清進度不會清偏好 */
const prefs = {
  _d: (() => { try { return JSON.parse(localStorage.getItem(config.storage.prefsKey) || '{}'); } catch { return {}; } })(),
  get(k) { return this._d[k]; },
  set(k, v) { this._d[k] = v; try { localStorage.setItem(config.storage.prefsKey, JSON.stringify(this._d)); } catch { /* ignore */ } },
};

function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

async function boot() {
  applyTheme(prefs.get('theme'));
  const status = document.getElementById('boot-status');
  if (location.protocol === 'file:') {
    status.innerHTML = '請用 <b>start.bat</b> 啟動（瀏覽器不允許直接從檔案載入資料庫引擎）。詳見 README.md。';
    return;
  }

  let pendingPlaygroundSql = null;

  const app = {
    config,
    prefs,
    progress: new ProgressStore(new LocalStorageAdapter(config.storage.progressKey)),
    async getCourse(id = config.defaultCourseId) {
      const c = await loadCourse(id);
      if (c?.dataset) {
        await initEngine({ wasmDir: 'src/vendor/sqljs' });
        ensureDataset(c.dataset);
      }
      return c;
    },
    openSchema: async () => {
      const c = await app.getCourse();
      if (c?.dataset) openSchemaDrawer(c.dataset);
    },
    openInPlayground(sql) { pendingPlaygroundSql = sql; location.hash = '#/playground'; },
    takePlaygroundSql() { const s = pendingPlaygroundSql; pendingPlaygroundSql = null; return s; },
    toggleTheme() {
      const dark = document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      prefs.set('theme', next);
      applyTheme(next);
    },
  };

  const { main } = renderShell(app);

  const show = (navKey, render) => async (params) => {
    closeSchemaDrawer();
    setActiveNav(navKey);
    try {
      const view = await render(app, params);
      main.replaceChildren(view);
      // 根據當前課程是否有 dataset 顯示/隱藏資料表按鈕
      const courseId = params?.courseId;
      const btn = document.getElementById('schema-btn');
      if (btn) {
        const c = await loadCourse(courseId || config.defaultCourseId);
        btn.style.display = c?.dataset ? '' : 'none';
      }
    } catch (e) {
      console.error(e);
      main.replaceChildren(h('div', { class: 'page' }, h('h1', {}, '頁面載入失敗'), h('pre', { class: 'code' }, String(e.stack || e))));
    }
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  };

  const router = createRouter([
    ['/', show('home', renderHome)],
    ['/course/:courseId', show('course', renderCourse)],
    ['/learn/:courseId/:lessonId', show('course', renderLesson)],
    ['/playground', show('playground', renderPlayground)],
    ['/data', show('data', renderData)],
    ['/progress', show('progress', renderProgress)],
  ], () => { location.hash = '#/'; });

  await router.start();
}

boot().catch((e) => {
  console.error(e);
  const status = document.getElementById('boot-status');
  if (status) status.textContent = '啟動失敗：' + e.message;
});
