/**
 * Ludo Type Definitions & Enums
 * 
 * Defines all enums and type constants used across the engine.
 * Pure JavaScript with JSDoc for IDE support.
 */

// ============================================
// RE-EXPORTS FROM GAMESTATE
// ============================================

// GamePhase and TokenState are defined in GameState.js to avoid circular deps
export { GamePhase, TokenState, PlayerType } from './GameState.js';

// ============================================
// ENUMS
// ============================================

/**
 * Player colors
 * @enum {string}
 */
export const PlayerColor = {
    RED: 'RED',
    GREEN: 'GREEN',
    YELLOW: 'YELLOW',
    BLUE: 'BLUE'
};

/**
 * Game event types
 * @enum {string}
 */
export const GameEventType = {
    GAME_STARTED: 'GAME_STARTED',
    TURN_STARTED: 'TURN_STARTED',
    DICE_ROLLED: 'DICE_ROLLED',
    TOKEN_MOVED: 'TOKEN_MOVED',
    TOKEN_ENTERED: 'TOKEN_ENTERED',
    TOKEN_CAPTURED: 'TOKEN_CAPTURED',
    TOKEN_FINISHED: 'TOKEN_FINISHED',
    EXTRA_TURN: 'EXTRA_TURN',
    TURN_SKIPPED: 'TURN_SKIPPED',
    PLAYER_FINISHED: 'PLAYER_FINISHED',
    GAME_ENDED: 'GAME_ENDED'
};

/**
 * Move result action - what should happen next
 * @enum {string}
 */
export const NextAction = {
    ROLL: 'ROLL',           // Player should roll dice
    MOVE: 'MOVE',           // Player should select a move
    WAIT: 'WAIT',           // Wait for other player
    GAME_OVER: 'GAME_OVER'  // Game has ended
};

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a new token
 * @param {number} id - Token index (0-3)
 * @param {string} playerId - Owner player ID
 * @param {string} color - Token color
 * @returns {Object} Token object
 */
export function createToken(id, playerId, color) {
    return {
        id,
        playerId,
        color,
        state: TokenState.BASE,
        position: -1
    };
}

/**
 * Create a new player
 * @param {string} id - Unique player ID
 * @param {string} name - Display name
 * @param {string} color - Player color
 * @param {string} type - HUMAN, AI, or REMOTE
 * @returns {Object} Player object
 */
export function createPlayer(id, name, color, type = PlayerType.HUMAN) {
    return {
        id,
        name,
        color,
        type,
        tokens: [
            createToken(0, id, color),
            createToken(1, id, color),
            createToken(2, id, color),
            createToken(3, id, color)
        ],
        finishedTokens: 0,
        isFinished: false
    };
}

/**
 * Create initial dice state
 * @returns {Object} Dice state
 */
export function createDiceState() {
    return {
        value: null,
        consecutiveSixes: 0,
        rolledBy: null
    };
}

/**
 * Create a move object
 * @param {Object} params - Move parameters
 * @returns {Object} Move object
 */
export function createMove({
    playerId,
    tokenId,
    fromState,
    fromPosition,
    toState,
    toPosition,
    diceValue,
    isCapture = false,
    capturedToken = null,
    isFinishing = false
}) {
    return {
        playerId,
        tokenId,
        from: { state: fromState, position: fromPosition },
        to: { state: toState, position: toPosition },
        diceValue,
        isCapture,
        capturedToken,
        isFinishing
    };
}
