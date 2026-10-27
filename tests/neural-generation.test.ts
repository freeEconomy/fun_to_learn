import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function activeFiles() {
  const paths = [
    'lib/forest/speech-config.ts',
    'lib/forest/speech-index.json',
    ...readdirSync('public/speech')
      .sort()
      .map((file) => `public/speech/${file}`),
  ];
  return paths.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]);
}

for (const corrupted of [false, true]) {
  test(`neural ${corrupted ? 'corrupted' : 'missing'} model aborts without changing any active speech file`, () => {
    const models = mkdtempSync(join(tmpdir(), 'forest-model-test-'));
    const before = activeFiles();
    try {
      if (corrupted) {
        writeFileSync(join(models, 'kokoro-v1.0.onnx'), 'not the official model');
        writeFileSync(join(models, 'voices-v1.0.bin'), 'not official voice data');
      }
      const child = spawnSync(
        process.execPath,
        ['--import', 'tsx', 'scripts/generate-neural-speech.ts'],
        {
          encoding: 'utf8',
          env: { ...process.env, KOKORO_MODEL_DIR: models, KOKORO_PYTHON: 'python3' },
          timeout: 20000,
        },
      );
      assert.ifError(child.error);
      assert.equal(child.status, 1);
      assert.match(child.stderr, corrupted ? /Model checksum mismatch/ : /Missing model/);
      assert.deepEqual(activeFiles(), before);
    } finally {
      rmSync(models, { recursive: true, force: true });
    }
  });
}
