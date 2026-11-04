import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { dailyPhotoWords } from '@/lib/forest/daily-learning';
import type { Word } from '@/lib/forest/content';
import './daily-photos.css';

export function DailyPhotos({ day, onWord }: { day: string; onWord: (word: Word) => void }) {
  const pack = dailyPhotoWords(day);
  return (
    <section className="daily-photos" aria-label="오늘의 사진 단어" data-day={day}>
      <div className="daily-photos-heading">
        <div>
          <span>
            <Sparkles size={14} /> A NEW LITTLE DISCOVERY
          </span>
          <h2>오늘의 사진 단어</h2>
          <p>오늘은 어떤 세상을 만날까? 사진을 눌러 영어로 말해 봐!</p>
        </div>
        <small>
          <CalendarDays size={15} />
          {Number(day.slice(5, 7))}월 {Number(day.slice(8, 10))}일
        </small>
      </div>
      <div className="daily-photo-grid">
        {pack.map((word, n) => (
          <button
            key={word.id}
            data-word={word.id}
            onClick={() => onWord(word)}
            aria-label={`오늘의 사진 단어: ${word.name}`}
          >
            <div>
              <img
                src={word.photo}
                alt={`${word.korean} 사진`}
                width={320}
                height={230}
                loading="lazy"
              />
              <span>0{n + 1}</span>
            </div>
            <strong lang="en">{word.name}</strong>
            <small>
              {word.korean} · {word.category}
            </small>
            <span className="daily-photo-action">
              만나러 가기 <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
      <p className="daily-photo-note">
        한국 시간으로 매일 새로운 조합을 추천해요. 아래에서 전체 단어도 만날 수 있어요.
      </p>
    </section>
  );
}
