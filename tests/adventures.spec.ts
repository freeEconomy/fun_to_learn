import { test, expect, type Page } from '@playwright/test';

// Explicitly exercise the device-voice fallback for browsers without MP3 support.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.canPlayType = () => '';
  });
});
import { tales } from '../lib/forest/adventures';
import { words } from '../lib/forest/content';

async function openGame(page: Page, name: string) {
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await page.getByRole('radio', { name: /연습 모드/ }).check();
  await page.getByRole('button', { name: `${name} 시작`, exact: true }).click();
}
async function matchAll(page: Page) {
  const ids = await page
    .locator('.memory-card')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('data-pair')!))]);
  for (const id of ids) {
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="photo"]`).click();
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="word"]`).click();
  }
}

test('stories keep old profiles, resume bookmarks and grant only one daily reward without external calls', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.origin !== 'http://127.0.0.1:3199' || url.pathname.startsWith('/api/'))
      external.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    delete profile.storyPages;
    profile.storyPages = { 'rainbow-ball': 6 };
    profile.activityRecords = [
      { activityId: 'story:rainbow-ball', date: '2026-10-20T00:00:00Z', score: 100 },
    ];
    profile.leaves = 20;
    profile.symbol = '🐱';
    localStorage.setItem('wordforest-english-v1', JSON.stringify(profile));
  });
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('20 P');
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await expect(page.locator('.tale-cover')).toHaveCount(30);
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}`, exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await expect(page.getByText(tales[0].pages[3].english, { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('storybook-reader.png'), fullPage: true });
  await page.getByRole('button', { name: '뜻 숨기기', exact: true }).click();
  await expect(page.locator('.tale-translation')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await expect(page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` })).toContainText(
    '이어 읽기 · 4 / 8',
  );
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` }).click();
  await expect(page.getByText(tales[0].pages[3].english, { exact: true })).toBeVisible();
  for (let i = 3; i < 7; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await page.getByRole('button', { name: '이야기 완료', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('+10 P');
  await expect(page.locator('.forest-leaves')).toContainText('30 P');
  await page.getByRole('button', { name: '처음부터 다시 읽기', exact: true }).click();
  for (let i = 0; i < 7; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await page.getByRole('button', { name: '이야기 완료', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('이미 받았어요');
  await expect(page.locator('.forest-leaves')).toContainText('30 P');
  await page.getByRole('button', { name: '다른 동화 보기', exact: true }).click();
  await expect(page.locator('.tale-cover').first()).toContainText('완독');
  const restored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordforest-english-v1')!),
  );
  expect(
    restored.activityRecords.some(
      (record: { activityId: string }) => record.activityId === 'story:rainbow-ball',
    ),
  ).toBe(true);
  expect(restored.storyPages['rainbow-ball']).toBeUndefined();
  expect(external).toEqual([]);
});

test('all thirty classic books can be read, completed and restored', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  const classicTales = tales;
  const sceneSources = new Set<string>();
  expect(classicTales).toHaveLength(30);
  for (const [index, tale] of classicTales.entries()) {
    const cover = page.getByRole('button', { name: `동화 읽기: ${tale.title}`, exact: true });
    await expect(cover).toContainText(tale.genre);
    await cover.click();
    for (const [sceneIndex, scene] of tale.pages.entries()) {
      await expect(page.getByText(scene.english, { exact: true })).toBeVisible();
      await expect(page.locator('.tale-translation')).toHaveText(scene.korean);
      await expect(page.locator('.tale-word button')).toContainText(scene.vocabulary.english);
      await expect(page.locator('.tale-word button')).toContainText(scene.vocabulary.korean);
      await expect(page.locator('.tale-reader .tale-scene')).toHaveAccessibleName(scene.caption);
      const illustration = page.locator('.tale-reader .tale-scene img');
      await expect(illustration).toBeVisible();
      await expect
        .poll(() => illustration.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      sceneSources.add((await illustration.getAttribute('src'))!);
      await expect(page.locator('.tale-reader .tale-cast, .tale-reader .tale-prop')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      if (sceneIndex < tale.pages.length - 1)
        await page.getByRole('button', { name: '다음 장면', exact: true }).click();
    }
    await page.getByRole('button', { name: '이야기 완료', exact: true }).click();
    await expect(page.getByLabel('모험 완료')).toContainText('+10 P');
    await expect(page.locator('.forest-leaves')).toContainText(`${(index + 1) * 10} P`);
    await page.getByRole('button', { name: '다른 동화 보기', exact: true }).click();
  }
  await page.reload();
  await page.getByRole('button', { name: '동화', exact: true }).click();
  for (const tale of classicTales)
    await expect(
      page.getByRole('button', { name: `동화 읽기: ${tale.title}`, exact: true }),
    ).toContainText('완독');
  await page.screenshot({
    path: test.info().outputPath('classic-story-library.png'),
    fullPage: true,
  });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordforest-english-v1')!),
  );
  expect(saved.activityRecords).toHaveLength(30);
  expect(sceneSources.size).toBe(240);
  for (const tale of classicTales) {
    expect(saved.storyPages[tale.id]).toBe(7);
    expect(
      saved.activityRecords.some(
        (record: { activityId: string }) => record.activityId === `story:${tale.id}`,
      ),
    ).toBe(true);
  }
});

test('bookshop gallery filters levels, searches titles, preserves filters and handles empty results', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  const covers = page.locator('.tale-cover');
  await expect(covers).toHaveCount(30);
  const first = await covers.nth(0).boundingBox();
  const second = await covers.nth(1).boundingBox();
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);
  const columns = await page
    .locator('.bookshop-grid')
    .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(isMobile ? 2 : 5);
  for (const level of ['쉬움', '보통', '도전']) {
    await page.getByRole('button', { name: `난이도 ${level}`, exact: true }).click();
    await expect(covers).toHaveCount(10);
    await expect(
      page.getByRole('button', { name: `난이도 ${level}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    for (const badge of await page.locator('.book-cover-details .book-difficulty').all())
      await expect(badge).toContainText(level);
  }
  await page.getByRole('searchbox', { name: '동화 검색' }).fill('Cinderella');
  await expect(covers).toHaveCount(1);
  await page.getByRole('button', { name: '동화 읽기: 신데렐라', exact: true }).click();
  await expect(page.locator('.tale-reader-top .book-difficulty')).toContainText('도전');
  await page.getByRole('button', { name: '동화책장', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: '동화 검색' })).toHaveValue('Cinderella');
  await expect(covers).toHaveCount(1);
  await page.getByRole('searchbox', { name: '동화 검색' }).fill('없는 책 제목');
  await expect(covers).toHaveCount(0);
  await expect(page.getByText('아직 이 책은 진열되지 않았어요', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '모든 책 보기', exact: true }).click();
  await expect(covers).toHaveCount(30);
  await page.getByRole('searchbox', { name: '동화 검색' }).fill('포도');
  await expect(covers).toHaveCount(1);
  await expect(covers.first()).toHaveAccessibleName('동화 읽기: 여우와 포도');
  await page.getByRole('searchbox', { name: '동화 검색' }).fill('');
  if (isMobile) await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const clipped = await covers.evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const art = button.querySelector('.tale-cover-art')!.getBoundingClientRect();
        const heading = button.querySelector('.book-cover-heading')!.getBoundingClientRect();
        const illustration = button
          .querySelector('.book-cover-illustration')!
          .getBoundingClientRect();
        return (
          art.width > button.getBoundingClientRect().width + 1 ||
          art.height > art.width * 1.3 + 1 ||
          heading.top < illustration.bottom - 1
        );
      })
      .map((button) => button.getAttribute('aria-label')),
  );
  expect(clipped).toEqual([]);
  const firstCoverImage = covers.first().locator('img');
  await expect(firstCoverImage).toBeVisible();
  await expect
    .poll(() => firstCoverImage.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await page.screenshot({ path: test.info().outputPath('bookshop-gallery.png'), fullPage: false });
});

test('memory supports a mistake, matched pairs, replay, highest score and daily reward cap', async ({
  page,
}) => {
  await page.goto('/');
  await openGame(page, '짝꿍 카드');
  const ids = await page
    .locator('.memory-card')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('data-pair')!))]);
  await page.locator(`.memory-card[data-pair="${ids[0]}"][data-kind="photo"]`).click();
  await page.locator(`.memory-card[data-pair="${ids[1]}"][data-kind="word"]`).click();
  await expect(page.locator('.game-feedback')).toContainText('다른 짝');
  await page.getByRole('button', { name: '다시 뒤집기', exact: true }).click();
  await matchAll(page);
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '한 번 더 놀기', exact: true }).click();
  await matchAll(page);
  await expect(page.getByLabel('모험 완료')).toContainText('100');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await expect(page.getByRole('button', { name: '짝꿍 카드 시작', exact: true })).toContainText(
    '최고 기록 100점',
  );
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem('wordforest-english-v1')!).activityRecords,
  );
  expect(records).toHaveLength(1);
  expect(records[0].score).toBe(100);
});

test('listening game stays playable with text hints, wrong answers and all five treasures', async ({
  page,
}) => {
  await page.goto('/');
  await openGame(page, '소리 탐정');
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '단어 힌트 보기', exact: true }).click();
    const name = await page.locator('.sound-hint').innerText();
    const word = words.find((w) => w.name === name)!;
    if (i === 0) {
      const wrong = page
        .locator('.listening-options button')
        .filter({ hasNotText: word.korean })
        .first();
      await wrong.click();
      await expect(page.getByRole('button', { name: '다음 소리', exact: true })).toBeDisabled();
    }
    await page.getByRole('button', { name: `${word.korean} 선택`, exact: true }).click();
    await page
      .getByRole('button', { name: i === 4 ? '보물상자 열기' : '다음 소리', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
});

test('sentence train accepts keyboard play, correction and five complete sentences on small screens', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await page.getByRole('radio', { name: /연습 모드/ }).check();
  const start = page.getByRole('button', { name: '문장 기차 시작', exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  for (let round = 0; round < 5; round++) {
    const count = await page.locator('.sentence-tokens button').count();
    if (round === 0) {
      for (let n = count - 1; n >= 0; n--)
        await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
      await page.getByRole('button', { name: '문장 확인', exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('순서를 조금');
      await page.getByRole('button', { name: '다시 만들기', exact: true }).click();
    }
    for (let n = 0; n < count; n++)
      await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
    await page.getByRole('button', { name: '문장 확인', exact: true }).click();
    await page
      .getByRole('button', { name: round === 4 ? '여행 마치기' : '다음 역으로', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: test.info().outputPath('game-menu.png'), fullPage: true });
});

test('story narration and listening games use English voices and stop across scene changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      __spoken: { text: string; lang: string }[];
      __stops: number;
    };
    state.__spoken = [];
    state.__stops = 0;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
      configurable: true,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [{ lang: 'ko-KR' }, { lang: 'en-US' }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {
          state.__stops++;
        },
        speak: (utterance: { text: string; lang: string; onstart?: () => void }) => {
          state.__spoken.push({ text: utterance.text, lang: utterance.lang });
          utterance.onstart?.();
        },
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` }).click();
  await page.getByRole('button', { name: '이 장면 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: tales[0].pages[0].english,
    lang: 'en-US',
  });
  await page.locator('.tale-word button').click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: tales[0].pages[0].vocabulary.english,
    lang: 'en-US',
  });
  const stops = await page.evaluate(() => (window as any).__stops);
  await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__stops)).toBeGreaterThan(stops);
  await page.getByRole('button', { name: '이 장면 듣기', exact: true }).click();
  expect((await page.evaluate(() => (window as any).__spoken.at(-1))).text).toBe(
    tales[0].pages[1].english,
  );
  await openGame(page, '소리 탐정');
  await page.getByRole('button', { name: '단어 힌트 보기', exact: true }).click();
  const word = await page.locator('.sound-hint').innerText();
  await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: word,
    lang: 'en-US',
  });
  await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
  await page.getByRole('button', { name: '영어 골! 축구 챌린지 시작', exact: true }).click();
  await page.getByRole('button', { name: '힌트 보기', exact: true }).click();
  const phrase = await page.locator('.soccer-hint strong').innerText();
  await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: phrase,
    lang: 'en-US',
  });
  const soccerStops = await page.evaluate(() => (window as any).__stops);
  await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__stops)).toBeGreaterThan(soccerStops);
});
