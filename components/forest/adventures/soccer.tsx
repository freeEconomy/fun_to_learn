'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import { shuffle } from '@/lib/forest/adventures';
import './soccer.css';
import { soccerChallenges as challenges } from '@/lib/forest/soccer-content';

export function SoccerGame({
  speak,
  stop,
  onFinish,
}: {
  speak: (text: string) => void;
  stop: () => void;
  onFinish: (score: number) => void;
}) {
  const [rounds] = useState(() =>
    shuffle(challenges)
      .slice(0, 5)
      .map((r) => ({ ...r, options: shuffle([r.answer, ...r.others]) })),
  );
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shot, setShot] = useState<'ready' | 'goal' | 'save'>('ready');
  const [missed, setMissed] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [hint, setHint] = useState(false);
  const action = useRef<HTMLButtonElement>(null);
  const pitch = useRef<HTMLDivElement>(null);
  const coach = useRef<HTMLDivElement>(null);
  const current = rounds[round];
  const goals = round + (shot === 'goal' ? 1 : 0);
  useEffect(() => {
    if (shot !== 'ready') action.current?.focus({ preventScroll: true });
  }, [shot]);

  function shoot() {
    if (selected === null || shot !== 'ready') return;
    stop();
    pitch.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    if (current.options[selected] === current.answer) {
      setShot('goal');
      if (!missed) setBonus((n) => n + 10);
    } else {
      setShot('save');
      setMissed(true);
    }
  }
  function advance() {
    stop();
    if (shot === 'save') {
      coach.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      setShot('ready');
      setSelected(null);
      setHint(true);
    } else if (round === rounds.length - 1) {
      onFinish(50 + bonus);
    } else {
      coach.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      setRound((n) => n + 1);
      setSelected(null);
      setShot('ready');
      setMissed(false);
      setHint(false);
    }
  }

  return (
    <section className="soccer-game" aria-label="영어 골 축구 경기">
      <div className="soccer-scoreboard">
        <div>
          <small>FUN TO RUN FC</small>
          <strong>영어 골 챌린지</strong>
        </div>
        <div className="soccer-score" aria-label={`${goals}골, 목표 5골`}>
          <b>{goals}</b>
          <span>/ 5 GOALS</span>
        </div>
        <ol aria-label="골 기록">
          {rounds.map((_, i) => (
            <li
              key={i}
              className={i < goals ? 'scored' : ''}
              aria-label={`${i + 1}번째 골 ${i < goals ? '성공' : '도전 중'}`}
            >
              ●
            </li>
          ))}
        </ol>
      </div>
      <div
        ref={pitch}
        className={`soccer-pitch shot-${shot}`}
        style={{ '--shot-x': `${selected === null ? 0 : (selected - 1) * 210}px` } as CSSProperties}
      >
        <svg
          viewBox="0 0 720 390"
          role="img"
          aria-label={
            shot === 'goal'
              ? '골대 안으로 들어간 공, 골 성공!'
              : shot === 'save'
                ? '골키퍼가 공을 막았어요. 다시 도전해요!'
                : '골대의 세 구역 중 영어 답을 골라 슛을 차 보세요.'
          }
        >
          <defs>
            <linearGradient id="soccer-sky" x2="0" y2="1">
              <stop stopColor="#c6eafb" />
              <stop offset="1" stopColor="#eef8ff" />
            </linearGradient>
            <pattern id="soccer-net" width="22" height="20" patternUnits="userSpaceOnUse">
              <path d="M22 0H0V20" fill="none" stroke="white" strokeOpacity=".42" strokeWidth="2" />
            </pattern>
            <pattern id="soccer-crowd" width="38" height="25" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="10" r="5" fill="#ffd578" />
              <circle cx="28" cy="18" r="5" fill="#a5ddd0" />
            </pattern>
          </defs>
          <path fill="url(#soccer-sky)" d="M0 0H720V390H0z" />
          <path fill="#234e58" d="M0 55Q360 0 720 55V145H0z" />
          <path fill="url(#soccer-crowd)" d="M0 55Q360 0 720 55V130H0z" />
          <path fill="#58a764" d="M0 130H720V390H0z" />
          {[130, 218, 306].map((y) => (
            <path key={y} fill="#65b771" d={`M0 ${y}H720v44H0z`} />
          ))}
          <path
            d="M80 390L167 168H553L640 390M240 390A120 55 0 0 1 480 390"
            fill="none"
            stroke="#e0f5d3"
            strokeWidth="3"
            opacity=".8"
          />
          <path fill="#254e51" fillOpacity=".45" d="M135 90H585V235H135z" />
          <path
            fill="url(#soccer-net)"
            stroke="white"
            strokeWidth="8"
            strokeLinejoin="round"
            d="M135 235V90H585V235"
          />
          {[150, 360, 570].map((x, i) => (
            <g key={x} opacity={selected === i ? 1 : 0.55}>
              <circle cx={x} cy="138" r="24" fill={selected === i ? '#ffe29a' : '#f7ffef'} />
              <text x={x} y="146" textAnchor="middle" fontSize="24" fontWeight="800" fill="#214f40">
                {i + 1}
              </text>
            </g>
          ))}
          <g transform="translate(360 180)">
            <g className="soccer-keeper">
              <circle cy="-27" r="15" fill="#f5c397" />
              <path d="M-16-8H16L23 38H-23z" fill="#ffbb45" />
              <path
                d="M-12 38L-24 69M12 38L24 69M-14 0L-43 15M14 0L43 15"
                stroke="#243e5c"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <circle cx="-46" cy="16" r="8" fill="white" />
              <circle cx="46" cy="16" r="8" fill="white" />
              <text y="22" textAnchor="middle" fill="#243e5c" fontWeight="900" fontSize="19">
                1
              </text>
            </g>
          </g>
          <ellipse cx="360" cy="357" rx="29" ry="7" fill="#255c3d" opacity=".35" />
          <g transform="translate(360 330)">
            <g className="soccer-ball">
              <circle r="24" fill="white" stroke="#d2dfdf" strokeWidth="2" />
              <path
                d="M0-11L11-3L7 10H-7L-11-3zM-22-9L-15-18L-9-21L-11-12zM22-9L15-18L9-21L11-12zM-17 17L-9 21L-7 12zM17 17L9 21L7 12z"
                fill="#233b46"
              />
            </g>
          </g>
        </svg>
        {shot === 'goal' && (
          <div className="soccer-goal-banner" aria-hidden="true">
            GOOOAL! <span>멋진 골!</span>
          </div>
        )}
        {shot !== 'ready' && (
          <div className="soccer-pitch-action">
            <button ref={action} className="soccer-shoot" onClick={advance}>
              {shot === 'save' ? (
                <>
                  <RotateCcw size={18} />
                  다시 슛 준비
                </>
              ) : round === rounds.length - 1 ? (
                '경기 결과 보기'
              ) : (
                <>
                  다음 공격 <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
        <div className="soccer-pitch-caption">
          {shot === 'ready'
            ? '영어를 고르고, 슛!'
            : shot === 'goal'
              ? '멋진 슛! 우리 팀에 한 골!'
              : '골키퍼 선방! 힌트를 보고 다시 차 볼까?'}
        </div>
      </div>
      <div className="soccer-coach" ref={coach}>
        <div>
          <span className="forest-eyebrow">MISSION {round + 1} / 5</span>
          <h2>{current.korean}</h2>
          <p>친구에게 영어로 어떻게 말할까?</p>
        </div>
        <button
          className="adventure-secondary"
          onClick={() => {
            stop();
            speak(current.answer);
          }}
        >
          <Volume2 size={18} />
          영어 듣기
        </button>
      </div>
      <div className="soccer-options" role="group" aria-label="슛할 영어 표현 선택">
        {current.options.map((option, i) => (
          <button
            key={option}
            disabled={shot !== 'ready'}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>{i + 1}</span>
            {option}
          </button>
        ))}
      </div>
      <div className="soccer-feedback" role="status" aria-live="polite">
        {shot === 'goal' ? (
          <>
            <strong>골! {current.answer}</strong>
            <span>
              {current.korean} ·{' '}
              {missed ? '끝까지 도전해서 성공했어요!' : '첫 슛 성공! 보너스 +10점'}
            </span>
          </>
        ) : shot === 'save' ? (
          <>
            <strong>괜찮아, 한 번 더!</strong>
            <span>{current.tip} 점수와 포인트는 줄어들지 않아요.</span>
          </>
        ) : (
          <span>시간제한 없이 천천히! 정답 표현을 골라 골을 넣어 보세요.</span>
        )}
      </div>
      {hint && (
        <p className="soccer-hint">
          {current.tip} <strong>{current.answer}</strong> = {current.korean}
        </p>
      )}
      <div className="soccer-controls">
        <button
          className="adventure-secondary"
          onClick={() => setHint((v) => !v)}
          aria-expanded={hint}
        >
          <Lightbulb size={18} />
          {hint ? '힌트 숨기기' : '힌트 보기'}
        </button>
        {shot === 'ready' && (
          <button className="soccer-shoot" onClick={shoot} disabled={selected === null}>
            슛! 골 넣기 <ArrowRight size={20} />
          </button>
        )}
      </div>
      <p className="soccer-rule">
        5골을 넣으면 경기 완료 · 완주 50점 + 첫 슛 성공마다 10점 · 하루 첫 경기 완료 +10 P
      </p>
    </section>
  );
}
