/**
 * Ludo Dice UI
 * 
 * Draws the dice and handles interactive state.
 */

import { CoordinateMapper, GRID_SIZE } from './CoordinateMapper.js';

export class DiceUI {
    constructor() {
        // Fixed position for dice (Center Right of Board?)
        // Let's place it near the current player's base?
        // For simplicity: Place in Center or Middle-Right sidebar?
        // Let's draw it at a fixed responsive location.
        // Or one dice per player base?
        // Ideally: One main dice in the control area.
        // Let's put it in the Center Finish Zone for now? No, obscured by tokens.
        // Put it in the sidebar (empty area).

        // Simple approach: Bottom Right corner outside board?
        // Or floating overlay.

        // Let's put it at (7.5, 7.5) ON TOP if no tokens? No.

        // Let's check CanvasRenderer structure. Board is centered.
        // We can draw outside the board.
        // But renderContext translates to board offset.
        // 
        // We'll draw 4 dice, one near each base, but only activate current player's.
    }

    /**
     * Draw dice
     * @param {Object} renderContext 
     * @param {Object} gameState 
     * @param {boolean} canRoll - Is roll allowed for current player
     * @param {DiceAnimator} animator - Optional animator for rolling effect
     */
    static draw(renderContext, gameState, canRoll, animator = null) {
        const { ctx, cellSize, offsetX, offsetY } = renderContext;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        const currentPlayer = gameState.currentPlayer;

        // Use animator value if rolling, else use state value
        let diceValue = gameState.dice.value;
        const isRolling = animator ? animator.isAnimating() : false;

        if (isRolling) {
            diceValue = animator.getValue();
        }

        // Determine position based on current player color
        const pos = DiceUI._getDicePosition(currentPlayer.color);

        const size = cellSize * 2;
        const x = pos.x * cellSize;
        const y = pos.y * cellSize;

        // Animate scale/rotation if rolling?
        // Let's add a simple wobble
        ctx.save();
        if (isRolling) {
            const time = Date.now();
            const wobble = Math.sin(time / 50) * 0.1; // +/- 0.1 rad
            const scale = 1 + Math.sin(time / 40) * 0.1;

            const cx = x + size / 2;
            const cy = y + size / 2;

            ctx.translate(cx, cy);
            ctx.rotate(wobble);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
        }

        // Draw Dice Box
        ctx.fillStyle = canRoll ? '#fff' : '#e2e8f0';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, size, size);
        ctx.shadowBlur = 0;

        // Draw Border
        ctx.lineWidth = canRoll ? 3 : 1;
        ctx.strokeStyle = canRoll ? '#2563eb' : '#94a3b8'; // Blue highlight if movable
        ctx.strokeRect(x, y, size, size);

        // Draw Pips (if value exists)
        if (diceValue) {
            DiceUI._drawPips(ctx, x, y, size, diceValue);
        } else if (canRoll) {
            // Draw "Roll" text
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${size / 3}px sans-serif`;
            ctx.fillText('ROLL', x + size / 2, y + size / 2);
        }

        ctx.restore(); // Restore wobble transform

        ctx.restore(); // Restore board offset
    }

    static _getDicePosition(color) {
        // Place inside the white box of the base (x+1, y+1) -> 4x4 area.
        // Center of base white box is at (baseX + 3, baseY + 3).
        // Dice is size 2x2.
        // Top-left of dice: (baseX + 2, baseY + 2).

        const anchors = {
            'RED': { x: 0, y: 9 },
            'GREEN': { x: 9, y: 9 },
            'YELLOW': { x: 9, y: 0 },
            'BLUE': { x: 0, y: 0 }
        };
        const anchor = anchors[color] || { x: 0, y: 0 };

        return {
            x: anchor.x + 2,
            y: anchor.y + 2
        };
    }

    static _drawPips(ctx, x, y, size, value) {
        ctx.fillStyle = '#1e293b';
        const r = size * 0.1;
        const cx = x + size / 2;
        const cy = y + size / 2;
        const gap = size * 0.25;

        const pips = [];
        if (value % 2 === 1) pips.push({ x: 0, y: 0 }); // Center
        if (value > 1) { pips.push({ x: -1, y: -1 }, { x: 1, y: 1 }); }
        if (value > 3) { pips.push({ x: 1, y: -1 }, { x: -1, y: 1 }); }
        if (value === 6) { pips.push({ x: -1, y: 0 }, { x: 1, y: 0 }); }

        pips.forEach(p => {
            ctx.beginPath();
            ctx.arc(cx + p.x * gap, cy + p.y * gap, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Hit test for dice click
     */
    static isHit(gridX, gridY, currentColor) {
        const pos = DiceUI._getDicePosition(currentColor);
        // Box is at pos.x, pos.y with size 2x2 cells
        return (
            gridX >= pos.x &&
            gridX < pos.x + 2 &&
            gridY >= pos.y &&
            gridY < pos.y + 2
        );
    }
}
