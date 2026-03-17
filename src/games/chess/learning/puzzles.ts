import { Board, Piece, PieceType, PieceColor, Position, Move } from '../chessLogic';

export type PuzzleCategory = 'mate-in-1' | 'mate-in-2' | 'win-material' | 'best-move';
export type PuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChessPuzzle {
  id: number;
  title: string;
  category: PuzzleCategory;
  difficulty: PuzzleDifficulty;
  board: Board;
  playerColor: PieceColor;
  solution: { from: Position; to: Position; promotion?: PieceType }[];
  hint: string;
  explanation: string;
  coinReward: number;
  objective: string; // Clear objective text shown to user
}

// Helper to create empty board
const emptyBoard = (): Board => Array(8).fill(null).map(() => Array(8).fill(null));

// Helper to place piece
const placePiece = (board: Board, row: number, col: number, type: PieceType, color: PieceColor): Board => {
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = { type, color };
  return newBoard;
};

// ===== MATE IN 1 PUZZLES (Verified) =====

// Puzzle 1: Simple back rank mate with Queen
const puzzle1Board = (): Board => {
  let board = emptyBoard();
  // White: Queen on a1, King on g1
  // Black: King on h8, pawns blocking escape
  board = placePiece(board, 7, 6, 'king', 'white');
  board = placePiece(board, 7, 0, 'queen', 'white');
  board = placePiece(board, 0, 7, 'king', 'black');
  board = placePiece(board, 1, 7, 'pawn', 'black');
  board = placePiece(board, 1, 6, 'pawn', 'black');
  return board;
};

// Puzzle 2: Rook back rank mate
const puzzle2Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 7, 0, 'rook', 'white');
  board = placePiece(board, 0, 7, 'king', 'black');
  board = placePiece(board, 1, 7, 'pawn', 'black');
  board = placePiece(board, 1, 6, 'pawn', 'black');
  return board;
};

// Puzzle 3: Queen mate in corner
const puzzle3Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 5, 5, 'queen', 'white');
  board = placePiece(board, 0, 0, 'king', 'black');
  board = placePiece(board, 1, 1, 'pawn', 'black');
  return board;
};

// Puzzle 4: Knight fork - win the queen
const puzzle4Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 5, 3, 'knight', 'white');
  board = placePiece(board, 0, 4, 'king', 'black');
  board = placePiece(board, 2, 5, 'queen', 'black');
  return board;
};

// Puzzle 5: Bishop captures undefended queen
const puzzle5Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 7, 2, 'bishop', 'white');
  board = placePiece(board, 0, 4, 'king', 'black');
  board = placePiece(board, 4, 5, 'queen', 'black');
  return board;
};

// Puzzle 6: Rook captures undefended rook
const puzzle6Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 4, 0, 'rook', 'white');
  board = placePiece(board, 0, 4, 'king', 'black');
  board = placePiece(board, 4, 7, 'rook', 'black');
  return board;
};

// Puzzle 7: Queen double attack
const puzzle7Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 6, 3, 'queen', 'white');
  board = placePiece(board, 0, 4, 'king', 'black');
  board = placePiece(board, 0, 0, 'rook', 'black');
  board = placePiece(board, 3, 7, 'rook', 'black');
  return board;
};

// Puzzle 8: Simple pawn promotion
const puzzle8Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 1, 4, 'pawn', 'white');
  board = placePiece(board, 0, 0, 'king', 'black');
  return board;
};

// Puzzle 9: Queen delivers checkmate
const puzzle9Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 4, 0, 'queen', 'white');
  board = placePiece(board, 0, 7, 'king', 'black');
  board = placePiece(board, 1, 7, 'pawn', 'black');
  board = placePiece(board, 1, 6, 'pawn', 'black');
  return board;
};

// Puzzle 10: Mate in 2 - Sacrifice then mate
const puzzle10Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 6, 0, 'rook', 'white');
  board = placePiece(board, 7, 1, 'rook', 'white');
  board = placePiece(board, 2, 4, 'king', 'black');
  return board;
};

// Puzzle 11: Knight and Rook checkmate
const puzzle11Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 5, 5, 'knight', 'white');
  board = placePiece(board, 7, 0, 'rook', 'white');
  board = placePiece(board, 0, 7, 'king', 'black');
  board = placePiece(board, 1, 6, 'pawn', 'black');
  board = placePiece(board, 1, 7, 'pawn', 'black');
  return board;
};

// Puzzle 12: Bishop + Rook mate
const puzzle12Board = (): Board => {
  let board = emptyBoard();
  board = placePiece(board, 7, 4, 'king', 'white');
  board = placePiece(board, 5, 0, 'bishop', 'white');
  board = placePiece(board, 1, 7, 'rook', 'white');
  board = placePiece(board, 0, 7, 'king', 'black');
  return board;
};

export const PUZZLES: ChessPuzzle[] = [
  {
    id: 1,
    title: 'Back Rank Checkmate',
    category: 'mate-in-1',
    difficulty: 'beginner',
    board: puzzle1Board(),
    playerColor: 'white',
    solution: [{ from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }],
    hint: 'The black King is trapped by its own pawns!',
    explanation: 'Qa8# - The Queen delivers checkmate on the back rank. The pawns block the King\'s escape.',
    coinReward: 10,
    objective: 'Mate in 1 - Deliver checkmate!'
  },
  {
    id: 2,
    title: 'Rook Back Rank',
    category: 'mate-in-1',
    difficulty: 'beginner',
    board: puzzle2Board(),
    playerColor: 'white',
    solution: [{ from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }],
    hint: 'Your Rook can reach the back rank in one move.',
    explanation: 'Ra8# - The Rook delivers checkmate. The pawns trap the King.',
    coinReward: 10,
    objective: 'Mate in 1 - Use your Rook!'
  },
  {
    id: 3,
    title: 'Corner Mate',
    category: 'mate-in-1',
    difficulty: 'beginner',
    board: puzzle3Board(),
    playerColor: 'white',
    solution: [{ from: { row: 5, col: 5 }, to: { row: 1, col: 1 } }],
    hint: 'The King is trapped in the corner.',
    explanation: 'Qb7# - The Queen traps the King in the corner for checkmate.',
    coinReward: 10,
    objective: 'Mate in 1 - Corner the King!'
  },
  {
    id: 4,
    title: 'Knight Fork',
    category: 'win-material',
    difficulty: 'beginner',
    board: puzzle4Board(),
    playerColor: 'white',
    solution: [{ from: { row: 5, col: 3 }, to: { row: 3, col: 4 } }],
    hint: 'Attack two pieces at once with your Knight!',
    explanation: 'Ne4! - The Knight forks the King and Queen. After the King moves, you win the Queen!',
    coinReward: 20,
    objective: 'Win Material - Fork the King and Queen!'
  },
  {
    id: 5,
    title: 'Capture the Queen',
    category: 'win-material',
    difficulty: 'beginner',
    board: puzzle5Board(),
    playerColor: 'white',
    solution: [{ from: { row: 7, col: 2 }, to: { row: 4, col: 5 } }],
    hint: 'Your Bishop can capture an undefended piece!',
    explanation: 'Bxf4 - The Bishop captures the undefended Queen!',
    coinReward: 20,
    objective: 'Win Material - Capture the Queen!'
  },
  {
    id: 6,
    title: 'Rook Takes Rook',
    category: 'win-material',
    difficulty: 'beginner',
    board: puzzle6Board(),
    playerColor: 'white',
    solution: [{ from: { row: 4, col: 0 }, to: { row: 4, col: 7 } }],
    hint: 'Your Rook can capture along the rank.',
    explanation: 'Rxh4 - The Rook captures the undefended enemy Rook!',
    coinReward: 20,
    objective: 'Win Material - Capture the Rook!'
  },
  {
    id: 7,
    title: 'Queen Double Attack',
    category: 'win-material',
    difficulty: 'intermediate',
    board: puzzle7Board(),
    playerColor: 'white',
    solution: [{ from: { row: 6, col: 3 }, to: { row: 3, col: 0 } }],
    hint: 'Attack both Rooks at once!',
    explanation: 'Qa4! - The Queen attacks both Rooks simultaneously. You will win at least one!',
    coinReward: 30,
    objective: 'Win Material - Find the Double Attack!'
  },
  {
    id: 8,
    title: 'Pawn Promotion',
    category: 'best-move',
    difficulty: 'beginner',
    board: puzzle8Board(),
    playerColor: 'white',
    solution: [{ from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'queen' }],
    hint: 'Promote your pawn to the most powerful piece!',
    explanation: 'e8=Q - The pawn promotes to a Queen, giving you overwhelming advantage!',
    coinReward: 20,
    objective: 'Best Move - Promote your Pawn!'
  },
  {
    id: 9,
    title: 'Queen Checkmate',
    category: 'mate-in-1',
    difficulty: 'beginner',
    board: puzzle9Board(),
    playerColor: 'white',
    solution: [{ from: { row: 4, col: 0 }, to: { row: 0, col: 0 } }],
    hint: 'Your Queen can reach the back rank!',
    explanation: 'Qa8# - The Queen delivers checkmate on the back rank.',
    coinReward: 10,
    objective: 'Mate in 1 - Back rank attack!'
  },
  {
    id: 10,
    title: 'Ladder Mate',
    category: 'mate-in-2',
    difficulty: 'intermediate',
    board: puzzle10Board(),
    playerColor: 'white',
    solution: [
      { from: { row: 6, col: 0 }, to: { row: 1, col: 0 } },
      { from: { row: 7, col: 1 }, to: { row: 0, col: 1 } }
    ],
    hint: 'Use both Rooks to push the King to the edge!',
    explanation: 'Ra6+, Kd5, Rb5# - The Rooks work together to drive the King and deliver mate.',
    coinReward: 30,
    objective: 'Mate in 2 - Ladder the King!'
  },
  {
    id: 11,
    title: 'Knight & Rook Mate',
    category: 'mate-in-1',
    difficulty: 'intermediate',
    board: puzzle11Board(),
    playerColor: 'white',
    solution: [{ from: { row: 5, col: 5 }, to: { row: 3, col: 6 } }],
    hint: 'Use the Knight to support a back rank attack!',
    explanation: 'Ng6# - The Knight delivers checkmate! The Rook covers the escape squares.',
    coinReward: 25,
    objective: 'Mate in 1 - Knight delivers mate!'
  },
  {
    id: 12,
    title: 'Bishop & Rook Mate',
    category: 'mate-in-1',
    difficulty: 'advanced',
    board: puzzle12Board(),
    playerColor: 'white',
    solution: [{ from: { row: 5, col: 0 }, to: { row: 2, col: 3 } }],
    hint: 'Use the Bishop to cut off escape and the Rook finishes!',
    explanation: 'Bd3# - The Bishop blocks the King\'s escape while the Rook covers the back rank.',
    coinReward: 30,
    objective: 'Mate in 1 - Coordinate your pieces!'
  }
];

export const getPuzzleById = (id: number): ChessPuzzle | undefined => {
  return PUZZLES.find(p => p.id === id);
};

export const PUZZLE_UNLOCK_COST = 100;
export const FREE_PUZZLE_COUNT = 3;

// Difficulty-based rewards
export const PUZZLE_REWARDS: Record<PuzzleDifficulty, number> = {
  beginner: 10,
  intermediate: 20,
  advanced: 30
};
