/**
 * Ludo Move Validator
 * 
 * Computes ALL legal moves for a player based on current game state.
 * 
 * USES (READ-ONLY):
 * - GameState (checks phase, dice, players, tokens)
 * - Board (calculates positions, checks safe cells)
 * 
 * DOES NOT:
 * - Mutate any state
 * - Execute moves
 * - Advance turns
 * - Emit events
 * 
 * DESIGN:
 * - Pure functions (deterministic, no side effects)
 * - Testable in isolation
 * - ES6 class with static methods
 * 
 * @module MoveValidator
 */

import { GamePhase } from './GameState.js';
import { Board } from './Board.js';
import { Zone, ENTRY_ROLL } from './BoardConfig.js';

// ============================================
// MOVE VALIDATOR CLASS
// ============================================

/**
 * MoveValidator - Computes legal moves
 * 
 * All methods are static (no instance state)
 */
export class MoveValidator {

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * Get all valid moves for a player
     * 
     * This is the MAIN entry point for move validation.
     * 
     * @param {GameState} state - Current immutable game state
     * @param {string} playerId - Player to compute moves for
     * @returns {Array<Move>} Array of valid moves (may be empty)
     */
    static getValidMoves(state, playerId) {
        // Validate phase - can only compute moves in WAITING_FOR_MOVE
        if (state.phase !== GamePhase.WAITING_FOR_MOVE) {
            return [];
        }

        // Find the player
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return [];
        }

        // Verify it's this player's turn
        if (state.currentPlayer.id !== playerId) {
            return [];
        }

        // Get dice value
        const diceValue = state.dice.value;
        if (diceValue === null) {
            return [];
        }

        // Compute moves for each token
        const moves = [];

        for (const token of player.tokens) {
            const move = MoveValidator._computeMoveForToken(token, diceValue, state);
            if (move !== null) {
                moves.push(move);
            }
        }

        return moves;
    }

    /**
     * Validate a specific move
     * 
     * @param {GameState} state - Current game state
     * @param {Object} move - Move to validate
     * @returns {boolean} True if move is valid
     */
    static isValidMove(state, move) {
        // Get all valid moves
        const validMoves = MoveValidator.getValidMoves(state, move.playerId);

        // Check if this move matches any valid move
        return validMoves.some(m =>
            m.playerId === move.playerId &&
            m.tokenId === move.tokenId &&
            m.to.zone === move.to.zone &&
            m.to.position === move.to.position
        );
    }

    /**
     * Check if a player has any valid moves
     * 
     * @param {GameState} state - Current game state
     * @param {string} playerId - Player to check
     * @returns {boolean} True if at least one move exists
     */
    static hasValidMoves(state, playerId) {
        return MoveValidator.getValidMoves(state, playerId).length > 0;
    }

    // ============================================
    // MOVE COMPUTATION
    // ============================================

    /**
     * Compute the move for a specific token
     * 
     * @private
     * @param {Object} token - Token to compute move for
     * @param {number} diceValue - Current dice value
     * @param {GameState} state - Game state (for capture detection)
     * @returns {Move|null} Move object or null if no valid move
     */
    static _computeMoveForToken(token, diceValue, state) {
        // Skip finished tokens
        if (token.state === Zone.FINISHED) {
            return null;
        }

        // Determine current zone (map token.state to Zone)
        const currentZone = MoveValidator._tokenStateToZone(token.state);

        // Use Board to calculate next position
        const moveResult = Board.calculateNextPosition({
            currentZone,
            currentPosition: token.position,
            diceValue,
            color: token.color
        });

        // If Board says invalid, no move
        if (!moveResult.isValidMove) {
            return null;
        }

        // Build the move object
        const move = MoveValidator._buildMoveObject(
            token,
            diceValue,
            currentZone,
            moveResult,
            state
        );

        return move;
    }

    /**
     * Build a complete Move object
     * 
     * @private
     */
    static _buildMoveObject(token, diceValue, fromZone, moveResult, state) {
        // Detect capture (only on MAIN_TRACK destinations)
        let isCapture = false;
        let capturedToken = null;

        if (moveResult.nextZone === Zone.MAIN_TRACK) {
            const captureInfo = MoveValidator._detectCapture(
                moveResult.nextPosition,
                token.color,
                state
            );
            isCapture = captureInfo.isCapture;
            capturedToken = captureInfo.capturedToken;
        }

        // Determine if this move finishes the token
        const isFinishing = moveResult.nextZone === Zone.FINISHED;

        return {
            playerId: token.playerId,
            tokenId: token.id,
            from: {
                zone: fromZone,
                position: token.position
            },
            to: {
                zone: moveResult.nextZone,
                position: moveResult.nextPosition
            },
            diceValue,
            isCapture,
            capturedToken,
            isFinishing
        };
    }

    // ============================================
    // CAPTURE DETECTION
    // ============================================

    /**
     * Detect if moving to a position would capture an opponent
     * 
     * RULES:
     * - Cannot capture on safe cells
     * - Cannot capture if multiple opponents are stacked (they protect each other)
     * - Can only capture single opponent tokens
     * 
     * @private
     * @param {number} targetPosition - Main track position
     * @param {string} attackerColor - Color of moving token
     * @param {GameState} state - Game state
     * @returns {Object} { isCapture: boolean, capturedToken: {...}|null }
     */
    static _detectCapture(targetPosition, attackerColor, state) {
        // Safe cells prevent all captures
        if (Board.isSafeCell(targetPosition)) {
            return { isCapture: false, capturedToken: null };
        }

        // Find all opponent tokens at this position
        const opponentsAtPosition = MoveValidator._findOpponentsAtPosition(
            targetPosition,
            attackerColor,
            state
        );

        // No opponents → no capture
        if (opponentsAtPosition.length === 0) {
            return { isCapture: false, capturedToken: null };
        }

        // Multiple opponents stacked → they protect each other, no capture
        // (Classic Ludo rule: stacked tokens are safe)
        if (opponentsAtPosition.length > 1) {
            return { isCapture: false, capturedToken: null };
        }

        // Single opponent → CAPTURE!
        const victim = opponentsAtPosition[0];
        return {
            isCapture: true,
            capturedToken: {
                playerId: victim.playerId,
                tokenId: victim.id,
                color: victim.color
            }
        };
    }

    /**
     * Find all opponent tokens at a main track position
     * 
     * @private
     * @param {number} position - Main track position
     * @param {excludeColor} excludeColor - Color to exclude (attacker)
     * @param {GameState} state - Game state
     * @returns {Array} Array of opponent tokens at position
     */
    static _findOpponentsAtPosition(position, excludeColor, state) {
        const opponents = [];

        for (const player of state.players) {
            // Skip the attacker's tokens
            if (player.color === excludeColor) {
                continue;
            }

            for (const token of player.tokens) {
                // Only check tokens on main track at the target position
                if (token.state === 'ACTIVE' && token.position === position) {
                    opponents.push(token);
                }
                // Also check using Zone enum (handle both naming conventions)
                if (token.state === Zone.MAIN_TRACK && token.position === position) {
                    opponents.push(token);
                }
            }
        }

        // Deduplicate (in case both checks matched)
        const seen = new Set();
        return opponents.filter(t => {
            const key = `${t.playerId}-${t.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Map token.state (from GameState) to Zone (from Board)
     * 
     * GameState uses: BASE, ACTIVE, HOME_PATH, FINISHED
     * Board uses: Zone.BASE, Zone.MAIN_TRACK, Zone.HOME_PATH, Zone.FINISHED
     * 
     * @private
     * @param {string} tokenState - Token state from GameState
     * @returns {string} Zone constant from Board
     */
    static _tokenStateToZone(tokenState) {
        const mapping = {
            'BASE': Zone.BASE,
            'ACTIVE': Zone.MAIN_TRACK,
            'HOME_PATH': Zone.HOME_PATH,
            'FINISHED': Zone.FINISHED
        };

        return mapping[tokenState] || tokenState;
    }

    /**
     * Get a filtered list of only movable tokens
     * 
     * Useful for UI to show which tokens can potentially move
     * 
     * @param {GameState} state - Game state
     * @param {string} playerId - Player ID
     * @returns {Array<number>} Array of token IDs that have valid moves
     */
    static getMovableTokenIds(state, playerId) {
        const moves = MoveValidator.getValidMoves(state, playerId);
        return moves.map(m => m.tokenId);
    }

    /**
     * Get move for a specific token
     * 
     * @param {GameState} state - Game state
     * @param {string} playerId - Player ID
     * @param {number} tokenId - Token ID
     * @returns {Move|null} Move for this token or null
     */
    static getMoveForToken(state, playerId, tokenId) {
        const moves = MoveValidator.getValidMoves(state, playerId);
        return moves.find(m => m.tokenId === tokenId) || null;
    }

    /**
     * Describe why a token cannot move
     * 
     * Useful for debugging and UI feedback
     * 
     * @param {GameState} state - Game state
     * @param {string} playerId - Player ID
     * @param {number} tokenId - Token ID
     * @returns {string} Reason why token cannot move
     */
    static whyCannotMove(state, playerId, tokenId) {
        // Check phase
        if (state.phase !== GamePhase.WAITING_FOR_MOVE) {
            return `Wrong phase: ${state.phase}`;
        }

        // Check turn
        if (state.currentPlayer.id !== playerId) {
            return 'Not your turn';
        }

        // Check dice
        const diceValue = state.dice.value;
        if (diceValue === null) {
            return 'Dice not rolled';
        }

        // Find token
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return 'Player not found';
        }

        const token = player.tokens.find(t => t.id === tokenId);
        if (!token) {
            return 'Token not found';
        }

        // Check finished
        if (token.state === 'FINISHED' || token.state === Zone.FINISHED) {
            return 'Token already finished';
        }

        // Check base without 6
        if ((token.state === 'BASE' || token.state === Zone.BASE) && diceValue !== ENTRY_ROLL) {
            return `Need ${ENTRY_ROLL} to leave base, rolled ${diceValue}`;
        }

        // Check board calculation
        const currentZone = MoveValidator._tokenStateToZone(token.state);
        const moveResult = Board.calculateNextPosition({
            currentZone,
            currentPosition: token.position,
            diceValue,
            color: token.color
        });

        if (!moveResult.isValidMove) {
            return moveResult.description;
        }

        return 'Move should be valid';
    }
}
