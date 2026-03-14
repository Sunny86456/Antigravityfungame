/**
 * Ludo Turn Manager
 * 
 * Controls turn flow, phase transitions, and enforces game rules.
 * Works with immutable GameState - all methods return new states.
 * 
 * @module TurnManager
 */

import { GamePhase } from './GameState.js';
import { MAX_CONSECUTIVE_SIXES, DICE_MIN, DICE_MAX } from './BoardConfig.js';

// ============================================
// TURN MANAGER CLASS
// ============================================

/**
 * Turn Manager
 * 
 * Handles:
 * - Dice roll validation and execution
 * - Phase transitions
 * - Extra turn rules
 * - Triple-6 penalty
 * - Player turn advancement
 */
export class TurnManager {

    // ============================================
    // DICE ROLL VALIDATION
    // ============================================

    /**
     * Check if a player can roll dice
     * HARD LOCK: Validates all preconditions
     * 
     * @param {GameState} state - Current game state
     * @param {string} playerId - Player attempting to roll
     * @returns {Object} { canRoll: boolean, reason?: string }
     */
    static canRollDice(state, playerId) {
        // 1. Check phase
        if (state.phase !== GamePhase.WAITING_FOR_ROLL) {
            return {
                canRoll: false,
                reason: `Cannot roll in phase: ${state.phase}. Expected: WAITING_FOR_ROLL`
            };
        }

        // 2. Check if it's this player's turn
        const currentPlayer = state.currentPlayer;
        if (currentPlayer.id !== playerId) {
            return {
                canRoll: false,
                reason: `Not your turn. Current player: ${currentPlayer.name} (${currentPlayer.id})`
            };
        }

        // 3. Check if player has finished
        if (currentPlayer.isFinished) {
            return {
                canRoll: false,
                reason: 'You have already finished the game'
            };
        }

        // 4. Check if dice already rolled
        if (state.dice.value !== null) {
            return {
                canRoll: false,
                reason: 'Dice already rolled. Must move first.'
            };
        }

        return { canRoll: true };
    }

    // ============================================
    // DICE ROLL EXECUTION
    // ============================================

    /**
     * Execute a dice roll
     * 
     * @param {GameState} state - Current game state
     * @param {string} playerId - Player rolling
     * @param {number} [serverValue] - Optional server-provided value (for online)
     * @returns {Object} { success, newState?, value?, error?, isBust? }
     */
    static rollDice(state, playerId, serverValue = null) {
        // Validate roll
        const validation = TurnManager.canRollDice(state, playerId);
        if (!validation.canRoll) {
            return { success: false, error: validation.reason };
        }

        // Get dice value
        const value = serverValue !== null
            ? serverValue
            : TurnManager._rollLocal();

        // Validate value
        if (!TurnManager._isValidDiceValue(value)) {
            return { success: false, error: `Invalid dice value: ${value}` };
        }

        // Calculate consecutive sixes
        const previousSixes = state.dice.consecutiveSixes;
        const consecutiveSixes = value === 6 ? previousSixes + 1 : 0;

        // Update dice state
        let newState = state.withDice({
            value,
            consecutiveSixes,
            rolledBy: playerId
        });

        // Check for triple-6 bust
        if (consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
            return TurnManager._handleTripleSixBust(newState, value);
        }

        // Transition to WAITING_FOR_MOVE phase
        // Note: Caller should check if any moves exist and handle accordingly
        newState = newState.withPhase(GamePhase.WAITING_FOR_MOVE);

        return {
            success: true,
            newState,
            value,
            consecutiveSixes,
            isBust: false
        };
    }

    /**
     * Handle triple-6 penalty
     * @private
     */
    static _handleTripleSixBust(state, value) {
        // Set phase to TURN_END
        let newState = state.withPhase(GamePhase.TURN_END);

        return {
            success: true,
            newState,
            value,
            consecutiveSixes: MAX_CONSECUTIVE_SIXES,
            isBust: true,
            bustReason: 'TRIPLE_SIX'
        };
    }

    /**
     * Generate local random dice roll
     * @private
     */
    static _rollLocal() {
        return Math.floor(Math.random() * DICE_MAX) + DICE_MIN;
    }

    /**
     * Validate dice value
     * @private
     */
    static _isValidDiceValue(value) {
        return Number.isInteger(value) && value >= DICE_MIN && value <= DICE_MAX;
    }

    // ============================================
    // MOVE VALIDATION
    // ============================================

    /**
     * Check if a player can make a move
     * 
     * @param {GameState} state - Current game state
     * @param {string} playerId - Player attempting to move
     * @returns {Object} { canMove: boolean, reason?: string }
     */
    static canMove(state, playerId) {
        // 1. Check phase
        if (state.phase !== GamePhase.WAITING_FOR_MOVE) {
            return {
                canMove: false,
                reason: `Cannot move in phase: ${state.phase}. Expected: WAITING_FOR_MOVE`
            };
        }

        // 2. Check if it's this player's turn
        if (state.currentPlayer.id !== playerId) {
            return {
                canMove: false,
                reason: 'Not your turn'
            };
        }

        // 3. Check if dice was rolled
        if (state.dice.value === null) {
            return {
                canMove: false,
                reason: 'Must roll dice first'
            };
        }

        return { canMove: true };
    }

    // ============================================
    // EXTRA TURN LOGIC
    // ============================================

    /**
     * Determine if player gets extra turn
     * 
     * @param {number} diceValue - The dice roll
     * @param {boolean} wasCapture - Did move capture opponent
     * @param {boolean} wasFinish - Did token finish
     * @param {number} consecutiveSixes - Current consecutive sixes
     * @returns {boolean} True if extra turn granted
     */
    static shouldGrantExtraTurn(diceValue, wasCapture, wasFinish, consecutiveSixes) {
        // No extra turn on triple-6 bust
        if (consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
            return false;
        }

        // Extra turn conditions:
        // 1. Rolled a 6
        // 2. Captured opponent token
        // 3. Token reached home (finished)
        return diceValue === 6 || wasCapture || wasFinish;
    }

    /**
     * Get the reason for extra turn
     * 
     * @param {number} diceValue - The dice roll
     * @param {boolean} wasCapture - Did move capture opponent
     * @param {boolean} wasFinish - Did token finish
     * @returns {string|null} Reason or null
     */
    static getExtraTurnReason(diceValue, wasCapture, wasFinish) {
        if (diceValue === 6) return 'ROLLED_SIX';
        if (wasCapture) return 'CAPTURED_OPPONENT';
        if (wasFinish) return 'TOKEN_FINISHED';
        return null;
    }

    // ============================================
    // TURN ADVANCEMENT
    // ============================================

    /**
     * Advance to the next turn
     * Automatically skips finished players
     * 
     * @param {GameState} state - Current game state
     * @returns {GameState} New state with next player
     */
    static advanceTurn(state) {
        return state.withNextPlayer();
    }

    /**
     * Handle no valid moves scenario
     * Advances turn when no moves are available
     * 
     * @param {GameState} state - Current game state
     * @returns {GameState} New state
     */
    static handleNoValidMoves(state) {
        return state
            .withPhase(GamePhase.TURN_END)
            .withNextPlayer();
    }

    /**
     * Prepare state for extra turn
     * Resets dice but preserves consecutive sixes count
     * 
     * @param {GameState} state - Current game state
     * @returns {GameState} New state ready for extra roll
     */
    static prepareExtraTurn(state) {
        return state.withDice({
            value: null,
            consecutiveSixes: state.dice.consecutiveSixes,
            rolledBy: null
        }).withPhase(GamePhase.WAITING_FOR_ROLL);
    }

    // ============================================
    // GAME END
    // ============================================

    /**
     * Check if game should end
     * Game ends when only one player remains unfinished
     * 
     * @param {GameState} state - Current game state
     * @returns {boolean} True if game is over
     */
    static isGameOver(state) {
        const activePlayers = state.players.filter(p => !p.isFinished);
        return activePlayers.length <= 1;
    }

    /**
     * Finalize game (set phase to GAME_OVER)
     * 
     * @param {GameState} state - Current game state
     * @returns {GameState} Final state
     */
    static finalizeGame(state) {
        // Add any remaining players to rankings
        let newState = state;
        for (const player of state.players) {
            if (!state.rankings.includes(player.id)) {
                newState = newState.withPlayerFinished(player.id);
            }
        }
        return newState.withPhase(GamePhase.GAME_OVER);
    }

    // ============================================
    // UTILITY
    // ============================================

    /**
     * Get current player's possible actions
     * 
     * @param {GameState} state - Current game state
     * @returns {Object} { canRoll, canMove, mustWait }
     */
    static getPlayerActions(state) {
        const playerId = state.currentPlayer.id;

        return {
            canRoll: TurnManager.canRollDice(state, playerId).canRoll,
            canMove: TurnManager.canMove(state, playerId).canMove,
            mustWait: state.phase === GamePhase.TURN_END ||
                state.phase === GamePhase.GAME_OVER
        };
    }

    /**
     * Get phase description (for logging/UI)
     * 
     * @param {string} phase - Game phase
     * @returns {string} Human-readable description
     */
    static getPhaseDescription(phase) {
        const descriptions = {
            [GamePhase.WAITING_FOR_ROLL]: 'Waiting for dice roll',
            [GamePhase.WAITING_FOR_MOVE]: 'Waiting for token selection',
            [GamePhase.TURN_END]: 'Turn ending',
            [GamePhase.GAME_OVER]: 'Game over'
        };
        return descriptions[phase] || 'Unknown phase';
    }
}
