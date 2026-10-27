import index from './speech-index.json';
import { normalizeSpeech } from './speech-text';

export function speechAudioSource(text: string): string | undefined {
  const file = (index as Record<string, string>)[normalizeSpeech(text)];
  return file ? `/speech/${file}` : undefined;
}
export function usesMediaNarration(browser: Navigator): boolean {
  return (
    /iPhone|iPad|iPod/i.test(browser.userAgent) ||
    (browser.platform === 'MacIntel' && browser.maxTouchPoints > 1)
  );
}
