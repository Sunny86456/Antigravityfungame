/**
 * Ludo Coordinate Mapper
 * 
 * Maps logical board positions to 15x15 Grid coordinates (x,y).
 * Grid is 0-14, where (0,0) is Top-Left.
 * 
 * @module CoordinateMapper
 */

export const GRID_SIZE = 15;
export const CELL_SIZE_REL = 1;

/**
 * Generate Main Track Coordinates (0-51)
 * 
 * Path:
 * Red Start (0) at (1,8) -> Right -> Down -> Right -> Up -> Right -> Up 
 * -> Left -> Up -> Left -> Down -> Left -> Down -> Wrap.
 */
function generateTrackCoords() {
    const coords = [];

    // Segment 1: Red Home Approach (Horizontal Right)
    // (1,8) -> (5,8)
    for (let x = 1; x <= 5; x++) coords.push({ x, y: 8 });

    // Segment 2: Down Vertical
    // (6,9) -> (6,14)
    for (let y = 9; y <= 14; y++) coords.push({ x: 6, y });

    // Segment 3: Bottom Turn (Right)
    // (7,14), (8,14)
    coords.push({ x: 7, y: 14 });
    coords.push({ x: 8, y: 14 });

    // Segment 4: Up Vertical
    // (8,13) -> (8,9)
    for (let y = 13; y >= 9; y--) coords.push({ x: 8, y });

    // Segment 5: Horizontal Right
    // (9,8) -> (14,8)
    for (let x = 9; x <= 14; x++) coords.push({ x, y: 8 });

    // Segment 6: Right Turn (Up)
    // (14,7), (14,6)
    coords.push({ x: 14, y: 7 });
    coords.push({ x: 14, y: 6 });

    // Segment 7: Horizontal Left
    // (13,6) -> (9,6)
    for (let x = 13; x >= 9; x--) coords.push({ x, y: 6 });

    // Segment 8: Up Vertical
    // (8,5) -> (8,0)
    for (let y = 5; y >= 0; y--) coords.push({ x: 8, y });

    // Segment 9: Top Turn (Left)
    // (7,0), (6,0)
    coords.push({ x: 7, y: 0 });
    coords.push({ x: 6, y: 0 });

    // Segment 10: Down Vertical
    // (6,1) -> (6,5)
    for (let y = 1; y <= 5; y++) coords.push({ x: 6, y });

    // Segment 11: Horizontal Left
    // (5,6) -> (0,6)
    for (let x = 5; x >= 0; x--) coords.push({ x, y: 6 });

    // Segment 12: Left Turn (Down)
    // (0,7), (0,8)
    coords.push({ x: 0, y: 7 });
    coords.push({ x: 0, y: 8 }); // Wrap point matches start adjacent? No, start is (1,8)

    // Wait, (0,8) is adjacent to (1,8).
    // Start was (1,8). Loop closes correctly.

    return coords;
}

const MAIN_TRACK_COORDS = generateTrackCoords();

// Base positions (4 tokens per base)
// Relative offsets within 6x6 area
const BASE_OFFSETS = [
    { x: 1, y: 1 }, { x: 4, y: 1 },
    { x: 1, y: 4 }, { x: 4, y: 4 }
];

// Base Top-Left anchor points
const BASE_ANCHORS = {
    RED: { x: 0, y: 9 },
    GREEN: { x: 9, y: 9 },  // Visual config: Red=BL, Green=BR
    YELLOW: { x: 9, y: 0 }, // Visual config: Yellow=TR
    BLUE: { x: 0, y: 0 }    // Visual config: Blue=TL
};
// Note: This matches tracking: Red->Green->Yellow->Blue

export class CoordinateMapper {
    /**
     * Get grid coordinates
     */
    static getGridCoordinates(zone, position, color) {
        if (zone === 'MAIN_TRACK') {
            return MAIN_TRACK_COORDS[position % 52];
        }

        if (zone === 'HOME_PATH') {
            return CoordinateMapper._getHomePathCoords(position, color);
        }

        if (zone === 'BASE') {
            const anchor = BASE_ANCHORS[color] || { x: 0, y: 0 };
            // Use token ID (position) to pick offset
            const offset = BASE_OFFSETS[position % 4];
            return {
                x: anchor.x + offset.x,
                y: anchor.y + offset.y
            };
        }

        if (zone === 'FINISHED') {
            // Center area
            // Distribute slightly based on color
            if (color === 'RED') return { x: 6.5, y: 8 };
            if (color === 'GREEN') return { x: 8, y: 8.5 }; // ?
            return { x: 7.5, y: 7.5 };
        }

        return { x: 0, y: 0 };
    }

    static gridToPixels(gridCoords, cellSize) {
        return {
            x: gridCoords.x * cellSize + cellSize / 2,
            y: gridCoords.y * cellSize + cellSize / 2
        };
    }

    static _getHomePathCoords(index, color) {
        // Home paths: 0-5
        // Red (BL) -> Moves Right in Row 7
        if (color === 'RED') {
            return { x: 1 + index, y: 7 };
        }
        // Green (BR) -> Moves Up in Col 7?
        // Wait, Green starts at 13.
        // My track generation: 13-25 is Green. Starts (8,13) -> Up.
        // So Green Home Path is vertical Up? from (7,14)?
        // No, Home entrance is (8,14) -> (7,14) is prev.
        // Green enters from (8,14)?

        // Let's use visual mapping:
        // RED (Left) -> Moves horizontal right towards center
        // GREEN (Bottom) -> Moves vertical up towards center
        // YELLOW (Right) -> Moves horizontal left towards center
        // BLUE (Top) -> Moves vertical down towards center

        // Match base anchors:
        // Red Base (BL) -> Home Path is (1,7) -> (6,7)
        if (color === 'RED') return { x: 1 + index, y: 7 };

        // Green Base (BR) -> Home Path?
        // Wait, Green Base is (9,9) (Bottom Right).
        // Track passes (6,9)...
        // Green Home Path should be Vertical Up from Bottom (Col 7).
        if (color === 'GREEN') return { x: 7, y: 13 - index }; // (7,13)..(7,8)

        // Yellow Base (TR) -> Home Path Horizontal Left (Row 7).
        if (color === 'YELLOW') return { x: 13 - index, y: 7 }; // (13,7)..(8,7)

        // Blue Base (TL) -> Home Path Vertical Down (Col 7).
        if (color === 'BLUE') return { x: 7, y: 1 + index }; // (7,1)..(7,6)

        return { x: 7, y: 7 };
    }
}
