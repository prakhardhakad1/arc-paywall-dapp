/**
 * Pure Web Audio API Synthesizer
 * Zero external MP3 network requests, zero latency, works 100% offline.
 * Produces crisp, Apple Pay-style sensory feedback for payments and tips.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Apple Pay-style ascending payment confirmation chime
 * Tone 1: Ab5 (830.6 Hz) -> Tone 2: C6 (1046.5 Hz) with gentle harmonic decay
 */
export function playUnlockChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: Ab5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(830.61, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Tone 2: C6 (The classic Apple chime upper note)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.09);

    // Overtone shimmer
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(2093.0, now + 0.09); // octave harmonic
    gainHarmonic.gain.setValueAtTime(0.001, now + 0.09);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.06, now + 0.11);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    gain2.gain.setValueAtTime(0.001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(ctx.destination);

    osc2.start(now + 0.09);
    osc2.stop(now + 0.46);
    oscHarmonic.start(now + 0.09);
    oscHarmonic.stop(now + 0.36);
  } catch (e) {
    console.debug('Web Audio chime bypassed:', e);
  }
}

/**
 * Cheerful ascending triple-tone for creator tipping
 */
export function playTipChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  } catch (e) {
    console.debug('Tip chime bypassed:', e);
  }
}
