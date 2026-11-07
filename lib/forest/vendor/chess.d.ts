export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Promotion = 'q' | 'r' | 'b' | 'n';
export type Piece = { type: PieceType; color: Color };
export type Move = Piece & {
  from: string;
  to: string;
  san: string;
  flags: string;
  captured?: PieceType;
  promotion?: Promotion;
};
export interface ChessInstance {
  load(fen: string): boolean;
  fen(): string;
  turn(): Color;
  board(): ((Piece & { square: string }) | null)[][];
  get(square: string): Piece | null;
  moves(options: { verbose: true; square?: string }): Move[];
  move(move: string | { from: string; to: string; promotion?: Promotion }): Move | null;
  undo(): Move | null;
  in_check(): boolean;
  in_checkmate(): boolean;
  in_stalemate(): boolean;
  insufficient_material(): boolean;
  in_threefold_repetition(): boolean;
  in_draw(): boolean;
  game_over(): boolean;
  history(): string[];
  history(options: { verbose: true }): Move[];
  perft(depth: number): number;
}
export function Chess(fen?: string): ChessInstance;
