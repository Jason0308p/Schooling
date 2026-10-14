/**
 * 練習資料集：「好禮客製」模擬電商公司（客製化贈品品牌，有 B2C 官網 + LINE 商店 + B2B 企業訂單）
 *
 * - 用固定種子的亂數產生器建立資料 → 每個人、每次開啟拿到的資料完全相同。
 * - 改動這個檔案的資料邏輯時，請把 version +1（見 docs/DATASET.md）。
 *   批改是「即時跑標準答案 vs 跑學員答案」比對，所以改資料不會讓題目失效，
 *   但課文裡若有寫死的數字要一併檢查。
 * - 這個模組必須保持「純 JS」：不可碰 window / document，讓 Node 驗證工具也能載入。
 */

export const dataset = {
  id: 'ecommerce',
  version: 1,
  name: '好禮客製 電商資料庫',
  description:
    '一間賣客製化贈品（保溫杯、馬克杯、帆布袋…）的品牌，資料期間 2025-07-01 ～ 2026-06-30。' +
    '包含會員、商品、訂單、訂單明細、廣告活動、廣告花費，以及類似 GA4 匯出的造訪與事件資料。',
  tables: [
    {
      name: 'customers',
      label: '會員',
      description: '每一列是一位註冊會員。類比：Shopify 的 Customers、CRM 的客戶主檔。',
      columns: [
        ['customer_id', 'INTEGER', '會員編號（主鍵）'],
        ['name', 'TEXT', '姓名'],
        ['email', 'TEXT', 'Email（注意：有少數資料大小寫或前後空白不一致）'],
        ['gender', 'TEXT', "性別：'F'、'M'，未填為 NULL"],
        ['birth_year', 'INTEGER', '出生年，未填為 NULL'],
        ['city', 'TEXT', "居住縣市，未填為 NULL（注意：有少數寫成「臺北市」）"],
        ['signup_date', 'TEXT', '註冊日 YYYY-MM-DD'],
        ['acquisition_channel', 'TEXT', "首次取得管道：organic / paid_search / paid_social / referral / email / direct"],
        ['membership_tier', 'TEXT', "會員等級：一般 / 銀卡 / 金卡"],
      ],
    },
    {
      name: 'products',
      label: '商品',
      description: '每一列是一個商品（SKU）。',
      columns: [
        ['product_id', 'INTEGER', '商品編號（主鍵）'],
        ['sku', 'TEXT', '商品料號'],
        ['product_name', 'TEXT', '商品名稱'],
        ['category', 'TEXT', '分類：保溫杯 / 馬克杯 / 帆布袋 / 筆記本 / T恤 / 禮盒'],
        ['price', 'INTEGER', '定價（新台幣）'],
        ['cost', 'INTEGER', '成本（新台幣）'],
        ['launch_date', 'TEXT', '上架日 YYYY-MM-DD'],
        ['is_active', 'INTEGER', '是否仍在販售：1 = 是、0 = 已下架'],
      ],
    },
    {
      name: 'orders',
      label: '訂單',
      description: '每一列是一張訂單（訂單層級）。商品明細在 order_items。',
      columns: [
        ['order_id', 'INTEGER', '訂單編號（主鍵）'],
        ['customer_id', 'INTEGER', '下單會員（外鍵 → customers.customer_id）'],
        ['order_date', 'TEXT', '下單日 YYYY-MM-DD'],
        ['status', 'TEXT', "訂單狀態：completed（完成）/ refunded（退款）/ cancelled（取消）/ pending（處理中）"],
        ['sales_channel', 'TEXT', '銷售通路：online_store / line_shop / b2b'],
        ['payment_method', 'TEXT', '付款方式：credit_card / line_pay / atm / cod'],
        ['coupon_code', 'TEXT', '使用的折扣碼，沒用為 NULL'],
        ['subtotal', 'INTEGER', '商品小計'],
        ['discount', 'INTEGER', '折扣金額'],
        ['shipping_fee', 'INTEGER', '運費'],
        ['total_amount', 'INTEGER', '實付金額 = subtotal - discount + shipping_fee'],
      ],
    },
    {
      name: 'order_items',
      label: '訂單明細',
      description: '每一列是訂單裡的一個商品。一張訂單可以有多列。',
      columns: [
        ['order_item_id', 'INTEGER', '明細編號（主鍵）'],
        ['order_id', 'INTEGER', '所屬訂單（外鍵 → orders.order_id）'],
        ['product_id', 'INTEGER', '商品（外鍵 → products.product_id）'],
        ['quantity', 'INTEGER', '數量'],
        ['unit_price', 'INTEGER', '成交單價（B2B 大量訂單有折扣）'],
      ],
    },
    {
      name: 'campaigns',
      label: '廣告活動',
      description: '行銷活動主檔。',
      columns: [
        ['campaign_id', 'INTEGER', '活動編號（主鍵）'],
        ['campaign_name', 'TEXT', '活動名稱'],
        ['platform', 'TEXT', '平台：google_ads / meta_ads / line / email'],
        ['objective', 'TEXT', '目標：conversion / traffic / awareness / retention'],
        ['start_date', 'TEXT', '開始日'],
        ['end_date', 'TEXT', '結束日'],
        ['budget', 'INTEGER', '總預算'],
      ],
    },
    {
      name: 'ad_spend',
      label: '廣告每日成效',
      description: '每個活動每天一列。類比：Google Ads / Meta 後台匯出的每日報表。',
      columns: [
        ['spend_date', 'TEXT', '日期'],
        ['campaign_id', 'INTEGER', '活動（外鍵 → campaigns.campaign_id）'],
        ['impressions', 'INTEGER', '曝光數'],
        ['clicks', 'INTEGER', '點擊數'],
        ['cost', 'REAL', '花費（新台幣）'],
        ['conversions', 'INTEGER', '平台回報的轉換數'],
      ],
    },
    {
      name: 'sessions',
      label: '網站造訪',
      description: '每一列是一次網站造訪（工作階段）。類比：GA4 的 session。',
      columns: [
        ['session_id', 'TEXT', '造訪編號（主鍵）'],
        ['customer_id', 'INTEGER', '已登入會員才有值，訪客為 NULL'],
        ['session_start', 'TEXT', '開始時間 YYYY-MM-DD HH:MM:SS'],
        ['source', 'TEXT', '來源：google / facebook / instagram / line / newsletter / (direct)'],
        ['medium', 'TEXT', '媒介：organic / cpc / paid_social / referral / email / (none)'],
        ['campaign_id', 'INTEGER', '來自廣告活動才有值'],
        ['device', 'TEXT', '裝置：mobile / desktop / tablet'],
        ['landing_page', 'TEXT', '到達頁路徑'],
      ],
    },
    {
      name: 'events',
      label: '網站事件',
      description: '每一列是一個使用者行為事件。類比：GA4 匯出到 BigQuery 的 events 表（已攤平）。',
      columns: [
        ['event_id', 'INTEGER', '事件編號（主鍵）'],
        ['session_id', 'TEXT', '所屬造訪（外鍵 → sessions.session_id）'],
        ['event_name', 'TEXT', 'page_view / view_item / add_to_cart / begin_checkout / purchase'],
        ['event_time', 'TEXT', '事件時間 YYYY-MM-DD HH:MM:SS'],
        ['product_id', 'INTEGER', '相關商品，沒有為 NULL'],
        ['value', 'REAL', '金額（purchase 事件才有）'],
      ],
    },
  ],
  build,
};

const SCHEMA_SQL = `
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT, gender TEXT, birth_year INTEGER,
  city TEXT, signup_date TEXT NOT NULL, acquisition_channel TEXT, membership_tier TEXT
);
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY, sku TEXT, product_name TEXT NOT NULL, category TEXT,
  price INTEGER, cost INTEGER, launch_date TEXT, is_active INTEGER
);
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(customer_id),
  order_date TEXT NOT NULL, status TEXT, sales_channel TEXT, payment_method TEXT, coupon_code TEXT,
  subtotal INTEGER, discount INTEGER, shipping_fee INTEGER, total_amount INTEGER
);
CREATE TABLE order_items (
  order_item_id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(order_id),
  product_id INTEGER REFERENCES products(product_id), quantity INTEGER, unit_price INTEGER
);
CREATE TABLE campaigns (
  campaign_id INTEGER PRIMARY KEY, campaign_name TEXT, platform TEXT, objective TEXT,
  start_date TEXT, end_date TEXT, budget INTEGER
);
CREATE TABLE ad_spend (
  spend_date TEXT, campaign_id INTEGER REFERENCES campaigns(campaign_id),
  impressions INTEGER, clicks INTEGER, cost REAL, conversions INTEGER,
  PRIMARY KEY (spend_date, campaign_id)
);
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY, customer_id INTEGER REFERENCES customers(customer_id),
  session_start TEXT, source TEXT, medium TEXT, campaign_id INTEGER, device TEXT, landing_page TEXT
);
CREATE TABLE events (
  event_id INTEGER PRIMARY KEY, session_id TEXT REFERENCES sessions(session_id),
  event_name TEXT, event_time TEXT, product_id INTEGER, value REAL
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
const fmtDateTime = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

function build(db, { seed = 20250701 } = {}) {
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

  const RANGE_START = Date.UTC(2025, 6, 1);
  const RANGE_END = Date.UTC(2026, 5, 30);
  const RANGE_DAYS = Math.round((RANGE_END - RANGE_START) / DAY);

  // ---------- products ----------
  const CATS = {
    保溫杯: { base: 680, items: ['經典保溫杯 500ml', '輕量保溫杯 350ml', '咖啡隨行杯', '雙層冰霸杯', '兒童保溫瓶', '商務保溫瓶'] },
    馬克杯: { base: 320, items: ['白瓷馬克杯', '琺瑯馬克杯', '變色馬克杯', '陶瓷對杯', '大容量馬克杯', '玻璃雙層杯'] },
    帆布袋: { base: 390, items: ['托特帆布袋', '束口後背袋', '雙面購物袋', '筆電收納袋', '迷你手提袋', '旅行收納袋'] },
    筆記本: { base: 260, items: ['A5 方格筆記本', '皮革手帳', '活頁筆記本', '口袋筆記本', '年度手帳', '素描本'] },
    T恤: { base: 490, items: ['純棉圓領 T 恤', '排汗運動衫', 'Polo 衫', '寬版落肩 T', '童裝 T 恤', '長袖 T 恤'] },
    禮盒: { base: 1280, items: ['新春禮盒', '中秋禮盒', '迎新禮盒', '感謝禮盒', '週年慶禮盒', '尾牙禮盒'] },
  };
  const products = [];
  const insP = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?,?,?)');
  let pid = 0;
  Object.entries(CATS).forEach(([cat, { base, items }], ci) => {
    items.forEach((nm, ii) => {
      pid += 1;
      const price = Math.round((base * (0.75 + rnd() * 0.6)) / 10) * 10;
      const cost = Math.round(price * (0.38 + rnd() * 0.17));
      const launch = rnd() < 0.7 ? Date.UTC(2024, int(0, 11), int(1, 28)) : RANGE_START + int(0, 300) * DAY;
      const active = pid % 13 === 0 ? 0 : 1;
      const p = { id: pid, cat, price, launch };
      products.push(p);
      insP.run([pid, `SKU-${String(ci + 1).padStart(2, '0')}${String(ii + 1).padStart(2, '0')}`, nm, cat, price, cost, fmtDate(launch), active]);
    });
  });
  insP.free();

  // ---------- customers ----------
  const SURN = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾'];
  const GIV = ['怡君', '雅婷', '志明', '家豪', '佳穎', '冠宇', '宗翰', '詩涵', '俊傑', '雅雯', '承恩', '欣怡', '柏翰', '思妤', '建宏', '品妍', '育誠', '郁婷', '彥廷', '心怡'];
  const CITIES = [['台北市', 30], ['新北市', 26], ['桃園市', 11], ['台中市', 12], ['高雄市', 10], ['新竹市', 6], ['台南市', 5]];
  const CHANNELS = [['organic', 30], ['paid_search', 20], ['paid_social', 22], ['referral', 9], ['email', 7], ['direct', 12]];
  const customers = [];
  const insC = db.prepare('INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?)');
  const CUST_START = Date.UTC(2025, 0, 1);
  for (let id = 1; id <= 480; id++) {
    const signup = CUST_START + int(0, Math.round((RANGE_END - 14 * DAY - CUST_START) / DAY)) * DAY;
    let city = wpick(CITIES);
    if (rnd() < 0.06) city = null;
    else if (city === '台北市' && rnd() < 0.12) city = '臺北市';
    let email = `user${id}@${pick(['gmail.com', 'yahoo.com.tw', 'hotmail.com', 'outlook.com'])}`;
    if (rnd() < 0.05) email = email.toUpperCase();
    if (rnd() < 0.03) email = ` ${email} `;
    const tier = wpick([['一般', 70], ['銀卡', 22], ['金卡', 8]]);
    const c = { id, signup, tier, channel: wpick(CHANNELS) };
    customers.push(c);
    insC.run([
      id, pick(SURN) + pick(GIV), email, rnd() < 0.08 ? null : (rnd() < 0.62 ? 'F' : 'M'),
      rnd() < 0.1 ? null : int(1965, 2004), city, fmtDate(signup), c.channel, tier,
    ]);
  }
  insC.free();

  // ---------- orders + order_items ----------
  // 禮品業季節性：11–12 月旺季、1 月（尾牙/春節）次旺
  const seasonW = (ms) => {
    const m = new Date(ms).getUTCMonth() + 1;
    return { 11: 1.8, 12: 2.2, 1: 1.5, 9: 1.2 }[m] || 1;
  };
  const drafts = [];
  for (const c of customers) {
    const r = rnd();
    let n = r < 0.22 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.92 ? int(3, 5) : int(6, 12);
    if (c.tier === '金卡') n += 3;
    const from = Math.max(c.signup, RANGE_START);
    const span = Math.round((RANGE_END - from) / DAY);
    for (let k = 0; k < n; k++) {
      let d;
      for (let tries = 0; tries < 20; tries++) {
        d = from + int(0, span) * DAY;
        if (rnd() * 2.2 < seasonW(d)) break;
      }
      drafts.push({ c, d, tie: rnd() });
    }
  }
  drafts.sort((a, b) => a.d - b.d || a.tie - b.tie);

  const insO = db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const insI = db.prepare('INSERT INTO order_items VALUES (?,?,?,?,?)');
  let itemId = 0;
  drafts.forEach(({ c, d }, idx) => {
    const orderId = 100000 + idx + 1;
    const channel = wpick([['online_store', 62], ['line_shop', 28], ['b2b', 10]]);
    const avail = products.filter((p) => p.launch <= d);
    const nItems = channel === 'b2b' ? int(1, 2) : wpick([[1, 50], [2, 30], [3, 14], [4, 6]]);
    const chosen = new Set();
    let subtotal = 0;
    while (chosen.size < Math.min(nItems, avail.length)) chosen.add(pick(avail));
    for (const p of chosen) {
      const qty = channel === 'b2b' ? int(15, 60) : wpick([[1, 70], [2, 22], [3, 8]]);
      const unit = channel === 'b2b' ? Math.round(p.price * 0.85) : p.price;
      subtotal += qty * unit;
      itemId += 1;
      insI.run([itemId, orderId, p.id, qty, unit]);
    }
    const month = new Date(d).getUTCMonth() + 1;
    let coupon = null;
    let discount = 0;
    if (channel !== 'b2b') {
      const r = rnd();
      if ((month === 11 || month === 12) && r < 0.3) { coupon = 'XMAS2025'; discount = Math.round(subtotal * 0.15); }
      else if (r < 0.08) { coupon = 'WELCOME100'; discount = Math.min(100, subtotal); }
      else if (c.tier !== '一般' && r < 0.2) { coupon = 'VIP10'; discount = Math.round(subtotal * 0.1); }
    }
    const shipping = subtotal - discount >= 1000 || channel === 'b2b' ? 0 : 80;
    const recent = RANGE_END - d < 5 * DAY;
    const status = recent && rnd() < 0.5 ? 'pending' : wpick([['completed', 86], ['refunded', 7], ['cancelled', 7]]);
    const pay = channel === 'b2b' ? 'atm' : wpick([['credit_card', 55], ['line_pay', 28], ['atm', 9], ['cod', 8]]);
    insO.run([orderId, c.id, fmtDate(d), status, channel, pay, coupon, subtotal, discount, shipping, subtotal - discount + shipping]);
  });
  insO.free();
  insI.free();

  // ---------- campaigns + ad_spend ----------
  const CAMPS = [
    [1, '品牌關鍵字_常態', 'google_ads', 'conversion', '2025-07-01', '2026-06-30', 360000],
    [2, '保溫杯_購物廣告', 'google_ads', 'conversion', '2025-08-01', '2026-03-31', 240000],
    [3, '聖誕禮物_再行銷', 'meta_ads', 'conversion', '2025-11-01', '2025-12-31', 150000],
    [4, '企業尾牙禮品_開發', 'google_ads', 'conversion', '2025-10-15', '2026-01-31', 200000],
    [5, 'IG_新品曝光', 'meta_ads', 'awareness', '2025-09-01', '2025-10-31', 90000],
    [6, 'LINE_官方帳號推播', 'line', 'retention', '2025-07-01', '2026-06-30', 60000],
    [7, '電子報_會員回購', 'email', 'retention', '2025-07-01', '2026-06-30', 24000],
    [8, '母親節_限時優惠', 'meta_ads', 'conversion', '2026-04-15', '2026-05-12', 80000],
  ];
  const insCa = db.prepare('INSERT INTO campaigns VALUES (?,?,?,?,?,?,?)');
  const insS = db.prepare('INSERT INTO ad_spend VALUES (?,?,?,?,?,?)');
  const campaigns = CAMPS.map(([id, name, platform, objective, s, e, budget]) => {
    insCa.run([id, name, platform, objective, s, e, budget]);
    const start = Date.parse(s + 'T00:00:00Z');
    const end = Date.parse(e + 'T00:00:00Z');
    const days = Math.round((end - start) / DAY) + 1;
    const daily = budget / days;
    for (let t = start; t <= end; t += DAY) {
      const cost = Math.round(daily * (0.7 + rnd() * 0.6) * seasonW(t) * 0.8 * 100) / 100;
      const cpc = platform === 'google_ads' ? 8 + rnd() * 14 : platform === 'meta_ads' ? 4 + rnd() * 8 : 1 + rnd() * 2;
      const clicks = Math.max(0, Math.round(cost / cpc));
      const ctr = platform === 'google_ads' ? 0.03 + rnd() * 0.05 : 0.008 + rnd() * 0.015;
      const impressions = Math.round(clicks / ctr);
      const cvr = objective === 'conversion' ? 0.01 + rnd() * 0.03 : 0.002 + rnd() * 0.01;
      insS.run([fmtDate(t), id, impressions, clicks, cost, Math.round(clicks * cvr)]);
    }
    return { id, platform, start, end };
  });
  insCa.free();
  insS.free();

  // ---------- sessions + events ----------
  const SOURCES = [
    [['google', 'organic'], 30], [['google', 'cpc'], 18], [['facebook', 'paid_social'], 12],
    [['instagram', 'paid_social'], 8], [['(direct)', '(none)'], 16], [['line', 'referral'], 9], [['newsletter', 'email'], 7],
  ];
  const LANDING = ['/', '/collections/tumblers', '/collections/mugs', '/collections/bags', '/pages/corporate-gifts', '/blogs/gift-guide', '/products/classic-tumbler'];
  const insSe = db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?,?,?,?)');
  const insE = db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)');
  let eventId = 0;
  for (let s = 1; s <= 4000; s++) {
    let day;
    for (let tries = 0; tries < 20; tries++) {
      day = RANGE_START + int(0, RANGE_DAYS) * DAY;
      if (rnd() * 2.2 < seasonW(day)) break;
    }
    const t0 = day + int(7 * 3600, 23 * 3600) * 1000 + int(0, 59) * 60000;
    const [source, medium] = wpick(SOURCES);
    let campaignId = null;
    const plat = medium === 'cpc' ? 'google_ads' : medium === 'paid_social' ? 'meta_ads' : medium === 'email' ? 'email' : source === 'line' ? 'line' : null;
    if (plat) {
      const live = campaigns.filter((c) => c.platform === plat && c.start <= day && day <= c.end);
      if (live.length && rnd() < 0.85) campaignId = pick(live).id;
    }
    const sid = `S${String(s).padStart(5, '0')}`;
    const cust = rnd() < 0.38 ? pick(customers).id : null;
    insSe.run([sid, cust, fmtDateTime(t0), source, medium, campaignId, wpick([['mobile', 68], ['desktop', 27], ['tablet', 5]]), pick(LANDING)]);

    let t = t0;
    const ev = (name, productId = null, value = null) => {
      eventId += 1;
      t += int(5, 90) * 1000;
      insE.run([eventId, sid, name, fmtDateTime(t), productId, value]);
    };
    const pv = int(1, 5);
    for (let i = 0; i < pv; i++) ev('page_view');
    if (rnd() < 0.58) {
      const p = pick(products);
      ev('view_item', p.id);
      if (rnd() < 0.34) {
        ev('add_to_cart', p.id);
        if (rnd() < 0.52) {
          ev('begin_checkout', p.id);
          if (rnd() < 0.56) ev('purchase', p.id, p.price * wpick([[1, 75], [2, 25]]));
        }
      }
    }
  }
  insSe.free();
  insE.free();

  db.run('COMMIT');
}
