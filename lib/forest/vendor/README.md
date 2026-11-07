# chess.js

`chess.js` is an unmodified copy of Jeff Hlywa's BSD-2-Clause chess rules engine, version 0.13.4.

- Source: https://github.com/jhlywa/chess.js/blob/v0.13.4/chess.js
- Git blob: `97e2183c3ea78dd900a374a57769c53a760ec328`
- License: copyright and BSD-2-Clause terms are retained at the top of the source and distributed in `/board-games-NOTICE.txt`.

The app uses the engine locally for legal moves, check, castling, en passant, promotion and draws. It sends no board or learning data to an external chess service. The adjacent declaration exposes the subset of the engine used by the app. Bot move selection is implemented separately in `../chess-game.ts`.
