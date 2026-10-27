import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { speechTexts } from '../lib/forest/speech-catalog';
import { normalizeSpeech } from '../lib/forest/speech-text';
import { speechAudioSource, usesMediaNarration } from '../lib/forest/speech-audio';
import index from '../lib/forest/speech-index.json';

test('every current spoken word, sentence, story and game challenge has a unique real MP3', () => {
  assert.deepEqual(Object.keys(index), speechTexts);
  assert.equal(new Set(Object.values(index)).size, speechTexts.length);
  for (const text of speechTexts) {
    const file = (index as Record<string, string>)[text];
    assert.equal(file, createHash('sha256').update(text).digest('hex').slice(0, 32) + '.mp3');
    const bytes = readFileSync(`public/speech/${file}`);
    assert.ok(bytes.length > 900, text);
    assert.equal(bytes.subarray(0, 3).toString(), 'ID3', text);
    assert.equal(speechAudioSource(text), `/speech/${file}`);
  }
  assert.equal(speechAudioSource('“Let’s play soccer!”'), speechAudioSource("Let's play soccer!"));
  assert.equal(speechAudioSource('A newly added ungenerated phrase'), undefined);
  assert.equal(normalizeSpeech('  “I  like soccer.”  '), 'I like soccer.');
});
test('iPhone and desktop-mode iPad use files; desktop and Android retain device voices', () => {
  const nav = (userAgent: string, platform = '', maxTouchPoints = 0) =>
    ({ userAgent, platform, maxTouchPoints }) as Navigator;
  assert.equal(usesMediaNarration(nav('iPhone')), true);
  assert.equal(usesMediaNarration(nav('Macintosh', 'MacIntel', 5)), true);
  assert.equal(usesMediaNarration(nav('Macintosh', 'MacIntel')), false);
  assert.equal(usesMediaNarration(nav('Android')), false);
});
