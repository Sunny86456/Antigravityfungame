import { createGame } from './games/ludo/engine/index.js';
import { GameUI } from './games/ludo/ui/GameUI.js';

console.log('🚀 Ludo Bootstrap Starting...');

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('ludo-canvas');
    if (!canvas) {
        console.error('❌ Canvas element not found!');
        return;
    }
    console.log('✅ Canvas found:', canvas);

    // Resize canvas to fit screen (max 800px)
    const size = Math.min(window.innerWidth - 40, window.innerHeight - 40, 800);
    const dpr = window.devicePixelRatio || 1;

    // Set display size (css)
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Normalize coordinate system to use css pixels.
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    console.log(`📏 Canvas sized to ${size}x${size} (DPR: ${dpr})`);

    try {
        // Create Game Engine
        // Use config from modal or default to 2-player AI
        // @ts-ignore
        const config = window.__LUDO_CONFIG__ || {
            players: [
                { id: 'p1', name: 'Player 1', type: 'HUMAN', color: 'RED' },
                { id: 'p2', name: 'Bot', type: 'AI', color: 'GREEN' }
            ]
        };

        // Ensure players have types (engine requires defined types)
        // If coming from raw object, enum values might be missing if not imported
        // But LudoModeModal imports PlayerType so it should be fine.

        const gameConfig = {
            players: config.players
        };

        console.log('⚙️ Creating game engine...', gameConfig);
        const game = createGame(gameConfig);
        console.log('✅ Game engine created:', game);

        // Initialize UI
        console.log('🎨 Initializing GameUI...');
        const ui = new GameUI(game, canvas);
        console.log('✅ GameUI initialized:', ui);

        // ── Pause button wiring ──────────────────────────────
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (ui.isPaused) {
                    ui.resume();
                    pauseBtn.textContent = '⏸';
                    pauseBtn.title = 'Pause';
                } else {
                    ui.pause();
                    pauseBtn.textContent = '▶';
                    pauseBtn.title = 'Resume';
                }
            });
        }

        // Expose for debugging
        window.__LUDO_UI__ = ui;

        console.log('🎲 Game Ready! Click board to unlock audio.');

    } catch (error) {
        console.error('🔥 Error bootstrapping game:', error);
    }
});
