import { test, expect, type Page } from '@playwright/test';

// Explicitly exercise the device-voice fallback for browsers without MP3 support.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.canPlayType = () => '';
  });
});

async function answer(page: Page, miss = false) {
  const hint = page.getByRole('button', { name: '힌트 보기', exact: true });
  if (await hint.count()) await hint.click();
  const correct = await page.locator('.soccer-hint strong').innerText();
  const options = page.locator('.soccer-options button');
  if (miss) {
    await options.filter({ hasNotText: correct }).first().click();
    await page.getByRole('button', { name: '슛! 골 넣기', exact: true }).click();
    await expect(page.locator('.soccer-feedback')).toContainText('한 번 더');
    await expect(page.locator('.soccer-score b')).toHaveText('0');
    await expect(options.first()).toBeDisabled();
    await expect(page.getByRole('button', { name: '다시 슛 준비' })).toBeFocused();
    await page.keyboard.press('Enter');
  }
  const target = options.filter({ hasText: correct });
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '슛! 골 넣기', exact: true }).click();
  await expect(page.locator('.soccer-feedback')).toContainText(`골! ${correct}`);
  await expect(page.locator('.soccer-pitch-action button')).toBeInViewport();
}

test('soccer supports saves, five goals, keyboard play, daily rewards and restored best scores', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.locator('.game-tile')).toHaveCount(4);
  await page.getByRole('button', { name: '영어 골! 축구 챌린지 시작' }).click();
  await expect(page.getByRole('button', { name: '슛! 골 넣기', exact: true })).toBeDisabled();
  for (let round = 0; round < 5; round++) {
    await answer(page, round === 0);
    await expect(page.locator('.soccer-score b')).toHaveText(String(round + 1));
    if (round === 0) {
      await page.screenshot({ path: test.info().outputPath('soccer-goal.png'), fullPage: true });
    }
    await page
      .getByRole('button', { name: round === 4 ? '경기 결과 보기' : '다음 공격', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '한 번 더 놀기', exact: true }).click();
  for (let round = 0; round < 5; round++) {
    await answer(page);
    await page
      .getByRole('button', { name: round === 4 ? '경기 결과 보기' : '다음 공격', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('100');
  await expect(page.getByLabel('모험 완료')).toContainText('이미 받았어요');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.reload();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('button', { name: '영어 골! 축구 챌린지 시작' })).toContainText(
    '최고 기록 100점',
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('wordforest-english-v1')!).activityRecords.filter(
        (r: { activityId: string }) => r.activityId === 'game:soccer',
      ),
    ),
  ).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('soccer remains playable at 320px without audio or motion', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {},
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await page.getByRole('button', { name: '영어 골! 축구 챌린지 시작' }).click();
  await expect(page.locator('.soccer-options button')).toHaveCount(3);
  await page.getByRole('button', { name: '영어 듣기', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: '영어 읽기 목소리가 없어요' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await answer(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('soccer-320px.png'), fullPage: true });
});
