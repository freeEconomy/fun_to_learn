// Explicit development command; Vercel never installs or runs the neural model.
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { speechTexts } from '../lib/forest/speech-catalog';
import voice from './neural-speech/voice.json';

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(Error(`${command} exited with ${code}`)),
    );
  });
}

async function main() {
  const sample = process.argv.includes('--sample');
  if (process.argv.slice(2).some((arg) => arg !== '--sample'))
    throw Error('Only --sample is supported. See docs/neural-speech.md.');
  if (!process.env.KOKORO_MODEL_DIR)
    throw Error('KOKORO_MODEL_DIR is required. See docs/neural-speech.md.');
  const work = mkdtempSync(join(tmpdir(), 'forest-neural-speech-'));
  const output = join(work, 'output');
  mkdirSync(output);
  const texts = sample
    ? [
        'soccer',
        'apple',
        'window',
        'I like soccer.',
        'May I sit here?',
        'The tortoise won the race.',
      ]
    : speechTexts;
  const clips = texts.map((text) => ({
    text,
    file: createHash('sha256').update(`${voice.id}\n${text}`).digest('hex').slice(0, 32) + '.mp3',
  }));
  let keep = false;
  try {
    const manifest = join(work, 'manifest.json');
    writeFileSync(manifest, JSON.stringify({ voice, clips }, null, 2) + '\n');
    await run(process.env.KOKORO_PYTHON || 'python3', [
      'scripts/neural-speech/synthesize.py',
      '--manifest',
      manifest,
      '--models',
      resolve(process.env.KOKORO_MODEL_DIR),
      '--output',
      output,
    ]);
    // Validate every encoded clip before publishing any asset or changing the active voice.
    let verified = 0;
    for (const { file } of clips) {
      const bytes = readFileSync(join(output, file));
      if (bytes.length < 900 || bytes.subarray(0, 3).toString() !== 'ID3')
        throw Error(`Invalid MP3: ${file}`);
      await run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-xerror',
        '-nostdin',
        '-i',
        join(output, file),
        '-f',
        'null',
        '-',
      ]);
      if (++verified % 100 === 0 || verified === clips.length)
        console.log(`Decoded and verified: ${verified}/${clips.length}`);
    }
    if (sample) {
      keep = true;
      console.log(`Samples saved to ${output}. The app and existing audio are unchanged.`);
      return;
    }
    const oldIndex = JSON.parse(readFileSync('lib/forest/speech-index.json', 'utf8')) as Record<
      string,
      string
    >;
    const index = Object.fromEntries(clips.map(({ text, file }) => [text, file]));
    const configPath = 'lib/forest/speech-config.ts';
    const originalConfig = readFileSync(configPath, 'utf8');
    const config = originalConfig.replace(
      /export const speechVoice = \{[\s\S]*?\} as const;/,
      `export const speechVoice = ${JSON.stringify(voice, null, 2)} as const;`,
    );
    if (config === originalConfig && !originalConfig.includes(voice.id))
      throw Error('Cannot locate active voice configuration; nothing was published.');
    const notice =
      'AI-generated American English learning audio: Kokoro-82M v1.0, am_michael.\n' +
      'Neural synthesis at original speed using full-precision ONNX weights.\n' +
      '24 kHz mono MP3, 96 kbit/s. No runtime TTS API or user voice transmission.\n' +
      'Model: https://github.com/hexgrad/kokoro (Apache-2.0).\n' +
      'ONNX runtime wrapper: https://github.com/thewh1teagle/kokoro-onnx (MIT).\n' +
      'Model artifacts: model-files-v1.1 release; SHA-256 verified before use.\n\n' +
      readFileSync('scripts/neural-speech/KOKORO-LICENSE.txt', 'utf8') +
      '\n\n' +
      readFileSync('scripts/neural-speech/KOKORO-ONNX-LICENSE.txt', 'utf8');
    // Asset names contain the voice version; old and new files cannot collide.
    mkdirSync('public/speech', { recursive: true });
    for (const { file } of clips) copyFileSync(join(output, file), join('public/speech', file));
    const files: Record<string, string> = {
      'lib/forest/speech-index.json': JSON.stringify(index, null, 2) + '\n',
      [configPath]: config,
      'public/speech/voice.json':
        JSON.stringify({ ...voice, clips: clips.length, defaultPlaybackRate: 1 }, null, 2) + '\n',
      'public/speech/NOTICE.txt': notice,
    };
    for (const [path, contents] of Object.entries(files)) {
      writeFileSync(`${path}.new`, contents);
      renameSync(`${path}.new`, path);
    }
    const current = new Set(Object.values(index));
    for (const old of Object.values(oldIndex))
      if (
        /^[a-f0-9]{32}\.mp3$/.test(old) &&
        !current.has(old) &&
        existsSync(join('public/speech', old))
      )
        rmSync(join('public/speech', old));
    console.log(`Installed ${clips.length} neural voice clips (${voice.id}).`);
  } finally {
    if (!keep) rmSync(work, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
