import index from './speech-index.json';
import { normalizeSpeech } from './speech-text';

export function speechAudioSource(text: string): string | undefined {
  const file = (index as Record<string, string>)[normalizeSpeech(text)];
  return file ? `/speech/${file}` : undefined;
}
export function canPlaySpeechAudio(media: HTMLAudioElement | null): boolean {
  try {
    return !!media?.canPlayType('audio/mpeg');
  } catch {
    return false;
  }
}
