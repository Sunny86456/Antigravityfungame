/**
 * Ludo Match Setup - Color Assignment Logic
 * 
 * This module handles player color assignment BEFORE engine initialization.
 * Engine receives finalized player list with fixed colors.
 * 
 * Rules:
 * - Human gets random color (RED, BLUE, GREEN, YELLOW)
 * - 2P: AI gets diagonal opposite of human
 * - 3P: AI gets 2 random remaining colors
 * - 4P: AI gets all 3 remaining colors
 */

import { Player, PlayerColor } from './LudoTypes';

// Available colors in Ludo
const ALL_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

// Diagonal opposite color mapping (for 2P mode)
// Based on standard Ludo board layout:
// RED (TL) ←→ YELLOW (BR)
// BLUE (TR) ←→ GREEN (BL)
const OPPOSITE_COLOR_MAP: Record<PlayerColor, PlayerColor> = {
    red: 'yellow',
    yellow: 'red',
    blue: 'green',
    green: 'blue',
};

/**
 * Get a random color from the available colors
 */
export function getRandomColor(): PlayerColor {
    const randomIndex = Math.floor(Math.random() * ALL_COLORS.length);
    return ALL_COLORS[randomIndex];
}

/**
 * Get the diagonal opposite color for 2P mode
 */
export function getOppositeColor(color: PlayerColor): PlayerColor {
    return OPPOSITE_COLOR_MAP[color];
}

/**
 * Get remaining colors after excluding specified colors
 */
export function getRemainingColors(excludeColors: PlayerColor[]): PlayerColor[] {
    return ALL_COLORS.filter(c => !excludeColors.includes(c));
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Create initial tokens for a player
 */
function createTokens(color: PlayerColor) {
    return [0, 1, 2, 3].map(id => ({
        id,
        color,
        state: 'base' as const,
        position: -1,
        safe: true,
    }));
}

/**
 * Create a player object
 */
function createPlayer(
    id: string,
    color: PlayerColor,
    name: string,
    isBot: boolean
): Player {
    return {
        id,
        color,
        name,
        isBot,
        tokens: createTokens(color),
        hasLeft: false,
    };
}

/**
 * Get color display name (capitalized)
 */
function getColorName(color: PlayerColor): string {
    return color.charAt(0).toUpperCase() + color.slice(1);
}

// =============================================
// MAIN ASSIGNMENT FUNCTIONS
// =============================================

/**
 * Assign colors for 2 Player Mode
 * 
 * Rule: AI is ALWAYS diagonal opposite of human
 * - RED ↔ YELLOW
 * - BLUE ↔ GREEN
 */
export function assignColors2P(): { humanColor: PlayerColor; aiColors: PlayerColor[] } {
    const humanColor = getRandomColor();
    const aiColor = getOppositeColor(humanColor);

    return {
        humanColor,
        aiColors: [aiColor],
    };
}

/**
 * Assign colors for 3 Player Mode
 * 
 * Rule: Human gets random color, AI gets 2 of remaining 3 colors
 */
export function assignColors3P(): { humanColor: PlayerColor; aiColors: PlayerColor[] } {
    const humanColor = getRandomColor();
    const remaining = getRemainingColors([humanColor]);

    // Shuffle and pick first 2
    const shuffled = shuffleArray(remaining);
    const aiColors = shuffled.slice(0, 2);

    return {
        humanColor,
        aiColors,
    };
}

/**
 * Assign colors for 4 Player Mode
 * 
 * Rule: Human gets random color, AI gets all 3 remaining colors
 */
export function assignColors4P(): { humanColor: PlayerColor; aiColors: PlayerColor[] } {
    const humanColor = getRandomColor();
    const aiColors = getRemainingColors([humanColor]);

    // Shuffle AI colors for variety in turn order
    return {
        humanColor,
        aiColors: shuffleArray(aiColors),
    };
}

/**
 * Create players array for game initialization
 * 
 * @param playerCount - 2, 3, or 4
 * @returns Array of Player objects ready for engine initialization
 */
export function createPlayersForMatch(playerCount: number): Player[] {
    let humanColor: PlayerColor;
    let aiColors: PlayerColor[];

    // Assign colors based on player count
    switch (playerCount) {
        case 2: {
            const assignment = assignColors2P();
            humanColor = assignment.humanColor;
            aiColors = assignment.aiColors;
            break;
        }
        case 3: {
            const assignment = assignColors3P();
            humanColor = assignment.humanColor;
            aiColors = assignment.aiColors;
            break;
        }
        case 4:
        default: {
            const assignment = assignColors4P();
            humanColor = assignment.humanColor;
            aiColors = assignment.aiColors;
            break;
        }
    }

    // Create players array
    const players: Player[] = [];

    // Human player always first
    players.push(createPlayer(
        'human',
        humanColor,
        'You',
        false
    ));

    // AI players
    aiColors.forEach((color, index) => {
        players.push(createPlayer(
            `bot${index + 1}`,
            color,
            `Bot ${getColorName(color)}`,
            true
        ));
    });

    return players;
}

// =============================================
// DEBUG / VALIDATION
// =============================================

/**
 * Validate that no duplicate colors exist
 */
export function validateNoDuplicateColors(players: Player[]): boolean {
    const colors = players.map(p => p.color);
    const uniqueColors = new Set(colors);
    return colors.length === uniqueColors.size;
}

/**
 * Validate 2P mode uses opposite colors
 */
export function validate2POppositeColors(players: Player[]): boolean {
    if (players.length !== 2) return false;
    const humanColor = players[0].color;
    const aiColor = players[1].color;
    return getOppositeColor(humanColor) === aiColor;
}
