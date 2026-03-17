/**
 * Ludo Board Configuration
 * 
 * Defines all constants for the classic Ludo board.
 * This file has ZERO dependencies.
 */

// Board dimensions
export const MAIN_TRACK_SIZE = 52;
export const HOME_PATH_LENGTH = 6;  // 0-5, where 5 = finished position
export const TOKENS_PER_PLAYER = 4;

// Player colors
export const COLORS = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

// Starting positions on main track (where token enters after rolling 6)
export const START_POSITIONS = {
    RED: 0,
    GREEN: 13,
    YELLOW: 26,
    BLUE: 39
};

// Home entrance positions (last cell before entering home path)
export const HOME_ENTRANCES = {
    RED: 50,
    GREEN: 11,
    YELLOW: 24,
    BLUE: 37
};

// Safe cells (cannot be captured here)
// Includes: start positions + star cells
export const SAFE_CELLS = [
    0,   // Red start
    8,   // Star
    13,  // Green start
    21,  // Star
    26,  // Yellow start
    34,  // Star
    39,  // Blue start
    47   // Star
];

// Position constants
export const POSITION_BASE = -1;      // Token in base (not on board)
export const POSITION_FINISHED = 6;   // Token completed journey

// Dice constants
export const DICE_MIN = 1;
export const DICE_MAX = 6;
export const ENTRY_ROLL = 6;          // Must roll this to leave base
export const MAX_CONSECUTIVE_SIXES = 3; // Triple-6 penalty threshold

// Position zones
export const Zone = Object.freeze({
    BASE: 'BASE',             // Token in starting base (-1)
    MAIN_TRACK: 'MAIN_TRACK', // On circular track (0-51)
    HOME_PATH: 'HOME_PATH',   // In home stretch (0-5)
    FINISHED: 'FINISHED'      // Completed journey
});
