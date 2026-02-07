export type GridPos = { r: number; c: number };

// Maps logical board index (0-51) to 15x15 CSS Grid coordinates (row 1-15, col 1-15)
// Assume Red starts at index 0.
// Red Home Base: Bottom-Left (Grid R10-15, C1-6)
// Green Home Base: Top-Left (Grid R1-6, C1-6)
// Yellow Home Base: Top-Right (Grid R1-6, C10-15)
// Blue Home Base: Bottom-Right (Grid R10-15, C10-15)

// Coordinate system: r (0-14), c (0-14)
// CSS Grid will use r+1, c+1
const BOARD_PATH_COORDS: GridPos[] = [
    // RED TRACK (0-12)
    // Starts Bottom-Left Arm, Left Column, Moving Up
    { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
    // Turn left into Left Arm, Top Row? No.
    // The path continues... from (9,6), next is typically (8,5)?
    // Let's trace standard Ludo.
    // 5 squares up (13->9). 6th square is the junction?
    { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
    // End of left arm (Index 11).
    // Turn corner: Index 12 is (7,0)? Usually (7,0) is the safe square at end?
    { r: 7, c: 0 },

    // GREEN TRACK (13-25)
    // Top row of Left Arm moving Right
    { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
    // Turn Up into Top Arm, Left Column
    { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
    // Top Middle (Index 25)
    { r: 0, c: 7 },

    // YELLOW TRACK (26-38)
    // Top Arm, Right Column, Moving Down
    { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
    // Turn Right into Right Arm, Top Row
    { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
    // Right Middle (Index 38)
    { r: 7, c: 14 },

    // BLUE TRACK (39-51)
    // Right Arm, Bottom Row, Moving Left
    { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
    // Turn Down into Bottom Arm, Right Column
    { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
    // Bottom Middle (Index 51)
    { r: 14, c: 7 }
];

// Home Paths (Indices 0-5)
// Based on reference grid: 
// - Blue home stretch: col 7, rows 1-5 (from top)
// - Red home stretch: row 7, cols 1-5 (from left)
// - Green home stretch: col 7, rows 9-13 (from bottom)
// - Yellow home stretch: row 7, cols 9-13 (from right)
export const HOME_PATHS: Record<string, GridPos[]> = {
    blue: [
        { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }
    ],
    red: [
        { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }
    ],
    green: [
        { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }
    ],
    yellow: [
        { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }
    ]
};

// Base Positions (for tokens in 'base' state)
// 4 tokens per color arranged in 2x2 grid inside base panel
// Based on reference: Red TL, Blue TR, Green BL, Yellow BR
export const BASE_POSITIONS: Record<string, GridPos[]> = {
    red: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],        // Top-Left
    blue: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],   // Top-Right
    green: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],  // Bottom-Left
    yellow: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }]  // Bottom-Right
};

export const CENTER_POS = { r: 7, c: 7 };

export const getBoardGridPos = (index: number): GridPos => {
    return BOARD_PATH_COORDS[index % 52];
};

export const getHomePathGridPos = (color: string, index: number): GridPos => {
    if (index === 5) return CENTER_POS; // Center
    const path = HOME_PATHS[color];
    if (path && path[index]) return path[index];
    return CENTER_POS; // Fallback
};
