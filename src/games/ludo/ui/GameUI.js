/**
 * Ludo Game UI - Main Orchestrator
 * 
 * Binds Engine <-> Canvas UI.
 * 
 * USAGE:
 * const ui = new GameUI(game, canvasElement);
 */

import { CanvasRenderer } from './CanvasRenderer.js';
import { BoardRenderer } from './BoardRenderer.js';
import { TokenRenderer } from './TokenRenderer.js';
import { DiceUI } from './DiceUI.js';
import { InputController } from './InputController.js';
import { AnimationManager } from './animations/AnimationManager.js';
import { TokenAnimator } from './animations/TokenAnimator.js';
import { DiceAnimator } from './animations/DiceAnimator.js';
import { TurnHighlighter } from './animations/TurnHighlighter.js';
import { SoundManager } from './audio/SoundManager.js';

export class GameUI {
    constructor(game, canvas) {
        this.game = game;
        this.renderer = new CanvasRenderer(canvas);

        // Setup Animation System
        this.animator = new AnimationManager(() => this.render());
        this.tokenAnim = new TokenAnimator(this.animator);
        this.diceAnim = new DiceAnimator(this.animator);
        this.highlighter = new TurnHighlighter(this.animator); // For pulse
        this.soundManager = new SoundManager();

        // Animation Queue to serialize events
        this.eventQueue = [];
        this.isProcessingQueue = false;

        // Pause state
        this.isPaused = false;

        this.animator.start(); // Start loop

        // Bind inputs
        this._bindInput(canvas);

        // Subscribe to game events
        this.unsubscribe = game.subscribe('*', (e) => this._handleGameEvent(e));

        // Initial Render
        this.render();
    }

    _bindInput(canvas) {
        const handler = (e) => {
            e.preventDefault(); // Prevent scrolling

            // Block input when paused, dice rolling, or queue active
            if (this.isPaused || this.diceAnim.isAnimating() || this.isProcessingQueue) return;

            // Unlock audio context on first interaction
            this.soundManager.unlock();

            const action = InputController.handleClick(e, this.renderer, this.game.getState());

            if (action) {
                this._handleAction(action);
            }
        };

        canvas.addEventListener('click', handler);
        canvas.addEventListener('touchstart', handler, { passive: false });
    }

    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.animator.stop();
        this._drawPauseOverlay();
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.animator.start();
        this.render();
    }

    _drawPauseOverlay() {
        const { ctx, width, height } = this.renderer.getContext();
        // Semi-transparent dark overlay
        ctx.save();
        ctx.fillStyle = 'rgba(6, 12, 24, 0.64)';
        ctx.fillRect(0, 0, width, height);
        // Pause icon — two vertical bars
        const cx = width / 2;
        const cy = height / 2;
        ctx.fillStyle = 'rgba(244, 247, 255, 0.92)';
        ctx.beginPath();
        ctx.roundRect(cx - 28, cy - 36, 20, 72, 6);
        ctx.roundRect(cx + 8,  cy - 36, 20, 72, 6);
        ctx.fill();
        // "PAUSED" label
        ctx.fillStyle = 'rgba(97, 164, 255, 0.94)';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', cx, cy + 70);
        ctx.restore();
    }

    _handleAction(action) {
        const state = this.game.getState();
        const currentPlayerId = state.currentPlayer.id;

        if (action.type === 'ROLL') {
            this.game.rollDice(currentPlayerId);
        } else if (action.type === 'MOVE') {
            this.game.move(currentPlayerId, action.tokenId);
        }
    }

    _handleGameEvent(event) {
        // Enqueue high-priority animation events
        if (['DICE_ROLLED', 'TOKEN_MOVED', 'TURN_STARTED', 'GAME_OVER', 'TURN_SKIPPED'].includes(event.type)) {
            this.eventQueue.push(event);
            this._processQueue();
        } else {
            // Immediate update for others
            this.render();
        }
    }

    async _processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            await this._playAnimationForEvent(event);
            this.render(); // Ensure state is fresh after animation
        }

        this.isProcessingQueue = false;
        this.render(); // Final stable render
    }

    _playAnimationForEvent(event) {
        return new Promise((resolve) => {
            const state = this.game.getState();

            if (event.type === 'DICE_ROLLED') {
                const { value } = event.payload;
                this.soundManager.play('roll');
                this.diceAnim.roll(value, resolve);
            }
            else if (event.type === 'TOKEN_MOVED') {
                const { tokenId, from, to, playerId, capturedToken, isCapture, isFinishing, diceValue } = event.payload;
                const player = state.players.find(p => p.id === playerId);

                // Calculate steps heuristic:
                // We pass 6 (max dice value) to TokenAnimator.
                // TokenAnimator's path generation is smart enough to stop early 
                // when it executes a step that lands exactly on the 'to' coordinates.
                // This avoids the need to reverse-engineer the exact dice roll here.
                const inferredSteps = 6;

                // Play move sound
                this.soundManager.play('move');

                // Animate!
                this.tokenAnim.animateMove(tokenId, player.color, from, to, inferredSteps, () => {
                    // Move finished.

                    if (isFinishing) {
                        this.tokenAnim.animateFinish(tokenId, to, () => {
                            this.soundManager.play('finish');
                            resolve();
                        });
                    }
                    // If capture, trigger capture animation on victim.
                    else if (isCapture && capturedToken) {
                        // We need the grid index of the capture collision.
                        // It's 'to.position' (on MAIN_TRACK).
                        this.soundManager.play('capture');
                        this.tokenAnim.animateCaptureEffect(capturedToken.tokenId, to.position, capturedToken.color, resolve);
                    } else {
                        resolve();
                    }
                });
            }
            else if (event.type === 'GAME_OVER') {
                this.soundManager.play('win');
                resolve();
            }
            else if (event.type === 'TURN_STARTED') {
                // Highlight active player
                const { playerId } = event.payload;
                // Determine player index? Or just color.
                // TurnHighlighter is global for now.
                // We can't really "animate" this, just toggle.
                resolve();
            }
            else {
                resolve();
            }
        });
    }

    render() {
        const state = this.game.getState();

        // Update highlighter
        this.highlighter.setActive(state.phase !== 'GAME_OVER');

        // 1. Clear
        this.renderer.clear();

        // 2. Get Context
        const context = this.renderer.getContext();

        // 3. Draw Board
        BoardRenderer.draw(context);

        // 4. Draw Tokens
        // Need to pass Highlighter pulse opacity?
        // TokenRenderer doesn't use it yet.
        // We can pass it as a global 'pulse' param to renderer?
        // Or just let active tokens glow.

        const validMoves = this.game.getMoves();
        TokenRenderer.draw(context, state, validMoves, this.tokenAnim);

        // 5. Draw Dice
        const canRoll = state.phase === 'WAITING_FOR_ROLL' && !this.diceAnim.isAnimating();
        DiceUI.draw(context, state, canRoll, this.diceAnim);
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        this.animator.stop();
    }
}
