import { PlayerColor } from './LudoTypes';

// Total squares on the main circular path
export const BOARD_SIZE = 52;
// Length of the home path (safe zone leading to center)
export const HOME_PATH_LENGTH = 5; // Squares 0-5 (6th is center/finish)

// Starting positions on the main board for each color (0-51)
// Note: These are absolute indices on the 52-square track.
// We assume Red starts at 0 for simplicity in logic, other colors offset.
// Standard Ludo typically: Red=0, Green=13, Yellow=26, Blue=39
export const START_POSITIONS: Record<PlayerColor, number> = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

// Safe squares (Globe squares + Star squares)
// Standard Ludo safe squares are relative to start.
// Usually: 0, 8, 13, 21, 26, 34, 39, 47
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// The position where a token enters the home path
// It enters home path instead of moving to the next square on board.
// For Red (Start 0): End 50 -> HomePath
// For Green (Start 13): End 11 -> HomePath
// For Yellow (Start 26): End 24 -> HomePath
// For Blue (Start 39): End 37 -> HomePath
export const HOME_ENTRANCE: Record<PlayerColor, number> = {
    red: 50,
    green: 11,
    yellow: 24,
    blue: 37
};

export const COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const ENTRY_FEE = {
    2: 50,  // 2 Players
    3: 75,  // 3 Players
    4: 100  // 4 Players
};

export const AI_DELAY_MS = 1000;
