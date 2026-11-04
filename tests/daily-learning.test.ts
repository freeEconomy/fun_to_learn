import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dailyAdventureIds, dailyPhotoWords, learningDay } from '../lib/forest/daily-learning';
import { currentDiscoverySession, readDiscovery } from '../lib/forest/discovery';
import { characters, isValidSymbol, legacySymbols } from '../lib/forest/characters';
import { speechAudioSource } from '../lib/forest/speech-audio';
import credits from '../lib/forest/character-art-credits.json';

test('daily photo packs rotate across Korean midnight, remain stable that day and cover the catalog', () => {
  const seen = new Set<string>();
  for (let n = 0; n < 80; n++) {
    const now = new Date(Date.parse('2026-11-04T03:00:00Z') + n * 86400000).toISOString();
    const tomorrow = new Date(Date.parse(now) + 86400000).toISOString();
    const pack = dailyPhotoWords(now);
    assert.equal(pack.length, 6);
    assert.equal(new Set(pack.map((word) => word.id)).size, 6);
    assert.ok(
      pack.every((word) => !dailyPhotoWords(tomorrow).some((other) => word.id === other.id)),
    );
    assert.deepEqual(
      dailyAdventureIds(now),
      pack.slice(0, 3).map((word) => word.id),
    );
    for (const word of pack) {
      seen.add(word.id);
      assert.ok(speechAudioSource(word.name));
      assert.ok(speechAudioSource(word.sentences[0]));
    }
  }
  assert.equal(seen.size, 40);
  assert.deepEqual(
    dailyPhotoWords('2026-11-03T15:00:00Z'),
    dailyPhotoWords('2026-11-04T14:59:59Z'),
  );
  assert.notDeepEqual(
    dailyAdventureIds('2026-11-04T14:59:59Z'),
    dailyAdventureIds('2026-11-04T15:00:00Z'),
  );
});

test('same-day adventure resumes, yesterday expires, and undated legacy sessions migrate without losing results', () => {
  const now = '2026-11-04T12:00:00+09:00';
  const raw = {
    session: { ids: ['soccer', 'dog', 'apple'], results: [{ id: 'soccer', first: true }] },
  };
  const progress = readDiscovery(raw, now);
  assert.equal(progress.session?.day, learningDay(now));
  assert.deepEqual(progress.session?.results, raw.session.results);
  assert.ok(currentDiscoverySession(progress, now));
  assert.equal(currentDiscoverySession(progress, '2026-11-05T00:00:00+09:00'), null);
  assert.equal(progress.session?.results.length, 1);
  assert.equal(
    readDiscovery({ session: { ...raw.session, day: '2026-02-30' } }, now).session,
    null,
  );
});

test('eight distinct Pokemon marks have verified original images and legacy symbols remain valid', () => {
  assert.equal(characters.length, 8);
  assert.equal(new Set(characters.map((character) => character.id)).size, 8);
  const hashes = new Set<string>();
  for (const character of characters) {
    const credit = credits.find((credit) => credit.id === character.id)!;
    assert.ok(credit && credit.source.startsWith('https://github.com/PokeAPI/sprites/'));
    const bytes = readFileSync(`public/characters/${character.id}.png`);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(bytes.readUInt32BE(16) >= 240 && bytes.readUInt32BE(20) >= 240);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash, credit.sha256);
    hashes.add(hash);
    assert.ok(isValidSymbol(character.id));
  }
  assert.equal(hashes.size, 8);
  assert.ok(legacySymbols.every(isValidSymbol));
  assert.equal(isValidSymbol('unknown'), false);
});
