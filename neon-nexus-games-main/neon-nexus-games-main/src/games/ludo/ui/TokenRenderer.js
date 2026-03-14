/**
 * Ludo Token Renderer
 * 
 * Draws dynamic tokens based on GameState.
 * Handles stacking offsets and selection highlights.
 */

import { CoordinateMapper } from './CoordinateMapper.js';

export class TokenRenderer {

    /**
     * Draw all tokens
     * @param {Object} renderContext 
     * @param {Object} gameState 
     * @param {Array} validMoves
     * @param {TokenAnimator} animator - Optional animator for overrides
     */
    static draw(renderContext, gameState, validMoves = [], animator = null) {
        const { ctx, cellSize, offsetX, offsetY } = renderContext;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Group tokens by position to handle stacking
        const positionGroups = new Map();

        gameState.players.forEach(player => {
            player.tokens.forEach(token => {
                // Check for animation override
                const override = animator ? animator.getOverride(token.id) : null;

                let gridPos;
                let scale = 1;
                let opacity = 1;

                if (override) {
                    // Use override position (Grid Coords)
                    gridPos = { x: override.x, y: override.y };
                    scale = override.scale !== undefined ? override.scale : 1;
                    opacity = override.opacity !== undefined ? override.opacity : 1;
                } else {
                    // Use logical state
                    gridPos = CoordinateMapper.getGridCoordinates(token.state, token.position, player.color);
                }

                // Group key: based on grid pos
                // Use a unique key for animating tokens effectively ungrouping them
                const key = override
                    ? `anim-${token.id}`
                    : `${gridPos.x.toFixed(2)},${gridPos.y.toFixed(2)}`;

                if (!positionGroups.has(key)) {
                    positionGroups.set(key, []);
                }
                positionGroups.get(key).push({ token, player, gridPos, isAnimating: !!override, scale, opacity });
            });
        });

        // Draw each group
        positionGroups.forEach((group) => {
            TokenRenderer._drawGroup(ctx, group, cellSize, validMoves);
        });

        ctx.restore();
    }

    static _drawGroup(ctx, group, size, validMoves) {
        // ... (stacking logic same as before) ...
        // ...

        const count = group.length;
        const radius = size * 0.35;
        const offset = count > 1 ? size * 0.15 : 0;

        const offsets = [
            { x: -offset, y: -offset },
            { x: offset, y: offset },
            { x: -offset, y: offset },
            { x: offset, y: -offset }
        ];

        group.forEach((item, index) => {
            const { token, player, gridPos, scale, opacity } = item;

            // Apply scale/opacity ? 
            // _drawToken needs to handle it.
            // Or we handle context save/restore here?

            const shift = offsets[index % 4];
            const px = gridPos.x * size + size / 2 + shift.x;
            const py = gridPos.y * size + size / 2 + shift.y;

            // check if movable
            const isMovable = validMoves.some(m => m.tokenId === token.id && m.playerId === player.id);

            TokenRenderer._drawToken(ctx, px, py, radius, player.color, isMovable, scale, opacity);
        });
    }

    static _drawToken(ctx, x, y, r, colorString, isMovable, scale = 1, opacity = 1) {
        if (opacity <= 0) return;

        ctx.save();

        // Apply Opacity
        ctx.globalAlpha = opacity;

        // Apply Scale (transform around center)
        if (scale !== 1) {
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            ctx.translate(-x, -y);
        }

        const colorMap = {
            'RED': '#f43f5e',
            'GREEN': '#22c55e',
            'YELLOW': '#eab308',
            'BLUE': '#3b82f6'
        };
        const color = colorMap[colorString] || '#999';

        // Highlight ring if movable
        if (isMovable) {
            ctx.beginPath();
            ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Glow
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fff'; // White border
            ctx.stroke();
        }

        // Main Body
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Stroke
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Inner shadow/detail
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();

        ctx.restore();
    }
}
