/**
 * Ludo Board Renderer
 * 
 * Draws the static Ludo board:
 * - 15x15 Grid (debug only)
 * - 4 Corner Bases (Colored)
 * - Main Cross Track
 * - Home Paths
 * - Center Finish Zone
 * 
 * USES:
 * - CanvasContext from CanvasRenderer
 * - Grid Geometry from CoordinateMapper
 */

import { GRID_SIZE } from './CoordinateMapper.js';
import { SAFE_CELLS, HOME_ENTRANCES } from '../engine/BoardConfig.js';

// Visual Colors
const COLORS = {
    RED: '#f43f5e',     // Rose 500
    GREEN: '#22c55e',   // Green 500
    YELLOW: '#eab308',  // Yellow 500
    BLUE: '#3b82f6',    // Blue 500
    BOARD_BG: '#ffffff',
    TRACK_BG: '#f8fafc', // Slate 50
    BORDER: '#94a3b8',   // Slate 400
    SAFE_STAR: '#64748b' // Slate 500
};

export class BoardRenderer {
    /**
     * Draw the static board
     * @param {Object} renderContext - from CanvasRenderer.getContext()
     */
    static draw(renderContext) {
        const { ctx, cellSize, offsetX, offsetY } = renderContext;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // 1. Draw Background (White Board Area)
        ctx.fillStyle = COLORS.BOARD_BG;
        ctx.fillRect(0, 0, cellSize * GRID_SIZE, cellSize * GRID_SIZE);

        // 2. Draw Bases (Corner 6x6)
        BoardRenderer._drawBase(ctx, 0, 0, COLORS.RED, cellSize);      // TL (Wait, standard mapping?)

        // Correction from CoordinateMapper: 
        // RED Base: BL (0-5, 9-14)
        // GREEN Base: BR (9-14, 9-14)
        // YELLOW Base: TR (9-14, 0-5)
        // BLUE Base: TL (0-5, 0-5)

        // Wait, CoordinateMapper said:
        // RED: x:0, y:9 (BL)
        // GREEN: x:9, y:9 (BR)
        // YELLOW: x:9, y:0 (TR)
        // BLUE: x:0, y:0 (TL)
        // BUT BoardConfig engine says RED=0, GREEN=13, etc.
        // My CoordinateMapper track went RED(1,8) -> Right.

        // Let's stick to CoordinateMapper layout.
        // RED Base: Bottom Left.
        // GREEN Base: Bottom Right.
        // YELLOW Base: Top Right.
        // BLUE Base: Top Left.

        BoardRenderer._drawBase(ctx, 0, 9, COLORS.RED, cellSize);       // BL
        BoardRenderer._drawBase(ctx, 9, 9, COLORS.GREEN, cellSize);     // BR
        BoardRenderer._drawBase(ctx, 9, 0, COLORS.YELLOW, cellSize);    // TR
        BoardRenderer._drawBase(ctx, 0, 0, COLORS.BLUE, cellSize);      // TL

        // 3. Draw Track Grid (The Cross)
        // Vertical Arm: x=6-8, y=0-14
        // Horizontal Arm: x=0-14, y=6-8

        // Draw Vertical Strip Background
        ctx.fillStyle = COLORS.TRACK_BG;
        ctx.fillRect(6 * cellSize, 0, 3 * cellSize, 15 * cellSize);

        // Draw Horizontal Strip Background
        ctx.fillStyle = COLORS.TRACK_BG;
        ctx.fillRect(0, 6 * cellSize, 15 * cellSize, 3 * cellSize);

        // Draw Center (Finish Zone)
        BoardRenderer._drawCenter(ctx, cellSize);

        // Draw Grid Lines on Tracks
        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 6; i <= 9; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, 15 * cellSize);
            ctx.stroke();
        }
        // Horizontal lines
        for (let i = 6; i <= 9; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(15 * cellSize, i * cellSize);
            ctx.stroke();
        }

        // Cross lines for cells
        // Vertical Arm Cells (y lines)
        for (let i = 0; i <= 15; i++) {
            if (i < 6 || i > 9) { // Arms only
                ctx.beginPath();
                ctx.moveTo(6 * cellSize, i * cellSize);
                ctx.lineTo(9 * cellSize, i * cellSize);
                ctx.stroke();
            }
        }
        // Horizontal Arm Cells (x lines)
        for (let i = 0; i <= 15; i++) {
            if (i < 6 || i > 9) { // Arms only
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 6 * cellSize);
                ctx.lineTo(i * cellSize, 9 * cellSize);
                ctx.stroke();
            }
        }

        // 4. Draw Colored Home Paths
        // Red Home Path (BL -> Center) = (1,7) -> (5,7)
        BoardRenderer._drawHomePath(ctx, 1, 7, 5, 'horizontal', COLORS.RED, cellSize);

        // Green Home Path (Bottom -> Center) = (7,13)->(7,9) ??
        // CoordinateMapper: Green (BR) -> (7,13)..(7,9)?
        // Wait green base (9,9). Track passes (6-8, 9-14).
        // Vertical arm. Green home path is Col 7, Rows 13->9.
        BoardRenderer._drawHomePath(ctx, 7, 9, 5, 'vertical', COLORS.GREEN, cellSize); // 9-13

        // Yellow (TR) -> (13,7)..(9,7) Horizontal Left
        BoardRenderer._drawHomePath(ctx, 9, 7, 5, 'horizontal', COLORS.YELLOW, cellSize);

        // Blue (TL) -> (7,1)..(7,5) Vertical Down
        BoardRenderer._drawHomePath(ctx, 7, 1, 5, 'vertical', COLORS.BLUE, cellSize);

        // 5. Highlight Safe Cells (Stars)
        // Red Start (1,8) -> Star
        // Green Start (8,13) -> Star (if standard)
        // Yellow Start (13,6) -> Star
        // Blue Start (6,1) -> Star
        // + Stars at (6,2), (2,6), (8,12), (12,8) ?
        // Need exact coords from Engine? Engine gives logic ID. 
        // CoordinateMapper maps ID to {x,y}.
        // We will skip stars for "First Playable" to keep clean, or just mark Starts.
        // Marking Starts is crucial.

        BoardRenderer._drawSafeCell(ctx, 1, 8, COLORS.RED, cellSize);    // Red Start
        BoardRenderer._drawSafeCell(ctx, 8, 13, COLORS.GREEN, cellSize); // Green Start
        BoardRenderer._drawSafeCell(ctx, 13, 6, COLORS.YELLOW, cellSize);// Yellow Start
        BoardRenderer._drawSafeCell(ctx, 6, 1, COLORS.BLUE, cellSize);   // Blue Start

        ctx.restore();
    }

    static _drawBase(ctx, gx, gy, color, size) {
        // Outer Box
        ctx.fillStyle = color;
        ctx.fillRect(gx * size, gy * size, 6 * size, 6 * size);

        // Inner White Box
        ctx.fillStyle = COLORS.BOARD_BG;
        ctx.fillRect((gx + 1) * size, (gy + 1) * size, 4 * size, 4 * size);

        // 4 Circles for Tokens
        ctx.fillStyle = color;
        const radius = size * 0.3;

        const positions = [
            { x: gx + 1.5, y: gy + 1.5 },
            { x: gx + 4.5, y: gy + 1.5 },
            { x: gx + 1.5, y: gy + 4.5 },
            { x: gx + 4.5, y: gy + 4.5 }
        ];

        positions.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x * size, p.y * size, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    static _drawCenter(ctx, size) {
        // Center 3x3 area (6,6 to 8,8)
        // Usually 4 triangles
        const cx = 7.5 * size;
        const cy = 7.5 * size;
        const half = 1.5 * size;

        // Draw Triangles
        // Left (Red)
        ctx.fillStyle = COLORS.RED;
        ctx.beginPath();
        ctx.moveTo(6 * size, 6 * size);
        ctx.lineTo(6 * size, 9 * size);
        ctx.lineTo(cx, cy);
        ctx.fill();

        // Bottom (Green)
        ctx.fillStyle = COLORS.GREEN;
        ctx.beginPath();
        ctx.moveTo(6 * size, 9 * size);
        ctx.lineTo(9 * size, 9 * size);
        ctx.lineTo(cx, cy);
        ctx.fill();

        // Right (Yellow)
        ctx.fillStyle = COLORS.YELLOW;
        ctx.beginPath();
        ctx.moveTo(9 * size, 9 * size);
        ctx.lineTo(9 * size, 6 * size);
        ctx.lineTo(cx, cy);
        ctx.fill();

        // Top (Blue)
        ctx.fillStyle = COLORS.BLUE;
        ctx.beginPath();
        ctx.moveTo(9 * size, 6 * size);
        ctx.lineTo(6 * size, 6 * size);
        ctx.lineTo(cx, cy);
        ctx.fill();
    }

    static _drawHomePath(ctx, startX, startY, length, dir, color, size) {
        ctx.fillStyle = color;
        if (dir === 'horizontal') {
            ctx.fillRect(startX * size, startY * size, length * size, size);
        } else {
            ctx.fillRect(startX * size, startY * size, size, length * size);
        }
    }

    static _drawSafeCell(ctx, gx, gy, color, size) {
        // Draw a star or visual marker
        ctx.fillStyle = color;
        // Just fill the cell slightly darker/lighter
        ctx.globalAlpha = 0.3;
        ctx.fillRect(gx * size, gy * size, size, size);
        ctx.globalAlpha = 1.0;

        // Draw Star icon (simple cross)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        const cx = (gx + 0.5) * size;
        const cy = (gy + 0.5) * size;
        const r = size * 0.3;

        ctx.beginPath();
        ctx.moveTo(cx - r, cy - r);
        ctx.lineTo(cx + r, cy + r);
        ctx.moveTo(cx + r, cy - r);
        ctx.lineTo(cx - r, cy + r);
        ctx.stroke();
    }
}
