/**
 * Ludo Coin Reward System
 * 
 * Calculates coin rewards based on final game rankings.
 * 
 * RULES:
 * - 1st place: +50 coins
 * - 2nd place: +30 coins
 * - 3rd place: +10 coins
 * - 4th place: -20 coins (loss penalty)
 * 
 * USAGE:
 * Runs ONLY after game ends (GameState.phase === GAME_OVER).
 * 
 * @module CoinRewardSystem
 */

import { GameState, GamePhase } from './GameState.js';

// ============================================
// CONSTANTS
// ============================================

/**
 * Reward values for each rank position (0-indexed)
 * Rank 0 = 1st Place
 * Rank 1 = 2nd Place
 * etc.
 */
const RANK_REWARDS = {
    0: 50,   // 1st Place
    1: 30,   // 2nd Place
    2: 10,   // 3rd Place
    3: -20   // 4th Place
};

/**
 * Fallback penalty for last place in smaller games
 * If a player is last in a 2 or 3 player game, they get this penalty
 * UNLESS their explicit rank reward is defined above and applicable
 */
const LAST_PLACE_PENALTY = -20;

// ============================================
// COIN REWARD SYSTEM CLASS
// ============================================

/**
 * CoinRewardSystem - Calculates post-game rewards
 * 
 * Pure logic, no side effects.
 */
export class CoinRewardSystem {

    /**
     * Calculate rewards for a finished game
     * 
     * @param {GameState} state - Final game state
     * @returns {Object} CoinRewardResult
     */
    static calculateRewards(state) {
        // 1. Validate Game State
        if (!state) {
            throw new Error('GameState is required');
        }

        if (state.phase !== GamePhase.GAME_OVER) {
            throw new Error(`Cannot calculate rewards. Game phase is ${state.phase}, expected GAME_OVER`);
        }

        if (!state.rankings || !Array.isArray(state.rankings)) {
            throw new Error('Invalid rankings in GameState');
        }

        const playerCount = state.players.length;

        // Rankings array contains player IDs in finish order
        // In a 2-player game: [winnerId, loserId]
        // In a 4-player game: [1stId, 2ndId, 3rdId, 4thId]

        // NOTE: GameState.rankings might only contain players who explicitly finished.
        // We must ensure ALL players are ranked.
        // TurnManager.finalizeGame() should have handled this, but we double-check here.
        const finalRankings = CoinRewardSystem._ensureCompleteRankings(state);

        // 2. Calculate Rewards
        const rewards = finalRankings.map((playerId, index) => {
            const rank = index + 1; // 1-based rank (1st, 2nd...)
            const coinsDelta = CoinRewardSystem._getRewardForRank(index, playerCount);

            return {
                playerId,
                rank,
                coinsDelta
            };
        });

        return {
            gameId: state.id,
            rewards
        };
    }

    // ============================================
    // INTERNAL HELPERS
    // ============================================

    /**
     * Get reward value for a specific rank index
     * 
     * @private
     * @param {number} rankIndex - 0-based rank index (0 = 1st)
     * @param {number} totalPlayers - Total number of players in game
     * @returns {number} Coins delta
     */
    static _getRewardForRank(rankIndex, totalPlayers) {
        // Special handling for Last Place
        // In any game size, the last player gets the penalty (-20)
        // 
        // 2-Player Game:
        // Rank 0 (1st): +50
        // Rank 1 (2nd): -20 (Last place)
        //
        // 3-Player Game:
        // Rank 0 (1st): +50
        // Rank 1 (2nd): +30
        // Rank 2 (3rd): -20 (Last place)
        //
        // 4-Player Game:
        // Rank 0 (1st): +50
        // Rank 1 (2nd): +30
        // Rank 2 (3rd): +10
        // Rank 3 (4th): -20 (Last place)

        const isLastPlace = rankIndex === totalPlayers - 1;

        if (isLastPlace) {
            return LAST_PLACE_PENALTY;
        }

        // Return standard reward for this rank, or 0 if undefined
        return RANK_REWARDS[rankIndex] || 0;
    }

    /**
     * Ensure rankings array includes all players
     * If a player disconnected or didn't finish, they go to the end
     * 
     * @private
     * @param {GameState} state - Game state
     * @returns {Array<string>} Complete array of player IDs
     */
    static _ensureCompleteRankings(state) {
        const existingRankings = [...state.rankings];
        const rankedSet = new Set(existingRankings);

        // Find unranked players
        const unrankedPlayers = state.players
            .filter(p => !rankedSet.has(p.id))
            .map(p => p.id);

        // Append unranked players to the end
        // (Order among unranked is arbitrary here, usually by turn order or score)
        return [...existingRankings, ...unrankedPlayers];
    }
}
