/**
 * Ludo Canvas Renderer
 * 
 * Manages the HTML5 Canvas context, resizing, and coordinate scaling.
 * 
 * RESPONSIBILITIES:
 * - Maintain fullscreen responsive canvas
 * - Calculate grid cell size based on screen dimensions
 * - Provide clear() and basic drawing context access
 * - Centralize scaling logic
 */

import { GRID_SIZE } from './CoordinateMapper.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha background
        this.width = 0;
        this.height = 0;
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Initialize size
        this.resize();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas to fit window/parent
     * Recalculates grid scale to maintain aspect ratio
     */
    resize() {
        const parent = this.canvas.parentElement || document.body;
        this.width = parent.clientWidth;
        this.height = parent.clientHeight;

        // Update canvas resolution (handle DPI if needed, but keep simple for now)
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Calculate scale
        // Maintain square board
        const minDim = Math.min(this.width, this.height);
        // Padding 20px
        const boardSize = minDim - 40;

        this.cellSize = Math.floor(boardSize / GRID_SIZE);

        // Center the board
        this.offsetX = Math.floor((this.width - (this.cellSize * GRID_SIZE)) / 2);
        this.offsetY = Math.floor((this.height - (this.cellSize * GRID_SIZE)) / 2);

        // Redraw immediately if needed? 
        // LudoGame loop will handle it.
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = '#1a1b26'; // Dark theme background
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Get drawing context and layout info
     */
    getContext() {
        return {
            ctx: this.ctx,
            cellSize: this.cellSize,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            width: this.width,
            height: this.height
        };
    }
}
