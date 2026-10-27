import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  discoveryPlan,
  emptyDiscovery,
  finishDiscovery,
  learningDay,
  readDiscovery,
} from '../lib/forest/discovery';
import { words } from '../lib/forest/content';
const now = '2026-10-27T12:00:00.000Z';
const results = [
  { id: 'soccer', first: false },
  { id: 'dog', first: true },
  { id: 'apple', first: true },
];
test('old and corrupted discovery profiles preserve only safe entries and resumable prefixes', () => {
  assert.deepEqual(readDiscovery(undefined), emptyDiscovery);
  const p = finishDiscovery(emptyDiscovery, results, now);
  const loaded = readDiscovery({
    ...p,
    entries: { ...p.entries, cat: { last: 'bad' }, xyz: p.entries.dog },
    days: ['2026-02-30', 'bad', '2026-10-27', '2026-10-27'],
    session: { ids: ['dog', 'cat', 'soccer'], results: [{ id: 'dog', first: false }] },
  });
  assert.deepEqual(Object.keys(loaded.entries), ['soccer', 'dog', 'apple']);
  assert.deepEqual(loaded.days, ['2026-10-27']);
  assert.equal(loaded.session?.results.length, 1);
  for (const session of [
    { ids: ['dog', 'dog', 'cat'], results: [] },
    { ids: ['dog', 'cat', 'soccer'], results: [{ id: 'cat', first: true }] },
    { ids: ['dog', 'cat', 'missing'], results: [] },
  ])
    assert.equal(readDiscovery({ session }).session, null);
});
test('plans start with a football interest, prefer overdue or mistaken words, and retire repaired quiz mistakes', () => {
  assert.deepEqual(discoveryPlan(emptyDiscovery, [], now), ['soccer', 'dog', 'apple']);
  const p = finishDiscovery(emptyDiscovery, results, now);
  assert.equal(discoveryPlan(p, [], now)[0], 'soccer');
  const record = { word: 'cat', date: '2026-10-26T12:00:00Z', review: true };
  assert.equal(discoveryPlan(p, [record], now)[0], 'cat');
  const repaired = finishDiscovery(
    p,
    [
      { id: 'cat', first: true },
      { id: 'bus', first: true },
      { id: 'train', first: true },
    ],
    now,
  );
  assert.ok(!discoveryPlan(repaired, [record], now).includes('cat'));
  const due = discoveryPlan(p, [], '2026-10-30T12:00:00Z');
  assert.ok(due.includes('dog'));
});
test('completion schedules recall and grants just one non-consecutive stamp per Korean calendar day', () => {
  const p = finishDiscovery(emptyDiscovery, results, now);
  assert.equal(learningDay(p.entries.soccer.due), '2026-10-28');
  assert.equal(learningDay(p.entries.dog.due), '2026-10-29');
  assert.equal(p.entries.soccer.needsReview, true);
  assert.deepEqual(emptyDiscovery.entries, {});
  const replay = finishDiscovery(p, results, '2026-10-27T13:00:00Z');
  assert.equal(replay.days.length, 1);
  assert.equal(replay.entries.dog.streak, 1);
  const tomorrow = finishDiscovery(replay, results, '2026-10-27T15:00:00Z');
  assert.equal(tomorrow.days.length, 2);
  assert.equal(tomorrow.entries.dog.streak, 2);
  const afterBreak = finishDiscovery(tomorrow, results, '2026-11-02T12:00:00Z');
  assert.equal(afterBreak.days.length, 3);
  assert.throws(() => finishDiscovery(p, results.slice(0, 2), now));
  assert.throws(() => finishDiscovery(p, [results[0], results[0], results[0]], now));
});
test('all learned words still produce exactly three unique valid review targets', () => {
  let p = readDiscovery(undefined);
  for (let i = 0; i < words.length; i += 3) {
    const ids = [
      ...new Set([...words.slice(i, i + 3).map((w) => w.id), ...words.map((w) => w.id)]),
    ].slice(0, 3);
    p = finishDiscovery(
      p,
      ids.map((id) => ({ id, first: true })),
      now,
    );
  }
  const plan = discoveryPlan(p, [], now);
  assert.equal(plan.length, 3);
  assert.equal(new Set(plan).size, 3);
  assert.ok(plan.every((id) => p.entries[id]));
});
