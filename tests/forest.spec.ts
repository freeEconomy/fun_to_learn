import { test, expect, type Page } from '@playwright/test';
import { words, makeQuiz } from '../lib/forest/content';
import credits from '../lib/forest/photo-credits.json';
async function parent(page: Page) {
  await page.getByRole('button', { name: '부모님', exact: true }).click();
  const text = await page.locator('.forest-modal label').innerText();
  const match = text.match(/(\d+)\s*\+\s*(\d+)/)!;
  await page.getByLabel('부모 확인 답').fill(String(Number(match[1]) + Number(match[2])));
  await page.getByRole('button', { name: '부모님 학습실 열기' }).click();
}
async function complete(page: Page, word = words[0]) {
  const quiz = makeQuiz(word);
  for (let i = 0; i < quiz.length; i++) {
    await page.locator('.forest-choice').filter({ hasText: quiz[i].answer }).click();
    await page
      .getByRole('button', {
        name: i === quiz.length - 1 ? '학습 결과 보기' : '다음 문제',
        exact: true,
      })
      .click();
  }
}
test('English: local real photos, bilingual search, six situations, quiz, profile and zero API', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith('/api/') || url.origin !== 'http://127.0.0.1:3199')
      external.push(r.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /어떤 영어/ })).toBeVisible();
  await page.getByLabel('단어 찾기').fill('없는단어');
  await page.getByRole('button', { name: '찾기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('아직 준비하지 않은');
  await page.getByLabel('단어 찾기').fill('BUS');
  await page.getByRole('button', { name: '찾기', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'bus', exact: true })).toBeVisible();
  const photo = page.locator('.english-word-detail img');
  await expect
    .poll(() => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  await page.getByRole('button', { name: '부탁·질문', exact: true }).click();
  await expect(page.getByText(words[0].sentences[2], { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다른 문장', exact: true }).click();
  await expect(page.getByText(words[0].alternate[2], { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '뜻 숨기기', exact: true }).click();
  await expect(page.locator('.english-translation')).toHaveCount(0);
  await page.getByRole('button', { name: '뜻 보기', exact: true }).click();
  await page.getByRole('button', { name: '상황에서 써 보기' }).click();
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await expect(page.getByText('6 / 6장면')).toBeVisible();
  await page.getByRole('button', { name: '상황 퀴즈 풀기' }).click();
  const q = makeQuiz(words[0])[0];
  await page
    .locator('.forest-choice')
    .filter({ hasText: q.options.find((o) => o !== q.answer)! })
    .click();
  await expect(page.getByRole('button', { name: '다음 문제', exact: true })).toBeDisabled();
  await complete(page);
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await expect(page.locator('.forest-result-stats')).toContainText('80점');
  await expect(page.getByRole('img', { name: '별 4개, 전체 5개' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'bus, 내 말로 한 걸음!' })).toBeVisible();
  await page.getByRole('button', { name: '학습카드 꾸미기' }).click();
  await page.getByLabel('이름 또는 별명').fill('민우');
  await page.getByRole('button', { name: '나침반 표식' }).click();
  await page.getByRole('button', { name: '학습카드 저장' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: /민우, 오늘은/ })).toBeVisible();
  await parent(page);
  await expect(page.locator('.forest-records')).toContainText('4/5');
  await expect(page.locator('.english-credits li')).toHaveCount(credits.length);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('English: every word has a static licensed photograph without animated content', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/');
  for (const w of words) {
    await page.getByRole('button', { name: '홈', exact: true }).click();
    await page.getByLabel('단어 찾기').fill(w.korean);
    await page.getByRole('button', { name: '찾기', exact: true }).click();
    await expect(page.getByRole('heading', { name: w.name, exact: true })).toBeVisible();
    const img = page.locator('.english-word-detail img');
    await expect
      .poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0))
      .toBe(true);
    await expect(img).toHaveAttribute('src', w.photo);
    await expect(page.locator('video,.picture-book,.forest-avatar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '장면 재생', exact: true })).toHaveCount(0);
  }
  await page.screenshot({
    path: test.info().outputPath('english-word.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await page.screenshot({
    path: test.info().outputPath('english-home.png'),
    fullPage: true,
  });
  await expect(page.getByRole('button', { name: '동물', exact: true })).toBeVisible();
  await expect(page.locator('footer')).toContainText(`영어 예문 ${words.length * 6}개`);
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test('English: kindergarten topics filter six lessons each and open the matching word', async ({
  page,
}) => {
  await page.goto('/');
  for (const category of ['스포츠', '놀이', '놀이터', '음식', '동물'] as const) {
    await page.getByRole('button', { name: category, exact: true }).click();
    await expect(page.locator('.english-word-card')).toHaveCount(6);
    const first = words.find((word) => word.category === category)!;
    await page.locator('.english-word-card').first().click();
    await expect(page.getByRole('heading', { name: first.name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: '부탁·질문', exact: true }).click();
    await expect(page.getByText(first.sentences[2], { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '상황에서 써 보기' }).click();
    await expect(page.getByText(first.story.pages[0], { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '홈', exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('English: voices use en-US, narration follows the current scene and survives no-voice fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let active: any;
    (window as any).__spoken = [];
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
        getVoices: () =>
          localStorage.getItem('test-no-english') ? [] : [{ lang: 'ko-KR' }, { lang: 'en-US' }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {
          active?.onend?.();
          active = null;
        },
        speak: (u: any) => {
          active = u;
          (window as any).__spoken.push({ text: u.text, lang: u.lang, voice: u.voice.lang });
          u.onstart?.();
        },
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page
    .getByRole('navigation', { name: '생활 영어 빠른 연습' })
    .getByRole('button', { name: '상황 영어', exact: true })
    .click();
  await page.getByRole('button', { name: '이 장면 듣기' }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: words[0].story.pages[0],
    lang: 'en-US',
    voice: 'en-US',
  });
  await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await expect(page.getByText('영어를 읽고 있어요.')).toHaveCount(0);
  await page.getByRole('button', { name: '이 장면 듣기' }).click();
  expect((await page.evaluate(() => (window as any).__spoken.at(-1))).text).toBe(
    words[0].story.pages[1],
  );
  await page.getByRole('button', { name: '상황 읽기 정지', exact: true }).click();
  await page.evaluate(() => {
    localStorage.setItem('test-no-english', '1');
  });
  await page.reload();
  await page.getByRole('button', { name: '사진 단어', exact: true }).click();
  await page.getByRole('button', { name: '단어 듣기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('영어 읽기 목소리');
});
test('English: legacy Korean records are kept, repeated quiz does not mint points, reset is scoped', async ({
  page,
}) => {
  const legacy = {
    name: '민우',
    leaves: 20,
    records: [{ word: 'apple', firstTry: 2, total: 3 }],
    selected: 'apple',
  };
  await page.addInitScript((p) => {
    if (!localStorage.getItem('wordforest-v1'))
      localStorage.setItem('wordforest-v1', JSON.stringify(p));
  }, legacy);
  await page.goto('/');
  await expect(page.locator('.forest-leaves')).toContainText('20 P');
  for (let run = 0; run < 2; run++) {
    await page.getByRole('button', { name: '퀴즈', exact: true }).click();
    await page.getByRole('button', { name: '복습 · 마지막에 확인' }).click();
    for (let i = 0; i < 5; i++) {
      await page.locator('.forest-choice').first().click();
      await expect(page.locator('.forest-feedback')).toHaveCount(0);
      await page
        .getByRole('button', { name: i === 4 ? '학습 결과 보기' : '다음 문제', exact: true })
        .click();
    }
    await expect(page.locator('.forest-leaves')).toContainText('30 P');
  }
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    p.discovery = {
      entries: {
        dog: {
          last: new Date().toISOString(),
          due: new Date().toISOString(),
          streak: 1,
          needsReview: false,
        },
      },
      days: [new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })],
      session: { ids: ['soccer', 'dog', 'apple'], results: [] },
    };
    localStorage.setItem('wordforest-english-v1', JSON.stringify(p));
  });
  await page.reload();
  await parent(page);
  await expect(page.getByRole('heading', { name: '3단어 탐험 기록', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '영어 프로필과 기록 삭제' }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.locator('.forest-leaves')).toContainText('30 P');
  await page.getByRole('button', { name: '영어 프로필과 기록 삭제' }).click();
  await page.getByRole('button', { name: '영어 기록 삭제', exact: true }).click();
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('0 P');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('wordforest-english-v1')!).discovery),
  ).toEqual({ entries: {}, days: [], session: null });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wordforest-v1')!))).toEqual(
    legacy,
  );
});

test('Fun To Run: title and chosen character persist without resetting learning points', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Fun To Run — 사진으로 배우는 생활 영어');
  await expect(page.getByRole('button', { name: 'Fun To Run 홈', exact: true })).toBeVisible();
  await expect(page.locator('.run-companion-face')).toHaveText('🐰');
  await page.getByRole('button', { name: '학습 친구 바꾸기' }).click();
  await page.getByRole('button', { name: '고양이 캐릭터', exact: true }).click();
  await page.getByRole('button', { name: '학습카드 저장', exact: true }).click();
  await page.reload();
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await page.getByRole('button', { name: '퀴즈', exact: true }).click();
  await complete(page);
  await expect(page.locator('.forest-result-stats')).toContainText('100점');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: 'Fun To Run 홈', exact: true }).click();
  await expect(page.getByLabel('나의 학습 현황')).toContainText('10 P');
  await page.reload();
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
