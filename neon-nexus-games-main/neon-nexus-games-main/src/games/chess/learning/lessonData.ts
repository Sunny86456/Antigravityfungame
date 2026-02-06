/**
 * Chess Learning System - Comprehensive Lesson Data
 * 
 * This module defines all lesson content for the chess learning system.
 * Each lesson teaches real chess rules with proper path blocking, captures, and validation.
 */

import { Board, PieceType, PieceColor, Position } from '../chessLogic';

// ============= Types =============

export type LessonCategory = 
  | 'pawn'
  | 'rook'
  | 'bishop'
  | 'knight'
  | 'queen'
  | 'king'
  | 'capturing'
  | 'check'
  | 'advanced';

export type LessonMode = 
  | 'explore'      // Player can make any legal move with allowed pieces
  | 'specific'     // Player must make a specific move to continue
  | 'demonstrate'; // Show a concept, player clicks to acknowledge

export interface LessonObjective {
  type: 'make-move' | 'capture' | 'check' | 'checkmate' | 'castle' | 'promote' | 'click';
  description: string;
  /** For specific mode, the exact move(s) that are acceptable */
  acceptedMoves?: { from: Position; to: Position; promotion?: PieceType }[];
  /** For click mode, the target square */
  targetSquare?: Position;
}

export interface Lesson {
  id: number;
  category: LessonCategory;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  
  /** The board position for this lesson */
  board: Board;
  
  /** Which color the player controls */
  playerColor: PieceColor;
  
  /** Which piece types the player can interact with (empty = all) */
  allowedPieces: PieceType[];
  
  /** The mode of this lesson */
  mode: LessonMode;
  
  /** The objective to complete this lesson */
  objective: LessonObjective;
  
  /** Concept explanation shown to the player */
  concept: string;
  
  /** Hint shown when player struggles */
  hint: string;
  
  /** Success message */
  successMessage: string;
  
  /** Optional explanation for illegal moves */
  illegalMoveExplanation?: string;
  
  /** Visual helpers */
  highlightSquares?: Position[];
  showArrow?: { from: Position; to: Position };
  
  /** For multi-step lessons, the sequence of moves */
  moveSequence?: { from: Position; to: Position; promotion?: PieceType }[];
}

// ============= Board Builders =============

const emptyBoard = (): Board => Array(8).fill(null).map(() => Array(8).fill(null));

const placePiece = (
  board: Board,
  row: number,
  col: number,
  type: PieceType,
  color: PieceColor,
  hasMoved = false
): Board => {
  const next = board.map(r => [...r]);
  next[row][col] = { type, color, hasMoved };
  return next;
};

// ============= LESSON SET 1: PAWN =============

// Lesson 1: Basic pawn forward move
const pawnBasicsBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 6, 4, 'pawn', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 2: Pawn double move from starting position
const pawnDoubleMoveBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 6, 3, 'pawn', 'white'); // Starting position
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 3: Pawn capture diagonal
const pawnCaptureBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'pawn', 'white');
  b = placePiece(b, 3, 5, 'pawn', 'black'); // Capturable diagonally
  b = placePiece(b, 3, 4, 'pawn', 'black'); // Blocks forward
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 4: Pawn blocking demonstration
const pawnBlockingBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 5, 4, 'pawn', 'white');
  b = placePiece(b, 4, 4, 'pawn', 'black'); // Directly blocks
  b = placePiece(b, 4, 5, 'pawn', 'black'); // Capturable
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 5: Pawn promotion
const pawnPromotionBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 1, 4, 'pawn', 'white'); // One step from promotion
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// ============= LESSON SET 2: ROOK =============

// Lesson 6: Rook horizontal movement
const rookHorizontalBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 0, 'rook', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 7: Rook vertical movement
const rookVerticalBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 3, 'rook', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 8: Rook path blocking
const rookBlockingBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 0, 'rook', 'white');
  b = placePiece(b, 4, 4, 'pawn', 'white'); // Blocks horizontal path
  b = placePiece(b, 2, 0, 'pawn', 'black'); // Capturable
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 9: Rook capture
const rookCaptureBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 2, 'rook', 'white');
  b = placePiece(b, 4, 6, 'rook', 'black'); // Capturable
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// ============= LESSON SET 3: BISHOP =============

// Lesson 10: Bishop diagonal movement
const bishopDiagonalBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 2, 'bishop', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 11: Bishop same color squares
const bishopColorBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'bishop', 'white'); // Light square bishop
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 12: Bishop path blocking
const bishopBlockingBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 6, 1, 'bishop', 'white');
  b = placePiece(b, 4, 3, 'pawn', 'white'); // Blocks one diagonal
  b = placePiece(b, 3, 4, 'pawn', 'black'); // Capturable
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// ============= LESSON SET 4: KNIGHT =============

// Lesson 13: Knight L-shape movement
const knightLShapeBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 1, 'knight', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 14: Knight jumping over pieces
const knightJumpingBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'knight', 'white');
  // Surround knight with pawns
  b = placePiece(b, 3, 3, 'pawn', 'white');
  b = placePiece(b, 3, 4, 'pawn', 'white');
  b = placePiece(b, 3, 5, 'pawn', 'white');
  b = placePiece(b, 4, 3, 'pawn', 'white');
  b = placePiece(b, 4, 5, 'pawn', 'white');
  b = placePiece(b, 5, 3, 'pawn', 'white');
  b = placePiece(b, 5, 4, 'pawn', 'white');
  b = placePiece(b, 5, 5, 'pawn', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 15: Knight capture
const knightCaptureBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'knight', 'white');
  b = placePiece(b, 2, 5, 'rook', 'black'); // Capturable
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// ============= LESSON SET 5: QUEEN =============

// Lesson 16: Queen combined movement
const queenMovementBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'queen', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 17: Queen path blocking
const queenBlockingBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'queen', 'white');
  b = placePiece(b, 4, 6, 'pawn', 'white'); // Blocks horizontal
  b = placePiece(b, 2, 4, 'pawn', 'white'); // Blocks vertical
  b = placePiece(b, 2, 6, 'pawn', 'black'); // Capturable on diagonal
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// ============= LESSON SET 6: KING =============

// Lesson 18: King one square movement
const kingMovementBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// Lesson 19: King cannot move into check
const kingCheckBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'king', 'white');
  b = placePiece(b, 2, 5, 'rook', 'black'); // Controls column 5
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// Lesson 20: Castling kingside
const castlingKingsideBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 4, 'king', 'white', false); // Unmoved king
  b = placePiece(b, 7, 7, 'rook', 'white', false); // Unmoved rook
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 21: Castling queenside
const castlingQueensideBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 4, 'king', 'white', false); // Unmoved king
  b = placePiece(b, 7, 0, 'rook', 'white', false); // Unmoved rook
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// ============= LESSON SET 7: CAPTURING & BLOCKING =============

// Lesson 22: Capturing basics
const capturingBasicsBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'queen', 'white');
  b = placePiece(b, 4, 7, 'rook', 'black');
  b = placePiece(b, 1, 4, 'bishop', 'black');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// Lesson 23: Cannot capture own pieces
const cannotCaptureOwnBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'rook', 'white');
  b = placePiece(b, 4, 6, 'pawn', 'white'); // Own piece - cannot capture
  b = placePiece(b, 4, 2, 'pawn', 'black'); // Enemy - can capture
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// ============= LESSON SET 8: CHECK & CHECKMATE =============

// Lesson 24: What is check
const whatIsCheckBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 0, 'rook', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 4, 'king', 'black');
  return b;
};

// Lesson 25: Escaping check
const escapingCheckBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 0, 4, 'king', 'black');
  b = placePiece(b, 0, 0, 'rook', 'white'); // Giving check
  b = placePiece(b, 7, 4, 'king', 'white');
  return b;
};

// Lesson 26: Blocking check
const blockingCheckBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 7, 3, 'rook', 'white'); // Can block
  b = placePiece(b, 0, 4, 'queen', 'black'); // Giving check on file
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// Lesson 27: Checkmate pattern - back rank
const checkmateBackRankBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 7, 0, 'queen', 'white');
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 7, 'king', 'black');
  b = placePiece(b, 1, 6, 'pawn', 'black');
  b = placePiece(b, 1, 7, 'pawn', 'black');
  return b;
};

// ============= LESSON SET 9: ADVANCED CONCEPTS =============

// Lesson 28: Pins
const pinsBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 0, 'rook', 'white');
  b = placePiece(b, 4, 4, 'knight', 'black'); // Pinned to king
  b = placePiece(b, 4, 7, 'king', 'black');
  b = placePiece(b, 7, 4, 'king', 'white');
  return b;
};

// Lesson 29: Forks
const forksBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 5, 4, 'knight', 'white');
  b = placePiece(b, 2, 3, 'king', 'black');
  b = placePiece(b, 2, 5, 'queen', 'black');
  b = placePiece(b, 7, 4, 'king', 'white');
  return b;
};

// Lesson 30: Discovered attacks
const discoveredAttackBoard = (): Board => {
  let b = emptyBoard();
  b = placePiece(b, 4, 4, 'rook', 'white'); // Behind bishop
  b = placePiece(b, 4, 6, 'bishop', 'white'); // Can move to discover rook attack
  b = placePiece(b, 4, 7, 'queen', 'black'); // Will be attacked by rook
  b = placePiece(b, 7, 4, 'king', 'white');
  b = placePiece(b, 0, 0, 'king', 'black');
  return b;
};

// ============= LESSON DEFINITIONS =============

export const LESSONS: Lesson[] = [
  // PAWN LESSONS (1-5)
  {
    id: 1,
    category: 'pawn',
    title: 'Pawn Basics',
    subtitle: 'Forward Movement',
    description: 'Learn how pawns move forward one square at a time.',
    icon: '♙',
    board: pawnBasicsBoard(),
    playerColor: 'white',
    allowedPieces: ['pawn'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the pawn forward one square.'
    },
    concept: 'Pawns move forward one square into empty squares. They cannot move backward or sideways.',
    hint: 'Click the pawn, then click the square directly in front of it.',
    successMessage: 'Correct! Pawns move forward one square at a time.',
    illegalMoveExplanation: 'Pawns can only move forward, not backward or sideways.',
    showArrow: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }
  },
  {
    id: 2,
    category: 'pawn',
    title: 'Pawn Double Move',
    subtitle: 'First Move Special',
    description: 'Pawns can move two squares on their first move.',
    icon: '♙',
    board: pawnDoubleMoveBoard(),
    playerColor: 'white',
    allowedPieces: ['pawn'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the pawn two squares forward from its starting position.'
    },
    concept: 'On their very first move, pawns can advance two squares instead of one. This is optional - you can still move just one square.',
    hint: 'From the starting row, you can move one or two squares forward.',
    successMessage: 'Great! Pawns have this special two-square option on their first move.',
    showArrow: { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }
  },
  {
    id: 3,
    category: 'pawn',
    title: 'Pawn Capture',
    subtitle: 'Diagonal Capture',
    description: 'Pawns capture diagonally, not straight ahead.',
    icon: '♙',
    board: pawnCaptureBoard(),
    playerColor: 'white',
    allowedPieces: ['pawn'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'Capture the black pawn diagonally.',
      acceptedMoves: [{ from: { row: 4, col: 4 }, to: { row: 3, col: 5 } }]
    },
    concept: 'Pawns capture diagonally forward - they cannot capture straight ahead. If a piece is directly in front, the pawn is blocked.',
    hint: 'The pawn in front blocks your path. Capture diagonally to the right!',
    successMessage: 'Correct! Pawns capture diagonally, never straight ahead.',
    illegalMoveExplanation: 'Pawns cannot capture forward - only diagonally.',
    showArrow: { from: { row: 4, col: 4 }, to: { row: 3, col: 5 } }
  },
  {
    id: 4,
    category: 'pawn',
    title: 'Pawn Blocking',
    subtitle: 'Blocked Pawns',
    description: 'A blocked pawn cannot move forward.',
    icon: '♙',
    board: pawnBlockingBoard(),
    playerColor: 'white',
    allowedPieces: ['pawn'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'The pawn is blocked! Capture diagonally to continue.',
      acceptedMoves: [{ from: { row: 5, col: 4 }, to: { row: 4, col: 5 } }]
    },
    concept: 'When a piece is directly in front of a pawn, the pawn is completely blocked. It cannot jump over the piece. The only option is to capture diagonally if possible.',
    hint: 'You cannot move forward - capture diagonally!',
    successMessage: 'Excellent! When blocked, a pawn must capture or wait.',
    illegalMoveExplanation: 'The pawn cannot move forward because it is blocked.',
    highlightSquares: [{ row: 4, col: 4 }]
  },
  {
    id: 5,
    category: 'pawn',
    title: 'Pawn Promotion',
    subtitle: 'Reaching the End',
    description: 'Pawns promote when reaching the opposite end.',
    icon: '♙',
    board: pawnPromotionBoard(),
    playerColor: 'white',
    allowedPieces: ['pawn'],
    mode: 'specific',
    objective: {
      type: 'promote',
      description: 'Push the pawn to the last rank and promote it!',
      acceptedMoves: [
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'queen' },
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'rook' },
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'bishop' },
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'knight' }
      ]
    },
    concept: 'When a pawn reaches the opposite end of the board, it must promote to a queen, rook, bishop, or knight. Most players choose queen (strongest piece).',
    hint: 'Move the pawn to row 8 (the top row) to promote!',
    successMessage: 'Congratulations! The pawn has promoted to a new piece!',
    showArrow: { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } }
  },

  // ROOK LESSONS (6-9)
  {
    id: 6,
    category: 'rook',
    title: 'Rook Movement',
    subtitle: 'Horizontal Lines',
    description: 'Rooks move in straight lines horizontally.',
    icon: '♖',
    board: rookHorizontalBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the rook horizontally across the board.'
    },
    concept: 'Rooks move in straight lines - horizontally (left/right) or vertically (up/down). They can move any number of squares, but cannot jump over pieces.',
    hint: 'Click the rook and move it to any square in the same row.',
    successMessage: 'Perfect! Rooks move in straight lines.',
    illegalMoveExplanation: 'Rooks cannot move diagonally - only straight lines.',
    showArrow: { from: { row: 4, col: 0 }, to: { row: 4, col: 7 } }
  },
  {
    id: 7,
    category: 'rook',
    title: 'Rook Vertical',
    subtitle: 'Vertical Lines',
    description: 'Rooks also move vertically up and down.',
    icon: '♖',
    board: rookVerticalBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the rook vertically up the board.'
    },
    concept: 'Rooks can move any number of squares vertically. Combined with horizontal movement, they control entire rows and columns.',
    hint: 'Move the rook up the file (column).',
    successMessage: 'Great! Rooks control entire files and ranks.',
    showArrow: { from: { row: 7, col: 3 }, to: { row: 0, col: 3 } }
  },
  {
    id: 8,
    category: 'rook',
    title: 'Rook Blocking',
    subtitle: 'Path Obstruction',
    description: 'Rooks cannot jump over pieces in their path.',
    icon: '♖',
    board: rookBlockingBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'The pawn blocks the right path. Capture the black pawn above!',
      acceptedMoves: [{ from: { row: 4, col: 0 }, to: { row: 2, col: 0 } }]
    },
    concept: 'Rooks cannot jump over pieces. If a friendly piece is in the way, the rook must stop before it. If an enemy piece is in the way, the rook can capture it but cannot continue past.',
    hint: 'You cannot pass your own pawn. Move up and capture the black pawn.',
    successMessage: 'Correct! Rooks stop at blocking pieces - capturing enemies or stopping before allies.',
    illegalMoveExplanation: 'The rook cannot jump over the pawn blocking its path.',
    highlightSquares: [{ row: 4, col: 4 }]
  },
  {
    id: 9,
    category: 'rook',
    title: 'Rook Capture',
    subtitle: 'Capturing Pieces',
    description: 'Rooks capture by landing on enemy pieces.',
    icon: '♖',
    board: rookCaptureBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'Capture the enemy rook!',
      acceptedMoves: [{ from: { row: 4, col: 2 }, to: { row: 4, col: 6 } }]
    },
    concept: 'Rooks capture by moving to the square occupied by an enemy piece. The enemy piece is removed from the board.',
    hint: 'Move horizontally to capture the black rook.',
    successMessage: 'Excellent capture! The rook takes the enemy piece.',
    showArrow: { from: { row: 4, col: 2 }, to: { row: 4, col: 6 } }
  },

  // BISHOP LESSONS (10-12)
  {
    id: 10,
    category: 'bishop',
    title: 'Bishop Diagonal',
    subtitle: 'Diagonal Movement',
    description: 'Bishops move only diagonally.',
    icon: '♗',
    board: bishopDiagonalBoard(),
    playerColor: 'white',
    allowedPieces: ['bishop'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the bishop diagonally across the board.'
    },
    concept: 'Bishops move diagonally any number of squares. They cannot move horizontally or vertically.',
    hint: 'Click the bishop and move it along any diagonal.',
    successMessage: 'Perfect! Bishops always move diagonally.',
    illegalMoveExplanation: 'Bishops cannot move in straight lines - only diagonals.',
    showArrow: { from: { row: 7, col: 2 }, to: { row: 4, col: 5 } }
  },
  {
    id: 11,
    category: 'bishop',
    title: 'Same Color Squares',
    subtitle: 'Color Binding',
    description: 'Bishops stay on the same color squares.',
    icon: '♗',
    board: bishopColorBoard(),
    playerColor: 'white',
    allowedPieces: ['bishop'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Notice: the bishop can only reach squares of one color!'
    },
    concept: 'Because bishops move diagonally, they are "color-bound" - a bishop on a light square can never reach a dark square, and vice versa.',
    hint: 'Try moving to any square - notice they are all the same color!',
    successMessage: 'Notice how all available squares are the same color? Bishops are color-bound!'
  },
  {
    id: 12,
    category: 'bishop',
    title: 'Bishop Blocking',
    subtitle: 'Blocked Diagonals',
    description: 'Bishops cannot jump over pieces.',
    icon: '♗',
    board: bishopBlockingBoard(),
    playerColor: 'white',
    allowedPieces: ['bishop'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'One diagonal is blocked. Capture the black pawn on the open diagonal!',
      acceptedMoves: [{ from: { row: 6, col: 1 }, to: { row: 3, col: 4 } }]
    },
    concept: 'Like rooks, bishops cannot jump over pieces. They must stop before friendly pieces or capture enemy pieces in their path.',
    hint: 'The pawn blocks one diagonal. Use the other diagonal to capture!',
    successMessage: 'Great! Bishops stop at blocking pieces just like rooks.',
    illegalMoveExplanation: 'The bishop cannot jump over the blocking pawn.',
    highlightSquares: [{ row: 4, col: 3 }]
  },

  // KNIGHT LESSONS (13-15)
  {
    id: 13,
    category: 'knight',
    title: 'Knight L-Shape',
    subtitle: 'Unique Movement',
    description: 'Knights move in an L-shape pattern.',
    icon: '♘',
    board: knightLShapeBoard(),
    playerColor: 'white',
    allowedPieces: ['knight'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the knight in its L-shaped pattern.'
    },
    concept: 'Knights move in an "L" shape: 2 squares in one direction, then 1 square perpendicular. This makes 8 possible squares from the center of the board.',
    hint: 'Knights move 2 squares in one direction, then 1 square to the side.',
    successMessage: 'Correct! The knight moves in an L-shape.',
    showArrow: { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
  },
  {
    id: 14,
    category: 'knight',
    title: 'Knight Jumping',
    subtitle: 'The Only Jumper',
    description: 'Knights can jump over other pieces!',
    icon: '♘',
    board: knightJumpingBoard(),
    playerColor: 'white',
    allowedPieces: ['knight'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'The knight is surrounded - but it can still move! Jump over the pawns.'
    },
    concept: 'Knights are the ONLY piece that can jump over other pieces. The squares between the knight and its destination do not matter.',
    hint: 'Unlike other pieces, the knight jumps over everything!',
    successMessage: 'Amazing! Knights jump over all pieces in their way - the only piece that can!'
  },
  {
    id: 15,
    category: 'knight',
    title: 'Knight Capture',
    subtitle: 'Jumping to Capture',
    description: 'Knights capture where they land, not where they jump.',
    icon: '♘',
    board: knightCaptureBoard(),
    playerColor: 'white',
    allowedPieces: ['knight'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'Capture the enemy rook!',
      acceptedMoves: [{ from: { row: 4, col: 4 }, to: { row: 2, col: 5 } }]
    },
    concept: 'Knights capture by landing on enemy pieces with their L-shaped move. They only capture where they land, not pieces they jump over.',
    hint: 'Jump to the square where the rook is!',
    successMessage: 'Great! Knights capture where they land.',
    showArrow: { from: { row: 4, col: 4 }, to: { row: 2, col: 5 } }
  },

  // QUEEN LESSONS (16-17)
  {
    id: 16,
    category: 'queen',
    title: 'Queen Movement',
    subtitle: 'The Powerful Piece',
    description: 'The queen combines rook and bishop movements.',
    icon: '♕',
    board: queenMovementBoard(),
    playerColor: 'white',
    allowedPieces: ['queen'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the queen - it can go straight or diagonal!'
    },
    concept: 'The queen is the most powerful piece. It combines the rook (straight lines) and bishop (diagonals), moving any number of squares in any direction.',
    hint: 'The queen can move like a rook OR a bishop!',
    successMessage: 'The queen is indeed the most powerful piece!'
  },
  {
    id: 17,
    category: 'queen',
    title: 'Queen Blocking',
    subtitle: 'Cannot Jump',
    description: 'Despite her power, the queen cannot jump.',
    icon: '♕',
    board: queenBlockingBoard(),
    playerColor: 'white',
    allowedPieces: ['queen'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'Some paths are blocked. Find the open diagonal to capture!',
      acceptedMoves: [{ from: { row: 4, col: 4 }, to: { row: 2, col: 6 } }]
    },
    concept: 'Despite being powerful, the queen cannot jump over pieces (only the knight can). She must navigate around blocking pieces.',
    hint: 'Look for an open path to the black pawn.',
    successMessage: 'Correct! Even the queen must respect blocking pieces.',
    highlightSquares: [{ row: 4, col: 6 }, { row: 2, col: 4 }]
  },

  // KING LESSONS (18-21)
  {
    id: 18,
    category: 'king',
    title: 'King Movement',
    subtitle: 'One Square Only',
    description: 'The king moves one square in any direction.',
    icon: '♔',
    board: kingMovementBoard(),
    playerColor: 'white',
    allowedPieces: ['king'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the king one square in any direction.'
    },
    concept: 'The king moves one square in any direction - horizontally, vertically, or diagonally. While slow, the king is the most important piece.',
    hint: 'The king can move to any adjacent square.',
    successMessage: 'The king moves one square at a time, but in any direction!'
  },
  {
    id: 19,
    category: 'king',
    title: 'King Safety',
    subtitle: 'Cannot Move Into Check',
    description: 'The king cannot move into attacked squares.',
    icon: '♔',
    board: kingCheckBoard(),
    playerColor: 'white',
    allowedPieces: ['king'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Notice: the king cannot move to squares attacked by the rook!'
    },
    concept: 'The king can NEVER move to a square that is attacked by an enemy piece. This would put the king "in check" which is illegal.',
    hint: 'The rook controls the entire column. The king cannot enter it!',
    successMessage: 'Correct! The king found a safe square, avoiding the attacked column.',
    illegalMoveExplanation: 'The king cannot move into check (attacked squares).',
    highlightSquares: [{ row: 3, col: 5 }, { row: 4, col: 5 }, { row: 5, col: 5 }]
  },
  {
    id: 20,
    category: 'king',
    title: 'Castling Kingside',
    subtitle: 'Special King Move',
    description: 'Castle to safety by moving king and rook together.',
    icon: '♔',
    board: castlingKingsideBoard(),
    playerColor: 'white',
    allowedPieces: ['king'],
    mode: 'specific',
    objective: {
      type: 'castle',
      description: 'Castle kingside: move the king two squares toward the rook!',
      acceptedMoves: [{ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }]
    },
    concept: 'Castling is a special move where the king moves 2 squares toward a rook, and the rook jumps to the other side of the king. Conditions: neither piece has moved, no pieces between them, king not in check.',
    hint: 'Move the king to g1 (two squares toward the rook).',
    successMessage: 'Castled kingside! The rook jumped to f1 automatically.',
    showArrow: { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }
  },
  {
    id: 21,
    category: 'king',
    title: 'Castling Queenside',
    subtitle: 'Long Castle',
    description: 'You can also castle to the other side.',
    icon: '♔',
    board: castlingQueensideBoard(),
    playerColor: 'white',
    allowedPieces: ['king'],
    mode: 'specific',
    objective: {
      type: 'castle',
      description: 'Castle queenside: move the king two squares toward the a-file rook!',
      acceptedMoves: [{ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } }]
    },
    concept: 'Queenside castling works the same way, but toward the a-file rook. The king moves 2 squares left, and the rook jumps to d1.',
    hint: 'Move the king to c1 (two squares toward the queenside rook).',
    successMessage: 'Castled queenside! This is also called "long castling".',
    showArrow: { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } }
  },

  // CAPTURING LESSONS (22-23)
  {
    id: 22,
    category: 'capturing',
    title: 'Capturing Basics',
    subtitle: 'Taking Pieces',
    description: 'Capture enemy pieces by moving to their square.',
    icon: '⚔️',
    board: capturingBasicsBoard(),
    playerColor: 'white',
    allowedPieces: ['queen'],
    mode: 'explore',
    objective: {
      type: 'capture',
      description: 'Capture one of the black pieces with your queen.'
    },
    concept: 'To capture, move your piece to a square occupied by an enemy piece. The enemy piece is removed from the board.',
    hint: 'The queen can capture the rook or the bishop!',
    successMessage: 'Captured! The enemy piece is removed from the board.'
  },
  {
    id: 23,
    category: 'capturing',
    title: 'Cannot Capture Allies',
    subtitle: 'Friendly Fire Off',
    description: 'You cannot capture your own pieces.',
    icon: '⚔️',
    board: cannotCaptureOwnBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'specific',
    objective: {
      type: 'capture',
      description: 'Capture the enemy pawn (you cannot capture your own pawn).',
      acceptedMoves: [{ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } }]
    },
    concept: 'You can never capture your own pieces. Friendly pieces block your path, and you must go around them.',
    hint: 'You cannot capture the white pawn. Capture the black one instead!',
    successMessage: 'Correct! You can only capture enemy pieces, never your own.',
    illegalMoveExplanation: 'You cannot capture your own pieces!',
    highlightSquares: [{ row: 4, col: 6 }]
  },

  // CHECK LESSONS (24-27)
  {
    id: 24,
    category: 'check',
    title: 'What Is Check',
    subtitle: 'Threatening the King',
    description: 'Put the enemy king under attack.',
    icon: '🎯',
    board: whatIsCheckBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'specific',
    objective: {
      type: 'check',
      description: 'Move the rook to put the black king in check!',
      acceptedMoves: [{ from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }]
    },
    concept: 'Check means the king is under attack. When in check, the player MUST get out of check on their next move, or the game is lost.',
    hint: 'Move the rook to the same row as the black king!',
    successMessage: 'Check! The black king is under attack and must respond.',
    showArrow: { from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }
  },
  {
    id: 25,
    category: 'check',
    title: 'Escaping Check',
    subtitle: 'Three Options',
    description: 'When in check, you must escape.',
    icon: '🎯',
    board: escapingCheckBoard(),
    playerColor: 'black',
    allowedPieces: ['king'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Your king is in check! Move it to safety.'
    },
    concept: 'To escape check: 1) Move the king to a safe square, 2) Block the check with another piece, or 3) Capture the attacking piece.',
    hint: 'Move the king out of the rook\'s attack line!',
    successMessage: 'The king escaped! Always have an escape plan.'
  },
  {
    id: 26,
    category: 'check',
    title: 'Blocking Check',
    subtitle: 'Interposing',
    description: 'Block a check with another piece.',
    icon: '🎯',
    board: blockingCheckBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'specific',
    objective: {
      type: 'make-move',
      description: 'Your king is in check! Block with the rook.',
      acceptedMoves: [{ from: { row: 7, col: 3 }, to: { row: 1, col: 4 } }]
    },
    concept: 'Instead of moving the king, you can sometimes block a check by placing another piece between the attacker and your king.',
    hint: 'Move the rook to block the queen\'s attack!',
    successMessage: 'Blocked! The rook now protects the king from the queen.',
    showArrow: { from: { row: 7, col: 3 }, to: { row: 1, col: 4 } }
  },
  {
    id: 27,
    category: 'check',
    title: 'Checkmate',
    subtitle: 'Game Over',
    description: 'Deliver checkmate to win the game.',
    icon: '👑',
    board: checkmateBackRankBoard(),
    playerColor: 'white',
    allowedPieces: ['queen'],
    mode: 'specific',
    objective: {
      type: 'checkmate',
      description: 'Deliver checkmate! The king has no escape.',
      acceptedMoves: [{ from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }]
    },
    concept: 'Checkmate occurs when the king is in check AND has no legal moves to escape. This ends the game immediately.',
    hint: 'Move the queen to give check - the king cannot escape!',
    successMessage: 'CHECKMATE! The black king has no escape. You win!',
    showArrow: { from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }
  },

  // ADVANCED LESSONS (28-30)
  {
    id: 28,
    category: 'advanced',
    title: 'Pins',
    subtitle: 'Frozen Pieces',
    description: 'A pinned piece cannot move without exposing the king.',
    icon: '📌',
    board: pinsBoard(),
    playerColor: 'white',
    allowedPieces: ['rook'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'The black knight is pinned to its king. Move your rook anywhere - the knight cannot legally move!'
    },
    concept: 'A pin occurs when a piece cannot move because doing so would expose its king to check. The pinned piece is stuck!',
    hint: 'The knight cannot move because it would expose its king. Your rook is free to move!',
    successMessage: 'The knight is pinned! It cannot move without exposing its king.',
    highlightSquares: [{ row: 4, col: 4 }]
  },
  {
    id: 29,
    category: 'advanced',
    title: 'Forks',
    subtitle: 'Double Attack',
    description: 'Attack two pieces at once with a fork.',
    icon: '🍴',
    board: forksBoard(),
    playerColor: 'white',
    allowedPieces: ['knight'],
    mode: 'specific',
    objective: {
      type: 'make-move',
      description: 'Move the knight to attack both the king and queen at once!',
      acceptedMoves: [{ from: { row: 5, col: 4 }, to: { row: 3, col: 4 } }]
    },
    concept: 'A fork attacks two or more pieces simultaneously. Since only one can move, you will capture the other! Knights are especially good at forking.',
    hint: 'Find the square where the knight attacks both the king and queen!',
    successMessage: 'Fork! The knight attacks both pieces - one must be captured!',
    showArrow: { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } }
  },
  {
    id: 30,
    category: 'advanced',
    title: 'Discovered Attack',
    subtitle: 'Hidden Threats',
    description: 'Reveal an attack by moving a blocking piece.',
    icon: '💥',
    board: discoveredAttackBoard(),
    playerColor: 'white',
    allowedPieces: ['bishop'],
    mode: 'explore',
    objective: {
      type: 'make-move',
      description: 'Move the bishop to reveal the rook\'s attack on the queen!'
    },
    concept: 'A discovered attack happens when you move a piece, revealing an attack from a piece behind it. The moved piece can also threaten something else!',
    hint: 'Moving the bishop will uncover the rook\'s attack on the black queen.',
    successMessage: 'Discovered attack! The rook now threatens the queen!',
    highlightSquares: [{ row: 4, col: 6 }]
  }
];

export const getLessonById = (id: number): Lesson | undefined => {
  return LESSONS.find(l => l.id === id);
};

export const getLessonsByCategory = (category: LessonCategory): Lesson[] => {
  return LESSONS.filter(l => l.category === category);
};

export const LESSON_CATEGORIES: { id: LessonCategory; name: string; icon: string }[] = [
  { id: 'pawn', name: 'Pawn', icon: '♙' },
  { id: 'rook', name: 'Rook', icon: '♖' },
  { id: 'bishop', name: 'Bishop', icon: '♗' },
  { id: 'knight', name: 'Knight', icon: '♘' },
  { id: 'queen', name: 'Queen', icon: '♕' },
  { id: 'king', name: 'King', icon: '♔' },
  { id: 'capturing', name: 'Capturing', icon: '⚔️' },
  { id: 'check', name: 'Check & Mate', icon: '🎯' },
  { id: 'advanced', name: 'Advanced', icon: '🧠' }
];
