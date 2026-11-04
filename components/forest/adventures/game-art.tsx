'use client';
import { useId } from 'react';
import type { GameId } from '@/lib/forest/adventures';

const palettes = {
  soccer: ['#c7eadb', '#79b798'],
  memory: ['#dbe4fa', '#8d9ed0'],
  listen: ['#d6ecf5', '#75b7c9'],
  train: ['#ffe7cc', '#e2a16c'],
  spell: ['#e9def5', '#ac8bc9'],
  delivery: ['#ffedca', '#deba6e'],
  sequence: ['#d3eee8', '#72b3a2'],
};
export function GameArt({ game, className = '' }: { game: GameId; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const [light, dark] = palettes[game];
  return (
    <svg
      className={`game-art ${className}`}
      viewBox="0 0 300 180"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}bg`} x2="1" y2="1">
          <stop stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <pattern id={`${uid}net`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke="#fff" opacity=".65" />
        </pattern>
      </defs>
      <rect width="300" height="180" rx="20" fill={`url(#${uid}bg)`} />
      <circle cx="250" cy="20" r="62" fill="#fff" opacity=".2" />
      <circle cx="37" cy="163" r="64" fill="#fff" opacity=".15" />
      <path
        d="M24 36h9m-4-4v9M267 128h12m-6-6v12M245 58h7m-4-4v8"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".8"
      />
      <ellipse cx="150" cy="151" rx="95" ry="10" fill="#173748" opacity=".12" />
      {game === 'soccer' && (
        <>
          <path d="M45 132L77 62H223L255 132Z" fill="#5c9e76" />
          <path d="M55 136L80 78H220L245 136" fill="none" stroke="#effee8" strokeWidth="2" />
          <path
            d="M83 107V42H217V107"
            fill={`url(#${uid}net)`}
            stroke="#fffdf3"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <path
            d="M103 109Q140 91 170 116"
            fill="none"
            stroke="#ffe38e"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <g transform="translate(178 119)">
            <circle r="25" fill="#fff" stroke="#dde4df" strokeWidth="2" />
            <path
              d="M0-12L12-4 8 10H-8L-12-4Z M-21-10L-12-21-7-17-12-9Z M22-9L13-20 8-16 12-8Z M-16 18L-7 23-5 14Z"
              fill="#244351"
            />
          </g>
          <path d="M227 29l3 9 10 1-8 6 3 10-8-6-8 6 3-10-8-6 10-1Z" fill="#ffda79" />
        </>
      )}
      {game === 'memory' && (
        <>
          <g transform="translate(75 35) rotate(-12 45 56)">
            <rect y="5" width="83" height="108" rx="13" fill="#65779c" />
            <rect width="83" height="108" rx="13" fill="#fffdf1" />
            <rect x="7" y="7" width="69" height="94" rx="9" fill="#697db5" />
            <path d="M41 30l8 16 18 3-13 13 3 18-16-8-16 8 3-18-13-13 18-3Z" fill="#f9da88" />
          </g>
          <g transform="translate(153 35) rotate(10 42 56)">
            <rect y="5" width="83" height="108" rx="13" fill="#8491a9" />
            <rect width="83" height="108" rx="13" fill="#fffdf1" />
            <rect x="8" y="8" width="67" height="60" rx="7" fill="#e0efdb" />
            <path d="M24 37l-4-15 15 6h12l15-6-4 15v16q-17 20-34 0Z" fill="#dcb47d" />
            <circle cx="33" cy="43" r="3" fill="#4e4b42" />
            <circle cx="51" cy="43" r="3" fill="#4e4b42" />
            <text x="42" y="90" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4c6261">
              CAT
            </text>
          </g>
        </>
      )}
      {game === 'listen' && (
        <>
          {[64, 46, 28].map((r) => (
            <circle
              key={r}
              cx="145"
              cy="88"
              r={r}
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              opacity=".45"
            />
          ))}
          <path d="M103 88V67a42 42 0 0 1 84 0v21" fill="none" stroke="#315f75" strokeWidth="13" />
          <rect x="92" y="71" width="23" height="45" rx="10" fill="#f9d078" />
          <rect x="175" y="71" width="23" height="45" rx="10" fill="#f9d078" />
          <path
            d="M129 80v18m10-30v42m11-31v20m11-28v36"
            stroke="#fffdf1"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="220" cy="124" r="24" fill="#fffdf2" />
          <path
            d="M212 121l7 7 13-15"
            fill="none"
            stroke="#418e79"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {game === 'train' && (
        <>
          <path d="M38 145H267M44 155H261" stroke="#a57854" strokeWidth="3" />
          {[65, 90, 115, 140, 165, 190, 215, 240].map((x) => (
            <path key={x} d={`M${x} 140v19`} stroke="#a57854" strokeWidth="3" />
          ))}
          <g fill="#fff7e7" opacity=".8">
            <circle cx="77" cy="39" r="17" />
            <circle cx="100" cy="28" r="12" />
            <circle cx="119" cy="23" r="8" />
          </g>
          <path d="M53 74H110V132H47V95h6Z" fill="#345e68" />
          <rect x="65" y="48" width="30" height="15" rx="3" fill="#3e656e" />
          <path d="M64 61H96V83H64Z" fill="#d18d52" />
          <rect x="103" y="88" width="65" height="43" rx="10" fill="#edbc6f" />
          <rect x="121" y="55" width="35" height="38" rx="7" fill="#51877f" />
          <rect x="128" y="62" width="21" height="20" rx="3" fill="#d7eee2" />
          <rect x="180" y="83" width="68" height="48" rx="8" fill="#f9edcf" />
          <text x="214" y="114" textAnchor="middle" fontSize="18" fontWeight="800" fill="#456b62">
            GO!
          </text>
          {[65, 111, 150, 193, 236].map((x) => (
            <g key={x}>
              <circle cx={x} cy="133" r="12" fill="#315766" />
              <circle cx={x} cy="133" r="5" fill="#d5e4dc" />
            </g>
          ))}
        </>
      )}
      {game === 'spell' && (
        <>
          <path d="M72 128H232V144H72Z" fill="#89709f" />
          <g transform="translate(64 42) rotate(-8 35 42)">
            <rect y="6" width="66" height="80" rx="12" fill="#a785b3" />
            <rect width="66" height="80" rx="12" fill="#fffaf1" />
            <text x="33" y="57" textAnchor="middle" fontSize="43" fontWeight="800" fill="#78608e">
              A
            </text>
          </g>
          <g transform="translate(131 49) rotate(7 35 42)">
            <rect y="6" width="66" height="80" rx="12" fill="#a785b3" />
            <rect width="66" height="80" rx="12" fill="#efd494" />
            <text x="33" y="57" textAnchor="middle" fontSize="43" fontWeight="800" fill="#836836">
              B
            </text>
          </g>
          <path d="M216 35l7 17 18 3-13 12 3 18-15-9-16 9 3-18-13-12 18-3Z" fill="#fffdf3" />
          <path d="M202 102l20 20-17 17-20-20Z" fill="#8bb9a5" />
        </>
      )}
      {game === 'delivery' && (
        <>
          <path d="M44 133H255" stroke="#fff8e5" strokeWidth="4" strokeDasharray="15 10" />
          <path
            d="M47 76L150 42 253 76"
            fill="none"
            stroke="#f8f2dc"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="65" y="69" width="93" height="61" rx="8" fill="#548d88" />
          <rect x="160" y="88" width="62" height="42" rx="8" fill="#e99d5a" />
          <path d="M176 74H204L222 96H170V80Z" fill="#e99d5a" />
          <path d="M182 80H201L211 94H182Z" fill="#e0f0e5" />
          <rect x="86" y="51" width="49" height="46" rx="4" fill="#f2d192" />
          <path d="M105 51H117V72L111 68 105 72Z" fill="#cb9d59" />
          {[90, 191].map((x) => (
            <g key={x}>
              <circle cx={x} cy="133" r="15" fill="#345360" />
              <circle cx={x} cy="133" r="7" fill="#d6e7dd" />
            </g>
          ))}
          <circle cx="241" cy="49" r="19" fill="#fff9e6" />
          <path
            d="M233 48l6 6 11-13"
            stroke="#608d6e"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {game === 'sequence' && (
        <>
          <path d="M71 41L119 53 174 35 228 48V142L174 129 119 147 71 134Z" fill="#fff8df" />
          <path d="M119 53V147M174 35V129" stroke="#dddbb5" strokeWidth="2" />
          <path
            d="M99 116Q144 136 146 92T199 65"
            fill="none"
            stroke="#b4c8a0"
            strokeWidth="4"
            strokeDasharray="7 6"
          />
          <circle cx="98" cy="115" r="11" fill="#e6a65d" />
          <circle cx="146" cy="93" r="11" fill="#7d9bc4" />
          <circle cx="199" cy="65" r="11" fill="#6caa8e" />
          <g transform="translate(220 129)">
            <circle r="30" fill="#365f60" />
            <circle r="23" fill="#f4ebce" />
            <path d="M-6 7L7-17 8 7-7 17Z" fill="#db8c66" />
            <path d="M-6 7L7-17 0 0Z" fill="#7eada3" />
            <circle r="3" fill="#385c5a" />
          </g>
        </>
      )}
    </svg>
  );
}
