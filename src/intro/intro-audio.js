/**
 * HIGHVERZ — CINEMATIC AUDIO SYNTHESIZER
 * Procedural Web Audio API sound design (zero external asset dependencies).
 * Safe autoplay, soft volume, non-intrusive luxury editorial aesthetic.
 */

class IntroAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.28, this.ctx.currentTime); // Controlled soft master
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  ensureRunning() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Stage 01: Low atmospheric ambient hum (55Hz sub-drone)
  playAtmosphericHum() {
    this.ensureRunning();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 3.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.6);
    } catch (e) {}
  }

  // Stage 02: Rocket Ignition (muffled burst + rising hiss)
  playIgnition() {
    this.ensureRunning();
    if (!this.ctx || this.isMuted) return;

    try {
      // Noise buffer
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch (e) {}
  }

  // Stage 03: Lift off thrust
  playThrust() {
    this.ensureRunning();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 1.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.26, this.ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.3);
    } catch (e) {}
  }

  // Stage 04: Breakthrough & Glass/Metal Fracture
  playFracture() {
    this.ensureRunning();
    if (!this.ctx || this.isMuted) return;

    try {
      // High-frequency crystal resonance chime
      const freqs = [1200, 1850, 2400, 3200];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + Math.random() * 80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.9);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
      });

      // Impact sub-boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(110, this.ctx.currentTime);
      boom.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.6);

      boomGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      boom.connect(boomGain);
      boomGain.connect(this.masterGain);

      boom.start();
      boom.stop(this.ctx.currentTime + 0.8);
    } catch (e) {}
  }

  // Stage 05 & 06: Whoosh & Arrival
  playWhoosh() {
    this.ensureRunning();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 1.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {}
  }

  dispose() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const introAudio = new IntroAudioEngine();
