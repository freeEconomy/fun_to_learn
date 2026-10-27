'use client';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { words } from '@/lib/forest/content';
import type { DiscoveryProgress } from '@/lib/forest/discovery';

export function DiscoveryDashboard({
  progress,
  plan,
  onStart,
}: {
  progress: DiscoveryProgress;
  plan: string[];
  onStart: () => void;
}) {
  const badges = [
    { days: 1, icon: '🌱', name: '첫 발견' },
    { days: 3, icon: '🔎', name: '호기심 탐정' },
    { days: 7, icon: '🧭', name: '영어 탐험가' },
    { days: 14, icon: '🏕️', name: '모험 친구' },
  ];
  return (
    <section className="discovery-dashboard" aria-label="나의 짧은 영어 탐험">
      <div className="discovery-invitation">
        <div>
          <span className="forest-eyebrow">YOUR NEXT LITTLE ADVENTURE</span>
          <h2>{progress.session ? '멈췄던 모험, 이어서 해 볼까?' : '딱 세 단어, 작은 대모험!'}</h2>
          <p>듣고 찾고, 내 목소리로 말해 봐. 헷갈렸던 단어는 먼저 만나.</p>
          <div className="discovery-preview">
            {(progress.session?.ids || plan).map((id) => {
              const w = words.find((w) => w.id === id)!;
              return (
                <span key={id}>
                  <img src={w.photo} alt={w.korean} width={44} height={44} loading="lazy" />
                  <span lang="en">{w.name}</span>
                </span>
              );
            })}
          </div>
        </div>
        <button className="forest-button" onClick={onStart}>
          {progress.session ? (
            <>
              <RotateCcw size={17} />
              이어서 탐험하기 · {progress.session.results.length + 1}/3
            </>
          ) : (
            <>
              3단어 탐험하기
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
      <div className="discovery-badge-heading">
        <h3>나의 탐험 배지</h3>
        <span>{progress.days.length}일의 발견 · 쉬었다 와도 괜찮아</span>
      </div>
      <ul className="discovery-badges" aria-label="탐험 배지 모음">
        {badges.map((b) => (
          <li
            key={b.days}
            className={progress.days.length >= b.days ? 'unlocked' : ''}
            aria-label={`${b.name} 배지 ${progress.days.length >= b.days ? '획득' : `아직 준비 중, ${b.days}일 탐험하면 획득`}`}
          >
            <span aria-hidden="true">{b.icon}</span>
            <strong>{b.name}</strong>
            <small>{progress.days.length >= b.days ? '모았어요!' : `${b.days}일의 탐험`}</small>
          </li>
        ))}
      </ul>
      <p className="discovery-note">
        하루에 3단어 탐험을 마치면 도장 하나. 연속으로 접속하지 않아도 모을 수 있어요.
      </p>
    </section>
  );
}
