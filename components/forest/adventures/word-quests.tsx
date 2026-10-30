'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react';
import {
  deliveryRounds,
  deliveryShops,
  gameScore,
  gameWord,
  sequenceRounds,
  spellingRounds,
  type GameLevel,
} from '@/lib/forest/game-challenges';
import { Photo } from '../photo';
import { SpeakButton } from './shared';
import { GameProgress, type PlayProps } from './game-shared';

type RoundProps = {
  level: GameLevel;
  speak: PlayProps['speak'];
  stop: PlayProps['stop'];
  last: boolean;
  onNext: (first: boolean) => void;
};

function RoundActions({
  solved,
  ready,
  last,
  onCheck,
  onReset,
  onNext,
}: {
  solved: boolean;
  ready: boolean;
  last: boolean;
  onCheck: () => void;
  onReset: () => void;
  onNext: () => void;
}) {
  return (
    <div className="forest-actions quest-actions">
      {solved ? (
        <button className="forest-button" onClick={onNext}>
          {last ? '모험 마치기' : '다음 미션'}
          <ArrowRight size={18} />
        </button>
      ) : (
        <>
          <button className="forest-button secondary" onClick={onReset}>
            <RotateCcw size={18} />
            다시 고르기
          </button>
          <button className="forest-button" disabled={!ready} onClick={onCheck}>
            정답 확인
            <Check size={18} />
          </button>
        </>
      )}
    </div>
  );
}

function SpellingRound({
  question,
  speak,
  last,
  onNext,
}: RoundProps & { question: ReturnType<typeof spellingRounds>[number] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState('사진 속 단어의 알파벳을 순서대로 놓아 주세요.');
  const { target, letters } = question;
  const textFor = (id: number) => letters.find((tile) => tile.id === id)!.text;
  function check() {
    if (solved || selected.length !== target.name.length) return;
    if (selected.map(textFor).join('') === target.name) {
      setSolved(true);
      setFeedback(`조립 성공! ${target.name}는 ${target.korean}예요.`);
    } else {
      setMistake(true);
      setFeedback('글자의 순서를 조금 바꿔 볼까요? 위쪽 글자를 누르면 되돌릴 수 있어요.');
    }
  }
  return (
    <>
      <div className="quest-clue spelling-clue">
        <Photo photoId={target.photoId} alt={`${target.korean} 사진`} />
        <div>
          <span className="forest-eyebrow">LETTER WORKSHOP</span>
          <h2>{target.korean}</h2>
          <p>알파벳 {target.name.length}개를 연결해요.</p>
          <SpeakButton text={target.name} speak={speak} label="단어 소리 듣기" />
        </div>
      </div>
      <div className="letter-slots" aria-label="만든 단어">
        {Array.from({ length: target.name.length }, (_, n) =>
          selected[n] !== undefined ? (
            <button
              key={n}
              disabled={solved}
              lang="en"
              aria-label={`${textFor(selected[n]).toUpperCase()} 되돌리기`}
              onClick={() => setSelected((ids) => ids.filter((_, i) => i !== n))}
            >
              {textFor(selected[n])}
            </button>
          ) : (
            <span key={n} aria-label={`${n + 1}번째 빈칸`}>
              ·
            </span>
          ),
        )}
      </div>
      <div className="letter-bank" aria-label="고를 알파벳">
        {letters.map((letter) => (
          <button
            key={letter.id}
            data-letter={letter.text}
            lang="en"
            aria-label={`${letter.text.toUpperCase()} 넣기`}
            disabled={
              solved || selected.includes(letter.id) || selected.length >= target.name.length
            }
            onClick={() =>
              setSelected((ids) =>
                ids.includes(letter.id) || ids.length >= target.name.length
                  ? ids
                  : [...ids, letter.id],
              )
            }
          >
            {letter.text}
          </button>
        ))}
      </div>
      <button className="adventure-back" onClick={() => setHint((v) => !v)} aria-expanded={hint}>
        <Lightbulb size={17} />첫 글자 힌트
      </button>
      {hint && (
        <p className="quest-hint">
          첫 글자는 <strong lang="en">{target.name[0].toUpperCase()}</strong>예요. 소리도 다시 들어
          보세요.
        </p>
      )}
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      {solved && <SpeakButton text={target.name} speak={speak} label="완성 단어 듣기" />}
      <RoundActions
        solved={solved}
        ready={selected.length === target.name.length}
        last={last}
        onCheck={check}
        onReset={() => setSelected([])}
        onNext={() => onNext(!mistake)}
      />
    </>
  );
}

function DeliveryRound({
  question,
  level,
  speak,
  last,
  onNext,
}: RoundProps & { question: ReturnType<typeof deliveryRounds>[number] }) {
  const [solved, setSolved] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState(
    '꾸러미 속 영어 단어를 읽거나 듣고, 알맞은 가게를 골라요.',
  );
  const shops = deliveryShops.slice(0, level === 'practice' ? 3 : 4);
  const { target } = question;
  const destination = shops.find((shop) => shop.id === question.shop)!;
  return (
    <>
      <div className="delivery-parcel">
        <span className="parcel-stamp" aria-hidden="true">
          SPECIAL DELIVERY 📦
        </span>
        <h2 lang="en">{target.name}</h2>
        <SpeakButton text={target.name} speak={speak} label="꾸러미 단어 듣기" />
      </div>
      {(level === 'practice' || hint || solved) && (
        <div className="parcel-hint">
          <Photo photoId={target.photoId} alt={`${target.korean} 사진`} />
          <strong>{target.korean}</strong>
        </div>
      )}
      <div className="delivery-shops" role="group" aria-label="배달할 가게">
        {shops.map((shop) => (
          <button
            key={shop.id}
            disabled={solved}
            className={solved && question.shop === shop.id ? 'correct' : ''}
            aria-label={`${shop.title}로 배달`}
            onClick={() => {
              if (solved) return;
              if (shop.id === question.shop) {
                setSolved(true);
                setFeedback(`배달 성공! ${target.name} · ${target.korean} → ${destination.title}`);
              } else {
                setMistake(true);
                setFeedback('다른 가게를 찾아볼까요? 사진 힌트를 보고 다시 배달해도 좋아요.');
              }
            }}
          >
            <span aria-hidden="true">{shop.emoji}</span>
            <strong>{shop.title}</strong>
            <small>{solved && question.shop === shop.id ? '배달 완료 ✓' : '여기로 배달'}</small>
          </button>
        ))}
      </div>
      {level === 'challenge' && (
        <button className="adventure-back" onClick={() => setHint((v) => !v)} aria-expanded={hint}>
          <Lightbulb size={17} />
          사진 힌트 보기
        </button>
      )}
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      {solved && (
        <button className="forest-button" onClick={() => onNext(!mistake)}>
          {last ? '모험 마치기' : '다음 미션'}
          <ArrowRight size={18} />
        </button>
      )}
    </>
  );
}

function SequenceRound({
  question,
  speak,
  stop,
  last,
  onNext,
}: RoundProps & { question: ReturnType<typeof sequenceRounds>[number] }) {
  const [phase, setPhase] = useState<'study' | 'recall'>('study');
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [feedback, setFeedback] = useState(
    '번호 순서대로 단어를 기억해요. 소리도 하나씩 들어 보세요.',
  );
  return (
    <>
      <div className="quest-heading">
        <span aria-hidden="true">🗺️</span>
        <h2>단어 {question.target.length}개의 길을 기억해요</h2>
        <p>
          {phase === 'study'
            ? '준비될 때까지 천천히 살펴봐도 좋아요.'
            : '가려진 지도와 같은 순서로 사진을 골라요.'}
        </p>
      </div>
      {phase === 'study' ? (
        <>
          <ol className="sequence-study" aria-label="기억할 순서">
            {question.target.map((id, n) => {
              const word = gameWord(id);
              return (
                <li key={id}>
                  <span className="sequence-number">{n + 1}</span>
                  <Photo photoId={word.photoId} alt={`${word.korean} 사진`} />
                  <strong lang="en">{word.name}</strong>
                  <small>{word.korean}</small>
                  <SpeakButton text={word.name} speak={speak} label={`${n + 1}번째 단어 듣기`} />
                </li>
              );
            })}
          </ol>
          <button
            className="forest-button"
            onClick={() => {
              stop();
              setPhase('recall');
              setSelected([]);
              setFeedback('사진을 같은 순서로 고르고 정답 확인을 눌러요.');
            }}
          >
            기억했어요! 지도 덮기
            <ArrowRight size={18} />
          </button>
        </>
      ) : (
        <>
          <ol className="sequence-slots" aria-label="기억한 순서">
            {Array.from({ length: question.target.length }, (_, n) => (
              <li key={n}>
                {selected[n] ? (
                  <button
                    disabled={solved}
                    onClick={() => setSelected((ids) => ids.slice(0, n))}
                    aria-label={`${n + 1}번째 선택부터 되돌리기`}
                  >
                    <b>{n + 1}</b>
                    {gameWord(selected[n]).korean}
                  </button>
                ) : (
                  <span>
                    <b>{n + 1}</b>?
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="sequence-options" role="group" aria-label="순서대로 고를 사진">
            {question.options.map((id) => {
              const word = gameWord(id);
              return (
                <button
                  key={id}
                  data-word={id}
                  disabled={
                    solved || selected.includes(id) || selected.length >= question.target.length
                  }
                  aria-label={`${word.korean} 순서에 넣기`}
                  onClick={() =>
                    setSelected((ids) =>
                      ids.includes(id) || ids.length >= question.target.length ? ids : [...ids, id],
                    )
                  }
                >
                  <Photo photoId={word.photoId} alt="" />
                  <strong>{word.korean}</strong>
                  <small lang="en">{word.name}</small>
                </button>
              );
            })}
          </div>
          {!solved && (
            <button
              className="adventure-back"
              onClick={() => {
                stop();
                setPhase('study');
                setSelected([]);
              }}
            >
              <RotateCcw size={17} />
              기억 카드 다시 보기
            </button>
          )}
          <RoundActions
            solved={solved}
            ready={selected.length === question.target.length}
            last={last}
            onReset={() => setSelected([])}
            onNext={() => onNext(!mistake)}
            onCheck={() => {
              if (solved || selected.length !== question.target.length) return;
              if (selected.every((id, n) => id === question.target[n])) {
                setSolved(true);
                setFeedback('길 찾기 성공! 단어의 순서를 모두 기억했어요.');
              } else {
                setMistake(true);
                setFeedback('순서가 조금 달라요. 기억 카드를 다시 보거나 위쪽 선택을 고쳐 봐요.');
              }
            }}
          />
        </>
      )}
      <p className="game-feedback" role="status">
        {feedback}
      </p>
    </>
  );
}

export function QuestGame({
  kind,
  level,
  speak,
  stop,
  onFinish,
}: PlayProps & { kind: 'spell' | 'delivery' | 'sequence' }) {
  const [spelling] = useState(() => (kind === 'spell' ? spellingRounds(level) : []));
  const [delivery] = useState(() => (kind === 'delivery' ? deliveryRounds(level) : []));
  const [sequence] = useState(() => (kind === 'sequence' ? sequenceRounds(level) : []));
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [round]);
  const total =
    kind === 'spell' ? spelling.length : kind === 'delivery' ? delivery.length : sequence.length;
  const shared: RoundProps = {
    level,
    speak,
    stop,
    last: round === total - 1,
    onNext: (first) => {
      if (advancing.current) return;
      advancing.current = true;
      stop();
      const count = correct + (first ? 1 : 0);
      if (round === total - 1) onFinish(gameScore(count, total));
      else {
        setCorrect(count);
        setRound((n) => n + 1);
        window.scrollTo({ top: 0 });
      }
    },
  };
  return (
    <section className={`game-board word-quest quest-${kind}`}>
      <GameProgress
        current={round + 1}
        total={total}
        label={kind === 'delivery' ? '배달 미션' : kind === 'spell' ? '조립 미션' : '기억 지도'}
      />
      {kind === 'spell' ? (
        <SpellingRound key={round} {...shared} question={spelling[round]} />
      ) : kind === 'delivery' ? (
        <DeliveryRound key={round} {...shared} question={delivery[round]} />
      ) : (
        <SequenceRound key={round} {...shared} question={sequence[round]} />
      )}
    </section>
  );
}
