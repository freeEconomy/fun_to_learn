export function normalizeSpeech(text: string) {
  return text.replace(/[‘’]/g, "'").replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();
}
