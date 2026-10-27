'use client';

import { ArrowRight, BookOpen, Check, Compass, Flag, Gamepad2, Sparkles, Star } from 'lucide-react';
import { DiscoveryDashboard } from './discovery-dashboard';
import { type DiscoveryProgress } from '@/lib/forest/discovery';
import type { ActivityRecord } from '@/lib/forest/adventures';

const day = (date: string) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

export function AdventureHome({
  name,
  symbol,
  points,
  learned,
  wordCount,
  storyCount,
  gameCount,
  records,
  activities,
  onWord,
  onStories,
  onGames,
  onCard,
  discovery,
  plan,
  onStart,
}: {
  name: string;
  symbol: string;
  points: number;
  learned: number;
  wordCount: number;
  storyCount: number;
  gameCount: number;
  records: { date: string }[];
  activities: ActivityRecord[];
  onWord: () => void;
  onStories: () => void;
  onGames: () => void;
  onCard: () => void;
  discovery: DiscoveryProgress;
  plan: string[];
  onStart: () => void;
}) {
  const today = day(new Date().toISOString());
  const done = [
    discovery.days.includes(today) || records.some((r) => day(r.date) === today),
    activities.some((r) => r.activityId.startsWith('story:') && day(r.date) === today),
    activities.some((r) => r.activityId.startsWith('game:') && day(r.date) === today),
  ];
  const missions = [
    {
      title: '사진 단어 숲',
      label: '단어 하나 배우기',
      description: '사진으로 만나고, 영어로 말해요',
      tag: `사진 단어 ${wordCount}개`,
      action: onWord,
      icon: Compass,
      className: 'words',
      image: '/english-photos/dog.jpg',
      alt: '사진 단어 숲에서 만날 강아지',
    },
    {
      title: '이야기 성',
      label: '동화 한 편 읽기',
      description: '책 속 주인공과 새로운 세상으로!',
      tag: `명작 동화 ${storyCount}편`,
      action: onStories,
      icon: BookOpen,
      className: 'books',
      image: '/book-covers/hare-and-tortoise.webp',
      alt: '이야기 성의 토끼와 거북이 동화책',
    },
    {
      title: '챔피언 경기장',
      label: '게임 한 판 도전',
      description: '영어로 슛! 신나게 놀면서 배워요',
      tag: `영어 게임 ${gameCount}종`,
      action: onGames,
      icon: Gamepad2,
      className: 'games',
      image: null,
      alt: '',
    },
  ];
  return (
    <>
      <section className="explorer-hero" aria-label="영어 모험 출발">
        <img
          className="explorer-hero-art"
          src="/adventure/home-island.webp"
          alt="초록 용과 주황 여우 탐험 친구가 기다리는 영어 모험 섬"
          width={1536}
          height={1024}
          fetchPriority="high"
        />
        <div className="explorer-hero-copy">
          <span className="explorer-kicker">
            <Compass size={15} /> WELCOME TO YOUR ADVENTURE
          </span>
          <h1>
            {name}, 오늘은
            <br />
            어떤 영어 <span>모험을 떠날까?</span>
          </h1>
          <p>
            작은 용기 하나면 준비 끝!
            <br />
            친구들과 듣고, 말하고, 신나게 놀아요.
          </p>
          <button className="explorer-start" onClick={onStart}>
            오늘의 모험 시작 <ArrowRight size={20} />
          </button>
          <span className="explorer-hero-note">
            <Sparkles size={14} /> 하루에 하나씩, 나만의 영어 발견!
          </span>
        </div>
        <div className="explorer-location">
          <span /> ENGLISH ISLAND <small>우리의 모험이 시작되는 곳</small>
        </div>
      </section>
      <section className="run-progress explorer-passport" aria-label="나의 학습 현황">
        <button className="run-companion" onClick={onCard} aria-label="학습 친구 바꾸기">
          <span className="run-companion-face" aria-hidden="true">
            {symbol}
          </span>
          <span>
            나의 탐험 친구
            <small>
              친구와 학습카드 꾸미기 <ArrowRight size={12} />
            </small>
          </span>
        </button>
        <div>
          <strong>
            <Star size={18} />
            {points} P
          </strong>
          <span>차곡차곡 모은 포인트</span>
        </div>
        <div>
          <strong>
            {learned}
            <small> / {wordCount}</small>
          </strong>
          <span>발견한 영어 단어</span>
        </div>
      </section>
      <DiscoveryDashboard progress={discovery} plan={plan} onStart={onStart} />
      <section className="explorer-missions" aria-labelledby="explorer-missions-title">
        <div className="explorer-section-heading">
          <div>
            <span className="explorer-kicker">
              <Flag size={14} /> TODAY’S QUEST
            </span>
            <h2 id="explorer-missions-title">오늘은 어디로 떠날까?</h2>
            <p>마음에 드는 모험을 골라 봐!</p>
          </div>
          <span
            className="explorer-daily"
            aria-label={`오늘 완료한 모험 ${done.filter(Boolean).length}개, 전체 3개`}
          >
            <Star size={16} />
            오늘의 탐험 <b>{done.filter(Boolean).length} / 3</b>
          </span>
        </div>
        <div className="explorer-mission-grid">
          {missions.map((mission, i) => (
            <button
              key={mission.className}
              className={`explorer-mission mission-${mission.className}`}
              onClick={mission.action}
              aria-label={`${mission.title} 모험 시작`}
            >
              <div className="explorer-mission-art">
                <span className="explorer-stop">
                  0{i + 1}{' '}
                  <span>
                    {done[i] ? (
                      <>
                        <Check size={12} /> 오늘 완료
                      </>
                    ) : (
                      'EXPLORE'
                    )}
                  </span>
                </span>
                {mission.image ? (
                  <img
                    src={mission.image}
                    alt={mission.alt}
                    width={400}
                    height={240}
                    loading="lazy"
                  />
                ) : (
                  <div className="explorer-stadium" aria-hidden="true">
                    <div className="explorer-goal" />
                    <span>⚽</span>
                    <i>GOAL!</i>
                  </div>
                )}
                <span className="explorer-mission-icon">
                  <mission.icon size={23} />
                </span>
              </div>
              <div className="explorer-mission-copy">
                <small>{mission.tag}</small>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                <span className="explorer-mission-action">
                  {mission.label}
                  <ArrowRight size={18} />
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="explorer-footnote">
          <Sparkles size={14} /> 오늘의 탐험 표시는 3단어 탐험 또는 단어 퀴즈·동화·게임을 완료하면
          채워져요.
        </p>
      </section>
    </>
  );
}
