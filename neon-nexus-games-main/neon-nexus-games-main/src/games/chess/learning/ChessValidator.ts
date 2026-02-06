
import { Board, Position, Move, PieceType, PieceColor, getPieceMoves, makeMove, isInCheck, findKing, getLegalMoves } from '../chessLogic';
import { Lesson } from './lessonData';

/**
 * ChessValidator: The Step-by-Step Single Source of Truth
 */

export interface ValidationResult {
    valid: boolean;
    message?: string;
    failedCondition?: 'geometry' | 'path' | 'self-check' | 'objective' | 'lesson-constraint';
}

// Helper: Check if two positions are equal
const posEquals = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

// Helper: Get squares between two points (exclusive of endpoints)
// Returns null if not a straight line/diagonal
const getPathSquares = (from: Position, to: Position): Position[] | null => {
    const dRow = to.row - from.row;
    const dCol = to.col - from.col;
    const steps = Math.max(Math.abs(dRow), Math.abs(dCol));

    if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) {
        // Not linear or diagonal (Knight move or invalid)
        return null;
    }

    const rowStep = dRow === 0 ? 0 : dRow / steps;
    const colStep = dCol === 0 ? 0 : dCol / steps;

    const squares: Position[] = [];
    for (let i = 1; i < steps; i++) {
        squares.push({
            row: from.row + i * rowStep,
            col: from.col + i * colStep
        });
    }
    return squares;
};

export const ChessValidator = {

    // 1. Fundamental Geometric & Rule Validation
    validateCoreRules: (board: Board, move: Move, playerColor: PieceColor): ValidationResult => {

        const piece = board[move.from.row][move.from.col];
        if (!piece) return { valid: false, message: 'No piece at source square.' };
        if (piece.color !== playerColor) return { valid: false, message: 'Not your piece.' };

        // A. Geometry & Rule Check using getLegalMoves (Handles castling, en passant, etc.)
        const legalMoves = getLegalMoves(board, playerColor);
        const matchedMove = legalMoves.find(m =>
            posEquals(m.from, move.from) &&
            posEquals(m.to, move.to)
        );

        if (!matchedMove) {
            // It might be invalid geometry OR blocked
            // We can try to be more specific for feedback
            if (ChessValidator.isPathBlocked(board, move.from, move.to, piece.type)) {
                return { valid: false, message: 'Path is blocked.', failedCondition: 'path' };
            }
            return { valid: false, message: 'Invalid move for this piece.', failedCondition: 'geometry' };
        }

        // B. Self-Check is implicitly handled by getLegalMoves, but we can keep explicit check if we want specific messaging
        // However, getLegalMoves filters out self-check moves.
        // So validation is done.

        return { valid: true };

        // B. Self-Check Check
        const newBoard = makeMove(board, move);
        if (isInCheck(newBoard, playerColor)) {
            return { valid: false, message: 'You cannot move into check!', failedCondition: 'self-check' };
        }

        return { valid: true };
    },

    // 2. Path Blocking Check (Explicit)
    isPathBlocked: (board: Board, from: Position, to: Position, type: PieceType): boolean => {
        if (type === 'knight') return false; // Knights jump

        const path = getPathSquares(from, to);
        if (!path) return false; // Not a slide move, so "path" concept implies geometry mismatch which is handled elsewhere or is knight

        for (const pos of path) {
            if (board[pos.row][pos.col] !== null) {
                return true;
            }
        }
        return false;
    },

    // 3. Lesson Constraint Validation
    validateLessonConstraints: (lesson: Lesson, move: Move): ValidationResult => {

        // A. Allowed Pieces
        if (lesson.allowedPieces.length > 0) {
            if (!lesson.allowedPieces.includes(move.piece.type)) {
                return {
                    valid: false,
                    message: `In this lesson, you can only move: ${lesson.allowedPieces.join(', ')}`,
                    failedCondition: 'lesson-constraint'
                };
            }
        }

        // B. Specific Mode Validation
        if (lesson.mode === 'specific' && lesson.objective.acceptedMoves) {
            // We accept valid moves that match accepted moves
            // But we also might want to be "Smart" about *why* it's wrong (e.g. correct piece, wrong square)
            const isAccepted = lesson.objective.acceptedMoves.some(acc => {
                return posEquals(move.from, acc.from) && posEquals(move.to, acc.to);
            });

            if (!isAccepted) {
                // Check if it was geometric capture vs move issue?
                return { valid: false, message: lesson.hint, failedCondition: 'objective' };
            }
        }

        return { valid: true };
    },

    // 4. Advanced: Verify if a move actually blocks an attack
    // Useful for "Blocking Check" lessons
    validatesBlocking: (board: Board, move: Move, protectedPiecePos: Position): boolean => {
        // Find who is attacking the protected piece
        // calculating attackers is expensive, we assume the lesson knows/context implies it
        // For a robust system, we check if the move.to square is on the ray of ANY attacker.

        const enemyColor = move.piece.color === 'white' ? 'black' : 'white';

        // Find attackers loop
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const attacker = board[r][c];
                if (attacker && attacker.color === enemyColor) {
                    // Check if this piece attacks the protected piece
                    // And if the current move.to intercepts that ray

                    // Simple check: make the move, see if attack persists
                    // But the user wants "Geometric Logic"

                    const moves = getPieceMoves(board, { row: r, col: c });
                    const attacksTarget = moves.some(m => posEquals(m, protectedPiecePos));

                    if (attacksTarget) {
                        // This is an attacker.
                        // Does the move.to square lie on the path between attacker and target?
                        const path = getPathSquares({ row: r, col: c }, protectedPiecePos);
                        if (path && path.some(p => posEquals(p, move.to))) {
                            return true; // Yes, we moved into the line of fire
                        }
                    }
                }
            }
        }
        return false;
    },

    // 5. Sanity Check Generator (Run at startup)
    sanityCheckLesson: (lesson: Lesson): AuditResult[] => {
        const errors: AuditResult[] = [];
        const board = lesson.board; // initial state

        // A. Basic Lesson Structure Check
        // (Currently handled by TypeScript types mostly, but could check for missing titles etc)

        // B. Check if accepted moves are actually legal
        if (lesson.mode === 'specific' && lesson.objective.acceptedMoves) {
            lesson.objective.acceptedMoves.forEach((accMove, idx) => {
                const piece = board[accMove.from.row][accMove.from.col];

                if (!piece) {
                    errors.push({
                        lessonId: lesson.id,
                        status: 'INVALID',
                        reason: `Accepted move #${idx} starts from empty square.`,
                        failedMoveIndex: idx
                    });
                    return;
                }

                const moveObj: Move = { from: accMove.from, to: accMove.to, piece: piece };

                // Core rules
                const coreResult = ChessValidator.validateCoreRules(board, moveObj, lesson.playerColor);
                if (!coreResult.valid) {
                    errors.push({
                        lessonId: lesson.id,
                        status: 'INVALID',
                        reason: `Accepted move #${idx} is ILLEGAL: ${coreResult.message}`,
                        failedMoveIndex: idx
                    });
                }

                // Check if capture is intended but not present
                if (lesson.objective.type === 'capture') {
                    const target = board[accMove.to.row][accMove.to.col];
                    if (!target) {
                        errors.push({
                            lessonId: lesson.id,
                            status: 'INVALID',
                            reason: `Objective is capture but target square is empty.`,
                            failedMoveIndex: idx
                        });
                    }
                }
            });
        }

        // C. Check Move Sequence Consistency (if exists)
        if (lesson.moveSequence) {
            lesson.moveSequence.forEach((accMove, idx) => {
                // Simple existence check
                if (!board[accMove.from.row][accMove.from.col]) {
                    errors.push({
                        lessonId: lesson.id,
                        status: 'INVALID',
                        reason: `Sequence move #${idx} starts from empty square.`,
                        failedMoveIndex: idx
                    });
                }
                // Deeper simulation requires playing through the sequence, which we don't do here yet
                // But we could add that for V2
            });
        }

        return errors;
    }
};

export interface AuditResult {
    lessonId: number;
    status: 'VALID' | 'INVALID';
    reason: string;
    failedMoveIndex?: number;
}
