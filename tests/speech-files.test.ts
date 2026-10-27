import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { speechTexts } from '../lib/forest/speech-catalog';
import { normalizeSpeech } from '../lib/forest/speech-text';
import { speechAudioSource, canPlaySpeechAudio } from '../lib/forest/speech-audio';
import index from '../lib/forest/speech-index.json';
import { speechVoice, speechPlaybackRate } from '../lib/forest/speech-config';

test('every current spoken word, sentence, story and game challenge has a unique real MP3', () => {
  assert.deepEqual(Object.keys(index), speechTexts);
  assert.equal(new Set(Object.values(index)).size, speechTexts.length);
  for (const text of speechTexts) {
    const file = (index as Record<string, string>)[text];
    assert.equal(
      file,
      createHash('sha256').update(`${speechVoice.id}\n${text}`).digest('hex').slice(0, 32) + '.mp3',
    );
    const bytes = readFileSync(`public/speech/${file}`);
    assert.ok(bytes.length > 900, text);
    assert.equal(bytes.subarray(0, 3).toString(), 'ID3', text);
    assert.equal(speechAudioSource(text), `/speech/${file}`);
  }
  assert.equal(speechAudioSource('“Let’s play soccer!”'), speechAudioSource("Let's play soccer!"));
  assert.equal(speechAudioSource('A newly added ungenerated phrase'), undefined);
  assert.equal(normalizeSpeech('  “I  like soccer.”  '), 'I like soccer.');
});
test('male voice is consistent on MP3-capable browsers and default playback does not time-stretch it', () => {
  assert.equal(speechVoice.voice, 'rms');
  assert.equal(speechVoice.gender, 'male');
  assert.equal(speechVoice.bitrate, '96k');
  const meta = JSON.parse(readFileSync('public/speech/voice.json', 'utf8'));
  assert.equal(meta.id, speechVoice.id);
  assert.equal(meta.gender, 'male');
  assert.equal(meta.defaultPlaybackRate, 1);
  assert.equal(speechPlaybackRate(0.85), 1);
  assert.equal(speechPlaybackRate(0.65), 0.85);
  assert.equal(speechPlaybackRate(1), 1.1);
  assert.equal(
    canPlaySpeechAudio({ canPlayType: () => 'probably' } as unknown as HTMLAudioElement),
    true,
  );
  assert.equal(canPlaySpeechAudio({ canPlayType: () => '' } as unknown as HTMLAudioElement), false);
  assert.equal(canPlaySpeechAudio(null), false);
});
