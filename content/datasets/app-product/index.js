/**
 * 練習資料集：「AppFlow」模擬 SaaS / 消費 App 產品數據
 *
 * - 用固定種子的亂數產生器建立資料 → 每個人、每次開啟拿到的資料完全相同。
 * - 改動這個檔案的資料邏輯時，請把 version +1。
 * - 這個模組必須保持「純 JS」：不可碰 window / document，讓 Node 驗證工具也能載入。
 */

export const dataset = {
  id: 'app-product',
  version: 1,
  name: 'AppFlow 產品數據庫',
  description:
    '一款訂閱制 SaaS App，包含用戶、每日活躍、功能使用、A/B 測試資料，資料期間 2025-01-01 ~ 2025-12-31。',
  tables: [
    {
      name: 'users',
      label: '用戶',
      description: '每一列是一位註冊用戶。signup_date 為 2024-07-01 ~ 2025-06-30。',
      columns: [
        ['user_id', 'INTEGER', '用戶編號（主鍵）'],
        ['signup_date', 'TEXT', '註冊日 YYYY-MM-DD，2024-07-01 ~ 2025-06-30'],
        ['plan', 'TEXT', "訂閱方案：'free' / 'pro' / 'enterprise'"],
        ['platform', 'TEXT', "平台：'ios' / 'android' / 'web'"],
        ['country', 'TEXT', "國家：'TW' / 'US' / 'JP' / 'SG'"],
        ['is_active', 'INTEGER', '是否活躍：1 = 是、0 = 已流失'],
        ['acquisition_channel', 'TEXT', "取得管道：'organic' / 'paid_search' / 'referral' / 'social'"],
      ],
    },
    {
      name: 'daily_active',
      label: '每日活躍',
      description: '每位活躍用戶每天一列（有開啟 App 的日子），資料期間 2025-01-01 ~ 2025-12-31。',
      columns: [
        ['log_date', 'TEXT', '日期 YYYY-MM-DD'],
        ['user_id', 'INTEGER', '用戶（外鍵 → users.user_id）'],
        ['session_count', 'INTEGER', '當日 Session 數（1–5）'],
        ['total_duration_seconds', 'INTEGER', '當日總使用時長（秒）'],
      ],
    },
    {
      name: 'feature_events',
      label: '功能事件',
      description: '每一列是一次功能使用事件，記錄用戶在哪天使用了哪個功能。',
      columns: [
        ['event_id', 'INTEGER', '事件編號（主鍵）'],
        ['user_id', 'INTEGER', '用戶（外鍵 → users.user_id）'],
        ['feature_name', 'TEXT', "功能名稱：'dashboard' / 'report' / 'export' / 'share' / 'api' / 'integration'"],
        ['event_type', 'TEXT', "操作類型：'viewed' / 'used' / 'completed'"],
        ['event_date', 'TEXT', '事件日期 YYYY-MM-DD'],
      ],
    },
    {
      name: 'ab_tests',
      label: 'A/B 測試',
      description: '每一列是一位用戶被分配到某個 A/B 測試實驗組的紀錄。',
      columns: [
        ['assignment_id', 'INTEGER', '分配編號（主鍵）'],
        ['test_name', 'TEXT', "實驗名稱：'onboarding_v2' / 'pricing_modal' / 'feature_discovery'"],
        ['user_id', 'INTEGER', '用戶（外鍵 → users.user_id）'],
        ['variant', 'TEXT', "實驗組：'control' / 'treatment'"],
        ['assigned_date', 'TEXT', '分配日期 YYYY-MM-DD'],
        ['converted', 'INTEGER', '是否轉換：1 = 是、0 = 否（treatment 轉換率高 15–25%）'],
        ['revenue', 'REAL', '轉換產生的收入（converted=0 時為 0）'],
      ],
    },
  ],
  build,
};

const SCHEMA_SQL = `
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  signup_date TEXT NOT NULL,
  plan TEXT NOT NULL,
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  is_active INTEGER NOT NULL,
  acquisition_channel TEXT NOT NULL
);
CREATE TABLE daily_active (
  log_date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  session_count INTEGER NOT NULL,
  total_duration_seconds INTEGER NOT NULL,
  PRIMARY KEY (log_date, user_id)
);
CREATE TABLE feature_events (
  event_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  feature_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL
);
CREATE TABLE ab_tests (
  assignment_id INTEGER PRIMARY KEY,
  test_name TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  variant TEXT NOT NULL,
  assigned_date TEXT NOT NULL,
  converted INTEGER NOT NULL DEFAULT 0,
  revenue REAL NOT NULL DEFAULT 0
);
`;

// ---------- 工具 ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;
const fmtDate = (ms) => new Date(ms).toISOString().slice(0, 10);

function build(db, { seed = 20250101 } = {}) {
  const rnd = mulberry32(seed);
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const wpick = (pairs) => {
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rnd() * total;
    for (const [v, w] of pairs) { if ((r -= w) < 0) return v; }
    return pairs[pairs.length - 1][0];
  };

  db.run(SCHEMA_SQL);
  db.run('BEGIN');

  const DATA_START = Date.UTC(2025, 0, 1);   // 2025-01-01
  const DATA_END   = Date.UTC(2025, 11, 31);  // 2025-12-31
  const DATA_DAYS  = 364;

  const SIGNUP_START = Date.UTC(2024, 6, 1);  // 2024-07-01
  const SIGNUP_END   = Date.UTC(2025, 5, 30); // 2025-06-30
  const SIGNUP_DAYS  = Math.round((SIGNUP_END - SIGNUP_START) / DAY);

  // ---------- users ----------
  const insU = db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)');
  const users = [];
  for (let id = 1; id <= 1000; id++) {
    const signup_date = fmtDate(SIGNUP_START + int(0, SIGNUP_DAYS) * DAY);
    const plan        = wpick([['free', 60], ['pro', 30], ['enterprise', 10]]);
    const platform    = wpick([['ios', 40], ['android', 35], ['web', 25]]);
    const country     = wpick([['TW', 50], ['US', 25], ['JP', 15], ['SG', 10]]);
    const is_active   = rnd() < 0.85 ? 1 : 0;
    const acquisition_channel = wpick([['organic', 35], ['paid_search', 25], ['referral', 20], ['social', 20]]);
    users.push({ id, signup_date, plan, is_active });
    insU.run([id, signup_date, plan, platform, country, is_active, acquisition_channel]);
  }
  insU.free();

  // ---------- daily_active ----------
  // 活躍用戶每個月有隨機幾天有紀錄，全年合計約 12000 筆
  const insDA = db.prepare('INSERT INTO daily_active VALUES (?,?,?,?)');
  for (const u of users) {
    if (!u.is_active) continue;
    // 依方案決定活躍天數
    const baseDays = u.plan === 'enterprise' ? int(40, 80)
                   : u.plan === 'pro'        ? int(20, 50)
                                             : int(5, 20);
    // 在資料期間內隨機選不重複的日子
    const daySet = new Set();
    const attempts = baseDays * 3;
    for (let i = 0; i < attempts && daySet.size < baseDays; i++) {
      const d = DATA_START + int(0, DATA_DAYS) * DAY;
      // 只記錄在 signup 日期之後的活動
      if (fmtDate(d) >= u.signup_date) daySet.add(fmtDate(d));
    }
    for (const log_date of [...daySet].sort()) {
      const session_count = int(1, 5);
      const total_duration_seconds = int(60, 3600) * session_count;
      insDA.run([log_date, u.id, session_count, total_duration_seconds]);
    }
  }
  insDA.free();

  // ---------- feature_events ----------
  const FEATURES = ['dashboard', 'report', 'export', 'share', 'api', 'integration'];
  const EVENT_TYPES = ['viewed', 'used', 'completed'];
  // 功能使用機率依方案
  const featureW = {
    dashboard:   [['free', 40], ['pro', 35], ['enterprise', 25]],
    report:      [['free', 20], ['pro', 45], ['enterprise', 35]],
    export:      [['free', 10], ['pro', 50], ['enterprise', 40]],
    share:       [['free', 30], ['pro', 40], ['enterprise', 30]],
    api:         [['free', 5],  ['pro', 35], ['enterprise', 60]],
    integration: [['free', 5],  ['pro', 30], ['enterprise', 65]],
  };
  const insFE = db.prepare('INSERT INTO feature_events VALUES (?,?,?,?,?)');
  let eventId = 0;
  for (const u of users) {
    const nEvents = u.plan === 'enterprise' ? int(20, 40)
                  : u.plan === 'pro'        ? int(10, 25)
                                            : int(3, 15);
    for (let k = 0; k < nEvents; k++) {
      // 選功能（pro/enterprise 更多高級功能）
      const feature_name = pick(FEATURES);
      const event_type   = wpick([['viewed', 40], ['used', 40], ['completed', 20]]);
      const event_date   = fmtDate(DATA_START + int(0, DATA_DAYS) * DAY);
      // 只記錄 signup 之後的事件
      if (event_date < u.signup_date) continue;
      eventId += 1;
      insFE.run([eventId, u.id, feature_name, event_type, event_date]);
    }
  }
  insFE.free();

  // ---------- ab_tests ----------
  const TESTS = ['onboarding_v2', 'pricing_modal', 'feature_discovery'];
  // onboarding_v2: 2025-01-15 ~ 2025-03-31
  // pricing_modal: 2025-04-01 ~ 2025-06-30
  // feature_discovery: 2025-07-01 ~ 2025-09-30
  const TEST_CONFIG = {
    onboarding_v2:     { start: '2025-01-15', end: '2025-03-31', ctrlCvr: 0.12, liftMin: 0.15, liftMax: 0.22, avgRev: 29 },
    pricing_modal:     { start: '2025-04-01', end: '2025-06-30', ctrlCvr: 0.08, liftMin: 0.18, liftMax: 0.25, avgRev: 99 },
    feature_discovery: { start: '2025-07-01', end: '2025-09-30', ctrlCvr: 0.10, liftMin: 0.15, liftMax: 0.20, avgRev: 49 },
  };
  const insAB = db.prepare('INSERT INTO ab_tests VALUES (?,?,?,?,?,?,?)');
  let assignId = 0;
  for (const testName of TESTS) {
    const cfg = TEST_CONFIG[testName];
    const testStart = Date.parse(cfg.start + 'T00:00:00Z');
    const testEnd   = Date.parse(cfg.end   + 'T00:00:00Z');
    const testDays  = Math.round((testEnd - testStart) / DAY);
    const lift = cfg.liftMin + rnd() * (cfg.liftMax - cfg.liftMin);
    // 每個測試分配約 600-700 位用戶
    const eligible = users.filter(u => u.signup_date <= cfg.end);
    const nAssign = Math.min(eligible.length, int(600, 700));
    // shuffle eligible subset
    const shuffled = eligible.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < nAssign; i++) {
      const u = shuffled[i];
      const variant = i < nAssign / 2 ? 'control' : 'treatment';
      const assigned_date = fmtDate(testStart + int(0, testDays) * DAY);
      const cvr = variant === 'control' ? cfg.ctrlCvr : cfg.ctrlCvr * (1 + lift);
      const converted = rnd() < cvr ? 1 : 0;
      const revenue = converted ? Math.round(cfg.avgRev * (0.8 + rnd() * 0.4) * 100) / 100 : 0;
      assignId += 1;
      insAB.run([assignId, testName, u.id, variant, assigned_date, converted, revenue]);
    }
  }
  insAB.free();

  db.run('COMMIT');
}
