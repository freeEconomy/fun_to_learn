import { test, expect, type Page } from '@playwright/test';

// Explicitly exercise the device-voice fallback for browsers without MP3 support.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.canPlayType = () => '';
  });
});
import { words } from '../lib/forest/content';
async function start(page: Page) {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
}
async function target(page: Page) {
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('wordforest-english-v1')!));
  return words.find((w) => w.id === p.discovery.session.ids[p.discovery.session.results.length])!;
}
async function solve(page: Page, miss = false) {
  const w = await target(page);
  if (miss) {
    await page
      .locator('.discovery-options button')
      .filter({ hasNotText: w.korean })
      .first()
      .click();
    await expect(page.locator('.discovery-feedback')).toContainText('괜찮아');
    await expect(page.locator('.discovery-options .retry svg')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /다음 단어 만나기|탐험 마치기/ })).toBeDisabled();
  }
  await page.getByRole('button', { name: `${w.korean} 사진 선택`, exact: true }).click();
  await expect(page.locator('.discovery-feedback')).toContainText(w.name);
  return w;
}

test('three-word exploration allows mistakes and optional speaking, saves recall and grants only a daily badge', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:3199/')) external.push(r.url());
  });
  await start(page);
  await expect(page.getByRole('button', { name: '다음 단어 만나기', exact: true })).toBeDisabled();
  const w = await solve(page, true);
  await page.getByRole('button', { name: '나도 말해 봤어', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '멋져! 직접 말해 봤어 ✓', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '다음 단어 만나기', exact: true }).dblclick();
  await expect(page.getByRole('progressbar', { name: '3단어 탐험 진행' })).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await expect(page.locator('.discovery-listen')).toBeInViewport();
  await solve(page);
  await expect(page.locator('.discovery-feedback')).toBeInViewport();
  await page.getByRole('button', { name: '다음 단어 만나기', exact: true }).click();
  await solve(page);
  await page.getByRole('button', { name: '탐험 마치기', exact: true }).click();
  await expect(page.getByLabel('3단어 탐험 완료')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '세 단어를 끝까지 만났어!', exact: true }),
  ).toBeInViewport();
  await expect(page.getByLabel('3단어 탐험 완료')).toContainText('1일');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordforest-english-v1')!),
  );
  expect(stored.discovery.entries[w.id].needsReview).toBe(true);
  expect(stored.discovery.session).toBeNull();
  expect(stored.leaves).toBe(0);
  await page.getByRole('button', { name: '내 배지 보러 가기', exact: true }).click();
  await expect(page.getByLabel('첫 발견 배지 획득', { exact: true })).toBeVisible();
  await expect(page.getByLabel('오늘 완료한 모험 1개, 전체 3개')).toBeVisible();
  await page.getByRole('button', { name: '부모님', exact: true }).click();
  const challenge = await page.locator('.forest-modal label').innerText();
  const nums = challenge.match(/(\d+)\s*\+\s*(\d+)/)!;
  await page.getByLabel('부모 확인 답').fill(String(Number(nums[1]) + Number(nums[2])));
  await page.getByRole('button', { name: '부모님 학습실 열기', exact: true }).click();
  await expect(page.locator('.forest-parent-stats section').nth(1)).toContainText('1');
  await expect(
    page.getByRole('button', { name: `${w.name} · ${w.korean}`, exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '아이 화면으로', exact: true }).click();
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  expect((await target(page)).id).toBe(w.id);
  for (let i = 0; i < 3; i++) {
    await solve(page);
    await page
      .getByRole('button', { name: i === 2 ? '탐험 마치기' : '다음 단어 만나기', exact: true })
      .click();
  }
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('wordforest-english-v1')!).discovery.days.length,
    ),
  ).toBe(1);
  expect(external).toEqual([]);
});

test('pause and refresh resume the saved next word, while unfinished work earns no stamp', async ({
  page,
}) => {
  await start(page);
  await solve(page);
  await page.getByRole('button', { name: '다음 단어 만나기', exact: true }).click();
  const second = await target(page);
  await page.getByRole('button', { name: '잠깐 쉬기 · 이어 할 수 있어요', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '이어서 탐험하기 · 2/3', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '이어서 탐험하기 · 2/3', exact: true }).click();
  expect((await target(page)).id).toBe(second.id);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('.discovery-word-hint')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('wordforest-english-v1')!).discovery.days,
    ),
  ).toEqual([]);
});

test('no-voice fallback, keyboard controls and 320px layout keep the activity fully playable', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    }),
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: '영어 읽기 목소리가 없어요' }),
  ).toBeVisible();
  const hint = page.getByRole('button', { name: '소리 없이도 할 수 있어요', exact: true });
  await hint.focus();
  await page.keyboard.press('Enter');
  const w = await target(page);
  await expect(page.locator('.discovery-word-hint')).toContainText(w.name);
  const option = page.getByRole('button', { name: `${w.korean} 사진 선택`, exact: true });
  await option.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.discovery-say')).toContainText(w.sentences[0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const b of await page.locator('.discovery-trail button:visible').all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: test.info().outputPath('discovery-mobile.png'), fullPage: true });
});

test('legacy profiles retain points and preferences when discovery data is malformed', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.name = '민우';
    p.symbol = '🐱';
    p.leaves = 70;
    p.discovery = {
      days: ['bad'],
      entries: { soccer: { last: 'invalid' } },
      session: { ids: ['dog', 'dog', 'apple'], results: [] },
    };
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('70 P');
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await expect(page.getByRole('heading', { name: /민우, 오늘은/ })).toBeVisible();
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  expect((await target(page)).id).toBe('soccer');
});

test('English word and sentence narration require a tap and stop when the next word starts', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as any;
    state.__spoken = [];
    state.__stops = 0;
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
        getVoices: () => [{ lang: 'ko-KR' }, { lang: 'en-US' }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => state.__stops++,
        speak: (u: any) => {
          state.__spoken.push({ text: u.text, lang: u.lang });
          u.onstart?.();
        },
      },
    });
  });
  await start(page);
  expect(await page.evaluate(() => (window as any).__spoken.length)).toBe(0);
  const w = await target(page);
  await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: w.name,
    lang: 'en-US',
  });
  await solve(page);
  await page.getByRole('button', { name: '따라 말할 문장 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: w.sentences[0],
    lang: 'en-US',
  });
  const stops = await page.evaluate(() => (window as any).__stops);
  await page.getByRole('button', { name: '다음 단어 만나기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__stops)).toBeGreaterThan(stops);
  await expect(page.getByText('영어를 읽고 있어요.', { exact: false })).toHaveCount(0);
});
