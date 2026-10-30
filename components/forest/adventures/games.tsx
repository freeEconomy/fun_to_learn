'use client';
import { SoccerGame } from './soccer';
import { QuestGame } from './word-quests';
import { GameProgress, type PlayProps } from './game-shared';
import {
  gameSettings,
  gameDescriptions,
  gameScore,
  memoryWords,
  listeningRounds,
  sentenceRounds,
  sentenceTokens,
  type GameLevel,
} from '@/lib/forest/game-challenges';
import './challenges.css';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Gamepad2, Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import {
  gameModes,
  shuffle,
  trainRounds,
  type GameId,
  type ActivityId,
  type AdventureProgress,
} from '@/lib/forest/adventures';
import { words } from '@/lib/forest/content';
import { Photo } from '../photo';
import { AdventureComplete, AdventureHeading, SpeakButton } from './shared';
const wordFor = (id: string) => words.find((word) => word.id === id)!;
function MemoryGame({ speak, onFinish, level }: PlayProps) {
  const [deck] = useState(() => {
    const picked = memoryWords(level);
    return shuffle(
      picked.flatMap((wordId) => [
        { id: `${wordId}-photo`, wordId, kind: 'photo' as const },
        { id: `${wordId}-word`, wordId, kind: 'word' as const },
      ]),
    );
  });
  const [flipped, setFlipped] = useState<string[]>([]),
    [matched, setMatched] = useState<string[]>([]),
    [mistakes, setMistakes] = useState(0),
    [feedback, setFeedback] = useState('카드 두 장을 골라 같은 짝을 찾아요.');
  const mismatch = flipped.length === 2;
  function flip(id: string) {
    const card = deck.find((c) => c.id === id)!;
    if (mismatch || flipped.includes(id) || matched.includes(card.wordId)) return;
    if (card.kind === 'word') speak(wordFor(card.wordId).name);
    if (!flipped.length) {
      setFlipped([id]);
      setFeedback('짝꿍 카드는 어디에 있을까요?');
      return;
    }
    const first = deck.find((c) => c.id === flipped[0])!;
    if (first.wordId === card.wordId) {
      const next = [...matched, card.wordId];
      setMatched(next);
      setFlipped([]);
      setFeedback(`짝을 찾았어요! ${wordFor(card.wordId).name} · ${wordFor(card.wordId).korean}`);
      if (next.length === gameSettings[level].pairs) onFinish(Math.max(50, 100 - mistakes * 10));
    } else {
      setFlipped([...flipped, id]);
      setMistakes((n) => n + 1);
      setFeedback('다른 짝이에요. 카드를 기억하고 다시 찾아봐요!');
    }
  }
  return (
    <div className={`game-board memory-board${level === 'challenge' ? ' challenge-memory' : ''}`}>
      <GameProgress current={matched.length} total={gameSettings[level].pairs} label="찾은 짝꿍" />
      <p className="game-instruction">사진 카드와 영어 카드가 만나면 짝꿍!</p>
      <div className="memory-grid">
        {deck.map((card, i) => {
          const word = wordFor(card.wordId),
            done = matched.includes(card.wordId),
            open = done || flipped.includes(card.id);
          return (
            <button
              key={card.id}
              data-pair={card.wordId}
              data-kind={card.kind}
              className={`memory-card${open ? ' open' : ''}${done ? ' matched' : ''}`}
              onClick={() => flip(card.id)}
              disabled={done || (mismatch && !flipped.includes(card.id))}
              aria-pressed={open}
              aria-label={
                open
                  ? `${done ? '짝 맞춘 ' : ''}${card.kind === 'photo' ? '사진' : '단어'} ${word.name}`
                  : `카드 ${i + 1} 뒤집기`
              }
            >
              {open ? (
                card.kind === 'photo' ? (
                  <Photo photoId={word.photoId} alt={`${word.korean} 사진`} />
                ) : (
                  <span lang="en" className="memory-word">
                    {word.name}
                    <Volume2 size={17} />
                  </span>
                )
              ) : (
                <span className="memory-back" aria-hidden="true">
                  ✦<small>FUN TO RUN</small>
                </span>
              )}
              {done && (
                <span className="memory-check">
                  <Check size={16} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      {mismatch && (
        <button
          className="forest-button secondary"
          onClick={() => {
            setFlipped([]);
            setFeedback('괜찮아요. 다른 카드를 골라 봐요.');
          }}
        >
          <RotateCcw size={18} />
          다시 뒤집기
        </button>
      )}
    </div>
  );
}
function ListeningGame({ speak, stop, onFinish, level }: PlayProps) {
  const [rounds] = useState(() => listeningRounds(level));
  const advancing = useRef(false);
  const answered = useRef(false);
  const [round, setRound] = useState(0),
    [solved, setSolved] = useState(false),
    [mistake, setMistake] = useState(false),
    [correct, setCorrect] = useState(0),
    [hint, setHint] = useState(false),
    [feedback, setFeedback] = useState('영어 소리를 듣고 사진을 골라 주세요.');
  const question = rounds[round];
  useEffect(() => {
    advancing.current = false;
    answered.current = false;
  }, [round]);
  function choose(id: string) {
    if (solved || answered.current) return;
    if (id === question.target.id) {
      answered.current = true;
      setSolved(true);
      if (!mistake) setCorrect((c) => c + 1);
      setFeedback(`찾았어요! ${question.target.name}는 ${question.target.korean}예요.`);
    } else {
      setMistake(true);
      setFeedback('다른 사진이에요. 소리를 다시 듣거나 힌트를 열어 봐요.');
    }
  }
  function next() {
    if (!solved || advancing.current) return;
    advancing.current = true;
    stop();
    if (round === rounds.length - 1) {
      onFinish(gameScore(correct, rounds.length));
      return;
    }
    window.scrollTo({ top: 0 });
    setRound((n) => n + 1);
    setSolved(false);
    setMistake(false);
    setHint(false);
    setFeedback('새로운 영어 보물을 찾아요!');
  }
  return (
    <div className="game-board listening-board">
      <GameProgress current={round + 1} total={rounds.length} label="소리 보물" />
      <div className="sound-treasure">
        <span aria-hidden="true">🔎</span>
        <button className="sound-play" onClick={() => speak(question.target.name)}>
          <Volume2 size={34} />
          영어 소리 듣기
        </button>
        <button className="adventure-back" onClick={() => setHint((v) => !v)}>
          <Lightbulb size={17} />
          {hint ? '힌트 닫기' : '단어 힌트 보기'}
        </button>
        {hint && (
          <strong className="sound-hint" lang="en">
            {question.target.name}
          </strong>
        )}
        <small>소리가 안 나면 단어 힌트로도 놀 수 있어요.</small>
      </div>
      <div className={`listening-options${level === 'challenge' ? ' four-options' : ''}`}>
        {question.options.map((id) => {
          const word = wordFor(id);
          return (
            <button
              key={id}
              className={solved && id === question.target.id ? 'correct' : ''}
              onClick={() => choose(id)}
              disabled={solved}
              aria-label={`${word.korean} 선택`}
            >
              <Photo photoId={word.photoId} alt={`${word.korean} 사진`} />
              <strong>{word.korean}</strong>
              {solved && id === question.target.id && <Check size={18} />}
            </button>
          );
        })}
      </div>
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      <button className="forest-button" disabled={!solved} onClick={next}>
        {round === rounds.length - 1 ? '보물상자 열기' : '다음 소리'}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
function SentenceRound({
  index,
  onNext,
  speak,
  target,
  total,
  level,
}: {
  index: number;
  target: (typeof trainRounds)[number];
  total: number;
  level: GameLevel;
  onNext: (first: boolean) => void;
  speak: (text: string) => void;
}) {
  const word = wordFor(target.wordId);
  const needed = target.english.split(' ').length;
  const [tokens] = useState(() => sentenceTokens(target.english, level));
  const [selected, setSelected] = useState<number[]>([]),
    [solved, setSolved] = useState(false),
    [mistake, setMistake] = useState(false),
    [feedback, setFeedback] = useState('아래 낱말을 눌러 기차를 연결해요.');
  function check() {
    const sentence = selected.map((id) => tokens.find((t) => t.id === id)!.text).join(' ');
    if (sentence === target.english) {
      setSolved(true);
      setFeedback('출발 준비 완료! 멋진 영어 문장이에요.');
    } else {
      setMistake(true);
      setFeedback('순서를 조금 바꿔 볼까요? 기차의 낱말을 누르면 다시 고를 수 있어요.');
    }
  }
  return (
    <>
      <GameProgress current={index + 1} total={total} label="문장 여행" />
      <div className="sentence-clue">
        <Photo photoId={word.photoId} alt={`${word.korean} 참고 사진`} />
        <div>
          <small>이 말을 영어로 만들어 봐요</small>
          <h2>{target.korean}</h2>
          <SpeakButton text={target.english} speak={speak} label="문장 힌트 듣기" />
        </div>
      </div>
      {level === 'challenge' && (
        <p className="challenge-tip">필요 없는 낱말이 하나 있어요. {needed}칸만 연결해요!</p>
      )}
      <div className="sentence-track" aria-label="만든 문장">
        <span className="train-engine" aria-hidden="true">
          🚂
        </span>
        {selected.map((id, i) => (
          <button
            key={id}
            className="train-car"
            disabled={solved}
            onClick={() => setSelected((ids) => ids.filter((_, n) => n !== i))}
            aria-label={`${tokens.find((t) => t.id === id)!.text} 되돌리기`}
            lang="en"
          >
            {tokens.find((t) => t.id === id)!.text}
          </button>
        ))}
        {Array.from({ length: needed - selected.length }, (_, i) => (
          <span className="train-empty" key={i} aria-hidden="true">
            ···
          </span>
        ))}
      </div>
      <div className="sentence-tokens" aria-label="고를 낱말">
        {tokens.map((token) => (
          <button
            key={token.id}
            data-position={token.id}
            disabled={selected.includes(token.id) || solved || selected.length >= needed}
            onClick={() =>
              setSelected((ids) =>
                ids.includes(token.id) || ids.length >= needed ? ids : [...ids, token.id],
              )
            }
            aria-label={`${token.text} 넣기`}
            lang="en"
          >
            {token.text}
          </button>
        ))}
      </div>
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      <div className="forest-actions">
        {!solved ? (
          <>
            <button
              className="forest-button secondary"
              onClick={() => {
                setSelected([]);
                setFeedback('천천히 다시 연결해 봐요.');
              }}
            >
              <RotateCcw size={17} />
              다시 만들기
            </button>
            <button className="forest-button" disabled={selected.length !== needed} onClick={check}>
              문장 확인
              <Check size={18} />
            </button>
          </>
        ) : (
          <>
            <SpeakButton text={target.english} speak={speak} label="완성 문장 듣기" />
            <button className="forest-button" onClick={() => onNext(!mistake)}>
              {index === total - 1 ? '여행 마치기' : '다음 역으로'}
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </>
  );
}
function TrainGame({ speak, stop, onFinish, level }: PlayProps) {
  const [rounds] = useState(() => sentenceRounds(level));
  const advancing = useRef(false);
  const [round, setRound] = useState(0),
    [correct, setCorrect] = useState(0);
  useEffect(() => {
    advancing.current = false;
  }, [round]);
  return (
    <div className="game-board sentence-board">
      <SentenceRound
        key={round}
        index={round}
        target={rounds[round]}
        total={rounds.length}
        level={level}
        speak={speak}
        onNext={(first) => {
          if (advancing.current) return;
          advancing.current = true;
          stop();
          const count = correct + (first ? 1 : 0);
          if (round === rounds.length - 1) onFinish(gameScore(count, rounds.length));
          else {
            setCorrect(count);
            window.scrollTo({ top: 0 });
            setRound((r) => r + 1);
          }
        }}
      />
    </div>
  );
}
export function GameArcade({
  progress,
  speak,
  stop,
  onComplete,
}: {
  progress: AdventureProgress;
  speak: (text: string) => void;
  stop: () => void;
  onComplete: (id: ActivityId, score: number) => number;
}) {
  const [level, setLevel] = useState<GameLevel>('challenge');
  const [selected, setSelected] = useState<GameId | null>(null),
    [run, setRun] = useState(0),
    [result, setResult] = useState<{ score: number; earned: number } | null>(null);
  const finished = useRef(false);
  const mode = gameModes.find((g) => g.id === selected);
  const back = () => {
    stop();
    window.scrollTo({ top: 0 });
    setSelected(null);
    setResult(null);
    finished.current = false;
  };
  function finish(score: number) {
    if (finished.current || !selected) return;
    finished.current = true;
    stop();
    window.scrollTo({ top: 0 });
    setResult({ score, earned: onComplete(`game:${selected}`, score) });
  }
  if (!mode)
    return (
      <>
        <AdventureHeading
          eyebrow="PLAY · LISTEN · DISCOVER"
          title="와글와글 게임 놀이터"
          description="서두르지 않아도 괜찮아요. 한 번 더 해 보면, 영어가 내 친구!"
        />
        <div className="arcade-banner">
          <span aria-hidden="true">🏕️</span>
          <div>
            <h2>오늘은 어떤 모험을 할까?</h2>
            <p>더 커진 도전! 알파벳 조립부터 단어 배달, 기억 탐험까지.</p>
            <small>제한시간 없이 · 포인트 차감 없이 · 키보드로도 플레이</small>
          </div>
        </div>
        <fieldset className="game-levels">
          <legend>오늘의 난이도</legend>
          {(['practice', 'challenge'] as const).map((value) => (
            <label key={value} className={level === value ? 'chosen' : ''}>
              <input
                type="radio"
                name="game-level"
                value={value}
                checked={level === value}
                onChange={() => {
                  stop();
                  setLevel(value);
                }}
              />
              <span>
                {value === 'challenge' ? '도전 모드' : '연습 모드'}
                <small>
                  {value === 'challenge' ? '한 단계 더 생각해 봐요' : '익숙한 규칙부터 차근차근'}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="game-menu">
          {gameModes.map((game) => {
            const records = progress.activityRecords.filter(
              (r) => r.activityId === `game:${game.id}`,
            );
            const best = records.length ? Math.max(...records.map((r) => r.score)) : null;
            return (
              <button
                key={game.id}
                className={`game-tile game-${game.id}`}
                style={{ background: game.color }}
                onClick={() => {
                  stop();
                  finished.current = false;
                  window.scrollTo({ top: 0 });
                  setSelected(game.id);
                  setResult(null);
                  setRun((n) => n + 1);
                }}
                aria-label={`${game.title} 시작`}
              >
                <span className="game-tile-emoji" aria-hidden="true">
                  {game.emoji}
                </span>
                <span className="tale-badge">{game.tag}</span>
                <h2>{game.title}</h2>
                <p>{game.subtitle}</p>
                <span className="game-level-detail">{gameDescriptions[game.id][level]}</span>
                <small>{best === null ? '처음 떠나는 모험' : `최고 기록 ${best}점`}</small>
                <strong>
                  놀러 가기
                  <ArrowRight size={18} />
                </strong>
              </button>
            );
          })}
        </div>
        <div className="adventure-note">
          <Gamepad2 size={22} />
          <span>
            끝까지 도전하면 기본 50점! 게임마다 첫 시도 정답 보너스를 모아 최고 기록에 도전해요.
            오늘 처음 마친 게임에는 10포인트도 받아요. 난이도를 바꿔도 같은 게임의 하루 선물은 한
            번이에요.
          </span>
        </div>
      </>
    );
  return (
    <>
      <AdventureHeading
        eyebrow="FUN TO RUN · PLAY TIME"
        title={mode.title}
        description={mode.subtitle}
        onBack={back}
        backLabel="게임 놀이터"
      />
      <p className="game-level-banner">
        {level === 'challenge' ? '도전 모드' : '연습 모드'} · {gameDescriptions[mode.id][level]}
      </p>
      {result ? (
        <AdventureComplete
          title="오늘의 모험 성공!"
          score={result.score}
          earned={result.earned}
          onAgain={() => {
            stop();
            finished.current = false;
            setResult(null);
            setRun((n) => n + 1);
          }}
          onBack={back}
        />
      ) : selected === 'soccer' ? (
        <SoccerGame key={run} level={level} speak={speak} stop={stop} onFinish={finish} />
      ) : selected === 'memory' ? (
        <MemoryGame key={run} level={level} speak={speak} stop={stop} onFinish={finish} />
      ) : selected === 'listen' ? (
        <ListeningGame key={run} level={level} speak={speak} stop={stop} onFinish={finish} />
      ) : selected === 'train' ? (
        <TrainGame key={run} level={level} speak={speak} stop={stop} onFinish={finish} />
      ) : (
        <QuestGame
          key={`${run}-${selected}`}
          kind={selected! as 'spell' | 'delivery' | 'sequence'}
          level={level}
          speak={speak}
          stop={stop}
          onFinish={finish}
        />
      )}
    </>
  );
}
