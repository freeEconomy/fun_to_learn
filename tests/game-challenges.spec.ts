import { test, expect, type Page } from '@playwright/test';
import { words } from '../lib/forest/content';
import { deliveryShops } from '../lib/forest/game-challenges';
import { soccerChallenges } from '../lib/forest/soccer-content';
import { speechAudioSource } from '../lib/forest/speech-audio';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__nativeCalls = 0;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [],
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        speak: () => {
          (window as any).__nativeCalls++;
        },
      },
    });
    HTMLMediaElement.prototype.play = function () {
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      this.dispatchEvent(new Event('pause'));
    };
    HTMLMediaElement.prototype.load = function () {};
  });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
});
async function enter(page: Page, title: string, practice = false) {
  await page.getByRole('button', { name: '게임', exact: true }).click();
  if (practice) await page.getByRole('radio', { name: /연습 모드/ }).check();
  await page.getByRole('button', { name: `${title} 시작`, exact: true }).click();
}
async function next(page: Page, last: boolean) {
  await page.getByRole('button', { name: last ? '모험 마치기' : '다음 미션', exact: true }).click();
}

test('challenge is the default, seven games show rules and practice preserves the original card count', async ({
  page,
}) => {
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('radio', { name: /도전 모드/ })).toBeChecked();
  await expect(page.locator('.game-tile')).toHaveCount(7);
  await expect(page.getByRole('button', { name: '짝꿍 카드 시작', exact: true })).toContainText(
    '6쌍',
  );
  await page.getByRole('button', { name: '짝꿍 카드 시작', exact: true }).click();
  await expect(page.locator('.memory-card')).toHaveCount(12);
  const pairs = await page
    .locator('.memory-card')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('data-pair')!))]);
  for (const [n, id] of pairs.entries()) {
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="photo"]`).click();
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="word"]`).click();
    if (n === 3) await expect(page.getByLabel('모험 완료')).toHaveCount(0);
  }
  await expect(page.locator('.adventure-score')).toContainText('100');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await page.getByRole('radio', { name: /연습 모드/ }).check();
  await page.getByRole('button', { name: '짝꿍 카드 시작', exact: true }).click();
  await expect(page.locator('.memory-card')).toHaveCount(8);
  await expect(page.locator('.game-level-banner')).toContainText('연습 모드');
});

test('challenge listening offers four choices, uses AI audio, permits a retry and completes six rounds', async ({
  page,
}) => {
  await enter(page, '소리 탐정');
  for (let n = 0; n < 6; n++) {
    await expect(page.locator('.listening-options button')).toHaveCount(4);
    await page.getByRole('button', { name: '단어 힌트 보기', exact: true }).click();
    const text = await page.locator('.sound-hint').innerText();
    const word = words.find((word) => word.name === text)!;
    await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
    await expect(page.locator('audio[data-learning-audio]')).toHaveAttribute(
      'src',
      speechAudioSource(text)!,
    );
    if (n === 0) {
      await page
        .locator('.listening-options button')
        .filter({ hasNotText: word.korean })
        .first()
        .click();
      await expect(page.getByRole('button', { name: '다음 소리', exact: true })).toBeDisabled();
    }
    await page.getByRole('button', { name: `${word.korean} 선택`, exact: true }).click();
    await page
      .getByRole('button', { name: n === 5 ? '보물상자 열기' : '다음 소리', exact: true })
      .click();
    await expect(page.locator('audio[data-learning-audio]')).not.toHaveAttribute('src', /.+/);
  }
  await expect(page.locator('.adventure-score')).toContainText('92');
  expect(await page.evaluate(() => (window as any).__nativeCalls)).toBe(0);
});

test('challenge train rejects an unused word and lets children correct six longer sentences', async ({
  page,
}) => {
  await enter(page, '문장 기차');
  for (let round = 0; round < 6; round++) {
    const count = (await page.locator('.sentence-tokens button').count()) - 1;
    await expect(page.locator('.sentence-tokens button[data-position="-1"]')).toHaveCount(1);
    if (round === 0) {
      await page.locator('.sentence-tokens button[data-position="-1"]').click();
      for (let n = 0; n < count - 1; n++)
        await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
      await page.getByRole('button', { name: '문장 확인', exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('순서를 조금');
      await page.getByRole('button', { name: '다시 만들기', exact: true }).click();
    }
    for (let n = 0; n < count; n++)
      await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
    await page.getByRole('button', { name: '문장 확인', exact: true }).click();
    const button = page.getByRole('button', {
      name: round === 5 ? '여행 마치기' : '다음 역으로',
      exact: true,
    });
    if (round === 0)
      await button.evaluate((b: HTMLButtonElement) => {
        b.click();
        b.click();
      });
    else await button.click();
    if (round < 5)
      await expect(page.getByRole('progressbar', { name: '문장 여행' })).toHaveAttribute(
        'aria-valuenow',
        String(round + 2),
      );
  }
  await expect(page.locator('.adventure-score')).toContainText('92');
});

test('challenge soccer requires six goals and its distractors are real football expressions', async ({
  page,
}) => {
  await enter(page, '영어 골! 축구 챌린지');
  await expect(page.getByLabel('0골, 목표 6골')).toBeVisible();
  for (let round = 0; round < 6; round++) {
    await page.getByRole('button', { name: '힌트 보기', exact: true }).click();
    const answer = await page.locator('.soccer-hint strong').innerText();
    const choices = await page.locator('.soccer-options button').allInnerTexts();
    expect(
      choices.every((choice) => soccerChallenges.some((item) => choice.endsWith(item.answer))),
    ).toBe(true);
    if (round === 0) {
      await page.locator('.soccer-options button').filter({ hasNotText: answer }).first().click();
      await page.getByRole('button', { name: '슛! 골 넣기', exact: true }).click();
      await page.getByRole('button', { name: '다시 슛 준비', exact: true }).click();
    }
    await page.locator('.soccer-options button').filter({ hasText: answer }).click();
    await page.getByRole('button', { name: '슛! 골 넣기', exact: true }).click();
    const advance = page.getByRole('button', {
      name: round === 5 ? '경기 결과 보기' : '다음 공격',
      exact: true,
    });
    if (round === 0)
      await advance.evaluate((b: HTMLButtonElement) => {
        b.click();
        b.click();
      });
    else await advance.click();
  }
  await expect(page.locator('.adventure-score')).toContainText('92');
});

async function spell(page: Page, rounds: number, mistake: boolean, extras: number) {
  for (let round = 0; round < rounds; round++) {
    const korean = await page.locator('.spelling-clue h2').innerText();
    const word = words.find((word) => word.korean === korean)!;
    await expect(page.locator('.letter-bank button')).toHaveCount(word.name.length + extras);
    await expect(page.getByRole('button', { name: '정답 확인', exact: true })).toBeDisabled();
    if (round === 0 && mistake) {
      const letters = await page
        .locator('.letter-bank button')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-letter')!));
      const extra = letters.find((letter) => !word.name.includes(letter))!;
      await page.locator(`.letter-bank button[data-letter="${extra}"]`).click();
      for (const char of word.name.slice(0, -1))
        await page.locator(`.letter-bank button[data-letter="${char}"]:enabled`).first().click();
      await page.getByRole('button', { name: '정답 확인', exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('글자의 순서');
      await page.getByRole('button', { name: '다시 고르기', exact: true }).click();
      await page.getByRole('button', { name: '첫 글자 힌트', exact: true }).click();
      await expect(page.locator('.quest-hint strong')).toHaveText(word.name[0].toUpperCase());
    }
    await page.getByRole('button', { name: '단어 소리 듣기', exact: true }).click();
    await expect(page.locator('audio')).toHaveAttribute('src', speechAudioSource(word.name)!);
    for (const char of word.name)
      await page.locator(`.letter-bank button[data-letter="${char}"]:enabled`).first().click();
    await page.getByRole('button', { name: '정답 확인', exact: true }).click();
    await expect(page.locator('.game-feedback')).toContainText(`조립 성공! ${word.name}`);
    const button = page.getByRole('button', {
      name: round === rounds - 1 ? '모험 마치기' : '다음 미션',
      exact: true,
    });
    if (round === 0)
      await button.evaluate((b: HTMLButtonElement) => {
        b.click();
        b.click();
      });
    else await button.click();
    await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
  }
}
test('spelling supports unused letters, retry, AI speech, double-tap protection and shared daily rewards across levels', async ({
  page,
}) => {
  await enter(page, '알파벳 공방');
  await spell(page, 6, true, 2);
  await expect(page.locator('.adventure-score')).toContainText('92');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await page.getByRole('radio', { name: /연습 모드/ }).check();
  await page.getByRole('button', { name: '알파벳 공방 시작', exact: true }).click();
  await spell(page, 5, false, 0);
  await expect(page.locator('.adventure-score')).toContainText('100');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.reload();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('button', { name: '알파벳 공방 시작', exact: true })).toContainText(
    '최고 기록 100점',
  );
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem('wordforest-english-v1')!).activityRecords,
  );
  expect(records.filter((record: any) => record.activityId === 'game:spell')).toHaveLength(1);
});

test('delivery reads English first, reveals photos on demand, allows retries and records all eight parcels', async ({
  page,
}) => {
  await enter(page, '단어 배달부');
  for (let round = 0; round < 8; round++) {
    await expect(page.locator('.parcel-hint')).toHaveCount(0);
    const english = await page.locator('.delivery-parcel h2').innerText();
    const word = words.find((word) => word.name === english)!;
    const shop = deliveryShops.find((shop) => shop.wordIds.includes(word.id))!;
    await page.getByRole('button', { name: '꾸러미 단어 듣기', exact: true }).click();
    await expect(page.locator('audio')).toHaveAttribute('src', speechAudioSource(english)!);
    if (round === 0) {
      await page.getByRole('button', { name: '사진 힌트 보기', exact: true }).click();
      await expect(page.locator('.parcel-hint')).toContainText(word.korean);
      const other = deliveryShops.find((item) => item.id !== shop.id)!;
      await page.getByRole('button', { name: `${other.title}로 배달`, exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('다른 가게');
    }
    await page.getByRole('button', { name: `${shop.title}로 배달`, exact: true }).click();
    await expect(page.locator('.game-feedback')).toContainText('배달 성공');
    await next(page, round === 7);
  }
  await expect(page.locator('.adventure-score')).toContainText('94');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
});

test('memory trail hides the study map, supports audio, retries and advances from three to four words', async ({
  page,
}) => {
  await enter(page, '순서 기억 탐험');
  for (let round = 0; round < 5; round++) {
    const names = await page.locator('.sequence-study strong').allInnerTexts();
    expect(names).toHaveLength(round < 2 ? 3 : 4);
    const targets = names.map((name) => words.find((word) => word.name === name)!);
    await page.getByRole('button', { name: '1번째 단어 듣기', exact: true }).click();
    await expect(page.locator('audio')).toHaveAttribute('src', speechAudioSource(names[0])!);
    await page.getByRole('button', { name: '기억했어요! 지도 덮기', exact: true }).click();
    await expect(page.locator('.sequence-study')).toHaveCount(0);
    await expect(page.locator('.sequence-options button')).toHaveCount(6);
    await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
    if (round === 0) {
      for (const word of [...targets].reverse())
        await page.getByRole('button', { name: `${word.korean} 순서에 넣기`, exact: true }).click();
      await page.getByRole('button', { name: '정답 확인', exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('순서가 조금');
      await page.getByRole('button', { name: '기억 카드 다시 보기', exact: true }).click();
      await expect(page.locator('.sequence-study strong')).toHaveText(names);
      await page.getByRole('button', { name: '기억했어요! 지도 덮기', exact: true }).click();
    }
    for (const word of targets)
      await page.getByRole('button', { name: `${word.korean} 순서에 넣기`, exact: true }).click();
    await page.getByRole('button', { name: '정답 확인', exact: true }).click();
    await expect(page.locator('.game-feedback')).toContainText('길 찾기 성공');
    await next(page, round === 4);
  }
  await expect(page.locator('.adventure-score')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
});

test('practice delivery and memory trail remain playable with photos and app sound switched off', async ({
  page,
}) => {
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  await enter(page, '단어 배달부', true);
  for (let round = 0; round < 6; round++) {
    await expect(page.locator('.delivery-shops button')).toHaveCount(3);
    await expect(page.locator('.parcel-hint')).toBeVisible();
    const english = await page.locator('.delivery-parcel h2').innerText();
    const word = words.find((word) => word.name === english)!;
    const shop = deliveryShops.find((shop) => shop.wordIds.includes(word.id))!;
    await page.getByRole('button', { name: `${shop.title}로 배달`, exact: true }).click();
    await next(page, round === 5);
  }
  await expect(page.locator('.adventure-score')).toContainText('100');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await page.getByRole('button', { name: '순서 기억 탐험 시작', exact: true }).click();
  for (let round = 0; round < 4; round++) {
    const names = await page.locator('.sequence-study strong').allInnerTexts();
    expect(names).toHaveLength(round < 2 ? 2 : 3);
    await page.getByRole('button', { name: '기억했어요! 지도 덮기', exact: true }).click();
    await expect(page.locator('.sequence-options button')).toHaveCount(4);
    for (const name of names) {
      const word = words.find((word) => word.name === name)!;
      await page.getByRole('button', { name: `${word.korean} 순서에 넣기`, exact: true }).click();
    }
    await page.getByRole('button', { name: '정답 확인', exact: true }).click();
    await next(page, round === 3);
  }
  await expect(page.locator('.adventure-score')).toContainText('100');
  await expect(page.locator('.forest-leaves')).toContainText('20 P');
  await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
});

test('new games fit 320px, use keyboard-sized controls and stop narration when leaving', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 800 });
  for (const title of [
    '알파벳 공방',
    '단어 배달부',
    '순서 기억 탐험',
    '짝꿍 카드',
    '소리 탐정',
    '문장 기차',
  ]) {
    await enter(page, title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const buttons = page.locator('.game-board button');
    const sizes = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
    expect(sizes.every((height) => height >= 44)).toBe(true);
    if (title === '짝꿍 카드') {
      const geometry = await page.locator('.memory-grid').evaluate((grid) => {
        const outer = grid.getBoundingClientRect();
        const cards = [...grid.querySelectorAll('button')].map((card) => {
          const r = card.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        });
        return { left: outer.left, right: outer.right, cards };
      });
      for (const [i, card] of geometry.cards.entries()) {
        expect(card.left).toBeGreaterThanOrEqual(geometry.left - 1);
        expect(card.right).toBeLessThanOrEqual(geometry.right + 1);
        for (const other of geometry.cards.slice(i + 1)) {
          const overlapX = Math.min(card.right, other.right) - Math.max(card.left, other.left);
          const overlapY = Math.min(card.bottom, other.bottom) - Math.max(card.top, other.top);
          expect(overlapX > 1 && overlapY > 1).toBe(false);
        }
      }
    }
    await page.screenshot({
      path: test.info().outputPath(`game-${title}-320.png`),
      fullPage: true,
    });
    const audioNames: Record<string, string> = {
      '알파벳 공방': '단어 소리 듣기',
      '단어 배달부': '꾸러미 단어 듣기',
      '순서 기억 탐험': '1번째 단어 듣기',
      '소리 탐정': '영어 소리 듣기',
      '문장 기차': '문장 힌트 듣기',
    };
    const audioButton =
      title === '짝꿍 카드'
        ? page.locator('.memory-card[data-kind="word"]').first()
        : page.getByRole('button', { name: audioNames[title], exact: true });
    await audioButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('audio')).toHaveAttribute('src', /\/speech\/.*\.mp3$/);
    await page.getByRole('button', { name: '게임 놀이터', exact: true }).click();
    await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('seven-games-menu-320.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
