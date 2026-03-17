/**
 * Ludo Move Executor
 * 
 * EXECUTES a previously validated Move and returns new immutable GameState.
 * 
 * USES (READ-ONLY):
 * - GameState (via immutable transition methods)
 * - TurnManager (for extra turn/advance logic)
 * - Zone from Board (for state normalization)
 * 
 * ASSUMES:
 * - Move has already been validated by MoveValidator
 * - No re-validation is performed
 * 
 * DOES NOT:
 * - Validate moves
 * - Access DOM/Canvas
 * - Use randomness
 * - Modify locked modules
 * 
 * @module MoveExecutor
 */

import { GameState, GamePhase } from './GameState.js';
import { TurnManager } from './TurnManager.js';
import { Zone, POSITION_BASE, TOKENS_PER_PLAYER } from './BoardConfig.js';

// ============================================
// EVENT TYPES
// ============================================

/**
 * Event types emitted during move execution
 */
export const MoveEventType = Object.freeze({
    TOKEN_MOVED: 'TOKEN_MOVED',
    TOKEN_CAPTURED: 'TOKEN_CAPTURED',
    TOKEN_FINISHED: 'TOKEN_FINISHED',
    PLAYER_FINISHED: 'PLAYER_FINISHED',
    EXTRA_TURN: 'EXTRA_TURN',
    TURN_END: 'TURN_END',
    GAME_END: 'GAME_END'
});

/**
 * Next action indicators
 */
export const NextAction = Object.freeze({
    ROLL: 'ROLL',
    MOVE: 'MOVE',
    WAIT: 'WAIT',
    GAME_OVER: 'GAME_OVER'
});

// ============================================
// MOVE EXECUTOR CLASS
// ============================================

/**
 * MoveExecutor - Executes validated moves
 * 
 * All methods are static (no instance state)
 */
export class MoveExecutor {

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * Execute a validated move
     * 
     * This is the MAIN entry point for move execution.
     * 
     * ASSUMES: Move has been validated by MoveValidator
     * 
     * @param {GameState} state - Current immutable game state
     * @param {Move} move - Validated move to execute
     * @returns {MoveResult} Execution result with new state and events
     */
    static executeMove(state, move) {
        const events = [];
        let newState = state;

        // ========================================
        // 1. MOVE THE TOKEN
        // ========================================
        newState = MoveExecutor._moveToken(newState, move);
        events.push(MoveExecutor._createMoveEvent(move));

        // ========================================
        // 2. HANDLE CAPTURE
        // ========================================
        if (move.isCapture && move.capturedToken) {
            newState = MoveExecutor._executeCaptureInternal(newState, move.capturedToken);
            events.push(MoveExecutor._createCaptureEvent(move));
        }

        // ========================================
        // 3. HANDLE TOKEN FINISHING
        // ========================================
        if (move.isFinishing) {
            const finishResult = MoveExecutor._handleTokenFinish(newState, move);
            newState = finishResult.newState;
            events.push(...finishResult.events);
        }

        // ========================================
        // 4. RECORD LAST MOVE
        // ========================================
        newState = newState.withLastMove(move);

        // ========================================
        // 5. CHECK GAME END
        // ========================================
        if (TurnManager.isGameOver(newState)) {
            newState = TurnManager.finalizeGame(newState);
            events.push(MoveExecutor._createGameEndEvent(newState));

            return {
                success: true,
                newState,
                move,
                events,
                nextAction: NextAction.GAME_OVER
            };
        }

        // ========================================
        // 6. DETERMINE TURN FLOW
        // ========================================
        const turnResult = MoveExecutor._resolveTurnFlow(newState, move, events);

        return {
            success: true,
            newState: turnResult.newState,
            move,
            events: turnResult.events,
            nextAction: turnResult.nextAction
        };
    }

    // ============================================
    // INTERNAL: TOKEN MOVEMENT
    // ============================================

    /**
     * Move a token to its new position
     * 
     * @private
     * @param {GameState} state - Current state
     * @param {Move} move - Move to execute
     * @returns {GameState} New state with token moved
     */
    static _moveToken(state, move) {
        // Find player and token
        const playerIndex = state.players.findIndex(p => p.id === move.playerId);
        const player = state.players[playerIndex];
        const tokenIndex = player.tokens.findIndex(t => t.id === move.tokenId);

        // Create updated token
        const updatedToken = {
            ...player.tokens[tokenIndex],
            state: MoveExecutor._zoneToTokenState(move.to.zone),
            position: move.to.position
        };

        // Create updated tokens array
        const updatedTokens = [
            ...player.tokens.slice(0, tokenIndex),
            updatedToken,
            ...player.tokens.slice(tokenIndex + 1)
        ];

        // Create updated player
        const updatedPlayer = {
            ...player,
            tokens: updatedTokens
        };

        // Create updated players array
        const updatedPlayers = [
            ...state.players.slice(0, playerIndex),
            updatedPlayer,
            ...state.players.slice(playerIndex + 1)
        ];

        // Return new state via reconstruction
        return new GameState({
            ...state.getSnapshot(),
            players: updatedPlayers
        });
    }

    // ============================================
    // INTERNAL: CAPTURE EXECUTION
    // ============================================

    /**
     * Execute a capture - send captured token back to BASE
     * 
     * @private
     * @param {GameState} state - Current state
     * @param {Object} capturedToken - { playerId, tokenId }
     * @returns {GameState} New state with captured token in BASE
     */
    static _executeCaptureInternal(state, capturedToken) {
        // Find victim player and token
        const playerIndex = state.players.findIndex(p => p.id === capturedToken.playerId);
        const player = state.players[playerIndex];
        const tokenIndex = player.tokens.findIndex(t => t.id === capturedToken.tokenId);

        // Reset token to BASE
        const resetToken = {
            ...player.tokens[tokenIndex],
            state: 'BASE',  // Normalized state
            position: POSITION_BASE
        };

        // Create updated tokens array
        const updatedTokens = [
            ...player.tokens.slice(0, tokenIndex),
            resetToken,
            ...player.tokens.slice(tokenIndex + 1)
        ];

        // Create updated player
        const updatedPlayer = {
            ...player,
            tokens: updatedTokens
        };

        // Create updated players array
        const updatedPlayers = [
            ...state.players.slice(0, playerIndex),
            updatedPlayer,
            ...state.players.slice(playerIndex + 1)
        ];

        // Return new state
        return new GameState({
            ...state.getSnapshot(),
            players: updatedPlayers
        });
    }

    // ============================================
    // INTERNAL: FINISH HANDLING
    // ============================================

    /**
     * Handle a token finishing (reaching home)
     * 
     * @private
     * @param {GameState} state - Current state
     * @param {Move} move - Finishing move
     * @returns {Object} { newState, events }
     */
    static _handleTokenFinish(state, move) {
        const events = [];

        // Find player
        const playerIndex = state.players.findIndex(p => p.id === move.playerId);
        const player = state.players[playerIndex];

        // Increment finished tokens count
        const newFinishedCount = player.finishedTokens + 1;
        const isPlayerFinished = newFinishedCount >= TOKENS_PER_PLAYER;

        // Token finish event
        events.push({
            type: MoveEventType.TOKEN_FINISHED,
            payload: {
                playerId: move.playerId,
                tokenId: move.tokenId,
                finishedCount: newFinishedCount,
                totalTokens: TOKENS_PER_PLAYER
            }
        });

        // Update player
        let updatedPlayer = {
            ...player,
            finishedTokens: newFinishedCount
        };

        let newState = state;
        let newRankings = [...state.rankings];

        // If all tokens finished, mark player as finished
        if (isPlayerFinished) {
            updatedPlayer = {
                ...updatedPlayer,
                isFinished: true
            };
            newRankings.push(move.playerId);

            events.push({
                type: MoveEventType.PLAYER_FINISHED,
                payload: {
                    playerId: move.playerId,
                    rank: newRankings.length,
                    playerName: player.name
                }
            });
        }

        // Create updated players array
        const updatedPlayers = [
            ...state.players.slice(0, playerIndex),
            updatedPlayer,
            ...state.players.slice(playerIndex + 1)
        ];

        // Return new state
        newState = new GameState({
            ...state.getSnapshot(),
            players: updatedPlayers,
            rankings: newRankings
        });

        return { newState, events };
    }

    // ============================================
    // INTERNAL: TURN FLOW RESOLUTION
    // ============================================

    /**
     * Resolve turn flow after move execution
     * 
     * Determines:
     * - If extra turn is granted (6, capture, finish)
     * - Whether to advance to next player
     * 
     * @private
     * @param {GameState} state - Current state (after move)
     * @param {Move} move - Executed move
     * @param {Array} events - Events array to append to
     * @returns {Object} { newState, events, nextAction }
     */
    static _resolveTurnFlow(state, move, events) {
        const diceValue = move.diceValue;
        const wasCapture = move.isCapture;
        const wasFinish = move.isFinishing;
        const consecutiveSixes = state.dice.consecutiveSixes;

        // Check for extra turn
        const grantsExtraTurn = TurnManager.shouldGrantExtraTurn(
            diceValue,
            wasCapture,
            wasFinish,
            consecutiveSixes
        );

        if (grantsExtraTurn) {
            // Grant extra turn
            const reason = TurnManager.getExtraTurnReason(diceValue, wasCapture, wasFinish);

            events.push({
                type: MoveEventType.EXTRA_TURN,
                payload: {
                    playerId: move.playerId,
                    reason
                }
            });

            // Prepare state for extra turn (reset dice, keep player)
            const newState = TurnManager.prepareExtraTurn(state);

            return {
                newState,
                events,
                nextAction: NextAction.ROLL
            };
        }

        // No extra turn - advance to next player
        events.push({
            type: MoveEventType.TURN_END,
            payload: {
                playerId: move.playerId
            }
        });

        const newState = TurnManager.advanceTurn(state);

        return {
            newState,
            events,
            nextAction: NextAction.ROLL
        };
    }

    // ============================================
    // EVENT CREATORS
    // ============================================

    /**
     * Create TOKEN_MOVED event
     * @private
     */
    static _createMoveEvent(move) {
        return {
            type: MoveEventType.TOKEN_MOVED,
            payload: {
                playerId: move.playerId,
                tokenId: move.tokenId,
                from: move.from,
                to: move.to,
                diceValue: move.diceValue
            }
        };
    }

    /**
     * Create TOKEN_CAPTURED event
     * @private
     */
    static _createCaptureEvent(move) {
        return {
            type: MoveEventType.TOKEN_CAPTURED,
            payload: {
                capturedBy: {
                    playerId: move.playerId,
                    tokenId: move.tokenId
                },
                victim: move.capturedToken
            }
        };
    }

    /**
     * Create GAME_END event
     * @private
     */
    static _createGameEndEvent(state) {
        return {
            type: MoveEventType.GAME_END,
            payload: {
                rankings: state.rankings,
                winner: state.winner
            }
        };
    }

    // ============================================
    // UTILITY
    // ============================================

    /**
     * Convert Zone enum to token state string
     * 
     * Normalizes to GameState's token.state format
     * 
     * @private
     * @param {string} zone - Zone constant
     * @returns {string} Token state ('BASE', 'ACTIVE', 'HOME_PATH', 'FINISHED')
     */
    static _zoneToTokenState(zone) {
        const mapping = {
            [Zone.BASE]: 'BASE',
            [Zone.MAIN_TRACK]: 'ACTIVE',
            [Zone.HOME_PATH]: 'HOME_PATH',
            [Zone.FINISHED]: 'FINISHED'
        };
        return mapping[zone] || zone;
    }

    /**
     * Execute capture (public wrapper for testing)
     * 
     * @param {GameState} state - Current state
     * @param {Object} capturedToken - { playerId, tokenId }
     * @returns {GameState} New state
     */
    static executeCapture(state, capturedToken) {
        return MoveExecutor._executeCaptureInternal(state, capturedToken);
    }
}
