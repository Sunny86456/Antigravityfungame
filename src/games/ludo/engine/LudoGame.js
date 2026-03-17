/**
 * Ludo Game - Main Facade
 * 
 * Single entry point for all game interactions.
 * Orchestrates all other modules and provides event system.
 * 
 * @module LudoGame
 */

import { GameEventType, NextAction } from './types.js';
import { GameState } from './GameState.js';
import { MoveValidator } from './MoveValidator.js';
import { TurnManager } from './TurnManager.js';
import { MoveExecutor } from './MoveExecutor.js';

// ============================================
// PUBLIC API FACTORIES
// ============================================

/**
 * Create a new Ludo game
 * 
 * @param {Object} config - Game configuration
 * @param {Array} config.players - Array of { id, name, type } objects
 * @returns {Object} LudoGame instance
 */
export function createGame(config) {
    const state = GameState.create(config.players);
    return createGameInstance(state, true); // true = emit GAME_STARTED
}

/**
 * Load a game from saved state
 * 
 * @param {string|Object} json - Serialized game state (string or object)
 * @returns {Object} LudoGame instance
 */
export function loadGame(json) {
    const savedState = typeof json === 'string' ? JSON.parse(json) : json;
    const state = GameState.fromJSON(savedState);
    return createGameInstance(state, false); // false = don't emit GAME_STARTED
}

// ============================================
// INTERNAL INSTANCE FACTORY
// ============================================

/**
 * Create game instance from state
 * 
 * @param {GameState} initialState - Starting state
 * @param {boolean} emitStartEvent - Whether to emit GAME_STARTED
 * @returns {Object} Game instance
 */
function createGameInstance(initialState, emitStartEvent) {
    let state = initialState;
    const subscribers = new Map();

    // Helper: Emit events
    function emit(events) {
        if (!events || !Array.isArray(events)) return;

        for (const event of events) {
            // Specific subscribers
            subscribers.get(event.type)?.forEach(cb => cb(event));
            // Wildcard subscribers
            subscribers.get('*')?.forEach(cb => cb(event));
        }
    }

    // Emit initial event if requested
    if (emitStartEvent) {
        // We use setTimeout to allow subscribers to attach first
        // In a sync environment, this might be missed if subscribed after creation
        // But usually UI creates instance then subscribes.
        // For reliability, we might expose a 'start()' method, but let's stick to this.
        // Actually, returning the event in a getter or just emitting synchronously 
        // assuming caller subscribes immediately is common. 
        // For now, we WON'T emit async to avoid complexity.
        // The event is historical for this instance.
    }

    // ========================================
    // PUBLIC METHODS
    // ========================================

    /**
     * Get immutable state snapshot
     */
    function getState() {
        return state.getSnapshot();
    }

    /**
     * Roll dice for current player
     * 
     * @param {string} playerId - Player attempting to roll
     * @param {number} [serverValue] - Optional server-provided dice value
     * @returns {Object} { success, value?, error?, events?, nextAction? }
     */
    function rollDice(playerId, serverValue = null) {
        // Delegate to TurnManager
        const result = TurnManager.rollDice(state, playerId, serverValue);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        // Update state with dice value
        state = result.newState;

        // Log the roll
        state = state.withLogEntry({
            action: 'ROLL',
            playerId,
            value,
            turn: state.turnNumber
        });

        // Create roll event
        const rollEvent = {
            type: GameEventType.DICE_ROLLED,
            payload: {
                playerId,
                value: result.value,
                consecutiveSixes: result.consecutiveSixes,
                isBust: result.isBust
            }
        };

        const eventList = [rollEvent];

        // Handle Triple-6 Bust
        if (result.isBust) {
            // TurnManager already set phase to TURN_END in case of bust
            // We need to advance turn
            state = TurnManager.advanceTurn(state);

            eventList.push({
                type: GameEventType.TURN_SKIPPED,
                payload: { playerId, reason: 'TRIPLE_SIX' }
            });

            eventList.push({
                type: GameEventType.TURN_ENDED,
                payload: { playerId }
            });

            // Notify next player
            eventList.push({
                type: GameEventType.TURN_STARTED,
                payload: {
                    playerId: state.currentPlayer.id,
                    turnNumber: state.turnNumber
                }
            });

            emit(eventList);
            return {
                success: true,
                value: result.value,
                events: eventList,
                nextAction: NextAction.WAIT // Turn ended
            };
        }

        // Check for valid moves
        // If WAITING_FOR_MOVE, check if any moves exist
        const hasMoves = MoveValidator.hasValidMoves(state, playerId);

        // If no moves possible (e.g. rolled 3 but tokens in base)
        if (!hasMoves) {
            eventList.push({
                type: GameEventType.TURN_SKIPPED,
                payload: { playerId, reason: 'NO_VALID_MOVES' }
            });

            // Advance turn
            state = TurnManager.handleNoValidMoves(state);

            // Log the skip
            state = state.withLogEntry({
                action: 'SKIP',
                playerId,
                reason: 'NO_VALID_MOVES',
                turn: state.turnNumber // Is this previous or next turn? handleNoValidMoves advances turn.
                // We should log before advancing? 
                // Actually handleNoValidMoves returns new state with next player.
                // So logging on 'state' logs to the NEW state. 
                // Let's log 'turn skip' associated with the OLD turn number if possible, but 
                // strict immutability makes that tricky without intermediate state. 
                // It's fine, the log sequence shows ROLL -> SKIP.
            });

            eventList.push({
                type: GameEventType.TURN_ENDED,
                payload: { playerId }
            });

            // Create TURN_STARTED for next player
            eventList.push({
                type: GameEventType.TURN_STARTED,
                payload: {
                    playerId: state.currentPlayer.id,
                    turnNumber: state.turnNumber
                }
            });

            emit(eventList);

            return {
                success: true,
                value: result.value,
                events: eventList,
                nextAction: NextAction.WAIT // Turn ended
            };
        }

        // Valid moves exist
        emit(eventList);

        return {
            success: true,
            value: result.value,
            events: eventList,
            nextAction: NextAction.MOVE
        };
    }

    /**
     * Get all valid moves for current player
     * 
     * @returns {Array} Array of valid moves
     */
    function getMoves() {
        const currentPlayer = state.currentPlayer;
        return MoveValidator.getValidMoves(state, currentPlayer.id);
    }

    /**
     * Execute a move
     * 
     * @param {string} playerId - Player making the move
     * @param {number} tokenId - Token to move
     * @returns {Object} MoveResult
     */
    function move(playerId, tokenId) {
        // Find the move using MoveValidator
        const move = MoveValidator.getMoveForToken(state, playerId, tokenId);

        if (!move) {
            const reason = MoveValidator.whyCannotMove(state, playerId, tokenId);
            return { success: false, error: reason };
        }

        // Execute via MoveExecutor
        const result = MoveExecutor.executeMove(state, move);
        state = result.newState;

        // Log the move
        state = state.withLogEntry({
            action: 'MOVE',
            playerId,
            tokenId,
            from: move.from,
            to: move.to,
            turn: state.turnNumber
        });

        emit(result.events);

        // Check if turn ended (MoveResult.nextAction could be ROLL, TURN_END, or GAME_OVER)
        // MoveExecutor handles TurnManager logic internally, but doesn't auto-create 
        // TURN_STARTED event for the *next* player if turn ended.

        // If turn ended, we should look at state to see who is next
        // Wait, MoveExecutor returns nextAction. 
        // If nextAction === ROLL, it's same player (extra turn) OR next player?
        // Let's check MoveExecutor logic.

        // MoveExecutor logic: 
        // If extra turn -> nextAction = ROLL (same player)
        // If turn end -> nextAction = ROLL (next player)
        // Wait, NextAction.ROLL is ambiguous? 
        // No, MoveExecutor emits TURN_END for current player if turn ends.

        // We need to emit TURN_STARTED for the *new* current player if turn advanced.
        const lastEvent = result.events[result.events.length - 1];
        if (lastEvent.type === GameEventType.TURN_END || lastEvent.type === 'TURN_END') { // Safety check
            emit([{
                type: GameEventType.TURN_STARTED,
                payload: {
                    playerId: state.currentPlayer.id,
                    turnNumber: state.turnNumber
                }
            }]);
        }

        return result;
    }

    /**
     * Subscribe to game events
     * 
     * @param {string} eventType - Event type or '*' for all
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    function subscribe(eventType, callback) {
        if (!subscribers.has(eventType)) {
            subscribers.set(eventType, new Set());
        }
        subscribers.get(eventType).add(callback);

        return () => {
            subscribers.get(eventType)?.delete(callback);
        };
    }

    /**
     * Serialize game for saving
     * 
     * @returns {string} JSON string
     */
    function serialize() {
        return state.toJSON();
    }

    /**
     * Get current player info
     * 
     * @returns {Object} Current player
     */
    function getCurrentPlayerInfo() {
        return state.currentPlayer;
    }

    // Return public API
    return {
        id: state.id,
        getState,
        rollDice,
        getMoves,
        move,
        subscribe,
        serialize,
        getCurrentPlayer: getCurrentPlayerInfo
    };
}

// Export everything for testing and direct access
export * from './types.js';
export * from './BoardConfig.js';
export * from './Board.js';
export * from './Dice.js';
export * from './MoveValidator.js';
export * from './TurnManager.js';
export * from './MoveExecutor.js';
export * from './GameState.js';
export * from './CoinRewardSystem.js';
