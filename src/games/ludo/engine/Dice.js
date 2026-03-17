/**
 * Ludo Dice System
 * 
 * Handles dice rolling with configurable RNG source.
 * Supports both local (client-side) and server-provided dice values.
 * 
 * DESIGN:
 * - Pure logic where possible
 * - Static class structure
 * 
 * @module Dice
 */

import { DICE_MIN, DICE_MAX, MAX_CONSECUTIVE_SIXES } from './BoardConfig.js';

// ============================================
// DICE CLASS
// ============================================

/**
 * Dice - RNG and Validation
 */
export class Dice {

    /**
     * generate a local random roll
     * 
     * @returns {number} Dice value (1-6)
     */
    static roll() {
        return Math.floor(Math.random() * DICE_MAX) + DICE_MIN;
    }

    /**
     * Validate a dice value
     * 
     * @param {number} value - Value to check
     * @returns {boolean} True if valid 1-6 integer
     */
    static isValid(value) {
        return Number.isInteger(value) && value >= DICE_MIN && value <= DICE_MAX;
    }

    /**
     * Check if dice value grants entry from base
     * 
     * @param {number} value - Dice value
     * @returns {boolean} True if 6
     */
    static canEnterFromBase(value) {
        return value === 6;
    }

    /**
     * Check if dice value grants extra turn
     * 
     * @param {number} value - Dice value
     * @returns {boolean} True if 6
     */
    static grantsExtraTurn(value) {
        return value === 6;
    }
}
