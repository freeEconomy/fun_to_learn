import { words } from './content';

export const learningDay = (date: string) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

// Interleave topics so a daily pack contains a mix of familiar subjects.
const topics = [...new Set(words.map((word) => word.category))];
const groups = topics.map((topic) => words.filter((word) => word.category === topic));
const catalog = Array.from({ length: Math.max(...groups.map((group) => group.length)) }, (_, n) =>
  groups.flatMap((group) => (group[n] ? [group[n]] : [])),
).flat();

export function dailyPhotoWords(now = new Date().toISOString()) {
  const day = learningDay(now);
  const ordinal = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const offset = (((ordinal * 6) % catalog.length) + catalog.length) % catalog.length;
  return Array.from({ length: 6 }, (_, n) => catalog[(offset + n) % catalog.length]);
}
export const dailyAdventureIds = (now = new Date().toISOString()) =>
  dailyPhotoWords(now)
    .slice(0, 3)
    .map((word) => word.id);
