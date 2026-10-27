export const speechVoice = {
  id: 'rms-us-male-96k-v2',
  engine: 'CMU Flite',
  voice: 'rms',
  locale: 'en-US',
  gender: 'male',
  sampleRate: 24000,
  bitrate: '96k',
} as const;

// Preserve saved speed presets, but play the default at the voice's original speed.
export function speechPlaybackRate(preset: number): number {
  return preset === 0.65 ? 0.85 : preset === 1 ? 1.1 : 1;
}
