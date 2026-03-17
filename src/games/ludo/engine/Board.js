/**
 * Ludo Board
 * 
 * Handles ONLY board topology and position mathematics.
 * 
 * INDEPENDENT OF:
 * - GameState
 * - TurnManager  
 * - Move validation
 * - Captures
 * - UI / Canvas
 * 
 * DESIGN:
 * - Pure functions (deterministic, no side effects)
 * - Testable in isolation
 * - ES6 class with static methods
 * 
 * @module Board
 */

// ============================================
// CONSTANTS (Imported from Config)
// ============================================

import {
    MAIN_TRACK_SIZE,
    HOME_PATH_LENGTH,
    COLORS,
    Zone,
    POSITION_BASE,
    POSITION_FINISHED,
    START_POSITIONS,
    HOME_ENTRANCES,
    SAFE_CELLS,
    ENTRY_ROLL
} from './BoardConfig.js';

export {
    MAIN_TRACK_SIZE,
    HOME_PATH_LENGTH,
    COLORS,
    Zone,
    POSITION_BASE,
    POSITION_FINISHED,
    START_POSITIONS,
    HOME_ENTRANCES,
    SAFE_CELLS,
    ENTRY_ROLL
};

// ============================================
// BOARD CLASS
// ============================================

/**
 * Board - Pure utility class for position calculations
 * 
 * All methods are static (no instance state)
 */
export class Board {

    // ============================================
    // BASIC GETTERS
    // ============================================

    /**
     * Get the starting position for a color
     * This is where a token enters the main track after rolling 6
     * 
     * @param {string} color - Player color (RED/GREEN/YELLOW/BLUE)
     * @returns {number} Main track position (0-51)
     */
    static getStartPosition(color) {
        if (!START_POSITIONS.hasOwnProperty(color)) {
            throw new Error(`Invalid color: ${color}`);
        }
        return START_POSITIONS[color];
    }

    /**
     * Get the home entrance position for a color
     * Token must be on this cell to enter home path on next move
     * 
     * @param {string} color - Player color
     * @returns {number} Main track position (0-51)
     */
    static getHomeEntrance(color) {
        if (!HOME_ENTRANCES.hasOwnProperty(color)) {
            throw new Error(`Invalid color: ${color}`);
        }
        return HOME_ENTRANCES[color];
    }

    // ============================================
    // POSITION TYPE CHECKS
    // ============================================

    /**
     * Check if a position is a safe cell (capture-proof)
     * 
     * @param {number} position - Main track position
     * @returns {boolean} True if safe
     */
    static isSafeCell(position) {
        return SAFE_CELLS.includes(position);
    }

    /**
     * Check if position is on main track
     * 
     * @param {number} position - Position value
     * @returns {boolean} True if 0-51
     */
    static isMainTrackPosition(position) {
        return Number.isInteger(position) && position >= 0 && position < MAIN_TRACK_SIZE;
    }

    /**
     * Check if position is in home path
     * 
     * @param {number} position - Position value
     * @returns {boolean} True if 0-5
     */
    static isHomePathPosition(position) {
        return Number.isInteger(position) && position >= 0 && position < HOME_PATH_LENGTH;
    }

    /**
     * Check if position represents BASE
     * 
     * @param {number} position - Position value
     * @returns {boolean} True if -1
     */
    static isBasePosition(position) {
        return position === POSITION_BASE;
    }

    // ============================================
    // RELATIVE POSITION MATH
    // ============================================

    /**
     * Convert absolute position to relative (from color's perspective)
     * 
     * Each color sees the board "starting" from their start position.
     * - RED's relative 0 = absolute 0
     * - GREEN's relative 0 = absolute 13
     * - etc.
     * 
     * This is crucial for determining when a token should enter home path.
     * 
     * @param {number} absolutePos - Absolute main track position (0-51)
     * @param {string} color - Player color
     * @returns {number} Relative position (0-51 from color's perspective)
     */
    static getRelativePosition(absolutePos, color) {
        const start = Board.getStartPosition(color);
        // Wrap around the circular track
        return (absolutePos - start + MAIN_TRACK_SIZE) % MAIN_TRACK_SIZE;
    }

    /**
     * Convert relative position back to absolute
     * 
     * @param {number} relativePos - Relative position
     * @param {string} color - Player color
     * @returns {number} Absolute main track position (0-51)
     */
    static getAbsolutePosition(relativePos, color) {
        const start = Board.getStartPosition(color);
        return (relativePos + start) % MAIN_TRACK_SIZE;
    }

    /**
     * Get the number of steps from start to home entrance (in relative terms)
     * A token must travel exactly 51 steps on main track to reach home entrance
     * (One less than full lap - don't pass your own start)
     * 
     * @returns {number} Always 51
     */
    static getStepsToHomeEntrance() {
        // In relative terms, home entrance is always at position 50
        // (51 steps from start at relative 0, landing on relative 50)
        // Wait, let me recalculate:
        // RED: starts at 0, home entrance at 50 → 50 steps
        // GREEN: starts at 13, home entrance at 11 → 51 steps (13→...→51→0→...→11)
        // Actually: each color travels 50 cells on main track before home entrance
        return 50;
    }

    // ============================================
    // MOVEMENT CALCULATIONS
    // ============================================

    /**
     * Calculate next position after moving
     * 
     * This is the CORE movement function.
     * 
     * HANDLES:
     * - Movement from BASE (requires dice = 6)
     * - Movement on MAIN_TRACK
     * - Transition from MAIN_TRACK to HOME_PATH
     * - Movement within HOME_PATH
     * - Exact landing on FINISHED
     * - Overshooting HOME_PATH (invalid)
     * - Already FINISHED (no movement)
     * 
     * @param {Object} params - Movement parameters
     * @param {string} params.currentZone - Current zone (BASE/MAIN_TRACK/HOME_PATH/FINISHED)
     * @param {number} params.currentPosition - Current position in zone
     * @param {number} params.diceValue - Dice roll (1-6)
     * @param {string} params.color - Token color
     * @returns {Object} Movement result
     */
    static calculateNextPosition({ currentZone, currentPosition, diceValue, color }) {
        // Validate dice value
        if (!Number.isInteger(diceValue) || diceValue < 1 || diceValue > 6) {
            return Board._invalidMove('Invalid dice value');
        }

        // Route to appropriate handler based on current zone
        switch (currentZone) {
            case Zone.BASE:
                return Board._calculateFromBase(diceValue, color);

            case Zone.MAIN_TRACK:
                return Board._calculateFromMainTrack(currentPosition, diceValue, color);

            case Zone.HOME_PATH:
                return Board._calculateFromHomePath(currentPosition, diceValue);

            case Zone.FINISHED:
                return Board._invalidMove('Token already finished');

            default:
                return Board._invalidMove(`Unknown zone: ${currentZone}`);
        }
    }

    // ============================================
    // ZONE-SPECIFIC MOVEMENT HANDLERS
    // ============================================

    /**
     * Calculate movement from BASE
     * 
     * RULE: Only a 6 can bring a token out of base
     * 
     * @private
     * @param {number} diceValue - Dice roll
     * @param {string} color - Token color
     * @returns {Object} Movement result
     */
    static _calculateFromBase(diceValue, color) {
        // Only 6 can enter the board
        if (diceValue !== ENTRY_ROLL) {
            return Board._invalidMove('Need 6 to leave base');
        }

        const startPosition = Board.getStartPosition(color);

        return {
            isValidMove: true,
            nextZone: Zone.MAIN_TRACK,
            nextPosition: startPosition,
            stepsTaken: 0, // Entering doesn't count as movement steps
            description: `Enter main track at position ${startPosition}`
        };
    }

    /**
     * Calculate movement from MAIN_TRACK
     * 
     * HANDLES:
     * - Normal track movement (wrap around at 51→0)
     * - Transition to home path when crossing home entrance
     * 
     * @private
     * @param {number} currentPosition - Current absolute position (0-51)
     * @param {number} diceValue - Dice roll
     * @param {string} color - Token color
     * @returns {Object} Movement result
     */
    static _calculateFromMainTrack(currentPosition, diceValue, color) {
        // Convert to relative position (from this color's perspective)
        const currentRelative = Board.getRelativePosition(currentPosition, color);

        // Calculate new relative position
        const newRelative = currentRelative + diceValue;

        // Check if this move would cross into home path
        // Home path starts after relative position 50 (the home entrance)
        const homeEntranceRelative = 50;

        if (currentRelative <= homeEntranceRelative && newRelative > homeEntranceRelative) {
            // Token is crossing into home path
            return Board._calculateHomePathEntry(currentRelative, diceValue);
        }

        // Normal main track movement
        // Wrap around using modulo for circular track
        const nextAbsolute = Board.getAbsolutePosition(newRelative % MAIN_TRACK_SIZE, color);

        // Handle wrap-around case: if newRelative >= 52, we've gone full circle
        // But this shouldn't happen for valid moves before home entrance
        // (A token should enter home before completing a full extra lap)

        return {
            isValidMove: true,
            nextZone: Zone.MAIN_TRACK,
            nextPosition: nextAbsolute,
            stepsTaken: diceValue,
            description: `Move on track from ${currentPosition} to ${nextAbsolute}`
        };
    }

    /**
     * Calculate home path entry
     * 
     * When a token crosses the home entrance, remaining steps go into home path
     * 
     * @private
     * @param {number} currentRelative - Current relative position
     * @param {number} diceValue - Dice roll
     * @returns {Object} Movement result
     */
    static _calculateHomePathEntry(currentRelative, diceValue) {
        const homeEntranceRelative = 50;

        // Steps to reach home entrance
        const stepsToEntrance = homeEntranceRelative - currentRelative;

        // Remaining steps after entering home path
        const stepsIntoHome = diceValue - stepsToEntrance - 1;
        // -1 because: stepping ON home entrance doesn't count as home path cell 0
        // Home path cell 0 is the first cell AFTER the entrance

        // Home path positions: 0, 1, 2, 3, 4, 5
        // Position 5 is the final cell (FINISHED after landing here? No - need exact)
        // Actually: 0-5 are the 6 home path cells, landing PAST 5 means FINISHED

        // Recalculating:
        // If at relative 50 (home entrance) and roll 1 → home path 0
        // If at relative 49 and roll 2 → home path 0 (49→50→home0)
        // If at relative 49 and roll 3 → home path 1 (49→50→home0→home1)

        // Steps into home = diceValue - (51 - currentRelative)
        // Wait, home entrance is relative 50, so:
        // stepsToEntrance = 50 - currentRelative
        // After reaching entrance, next step enters home path at 0
        // stepsIntoHome = diceValue - stepsToEntrance - 1

        const homePosition = stepsIntoHome;

        // Check for exact finish (landing on position 5)
        if (homePosition === HOME_PATH_LENGTH - 1) {
            // Exact! Token finishes
            return {
                isValidMove: true,
                nextZone: Zone.FINISHED,
                nextPosition: POSITION_FINISHED,
                stepsTaken: diceValue,
                description: 'Token reaches home! FINISHED'
            };
        }

        // Check for valid home path position
        if (homePosition >= 0 && homePosition < HOME_PATH_LENGTH - 1) {
            return {
                isValidMove: true,
                nextZone: Zone.HOME_PATH,
                nextPosition: homePosition,
                stepsTaken: diceValue,
                description: `Enter home path at position ${homePosition}`
            };
        }

        // Overshot - invalid move
        return Board._invalidMove(`Overshot home path (would land at position ${homePosition})`);
    }

    /**
     * Calculate movement from HOME_PATH
     * 
     * RULES:
     * - Can only move forward in home path
     * - Must land EXACTLY on position 5 to finish
     * - Overshooting is invalid
     * 
     * @private
     * @param {number} currentPosition - Current home path position (0-4)
     * @param {number} diceValue - Dice roll
     * @returns {Object} Movement result
     */
    static _calculateFromHomePath(currentPosition, diceValue) {
        const newPosition = currentPosition + diceValue;
        const finishPosition = HOME_PATH_LENGTH - 1; // Position 5

        // Exact finish
        if (newPosition === finishPosition) {
            return {
                isValidMove: true,
                nextZone: Zone.FINISHED,
                nextPosition: POSITION_FINISHED,
                stepsTaken: diceValue,
                description: 'Token reaches home! FINISHED'
            };
        }

        // Valid movement within home path
        if (newPosition < finishPosition) {
            return {
                isValidMove: true,
                nextZone: Zone.HOME_PATH,
                nextPosition: newPosition,
                stepsTaken: diceValue,
                description: `Move in home path from ${currentPosition} to ${newPosition}`
            };
        }

        // Overshot
        return Board._invalidMove(
            `Overshot home (at ${currentPosition}, rolled ${diceValue}, need exactly ${finishPosition - currentPosition})`
        );
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Create an invalid move result
     * @private
     */
    static _invalidMove(reason) {
        return {
            isValidMove: false,
            nextZone: null,
            nextPosition: null,
            stepsTaken: 0,
            description: reason
        };
    }

    /**
     * Get zone from position context
     * 
     * Given a position value and optional zone hint, determine the actual zone.
     * 
     * @param {number} position - Position value
     * @param {string} [zoneHint] - Optional zone hint
     * @returns {string} Zone constant
     */
    static getZoneFromPosition(position, zoneHint = null) {
        if (zoneHint) return zoneHint;

        if (position === POSITION_BASE) return Zone.BASE;
        if (position === POSITION_FINISHED) return Zone.FINISHED;
        if (Board.isMainTrackPosition(position)) return Zone.MAIN_TRACK;
        if (Board.isHomePathPosition(position)) return Zone.HOME_PATH;

        throw new Error(`Cannot determine zone for position: ${position}`);
    }

    /**
     * Check if a token at given position can potentially move with dice value
     * 
     * Quick check without full calculation:
     * - BASE: needs 6
     * - MAIN_TRACK: always can (may or may not be valid destination)
     * - HOME_PATH: only if dice <= remaining distance to finish
     * - FINISHED: never
     * 
     * @param {string} zone - Current zone
     * @param {number} position - Current position
     * @param {number} diceValue - Dice roll
     * @returns {boolean} True if move is potentially possible
     */
    static canPotentiallyMove(zone, position, diceValue) {
        switch (zone) {
            case Zone.BASE:
                return diceValue === ENTRY_ROLL;

            case Zone.MAIN_TRACK:
                return true; // Always can move on track

            case Zone.HOME_PATH:
                const remaining = (HOME_PATH_LENGTH - 1) - position;
                return diceValue <= remaining;

            case Zone.FINISHED:
                return false;

            default:
                return false;
        }
    }

    /**
     * Get visual/debug representation of a position
     * 
     * @param {string} zone - Position zone
     * @param {number} position - Position value
     * @param {string} color - Token color
     * @returns {string} Human-readable position string
     */
    static positionToString(zone, position, color) {
        switch (zone) {
            case Zone.BASE:
                return `${color} BASE`;
            case Zone.MAIN_TRACK:
                const safe = Board.isSafeCell(position) ? ' (SAFE)' : '';
                return `${color} TRACK[${position}]${safe}`;
            case Zone.HOME_PATH:
                return `${color} HOME[${position}/5]`;
            case Zone.FINISHED:
                return `${color} FINISHED ✓`;
            default:
                return `${color} UNKNOWN[${position}]`;
        }
    }
}
