export const characters = [
  {
    id: 'pikachu',
    name: '피카츄',
    english: 'PIKACHU',
    type: '전기',
    color: '#f5c844',
    description: '반짝이는 번개의 친구',
  },
  {
    id: 'charizard',
    name: '리자몽',
    english: 'CHARIZARD',
    type: '불꽃 · 비행',
    color: '#ed8a54',
    description: '하늘을 나는 불꽃 드래곤',
  },
  {
    id: 'mewtwo',
    name: '뮤츠',
    english: 'MEWTWO',
    type: '에스퍼',
    color: '#a28acc',
    description: '강력한 전설의 에스퍼',
  },
  {
    id: 'lucario',
    name: '루카리오',
    english: 'LUCARIO',
    type: '격투 · 강철',
    color: '#62a1c9',
    description: '파동을 느끼는 멋진 전사',
  },
  {
    id: 'rayquaza',
    name: '레쿠쟈',
    english: 'RAYQUAZA',
    type: '드래곤 · 비행',
    color: '#60a986',
    description: '하늘을 지키는 전설의 용',
  },
  {
    id: 'greninja',
    name: '개굴닌자',
    english: 'GRENINJA',
    type: '물 · 악',
    color: '#678ccc',
    description: '물처럼 빠른 닌자',
  },
  {
    id: 'garchomp',
    name: '한카리아스',
    english: 'GARCHOMP',
    type: '드래곤 · 땅',
    color: '#7887ba',
    description: '힘차게 날아오르는 드래곤',
  },
  {
    id: 'dragonite',
    name: '망나뇽',
    english: 'DRAGONITE',
    type: '드래곤 · 비행',
    color: '#d9a55a',
    description: '든든하고 다정한 수호자',
  },
] as const;
export const legacySymbols = ['📘', '🧭', '✏️', '🐶', '🐱', '🐰'];
export const legacyLabels = [
  '책 표식',
  '나침반 표식',
  '연필 표식',
  '강아지 캐릭터',
  '고양이 캐릭터',
  '토끼 캐릭터',
];
export const characterFor = (id: string) => characters.find((character) => character.id === id);
export const isValidSymbol = (id: string) =>
  Boolean(characterFor(id)) || legacySymbols.includes(id);
