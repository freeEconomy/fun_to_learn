import { test, expect, type Page } from '@playwright/test';
import { words } from '../lib/forest/content';
import { chessPieces, type PieceType } from '../lib/forest/chess-game';
import { countingWords } from '../lib/forest/board-learning';
import { longestGomokuRun, type Stone } from '../lib/forest/gomoku-game';
import { speechAudioSource } from '../lib/forest/speech-audio';

async function openBoard(page: Page, kind: 'chess' | 'gomoku', practice = true) {
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await page.getByRole('radio', { name: practice ? /연습 모드/ : /도전 모드/ }).check();
  await page
    .getByRole('button', {
      name: kind === 'chess' ? '영어 체스 클럽 시작' : '영어 오목 탐험 시작',
      exact: true,
    })
    .click();
}
async function solve(page: Page, answer: string, wrong = false) {
  const mission = page.getByRole('dialog', { name: '영어로 한 수 더!' });
  await expect(mission).toBeVisible();
  await expect(mission.getByRole('button', { name: '이 수 두기', exact: true })).toBeDisabled();
  if (wrong) {
    const alternatives = await mission.locator('.board-word-options>button').allTextContents();
    await mission
      .getByRole('button', { name: alternatives.find((text) => text !== answer)!, exact: true })
      .click();
    await expect(mission.getByRole('status')).toContainText('다른 답');
    await expect(mission.getByRole('button', { name: '이 수 두기', exact: true })).toBeDisabled();
  }
  await mission.getByRole('button', { name: answer, exact: true }).click();
  await expect(mission.getByRole('status')).toContainText('맞았어요');
  await mission.getByRole('button', { name: '이 수 두기', exact: true }).click();
  await expect(mission).toHaveCount(0);
}
async function chessTurn(page: Page, turn: number) {
  const board = page.getByRole('group', { name: '체스판, 흰색이 나예요' });
  await expect(board.locator('[data-piece^="w"]').first()).toBeEnabled();
  const squares = await board.locator('[data-piece^="w"]').evaluateAll((nodes) =>
    nodes.map((el) => ({
      square: el.getAttribute('data-square')!,
      piece: el.getAttribute('data-piece')!,
    })),
  );
  for (const { square, piece } of squares) {
    await board.locator(`[data-square="${square}"]`).click();
    const targets = board.locator('[data-legal="true"]');
    if (!(await targets.count())) continue;
    await targets.first().click();
    const answer =
      turn % 2 === 0
        ? chessPieces[piece[1] as PieceType].english
        : words[(turn * 7 + 3) % words.length].name;
    await solve(page, answer);
    return;
  }
  throw Error('No playable white piece found');
}
async function gomokuTurn(page: Page, turn: number) {
  const points = page.locator('.gomoku-point');
  await expect(points.first()).toBeVisible();
  const available = points.filter({ hasNot: page.locator('.gomoku-stone') }).first();
  await expect(available).toBeEnabled();
  const states = await points.evaluateAll((nodes) =>
    nodes.map((el) => Number(el.getAttribute('data-stone')) as Stone),
  );
  const row = Number(await available.getAttribute('data-row')),
    col = Number(await available.getAttribute('data-col'));
  const answer =
    turn % 3 === 0
      ? countingWords[Math.min(5, longestGomokuRun(states, 9, row, col, 1)) - 1]
      : turn % 3 === 1
        ? col < 4
          ? 'left'
          : col > 4
            ? 'right'
            : 'center'
        : 'black';
  await available.click();
  await solve(page, answer);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
});

test('chess uses legal moves, new neural audio, retry, cancel, undo during bot thinking and restart', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openBoard(page, 'chess');
  await expect(page.locator('.chess-square')).toHaveCount(64);
  await expect(page.locator('.chess-square[data-piece]:not([data-piece=""])')).toHaveCount(32);
  await page.locator('[data-square="a1"]').click();
  await expect(page.locator('[data-legal="true"]')).toHaveCount(0);
  await page.locator('[data-square="e2"]').click();
  await expect(page.locator('[data-square="e3"]')).toHaveAttribute('data-legal', 'true');
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('data-legal', 'true');
  await page.locator('[data-square="e5"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-square="e4"]').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-square="e2"]')).toHaveAttribute('data-piece', 'wp');
  await page.locator('[data-square="e4"]').click();
  const audio = page.waitForResponse(
    (r) => new URL(r.url()).pathname === speechAudioSource('pawn'),
  );
  await page.getByRole('dialog').getByRole('button', { name: '영어 듣기', exact: true }).click();
  expect([200, 206]).toContain((await audio).status()); // HTMLAudio may request byte ranges.
  await solve(page, 'pawn', true);
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('data-piece', 'wp');
  await page.getByRole('button', { name: '한 수 되돌리기', exact: true }).click();
  await page.waitForTimeout(700); // An already scheduled bot reply must not reappear after undo.
  await expect(page.locator('[data-square="e2"]')).toHaveAttribute('data-piece', 'wp');
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('data-piece', '');
  await expect(page.getByRole('progressbar', { name: '완료한 영어 미션' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  await solve(page, 'pawn');
  await expect(page.locator('[data-square="a2"]')).toBeEnabled();
  await expect(page.locator('.chess-square.last-move')).toHaveCount(2);
  await page.getByRole('button', { name: '다시 시작', exact: true }).click();
  await page.getByRole('button', { name: '계속 두기', exact: true }).click();
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('data-piece', 'wp');
  await page.getByRole('button', { name: '다시 시작', exact: true }).click();
  await page.getByRole('button', { name: '새 대국 시작', exact: true }).click();
  await expect(page.locator('[data-square="e2"]')).toHaveAttribute('data-piece', 'wp');
  await expect(page.getByRole('progressbar', { name: '완료한 영어 미션' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('button', { name: '두는 법', exact: true }).click();
  await expect(page.locator('.board-rules')).toContainText('캐슬링');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('english-chess.png'), fullPage: true });
});

test('both games finish English goals, preserve records, cap daily rewards and replay fresh boards', async ({
  page,
}) => {
  test.setTimeout(90000);
  const unexpected: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin !== 'http://127.0.0.1:3199' || u.pathname.startsWith('/api/'))
      unexpected.push(r.url());
  });
  await openBoard(page, 'chess');
  for (let turn = 0; turn < 4; turn++) await chessTurn(page, turn);
  const finish = page.getByRole('button', { name: '학습 모험 마치기', exact: true });
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.getByLabel('모험 완료')).toContainText('+10 P');
  await expect(page.locator('.adventure-score')).toContainText('100');
  await page.getByRole('button', { name: '한 번 더 놀기', exact: true }).click();
  await expect(page.locator('[data-square="e2"]')).toHaveAttribute('data-piece', 'wp');
  for (let turn = 0; turn < 4; turn++) await chessTurn(page, turn);
  await page.getByRole('button', { name: '학습 모험 마치기', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('이미 받았어요');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await page.getByRole('button', { name: '영어 오목 탐험 시작', exact: true }).click();
  await expect(page.locator('.gomoku-point')).toHaveCount(81);
  for (let turn = 0; turn < 4; turn++) await gomokuTurn(page, turn);
  await expect(page.getByRole('button', { name: '학습 모험 마치기', exact: true })).toBeEnabled();
  await page.screenshot({ path: test.info().outputPath('english-gomoku.png'), fullPage: true });
  await page.getByRole('button', { name: '학습 모험 마치기', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('+10 P');
  const profile = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordforest-english-v1')!),
  );
  expect(
    profile.activityRecords.filter((r: { activityId: string }) =>
      ['game:chess', 'game:gomoku'].includes(r.activityId),
    ),
  ).toHaveLength(2);
  expect(profile.leaves).toBe(20);
  await page.reload();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '영어 체스 클럽 시작', exact: true }),
  ).toContainText('오늘 완료');
  await expect(
    page.getByRole('button', { name: '영어 오목 탐험 시작', exact: true }),
  ).toContainText('오늘 완료');
  expect(unexpected).toEqual([]);
});

test('gomoku protects occupied points, undoes complete rounds, and challenge uses 11×11 with six missions', async ({
  page,
}) => {
  await openBoard(page, 'gomoku');
  await page.locator('[data-row="4"][data-col="4"]').click();
  await solve(page, 'one');
  await expect(page.locator('[data-row="4"][data-col="4"]')).toHaveAttribute('data-stone', '1');
  await expect(page.locator('[data-row="4"][data-col="4"]')).toBeDisabled();
  await expect(page.locator('[data-stone="2"]')).toHaveCount(1);
  await page.getByRole('button', { name: '한 수 되돌리기', exact: true }).click();
  await expect(page.locator('.gomoku-stone')).toHaveCount(0);
  await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
  await page.getByRole('radio', { name: /도전 모드/ }).check();
  await page.getByRole('button', { name: '영어 오목 탐험 시작', exact: true }).click();
  await expect(page.locator('.gomoku-point')).toHaveCount(121);
  await expect(page.getByRole('progressbar', { name: '완료한 영어 미션' })).toHaveAttribute(
    'aria-valuemax',
    '6',
  );
  await page.getByRole('button', { name: '두는 법', exact: true }).click();
  await expect(page.locator('.board-rules')).toContainText('11×11');
});

test('both boards and mission dialogs fit a narrow phone, trap focus and allow text-only play', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openBoard(page, 'chess');
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.getByRole('button', { name: '힌트 보기', exact: true }).click();
  await expect(page.locator('.board-hint')).toContainText('pawn');
  await solve(page, 'pawn');
  await expect(page.locator('[data-square="a2"]')).toBeEnabled();
  await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
  await page.getByRole('button', { name: '영어 오목 탐험 시작', exact: true }).click();
  await page.locator('[data-row="4"][data-col="4"]').click();
  await solve(page, 'one');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('board-game-320.png'), fullPage: true });
});
