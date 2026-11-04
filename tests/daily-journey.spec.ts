import { test, expect, type Page } from '@playwright/test';
import { dailyPhotoWords, dailyAdventureIds } from '../lib/forest/daily-learning';
import { characters } from '../lib/forest/characters';
import { words } from '../lib/forest/content';

const today = '2026-11-04T03:00:00Z';
const tomorrow = '2026-11-05T03:00:00Z';
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(today) });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.daily-photos')).toHaveAttribute('data-day', '2026-11-04');
});
async function photoIds(page: Page) {
  return page
    .locator('.daily-photo-grid > button')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-word')));
}
async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('wordforest-english-v1')!));
}
async function solve(page: Page) {
  const p = await stored(page);
  const id = p.discovery.session.ids[p.discovery.session.results.length];
  const word = words.find((word) => word.id === id)!;
  await page.getByRole('button', { name: `${word.korean} 사진 선택`, exact: true }).click();
  const last = p.discovery.session.results.length === 2;
  await page
    .getByRole('button', { name: last ? '탐험 마치기' : '다음 단어 만나기', exact: true })
    .click();
}

test('daily photos and adventure share a stable pack and completion does not replace today’s words', async ({
  page,
}) => {
  const expected = dailyPhotoWords(today).map((word) => word.id);
  expect(await photoIds(page)).toEqual(expected);
  await page.getByRole('button', { name: '사진 단어', exact: true }).click();
  await expect(page.getByRole('heading', { name: '사진 단어 탐험', exact: true })).toBeVisible();
  expect(await photoIds(page)).toEqual(expected);
  await page.getByRole('button', { name: '전체 40개 단어 보기', exact: true }).click();
  await expect(page.locator('.english-word-card')).toHaveCount(40);
  for (const image of await page.locator('.daily-photo-grid img').all()) {
    await expect
      .poll(() =>
        image.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  }
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  expect((await stored(page)).discovery.session.ids).toEqual(dailyAdventureIds(today));
  expect((await stored(page)).discovery.session.day).toBe('2026-11-04');
  for (let n = 0; n < 3; n++) await solve(page);
  await page.getByRole('button', { name: '내 배지 보러 가기', exact: true }).click();
  expect(await photoIds(page)).toEqual(expected);
  await expect(page.locator('.english-today > span')).toHaveText(
    dailyPhotoWords(today)[0].sentences[0],
  );
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  expect(await photoIds(page)).toEqual(expected);
});

test('returning after Korean midnight updates recommendations and starts a fresh session without resetting records', async ({
  page,
}) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.name = '민우';
    p.symbol = 'charizard';
    p.leaves = 70;
    p.activityRecords = [{ activityId: 'game:soccer', date: '2026-11-04T03:00:00Z', score: 90 }];
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  await solve(page);
  const oldIds = (await stored(page)).discovery.session.ids;
  await page.clock.setSystemTime(new Date(tomorrow));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  expect((await stored(page)).discovery.session.ids).toEqual(oldIds);
  await page.getByRole('button', { name: '잠깐 쉬기 · 이어 할 수 있어요', exact: true }).click();
  await expect(page.locator('.daily-photos')).toHaveAttribute('data-day', '2026-11-05');
  expect(await photoIds(page)).toEqual(dailyPhotoWords(tomorrow).map((word) => word.id));
  await expect(page.getByRole('button', { name: /이어서 탐험하기/ })).toHaveCount(0);
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  const p = await stored(page);
  expect(p.discovery.session.ids).toEqual(dailyAdventureIds(tomorrow));
  expect(p.discovery.session.results).toEqual([]);
  expect(p.leaves).toBe(70);
  expect(p.symbol).toBe('charizard');
  expect(p.activityRecords).toHaveLength(1);
});

test('eight Pokemon can be previewed freely, saved and restored while legacy points and records survive', async ({
  page,
}) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.symbol = '🐱';
    p.leaves = 80;
    p.records = [
      { word: 'bus', date: '2026-11-03T03:00:00Z', firstTry: 4, total: 5, review: true },
    ];
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await page.getByRole('button', { name: '학습카드', exact: true }).click();
  await expect(page.locator('.character-picker > button')).toHaveCount(8);
  for (const character of characters) {
    const button = page.getByRole('button', { name: `${character.name} 표식`, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const image = page.locator('.english-card-preview > img');
    await expect(image).toHaveAttribute('alt', `${character.name} 표식`);
    await expect
      .poll(() =>
        image.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    await expect(page.locator('.forest-leaves')).toContainText('80 P');
  }
  await page.getByRole('button', { name: '레쿠쟈 표식', exact: true }).click();
  await page.getByLabel('이름 또는 별명').fill('드래곤');
  await page.getByRole('button', { name: '라벤더', exact: true }).click();
  await page.getByRole('button', { name: '학습카드 저장', exact: true }).click();
  await page.reload();
  await expect(page.locator('.run-companion-face img')).toHaveAttribute('alt', '레쿠쟈 표식');
  const p = await stored(page);
  expect(p.name).toBe('드래곤');
  expect(p.symbol).toBe('rayquaza');
  expect(p.leaves).toBe(80);
  expect(p.records).toHaveLength(1);
});

test('arcade posters and progress use real game records, existing difficulty and the selected partner on completion', async ({
  page,
}) => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.symbol = 'mewtwo';
    p.activityRecords = [
      { activityId: 'game:soccer', date: '2026-11-04T03:00:00Z', score: 90 },
      { activityId: 'game:train', date: '2026-11-03T03:00:00Z', score: 100 },
    ];
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.locator('.game-poster .game-art')).toHaveCount(7);
  await expect(page.locator('.game-today-win')).toHaveCount(1);
  await expect(page.locator('.arcade-hero-stats')).toContainText('1개 오늘 완료');
  await expect(page.getByRole('radio', { name: /도전 모드/ })).toBeChecked();
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  await page.getByRole('button', { name: '짝꿍 카드 시작', exact: true }).click();
  await expect(page.locator('.memory-card')).toHaveCount(12);
  await expect(page.locator('.arena-steps li')).toHaveCount(6);
  const ids = await page
    .locator('.memory-card[data-kind="photo"]')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-pair')));
  for (const id of ids) {
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="photo"]`).click();
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="word"]`).click();
  }
  await expect(page.locator('.adventure-score')).toContainText('100');
  await expect(page.locator('.reward-partner img')).toHaveAttribute('alt', '뮤츠 표식');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await expect(page.locator('.game-today-win')).toHaveCount(2);
});

test('daily gallery, Pokemon cards and premium arcade stay usable at 320px and respect reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [title, file] of [
    ['사진 단어', 'daily-photos'],
    ['학습카드', 'pokemon-picker'],
    ['게임', 'premium-arcade'],
  ]) {
    await page.getByRole('button', { name: title, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (title === '학습카드') {
      expect((await page.locator('.english-card-preview').boundingBox())!.height).toBeLessThan(650);
      for (const label of await page.locator('.card-partner-type').all())
        expect(
          await label.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
        ).toBeLessThanOrEqual(14);
      for (const button of await page.locator('.character-picker button').all())
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: test.info().outputPath(`${file}-320.png`), fullPage: true });
  }
  await page.screenshot({
    path: test.info().outputPath('premium-arcade-viewport.png'),
    fullPage: false,
  });
  await page.getByRole('button', { name: '짝꿍 카드 시작', exact: true }).click();
  await page.locator('.memory-card').first().click();
  expect(
    await page
      .locator('.arcade-worlds')
      .evaluate(
        (world) =>
          world
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
  ).toBe(0);
  await page.screenshot({ path: test.info().outputPath('premium-memory-320.png'), fullPage: true });
  await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('premium-arcade-1280.png'),
    fullPage: true,
  });
});
