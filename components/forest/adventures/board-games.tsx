'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, Lightbulb, RotateCcw, Undo2, Volume2, X } from 'lucide-react';
import {
  chessPieces,
  replayChess,
  chooseChessMove,
  chessResult,
  undoChessRound,
  type PieceType,
  type Promotion,
} from '@/lib/forest/chess-game';
import {
  chooseGomokuMove,
  gomokuBoard,
  gomokuLine,
  gomokuSize,
  longestGomokuRun,
  type GomokuMove,
} from '@/lib/forest/gomoku-game';
import {
  boardMissionGoal,
  makeBoardLesson,
  type BoardKind,
  type BoardLesson,
} from '@/lib/forest/board-learning';
import { gameScore } from '@/lib/forest/game-challenges';
import { BoardCoach, ChessPiece } from './chess-piece';
import type { PlayProps } from './game-shared';
import './board-games.css';

type Pending = {
  lesson: BoardLesson;
  from?: string;
  to?: string;
  promotions?: Promotion[];
  point?: GomokuMove;
};
function WordMission({
  pending,
  speak,
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  speak: PlayProps['speak'];
  onCancel: () => void;
  onConfirm: (firstTry: boolean, promotion: Promotion) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    committed = useRef(false);
  const [wrong, setWrong] = useState(false),
    [solved, setSolved] = useState(false),
    [hint, setHint] = useState(false);
  const [selected, setSelected] = useState<string | null>(null),
    [promotion, setPromotion] = useState<Promotion>('q');
  const lesson = pending.lesson;
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="board-mission"
      aria-labelledby="board-mission-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled])',
          ),
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="board-mission-top">
        <span>ENGLISH POWER</span>
        <button onClick={onCancel} aria-label="미션 닫고 다른 수 고르기">
          <X size={21} />
        </button>
      </div>
      <h2 id="board-mission-title">영어로 한 수 더!</h2>
      <p className="board-mission-prompt">{lesson.prompt}</p>
      <button className="board-listen" onClick={() => speak(lesson.answer)}>
        <Volume2 size={23} />
        영어 듣기
      </button>
      <div className="board-word-options">
        {lesson.options.map((option) => (
          <button
            key={option}
            lang="en"
            aria-pressed={selected === option}
            disabled={solved}
            className={`${selected === option ? (solved ? 'correct' : 'retry') : ''}`}
            onClick={() => {
              setSelected(option);
              if (option === lesson.answer) setSolved(true);
              else setWrong(true);
            }}
          >
            {option}
            {solved && option === lesson.answer && <Check size={20} />}
          </button>
        ))}
      </div>
      <p className="board-mission-feedback" role="status">
        {solved
          ? `${lesson.answer} · ${lesson.korean}. 맞았어요! 한 번 따라 말해 봐요.`
          : selected
            ? '괜찮아요! 다시 듣고 다른 답을 골라 봐요.'
            : '소리를 듣거나 글을 읽고 정답을 골라요.'}
      </p>
      {pending.promotions && (
        <fieldset className="board-promotion">
          <legend>끝 칸에 도착! 바꿀 말을 골라요.</legend>
          {pending.promotions.map((type) => (
            <label key={type}>
              <input
                type="radio"
                name="promotion"
                value={type}
                checked={promotion === type}
                onChange={() => setPromotion(type)}
              />
              <ChessPiece type={type} />
              <span>{chessPieces[type].english}</span>
            </label>
          ))}
        </fieldset>
      )}
      {hint || solved ? (
        <p className="board-hint">
          <strong lang="en">{lesson.answer}</strong> · {lesson.korean}
          <br />
          {lesson.note}
        </p>
      ) : (
        <button
          className="board-hint-toggle"
          onClick={() => {
            setHint(true);
            setWrong(true);
          }}
        >
          <Lightbulb size={17} />
          힌트 보기
        </button>
      )}
      <button
        className="forest-button board-confirm"
        disabled={!solved}
        onClick={() => {
          if (committed.current) return;
          committed.current = true;
          onConfirm(!wrong, promotion);
        }}
      >
        이 수 두기
        <ArrowRight size={19} />
      </button>
    </dialog>
  );
}
const files = 'abcdefgh';
const names = {
  win: '멋진 승리예요!',
  loss: '끝까지 잘 도전했어요!',
  draw: '서로 멋지게 겨뤘어요!',
};
export function BoardGame({ kind, level, speak, stop, onFinish }: PlayProps & { kind: BoardKind }) {
  const [chessHistory, setChessHistory] = useState<string[]>([]),
    [stones, setStones] = useState<GomokuMove[]>([]);
  const [learned, setLearned] = useState<boolean[]>([]),
    [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null),
    [showRules, setShowRules] = useState(false);
  const [restartPrompt, setRestartPrompt] = useState(false),
    [notice, setNotice] = useState('');
  const finished = useRef(false),
    pendingLock = useRef(false);
  const chess = useMemo(() => replayChess(chessHistory), [chessHistory]);
  const size = gomokuSize(level),
    board = useMemo(() => gomokuBoard(size, stones), [size, stones]);
  const last = stones[stones.length - 1],
    line = last ? gomokuLine(board, size, last.row, last.col) : [];
  const outcome =
    kind === 'chess'
      ? chessResult(chess)
      : line.length
        ? stones.length % 2
          ? 'win'
          : 'loss'
        : stones.length === size * size
          ? 'draw'
          : null;
  const myTurn = kind === 'chess' ? chess.turn() === 'w' : stones.length % 2 === 0;
  const moveCount = kind === 'chess' ? chessHistory.length : stones.length;
  const goal = boardMissionGoal(level),
    goalMet = learned.length >= goal;
  const moves = selected ? chess.moves({ verbose: true, square: selected }) : [];
  const legal = new Set(moves.map((move) => move.to));
  const selectedPiece = selected ? chess.get(selected) : null;
  const lastChessMove = useMemo(() => {
    const history = chess.history({ verbose: true });
    return history[history.length - 1];
  }, [chess]);
  useEffect(() => {
    if (myTurn || outcome) return;
    const timer = setTimeout(() => {
      if (kind === 'chess') {
        const position = replayChess(chessHistory),
          move = chooseChessMove(position, level);
        if (move)
          setChessHistory((previous) =>
            previous === chessHistory ? [...previous, move.san] : previous,
          );
      } else {
        const point = chooseGomokuMove(board, size, level);
        if (point) setStones((previous) => (previous === stones ? [...previous, point] : previous));
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [kind, level, myTurn, outcome, chessHistory, stones, board, size]);
  const lock = !myTurn || !!outcome || !!pending || restartPrompt;
  function prepare(next: Omit<Pending, 'lesson'>, piece?: PieceType) {
    if (lock || pendingLock.current) return;
    stop();
    pendingLock.current = true;
    setNotice('');
    const run = next.point
      ? longestGomokuRun(board, size, next.point.row, next.point.col, 1)
      : undefined;
    setPending({
      ...next,
      lesson: makeBoardLesson(kind, learned.length, level, {
        piece,
        run,
        col: next.point?.col,
        size,
      }),
    });
  }
  function selectSquare(square: string) {
    if (lock) return;
    const piece = chess.get(square);
    if (piece?.color === 'w') {
      setSelected(square === selected ? null : square);
      setNotice('');
      return;
    }
    if (selected && legal.has(square)) {
      const candidates = moves.filter((move) => move.to === square);
      const promotions = candidates
        .map((move) => move.promotion)
        .filter((type): type is Promotion => !!type);
      prepare(
        { from: selected, to: square, ...(promotions.length ? { promotions } : {}) },
        selectedPiece?.type,
      );
    } else
      setNotice(
        selected
          ? '표시된 동그라미 칸을 골라 주세요. 킹이 공격받는 수는 둘 수 없어요.'
          : '먼저 내 흰 말을 고르면 갈 수 있는 칸이 보여요.',
      );
  }
  function confirm(first: boolean, promotion: Promotion) {
    if (!pending) return;
    if (kind === 'chess') {
      const position = replayChess(chessHistory),
        move = position.move({ from: pending.from!, to: pending.to!, promotion });
      if (!move) return;
      setChessHistory([...chessHistory, move.san]);
    } else if (pending.point && !board[pending.point.row * size + pending.point.col])
      setStones([...stones, pending.point]);
    else return;
    setLearned([...learned, first]);
    setSelected(null);
    setPending(null);
    pendingLock.current = false;
    stop();
  }
  function cancel() {
    setPending(null);
    pendingLock.current = false;
    stop();
  }
  function undo() {
    cancel();
    setSelected(null);
    setNotice('한 수를 되돌렸어요. 다른 작전을 생각해 봐요.');
    if (kind === 'chess') setChessHistory(undoChessRound(chessHistory));
    else setStones(stones.slice(0, Math.max(0, stones.length - (stones.length % 2 ? 1 : 2))));
    setLearned(learned.slice(0, -1));
  }
  function reset() {
    cancel();
    setChessHistory([]);
    setStones([]);
    setLearned([]);
    setSelected(null);
    setNotice('새로운 작전으로 시작해요!');
    setRestartPrompt(false);
    finished.current = false;
  }
  function finish() {
    if (finished.current || (!outcome && !goalMet) || pending) return;
    finished.current = true;
    onFinish(gameScore(learned.filter(Boolean).length, Math.max(1, learned.length)));
  }
  const coachText = outcome
    ? names[outcome]
    : !myTurn
      ? '친구가 다음 수를 생각하고 있어요.'
      : kind === 'chess' && chess.in_check()
        ? '체크! 킹을 안전하게 지켜 주세요.'
        : selectedPiece
          ? `${chessPieces[selectedPiece.type].english} · ${chessPieces[selectedPiece.type].rule}`
          : kind === 'chess'
            ? '내 흰 말을 콕! 갈 수 있는 칸을 골라 봐요.'
            : '내 검은 돌 다섯 개를 이어 봐요. 친구의 길도 살펴봐요!';
  return (
    <section
      className={`strategy-world strategy-${kind}`}
      aria-label={kind === 'chess' ? '영어 체스 대국' : '영어 오목 대국'}
    >
      <div className="strategy-scorebar">
        <span>
          <i className="turn-light" />{' '}
          {outcome ? '대국 완료' : myTurn ? 'YOUR TURN · 내 차례' : 'FRIEND’S TURN · 친구 차례'}
        </span>
        <strong>
          {Math.ceil(moveCount / 2)}
          <small> 턴</small>
        </strong>
      </div>
      <div className="strategy-layout">
        <div className="strategy-main">
          <div className="board-coach">
            <BoardCoach />
            <div>
              <span>MILO’S BOARD CLUB</span>
              <p role="status" aria-live="polite">
                {coachText}
              </p>
            </div>
          </div>
          <div className="board-table">
            <div className="board-player">
              <span className="player-token bot-token">M</span>
              <span>
                <strong>마일로</strong>
                <small>함께 배우는 보드 친구</small>
              </span>
              <span className="piece-color">
                {kind === 'chess' ? 'Black · 검은 말' : 'White · 흰 돌'}
              </span>
            </div>
            {kind === 'chess' ? (
              <div className="chess-frame">
                <div className="chess-board" role="group" aria-label="체스판, 흰색이 나예요">
                  {chess.board().flatMap((rank, row) =>
                    rank.map((piece, col) => {
                      const square = `${files[col]}${8 - row}`,
                        target = legal.has(square),
                        active = selected === square;
                      return (
                        <button
                          key={square}
                          className={`chess-square ${(row + col) % 2 ? 'dark' : 'light'}${lastChessMove && (square === lastChessMove.from || square === lastChessMove.to) ? ' last-move' : ''}${active ? ' selected' : ''}${target ? ' legal' : ''}${piece?.type === 'k' && piece.color === chess.turn() && chess.in_check() ? ' in-check' : ''}`}
                          data-square={square}
                          data-piece={piece ? `${piece.color}${piece.type}` : ''}
                          data-legal={target ? 'true' : 'false'}
                          aria-label={`${square}${piece ? ` ${piece.color === 'w' ? '내 흰' : '친구 검은'} ${chessPieces[piece.type].english}` : ' 빈칸'}${target ? ' 이동 가능' : ''}`}
                          aria-pressed={active}
                          disabled={lock}
                          onClick={() => selectSquare(square)}
                        >
                          {col === 0 && (
                            <span className="rank-label" aria-hidden="true">
                              {8 - row}
                            </span>
                          )}
                          {row === 7 && (
                            <span className="file-label" aria-hidden="true">
                              {files[col]}
                            </span>
                          )}
                          {piece && <ChessPiece type={piece.type} white={piece.color === 'w'} />}
                          {target && (
                            <span
                              className={`legal-marker${piece ? ' capture' : ''}`}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            ) : (
              <div className="gomoku-frame">
                <div
                  className="gomoku-board"
                  role="group"
                  aria-label={`오목판 ${size} 곱하기 ${size}, 검은 돌이 나예요`}
                  style={{ gridTemplateColumns: `repeat(${size},1fr)` }}
                >
                  {board.map((stone, index) => {
                    const row = Math.floor(index / size),
                      col = index % size,
                      latest = last?.row === row && last?.col === col;
                    return (
                      <button
                        key={index}
                        className={`gomoku-point${stone ? ' occupied' : ''}${latest ? ' last' : ''}${line.includes(index) ? ' winning' : ''}`}
                        data-row={row}
                        data-col={col}
                        data-stone={stone}
                        data-edge={`${row === 0 ? 't' : ''}${row === size - 1 ? 'b' : ''}${col === 0 ? 'l' : ''}${col === size - 1 ? 'r' : ''}`}
                        aria-label={`${row + 1}행 ${col + 1}열 ${stone === 1 ? '내 검은 돌' : stone === 2 ? '친구 흰 돌' : '빈칸'}`}
                        disabled={lock || !!stone}
                        onClick={() => prepare({ point: { row, col } })}
                      >
                        {row === Math.floor(size / 2) && col === Math.floor(size / 2) && (
                          <i className="board-star" aria-hidden="true" />
                        )}
                        {!!stone && (
                          <span
                            className={`gomoku-stone ${stone === 1 ? 'black' : 'white'}`}
                            aria-hidden="true"
                          >
                            {latest && <i />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="board-player">
              <span className="player-token my-token">YOU</span>
              <span>
                <strong>나의 작은 작전</strong>
                <small>{kind === 'chess' ? '흰 말부터 시작해요' : '다섯 개를 먼저 이어요'}</small>
              </span>
              <span className="piece-color">
                {kind === 'chess' ? 'White · 흰 말' : 'Black · 검은 돌'}
              </span>
            </div>
          </div>
          <p className="board-notice" role="status">
            {notice ||
              (kind === 'chess'
                ? '내 말을 누르고, 표시된 칸을 고르면 영어 미션이 열려요.'
                : '빈 교차점을 고르고 영어 미션을 풀면 돌을 놓아요.')}
          </p>
          <div className="board-tools">
            <button onClick={undo} disabled={!moveCount || !!pending || !!outcome}>
              <Undo2 size={18} />한 수 되돌리기
            </button>
            <button
              onClick={() => {
                stop();
                setRestartPrompt(true);
              }}
              disabled={!!pending}
            >
              <RotateCcw size={18} />
              다시 시작
            </button>
            <button aria-expanded={showRules} onClick={() => setShowRules(!showRules)}>
              <BookOpen size={18} />
              두는 법
            </button>
          </div>
          {restartPrompt && (
            <div className="board-reset" role="group" aria-label="새 대국 확인">
              <p>지금 대국을 지우고 새로 시작할까요?</p>
              <button className="forest-button secondary" onClick={() => setRestartPrompt(false)}>
                계속 두기
              </button>
              <button className="forest-button" onClick={reset}>
                새 대국 시작
              </button>
            </div>
          )}
        </div>
        <aside className="strategy-side">
          <div className="board-learning-card">
            <span className="board-kicker">LITTLE MOVES, BIG WORDS</span>
            <h2>오늘의 영어 작전</h2>
            <p>
              미션 {goal}개를 풀면 학습 완료!
              <br />
              대국은 계속 이어갈 수 있어요.
            </p>
            <div
              className="board-mission-stars"
              role="progressbar"
              aria-label="완료한 영어 미션"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={Math.min(goal, learned.length)}
            >
              {Array.from({ length: goal }, (_, i) => (
                <span key={i} className={i < learned.length ? 'earned' : ''} aria-hidden="true">
                  ✦
                </span>
              ))}
            </div>
            <strong className="board-mission-count">
              {Math.min(goal, learned.length)} / {goal} 미션
            </strong>
            {(goalMet || outcome) && (
              <div className="board-ready">
                <Check size={20} />
                <p>{outcome ? names[outcome] : '영어 작전 성공! 더 두어도 좋아요.'}</p>
                <button
                  className="forest-button"
                  disabled={(!myTurn && !outcome) || !!pending}
                  onClick={finish}
                >
                  학습 모험 마치기
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="board-pocket-guide">
            <h3>{kind === 'chess' ? 'PIECE PASSPORT' : 'FIVE TOGETHER'}</h3>
            <p>
              {kind === 'chess' ? '말의 이름을 읽고 들어 봐요.' : '숫자와 방향을 읽고 들어 봐요.'}
            </p>
            <div className="board-vocabulary">
              {(kind === 'chess'
                ? Object.entries(chessPieces).map(([type, p]) => ({
                    ...p,
                    type: type as PieceType,
                  }))
                : [
                    { english: 'one', korean: '하나' },
                    { english: 'two', korean: '둘' },
                    { english: 'three', korean: '셋' },
                    { english: 'four', korean: '넷' },
                    { english: 'five', korean: '다섯' },
                    { english: 'left', korean: '왼쪽' },
                    { english: 'right', korean: '오른쪽' },
                    { english: 'center', korean: '가운데' },
                    { english: 'black', korean: '검은색' },
                    { english: 'white', korean: '흰색' },
                  ]
              ).map((item) => (
                <button
                  key={item.english}
                  onClick={() => speak(item.english)}
                  aria-label={`${item.english} ${item.korean} 듣기`}
                >
                  {'type' in item && <ChessPiece type={item.type} />}
                  <span>
                    <strong lang="en">{item.english}</strong>
                    <small>{item.korean}</small>
                  </span>
                  <Volume2 size={16} />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {showRules && (
        <div className="board-rules">
          <h2>처음이어도 괜찮아요</h2>
          {kind === 'chess' ? (
            <>
              <p>
                ① 내 흰 말을 골라요. ② 표시된 칸을 골라요. ③ 영어 미션을 풀고 ‘이 수 두기’를 눌러요.
              </p>
              <p>
                상대 킹이 공격을 피할 수 없으면 체크메이트! 킹이 공격받는 수는 둘 수 없어요.
                캐슬링·앙파상·폰 승급도 할 수 있어요. 같은 자리 3번, 50수 규칙, 움직일 수 없는
                상황은 무승부예요.
              </p>
            </>
          ) : (
            <>
              <p>
                ① 빈 교차점을 골라요. ② 영어 미션을 풀고 검은 돌을 놓아요. ③ 마일로가 흰 돌을 두면
                다시 내 차례!
              </p>
              <p>
                {size}×{size} 작은 판에서 가로·세로·대각선으로 5개 이상 이으면 이겨요. 금수 없이
                즐기는 자유 오목이에요. 꽉 찬 판은 무승부예요.
              </p>
            </>
          )}
          <p>
            틀려도 기회를 잃지 않아요. 힌트를 보며 다시 골라요. 되돌리면 그 수의 미션도 되돌아가요.
          </p>
        </div>
      )}
      {pending && (
        <WordMission pending={pending} speak={speak} onCancel={cancel} onConfirm={confirm} />
      )}
    </section>
  );
}
