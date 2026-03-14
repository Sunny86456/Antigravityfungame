/**
 * Ludo Input Controller
 * 
 * Translates raw canvas clicks into game intents.
 * 
 * - Converts pixel (x,y) -> Grid (x,y)
 * - Hit tests Dice
 * - Hit tests Tokens (using Stacking logic consideration?)
 *   - For MVP: Just check cell content. If multiple tokens, maybe cycle or pick first movable?
 *   - We'll pick the first movable token in that cell.
 */

import { CoordinateMapper } from './CoordinateMapper.js';
import { DiceUI } from './DiceUI.js';

export class InputController {

    /**
     * Handle click event
     * @param {MouseEvent|TouchEvent} event 
     * @param {CanvasRenderer} renderer 
     * @param {Object} gameState 
     * @returns {Object|null} Action { type: 'ROLL' | 'MOVE', payload? }
     */
    static handleClick(event, renderer, gameState) {
        const rect = renderer.canvas.getBoundingClientRect();

        // Handle touch or mouse
        const cx = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
        const cy = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

        // Convert to Grid
        const { cellSize, offsetX, offsetY } = renderer.getContext();

        const gx = Math.floor((cx - offsetX) / cellSize);
        const gy = Math.floor((cy - offsetY) / cellSize);

        // 1. Check Dice Hit
        // Dice is usually placed based on current player
        if (DiceUI.isHit(gx, gy, gameState.currentPlayer.color)) {
            return { type: 'ROLL' };
        }

        // 2. Check Token Hit
        // Check all tokens to see if any are at (gx, gy)
        // AND belong to current player
        // AND are movable? (Optional, but good UX)

        const currentPlayer = gameState.currentPlayer;
        const tokens = currentPlayer.tokens;

        // Find tokens at this grid position
        const hitTokens = tokens.filter(t => {
            const pos = CoordinateMapper.getGridCoordinates(t.state, t.position, currentPlayer.color);
            // Allow sloppy click (tolerance)? No, grid is robust.
            // Check if pos matches grid
            // Note: CoordinateMapper returns pixel center? No, returns Grid coords.
            // We need to compare integers (Math.floor handled above).
            return Math.abs(pos.x - gx) < 0.5 && Math.abs(pos.y - gy) < 0.5;
        });

        if (hitTokens.length > 0) {
            // Return the first one (or handle selection menu if crucial)
            // For MVP: Return the first token ID
            return { type: 'MOVE', tokenId: hitTokens[0].id };
        }

        return null; // Clicked empty space
    }
}
