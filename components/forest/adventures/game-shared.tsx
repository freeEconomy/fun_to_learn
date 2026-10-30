import type { GameLevel } from '@/lib/forest/game-challenges';

export type PlayProps = {
  speak: (text: string) => void;
  stop: () => void;
  onFinish: (score: number) => void;
  level: GameLevel;
};

export function GameProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="game-progress">
      <span>{label}</span>
      <strong>
        {current} / {total}
      </strong>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <i style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}
