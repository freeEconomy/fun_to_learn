import { characterFor, legacyLabels, legacySymbols } from '@/lib/forest/characters';
import './character-mark.css';

export function CharacterMark({ symbol, className = '' }: { symbol: string; className?: string }) {
  const character = characterFor(symbol);
  return character ? (
    <img
      className={`character-mark ${className}`}
      src={`/characters/${character.id}.png`}
      alt={`${character.name} 표식`}
      width={240}
      height={240}
    />
  ) : (
    <span
      className={`legacy-character ${className}`}
      role="img"
      aria-label={legacyLabels[legacySymbols.indexOf(symbol)] || '학습 친구'}
    >
      {symbol}
    </span>
  );
}
