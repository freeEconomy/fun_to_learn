import { words } from './content';
import { shuffle } from './adventures';
import { chessPieces, type PieceType } from './chess-game';
import type { GameLevel } from './game-challenges';
export type BoardKind = 'chess' | 'gomoku';
export type BoardLesson = {
  prompt: string;
  answer: string;
  korean: string;
  note: string;
  options: string[];
};
export const countingWords = ['one', 'two', 'three', 'four', 'five'] as const;
export const boardSpeechTexts = [
  'king',
  'queen',
  'rook',
  'bishop',
  'knight',
  'pawn',
  ...countingWords,
  'black',
  'white',
  'left',
  'right',
  'center',
];
export const boardMissionGoal = (level: GameLevel) => (level === 'practice' ? 4 : 6);
export function makeBoardLesson(
  kind: BoardKind,
  turn: number,
  level: GameLevel,
  context: { piece?: PieceType; run?: number; col?: number; size?: number },
): BoardLesson {
  let answer: string, korean: string, prompt: string, note: string, peers: string[];
  if (kind === 'chess' && turn % 2 === 0) {
    const piece = chessPieces[context.piece ?? 'p'];
    ({ english: answer, korean } = piece);
    prompt = `지금 움직일 ${korean}! 영어 이름을 찾아요.`;
    note = piece.rule;
    peers = Object.values(chessPieces).map((p) => p.english);
  } else if (kind === 'gomoku') {
    if (turn % 3 === 0) {
      const n = Math.min(5, Math.max(1, context.run ?? 1));
      answer = countingWords[n - 1];
      korean = `${n} (개)`;
      prompt = `이곳에 두면 내 돌 ${n}개가 이어져요. ${n}은 영어로?`;
      note = '가로·세로·대각선, 다섯 돌을 먼저 이으면 이겨요.';
      peers = [...countingWords];
    } else if (turn % 3 === 1) {
      const center = Math.floor((context.size ?? 9) / 2),
        col = context.col ?? center;
      answer = col < center ? 'left' : col > center ? 'right' : 'center';
      korean = col < center ? '왼쪽' : col > center ? '오른쪽' : '가운데';
      prompt = `판의 ${korean}에 두려고 해요. ${korean}은 영어로?`;
      note = '왼쪽은 left, 오른쪽은 right, 가운데는 center예요.';
      peers = ['left', 'right', 'center', 'black'];
    } else {
      answer = 'black';
      korean = '검은색';
      prompt = '내 돌은 검은색! 검은색은 영어로?';
      note = '내 검은 돌은 black, 친구의 흰 돌은 white예요.';
      peers = ['black', 'white', 'left', 'right'];
    }
  } else {
    const word = words[(turn * 7 + 3) % words.length];
    answer = level === 'practice' ? word.name : word.sentences[0];
    korean = level === 'practice' ? word.korean : word.translations[0];
    prompt = `생활 속 영어! “${korean}”에 맞는 영어를 찾아요.`;
    note = '한 번 듣고, 큰 소리로 따라 말해 보세요.';
    peers = words
      .filter((w) => w.id !== word.id)
      .map((w) => (level === 'practice' ? w.name : w.sentences[0]));
  }
  const distractors = shuffle([...new Set(peers)].filter((text) => text !== answer)).slice(
    0,
    level === 'practice' ? 2 : 3,
  );
  return { answer, korean, prompt, note, options: shuffle([answer, ...distractors]) };
}
