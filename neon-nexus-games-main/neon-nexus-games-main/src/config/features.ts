/**
 * FEATURE FLAGS - Centralized Configuration
 * 
 * Control all features from this single file.
 * Set to `true` to enable, `false` to disable.
 */

export const FEATURES = {
    // ========================================
    // SPECIAL MODES
    // ========================================

    /** 💕 Valentine's Day Mode - Shows special message */
    VALENTINE_MODE: false,

    // ========================================
    // GAMES
    // ========================================

    /** Ludo board game - vs AI mode available */
    LUDO: true,

    /** Chess game with puzzles and tutorials */
    CHESS: true,

    /** Code Runner programming challenges */
    CODE_RUNNER: true,

    /** Dice game (gambling-style) */
    DICE: true,

    // ========================================
    // PAGES & SECTIONS
    // ========================================

    /** Shop page for purchasing items */
    SHOP: false,  // Coming Soon

    /** Leaderboard rankings */
    LEADERBOARD: true,

    /** User profiles */
    PROFILE: true,

    /** Settings page */
    SETTINGS: true,

    // ========================================
    // ONLINE FEATURES
    // ========================================

    /** Online multiplayer for Ludo */
    LUDO_ONLINE: false,  // Coming Soon

    /** Ranked matches with coin betting */
    RANKED_MATCHES: false,  // Coming Soon

    // ========================================
    // DEBUG / DEV
    // ========================================

    /** Enable debug logging in console */
    DEBUG_LOGGING: false,

} as const;

// Type helper for feature names
export type FeatureName = keyof typeof FEATURES;

// Helper function to check if a feature is enabled
export function isEnabled(feature: FeatureName): boolean {
    return FEATURES[feature];
}
