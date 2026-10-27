export const speechVoice = {
  id: 'kokoro-v1-michael-fp32-v1',
  engine: 'Kokoro-82M v1.0 (ONNX fp32)',
  voice: 'am_michael',
  locale: 'en-US',
  gender: 'male',
  sampleRate: 24000,
  bitrate: '96k',
} as const;

// Preserve saved speed presets, but play the default at the voice's original speed.
export function speechPlaybackRate(preset: number): number {
  return preset === 0.65 ? 0.85 : preset === 1 ? 1.1 : 1;
}
