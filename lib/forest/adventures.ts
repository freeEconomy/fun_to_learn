import { expandedTales } from './classic-expansion';
export type SceneTheme = 'meadow' | 'pond' | 'bakery' | 'clouds' | 'night';
export type TalePage = {
  english: string;
  korean: string;
  theme: SceneTheme;
  cast: string[];
  prop: string;
  vocabulary: { english: string; korean: string };
  wordId?: string;
  caption: string;
};
export type TaleDifficulty = 1 | 2 | 3;
export const taleDifficulties = [
  { level: 1, label: '쉬움', description: '짧은 문장과 익숙한 낱말' },
  { level: 2, label: '보통', description: '이야기 흐름을 따라 읽기' },
  { level: 3, label: '도전', description: '긴 문장과 새로운 낱말' },
] as const;
export type Tale = {
  id: string;
  title: string;
  englishTitle: string;
  difficulty: TaleDifficulty;
  genre: '이솝우화' | '전래동화' | '세계 명작';
  source: string;
  description: string;
  badge: string;
  color: string;
  pages: TalePage[];
};
// Public-domain story plots, retold here in original, child-friendly bilingual prose.
export const tales: Tale[] = [
  {
    id: 'hare-and-tortoise',
    difficulty: 1,
    title: '토끼와 거북이',
    englishTitle: 'The Hare and the Tortoise',
    genre: '이솝우화',
    source: '이솝우화에서 각색',
    description: '빠른 토끼와 느린 거북이의 달리기 시합. 끝까지 가는 힘을 배워요.',
    badge: '꾸준한 마음',
    color: '#e6f0d7',
    pages: [
      {
        english: '“I am so fast!” says the rabbit. “You are so slow!”',
        korean: '“나는 정말 빨라!” 토끼가 말해요. “너는 정말 느리구나!”',
        theme: 'meadow',
        cast: ['🐰', '🐢'],
        prop: '💨',
        vocabulary: {
          english: 'fast',
          korean: '빠른',
        },
        caption: '토끼가 거북이 앞에서 달리기 실력을 자랑해요.',
      },
      {
        english: '“Let’s have a race,” says the tortoise. The rabbit laughs.',
        korean: '“우리 달리기 시합을 하자.” 거북이가 말해요. 토끼가 웃어요.',
        theme: 'meadow',
        cast: ['🐢', '🐰'],
        prop: '🏁',
        vocabulary: {
          english: 'race',
          korean: '달리기 시합',
        },
        caption: '거북이가 토끼에게 달리기 시합을 제안해요.',
      },
      {
        english: '“Ready, set, go!” The rabbit runs far ahead.',
        korean: '“준비, 출발!” 토끼가 멀리 앞서 달려가요.',
        theme: 'meadow',
        cast: ['🐰', '🐢'],
        prop: '🏃',
        vocabulary: {
          english: 'rabbit',
          korean: '토끼',
        },
        caption: '토끼가 빠르게 달려가고 거북이는 천천히 출발해요.',
        wordId: 'rabbit',
      },
      {
        english: 'The rabbit rests under a tree. “I have lots of time.”',
        korean: '토끼가 나무 아래에서 쉬어요. “시간은 아주 많아.”',
        theme: 'meadow',
        cast: ['🐰'],
        prop: '🌳',
        vocabulary: {
          english: 'tree',
          korean: '나무',
        },
        caption: '토끼가 그늘 아래에 누워 쉬려고 해요.',
      },
      {
        english: 'Soon the rabbit is asleep. The tortoise keeps walking.',
        korean: '곧 토끼가 잠들어요. 거북이는 계속 걸어가요.',
        theme: 'meadow',
        cast: ['🐰', '🐢'],
        prop: '💤',
        vocabulary: {
          english: 'asleep',
          korean: '잠든',
        },
        caption: '잠든 토끼를 지나 거북이가 한 걸음씩 나아가요.',
      },
      {
        english: 'Step by step, the tortoise gets closer to the finish line.',
        korean: '한 걸음 한 걸음, 거북이가 결승선에 가까워져요.',
        theme: 'meadow',
        cast: ['🐢'],
        prop: '🏁',
        vocabulary: {
          english: 'step',
          korean: '걸음',
        },
        caption: '거북이가 쉬지 않고 걸어 결승선 가까이 왔어요.',
      },
      {
        english: 'The rabbit wakes up. “Oh no!” He runs, but the tortoise finishes first.',
        korean: '토끼가 깨어나요. “이런!” 달려가지만 거북이가 먼저 도착해요.',
        theme: 'meadow',
        cast: ['🐢', '🐰'],
        prop: '🏆',
        vocabulary: {
          english: 'first',
          korean: '첫 번째로',
        },
        caption: '거북이가 결승선을 넘고 토끼가 뒤늦게 달려와요.',
      },
      {
        english: '“You kept going,” says the rabbit. “Well done!” They shake hands.',
        korean: '“넌 끝까지 해냈구나.” 토끼가 말해요. “잘했어!” 둘은 악수해요.',
        theme: 'meadow',
        cast: ['🐰', '🐢'],
        prop: '🤝',
        vocabulary: {
          english: 'rabbit',
          korean: '토끼',
        },
        caption: '토끼가 거북이의 꾸준함을 인정하며 악수해요.',
        wordId: 'rabbit',
      },
    ],
  },
  {
    id: 'lion-and-mouse',
    difficulty: 1,
    title: '사자와 생쥐',
    englishTitle: 'The Lion and the Mouse',
    genre: '이솝우화',
    source: '이솝우화에서 각색',
    description: '작은 생쥐의 큰 도움! 몸집보다 마음이 중요하다는 이야기예요.',
    badge: '도와주는 마음',
    color: '#f8e8c9',
    pages: [
      {
        english: 'A lion sleeps under a tree. A little mouse runs over his paw.',
        korean: '사자가 나무 아래에서 자요. 작은 생쥐가 사자의 발 위로 달려가요.',
        theme: 'meadow',
        cast: ['🦁', '🐭'],
        prop: '🌳',
        vocabulary: {
          english: 'lion',
          korean: '사자',
        },
        caption: '잠든 사자의 발 위로 작은 생쥐가 지나가요.',
      },
      {
        english: 'The lion wakes up and catches the mouse. “Who woke me?”',
        korean: '사자가 깨어나 생쥐를 붙잡아요. “누가 나를 깨웠지?”',
        theme: 'meadow',
        cast: ['🦁', '🐭'],
        prop: '🐾',
        vocabulary: {
          english: 'mouse',
          korean: '생쥐',
        },
        caption: '잠에서 깬 사자가 생쥐를 내려다봐요.',
      },
      {
        english: '“Please let me go,” says the mouse. “One day, I may help you.”',
        korean: '“제발 놓아주세요.” 생쥐가 말해요. “언젠가 제가 도와드릴 수도 있어요.”',
        theme: 'meadow',
        cast: ['🐭', '🦁'],
        prop: '🙏',
        vocabulary: {
          english: 'help',
          korean: '돕다',
        },
        caption: '생쥐가 사자에게 정중하게 부탁해요.',
      },
      {
        english: '“You are so small!” laughs the lion. Still, he lets the mouse go.',
        korean: '“너는 정말 작잖아!” 사자가 웃어요. 그래도 생쥐를 놓아줘요.',
        theme: 'meadow',
        cast: ['🦁', '🐭'],
        prop: '💛',
        vocabulary: {
          english: 'small',
          korean: '작은',
        },
        caption: '사자가 웃으며 생쥐를 풀어 줘요.',
      },
      {
        english: 'One day, the lion is caught in a net. He cannot get out.',
        korean: '어느 날, 사자가 그물에 걸려요. 빠져나올 수가 없어요.',
        theme: 'meadow',
        cast: ['🦁'],
        prop: '🕸️',
        vocabulary: {
          english: 'net',
          korean: '그물',
        },
        caption: '그물에 걸린 사자가 도움을 기다려요.',
      },
      {
        english: 'The mouse hears him roar. “I’m coming to help!”',
        korean: '생쥐가 사자의 울음소리를 들어요. “제가 도와드릴게요!”',
        theme: 'meadow',
        cast: ['🐭', '🦁'],
        prop: '👂',
        vocabulary: {
          english: 'hear',
          korean: '듣다',
        },
        caption: '사자의 소리를 들은 생쥐가 달려와요.',
      },
      {
        english: 'The mouse bites through the ropes. At last, the lion is free!',
        korean: '생쥐가 밧줄을 갉아 끊어요. 마침내 사자가 풀려나요!',
        theme: 'meadow',
        cast: ['🐭', '🦁'],
        prop: '🧵',
        vocabulary: {
          english: 'free',
          korean: '자유로운',
        },
        caption: '생쥐가 밧줄을 끊자 사자가 그물에서 나와요.',
      },
      {
        english: '“Thank you, little friend,” says the lion. Even a small friend can help.',
        korean: '“고마워, 작은 친구야.” 사자가 말해요. 작은 친구도 큰 도움이 될 수 있어요.',
        theme: 'meadow',
        cast: ['🦁', '🐭'],
        prop: '🤝',
        vocabulary: {
          english: 'friend',
          korean: '친구',
        },
        caption: '사자와 생쥐가 서로를 아끼는 친구가 되었어요.',
      },
    ],
  },
  {
    id: 'honest-woodcutter',
    difficulty: 2,
    title: '금도끼 은도끼',
    englishTitle: 'The Honest Woodcutter',
    genre: '전래동화',
    source: '한국 전래동화 「금도끼 은도끼」에서 각색',
    description: '물에 빠진 도끼를 찾아요. 반짝이는 금보다 정직한 말이 소중해요.',
    badge: '정직한 마음',
    color: '#dcedeb',
    pages: [
      {
        english: 'A woodcutter works beside a deep pond. His old axe slips from his hands.',
        korean: '나무꾼이 깊은 연못 옆에서 일해요. 낡은 도끼가 손에서 미끄러져요.',
        theme: 'pond',
        cast: ['🧑‍🌾'],
        prop: '🪓',
        vocabulary: {
          english: 'pond',
          korean: '연못',
        },
        caption: '나무꾼이 실수로 연못에 도끼를 빠뜨렸어요.',
      },
      {
        english: 'Splash! The axe sinks. “How can I work without my axe?”',
        korean: '풍덩! 도끼가 가라앉아요. “도끼 없이 어떻게 일을 하지?”',
        theme: 'pond',
        cast: ['🧑‍🌾'],
        prop: '💧',
        vocabulary: {
          english: 'axe',
          korean: '도끼',
        },
        caption: '연못가에 앉은 나무꾼이 잃어버린 도끼를 걱정해요.',
      },
      {
        english: 'A mountain spirit appears. “Why are you sad?”',
        korean: '산신령이 나타나요. “왜 슬퍼하고 있느냐?”',
        theme: 'pond',
        cast: ['🧙‍♂️', '🧑‍🌾'],
        prop: '✨',
        vocabulary: {
          english: 'sad',
          korean: '슬픈',
        },
        caption: '산신령이 나무꾼의 이야기를 들어 줘요.',
      },
      {
        english: 'The spirit holds up a golden axe. “Is this yours?” “No,” says the woodcutter.',
        korean: '산신령이 금도끼를 들어요. “이것이 네 도끼냐?” 나무꾼이 “아니요.”라고 말해요.',
        theme: 'pond',
        cast: ['🧙‍♂️', '🧑‍🌾'],
        prop: '🪓',
        vocabulary: {
          english: 'golden',
          korean: '금빛의',
        },
        caption: '산신령이 반짝이는 금도끼를 보여 줘요.',
      },
      {
        english: 'Next comes a silver axe. “Is this yours?” “No, mine is an old iron axe.”',
        korean: '다음에는 은도끼예요. “이것이 네 도끼냐?” “아니요, 제 것은 낡은 쇠도끼예요.”',
        theme: 'pond',
        cast: ['🧙‍♂️', '🧑‍🌾'],
        prop: '🪓',
        vocabulary: {
          english: 'silver',
          korean: '은빛의',
        },
        caption: '나무꾼이 은도끼도 자기 것이 아니라고 말해요.',
      },
      {
        english: 'At last, the spirit brings the old axe. “Yes! That is mine!”',
        korean: '마침내 산신령이 낡은 도끼를 가져와요. “네! 저게 제 도끼예요!”',
        theme: 'pond',
        cast: ['🧑‍🌾', '🧙‍♂️'],
        prop: '🪓',
        vocabulary: {
          english: 'mine',
          korean: '나의 것',
        },
        caption: '자신의 낡은 도끼를 찾은 나무꾼이 기뻐해요.',
      },
      {
        english: '“You told the truth,” says the spirit. “You may have all three axes.”',
        korean: '“너는 진실을 말했구나.” 산신령이 말해요. “도끼 세 자루를 모두 가져도 좋다.”',
        theme: 'pond',
        cast: ['🧙‍♂️', '🧑‍🌾'],
        prop: '🎁',
        vocabulary: {
          english: 'truth',
          korean: '진실',
        },
        caption: '산신령이 정직한 나무꾼에게 선물을 주어요.',
      },
      {
        english: 'The woodcutter says thank you and goes home. Being honest was his best choice.',
        korean:
          '나무꾼은 감사 인사를 하고 집으로 돌아가요. 정직하게 말한 것이 가장 좋은 선택이었어요.',
        theme: 'meadow',
        cast: ['🧑‍🌾'],
        prop: '🏡',
        vocabulary: {
          english: 'honest',
          korean: '정직한',
        },
        caption: '나무꾼이 정직한 마음을 간직하며 집으로 돌아가요.',
      },
    ],
  },
  {
    id: 'three-little-pigs',
    difficulty: 2,
    title: '아기 돼지 삼 형제',
    englishTitle: 'The Three Little Pigs',
    genre: '세계 명작',
    source: '영국 전래동화 「아기 돼지 삼 형제」에서 각색',
    description: '후우, 바람을 불어라! 튼튼한 벽돌집에서 서로를 지켜 줘요.',
    badge: '차근차근 짓는 마음',
    color: '#f8e2d7',
    pages: [
      {
        english: 'Three little pigs set off to build their own houses.',
        korean: '아기 돼지 삼 형제가 각자 집을 지으러 떠나요.',
        theme: 'meadow',
        cast: ['🐷', '🐷', '🐷'],
        prop: '🏡',
        vocabulary: {
          english: 'house',
          korean: '집',
        },
        caption: '아기 돼지 삼 형제가 새집을 지을 준비를 해요.',
      },
      {
        english: 'The first pig builds a straw house. “Done! Time to play!”',
        korean: '첫째 돼지는 짚으로 집을 지어요. “완성! 이제 놀자!”',
        theme: 'meadow',
        cast: ['🐷'],
        prop: '🌾',
        vocabulary: {
          english: 'straw',
          korean: '짚',
        },
        caption: '첫째 돼지가 짚으로 빠르게 집을 지었어요.',
      },
      {
        english: 'The second pig builds a house of sticks. The third chooses bricks.',
        korean: '둘째 돼지는 나뭇가지로 집을 지어요. 셋째는 벽돌을 골라요.',
        theme: 'meadow',
        cast: ['🐷', '🐷'],
        prop: '🧱',
        vocabulary: {
          english: 'bricks',
          korean: '벽돌',
        },
        caption: '둘째는 나뭇가지를 모으고 셋째는 벽돌을 쌓아요.',
      },
      {
        english: 'A wolf knocks on the straw house. “Little pig, let me in!” “No!”',
        korean: '늑대가 짚집을 두드려요. “아기 돼지야, 들여보내 줘!” “안 돼!”',
        theme: 'meadow',
        cast: ['🐺', '🐷'],
        prop: '🚪',
        vocabulary: {
          english: 'wolf',
          korean: '늑대',
        },
        caption: '늑대가 짚집 문 앞에서 들어오려고 해요.',
      },
      {
        english:
          'The wolf huffs and puffs. Down goes the straw house! The pig runs to his brother.',
        korean: '늑대가 후우, 후우 불어요. 짚집이 무너져요! 첫째는 둘째에게 달려가요.',
        theme: 'meadow',
        cast: ['🐺', '🐷'],
        prop: '🌬️',
        vocabulary: {
          english: 'runs',
          korean: '달려가요',
        },
        caption: '짚집이 무너지자 첫째 돼지가 안전한 곳으로 달려가요.',
      },
      {
        english: 'The wolf blows down the stick house too. Both pigs run to the brick house.',
        korean: '늑대는 나뭇가지 집도 불어 무너뜨려요. 두 돼지가 벽돌집으로 달려가요.',
        theme: 'meadow',
        cast: ['🐷', '🐷', '🐷'],
        prop: '🧱',
        vocabulary: {
          english: 'both',
          korean: '둘 다',
        },
        caption: '형들이 셋째의 튼튼한 벽돌집으로 피신해요.',
      },
      {
        english: 'The wolf blows and blows, but the brick house stands strong. At last, he leaves.',
        korean: '늑대가 계속 불지만 벽돌집은 튼튼해요. 마침내 늑대가 떠나요.',
        theme: 'meadow',
        cast: ['🐷', '🐷', '🐷'],
        prop: '🏠',
        vocabulary: {
          english: 'strong',
          korean: '튼튼한',
        },
        caption: '벽돌집 안의 돼지들은 안전하고 늑대는 포기해요.',
      },
      {
        english: '“We are safe!” The pigs share bread. “Let’s build carefully together next time.”',
        korean: '“이제 안전해!” 돼지들이 빵을 나눠 먹어요. “다음에는 함께 꼼꼼하게 짓자.”',
        theme: 'meadow',
        cast: ['🐷', '🐷', '🐷'],
        prop: '🍞',
        vocabulary: {
          english: 'bread',
          korean: '빵',
        },
        caption: '안전한 벽돌집에서 삼 형제가 빵을 나누며 쉬어요.',
        wordId: 'bread',
      },
    ],
  },
  {
    id: 'ugly-duckling',
    difficulty: 3,
    title: '미운 아기 오리',
    englishTitle: 'The Ugly Duckling',
    genre: '세계 명작',
    source: '한스 크리스티안 안데르센의 「미운 아기 오리」(1843)에서 각색',
    description: '조금 다른 아기 새가 자기 모습을 찾아요. 누구나 소중한 존재예요.',
    badge: '나를 아끼는 마음',
    color: '#e2edf8',
    pages: [
      {
        english: 'A mother duck waits by her eggs. Crack, crack! The little birds hatch.',
        korean: '엄마 오리가 알 곁에서 기다려요. 톡, 톡! 아기 새들이 깨어나요.',
        theme: 'pond',
        cast: ['🦆'],
        prop: '🥚',
        vocabulary: {
          english: 'duck',
          korean: '오리',
        },
        caption: '엄마 오리가 알에서 깨어나는 아기들을 반겨요.',
        wordId: 'duck',
      },
      {
        english:
          'The last egg opens. Out comes a big gray bird. “You look different,” say the others.',
        korean:
          '마지막 알이 열려요. 커다란 회색 아기 새가 나와요. 다른 새들이 “너는 다르게 생겼네.”라고 말해요.',
        theme: 'pond',
        cast: ['🐣', '🦆'],
        prop: '🥚',
        vocabulary: {
          english: 'gray',
          korean: '회색의',
        },
        caption: '다른 아기들과 모습이 다른 회색 아기 새가 태어났어요.',
      },
      {
        english: 'The little bird feels lonely. He leaves the pond to find a place to belong.',
        korean: '아기 새는 외로워요. 함께 지낼 곳을 찾아 연못을 떠나요.',
        theme: 'pond',
        cast: ['🐣'],
        prop: '💧',
        vocabulary: {
          english: 'lonely',
          korean: '외로운',
        },
        caption: '외로운 아기 새가 자신을 반겨 줄 곳을 찾아 나서요.',
      },
      {
        english: 'One evening, he sees white swans flying above. “How beautiful!” he whispers.',
        korean:
          '어느 저녁, 하얀 백조들이 하늘을 나는 걸 봐요. “정말 아름다워!” 아기 새가 속삭여요.',
        theme: 'night',
        cast: ['🐣', '🦢'],
        prop: '🪽',
        vocabulary: {
          english: 'swans',
          korean: '백조들',
        },
        caption: '아기 새가 하늘을 나는 백조들을 올려다봐요.',
      },
      {
        english: 'Winter comes. A kind farmer finds the cold bird and keeps him warm.',
        korean: '겨울이 와요. 다정한 농부가 추위에 떠는 아기 새를 발견하고 따뜻하게 보살펴 줘요.',
        theme: 'night',
        cast: ['🧑‍🌾', '🐣'],
        prop: '🏡',
        vocabulary: {
          english: 'warm',
          korean: '따뜻한',
        },
        caption: '농부가 아기 새에게 따뜻한 쉼터를 마련해 줘요.',
      },
      {
        english: 'In spring, the bird returns to the pond. The swans swim toward him.',
        korean: '봄이 되자 아기 새는 연못으로 돌아가요. 백조들이 그에게 헤엄쳐 와요.',
        theme: 'pond',
        cast: ['🦢', '🦢'],
        prop: '🌷',
        vocabulary: {
          english: 'spring',
          korean: '봄',
        },
        caption: '봄날 연못에서 백조들이 아기 새를 반겨요.',
      },
      {
        english: 'He looks into the water. A beautiful swan looks back! “That is me!”',
        korean: '물속을 들여다봐요. 아름다운 백조가 마주 보고 있어요! “저게 나구나!”',
        theme: 'pond',
        cast: ['🦢'],
        prop: '💧',
        vocabulary: {
          english: 'water',
          korean: '물',
        },
        caption: '물에 비친 자신의 모습을 보고 백조임을 알아차려요.',
      },
      {
        english:
          'He spreads his wings and joins the swans. He was always a swan, and always worthy of love.',
        korean:
          '날개를 펼치고 백조들과 함께해요. 그는 처음부터 백조였고, 언제나 사랑받을 소중한 존재였어요.',
        theme: 'pond',
        cast: ['🦢', '🦢', '🦢'],
        prop: '💛',
        vocabulary: {
          english: 'wings',
          korean: '날개',
        },
        caption: '백조가 자신의 모습을 사랑하며 친구들과 어울려요.',
      },
    ],
  },
  {
    id: 'emperors-new-clothes',
    difficulty: 3,
    title: '벌거벗은 임금님',
    englishTitle: 'The Emperor’s New Clothes',
    genre: '세계 명작',
    source: '한스 크리스티안 안데르센의 「벌거벗은 임금님」(1837)에서 각색',
    description: '보이지 않는 옷을 입었다고요? 어린아이의 솔직한 한마디를 들어 봐요.',
    badge: '솔직하게 말하는 마음',
    color: '#eee3f7',
    pages: [
      {
        english: 'An emperor loves new clothes. He has a different outfit for every day.',
        korean: '임금님은 새 옷을 좋아해요. 날마다 다른 옷을 입어요.',
        theme: 'meadow',
        cast: ['🤴'],
        prop: '👕',
        vocabulary: {
          english: 'clothes',
          korean: '옷',
        },
        caption: '새 옷을 좋아하는 임금님이 옷을 골라요.',
      },
      {
        english:
          'Two tricksters arrive. “Our special cloth is invisible to foolish people,” they say.',
        korean:
          '사기꾼 두 명이 와요. “우리의 특별한 천은 어리석은 사람에게 보이지 않습니다.”라고 말해요.',
        theme: 'meadow',
        cast: ['🧑', '🧑'],
        prop: '🧵',
        vocabulary: {
          english: 'cloth',
          korean: '천',
        },
        caption: '사기꾼들이 특별한 천을 짠다고 속여요.',
      },
      {
        english: 'They pretend to weave, but there is no cloth at all.',
        korean: '사기꾼들은 천을 짜는 척해요. 하지만 천은 하나도 없어요.',
        theme: 'meadow',
        cast: ['🧑', '🧑'],
        prop: '🪡',
        vocabulary: {
          english: 'pretend',
          korean: '척하다',
        },
        caption: '사기꾼들이 빈 베틀 앞에서 일하는 척해요.',
      },
      {
        english: 'A minister sees nothing. “Beautiful!” he says, afraid to tell the truth.',
        korean: '신하는 아무것도 보지 못해요. 진실을 말하기가 두려워 “아름답군요!”라고 해요.',
        theme: 'meadow',
        cast: ['🧓'],
        prop: '💬',
        vocabulary: {
          english: 'truth',
          korean: '진실',
        },
        caption: '신하가 보이지 않는 옷을 보고도 솔직하게 말하지 못해요.',
      },
      {
        english: 'The emperor sees nothing either. Still, he puts on the pretend clothes.',
        korean: '임금님도 아무것도 보이지 않아요. 그래도 옷을 입는 척해요.',
        theme: 'meadow',
        cast: ['🤴', '🧑'],
        prop: '👕',
        vocabulary: {
          english: 'emperor',
          korean: '임금님',
        },
        caption: '임금님이 없는 옷을 입었다고 믿으려 해요.',
      },
      {
        english: 'He walks through town in his underwear. Everyone is too afraid to speak.',
        korean: '임금님이 속옷 차림으로 마을을 걸어요. 모두 두려워서 말하지 못해요.',
        theme: 'meadow',
        cast: ['🤴', '🧑', '🧓'],
        prop: '🏘️',
        vocabulary: {
          english: 'afraid',
          korean: '두려운',
        },
        caption: '마을 사람들이 행진하는 임금님을 바라봐요.',
      },
      {
        english: '“But he has no clothes on!” says a child. The crowd begins to whisper.',
        korean:
          '“그런데 임금님은 옷을 안 입었잖아요!” 아이가 말해요. 사람들이 수군거리기 시작해요.',
        theme: 'meadow',
        cast: ['🧒', '🤴'],
        prop: '💬',
        vocabulary: {
          english: 'child',
          korean: '아이',
        },
        caption: '아이가 자신이 본 사실을 솔직하게 말해요.',
      },
      {
        english:
          'The emperor knows the child is right. Honest words matter more than fancy clothes.',
        korean: '임금님은 아이의 말이 맞다는 걸 알아요. 멋진 옷보다 솔직한 말이 더 소중해요.',
        theme: 'meadow',
        cast: ['🤴', '🧒'],
        prop: '💛',
        vocabulary: {
          english: 'honest',
          korean: '솔직한',
        },
        caption: '임금님이 아이의 솔직한 말을 마음에 새겨요.',
      },
    ],
  },
  ...expandedTales,
];
export const gameModes = [
  {
    id: 'soccer',
    title: '영어 골! 축구 챌린지',
    subtitle: '비슷한 영어 작전을 구별하고 골을 넣어요',
    emoji: '⚽',
    tag: '축구 + 생활 영어',
    color: '#d8eddf',
  },
  {
    id: 'memory',
    title: '짝꿍 카드',
    subtitle: '사진과 영어의 짝을 찾아요',
    emoji: '🃏',
    tag: '기억력 + 단어',
    color: '#e0edda',
  },
  {
    id: 'listen',
    title: '소리 탐정',
    subtitle: '영어 소리를 듣고 보물을 찾아요',
    emoji: '🔎',
    tag: '듣기 + 단어',
    color: '#e2edf8',
  },
  {
    id: 'train',
    title: '문장 기차',
    subtitle: '낱말을 연결하면 문장이 출발!',
    emoji: '🚂',
    tag: '문장 + 순서',
    color: '#fbe5d2',
  },
  {
    id: 'spell',
    title: '알파벳 공방',
    subtitle: '사진 속 단어를 알파벳으로 조립해요',
    emoji: '🔤',
    tag: '철자 + 단어',
    color: '#eee4f7',
  },
  {
    id: 'delivery',
    title: '단어 배달부',
    subtitle: '영어 꾸러미를 알맞은 가게로 배달해요',
    emoji: '📦',
    tag: '뜻 이해 + 분류',
    color: '#fff0d5',
  },
  {
    id: 'sequence',
    title: '순서 기억 탐험',
    subtitle: '단어 지도를 기억하고 같은 순서로 찾아요',
    emoji: '🧭',
    tag: '듣기 + 순서 기억',
    color: '#dff0ed',
  },
] as const;
export type GameId = (typeof gameModes)[number]['id'];
export type ActivityId = `story:${string}` | `game:${GameId}`;
export type ActivityRecord = { activityId: ActivityId; date: string; score: number };
export type AdventureProgress = {
  storyPages: Record<string, number>;
  activityRecords: ActivityRecord[];
};
// Keep completed reading history for books removed from the library.
export const retiredTaleTitles: Record<string, string> = {
  'rainbow-ball': '토리와 무지개 공',
  'little-bakery': '미미의 반짝반짝 빵집',
  'cloud-train': '별님을 데려다주는 구름 기차',
  'window-visitor': '똑똑! 창문 밖의 손님',
  'playground-shadow': '놀이터의 하얀 그림자',
  'midnight-train': '밤 기차의 꼬마 유령',
};
export const emptyAdventure: AdventureProgress = { storyPages: {}, activityRecords: [] };
const activityIds = new Set([
  ...tales.map((t) => `story:${t.id}`),
  ...gameModes.map((g) => `game:${g.id}`),
]);
export function readAdventure(raw: unknown): AdventureProgress {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdventureProgress>;
  const storyPages: Record<string, number> = {};
  for (const tale of tales) {
    const n = value.storyPages?.[tale.id];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < tale.pages.length)
      storyPages[tale.id] = n;
  }
  const activityRecords = Array.isArray(value.activityRecords)
    ? value.activityRecords
        .filter(
          (r) =>
            r &&
            (activityIds.has(r.activityId) ||
              Object.keys(retiredTaleTitles).some((id) => r.activityId === `story:${id}`)) &&
            Number.isFinite(Date.parse(r.date)) &&
            Number.isInteger(r.score) &&
            r.score >= 0 &&
            r.score <= 100,
        )
        .slice(-180)
    : [];
  return { storyPages, activityRecords };
}
const day = (date: string) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
export function recordActivity(
  progress: AdventureProgress,
  activityId: ActivityId,
  score: number,
  date = new Date().toISOString(),
) {
  if (
    !activityIds.has(activityId) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !Number.isFinite(Date.parse(date))
  )
    throw new Error('Invalid activity result');
  const index = progress.activityRecords.findIndex(
    (r) => r.activityId === activityId && day(r.date) === day(date),
  );
  const records = [...progress.activityRecords];
  const previous = records[index];
  const record = { activityId, date, score: Math.max(previous?.score ?? 0, score) };
  if (index < 0) records.push(record);
  else records[index] = record;
  return {
    progress: { ...progress, activityRecords: records.slice(-180) },
    pointsEarned: index < 0 ? 10 : 0,
  };
}
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export const gameWordIds = [
  'dog',
  'cat',
  'rabbit',
  'duck',
  'apple',
  'banana',
  'bread',
  'milk',
  'ball',
  'bicycle',
  'bus',
  'train',
];
export const trainRounds = [
  { wordId: 'dog', english: 'I see a dog.', korean: '강아지가 보여요.' },
  { wordId: 'ball', english: 'This is a ball.', korean: '이것은 공이에요.' },
  { wordId: 'apple', english: 'I like apples.', korean: '나는 사과를 좋아해요.' },
  { wordId: 'playground', english: 'Let’s play together.', korean: '우리 함께 놀자.' },
  { wordId: 'milk', english: 'Can I have milk?', korean: '우유를 마셔도 될까요?' },
];
