import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Chess,
  replayChess,
  chooseChessMove,
  chessResult,
  undoChessRound,
} from '../lib/forest/chess-game';
import {
  chooseGomokuMove,
  gomokuBoard,
  gomokuLine,
  longestGomokuRun,
  gomokuSize,
  type Stone,
} from '../lib/forest/gomoku-game';
import { makeBoardLesson, boardSpeechTexts, boardMissionGoal } from '../lib/forest/board-learning';
import { speechAudioSource } from '../lib/forest/speech-audio';
import { readAdventure, recordActivity, emptyAdventure } from '../lib/forest/adventures';

test('chess starting tree has 20, 400 and 8902 legal positions; pawn and knight moves obey blockers', () => {
  const game = Chess();
  assert.equal(game.perft(1), 20);
  assert.equal(game.perft(2), 400);
  assert.equal(game.perft(3), 8902);
  assert.equal(game.moves({ verbose: true, square: 'a1' }).length, 0);
  assert.deepEqual(
    game
      .moves({ verbose: true, square: 'b1' })
      .map((m) => m.to)
      .sort(),
    ['a3', 'c3'],
  );
  assert.equal(game.move({ from: 'e2', to: 'e5' }), null);
});
test('check, pins, castling through check and en passant respect king safety', () => {
  const castle = Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  assert.ok(castle.moves({ verbose: true }).some((m) => m.san === 'O-O'));
  assert.ok(castle.moves({ verbose: true }).some((m) => m.san === 'O-O-O'));
  assert.ok(castle.move('O-O'));
  assert.equal(castle.get('f1')?.type, 'r');
  assert.equal(castle.get('g1')?.type, 'k');
  const attacked = Chess('4kr2/8/8/8/8/8/8/4K2R w K - 0 1');
  assert.equal(
    attacked.moves({ verbose: true }).some((m) => m.san === 'O-O'),
    false,
  );
  const pinned = Chess('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1');
  assert.equal(pinned.move({ from: 'e2', to: 'd2' }), null);
  const ep = replayChess(['e4', 'a6', 'e5', 'd5', 'exd6']);
  assert.equal(ep.get('d5'), null);
  assert.equal(ep.get('d6')?.color, 'w');
});
test('promotion choices, mate, stalemate, insufficient material and repetition are real end conditions', () => {
  const promotion = Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
  assert.deepEqual(
    promotion
      .moves({ verbose: true, square: 'a7' })
      .map((m) => m.promotion)
      .sort(),
    ['b', 'n', 'q', 'r'],
  );
  promotion.move({ from: 'a7', to: 'a8', promotion: 'n' });
  assert.equal(promotion.get('a8')?.type, 'n');
  assert.equal(chessResult(Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1')), 'win');
  assert.equal(chessResult(replayChess(['f3', 'e5', 'g4', 'Qh4#'])), 'loss');
  assert.equal(chessResult(Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')), 'draw');
  assert.equal(chessResult(Chess('7k/8/8/8/8/8/8/K7 w - - 0 1')), 'draw');
  const rep = replayChess(['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']);
  assert.equal(rep.in_threefold_repetition(), true);
  assert.equal(chessResult(rep), 'draw');
});
test('chess bot takes mate, chooses legal replies and leaves history/repetition unchanged', () => {
  for (const level of ['practice', 'challenge'] as const) {
    const game = replayChess(['f3', 'e5', 'g4']),
      fen = game.fen(),
      history = game.history();
    assert.equal(chooseChessMove(game, level)?.san, 'Qh4#');
    assert.equal(game.fen(), fen);
    assert.deepEqual(game.history(), history);
    const ordinary = replayChess(['e4']);
    const move = chooseChessMove(ordinary, level)!;
    assert.ok(ordinary.moves({ verbose: true }).some((m) => m.san === move.san));
  }
  assert.equal(chooseChessMove(Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'), 'challenge'), null);
  assert.deepEqual(undoChessRound(['e4']), []);
  assert.deepEqual(undoChessRound(['e4', 'e5']), []);
  assert.deepEqual(undoChessRound(['e4', 'e5', 'Nf3']), ['e4', 'e5']);
  assert.throws(() => replayChess(['not a move']));
});
test('gomoku detects all four lines, accepts overlines, never wraps edges and rejects occupied/outside points', () => {
  const n = 9;
  for (const [dr, dc, startR, startC] of [
    [1, 0, 0, 4],
    [0, 1, 4, 0],
    [1, 1, 0, 0],
    [1, -1, 0, 8],
  ]) {
    const board: Stone[] = Array(n * n).fill(0);
    for (let i = 0; i < 5; i++) board[(startR + i * dr) * n + startC + i * dc] = 1;
    assert.equal(gomokuLine(board, n, startR, startC).length, 5);
  }
  const edge: Stone[] = Array(81).fill(0);
  [7, 8, 9, 10, 11].forEach((i) => (edge[i] = 1));
  assert.equal(gomokuLine(edge, 9, 0, 8).length, 0);
  const six: Stone[] = Array(81).fill(0);
  for (let c = 1; c <= 6; c++) six[4 * 9 + c] = 2;
  assert.equal(gomokuLine(six, 9, 4, 3).length, 6);
  assert.equal(gomokuLine(six, 9, 0, 0).length, 0);
  assert.throws(() =>
    gomokuBoard(9, [
      { row: 4, col: 4 },
      { row: 4, col: 4 },
    ]),
  );
  assert.throws(() => gomokuBoard(9, [{ row: -1, col: 2 }]));
});
test('gomoku bot wins before blocking, blocks immediate loss at both levels and never changes input', () => {
  for (const level of ['practice', 'challenge'] as const) {
    const n = gomokuSize(level),
      board: Stone[] = Array(n * n).fill(0);
    assert.deepEqual(chooseGomokuMove(board, n, level), {
      row: Math.floor(n / 2),
      col: Math.floor(n / 2),
    });
    board[3 * n] = 2;
    for (let c = 1; c <= 4; c++) board[3 * n + c] = 1;
    assert.deepEqual(chooseGomokuMove(board, n, level), { row: 3, col: 5 });
    for (let c = 0; c < 4; c++) board[6 * n + c] = 2;
    const copy = [...board];
    assert.deepEqual(chooseGomokuMove(board, n, level), { row: 6, col: 4 });
    assert.deepEqual(board, copy);
    assert.equal(chooseGomokuMove(Array(n * n).fill(1), n, level), null);
    const snapshot = [...board];
    assert.equal(longestGomokuRun(board, n, 3, 5, 1), 5);
    assert.deepEqual(board, snapshot);
  }
});
test('both levels have solvable audio-backed board missions, unique distractors, and bounded goals', () => {
  for (const text of boardSpeechTexts) assert.ok(speechAudioSource(text), text);
  for (const level of ['practice', 'challenge'] as const)
    for (const kind of ['chess', 'gomoku'] as const)
      for (let turn = 0; turn < 30; turn++)
        for (const piece of ['p', 'n', 'b', 'r', 'q', 'k'] as const) {
          const lesson = makeBoardLesson(kind, turn, level, {
            piece,
            run: (turn % 5) + 1,
            col: turn % 9,
            size: 9,
          });
          assert.equal(lesson.options.length, level === 'practice' ? 3 : 4);
          assert.equal(new Set(lesson.options).size, lesson.options.length);
          assert.equal(lesson.options.filter((x) => x === lesson.answer).length, 1);
          assert.ok(speechAudioSource(lesson.answer), lesson.answer);
          assert.ok(lesson.korean && lesson.note);
        }
  assert.equal(boardMissionGoal('practice'), 4);
  assert.equal(boardMissionGoal('challenge'), 6);
});
test('chess and gomoku get separate once-daily rewards while keeping old records and best scores', () => {
  let p = recordActivity(emptyAdventure, 'game:soccer', 80, '2026-11-07T00:00:00Z').progress;
  for (const id of ['game:chess', 'game:gomoku'] as const) {
    const first = recordActivity(p, id, 75, '2026-11-07T00:00:00Z');
    assert.equal(first.pointsEarned, 10);
    const again = recordActivity(first.progress, id, 100, '2026-11-07T00:01:00Z');
    assert.equal(again.pointsEarned, 0);
    p = again.progress;
  }
  assert.equal(p.activityRecords.length, 3);
  assert.deepEqual(readAdventure(p), p);
});
