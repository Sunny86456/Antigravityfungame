import { describe, it, expect } from 'vitest';
import { 
  createInitialBoard, 
  getPieceMoves, 
  isValidPosition, 
  isInCheck, 
  makeMove,
  getLegalMoves,
  Board,
  Position
} from './chessLogic';

describe('Chess Logic', () => {
  describe('Board Initialization', () => {
    it('should create an 8x8 board', () => {
      const board = createInitialBoard();
      expect(board.length).toBe(8);
      expect(board[0].length).toBe(8);
    });

    it('should place pieces in correct starting positions', () => {
      const board = createInitialBoard();
      expect(board[0][0]).toEqual({ type: 'rook', color: 'black' });
      expect(board[7][4]).toEqual({ type: 'king', color: 'white' });
      expect(board[1][0]).toEqual({ type: 'pawn', color: 'black' });
      expect(board[6][4]).toEqual({ type: 'pawn', color: 'white' });
    });
  });

  describe('Position Validation', () => {
    it('should identify valid and invalid positions', () => {
      expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
      expect(isValidPosition({ row: 7, col: 7 })).toBe(true);
      expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 8, col: 0 })).toBe(false);
    });
  });

  describe('Piece Movement', () => {
    it('should calculate pawn moves correctly from start', () => {
      const board = createInitialBoard();
      const moves = getPieceMoves(board, { row: 6, col: 4 }); // White pawn at E2
      expect(moves).toContainEqual({ row: 5, col: 4 });
      expect(moves).toContainEqual({ row: 4, col: 4 });
      expect(moves.length).toBe(2);
    });

    it('should calculate knight moves correctly', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[4][4] = { type: 'knight', color: 'white' };
      const moves = getPieceMoves(board, { row: 4, col: 4 });
      expect(moves.length).toBe(8);
      expect(moves).toContainEqual({ row: 2, col: 3 });
      expect(moves).toContainEqual({ row: 6, col: 5 });
    });

    it('should block pieces by same color', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[4][4] = { type: 'rook', color: 'white' };
      board[4][6] = { type: 'pawn', color: 'white' };
      const moves = getPieceMoves(board, { row: 4, col: 4 });
      expect(moves).not.toContainEqual({ row: 4, col: 6 });
      expect(moves).not.toContainEqual({ row: 4, col: 7 });
    });
  });

  describe('Check Detection', () => {
    it('should detect when king is in check', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[0][7] = { type: 'rook', color: 'black' };
      expect(isInCheck(board, 'white')).toBe(true);
    });

    it('should detect when king is NOT in check', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[1][7] = { type: 'rook', color: 'black' };
      expect(isInCheck(board, 'white')).toBe(false);
    });
  });

  describe('Legal Moves', () => {
    it('should restrict moves that put king in check', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[1][1] = { type: 'rook', color: 'white' };
      board[7][7] = { type: 'bishop', color: 'black' };
      
      // Rook at 1,1 is pinned because moving it would put King in check from Bishop at 7,7
      const moves = getLegalMoves(board, 'white');
      const rookMoves = moves.filter(m => m.piece.type === 'rook');
      // In this specific setup, rook can only move along the diagonal if it captures the bishop, 
      // but rook doesn't move diagonally. So it should have 0 legal moves.
      expect(rookMoves.length).toBe(0);
    });
  });
});
