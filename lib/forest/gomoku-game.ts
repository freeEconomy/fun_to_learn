import type { GameLevel } from './game-challenges';
export type Stone = 0 | 1 | 2;
export type GomokuMove = { row: number; col: number };
const axes = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;
export const gomokuSize = (level: GameLevel) => (level === 'practice' ? 9 : 11);
const inside = (n: number, row: number, col: number) => row >= 0 && col >= 0 && row < n && col < n;
export function gomokuBoard(size: number, history: readonly GomokuMove[]): Stone[] {
  const board: Stone[] = Array(size * size).fill(0);
  history.forEach(({ row, col }, i) => {
    if (!inside(size, row, col) || board[row * size + col]) throw Error('Invalid gomoku move');
    board[row * size + col] = i % 2 ? 2 : 1;
  });
  return board;
}
export function gomokuLine(
  board: readonly Stone[],
  size: number,
  row: number,
  col: number,
): number[] {
  const stone = board[row * size + col];
  if (!inside(size, row, col) || !stone) return [];
  for (const [dr, dc] of axes) {
    const points = [row * size + col];
    for (const direction of [-1, 1]) {
      let r = row + dr * direction,
        c = col + dc * direction;
      while (inside(size, r, c) && board[r * size + c] === stone) {
        points.push(r * size + c);
        r += dr * direction;
        c += dc * direction;
      }
    }
    if (points.length >= 5) return points;
  }
  return [];
}
export function longestGomokuRun(
  board: readonly Stone[],
  size: number,
  row: number,
  col: number,
  stone: 1 | 2,
): number {
  let longest = 1;
  for (const [dr, dc] of axes) {
    let count = 1;
    for (const direction of [-1, 1]) {
      let r = row + dr * direction,
        c = col + dc * direction;
      while (inside(size, r, c) && board[r * size + c] === stone) {
        count++;
        r += dr * direction;
        c += dc * direction;
      }
    }
    longest = Math.max(longest, count);
  }
  return longest;
}
function pattern(board: readonly Stone[], size: number, row: number, col: number, stone: 1 | 2) {
  let score = 0;
  for (const [dr, dc] of axes) {
    let count = 1,
      open = 0;
    for (const direction of [-1, 1]) {
      let r = row + dr * direction,
        c = col + dc * direction;
      while (inside(size, r, c) && board[r * size + c] === stone) {
        count++;
        r += dr * direction;
        c += dc * direction;
      }
      if (inside(size, r, c) && !board[r * size + c]) open++;
    }
    score +=
      count >= 5
        ? 1000000
        : !open
          ? 0
          : count === 4
            ? open === 2
              ? 90000
              : 9000
            : count === 3
              ? open === 2
                ? 4500
                : 300
              : count === 2
                ? open === 2
                  ? 200
                  : 30
                : open;
  }
  return score;
}
export function chooseGomokuMove(
  board: readonly Stone[],
  size: number,
  level: GameLevel,
): GomokuMove | null {
  const center = Math.floor(size / 2);
  if (!board.some(Boolean)) return { row: center, col: center };
  const candidates: { row: number; col: number; attack: number; defend: number; score: number }[] =
    [];
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      if (board[row * size + col]) continue;
      let near = false;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          if (inside(size, row + dr, col + dc) && board[(row + dr) * size + col + dc]) near = true;
      if (!near) continue;
      const attack = pattern(board, size, row, col, 2),
        defend = pattern(board, size, row, col, 1);
      const score =
        attack +
        defend * (level === 'challenge' ? 1.12 : 0.7) -
        (Math.abs(row - center) + Math.abs(col - center));
      candidates.push({ row, col, attack, defend, score });
    }
  // Win now; otherwise stop an immediate loss in both difficulty levels.
  const win = candidates.find((x) => x.attack >= 1000000);
  const block = candidates.find((x) => x.defend >= 1000000);
  const best = win ?? block ?? candidates.sort((a, b) => b.score - a.score)[0];
  return best ? { row: best.row, col: best.col } : null;
}
