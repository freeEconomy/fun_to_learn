import { test, expect } from '@playwright/test';

test('adventure home shows real progress and all three destinations remain usable', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  const art = page.locator('.explorer-hero-art');
  await expect
    .poll(() => art.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await expect(page.getByLabel('오늘 완료한 모험 0개, 전체 3개')).toBeVisible();
  await page.getByRole('button', { name: '오늘의 모험 시작', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '귀 쫑긋! 어떤 사진일까?', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '이야기 성 모험 시작', exact: true }).click();
  await expect(page.locator('.tale-cover')).toHaveCount(30);
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await page.getByRole('button', { name: '챔피언 경기장 모험 시작', exact: true }).click();
  await expect(page.locator('.game-tile')).toHaveCount(7);
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.name = '도윤';
    p.leaves = 50;
    p.symbol = '🐱';
    p.activityRecords = [{ activityId: 'game:soccer', score: 90, date: new Date().toISOString() }];
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /도윤, 오늘은/ })).toBeVisible();
  await expect(page.getByLabel('오늘 완료한 모험 1개, 전체 3개')).toBeVisible();
  await expect(page.getByRole('button', { name: '챔피언 경기장 모험 시작' })).toContainText(
    '오늘 완료',
  );
  await expect(page.getByLabel('나의 학습 현황')).toContainText('50 P');
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
});

test('adventure home fits narrow screens with readable controls and no running animations', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: '오늘의 모험 시작', exact: true })).toBeVisible();
  }
  await page.setViewportSize({
    width: test.info().project.name === 'mobile' ? 390 : 1280,
    height: 850,
  });
  await page.screenshot({ path: test.info().outputPath('adventure-home.png'), fullPage: true });
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});
