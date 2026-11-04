import { words } from './content';
import { dailyAdventureIds, learningDay } from './daily-learning';
export { learningDay } from './daily-learning';

export type DiscoveryResult = { id: string; first: boolean };
export type DiscoveryEntry = { last: string; due: string; streak: number; needsReview: boolean };
export type DiscoverySession = { ids: string[]; results: DiscoveryResult[]; day: string };
export type DiscoveryProgress = {
  entries: Record<string, DiscoveryEntry>;
  days: string[];
  session: DiscoverySession | null;
};
export const emptyDiscovery: DiscoveryProgress = { entries: {}, days: [], session: null };
const known = (id: unknown): id is string =>
  typeof id === 'string' && words.some((w) => w.id === id);
const validDate = (date: unknown): date is string =>
  typeof date === 'string' && Number.isFinite(Date.parse(date));
const validDay = (date: unknown): date is string =>
  typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  validDate(date) &&
  new Date(date).toISOString().slice(0, 10) === date;

export function readDiscovery(raw: unknown, now = new Date().toISOString()): DiscoveryProgress {
  if (!raw || typeof raw !== 'object') return { ...emptyDiscovery };
  const p = raw as DiscoveryProgress;
  const entries: DiscoveryProgress['entries'] = {};
  for (const [id, entry] of Object.entries(p.entries || {})) {
    if (
      known(id) &&
      entry &&
      validDate(entry.last) &&
      validDate(entry.due) &&
      Number.isInteger(entry.streak) &&
      entry.streak >= 0 &&
      entry.streak <= 1000 &&
      typeof entry.needsReview === 'boolean'
    )
      entries[id] = entry;
  }
  const days = Array.isArray(p.days)
    ? [...new Set(p.days.filter(validDay))].sort().slice(-365)
    : [];
  let session: DiscoverySession | null = null;
  const s = p.session;
  if (
    s &&
    Array.isArray(s.ids) &&
    s.ids.length === 3 &&
    s.ids.every(known) &&
    new Set(s.ids).size === 3 &&
    Array.isArray(s.results) &&
    s.results.length < 3 &&
    s.results.every((r, i) => r && r.id === s.ids[i] && typeof r.first === 'boolean') &&
    (s.day === undefined || validDay(s.day))
  )
    session = { ids: s.ids, results: s.results, day: s.day || learningDay(now) };
  return { entries, days, session };
}

export function discoveryReviewIds(
  progress: DiscoveryProgress,
  records: { word: string; date: string; review: boolean }[],
  now = new Date().toISOString(),
): string[] {
  const latest = [...new Map(records.map((r) => [r.word, r])).values()];
  const quizReviews = latest
    .filter(
      (r) =>
        r.review &&
        (!progress.entries[r.word] ||
          progress.entries[r.word].last < r.date ||
          progress.entries[r.word].needsReview),
    )
    .map((r) => r.word);
  const due = Object.entries(progress.entries)
    .filter(([, e]) => e.needsReview || learningDay(e.due) <= learningDay(now))
    .sort(
      (a, b) =>
        Number(b[1].needsReview) - Number(a[1].needsReview) || a[1].due.localeCompare(b[1].due),
    )
    .map(([id]) => id);
  return [...new Set([...quizReviews, ...due])].filter(known);
}

export function discoveryPlan(
  _progress: DiscoveryProgress,
  _records: { word: string; date: string; review: boolean }[],
  now = new Date().toISOString(),
): string[] {
  // The daily pack stays stable after completion. Review suggestions remain available separately.
  return dailyAdventureIds(now);
}

export function currentDiscoverySession(
  progress: DiscoveryProgress,
  now = new Date().toISOString(),
) {
  return progress.session?.day === learningDay(now) ? progress.session : null;
}

export function finishDiscovery(
  progress: DiscoveryProgress,
  results: DiscoveryResult[],
  now = new Date().toISOString(),
): DiscoveryProgress {
  if (
    !validDate(now) ||
    results.length !== 3 ||
    new Set(results.map((r) => r.id)).size !== 3 ||
    !results.every((r) => known(r.id) && typeof r.first === 'boolean')
  )
    throw Error('Invalid discovery completion');
  const entries = { ...progress.entries };
  for (const result of results) {
    const previous = entries[result.id];
    const sameDay = previous && learningDay(previous.last) === learningDay(now);
    const streak = result.first
      ? Math.min(1000, sameDay ? Math.max(1, previous.streak) : (previous?.streak || 0) + 1)
      : 0;
    entries[result.id] = {
      last: now,
      due: new Date(
        Date.parse(now) + (result.first ? Math.min(7, streak + 1) : 1) * 86400000,
      ).toISOString(),
      streak,
      needsReview: !result.first,
    };
  }
  return {
    entries,
    days: [...new Set([...progress.days, learningDay(now)])].sort().slice(-365),
    session: null,
  };
}
