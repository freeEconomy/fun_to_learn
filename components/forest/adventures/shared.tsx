'use client';
import { ArrowLeft, ArrowRight, Star, Trophy, Volume2 } from 'lucide-react';
import { CharacterMark } from '../character-mark';
import type { TalePage } from '@/lib/forest/adventures';

export function StoryScene({
  scene,
  taleId,
  pageIndex,
  compact = false,
}: {
  scene: TalePage;
  taleId: string;
  pageIndex: number;
  compact?: boolean;
}) {
  const source = `/story-scenes/${taleId}/${String(pageIndex + 1).padStart(2, '0')}.webp`;
  return (
    <figure
      className={`tale-scene${compact ? ' compact' : ''}`}
      role="img"
      aria-label={scene.caption}
    >
      <img
        key={source}
        src={source}
        alt=""
        width={640}
        height={480}
        loading={compact ? 'lazy' : 'eager'}
        decoding="async"
      />
    </figure>
  );
}
export function AdventureHeading({
  eyebrow,
  title,
  description,
  onBack,
  backLabel = '메뉴로',
}: {
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="adventure-heading">
      {onBack && (
        <button className="adventure-back" onClick={onBack}>
          <ArrowLeft size={18} />
          {backLabel}
        </button>
      )}
      <span className="forest-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function AdventureComplete({
  title,
  score,
  earned,
  onAgain,
  onBack,
  story = false,
  symbol,
}: {
  title: string;
  score: number;
  earned: number;
  onAgain: () => void;
  onBack: () => void;
  story?: boolean;
  symbol?: string;
}) {
  return (
    <section className="adventure-complete" aria-label="모험 완료">
      {!story && (
        <div className="reward-sparkles" aria-hidden="true">
          {Array.from({ length: 10 }, (_, n) => (
            <i key={n} />
          ))}
        </div>
      )}
      {!story && symbol && (
        <div className="reward-partner">
          <CharacterMark symbol={symbol} />
        </div>
      )}
      <div className="adventure-trophy" aria-hidden="true">
        <Trophy size={52} />
      </div>
      <span className="forest-eyebrow">YOU DID IT!</span>
      <h2>{title}</h2>
      <p>
        {story
          ? '한 권의 이야기를 끝까지 읽었어요. 멋진 마음을 기억해요!'
          : '차근차근 끝까지 해냈어요. 정말 멋져요!'}
      </p>
      {!story && (
        <>
          <strong className="adventure-score">
            {score}
            <small>점</small>
          </strong>
          <div
            className="run-score-stars"
            role="img"
            aria-label={`별 ${Math.max(1, Math.ceil(score / 20))}개`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={i < Math.max(1, Math.ceil(score / 20)) ? 'earned' : ''} />
            ))}
          </div>
        </>
      )}
      <div className="adventure-prize">
        {earned ? `오늘의 첫 완료 선물 +${earned} P` : '오늘의 완료 선물은 이미 받았어요'}
        <small>같은 동화·게임은 하루에 한 번 10포인트 · 다시 해도 포인트는 줄지 않아요</small>
      </div>
      <div className="forest-actions">
        <button className="forest-button secondary" onClick={onAgain}>
          {story ? '처음부터 다시 읽기' : '한 번 더 놀기'}
        </button>
        <button className="forest-button" onClick={onBack}>
          {story ? '다른 동화 보기' : '다른 게임 보기'}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
export function SpeakButton({
  text,
  speak,
  label = '듣기',
}: {
  text: string;
  speak: (text: string) => void;
  label?: string;
}) {
  return (
    <button className="forest-button secondary" onClick={() => speak(text)}>
      <Volume2 size={18} />
      {label}
    </button>
  );
}
