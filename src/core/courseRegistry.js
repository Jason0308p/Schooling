/**
 * 課程註冊表：負責載入課程目錄、課程設定檔、單元內容（延遲載入），
 * 並提供「攤平的課程地圖」給側欄 / 上一課下一課 / 進度計算使用。
 *
 * 內容層級：Catalog → Course → Unit（單元）→ Lesson（課）→ Exercise（練習題）
 */
import { catalog } from '../../content/catalog.js';

const courseCache = new Map();

export function listCatalog() { return catalog; }

export async function loadCourse(courseId) {
  if (courseCache.has(courseId)) return courseCache.get(courseId);
  const entry = catalog.find((c) => c.id === courseId && c.load);
  if (!entry) return null;
  const { course } = await entry.load();
  const dataset = course.dataset ? (await course.dataset()).dataset : null;

  const units = [];
  for (const u of course.units) {
    if (u.status === 'published' && u.load) {
      const mod = await u.load();
      units.push({ ...u, lessons: mod.unit.lessons });
    } else {
      units.push({ ...u, lessons: [] });
    }
  }

  // 攤平所有已發布的課，供導覽用
  const flat = [];
  units.forEach((u) => u.lessons.forEach((l) => flat.push({ unit: u, lesson: l })));

  const loaded = { ...course, units, dataset, flat };
  courseCache.set(courseId, loaded);
  return loaded;
}

export function findLesson(course, lessonId) {
  const idx = course.flat.findIndex((x) => x.lesson.id === lessonId);
  if (idx < 0) return null;
  return { ...course.flat[idx], index: idx, prev: course.flat[idx - 1] || null, next: course.flat[idx + 1] || null };
}

export function courseStats(course, progress) {
  let exTotal = 0, exSolved = 0, lessonsDone = 0;
  for (const { lesson } of course.flat) {
    for (const e of lesson.exercises || []) {
      exTotal += 1;
      if (progress.ex(e.id)?.status === 'solved') exSolved += 1;
    }
    if (progress.isLessonDone(course.id, lesson)) lessonsDone += 1;
  }
  const plannedExercises = course.units.reduce((s, u) => s + (u.plannedExercises || 0), 0);
  return {
    exTotal, exSolved, lessonsDone, lessonsTotal: course.flat.length,
    plannedExercises,
    pct: exTotal ? Math.round((exSolved / exTotal) * 100) : 0,
  };
}

export function unitStats(course, unit, progress) {
  let total = 0, solved = 0;
  for (const l of unit.lessons) for (const e of l.exercises || []) {
    total += 1;
    if (progress.ex(e.id)?.status === 'solved') solved += 1;
  }
  return { total, solved, pct: total ? Math.round((solved / total) * 100) : 0 };
}

/** 下一個該學的課：第一個還沒完成的課 */
export function nextLesson(course, progress) {
  return course.flat.find(({ lesson }) => !progress.isLessonDone(course.id, lesson)) || course.flat[course.flat.length - 1];
}
