import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Audio context for web audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

type SoundType = 
  | 'move' 
  | 'capture' 
  | 'check' 
  | 'checkmate' 
  | 'success' 
  | 'failure' 
  | 'levelComplete'
  | 'timerWarning'
  | 'click';

const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; volume?: number }> = {
  move: { frequency: 220, duration: 0.08, type: 'sine', volume: 0.3 },
  capture: { frequency: 180, duration: 0.15, type: 'square', volume: 0.4 },
  check: { frequency: 440, duration: 0.2, type: 'triangle', volume: 0.5 },
  checkmate: { frequency: 880, duration: 0.5, type: 'sine', volume: 0.6 },
  success: { frequency: 523.25, duration: 0.3, type: 'sine', volume: 0.5 },
  failure: { frequency: 200, duration: 0.4, type: 'sawtooth', volume: 0.4 },
  levelComplete: { frequency: 659.25, duration: 0.4, type: 'sine', volume: 0.6 },
  timerWarning: { frequency: 350, duration: 0.15, type: 'square', volume: 0.3 },
  click: { frequency: 600, duration: 0.05, type: 'sine', volume: 0.2 },
};

export function useGameSounds() {
  const { profile } = useAuth();
  const isEnabledRef = useRef(true);
  
  useEffect(() => {
    isEnabledRef.current = profile?.sound_enabled ?? true;
  }, [profile?.sound_enabled]);

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const config = soundConfigs[type];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(config.volume ?? 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);

      // Special handling for multi-tone sounds
      if (type === 'success' || type === 'levelComplete') {
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(config.frequency * 1.25, ctx.currentTime);
          gain2.gain.setValueAtTime(config.volume ?? 0.3, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.2);
        }, 100);
      }
      
      if (type === 'checkmate') {
        // Victory fanfare
        [1, 1.25, 1.5, 2].forEach((mult, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(config.frequency * mult, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
          }, i * 100);
        });
      }
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  return { playSound };
}
