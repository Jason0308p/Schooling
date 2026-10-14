/**
 * Hash 路由（#/...）：純靜態網站不需要伺服器設定，GitHub Pages / Cloudflare Pages / 本機都能用。
 *
 * 路由表：
 *   #/                              首頁（課程目錄）
 *   #/course/:courseId              課程總覽
 *   #/learn/:courseId/:lessonId     上課頁
 *   #/playground                    練習場
 *   #/data                          資料表說明
 *   #/progress                      我的學習進度
 */
export function createRouter(routes, onNotFound) {
  const compiled = routes.map(([pattern, handler]) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    return { re, keys, handler };
  });

  async function resolve() {
    const path = decodeURIComponent((location.hash || '#/').slice(1)) || '/';
    for (const r of compiled) {
      const m = path.match(r.re);
      if (m) {
        const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
        await r.handler(params, path);
        return;
      }
    }
    onNotFound(path);
  }

  window.addEventListener('hashchange', resolve);
  return { start: resolve, go: (p) => { location.hash = p; } };
}
