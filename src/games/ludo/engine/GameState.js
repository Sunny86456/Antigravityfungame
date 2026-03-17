/**
 * Ludo Game State
 * 
 * Immutable state container for the Ludo game.
 * All state changes return new instances - never mutate!
 * 
 * @module GameState
 */

import { COLORS, TOKENS_PER_PLAYER } from './BoardConfig.js';

// ============================================
// ENUMS
// ============================================

/**
 * Game phase state machine
 * Controls what actions are valid at any point
 */
export const GamePhase = Object.freeze({
    WAITING_FOR_ROLL: 'WAITING_FOR_ROLL',   // Current player must roll
    WAITING_FOR_MOVE: 'WAITING_FOR_MOVE',   // Current player must move
    TURN_END: 'TURN_END',                   // Turn is ending, advance player
    GAME_OVER: 'GAME_OVER'                  // Game finished
});

/**
 * Token state
 */
export const TokenState = Object.freeze({
    BASE: 'BASE',
    ACTIVE: 'ACTIVE',
    HOME_PATH: 'HOME_PATH',
    FINISHED: 'FINISHED'
});

/**
 * Player type
 */
export const PlayerType = Object.freeze({
    HUMAN: 'HUMAN',
    AI: 'AI',
    REMOTE: 'REMOTE'
});

// ============================================
// GAME STATE CLASS
// ============================================

/**
 * Immutable Game State
 * 
 * Never modify properties directly!
 * Use the provided methods that return new instances.
 */
export class GameState {
    /**
     * Create a new game state
     * 
     * @param {Object} config - Configuration object
     * @param {string} config.id - Unique game ID
     * @param {string} config.phase - Current game phase
     * @param {Array} config.players - Array of player objects
     * @param {number} config.currentPlayerIndex - Index of current player
     * @param {Object} config.dice - Dice state object
     * @param {number} config.turnNumber - Current turn number
     * @param {Array} config.rankings - Array of finished player IDs
     * @param {Object|null} config.lastMove - Last executed move
     */
    constructor({
        id,
        phase,
        players,
        currentPlayerIndex,
        dice,
        turnNumber,
        rankings,
        lastMove
    }) {
        // Freeze all properties to enforce immutability
        this.id = id;
        this.phase = phase;
        this.players = Object.freeze(players.map(p => this._freezePlayer(p)));
        this.currentPlayerIndex = currentPlayerIndex;
        this.dice = Object.freeze({ ...dice });
        this.turnNumber = turnNumber;
        this.rankings = Object.freeze([...rankings]);
        this.lastMove = lastMove ? Object.freeze({ ...lastMove }) : null;
        this.turnLog = Object.freeze([...(arguments[0].turnLog || [])]); // Add turnLog history

        // Freeze the instance itself
        Object.freeze(this);
    }

    /**
     * Deep freeze a player object
     * @private
     */
    _freezePlayer(player) {
        return Object.freeze({
            ...player,
            tokens: Object.freeze(player.tokens.map(t => Object.freeze({ ...t })))
        });
    }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create initial game state for new game
     * 
     * @param {Array} playerConfigs - Array of { id, name, type }
     * @returns {GameState} New game state
     * @throws {Error} If player count invalid
     */
    static create(playerConfigs) {
        // Validate player count
        if (playerConfigs.length < 2 || playerConfigs.length > 4) {
            throw new Error('Ludo requires 2-4 players');
        }

        // Create players with tokens
        const players = playerConfigs.map((config, index) => ({
            id: config.id,
            name: config.name,
            color: COLORS[index],
            type: config.type || PlayerType.HUMAN,
            tokens: GameState._createTokens(config.id, COLORS[index]),
            finishedTokens: 0,
            isFinished: false
        }));

        return new GameState({
            id: GameState._generateId(),
            phase: GamePhase.WAITING_FOR_ROLL,
            players,
            currentPlayerIndex: 0,
            dice: {
                value: null,
                consecutiveSixes: 0,
                rolledBy: null
            },
            turnNumber: 1,
            rankings: [],
            lastMove: null,
            turnLog: []
        });
    }

    /**
     * Create tokens for a player
     * @private
     */
    static _createTokens(playerId, color) {
        return Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => ({
            id: i,
            playerId,
            color,
            state: TokenState.BASE,
            position: -1
        }));
    }

    /**
     * Generate unique game ID
     * @private
     */
    static _generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `game-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Restore game state from serialized JSON
     * 
     * @param {Object|string} data - Serialized state
     * @returns {GameState} Restored state
     */
    static fromJSON(data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return new GameState(parsed);
    }

    // ============================================
    // GETTERS
    // ============================================

    /**
     * Get the current player
     * @returns {Object} Current player
     */
    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Get the winner (first in rankings)
     * @returns {string|null} Winner player ID
     */
    get winner() {
        return this.rankings.length > 0 ? this.rankings[0] : null;
    }

    /**
     * Check if game is over
     * @returns {boolean}
     */
    get isGameOver() {
        return this.phase === GamePhase.GAME_OVER;
    }

    // ============================================
    // STATE TRANSITIONS (Return new instances)
    // ============================================

    /**
     * Create new state with updated dice
     * 
     * @param {Object} newDice - New dice state
     * @returns {GameState} New state
     */
    withDice(newDice) {
        return new GameState({
            ...this._toPlainObject(),
            dice: { ...this.dice, ...newDice }
        });
    }

    /**
     * Create new state with updated phase
     * 
     * @param {string} newPhase - New phase
     * @returns {GameState} New state
     */
    withPhase(newPhase) {
        return new GameState({
            ...this._toPlainObject(),
            phase: newPhase
        });
    }

    /**
     * Create new state with next player
     * Skips finished players automatically
     * 
     * @returns {GameState} New state with next player
     */
    withNextPlayer() {
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        let attempts = 0;

        // Skip finished players
        while (this.players[nextIndex].isFinished && attempts < this.players.length) {
            nextIndex = (nextIndex + 1) % this.players.length;
            attempts++;
        }

        return new GameState({
            ...this._toPlainObject(),
            currentPlayerIndex: nextIndex,
            turnNumber: this.turnNumber + 1,
            dice: { value: null, consecutiveSixes: 0, rolledBy: null },
            phase: GamePhase.WAITING_FOR_ROLL
        });
    }

    /**
     * Create new state with updated player
     * 
     * @param {string} playerId - Player to update
     * @param {Object} updates - Updates to apply
     * @returns {GameState} New state
     */
    withUpdatedPlayer(playerId, updates) {
        const newPlayers = this.players.map(p =>
            p.id === playerId ? { ...p, ...updates } : p
        );

        return new GameState({
            ...this._toPlainObject(),
            players: newPlayers
        });
    }

    /**
     * Create new state with player added to rankings
     * 
     * @param {string} playerId - Player who finished
     * @returns {GameState} New state
     */
    withPlayerFinished(playerId) {
        const newRankings = [...this.rankings, playerId];
        const newPlayers = this.players.map(p =>
            p.id === playerId ? { ...p, isFinished: true } : p
        );

        // Check if game is over (only 1 player left)
        const activePlayers = newPlayers.filter(p => !p.isFinished);
        const isOver = activePlayers.length <= 1;

        return new GameState({
            ...this._toPlainObject(),
            players: newPlayers,
            rankings: newRankings,
            phase: isOver ? GamePhase.GAME_OVER : this.phase
        });
    }

    /**
     * Create new state with last move recorded
     * 
     * @param {Object} move - Move that was executed
     * @returns {GameState} New state
     */
    withLastMove(move) {
        return new GameState({
            ...this._toPlainObject(),
            lastMove: move
        });
    }

    /**
     * Append entry to turn log
     * @param {Object} entry - Log entry
     * @returns {GameState} New state
     */
    withLogEntry(entry) {
        return new GameState({
            ...this._toPlainObject(),
            turnLog: [...this.turnLog, { ...entry, timestamp: Date.now() }]
        });
    }

    // ============================================
    // SERIALIZATION
    // ============================================

    /**
     * Convert to plain object (for cloning/serialization)
     * @private
     */
    _toPlainObject() {
        return {
            id: this.id,
            phase: this.phase,
            players: this.players.map(p => ({
                ...p,
                tokens: p.tokens.map(t => ({ ...t }))
            })),
            currentPlayerIndex: this.currentPlayerIndex,
            dice: { ...this.dice },
            turnNumber: this.turnNumber,
            rankings: [...this.rankings],
            lastMove: this.lastMove ? { ...this.lastMove } : null,
            turnLog: [...(this.turnLog || [])]
        };
    }

    /**
     * Serialize to JSON string
     * @returns {string} JSON representation
     */
    toJSON() {
        return JSON.stringify(this._toPlainObject());
    }

    /**
     * Get a plain object snapshot (for UI)
     * @returns {Object} Plain object copy
     */
    getSnapshot() {
        return this._toPlainObject();
    }
}

