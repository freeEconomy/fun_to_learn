// Run explicitly during development; deployed builds only serve the committed MP3 files.
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { speechTexts } from '../lib/forest/speech-catalog';

const work = mkdtempSync(join(tmpdir(), 'forest-speech-'));
mkdirSync('public/speech', { recursive: true });
const index: Record<string, string> = {};
let cursor = 0;
async function worker() {
  while (cursor < speechTexts.length) {
    const n = cursor++;
    const text = speechTexts[n];
    const name = createHash('sha256').update(text).digest('hex').slice(0, 32) + '.mp3';
    const input = join(work, `${n}.txt`);
    writeFileSync(input, text);
    await new Promise<void>((resolve, reject) => {
      const p = spawn(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-nostdin',
          '-f',
          'lavfi',
          '-i',
          `flite=textfile=${input}:voice=slt`,
          '-ar',
          '24000',
          '-ac',
          '1',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '48k',
          '-map_metadata',
          '-1',
          '-y',
          `public/speech/${name}`,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      );
      let error = '';
      p.stderr.on('data', (d) => (error += d.toString()));
      p.on('error', reject);
      p.on('close', (code) => (code === 0 ? resolve() : reject(Error(error))));
    });
    index[text] = name;
    if ((n + 1) % 100 === 0) process.stdout.write(`${n + 1}/${speechTexts.length}\n`);
  }
}
async function main() {
  try {
    await Promise.all(Array.from({ length: 4 }, () => worker()));
    const ordered = Object.fromEntries(speechTexts.map((text) => [text, index[text]]));
    writeFileSync('lib/forest/speech-index.json', JSON.stringify(ordered, null, 2) + '\n');
    writeFileSync(
      'public/speech/NOTICE.txt',
      `English learning audio generated locally with CMU Flite (female American English SLT voice), FFmpeg and libmp3lame.\n24 kHz mono MP3, 48 kbit/s. No remote TTS requests are made by the app.\nFlite source and voice licensing: https://github.com/festvox/flite\nThe following system package copyright and license notices accompany the synthesis engine and voice:\n\n` +
        readFileSync('/usr/share/doc/libflite1/copyright', 'utf8'),
    );
    process.stdout.write(`Generated ${speechTexts.length} speech clips.\n`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
