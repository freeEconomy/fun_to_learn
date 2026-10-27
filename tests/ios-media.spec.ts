import { test, expect, type Page } from '@playwright/test';
import { speechAudioSource } from '../lib/forest/speech-audio';
import { speechVoice } from '../lib/forest/speech-config';

async function iphone(page: Page, mocked = true) {
  await page.addInitScript((mocked) => {
    const w = window as any;
    w.__plays = [];
    w.__nativeCalls = 0;
    w.__reject = false;
    w.__pending = false;
    w.__rejects = [];
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1',
      configurable: true,
    });
    Object.defineProperty(navigator, 'platform', { value: 'iPhone', configurable: true });
    Object.defineProperty(navigator, 'audioSession', { value: undefined, configurable: true });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        speak: () => {
          w.__nativeCalls++;
          throw Error('Device TTS must not be used on iPhone');
        },
      },
    });
    if (mocked) {
      HTMLMediaElement.prototype.play = function () {
        w.__plays.push({
          src: this.getAttribute('src'),
          rate: this.playbackRate,
          volume: this.volume,
          muted: this.muted,
        });
        if (w.__reject) return Promise.reject(Error('Playback denied'));
        if (w.__pending) return new Promise((_, reject) => w.__rejects.push(reject));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function () {
        this.dispatchEvent(new Event('pause'));
      };
      HTMLMediaElement.prototype.load = function () {};
    }
  }, mocked);
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
}
async function playing(page: Page) {
  await page
    .locator('audio[data-learning-audio]')
    .evaluate((a) => a.dispatchEvent(new Event('playing')));
}

test('iPhone words and sentences play MP3 without device voices; reading status follows actual player events', async ({
  page,
}) => {
  await iphone(page);
  expect(await page.evaluate(() => (window as any).__plays.length)).toBe(0);
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', speechAudioSource('soccer')!);
  await expect(
    page.getByRole('status').filter({ hasText: '음성을 준비하고 있어요.' }),
  ).toBeVisible();
  await expect(page.getByText('영어를 읽고 있어요.', { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__plays.at(-1))).toEqual({
    src: speechAudioSource('soccer'),
    rate: 1,
    volume: 1,
    muted: false,
  });
  await playing(page);
  await expect(page.getByRole('status').filter({ hasText: '영어를 읽고 있어요.' })).toBeVisible();
  await page.getByRole('button', { name: '축구 사진 선택', exact: true }).click();
  await page.getByRole('button', { name: '따라 말할 문장 듣기', exact: true }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', speechAudioSource('I like soccer.')!);
  await playing(page);
  await page.locator('audio').evaluate((a) => a.dispatchEvent(new Event('waiting')));
  await expect(
    page.getByRole('status').filter({ hasText: '음성을 준비하고 있어요.' }),
  ).toBeVisible();
  await playing(page);
  await page.locator('audio').evaluate((a) => a.dispatchEvent(new Event('ended')));
  await expect(page.getByRole('button', { name: '영어 읽기 멈춤', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__nativeCalls)).toBe(0);
});

test('stop, app mute and navigation cancel media even while loading', async ({ page }) => {
  await iphone(page);
  const listen = page.getByRole('button', { name: '영어 듣기', exact: true });
  await listen.click();
  await page.getByRole('button', { name: '영어 읽기 멈춤', exact: true }).click();
  await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
  await listen.click();
  await playing(page);
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  await expect(page.getByRole('button', { name: '영어 읽기 멈춤', exact: true })).toHaveCount(0);
  const count = await page.evaluate(() => (window as any).__plays.length);
  await listen.click();
  expect(await page.evaluate(() => (window as any).__plays.length)).toBe(count);
  await page.getByRole('button', { name: '소리 켜기', exact: true }).click();
  await listen.click();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
  expect(await page.evaluate(() => (window as any).__nativeCalls)).toBe(0);
});

test('rejected playback shows a retry message and old request failures cannot stop a newer clip', async ({
  page,
}) => {
  await iphone(page);
  const listen = page.getByRole('button', { name: '영어 듣기', exact: true });
  await page.evaluate(() => ((window as any).__reject = true));
  await listen.click();
  await expect(page.getByRole('status')).toContainText('음성 파일을 재생하지 못했어요');
  await expect(page.getByRole('button', { name: '영어 읽기 멈춤', exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    (window as any).__reject = false;
    (window as any).__pending = true;
  });
  await listen.click();
  await page.evaluate(() => ((window as any).__pending = false));
  await listen.click();
  await playing(page);
  await expect(page.getByText('음성 파일을 재생하지 못했어요.', { exact: false })).toHaveCount(0);
  await page.evaluate(() => (window as any).__rejects[0](Error('Old request aborted')));
  await expect(page.getByRole('status')).toContainText('영어를 읽고 있어요.');
});

test('real MP3 bytes decode and advance in the browser without speech synthesis', async ({
  page,
}) => {
  await iphone(page, false);
  await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
  const media = page.locator('audio');
  await expect(media).toHaveAttribute('src', speechAudioSource('May I sit here?')!);
  await expect
    .poll(() =>
      media.evaluate((a: HTMLAudioElement) => a.currentTime > 0 && a.duration > 0 && !a.error),
    )
    .toBe(true);
  expect(await page.evaluate(() => (window as any).__nativeCalls)).toBe(0);
  const response = await page.request.get(speechAudioSource('May I sit here?')!, {
    headers: { Range: 'bytes=0-511' },
  });
  expect(response.status()).toBe(206);
  expect(response.headers()['content-type']).toContain('audio/mpeg');
  expect((await response.body()).length).toBe(512);
});

test('a real file download failure clears loading and supports retry', async ({ page }) => {
  await iphone(page, false);
  await page.route('**/speech/*.mp3', (r) => r.fulfill({ status: 404, body: 'not found' }));
  const listen = page.getByRole('button', { name: '영어 듣기', exact: true });
  await listen.click();
  await expect(page.getByRole('status')).toContainText('음성 파일을 재생하지 못했어요');
  await expect(page.getByRole('button', { name: '영어 읽기 멈춤', exact: true })).toHaveCount(0);
  await page.unroute('**/speech/*.mp3');
  await listen.click();
  await expect
    .poll(() =>
      page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime > 0 && !a.error),
    )
    .toBe(true);
});

test('desktop and Android also select the same male neural voice at its original speed', async ({
  page,
}) => {
  await iphone(page);
  for (const ua of ['Mozilla/5.0 X11 Linux desktop', 'Mozilla/5.0 Linux Android 16']) {
    await page.evaluate(
      (ua) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true }),
      ua,
    );
    await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
    expect(await page.evaluate(() => (window as any).__plays.at(-1))).toEqual({
      src: speechAudioSource('May I sit here?'),
      rate: 1,
      volume: 1,
      muted: false,
    });
  }
  expect(await page.evaluate(() => (window as any).__nativeCalls)).toBe(0);
});

test('old normal speed migrates to the new natural default without losing points or the slow preference', async ({
  page,
}) => {
  await iphone(page);
  for (const [voice, oldRate, expected] of [
    [undefined, 1, 1],
    [undefined, 0.85, 1],
    [undefined, 0.65, 0.85],
    ['rms-us-male-96k-v2', 1, 1],
    ['rms-us-male-96k-v2', 0.65, 0.85],
    [speechVoice.id, 1, 1.1],
    [speechVoice.id, 0.85, 1],
    [speechVoice.id, 0.65, 0.85],
  ] as const) {
    await page.evaluate(
      ({ voice, rate }) => {
        const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
        p.rate = rate;
        p.leaves = 30;
        p.audioVoice = voice;
        localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
      },
      { voice, rate: oldRate },
    );
    await page.reload();
    await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
    expect(await page.evaluate(() => (window as any).__plays.at(-1).rate)).toBe(expected);
    await expect(page.locator('.forest-leaves')).toContainText('30 P');
  }
});
