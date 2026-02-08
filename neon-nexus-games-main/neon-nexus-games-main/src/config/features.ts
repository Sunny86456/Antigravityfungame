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
    VALENTINE_MODE: true,

    // ========================================
    // GAMES (Disabled for Valentine's)
    // ========================================

    LUDO: false,
    CHESS: false,
    CODE_RUNNER: false,
    DICE: false,

    // ========================================
    // PAGES & SECTIONS (Disabled)
    // ========================================

    SHOP: false,
    LEADERBOARD: false,
    PROFILE: false,
    SETTINGS: false,

    // ========================================
    // ONLINE FEATURES
    // ========================================

    LUDO_ONLINE: false,
    RANKED_MATCHES: false,
    DEBUG_LOGGING: false,

} as const;

// Type helper for feature names
export type FeatureName = keyof typeof FEATURES;

// Helper function to check if a feature is enabled
export function isEnabled(feature: FeatureName): boolean {
    return FEATURES[feature];
}
