import { Chess, type ChessInstance, type Move, type PieceType } from './vendor/chess';
import type { GameLevel } from './game-challenges';

export { Chess } from './vendor/chess';
export type { Piece, PieceType, Promotion, Move, ChessInstance } from './vendor/chess';

export const chessPieces: Record<PieceType, { english: string; korean: string; rule: string }> = {
  k: { english: 'king', korean: '킹', rule: '어느 방향이든 한 칸. 공격받는 칸에는 갈 수 없어요.' },
  q: { english: 'queen', korean: '퀸', rule: '가로·세로·대각선으로 원하는 만큼 가요.' },
  r: { english: 'rook', korean: '룩', rule: '가로·세로로 쭉! 다른 말을 뛰어넘을 수 없어요.' },
  b: { english: 'bishop', korean: '비숍', rule: '대각선으로 쭉! 같은 색 칸을 따라가요.' },
  n: { english: 'knight', korean: '나이트', rule: '두 칸, 옆으로 한 칸! 다른 말을 뛰어넘어요.' },
  p: {
    english: 'pawn',
    korean: '폰',
    rule: '앞으로 한 칸, 처음에는 두 칸도! 잡을 때는 대각선이에요.',
  },
};
export function replayChess(history: readonly string[], fen?: string): ChessInstance {
  const game = Chess(fen);
  for (const move of history) if (!game.move(move)) throw Error('Invalid chess move history');
  return game;
}
export function chessResult(game: ChessInstance): 'win' | 'loss' | 'draw' | null {
  if (game.in_checkmate()) return game.turn() === 'b' ? 'win' : 'loss';
  return game.in_draw() ? 'draw' : null;
}
const values: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function evaluate(game: ChessInstance): number {
  if (game.in_checkmate()) return game.turn() === 'b' ? -100000 : 100000;
  if (game.in_draw()) return 0;
  let score = 0;
  for (const [row, rank] of game.board().entries())
    for (const [col, piece] of rank.entries()) {
      if (!piece) continue;
      const center = 7 - Math.abs(3.5 - col) - Math.abs(3.5 - row);
      const advance = piece.type === 'p' ? (piece.color === 'b' ? row - 1 : 6 - row) * 7 : 0;
      score += (piece.color === 'b' ? 1 : -1) * (values[piece.type] + center * 4 + advance);
    }
  return score;
}
function search(game: ChessInstance, depth: number, alpha: number, beta: number): number {
  if (!depth || game.game_over()) return evaluate(game);
  const maximizing = game.turn() === 'b';
  let best = maximizing ? -Infinity : Infinity;
  const moves = game
    .moves({ verbose: true })
    .sort((a, b) => (b.captured ? values[b.captured] : 0) - (a.captured ? values[a.captured] : 0));
  for (const move of moves) {
    game.move(move);
    const score = search(game, depth - 1, alpha, beta);
    game.undo();
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}
/** Local, bounded search. Never changes the supplied position or its repetition history. */
export function chooseChessMove(game: ChessInstance, level: GameLevel): Move | null {
  if (game.game_over()) return null;
  const black = game.turn() === 'b';
  let best: Move | null = null,
    bestScore = black ? -Infinity : Infinity;
  for (const move of game.moves({ verbose: true })) {
    game.move(move);
    const score = search(game, level === 'challenge' ? 1 : 0, -Infinity, Infinity);
    game.undo();
    if (!best || (black ? score > bestScore : score < bestScore)) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}
export function undoChessRound(history: readonly string[]): string[] {
  return history.slice(0, Math.max(0, history.length - (history.length % 2 ? 1 : 2)));
}
