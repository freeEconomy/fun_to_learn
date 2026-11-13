import { test, expect } from '@playwright/test';

const destinations = [
  'https://aiagent-xi-two.vercel.app/',
  'https://docuagent-xi.vercel.app/',
  'https://stock-ai-mocha.vercel.app/',
];
const demoPath = '/case-studies/ai-agent-demo.mp4';

test('case studies show three real thumbnails, preserve site destinations and fit phones and tablets', async ({
  page,
  isMobile,
}) => {
  await page.goto('/architecture#case-studies-section');
  const section = page.getByRole('region', { name: 'AI 구축 사례' });
  const cards = section.locator('.case-study-card');
  await expect(cards).toHaveCount(3);
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const image of await section.getByRole('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth >= 1200),
        )
        .toBe(true);
      const ratio = await image.evaluate(
        (el: HTMLImageElement) => el.naturalWidth / el.naturalHeight,
      );
      expect(ratio).toBeCloseTo(1.6, 2);
    }
    const positions = await cards.evaluateAll((nodes) =>
      nodes.map((node) => ({
        x: node.getBoundingClientRect().x,
        y: node.getBoundingClientRect().y,
      })),
    );
    expect(new Set(positions.map((p) => (width >= 768 ? p.y : p.x))).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const links = section.locator('.case-study-link');
  for (let i = 0; i < destinations.length; i++) {
    await expect(links.nth(i)).toHaveAttribute('href', destinations[i]);
    await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    await expect(links.nth(i)).toHaveAttribute('rel', 'noopener noreferrer');
    await page
      .context()
      .route(destinations[i], (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Case site</title>' }),
      );
    const image = cards.nth(i).getByRole('img');
    await image.scrollIntoViewIfNeeded();
    const box = (await image.boundingBox())!;
    const popup = page.waitForEvent('popup');
    // The stretched site link intentionally sits above the image.
    // Click its visible center as a user would, rather than forcing an image DOM click.
    if (isMobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const tab = await popup;
    await tab.waitForLoadState('domcontentloaded');
    expect(tab.url()).toBe(destinations[i]);
    expect(await tab.evaluate(() => window.opener === null)).toBe(true);
    await tab.close();
  }
  await expect(section.locator('a a')).toHaveCount(0);
  await expect(page.locator('#process-steps-section article')).toHaveCount(7);
  await expect(page.locator('#tools-section h3')).toHaveCount(5);
  await expect(page.locator('#stitch-codex-connector')).toHaveCount(1);
  await page.locator('#original-image-open').click();
  await expect(page.locator('#original-image-dialog')).toBeVisible();
  await page.getByRole('button', { name: '원본 이미지 닫기', exact: true }).click();
  await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 900 });
  await section.screenshot({ path: test.info().outputPath('case-study-thumbnails.png') });
});

test('AI Agent demo loads on demand, plays and seeks the actual uploaded H264 video, and stops when closed', async ({
  page,
}) => {
  const errors: string[] = [],
    mediaRequests: string[] = [],
    mediaStatuses: number[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === demoPath) mediaRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === demoPath) mediaStatuses.push(response.status());
  });
  await page.goto('/architecture#case-studies-section');
  const trigger = page.getByRole('link', { name: 'AI Agent 시연 영상 보기', exact: true });
  const video = page.locator('#case-demo-player');
  await trigger.scrollIntoViewIfNeeded();
  expect(mediaRequests).toEqual([]);
  await expect(video).not.toHaveAttribute('src');
  await expect(video).toHaveAttribute('preload', 'none');
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'AI Agent · 주간보고 연동 시연', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/case-demo-open/);
  await expect(video).toHaveAttribute('playsinline', '');
  expect(await video.evaluate((el: HTMLVideoElement) => el.controls)).toBe(true);
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(await video.evaluate((el: HTMLVideoElement) => el.duration)).toBeCloseTo(191.233, 1);
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0.25);
  expect(mediaStatuses.some((status) => status === 200 || status === 206)).toBe(true);
  await video.evaluate(
    (el: HTMLVideoElement) =>
      new Promise<void>((resolve) => {
        el.pause();
        el.addEventListener('seeked', () => resolve(), { once: true });
        el.currentTime = 90;
      }),
  );
  expect(await video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeCloseTo(90, 0);
  await expect(page.locator('#case-demo-error')).toBeHidden();
  await page.getByRole('button', { name: '시연 영상 닫기', exact: true }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: /원본 영상 열기/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '시연 영상 닫기', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await expect(video).not.toHaveAttribute('src');
  await expect(page.locator('body')).not.toHaveClass(/case-demo-open/);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(await video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(3);
  await dialog.screenshot({ path: test.info().outputPath('ai-agent-demo-player.png') });
  await page.getByRole('button', { name: '시연 영상 닫기', exact: true }).click();
  expect(errors).toEqual([]);
});

test('failed video requests show a direct-file fallback and the backdrop still closes and releases media', async ({
  page,
}) => {
  await page.route('**/case-studies/ai-agent-demo.mp4', (route) => route.abort());
  await page.goto('/architecture#case-studies-section');
  await page.getByRole('link', { name: 'AI Agent 시연 영상 보기', exact: true }).click();
  const dialog = page.locator('#case-demo-dialog');
  await expect(page.locator('#case-demo-error')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /원본 영상 열기/ })).toHaveAttribute(
    'href',
    demoPath,
  );
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
  await expect(page.locator('#case-demo-player')).not.toHaveAttribute('src');
  await expect(page.locator('body')).not.toHaveClass(/case-demo-open/);
});

test('the static gallery and demo link work without JavaScript and the MP4 supports byte-range streaming', async ({
  browser,
  request,
}) => {
  const response = await request.get(demoPath, { headers: { Range: 'bytes=0-1023' } });
  expect(response.status()).toBe(206);
  expect(response.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
  expect((await response.body()).length).toBe(1024);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3199/architecture#case-studies-section');
    await expect(page.locator('.case-study-thumbnail img')).toHaveCount(3);
    const demo = page.getByRole('link', { name: 'AI Agent 시연 영상 보기', exact: true });
    await expect(demo).toHaveAttribute('href', demoPath);
    await expect(demo).toHaveAttribute('target', '_blank');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    await context.close();
  }
});
