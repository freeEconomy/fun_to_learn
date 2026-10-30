import { test } from 'node:test';
import assert from 'node:assert/strict';
import { words } from '../lib/forest/content';
import { gameModes, emptyAdventure, readAdventure, recordActivity } from '../lib/forest/adventures';
import {
  gameDescriptions,
  gameSettings,
  memoryWords,
  listeningRounds,
  sentenceRounds,
  sentenceTokens,
  soccerRounds,
  spellingRounds,
  spellingLetters,
  deliveryRounds,
  deliveryShops,
  sequenceRounds,
  gameScore,
} from '../lib/forest/game-challenges';
import { speechAudioSource } from '../lib/forest/speech-audio';

test('both levels generate solvable existing games with unique targets and closer challenge distractors', () => {
  for (const level of ['practice', 'challenge'] as const)
    for (let run = 0; run < 60; run++) {
      const memory = memoryWords(level);
      assert.equal(memory.length, gameSettings[level].pairs);
      assert.equal(new Set(memory).size, memory.length);
      const listening = listeningRounds(level);
      assert.equal(listening.length, gameSettings[level].listen);
      assert.equal(new Set(listening.map((round) => round.target.id)).size, listening.length);
      for (const round of listening) {
        assert.equal(round.options.length, gameSettings[level].options);
        assert.equal(new Set(round.options).size, round.options.length);
        assert.equal(round.options.filter((id) => id === round.target.id).length, 1);
        if (level === 'challenge') {
          const available = words.filter(
            (word) => word.category === round.target.category && word.id !== round.target.id,
          ).length;
          assert.equal(
            round.options.filter(
              (id) =>
                id !== round.target.id &&
                words.find((word) => word.id === id)!.category === round.target.category,
            ).length,
            Math.min(3, available),
          );
        }
        assert.ok(speechAudioSource(round.target.name));
      }
      const train = sentenceRounds(level);
      assert.equal(train.length, gameSettings[level].train);
      for (const round of train) {
        const tokens = sentenceTokens(round.english, level);
        assert.equal(
          tokens.length,
          round.english.split(' ').length + (level === 'challenge' ? 1 : 0),
        );
        assert.equal(new Set(tokens.map((token) => token.id)).size, tokens.length);
        assert.equal(
          tokens
            .filter((token) => token.id >= 0)
            .sort((a, b) => a.id - b.id)
            .map((token) => token.text)
            .join(' '),
          round.english,
        );
        assert.ok(speechAudioSource(round.english), round.english);
      }
      const soccer = soccerRounds(level);
      assert.equal(soccer.length, gameSettings[level].soccer);
      assert.equal(new Set(soccer.map((round) => round.answer)).size, soccer.length);
      for (const round of soccer) {
        assert.equal(new Set(round.options).size, 3);
        assert.ok(round.options.includes(round.answer));
        assert.ok(speechAudioSource(round.answer));
      }
    }
});

test('new games handle repeated letters, exclusive destinations, longer sequences and reuse generated AI audio', () => {
  const allIds = deliveryShops.flatMap((shop) => shop.wordIds);
  assert.equal(new Set(allIds).size, allIds.length);
  for (const level of ['practice', 'challenge'] as const)
    for (let run = 0; run < 60; run++) {
      const spelling = spellingRounds(level);
      assert.equal(spelling.length, gameSettings[level].spell);
      assert.equal(new Set(spelling.map((round) => round.target.id)).size, spelling.length);
      for (const round of spelling) {
        const original = round.letters
          .filter((tile) => tile.id < round.target.name.length)
          .sort((a, b) => a.id - b.id);
        assert.equal(original.map((tile) => tile.text).join(''), round.target.name);
        assert.equal(new Set(round.letters.map((tile) => tile.id)).size, round.letters.length);
        assert.equal(
          round.letters.length,
          round.target.name.length + (level === 'challenge' ? 2 : 0),
        );
        assert.ok(speechAudioSource(round.target.name));
      }
      if (level === 'challenge')
        assert.ok(spelling.slice(4).every((round) => round.target.name.length >= 5));
      const delivery = deliveryRounds(level);
      assert.equal(delivery.length, gameSettings[level].delivery);
      assert.equal(new Set(delivery.map((round) => round.target.id)).size, delivery.length);
      for (const round of delivery) {
        assert.equal(
          deliveryShops.filter((shop) => shop.wordIds.includes(round.target.id)).length,
          1,
        );
        assert.ok(
          deliveryShops.find((shop) => shop.id === round.shop)!.wordIds.includes(round.target.id),
        );
        assert.ok(speechAudioSource(round.target.name));
      }
      const sequence = sequenceRounds(level);
      assert.equal(sequence.length, gameSettings[level].sequence);
      for (const [n, round] of sequence.entries()) {
        assert.equal(round.target.length, (level === 'practice' ? 2 : 3) + (n >= 2 ? 1 : 0));
        assert.equal(round.options.length, level === 'practice' ? 4 : 6);
        assert.equal(new Set(round.options).size, round.options.length);
        assert.ok(round.target.every((id) => round.options.includes(id)));
        assert.ok(
          round.target.every((id) => speechAudioSource(words.find((word) => word.id === id)!.name)),
        );
      }
    }
  const banana = spellingLetters('banana', 'challenge');
  assert.equal(banana.filter((tile) => tile.text === 'a').length, 3);
  assert.equal(banana.filter((tile) => tile.text === 'n').length, 2);
  assert.equal(new Set(banana.map((tile) => tile.id)).size, 8);
});

test('seven games keep scores within 50–100 and share the existing daily reward cap across levels', () => {
  for (const total of [4, 5, 6, 8])
    for (let correct = 0; correct <= total; correct++) {
      assert.ok(Number.isInteger(gameScore(correct, total)));
      assert.ok(gameScore(correct, total) >= 50 && gameScore(correct, total) <= 100);
    }
  assert.equal(gameScore(0, 6), 50);
  assert.equal(gameScore(6, 6), 100);
  assert.equal(gameScore(5, 6), 92);
  let progress = emptyAdventure;
  for (const mode of gameModes) {
    assert.ok(gameDescriptions[mode.id].challenge && gameDescriptions[mode.id].practice);
    const first = recordActivity(progress, `game:${mode.id}`, 92, '2026-10-30T09:00:00Z');
    assert.equal(first.pointsEarned, 10);
    const repeat = recordActivity(first.progress, `game:${mode.id}`, 100, '2026-10-30T09:01:00Z');
    assert.equal(repeat.pointsEarned, 0);
    progress = repeat.progress;
  }
  assert.equal(progress.activityRecords.length, 7);
  assert.deepEqual(readAdventure(progress), progress);
  assert.ok(progress.activityRecords.every((record) => record.score === 100));
});
