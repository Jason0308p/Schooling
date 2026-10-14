/**
 * 學習進度儲存。
 *
 * 分層：
 *   ProgressStore（業務邏輯：答對、看解答、草稿、連續學習天數…）
 *     └─ StorageAdapter（存取實作：目前是 localStorage；未來可換成遠端 API，介面不變）
 *
 * 資料結構（v1）：
 * {
 *   schema: 1,
 *   exercises: { [exerciseId]: { status: 'attempted'|'solved', attempts, revealed, solvedAt, draft } },
 *   lessons:   { [lessonKey]: { visitedAt, completedAt } },   // lessonKey = `${courseId}/${lessonId}`
 *   activity:  { 'YYYY-MM-DD': 次數 },                       // 學員本機日期
 *   last:      { courseId, lessonId, at }
 * }
 * exerciseId / lessonId 一經發布就不可改名，否則學員的進度會對不上（見 docs/CONTENT_GUIDE.md）。
 */

export class LocalStorageAdapter {
  constructor(key) { this.key = key; }
  load() {
    try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch { return null; }
  }
  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); return true; } catch { return false; }
  }
  clear() { try { localStorage.removeItem(this.key); } catch { /* ignore */ } }
}

const SCHEMA = 1;
const blank = () => ({ schema: SCHEMA, exercises: {}, lessons: {}, activity: {}, last: null });

function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export class ProgressStore {
  constructor(adapter) {
    this.adapter = adapter;
    this.data = this.migrate(adapter.load()) || blank();
    this.listeners = new Set();
    this.saveTimer = null;
  }

  migrate(d) {
    if (!d || typeof d !== 'object') return null;
    // 未來 schema 升級寫在這裡：if (d.schema === 1) { ...; d.schema = 2; }
    return { ...blank(), ...d };
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((fn) => fn(this.data)); }

  persist({ immediate = false } = {}) {
    clearTimeout(this.saveTimer);
    if (immediate) this.adapter.save(this.data);
    else this.saveTimer = setTimeout(() => this.adapter.save(this.data), 400);
  }

  touchActivity() {
    const k = localDate();
    this.data.activity[k] = (this.data.activity[k] || 0) + 1;
  }

  ex(id) { return this.data.exercises[id] || null; }

  recordAttempt(id, correct) {
    const e = this.data.exercises[id] || { status: 'attempted', attempts: 0, revealed: false };
    e.attempts += 1;
    if (correct && e.status !== 'solved') { e.status = 'solved'; e.solvedAt = new Date().toISOString(); }
    this.data.exercises[id] = e;
    this.touchActivity();
    this.persist({ immediate: true });
    this.emit();
  }

  markRevealed(id) {
    const e = this.data.exercises[id] || { status: 'attempted', attempts: 0 };
    e.revealed = true;
    this.data.exercises[id] = e;
    this.persist({ immediate: true });
    this.emit();
  }

  saveDraft(id, sql) {
    const e = this.data.exercises[id] || { status: 'attempted', attempts: 0, revealed: false };
    e.draft = sql;
    this.data.exercises[id] = e;
    this.persist();
  }

  visitLesson(courseId, lessonId) {
    const k = `${courseId}/${lessonId}`;
    this.data.lessons[k] = { ...(this.data.lessons[k] || {}), visitedAt: new Date().toISOString() };
    this.data.last = { courseId, lessonId, at: new Date().toISOString() };
    this.persist();
  }

  completeLesson(courseId, lessonId) {
    const k = `${courseId}/${lessonId}`;
    const l = this.data.lessons[k] || {};
    if (!l.completedAt) {
      l.completedAt = new Date().toISOString();
      this.data.lessons[k] = l;
      this.touchActivity();
      this.persist({ immediate: true });
      this.emit();
    }
  }

  isLessonDone(courseId, lesson) {
    const exIds = (lesson.exercises || []).map((e) => e.id);
    if (exIds.length) return exIds.every((id) => this.ex(id)?.status === 'solved');
    return !!this.data.lessons[`${courseId}/${lesson.id}`]?.completedAt;
  }

  /** 連續學習天數（今天或昨天有活動才算延續） */
  streak() {
    const days = new Set(Object.keys(this.data.activity));
    const d = new Date();
    if (!days.has(localDate(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(localDate(d))) { n += 1; d.setDate(d.getDate() - 1); }
    return n;
  }

  exportJSON() { return JSON.stringify(this.data, null, 2); }

  importJSON(text) {
    const d = this.migrate(JSON.parse(text));
    if (!d || !d.exercises) throw new Error('格式不正確');
    this.data = d;
    this.persist({ immediate: true });
    this.emit();
  }

  reset() {
    this.data = blank();
    this.adapter.clear();
    this.emit();
  }
}
