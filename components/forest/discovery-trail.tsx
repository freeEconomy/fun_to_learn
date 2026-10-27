'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lightbulb, Sparkles, Volume2 } from 'lucide-react';
import { words } from '@/lib/forest/content';
import { shuffle } from '@/lib/forest/adventures';
import { type DiscoveryResult, type DiscoverySession } from '@/lib/forest/discovery';
import { Photo } from './photo';

export function DiscoveryTrail({
  session,
  speak,
  stop,
  onAdvance,
  onHome,
  onAgain,
  onWord,
  days,
}: {
  session: DiscoverySession | null;
  speak: (text: string) => void;
  stop: () => void;
  onAdvance: (id: string, first: boolean) => void;
  onHome: () => void;
  onAgain: () => void;
  onWord: (id: string) => void;
  days: number;
}) {
  const [finished, setFinished] = useState<DiscoveryResult[] | null>(null);
  const [selected, setSelected] = useState('');
  const [missed, setMissed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [said, setSaid] = useState(false);
  const next = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const target = words.find((w) => w.id === session?.ids[session.results.length]);
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    if (!target) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setOptions(
      shuffle([
        target.id,
        ...shuffle(words.filter((w) => w.id !== target.id))
          .slice(0, 2)
          .map((w) => w.id),
      ]),
    );
    setSelected('');
    setMissed(false);
    setRevealed(false);
    setSaid(false);
  }, [target?.id]);
  const correct = selected === target?.id;
  useEffect(() => {
    if (correct) {
      next.current?.focus({ preventScroll: true });
      feedback.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [correct]);
  if (finished)
    return (
      <section className="discovery-finish" aria-label="3단어 탐험 완료">
        <span className="discovery-medal" aria-hidden="true">
          🏅
        </span>
        <span className="forest-eyebrow">LITTLE STEPS, BIG ADVENTURES</span>
        <h1>세 단어를 끝까지 만났어!</h1>
        <p>틀려도 다시 해낸 네가 멋져. 오늘의 탐험 도장을 모았어!</p>
        <div className="discovery-results">
          {finished.map((r) => {
            const w = words.find((w) => w.id === r.id)!;
            return (
              <button key={r.id} onClick={() => onWord(r.id)}>
                <Photo photoId={w.photoId} alt={w.korean} />
                <strong lang="en">{w.name}</strong>
                <small>{r.first ? '첫 도전에 발견!' : '다시 도전해서 발견!'}</small>
              </button>
            );
          })}
        </div>
        <p className="discovery-note">
          지금까지 {days}일 함께 탐험했어요. 같은 날 다시 해도 도장은 하나예요.
          <br />
          헷갈린 단어는 다음 탐험에서 다시 만나요. 이 탐험은 도장을 모아요. 포인트는 단어 퀴즈와
          게임에서 받을 수 있어요.
        </p>
        <div className="forest-actions">
          <button
            className="forest-button secondary"
            onClick={() => {
              setFinished(null);
              onAgain();
            }}
          >
            한 번 더 탐험
          </button>
          <button ref={next} className="forest-button" onClick={onHome}>
            내 배지 보러 가기 <ArrowRight size={18} />
          </button>
        </div>
      </section>
    );
  if (!session || !target) return null;
  const index = session.results.length;
  return (
    <section className="discovery-trail" aria-label="3단어 소리 탐험">
      <button className="adventure-back" onClick={onHome}>
        <ArrowLeft size={17} />
        잠깐 쉬기 · 이어 할 수 있어요
      </button>
      <div className="discovery-heading">
        <div>
          <span className="forest-eyebrow">LISTEN · FIND · SAY</span>
          <h1>귀 쫑긋! 어떤 사진일까?</h1>
          <p>소리를 듣고 사진을 골라 봐. 천천히 해도 괜찮아.</p>
        </div>
        <span className="forest-pill">{index + 1} / 3 단어</span>
      </div>
      <div
        className="discovery-steps"
        role="progressbar"
        aria-label="3단어 탐험 진행"
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={3}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < index ? 'done' : i === index ? 'current' : ''}>
            {i < index ? <Check size={17} /> : i + 1}
          </span>
        ))}
      </div>
      <div className="discovery-listen">
        <button
          className="forest-button"
          onClick={() => {
            stop();
            speak(target.name);
          }}
        >
          <Volume2 size={24} />
          영어 소리 듣기
        </button>
        <button
          className="forest-button secondary"
          aria-expanded={revealed}
          onClick={() => setRevealed((v) => !v)}
        >
          <Lightbulb size={18} />
          {revealed ? '단어 힌트 숨기기' : '소리 없이도 할 수 있어요'}
        </button>
        {revealed && (
          <p className="discovery-word-hint">
            <strong lang="en">{target.name}</strong> · {target.korean}
          </p>
        )}
      </div>
      <div className="discovery-options" role="group" aria-label="영어 소리에 맞는 사진 선택">
        {options.map((id) => {
          const w = words.find((w) => w.id === id)!;
          return (
            <button
              key={id}
              aria-label={`${w.korean} 사진 선택`}
              aria-pressed={selected === id}
              disabled={correct}
              className={selected === id ? (correct ? 'matched' : 'retry') : ''}
              onClick={() => {
                stop();
                setSelected(id);
                if (id !== target.id) setMissed(true);
              }}
            >
              <Photo photoId={w.photoId} alt={w.korean} />
              <span>
                {w.korean}
                {selected === id && correct && <Check size={18} />}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={`discovery-feedback${correct ? ' success' : ''}`}
        ref={feedback}
        role="status"
        aria-live="polite"
      >
        {correct ? (
          <>
            <strong>
              찾았다! <span lang="en">{target.name}</span> · {target.korean}
            </strong>
            <span>처음엔 헷갈려도, 다시 찾으면 성공!</span>
          </>
        ) : selected ? (
          '괜찮아! 소리를 한 번 더 듣거나 단어 힌트를 보고 다시 골라 봐.'
        ) : (
          '사진 하나를 골라 봐. 시간제한은 없어!'
        )}
      </div>
      {correct && (
        <div className="discovery-say">
          <div>
            <Sparkles size={20} />
            <strong>이번엔 내 목소리로!</strong>
          </div>
          <p lang="en">{target.sentences[0]}</p>
          <span>{target.translations[0]}</span>
          <div className="forest-actions">
            <button className="forest-button secondary" onClick={() => speak(target.sentences[0])}>
              <Volume2 size={18} />
              따라 말할 문장 듣기
            </button>
            <button
              className="forest-button secondary"
              aria-pressed={said}
              onClick={() => setSaid((v) => !v)}
            >
              {said ? '멋져! 직접 말해 봤어 ✓' : '나도 말해 봤어'}
            </button>
          </div>
          <small>말하기 표시는 내가 눌러요. 녹음하거나 발음을 자동 채점하지 않아요.</small>
        </div>
      )}
      <div className="discovery-next">
        <span>듣기 → 사진 찾기 → 따라 말하기</span>
        <button
          ref={next}
          className="forest-button"
          disabled={!correct}
          onClick={() => {
            stop();
            if (index === 2) {
              setFinished([...session.results, { id: target.id, first: !missed }]);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
            onAdvance(target.id, !missed);
          }}
        >
          {index === 2 ? '탐험 마치기' : '다음 단어 만나기'}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
