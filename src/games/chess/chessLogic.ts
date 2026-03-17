// Chess piece types
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  promotion?: PieceType;
}

// Initial board setup
export const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Setup pieces
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  // Black pieces (top)
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black' };
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' };
    board[7][col] = { type: backRow[col], color: 'white' };
  }
  
  return board;
};

// Deep clone board
export const cloneBoard = (board: Board): Board => {
  return board.map(row => row.map(square => square ? { ...square } : null));
};

// Check if position is valid
export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
};

// Get all possible moves for a piece (without check validation)
export const getPieceMoves = (board: Board, pos: Position, enPassantTarget?: Position): Position[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  
  const moves: Position[] = [];
  const { type, color } = piece;
  
  const addMoveIfValid = (row: number, col: number, captureOnly = false, moveOnly = false) => {
    const newPos = { row, col };
    if (!isValidPosition(newPos)) return false;
    
    const target = board[row][col];
    
    if (captureOnly) {
      if (target && target.color !== color) {
        moves.push(newPos);
        return true;
      }
      return false;
    }
    
    if (moveOnly) {
      if (!target) {
        moves.push(newPos);
        return true;
      }
      return false;
    }
    
    if (!target) {
      moves.push(newPos);
      return true;
    } else if (target.color !== color) {
      moves.push(newPos);
      return false; // Can capture but can't continue
    }
    return false; // Blocked by own piece
  };
  
  switch (type) {
    case 'pawn': {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      
      // Forward move
      if (!board[pos.row + direction]?.[pos.col]) {
        moves.push({ row: pos.row + direction, col: pos.col });
        
        // Double move from start
        if (pos.row === startRow && !board[pos.row + 2 * direction]?.[pos.col]) {
          moves.push({ row: pos.row + 2 * direction, col: pos.col });
        }
      }
      
      // Captures
      for (const dc of [-1, 1]) {
        const capturePos = { row: pos.row + direction, col: pos.col + dc };
        if (isValidPosition(capturePos)) {
          const target = board[capturePos.row][capturePos.col];
          if (target && target.color !== color) {
            moves.push(capturePos);
          }
          // En passant
          if (enPassantTarget && capturePos.row === enPassantTarget.row && capturePos.col === enPassantTarget.col) {
            moves.push(capturePos);
          }
        }
      }
      break;
    }
    
    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        addMoveIfValid(pos.row + dr, pos.col + dc);
      }
      break;
    }
    
    case 'bishop': {
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(pos.row + dr * i, pos.col + dc * i)) break;
          if (board[pos.row + dr * i]?.[pos.col + dc * i]) break;
        }
      }
      break;
    }
    
    case 'rook': {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(pos.row + dr * i, pos.col + dc * i)) break;
          if (board[pos.row + dr * i]?.[pos.col + dc * i]) break;
        }
      }
      break;
    }
    
    case 'queen': {
      for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(pos.row + dr * i, pos.col + dc * i)) break;
          if (board[pos.row + dr * i]?.[pos.col + dc * i]) break;
        }
      }
      break;
    }
    
    case 'king': {
      for (const dr of [-1, 0, 1]) {
        for (const dc of [-1, 0, 1]) {
          if (dr === 0 && dc === 0) continue;
          addMoveIfValid(pos.row + dr, pos.col + dc);
        }
      }
      break;
    }
  }
  
  return moves;
};

// Find king position
export const findKing = (board: Board, color: PieceColor): Position | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

// Check if a square is under attack by enemy
export const isSquareAttacked = (board: Board, pos: Position, byColor: PieceColor): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getPieceMoves(board, { row, col });
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Check if color is in check
export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const enemyColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, enemyColor);
};

// Make a move on the board
export const makeMove = (board: Board, move: Move): Board => {
  const newBoard = cloneBoard(board);
  const piece = { ...move.piece, hasMoved: true };
  
  // Handle castling
  if (move.isCastling) {
    const row = move.from.row;
    if (move.isCastling === 'kingside') {
      newBoard[row][6] = piece;
      newBoard[row][4] = null;
      newBoard[row][5] = { ...newBoard[row][7]!, hasMoved: true };
      newBoard[row][7] = null;
    } else {
      newBoard[row][2] = piece;
      newBoard[row][4] = null;
      newBoard[row][3] = { ...newBoard[row][0]!, hasMoved: true };
      newBoard[row][0] = null;
    }
    return newBoard;
  }
  
  // Handle en passant
  if (move.isEnPassant) {
    const capturedRow = move.piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
    newBoard[capturedRow][move.to.col] = null;
  }
  
  // Handle promotion
  if (move.promotion) {
    newBoard[move.to.row][move.to.col] = { type: move.promotion, color: piece.color, hasMoved: true };
  } else {
    newBoard[move.to.row][move.to.col] = piece;
  }
  
  newBoard[move.from.row][move.from.col] = null;
  return newBoard;
};

// Get all legal moves for a color
export const getLegalMoves = (
  board: Board, 
  color: PieceColor, 
  enPassantTarget?: Position,
  includeCastling = true
): Move[] => {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      
      const from = { row, col };
      const pieceMoves = getPieceMoves(board, from, enPassantTarget);
      
      for (const to of pieceMoves) {
        const isEnPassant = piece.type === 'pawn' && 
          enPassantTarget && 
          to.row === enPassantTarget.row && 
          to.col === enPassantTarget.col;
        
        const move: Move = {
          from,
          to,
          piece,
          captured: board[to.row][to.col] || undefined,
          isEnPassant
        };
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
          for (const promo of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
            const promoMove = { ...move, promotion: promo };
            const newBoard = makeMove(board, promoMove);
            if (!isInCheck(newBoard, color)) {
              moves.push(promoMove);
            }
          }
        } else {
          const newBoard = makeMove(board, move);
          if (!isInCheck(newBoard, color)) {
            moves.push(move);
          }
        }
      }
    }
  }
  
  // Castling
  if (includeCastling && !isInCheck(board, color)) {
    const row = color === 'white' ? 7 : 0;
    const king = board[row][4];
    
    if (king && king.type === 'king' && !king.hasMoved) {
      // Kingside
      const kRook = board[row][7];
      if (kRook && kRook.type === 'rook' && !kRook.hasMoved) {
        if (!board[row][5] && !board[row][6]) {
          const enemyColor = color === 'white' ? 'black' : 'white';
          if (!isSquareAttacked(board, { row, col: 5 }, enemyColor) &&
              !isSquareAttacked(board, { row, col: 6 }, enemyColor)) {
            moves.push({
              from: { row, col: 4 },
              to: { row, col: 6 },
              piece: king,
              isCastling: 'kingside'
            });
          }
        }
      }
      
      // Queenside
      const qRook = board[row][0];
      if (qRook && qRook.type === 'rook' && !qRook.hasMoved) {
        if (!board[row][1] && !board[row][2] && !board[row][3]) {
          const enemyColor = color === 'white' ? 'black' : 'white';
          if (!isSquareAttacked(board, { row, col: 2 }, enemyColor) &&
              !isSquareAttacked(board, { row, col: 3 }, enemyColor)) {
            moves.push({
              from: { row, col: 4 },
              to: { row, col: 2 },
              piece: king,
              isCastling: 'queenside'
            });
          }
        }
      }
    }
  }
  
  return moves;
};

// Check for checkmate or stalemate
export const getGameState = (
  board: Board, 
  colorToMove: PieceColor,
  enPassantTarget?: Position
): 'playing' | 'checkmate' | 'stalemate' => {
  const legalMoves = getLegalMoves(board, colorToMove, enPassantTarget);
  
  if (legalMoves.length === 0) {
    if (isInCheck(board, colorToMove)) {
      return 'checkmate';
    }
    return 'stalemate';
  }
  
  return 'playing';
};

// Piece values for evaluation
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Position bonuses for pieces
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20]
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20]
];

// Evaluate board position
export const evaluateBoard = (board: Board): number => {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const multiplier = piece.color === 'white' ? 1 : -1;
      score += PIECE_VALUES[piece.type] * multiplier;
      
      // Position bonuses
      const r = piece.color === 'white' ? row : 7 - row;
      switch (piece.type) {
        case 'pawn':
          score += PAWN_TABLE[r][col] * multiplier;
          break;
        case 'knight':
          score += KNIGHT_TABLE[r][col] * multiplier;
          break;
        case 'bishop':
          score += BISHOP_TABLE[r][col] * multiplier;
          break;
        case 'king':
          score += KING_TABLE[r][col] * multiplier;
          break;
      }
    }
  }
  
  return score;
};

// Minimax with alpha-beta pruning
export const minimax = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  color: PieceColor,
  enPassantTarget?: Position
): { score: number; move?: Move } => {
  const gameState = getGameState(board, color, enPassantTarget);
  
  if (gameState === 'checkmate') {
    return { score: isMaximizing ? -Infinity : Infinity };
  }
  
  if (gameState === 'stalemate') {
    return { score: 0 };
  }
  
  if (depth === 0) {
    return { score: evaluateBoard(board) };
  }
  
  const moves = getLegalMoves(board, color, enPassantTarget);
  
  // Move ordering: captures and checks first
  moves.sort((a, b) => {
    const aValue = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const bValue = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    return bValue - aValue;
  });
  
  let bestMove: Move | undefined;
  const nextColor = color === 'white' ? 'black' : 'white';
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEnPassant = move.piece.type === 'pawn' && 
        Math.abs(move.from.row - move.to.row) === 2
          ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
          : undefined;
      
      const { score } = minimax(newBoard, depth - 1, alpha, beta, false, nextColor, newEnPassant);
      
      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEnPassant = move.piece.type === 'pawn' && 
        Math.abs(move.from.row - move.to.row) === 2
          ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
          : undefined;
      
      const { score } = minimax(newBoard, depth - 1, alpha, beta, true, nextColor, newEnPassant);
      
      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }
      
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    
    return { score: minEval, move: bestMove };
  }
};

// Get best AI move
export const getAIMove = (
  board: Board,
  color: PieceColor,
  difficulty: 'easy' | 'medium' | 'hard',
  enPassantTarget?: Position
): Move | null => {
  const depthMap = { easy: 2, medium: 3, hard: 4 };
  const depth = depthMap[difficulty];
  
  const isMaximizing = color === 'white';
  const { move } = minimax(board, depth, -Infinity, Infinity, isMaximizing, color, enPassantTarget);
  
  // Add some randomness for easy mode
  if (difficulty === 'easy' && Math.random() < 0.3) {
    const moves = getLegalMoves(board, color, enPassantTarget);
    if (moves.length > 0) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }
  
  return move || null;
};

// Convert position to algebraic notation
export const posToAlgebraic = (pos: Position): string => {
  const cols = 'abcdefgh';
  return `${cols[pos.col]}${8 - pos.row}`;
};

// Get move notation
export const getMoveNotation = (move: Move): string => {
  if (move.isCastling === 'kingside') return 'O-O';
  if (move.isCastling === 'queenside') return 'O-O-O';
  
  const pieceSymbols: Record<PieceType, string> = {
    king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: ''
  };
  
  let notation = pieceSymbols[move.piece.type];
  notation += posToAlgebraic(move.from);
  notation += move.captured ? 'x' : '-';
  notation += posToAlgebraic(move.to);
  
  if (move.promotion) {
    notation += `=${pieceSymbols[move.promotion]}`;
  }
  
  return notation;
};
