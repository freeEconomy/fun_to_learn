import { test, expect, type Page } from '@playwright/test';

// Explicitly exercise the device-voice fallback for browsers without MP3 support.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.canPlayType = () => '';
  });
});

async function mock(page: Page, mode: 'supported' | 'missing' | 'denied' = 'supported') {
  await page.addInitScript((mode) => {
    const w = window as any;
    w.__audioType = 'auto';
    w.__audioChanges = [];
    w.__utterances = [];
    w.__stops = 0;
    if (mode === 'missing')
      Object.defineProperty(navigator, 'audioSession', { value: undefined, configurable: true });
    if (mode !== 'missing')
      Object.defineProperty(navigator, 'audioSession', {
        value: {
          get type() {
            return w.__audioType;
          },
          set type(value: string) {
            if (mode === 'denied') throw Error('Not supported');
            w.__audioType = value;
            w.__audioChanges.push(value);
          },
        },
        configurable: true,
      });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [{ lang: 'en-US' }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => w.__stops++,
        speak: (u: any) => {
          w.__utterances.push(u);
          u.onstart?.();
        },
      },
    });
  }, mode);
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
}
async function listen(page: Page) {
  await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
}

test('requests playback on a listening tap and restores the prior session on end, cancel, mute and navigation', async ({
  page,
}) => {
  await mock(page);
  expect(await page.evaluate(() => (window as any).__audioChanges)).toEqual([]);
  await listen(page);
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('playback');
  await page.evaluate(() => (window as any).__utterances.at(-1).onend());
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('auto');
  await listen(page);
  await page.getByRole('button', { name: '영어 읽기 멈춤', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('auto');
  await listen(page);
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('auto');
  const count = await page.evaluate(() => (window as any).__utterances.length);
  await listen(page);
  expect(await page.evaluate(() => (window as any).__utterances.length)).toBe(count);
  await page.getByRole('button', { name: '소리 켜기', exact: true }).click();
  await listen(page);
  await page.getByRole('button', { name: '사진 단어', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('auto');
});

test('an old narration callback cannot release a newer playback session, and errors clean up', async ({
  page,
}) => {
  await mock(page);
  await listen(page);
  await listen(page);
  await page.evaluate(() => (window as any).__utterances[0].onend());
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('playback');
  await page.evaluate(() => (window as any).__utterances.at(-1).onerror());
  expect(await page.evaluate(() => (window as any).__audioType)).toBe('auto');
  await expect(page.getByRole('status')).toContainText('재생');
});
for (const mode of ['missing', 'denied'] as const)
  test(`speech still works when Audio Session API is ${mode}`, async ({ page }) => {
    await mock(page, mode);
    await listen(page);
    expect(await page.evaluate(() => (window as any).__utterances.at(-1).text)).toBe(
      'May I sit here?',
    );
    await expect(page.getByRole('button', { name: '영어 읽기 멈춤', exact: true })).toBeVisible();
  });
