import type { PieceType } from '@/lib/forest/chess-game';

/** Original SVG silhouettes, shared by the board, the guide and the menu art. */
export function ChessPiece({ type, white = true }: { type: PieceType; white?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`chess-piece ${white ? 'ivory' : 'ink'}`}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill={white ? '#fff9e9' : '#30433f'}
        stroke={white ? '#61736b' : '#182e29'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {type === 'p' && (
          <>
            <circle cx="32" cy="17" r="9" />
            <path d="M25 27h14c-4 12-2 16 5 21H20c7-5 9-9 5-21Z" />
          </>
        )}
        {type === 'r' && (
          <>
            <path d="M18 9h8v8h12V9h8v20l-6 5 3 14H21l3-14-6-5Z" />
            <path d="M19 26h26M24 34h16" />
          </>
        )}
        {type === 'n' && (
          <>
            <path d="m23 12 6-6 6 9c12 4 15 14 13 33H19c9-8 16-16 16-23l-9 9-13-4 5-12Z" />
            <path d="m25 12 10 3M17 27l7 2" />
            <circle cx="31" cy="21" r="1.8" fill={white ? '#30433f' : '#fff9e9'} stroke="none" />
          </>
        )}
        {type === 'b' && (
          <>
            <path d="M32 6c-12 9-17 17-11 23l6 5-6 14h22l-6-14 6-5c6-6 1-14-11-23Z" />
            <path d="m34 15-8 10M25 34h14" />
          </>
        )}
        {type === 'q' && (
          <>
            <path d="m16 18 9 10 7-17 7 17 9-10-7 30H23Z" />
            <circle cx="15" cy="15" r="4" />
            <circle cx="32" cy="8" r="4" />
            <circle cx="49" cy="15" r="4" />
            <path d="M24 36h16" />
          </>
        )}
        {type === 'k' && (
          <>
            <path d="M32 5v14M26 11h12" />
            <path d="M22 21c-9 4-7 15 2 17l-3 10h22l-3-10c9-2 11-13 2-17l-10 5Z" />
            <path d="M24 38h16" />
          </>
        )}
        <path d="M20 48h24l5 8H15Z" />
        <path d="M17 56h30v4H17Z" />
      </g>
    </svg>
  );
}
export function BoardCoach() {
  return (
    <svg className="board-coach-face" viewBox="0 0 80 80" aria-hidden="true">
      <path d="m12 28 4-21 20 15h8L64 7l4 21c15 26-2 45-28 45S-3 54 12 28Z" fill="#e6a15e" />
      <path d="m17 27 2-11 11 9m20 0 11-9 2 11" fill="#724f3c" />
      <path d="M9 42c3 24 21 25 31 25s28-1 31-25L46 53H34Z" fill="#fff3d9" />
      <circle cx="26" cy="38" r="4" fill="#3e4a40" />
      <circle cx="54" cy="38" r="4" fill="#3e4a40" />
      <path d="m34 49 6 6 6-6Z" fill="#3e4a40" />
      <path
        d="M34 59q6 6 12 0"
        fill="none"
        stroke="#3e4a40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="47" r="5" fill="#df8062" opacity=".6" />
      <circle cx="62" cy="47" r="5" fill="#df8062" opacity=".6" />
    </svg>
  );
}
