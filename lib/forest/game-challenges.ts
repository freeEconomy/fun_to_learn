import { gameWordIds, shuffle, trainRounds, type GameId } from './adventures';
import { words, type Word } from './content';
import { soccerChallenges } from './soccer-content';

export type GameLevel = 'practice' | 'challenge';
export const gameSettings = {
  practice: {
    pairs: 4,
    listen: 5,
    options: 3,
    train: 5,
    soccer: 5,
    spell: 5,
    delivery: 6,
    sequence: 4,
  },
  challenge: {
    pairs: 6,
    listen: 6,
    options: 4,
    train: 6,
    soccer: 6,
    spell: 6,
    delivery: 8,
    sequence: 5,
  },
} as const;
export const gameDescriptions: Record<GameId, Record<GameLevel, string>> = {
  memory: { practice: '4쌍 · 사진과 단어', challenge: '6쌍 · 더 많은 카드를 기억해요' },
  listen: { practice: '5문제 · 보기 3개', challenge: '6문제 · 비슷한 보기 4개' },
  train: { practice: '5문장 · 짧은 문장', challenge: '6문장 · 필요 없는 낱말도 있어요' },
  soccer: { practice: '5골 · 익숙한 표현', challenge: '6골 · 비슷한 축구 작전 구별하기' },
  spell: { practice: '5단어 · 알파벳만 연결', challenge: '6단어 · 남는 알파벳 2개' },
  delivery: { practice: '6꾸러미 · 사진과 단어', challenge: '8꾸러미 · 영어로 가게 찾기' },
  sequence: { practice: '4지도 · 단어 2~3개 기억', challenge: '5지도 · 단어 3~4개 기억' },
};
export const gameWord = (id: string): Word => words.find((word) => word.id === id)!;
export function gameScore(correct: number, total: number): number {
  return 50 + Math.round((Math.min(total, Math.max(0, correct)) / total) * 50);
}
export function memoryWords(level: GameLevel): string[] {
  if (level === 'practice') return shuffle(gameWordIds).slice(0, 4);
  return shuffle(['동물', '음식', '스포츠'])
    .slice(0, 2)
    .flatMap((category) =>
      shuffle(words.filter((word) => word.category === category))
        .slice(0, 3)
        .map((word) => word.id),
    );
}
export function listeningRounds(level: GameLevel) {
  const pool = level === 'practice' ? gameWordIds.map(gameWord) : words;
  return shuffle(pool)
    .slice(0, gameSettings[level].listen)
    .map((target) => {
      const others = shuffle(pool.filter((word) => word.id !== target.id));
      const ordered =
        level === 'practice'
          ? others
          : [
              ...others.filter((word) => word.category === target.category),
              ...others.filter((word) => word.category !== target.category),
            ];
      return {
        target,
        options: shuffle([
          target.id,
          ...ordered.slice(0, gameSettings[level].options - 1).map((word) => word.id),
        ]),
      };
    });
}
export function sentenceRounds(level: GameLevel) {
  if (level === 'practice') return trainRounds;
  const pool = words.filter((word) =>
    [
      'soccer',
      'bicycle',
      'dog',
      'cat',
      'apple',
      'banana',
      'milk',
      'duck',
      'ball',
      'kite',
      'swing',
      'blocks',
    ].includes(word.id),
  );
  return shuffle(pool)
    .slice(0, gameSettings[level].train)
    .map((word) => {
      const index = word.sentences.findIndex(
        (sentence, i) =>
          i > 0 && sentence.split(' ').length >= 4 && sentence.split(' ').length <= 7,
      );
      const n = index < 0 ? 0 : index;
      return { wordId: word.id, english: word.sentences[n], korean: word.translations[n] };
    });
}
export function sentenceTokens(english: string, level: GameLevel) {
  const tokens = english.split(' ').map((text, id) => ({ id, text }));
  if (level === 'challenge') {
    const extra = ['cat', 'dog', 'milk', 'bus', 'apple'].find(
      (word) => !english.toLowerCase().includes(word),
    )!;
    tokens.push({ id: -1, text: extra });
  }
  return shuffle(tokens);
}
export function soccerRounds(level: GameLevel) {
  return shuffle(soccerChallenges)
    .slice(0, gameSettings[level].soccer)
    .map((round) => {
      const peers = soccerChallenges.filter((item) => item.answer !== round.answer);
      const actions = ['Kick the ball!', 'Pass to me!', 'Run, run!', 'Stop the ball!'];
      const similar = actions.includes(round.answer)
        ? peers.filter((item) => actions.includes(item.answer))
        : peers.filter((item) => !actions.includes(item.answer));
      const others =
        level === 'practice'
          ? round.others
          : shuffle(similar)
              .slice(0, 2)
              .map((item) => item.answer);
      return { ...round, options: shuffle([round.answer, ...others]) };
    });
}
export function spellingRounds(level: GameLevel) {
  const pool = shuffle(words.filter((word) => /^[a-z]{3,8}$/.test(word.name)));
  const picked: Word[] = [];
  for (let round = 0; round < gameSettings[level].spell; round++) {
    const min = level === 'practice' || round < 2 ? 3 : round < 4 ? 4 : 5;
    const max = level === 'practice' || round < 2 ? 5 : round < 4 ? 6 : 8;
    picked.push(
      pool.find(
        (word) => !picked.includes(word) && word.name.length >= min && word.name.length <= max,
      )!,
    );
  }
  return picked.map((target) => ({ target, letters: spellingLetters(target.name, level) }));
}
export function spellingLetters(name: string, level: GameLevel) {
  const letters = [...name].map((text, id) => ({ id, text }));
  if (level === 'challenge')
    letters.push(
      ...shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter((letter) => !name.includes(letter)))
        .slice(0, 2)
        .map((text, n) => ({ id: name.length + n, text })),
    );
  return shuffle(letters);
}
export const deliveryShops = [
  {
    id: 'animals',
    title: '동물 쉼터',
    emoji: '🐾',
    wordIds: ['dog', 'cat', 'rabbit', 'duck', 'horse', 'elephant'],
  },
  {
    id: 'food',
    title: '음식 가게',
    emoji: '🥪',
    wordIds: ['apple', 'banana', 'bread', 'egg', 'milk', 'rice'],
  },
  {
    id: 'transport',
    title: '탈것 차고',
    emoji: '🚌',
    wordIds: ['bus', 'train', 'car', 'airplane', 'bicycle'],
  },
  {
    id: 'toys',
    title: '장난감 가게',
    emoji: '🧸',
    wordIds: ['blocks', 'puzzle', 'kite', 'doll', 'teddy-bear'],
  },
];
export function deliveryRounds(level: GameLevel) {
  const shops = deliveryShops.slice(0, level === 'practice' ? 3 : 4);
  return shuffle(
    shops.flatMap((shop) =>
      shuffle(shop.wordIds)
        .slice(0, 2)
        .map((id) => ({ target: gameWord(id), shop: shop.id })),
    ),
  );
}
export function sequenceRounds(level: GameLevel) {
  const pool = level === 'practice' ? gameWordIds : words.map((word) => word.id);
  return Array.from({ length: gameSettings[level].sequence }, (_, n) => {
    const count = (level === 'practice' ? 2 : 3) + (n >= 2 ? 1 : 0);
    const picked = shuffle(pool);
    return {
      target: picked.slice(0, count),
      options: shuffle(picked.slice(0, level === 'practice' ? 4 : 6)),
    };
  });
}
