/**
 * Ludo Sound Manager
 * 
 * Manages audio playback using Web Audio API.
 * Handles:
 * - Preloading sounds
 * - Mute/Unmute
 * - Cooldowns to prevent spam
 * - Mobile interaction unlocking
 */

export class SoundManager {
    constructor() {
        this.ctx = null; // AudioContext
        this.buffers = new Map(); // name -> AudioBuffer
        this.isMuted = false;
        this.isUnlocked = false;

        // Cooldowns
        this.lastPlayTime = new Map(); // soundName -> timestamp
        this.cooldowns = {
            'move': 100,    // 100ms cooldown for move sounds
            'roll': 500,    // 500ms for roll
            'capture': 200,
            'finish': 500,
            'win': 5000     // Only play once every 5s if triggered repeatedly
        };

        // Sound manifest (paths relative to public root)
        this.sounds = {
            'roll': '/sounds/ludo/dice-roll.mp3',
            'move': '/sounds/ludo/token-move.mp3',
            'capture': '/sounds/ludo/capture.mp3',
            'finish': '/sounds/ludo/token-finish.mp3',
            'win': '/sounds/ludo/game-win.mp3'
        };

        // Initialize (lazy load on interaction to respect autoplay)
        this._initAudio();
    }

    _initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this._preloadSounds();
            } else {
                console.warn('Web Audio API not supported');
            }
        } catch (e) {
            console.error('Failed to init audio', e);
        }
    }

    async _preloadSounds() {
        for (const [name, path] of Object.entries(this.sounds)) {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Failed to load ${path}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.buffers.set(name, audioBuffer);
            } catch (e) {
                console.warn(`Could not load sound: ${name}`, e);
            }
        }
    }

    /**
     * Unlock audio context on first user interaction
     */
    unlock() {
        if (this.isUnlocked || !this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.isUnlocked = true;
            });
        } else {
            this.isUnlocked = true;
        }
    }

    /**
     * Play a sound by name
     * @param {string} name 
     */
    play(name) {
        if (this.isMuted || !this.ctx || !this.buffers.has(name)) return;

        // Check cooldown
        const now = Date.now();
        const last = this.lastPlayTime.get(name) || 0;
        const cooldown = this.cooldowns[name] || 50;

        if (now - last < cooldown) return;

        this.lastPlayTime.set(name, now);

        try {
            const source = this.ctx.createBufferSource();
            source.buffer = this.buffers.get(name);

            // Gain node for volume control
            const gainNode = this.ctx.createGain();

            // Adjust volume per sound type if needed
            if (name === 'move') gainNode.gain.value = 0.5; // Softer
            else if (name === 'win') gainNode.gain.value = 0.8;
            else gainNode.gain.value = 0.6;

            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            source.start(0);
        } catch (e) {
            console.error(`Error playing sound: ${name}`, e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        // Logic to suspend/resume context or just block play() calls?
        // Blocking calls is safer for instant responsiveness.
        return this.isMuted;
    }
}
