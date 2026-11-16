/**
 * CYBER RUNNER - Cyberpunk Rooftop Endless Runner Engine
 * Tech: HTML5 Canvas API, Pure Vanilla JS, Web Audio API Sound Synthesizer, LocalStorage
 */

(function () {
  'use strict';

  /* ==========================================================================
     Constants & Configuration
     ========================================================================== */
  const V_WIDTH = 800;
  const V_HEIGHT = 500;
  const STORAGE_HIGH_SCORE = 'playrush_cyber_runner_highscore';
  const STORAGE_MUTED = 'playrush_cr_sound_muted';
  const STORAGE_MUSIC_ENABLED = 'playrush_cr_music_enabled';
  const STORAGE_MUSIC_VOLUME = 'playrush_cr_music_volume';

  // Physics constants (all per-second values for fixed-timestep)
  const GRAVITY = 2800;            // px/s^2
  const JUMP_VELOCITY = -820;      // px/s (negative = upward)
  const GROUND_Y = V_HEIGHT - 100; // baseline ground level
  const PLAYER_X = 120;            // fixed horizontal position

  // Player dimensions
  const PLAYER_W = 36;
  const PLAYER_H = 56;
  const PLAYER_SLIDE_H = 28;

  // Game timing
  const FIXED_DELTA_MS = 1000 / 60; // 16.6667ms fixed timestep
  const FIXED_DELTA_S = FIXED_DELTA_MS / 1000;
  const MAX_FRAME_MS = 200;         // clamp to prevent spiral of death

  // Speed & difficulty
  const BASE_SPEED = 360;           // px/s base horizontal scroll speed
  const SPEED_ACCEL = 0.00018;      // speed multiplier increase per score point
  const MIN_OBSTACLE_GAP = 280;     // minimum px between obstacles
  const MAX_OBSTACLE_GAP = 520;     // maximum px between obstacles

  // Colors
  const C = {
    BG_SKY_TOP: '#050711',
    BG_SKY_BOT: '#0d122b',
    BUILDING_DARK: '#080c1e',
    BUILDING_MID: '#0c1228',
    BUILDING_FRONT: '#101835',
    PLATFORM: '#141c40',
    PLATFORM_TOP: '#1a2350',
    PLATFORM_EDGE: '#a855f7',
    NEON_CYAN: '#00f0ff',
    NEON_PURPLE: '#a855f7',
    NEON_PINK: '#ff007f',
    NEON_GREEN: '#00ff88',
    NEON_AMBER: '#fbbf24',
    PLAYER_BODY: '#0d142d',
    PLAYER_OUTLINE: '#00f0ff',
    PLAYER_VISOR: '#a855f7',
    OBSTACLE_SPIKE: '#ff007f',
    OBSTACLE_BARRIER: '#a855f7',
    ORB_GLOW: '#00ff88',
    STAR: 'rgba(255, 255, 255, 0.4)',
    GAP_WARN: 'rgba(255, 0, 127, 0.3)'
  };

  // Safe LocalStorage helpers
  function safeGetStorage(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultVal;
      if (typeof defaultVal === 'number') {
        const parsed = parseInt(raw, 10);
        return isNaN(parsed) || parsed < 0 ? defaultVal : Math.min(parsed, 999999999);
      }
      return raw;
    } catch (e) {
      return defaultVal;
    }
  }

  function safeSetStorage(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) { /* quota exceeded or blocked */ }
  }

  /* ==========================================================================
     Web Audio API - Synthesized Cyberpunk Sound Effects
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = safeGetStorage(STORAGE_MUTED, 'false') === 'true';
      this.masterGain = null;
      this.sfxGain = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.isMuted ? 0 : 0.35;
        this.sfxGain.connect(this.masterGain);
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(muted) {
      this.isMuted = !!muted;
      safeSetStorage(STORAGE_MUTED, String(this.isMuted));
      if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.sfxGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.05);
      }
      return this.isMuted;
    }

    toggleMute() {
      return this.setMuted(!this.isMuted);
    }

    playJump() {
      if (this.isMuted || !this.ctx || !this.sfxGain) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    playOrbCollect() {
      if (this.isMuted || !this.ctx || !this.sfxGain) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playCollision() {
      if (this.isMuted || !this.ctx || !this.sfxGain) return;
      this.resume();
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.2);
    }

    playGameOver() {
      if (this.isMuted || !this.ctx || !this.sfxGain) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.setValueAtTime(0.3, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.8);
    }
  }

  /* ==========================================================================
     Procedural Cyberpunk Industrial OST Engine (Web Audio API)
     Relentless 140 BPM Darksynth / Industrial EBM in F minor Phrygian
     ========================================================================== */
  class MusicEngine {
    constructor(soundEngine) {
      this.soundEngine = soundEngine;
      this.musicGain = null;
      this.isPlaying = false;
      this.isFading = false;
      this.schedulerTimer = null;
      this.nextNoteTime = 0;
      this.currentStep = 0;

      // Active oscillator/source tracking for clean teardown
      this.activeNodes = [];

      // Load preferences safely (Defaults: Music OFF, Volume 35%)
      let enabled = false;
      let volume = 0.35;
      try {
        enabled = localStorage.getItem(STORAGE_MUSIC_ENABLED) === 'true';
        const rawVol = localStorage.getItem(STORAGE_MUSIC_VOLUME);
        if (rawVol !== null) {
          const parsed = parseFloat(rawVol);
          if (!isNaN(parsed) && parsed >= 0) {
            volume = parsed > 1 ? parsed / 100 : parsed;
          }
        }
      } catch (e) {}
      this.enabled = enabled;
      this.volume = Math.max(0, Math.min(1, volume));

      // Composition parameters: 140 BPM, F minor Phrygian dark cyberpunk
      this.bpm = 140;
      this.totalSteps = 64; // 4 bars * 16 steps per bar
      this.secondsPerBeat = 60 / this.bpm;
      this.secondsPer16th = this.secondsPerBeat / 4;

      // Relentless 16th-note driving EBM/Industrial rolling bassline (64 steps)
      this.bassPattern = [
        // Bar 1: F minor industrial pulse
        43.65, 43.65, 87.31, 43.65,  43.65, 87.31, 51.91, 43.65,
        43.65, 43.65, 87.31, 43.65,  65.41, 51.91, 43.65, 87.31,
        // Bar 2: Db heavy dark drop
        34.65, 34.65, 69.30, 34.65,  34.65, 69.30, 43.65, 34.65,
        34.65, 34.65, 69.30, 34.65,  51.91, 43.65, 34.65, 69.30,
        // Bar 3: Eb/Gb Phrygian tension
        38.89, 38.89, 77.78, 38.89,  46.25, 77.78, 38.89, 77.78,
        38.89, 38.89, 77.78, 38.89,  58.27, 46.25, 38.89, 77.78,
        // Bar 4: C dominant -> F turnaround
        32.70, 32.70, 65.41, 32.70,  32.70, 65.41, 41.20, 32.70,
        49.00, 58.27, 65.41, 77.78,  87.31, 77.78, 65.41, 51.91
      ];

      // Darksynth lead stabs / acid riff (synced to 16th note steps)
      this.leadPattern = [
        // Bar 1: F minor cyberpunk stabs
        { step: 0,  note: 349.23, dur: 0.14 }, // F4
        { step: 3,  note: 415.30, dur: 0.14 }, // Ab4
        { step: 6,  note: 523.25, dur: 0.18 }, // C5
        { step: 10, note: 622.25, dur: 0.14 }, // Eb5
        { step: 12, note: 523.25, dur: 0.14 }, // C5
        { step: 14, note: 415.30, dur: 0.14 }, // Ab4
        // Bar 2: Db heavy stabs
        { step: 16, note: 277.18, dur: 0.14 }, // Db4
        { step: 19, note: 349.23, dur: 0.14 }, // F4
        { step: 22, note: 415.30, dur: 0.18 }, // Ab4
        { step: 26, note: 523.25, dur: 0.14 }, // C5
        { step: 28, note: 415.30, dur: 0.14 }, // Ab4
        { step: 30, note: 349.23, dur: 0.14 }, // F4
        // Bar 3: Eb dark chromatic riff
        { step: 32, note: 311.13, dur: 0.14 }, // Eb4
        { step: 35, note: 392.00, dur: 0.14 }, // G4
        { step: 38, note: 466.16, dur: 0.18 }, // Bb4
        { step: 42, note: 523.25, dur: 0.14 }, // C5
        { step: 44, note: 466.16, dur: 0.14 }, // Bb4
        { step: 46, note: 392.00, dur: 0.14 }, // G4
        // Bar 4: C riser into crescendo
        { step: 48, note: 261.63, dur: 0.14 }, // C4
        { step: 51, note: 329.63, dur: 0.14 }, // E4
        { step: 54, note: 392.00, dur: 0.14 }, // G4
        { step: 56, note: 466.16, dur: 0.14 }, // Bb4
        { step: 58, note: 523.25, dur: 0.14 }, // C5
        { step: 60, note: 622.25, dur: 0.16 }, // Eb5
        { step: 62, note: 698.46, dur: 0.22 }, // F5 climax
      ];

      // Atmospheric dystopian drone pad (F2, C3, Ab3)
      this.dronePattern = [
        { step: 0,  notes: [87.31, 130.81, 174.61], dur: 1.6 }, // F2, C3, F3
        { step: 16, notes: [69.30, 103.83, 138.59], dur: 1.6 }, // Db2, Ab2, Db3
        { step: 32, notes: [77.78, 116.54, 155.56], dur: 1.6 }, // Eb2, Bb2, Eb3
        { step: 48, notes: [65.41, 98.00,  130.81], dur: 1.6 }, // C2, G2, C3
      ];
    }

    initGain() {
      if (this.musicGain || !this.soundEngine.ctx) return;
      this.musicGain = this.soundEngine.ctx.createGain();
      this.musicGain.gain.value = this.enabled ? this.volume : 0;
      this.musicGain.connect(this.soundEngine.masterGain);
    }

    setVolume(val) {
      this.volume = Math.max(0, Math.min(1, val));
      safeSetStorage(STORAGE_MUSIC_VOLUME, String(Math.round(this.volume * 100)));
      if (this.musicGain && this.soundEngine.ctx && this.enabled && this.isPlaying) {
        this.musicGain.gain.cancelScheduledValues(this.soundEngine.ctx.currentTime);
        this.musicGain.gain.setTargetAtTime(this.volume, this.soundEngine.ctx.currentTime, 0.05);
      }
    }

    setEnabled(on, isGameActive = false) {
      this.enabled = !!on;
      safeSetStorage(STORAGE_MUSIC_ENABLED, String(this.enabled));
      if (this.enabled) {
        if (!this.isPlaying && isGameActive) {
          this.start();
        }
      } else {
        if (this.isPlaying) {
          this.stop();
        }
      }
    }

    start() {
      if (!this.enabled || this.isPlaying) return;
      const ctx = this.soundEngine.ctx;
      if (!ctx) return;
      this.soundEngine.resume();
      this.initGain();
      this.isFading = false;
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.08);
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = ctx.currentTime + 0.08;
      this._startScheduler();
    }

    pause() {
      if (!this.isPlaying) return;
      this._stopScheduler();
      if (this.musicGain && this.soundEngine.ctx) {
        this.musicGain.gain.cancelScheduledValues(this.soundEngine.ctx.currentTime);
        this.musicGain.gain.setTargetAtTime(0, this.soundEngine.ctx.currentTime, 0.08);
      }
    }

    unpause() {
      if (!this.enabled || !this.isPlaying) return;
      const ctx = this.soundEngine.ctx;
      if (!ctx) return;
      this.soundEngine.resume();
      this.isFading = false;
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.08);
      this.nextNoteTime = ctx.currentTime + 0.05;
      this._startScheduler();
    }

    fadeOutAndStop(duration = 0.8) {
      if (!this.isPlaying) return;
      this.isFading = true;
      const ctx = this.soundEngine.ctx;
      if (ctx && this.musicGain) {
        this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
        this.musicGain.gain.setTargetAtTime(0, ctx.currentTime, duration / 4);
      }
      setTimeout(() => {
        if (this.isFading) {
          this.stop();
        }
      }, duration * 1000 + 100);
    }

    stop() {
      this._stopScheduler();
      this._cleanupNodes();
      this.isPlaying = false;
      this.isFading = false;
      this.currentStep = 0;
      if (this.musicGain && this.soundEngine.ctx) {
        this.musicGain.gain.cancelScheduledValues(this.soundEngine.ctx.currentTime);
        this.musicGain.gain.value = 0;
      }
    }

    _startScheduler() {
      this._stopScheduler();
      this.schedulerTimer = setInterval(() => this._schedule(), 40);
    }

    _stopScheduler() {
      if (this.schedulerTimer !== null) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
    }

    _cleanupNodes() {
      for (const node of this.activeNodes) {
        try { node.stop(); } catch (e) {}
        try { node.disconnect(); } catch (e) {}
      }
      this.activeNodes = [];
    }

    _schedule() {
      const ctx = this.soundEngine.ctx;
      if (!ctx || !this.isPlaying) return;

      const lookAhead = 0.15;
      while (this.nextNoteTime < ctx.currentTime + lookAhead) {
        this._scheduleStep(this.currentStep % this.totalSteps, this.nextNoteTime);
        this.nextNoteTime += this.secondsPer16th;
        this.currentStep = (this.currentStep + 1) % this.totalSteps;
      }
    }

    _scheduleStep(step, time) {
      const ctx = this.soundEngine.ctx;

      // 1. Relentless rolling Cyberpunk Bass (every 16th note)
      const bassFreq = this.bassPattern[step];
      if (bassFreq) {
        this._playCyberBass(ctx, bassFreq, time, 0.11);
      }

      // 2. Industrial Four-on-the-Floor Kick Drum (every quarter note)
      if (step % 4 === 0) {
        this._playCyberKick(ctx, time);
      }

      // 3. Heavy Industrial Snare / Clap (beats 1 and 3)
      if (step % 8 === 4) {
        this._playCyberSnare(ctx, time);
      }

      // 4. Sizzling Metallic Cyber Hi-Hats (every 16th note, open offbeat)
      const isOpenHat = (step % 4 === 2);
      this._playCyberHihat(ctx, time, isOpenHat);

      // 5. Darksynth Lead Stabs / Acid Riff
      for (const lead of this.leadPattern) {
        if (lead.step === step) {
          this._playCyberLead(ctx, lead.note, time, lead.dur);
        }
      }

      // 6. Deep Atmospheric Drone Chords
      for (const drone of this.dronePattern) {
        if (drone.step === step) {
          this._playCyberDrone(ctx, drone.notes, time, drone.dur);
        }
      }

      // 7. Dystopian Cyber Siren Sweep (Bar 4 tension riser)
      if (step === 56) {
        this._playCyberSiren(ctx, time);
      }
    }

    _trackNode(node) {
      this.activeNodes.push(node);
      if (node.addEventListener) {
        node.addEventListener('ended', () => {
          const idx = this.activeNodes.indexOf(node);
          if (idx >= 0) this.activeNodes.splice(idx, 1);
        });
      }
    }

    _playCyberBass(ctx, freq, time, dur) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sawtooth + square sub-oscillator
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq * 0.5, time); // sub-octave weight

      // Resonant lowpass filter with punchy envelope sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + dur);
      filter.Q.value = 6; // high resonance for gritty acid character

      gain.gain.setValueAtTime(0.46, time);
      gain.gain.setValueAtTime(0.42, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + dur + 0.03);
      osc2.stop(time + dur + 0.03);
      this._trackNode(osc1);
      this._trackNode(osc2);
    }

    _playCyberLead(ctx, freq, time, dur) {
      for (const detune of [-9, 9]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2800, time);
        filter.frequency.exponentialRampToValueAtTime(650, time + dur);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.03);
        this._trackNode(osc);
      }
    }

    _playCyberDrone(ctx, freqs, time, dur) {
      for (const freq of freqs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 12, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, time);
        filter.Q.value = 1.5;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.065, time + 0.2);
        gain.gain.setValueAtTime(0.055, time + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.05);
        this._trackNode(osc);
      }
    }

    _playCyberKick(ctx, time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

      gain.gain.setValueAtTime(0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.16);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.20);
      this._trackNode(osc);

      // High-frequency transient click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(800, time);
      click.frequency.exponentialRampToValueAtTime(80, time + 0.015);
      clickGain.gain.setValueAtTime(0.28, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      click.connect(clickGain);
      clickGain.connect(this.musicGain);
      click.start(time);
      click.stop(time + 0.025);
      this._trackNode(click);
    }

    _playCyberSnare(ctx, time) {
      // White noise burst
      const bufLen = Math.floor(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.Q.value = 2.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.52, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.13);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.15);
      this._trackNode(noise);

      // Tonal body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, time);
      osc.frequency.exponentialRampToValueAtTime(90, time + 0.06);
      oscGain.gain.setValueAtTime(0.32, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
      osc.connect(oscGain);
      oscGain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.1);
      this._trackNode(osc);
    }

    _playCyberHihat(ctx, time, isOpen = false) {
      const dur = isOpen ? 0.09 : 0.035;
      const vol = isOpen ? 0.26 : 0.15;

      const bufLen = Math.floor(ctx.sampleRate * (dur + 0.02));
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8500;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + dur + 0.02);
      this._trackNode(noise);
    }

    _playCyberSiren(ctx, time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, time);
      osc.frequency.exponentialRampToValueAtTime(920, time + 0.8);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, time);
      filter.frequency.exponentialRampToValueAtTime(2400, time + 0.8);
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.9);
      this._trackNode(osc);
    }
  }

  const sound = new SoundEngine();
  const music = new MusicEngine(sound);

  /* ==========================================================================
     Game State
     ========================================================================== */
  const STATE = { READY: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };
  let gameState = STATE.READY;

  // Canvas and rendering
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let scaleX = 1, scaleY = 1;

  // Player state
  let player = {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    runFrame: 0,
    runTimer: 0,
    alive: true
  };

  // World state
  let platforms = [];
  let obstacles = [];
  let orbs = [];
  let particles = [];
  let bgBuildings = [];     // parallax buildings
  let bgStars = [];          // background stars
  let score = 0;
  let distance = 0;          // metres traveled
  let orbsCollected = 0;
  let highScore = 0;
  let currentSpeed = BASE_SPEED;
  let nextObstacleX = V_WIDTH + 200;
  let nextOrbX = V_WIDTH + 350;
  let platformSeedX = 0;    // tracks where next platform begins

  // Input state
  let inputJump = false;
  let inputSlide = false;
  let jumpKeyHeld = false;

  // Fixed-timestep accumulator
  let lastTimestamp = 0;
  let accumulator = 0;
  let animFrameId = null;

  // Slide duration
  const SLIDE_DURATION = 0.5; // seconds

  /* ==========================================================================
     Background Generation
     ========================================================================== */
  function initBackground() {
    bgStars = [];
    for (let i = 0; i < 80; i++) {
      bgStars.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * (GROUND_Y - 60),
        size: Math.random() * 1.8 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.3 + 0.1
      });
    }

    bgBuildings = [];
    // Three parallax layers
    for (let layer = 0; layer < 3; layer++) {
      const count = layer === 0 ? 8 : (layer === 1 ? 12 : 16);
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: i * (V_WIDTH / count) + Math.random() * 20,
          w: 30 + Math.random() * 60,
          h: 60 + Math.random() * (120 + layer * 40),
          hasAntenna: Math.random() > 0.6,
          windowRows: Math.floor(Math.random() * 4) + 2,
          windowCols: Math.floor(Math.random() * 3) + 1,
          neonHue: Math.random() > 0.7 ? (Math.random() > 0.5 ? C.NEON_CYAN : C.NEON_PURPLE) : null
        });
      }
      bgBuildings.push({ layer, parallax: 0.1 + layer * 0.12, items: arr });
    }
  }

  /* ==========================================================================
     Platform Generation
     ========================================================================== */
  function initPlatforms() {
    platforms = [];
    platformSeedX = 0;
    // Create initial platforms covering the screen
    let x = 0;
    while (x < V_WIDTH + 400) {
      const w = 200 + Math.random() * 300;
      platforms.push({
        x: x,
        y: GROUND_Y,
        w: w,
        hasGap: false
      });
      x += w;
    }
    platformSeedX = x;
  }

  function spawnPlatform() {
    const speed = currentSpeed;
    // Decide if there's a gap
    const hasGap = distance > 50 && Math.random() < 0.3;
    const gapW = hasGap ? (60 + Math.random() * 60) : 0;

    const startX = platformSeedX + gapW;
    const w = 180 + Math.random() * 350;

    if (hasGap) {
      // Mark a gap segment
      platforms.push({
        x: platformSeedX,
        y: GROUND_Y,
        w: gapW,
        hasGap: true
      });
    }

    platforms.push({
      x: startX,
      y: GROUND_Y,
      w: w,
      hasGap: false
    });

    platformSeedX = startX + w;
  }

  /* ==========================================================================
     Obstacle & Orb Generation
     ========================================================================== */
  function spawnObstacle() {
    const type = Math.random();
    let obs;

    if (type < 0.45) {
      // Ground spike — must jump over
      const h = 30 + Math.random() * 20;
      obs = {
        x: nextObstacleX,
        y: GROUND_Y - h,
        w: 24 + Math.random() * 16,
        h: h,
        type: 'spike'
      };
    } else if (type < 0.75) {
      // Overhead barrier — must slide under
      obs = {
        x: nextObstacleX,
        y: GROUND_Y - PLAYER_H - 10 - Math.random() * 20,
        w: 60 + Math.random() * 40,
        h: 18,
        type: 'barrier'
      };
    } else {
      // Double-height wall — must jump over
      const h = 40 + Math.random() * 25;
      obs = {
        x: nextObstacleX,
        y: GROUND_Y - h,
        w: 20 + Math.random() * 12,
        h: h,
        type: 'wall'
      };
    }

    obstacles.push(obs);

    // Calculate next obstacle distance based on speed
    const gap = MIN_OBSTACLE_GAP + Math.random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP);
    const speedFactor = Math.max(0.6, 1.0 - (score * 0.0001));
    nextObstacleX += gap * speedFactor;
  }

  function spawnOrb() {
    const yVariant = Math.random();
    let y;
    if (yVariant < 0.4) {
      y = GROUND_Y - 30; // low orb
    } else if (yVariant < 0.7) {
      y = GROUND_Y - 60; // mid orb (need small jump)
    } else {
      y = GROUND_Y - 100; // high orb (need full jump)
    }

    orbs.push({
      x: nextOrbX,
      y: y,
      r: 10,
      collected: false,
      glow: 0
    });

    nextOrbX += 200 + Math.random() * 350;
  }

  /* ==========================================================================
     Particle System
     ========================================================================== */
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.8) * 250,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 2 + Math.random() * 4,
        color: color
      });
    }
  }

  /* ==========================================================================
     Fixed-Timestep Simulation Update
     ========================================================================== */
  function fixedUpdate() {
    const dt = FIXED_DELTA_S;

    // Calculate current speed
    currentSpeed = BASE_SPEED + score * SPEED_ACCEL * BASE_SPEED;

    // Scroll everything
    const scrollDx = currentSpeed * dt;
    distance += scrollDx / 50; // rough metre conversion

    // Update score (distance-based)
    score += dt * 10 * (1 + distance * 0.001);

    // --- Player physics ---
    const pHeight = player.isSliding ? PLAYER_SLIDE_H : PLAYER_H;

    // Jump input
    if (inputJump && !player.isJumping && !player.isSliding) {
      player.vy = JUMP_VELOCITY;
      player.isJumping = true;
      sound.playJump();
      spawnParticles(player.x + PLAYER_W / 2, GROUND_Y, C.NEON_CYAN, 5);
    }
    inputJump = false; // consume

    // Slide input
    if (inputSlide && !player.isJumping && !player.isSliding) {
      player.isSliding = true;
      player.slideTimer = SLIDE_DURATION;
      player.h = PLAYER_SLIDE_H;
      player.y = GROUND_Y - PLAYER_SLIDE_H;
    }

    // Update slide timer
    if (player.isSliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.isSliding = false;
        player.h = PLAYER_H;
        player.y = GROUND_Y - PLAYER_H;
        player.slideTimer = 0;
      }
    }

    // Apply gravity when jumping
    if (player.isJumping) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;

      // Land on ground
      if (player.y >= GROUND_Y - pHeight) {
        player.y = GROUND_Y - pHeight;
        player.vy = 0;
        player.isJumping = false;
      }
    }

    // Check if player is over a gap
    let overGap = true;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.hasGap) continue;
      if (player.x + PLAYER_W > p.x && player.x < p.x + p.w) {
        overGap = false;
        break;
      }
    }

    // Fall into gap
    if (overGap && !player.isJumping && player.y + pHeight >= GROUND_Y) {
      player.isJumping = true; // start falling
      player.vy = 0;
    }

    // Death by falling
    if (player.y > V_HEIGHT + 50) {
      triggerGameOver();
      return;
    }

    // Run animation
    player.runTimer += dt;
    if (player.runTimer > 0.08) {
      player.runFrame = (player.runFrame + 1) % 8;
      player.runTimer = 0;
    }

    // --- Scroll platforms ---
    for (let i = platforms.length - 1; i >= 0; i--) {
      platforms[i].x -= scrollDx;
      if (platforms[i].x + platforms[i].w < -50) {
        platforms.splice(i, 1);
      }
    }

    // Spawn new platforms as needed
    while (platformSeedX - scrollDx < V_WIDTH + 500) {
      spawnPlatform();
    }
    platformSeedX -= scrollDx;

    // --- Scroll and check obstacles ---
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= scrollDx;
      if (obstacles[i].x + obstacles[i].w < -50) {
        obstacles.splice(i, 1);
        continue;
      }

      // Collision check
      const o = obstacles[i];
      const px = player.x + 4;  // slight hitbox inset
      const py = player.y + 4;
      const pw = PLAYER_W - 8;
      const ph = (player.isSliding ? PLAYER_SLIDE_H : PLAYER_H) - 8;

      if (px < o.x + o.w && px + pw > o.x &&
          py < o.y + o.h && py + ph > o.y) {
        sound.playCollision();
        triggerGameOver();
        return;
      }
    }

    // Spawn new obstacles
    nextObstacleX -= scrollDx;
    if (nextObstacleX < V_WIDTH) {
      spawnObstacle();
    }

    // --- Scroll and check orbs ---
    for (let i = orbs.length - 1; i >= 0; i--) {
      orbs[i].x -= scrollDx;
      orbs[i].glow += dt * 3;
      if (orbs[i].x < -30) {
        orbs.splice(i, 1);
        continue;
      }

      if (orbs[i].collected) continue;

      // Collection check
      const o = orbs[i];
      const dx = (player.x + PLAYER_W / 2) - o.x;
      const dy = (player.y + player.h / 2) - o.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < o.r + 20) {
        o.collected = true;
        orbsCollected++;
        score += 50;
        sound.playOrbCollect();
        spawnParticles(o.x, o.y, C.ORB_GLOW, 8);
      }
    }

    // Spawn new orbs
    nextOrbX -= scrollDx;
    if (nextOrbX < V_WIDTH) {
      spawnOrb();
    }

    // --- Update particles ---
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt; // particle gravity
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // --- Scroll bg stars ---
    for (let i = 0; i < bgStars.length; i++) {
      bgStars[i].x -= scrollDx * 0.02;
      bgStars[i].twinkle += dt * 2;
      if (bgStars[i].x < -5) bgStars[i].x += V_WIDTH + 10;
    }

    // --- Scroll bg buildings ---
    for (let layer = 0; layer < bgBuildings.length; layer++) {
      const bg = bgBuildings[layer];
      for (let i = 0; i < bg.items.length; i++) {
        bg.items[i].x -= scrollDx * bg.parallax;
        if (bg.items[i].x + bg.items[i].w < -10) {
          bg.items[i].x += V_WIDTH + bg.items[i].w + Math.random() * 80;
          bg.items[i].h = 60 + Math.random() * (120 + layer * 40);
        }
      }
    }

    // Update HUD
    updateHUD();
  }

  /* ==========================================================================
     Rendering
     ========================================================================== */
  function render() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    skyGrad.addColorStop(0, C.BG_SKY_TOP);
    skyGrad.addColorStop(0.6, C.BG_SKY_BOT);
    skyGrad.addColorStop(1, '#0a0e20');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Stars
    for (const s of bgStars) {
      const alpha = 0.3 + 0.4 * Math.sin(s.twinkle);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Background buildings (parallax layers)
    for (const layer of bgBuildings) {
      const alphaBase = 0.15 + layer.layer * 0.1;
      for (const b of layer.items) {
        const bx = b.x;
        const by = GROUND_Y - b.h;

        // Building body
        ctx.fillStyle = layer.layer === 0 ? C.BUILDING_DARK :
                        layer.layer === 1 ? C.BUILDING_MID : C.BUILDING_FRONT;
        ctx.fillRect(bx, by, b.w, b.h + 10);

        // Neon accent line at top
        if (b.neonHue) {
          ctx.fillStyle = b.neonHue;
          ctx.fillRect(bx, by, b.w, 2);
          ctx.shadowColor = b.neonHue;
          ctx.shadowBlur = 8;
          ctx.fillRect(bx, by, b.w, 1);
          ctx.shadowBlur = 0;
        }

        // Windows
        const winW = 4;
        const winH = 4;
        const winPadX = 8;
        const winPadY = 10;
        for (let row = 0; row < b.windowRows; row++) {
          for (let col = 0; col < b.windowCols; col++) {
            const wx = bx + winPadX + col * (winW + 6);
            const wy = by + winPadY + row * (winH + 8);
            if (wx + winW > bx + b.w - 4) continue;
            const on = Math.sin(wx * 0.3 + wy * 0.5 + distance * 0.01) > 0;
            ctx.fillStyle = on ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)';
            ctx.fillRect(wx, wy, winW, winH);
          }
        }

        // Antenna
        if (b.hasAntenna) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx + b.w / 2, by);
          ctx.lineTo(bx + b.w / 2, by - 15);
          ctx.stroke();
          // Blinking light
          const blink = Math.sin(distance * 0.05 + bx) > 0.5;
          if (blink) {
            ctx.fillStyle = C.NEON_PINK;
            ctx.beginPath();
            ctx.arc(bx + b.w / 2, by - 15, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Platforms
    for (const p of platforms) {
      if (p.hasGap) {
        // Draw gap warning lines
        ctx.fillStyle = C.GAP_WARN;
        for (let lx = p.x; lx < p.x + p.w; lx += 12) {
          ctx.fillRect(lx, GROUND_Y + 2, 6, 4);
        }
        continue;
      }

      // Platform body
      ctx.fillStyle = C.PLATFORM;
      ctx.fillRect(p.x, p.y, p.w, V_HEIGHT - p.y);

      // Platform top surface
      ctx.fillStyle = C.PLATFORM_TOP;
      ctx.fillRect(p.x, p.y, p.w, 6);

      // Neon edge glow
      ctx.fillStyle = C.PLATFORM_EDGE;
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.shadowColor = C.PLATFORM_EDGE;
      ctx.shadowBlur = 10;
      ctx.fillRect(p.x, p.y, p.w, 1);
      ctx.shadowBlur = 0;

      // Surface detail lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.lineWidth = 1;
      for (let lx = Math.ceil(p.x / 40) * 40; lx < p.x + p.w; lx += 40) {
        ctx.beginPath();
        ctx.moveTo(lx, p.y + 6);
        ctx.lineTo(lx, p.y + 20);
        ctx.stroke();
      }
    }

    // Obstacles
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // Neon spike triangle
        ctx.fillStyle = C.OBSTACLE_SPIKE;
        ctx.shadowColor = C.OBSTACLE_SPIKE;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner triangle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const inset = 5;
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, o.y + inset);
        ctx.lineTo(o.x + o.w - inset, o.y + o.h - 2);
        ctx.lineTo(o.x + inset, o.y + o.h - 2);
        ctx.closePath();
        ctx.stroke();
      } else if (o.type === 'barrier') {
        // Overhead barrier
        ctx.fillStyle = C.OBSTACLE_BARRIER;
        ctx.shadowColor = C.OBSTACLE_BARRIER;
        ctx.shadowBlur = 10;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;

        // Hazard stripes
        ctx.fillStyle = 'rgba(255, 0, 127, 0.3)';
        const stripeW = 10;
        for (let sx = o.x; sx < o.x + o.w; sx += stripeW * 2) {
          ctx.fillRect(sx, o.y, stripeW, o.h);
        }

        // Support poles
        ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.fillRect(o.x, o.y + o.h, 4, GROUND_Y - o.y - o.h);
        ctx.fillRect(o.x + o.w - 4, o.y + o.h, 4, GROUND_Y - o.y - o.h);
      } else if (o.type === 'wall') {
        // Solid wall
        ctx.fillStyle = C.OBSTACLE_SPIKE;
        ctx.shadowColor = C.OBSTACLE_SPIKE;
        ctx.shadowBlur = 8;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;

        // Grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let gy = o.y + 8; gy < o.y + o.h; gy += 10) {
          ctx.beginPath();
          ctx.moveTo(o.x, gy);
          ctx.lineTo(o.x + o.w, gy);
          ctx.stroke();
        }
      }
    }

    // Energy Orbs
    for (const o of orbs) {
      if (o.collected) continue;
      const pulse = 0.7 + 0.3 * Math.sin(o.glow);

      // Outer glow
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${0.1 * pulse})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = C.ORB_GLOW;
      ctx.shadowColor = C.ORB_GLOW;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner highlight
      ctx.beginPath();
      ctx.arc(o.x - 2, o.y - 2, o.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    }

    // Player
    renderPlayer();

    // Particles
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ==========================================================================
     Player Rendering
     ========================================================================== */
  function renderPlayer() {
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;

    ctx.save();

    if (player.isSliding) {
      // Sliding pose — compact body
      // Body
      ctx.fillStyle = C.PLAYER_BODY;
      ctx.strokeStyle = C.PLAYER_OUTLINE;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.PLAYER_OUTLINE;
      ctx.shadowBlur = 10;

      // Low profile body
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 4, pw + 8, ph - 6, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Visor
      ctx.fillStyle = C.PLAYER_VISOR;
      ctx.shadowColor = C.PLAYER_VISOR;
      ctx.shadowBlur = 8;
      ctx.fillRect(px + pw - 2, py + 6, 12, 6);
      ctx.shadowBlur = 0;

      // Speed lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ly = py + 6 + i * 7;
        ctx.beginPath();
        ctx.moveTo(px - 10 - i * 5, ly);
        ctx.lineTo(px - 25 - i * 8, ly);
        ctx.stroke();
      }
    } else {
      // Standing/running/jumping pose
      const bobY = player.isJumping ? 0 : Math.sin(player.runFrame * 0.8) * 2;

      // Body
      ctx.fillStyle = C.PLAYER_BODY;
      ctx.strokeStyle = C.PLAYER_OUTLINE;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.PLAYER_OUTLINE;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.roundRect(px + 4, py + 12 + bobY, pw - 8, ph - 24, 4);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Head
      ctx.fillStyle = C.PLAYER_BODY;
      ctx.strokeStyle = C.PLAYER_OUTLINE;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.PLAYER_OUTLINE;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(px + 6, py + bobY, pw - 12, 16, [6, 6, 2, 2]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Visor
      ctx.fillStyle = C.PLAYER_VISOR;
      ctx.shadowColor = C.PLAYER_VISOR;
      ctx.shadowBlur = 10;
      ctx.fillRect(px + 10, py + 4 + bobY, pw - 14, 5);
      ctx.shadowBlur = 0;

      // Legs (animated)
      if (!player.isJumping) {
        const legPhase = player.runFrame;
        const legOffset1 = Math.sin(legPhase * 1.5) * 6;
        const legOffset2 = Math.sin(legPhase * 1.5 + Math.PI) * 6;

        ctx.strokeStyle = C.PLAYER_OUTLINE;
        ctx.lineWidth = 3;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(px + 12, py + ph - 12);
        ctx.lineTo(px + 12 + legOffset1, py + ph);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(px + pw - 12, py + ph - 12);
        ctx.lineTo(px + pw - 12 + legOffset2, py + ph);
        ctx.stroke();
      } else {
        // Jumping: legs tucked
        ctx.strokeStyle = C.PLAYER_OUTLINE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + ph - 12);
        ctx.lineTo(px + 6, py + ph - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + pw - 10, py + ph - 12);
        ctx.lineTo(px + pw - 6, py + ph - 4);
        ctx.stroke();
      }

      // Trail particles when running
      if (!player.isJumping && gameState === STATE.PLAYING && Math.random() > 0.5) {
        spawnParticles(px, py + ph, 'rgba(0, 240, 255, 0.5)', 1);
      }
    }

    ctx.restore();
  }

  /* ==========================================================================
     HUD Update
     ========================================================================== */
  function updateHUD() {
    const scoreEl = document.getElementById('hudScoreVal');
    const distEl = document.getElementById('hudDistanceVal');
    const orbEl = document.getElementById('hudOrbVal');
    const bestEl = document.getElementById('hudBestVal');

    if (scoreEl) scoreEl.textContent = Math.floor(score).toLocaleString();
    if (distEl) distEl.textContent = Math.floor(distance) + 'm';
    if (orbEl) orbEl.textContent = orbsCollected;
    if (bestEl) bestEl.textContent = Math.max(Math.floor(score), highScore).toLocaleString();
  }

  /* ==========================================================================
     Game State Management
     ========================================================================== */
  function startGame() {
    sound.init();
    sound.resume();
    music.initGain();
    if (music.enabled) {
      music.start();
    }

    // Reset all game state
    player = {
      x: PLAYER_X,
      y: GROUND_Y - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      runFrame: 0,
      runTimer: 0,
      alive: true
    };

    obstacles = [];
    orbs = [];
    particles = [];
    score = 0;
    distance = 0;
    orbsCollected = 0;
    currentSpeed = BASE_SPEED;
    nextObstacleX = V_WIDTH + 200;
    nextOrbX = V_WIDTH + 350;
    jumpKeyHeld = false;
    inputJump = false;
    inputSlide = false;

    initPlatforms();
    initBackground();

    highScore = safeGetStorage(STORAGE_HIGH_SCORE, 0);

    gameState = STATE.PLAYING;
    showScreen('startScreen', false);
    showScreen('pauseScreen', false);
    showScreen('gameOverScreen', false);

    // Reset and start game loop
    lastTimestamp = 0;
    accumulator = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (gameState !== STATE.PLAYING) return;
    gameState = STATE.PAUSED;
    music.pause();
    showScreen('pauseScreen', true);
  }

  function resumeGame() {
    if (gameState !== STATE.PAUSED) return;
    gameState = STATE.PLAYING;
    music.unpause();
    showScreen('pauseScreen', false);
    lastTimestamp = 0;
    accumulator = 0;
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function triggerGameOver() {
    if (gameState === STATE.GAME_OVER) return;
    gameState = STATE.GAME_OVER;

    sound.playGameOver();
    music.fadeOutAndStop(0.8);

    const finalScore = Math.floor(score);
    const isNewRecord = finalScore > highScore;
    if (isNewRecord) {
      highScore = finalScore;
      safeSetStorage(STORAGE_HIGH_SCORE, highScore);
    }

    // Update game-over UI
    const finalScoreEl = document.getElementById('finalScoreVal');
    const bestValEl = document.getElementById('gameOverBestVal');
    const recordBanner = document.getElementById('newRecordBanner');
    const summaryEl = document.getElementById('runStatsSummary');

    if (finalScoreEl) finalScoreEl.textContent = finalScore.toLocaleString();
    if (bestValEl) bestValEl.textContent = highScore.toLocaleString();
    if (recordBanner) recordBanner.style.display = isNewRecord ? 'block' : 'none';
    if (summaryEl) summaryEl.textContent = `Distance: ${Math.floor(distance)}m \u2022 Orbs: ${orbsCollected}`;

    showScreen('gameOverScreen', true);
  }

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      pauseGame();
    } else if (gameState === STATE.PAUSED) {
      resumeGame();
    }
  }

  /* ==========================================================================
     Screen Management
     ========================================================================== */
  function showScreen(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  /* ==========================================================================
     Main Game Loop (Fixed-Timestep with RAF)
     ========================================================================== */
  function gameLoop(timestamp) {
    if (gameState !== STATE.PLAYING) return;

    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    let frameMs = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Clamp to prevent spiral of death
    if (frameMs > MAX_FRAME_MS) frameMs = MAX_FRAME_MS;

    accumulator += frameMs;

    // Run fixed-timestep updates
    while (accumulator >= FIXED_DELTA_MS) {
      fixedUpdate();
      accumulator -= FIXED_DELTA_MS;
      if (gameState !== STATE.PLAYING) return; // game over during update
    }

    // Render
    render();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  /* ==========================================================================
     Canvas Scaling
     ========================================================================== */
  function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;

    const rect = canvas.getBoundingClientRect();
    scaleX = V_WIDTH / rect.width;
    scaleY = V_HEIGHT / rect.height;
  }

  /* ==========================================================================
     Input Handling
     ========================================================================== */
  let pauseKeyHeld = false;

  function handleKeyDown(e) {
    const key = e.key;

    // Pause keys
    if (key === 'p' || key === 'P' || key === 'Escape') {
      const audioPanel = document.getElementById('audioSettingsPanel');
      if (key === 'Escape' && audioPanel && !audioPanel.classList.contains('hidden')) {
        toggleAudioPanel(false);
        return;
      }
      e.preventDefault();
      if (!pauseKeyHeld) {
        pauseKeyHeld = true;
        togglePause();
      }
      return;
    }

    if (gameState !== STATE.PLAYING) return;

    // Jump keys
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      e.preventDefault();
      if (!jumpKeyHeld) {
        jumpKeyHeld = true;
        inputJump = true;
      }
      return;
    }

    // Slide keys
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      e.preventDefault();
      inputSlide = true;
      return;
    }

    // Mute key
    if (key === 'm' || key === 'M') {
      sound.init();
      const muted = sound.toggleMute();
      updateSFXUI(muted);
    }
  }

  function handleKeyUp(e) {
    const key = e.key;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      jumpKeyHeld = false;
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      pauseKeyHeld = false;
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      inputSlide = false;
    }
  }

  function updateSoundButton(muted) {
    const btn = document.getElementById('btnHeaderSound');
    if (!btn) return;
    if (muted) {
      btn.classList.add('muted');
      btn.title = 'Unmute SFX (M)';
    } else {
      btn.classList.remove('muted');
      btn.title = 'Mute SFX (M)';
    }
  }

  function updateSFXUI(muted) {
    const btnToggleSFX = document.getElementById('btnToggleSFX');
    const sfxToggleText = document.getElementById('sfxToggleText');
    if (btnToggleSFX) {
      btnToggleSFX.classList.toggle('active', !muted);
      btnToggleSFX.setAttribute('aria-pressed', String(!muted));
    }
    if (sfxToggleText) {
      sfxToggleText.textContent = !muted ? 'ON' : 'OFF';
    }
    updateSoundButton(muted);
  }

  function updateMusicUI() {
    const btnToggleMusic = document.getElementById('btnToggleMusic');
    const musicToggleText = document.getElementById('musicToggleText');
    if (btnToggleMusic) {
      btnToggleMusic.classList.toggle('active', music.enabled);
      btnToggleMusic.setAttribute('aria-pressed', String(music.enabled));
    }
    if (musicToggleText) {
      musicToggleText.textContent = music.enabled ? 'ON' : 'OFF';
    }
  }

  function toggleAudioPanel(open) {
    const panel = document.getElementById('audioSettingsPanel');
    const btn = document.getElementById('btnAudioSettings');
    if (!panel) return;
    const isClosed = panel.classList.contains('hidden');
    const shouldOpen = open !== undefined ? open : isClosed;
    if (shouldOpen) {
      panel.classList.remove('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  /* ==========================================================================
     Touch Controls
     ========================================================================== */
  function initTouchControls() {
    const jumpBtn = document.getElementById('btnTouchJump');
    const slideBtn = document.getElementById('btnTouchSlide');

    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === STATE.PLAYING) {
          inputJump = true;
          jumpBtn.classList.add('active');
        }
      }, { passive: false });

      jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        jumpBtn.classList.remove('active');
      }, { passive: false });
    }

    if (slideBtn) {
      slideBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === STATE.PLAYING) {
          inputSlide = true;
          slideBtn.classList.add('active');
        }
      }, { passive: false });

      slideBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        inputSlide = false;
        slideBtn.classList.remove('active');
      }, { passive: false });
    }

    // Prevent page scrolling on canvas
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  /* ==========================================================================
     UI Button Wiring
     ========================================================================== */
  function initUI() {
    // Start button
    const startBtn = document.getElementById('btnStartGame');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        startGame();
      });
    }

    // Restart button
    const restartBtn = document.getElementById('btnRestartGame');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        startGame();
      });
    }

    // Resume button
    const resumeBtn = document.getElementById('btnResumeGame');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        resumeGame();
      });
    }

    // Pause-restart button
    const pauseRestartBtn = document.getElementById('btnPauseRestart');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        startGame();
      });
    }

    // Header pause button
    const pauseBtn = document.getElementById('btnHeaderPause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        togglePause();
      });
    }

    // Audio settings toggle button
    const btnAudioSettings = document.getElementById('btnAudioSettings');
    if (btnAudioSettings) {
      btnAudioSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudioPanel();
      });
    }

    // Close audio settings button
    const btnCloseAudioPanel = document.getElementById('btnCloseAudioPanel');
    if (btnCloseAudioPanel) {
      btnCloseAudioPanel.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudioPanel(false);
      });
    }

    // Music toggle button
    const btnToggleMusic = document.getElementById('btnToggleMusic');
    if (btnToggleMusic) {
      btnToggleMusic.addEventListener('click', () => {
        sound.init();
        music.initGain();
        music.setEnabled(!music.enabled, gameState === STATE.PLAYING);
        updateMusicUI();
      });
    }

    // Music volume slider
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const musicVolumeVal = document.getElementById('musicVolumeVal');
    if (musicVolumeSlider) {
      const volPercent = Math.round(music.volume * 100);
      musicVolumeSlider.value = volPercent;
      if (musicVolumeVal) musicVolumeVal.textContent = volPercent + '%';

      musicVolumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        music.setVolume(val / 100);
        if (musicVolumeVal) musicVolumeVal.textContent = val + '%';
      });
    }

    // Sound FX toggle button
    const btnToggleSFX = document.getElementById('btnToggleSFX');
    if (btnToggleSFX) {
      btnToggleSFX.addEventListener('click', () => {
        sound.init();
        const muted = sound.toggleMute();
        updateSFXUI(muted);
      });
    }

    // Quick header sound mute button
    const soundBtn = document.getElementById('btnHeaderSound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        sound.init();
        const muted = sound.toggleMute();
        updateSFXUI(muted);
      });
    }

    // Click outside audio panel to dismiss
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('audioSettingsPanel');
      const btn = document.getElementById('btnAudioSettings');
      if (!panel || panel.classList.contains('hidden')) return;
      if (!panel.contains(e.target) && (!btn || !btn.contains(e.target))) {
        toggleAudioPanel(false);
      }
    });

    // Fullscreen button
    const fsBtn = document.getElementById('btnHeaderFullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const viewport = document.querySelector('.arcade-viewport');
        if (!document.fullscreenElement) {
          (viewport || document.body).requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Initialize audio controls state
    updateSFXUI(sound.isMuted);
    updateMusicUI();
  }

  /* ==========================================================================
     Visibility Change Handler
     ========================================================================== */
  function initVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (gameState === STATE.PLAYING) {
          pauseGame();
        } else {
          music.pause();
        }
      }
    });
  }

  /* ==========================================================================
     Initial Render for Title Screen
     ========================================================================== */
  function renderTitleBackground() {
    initBackground();
    initPlatforms();

    // Render a static frame for the title screen background
    render();
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    // Load high score
    highScore = safeGetStorage(STORAGE_HIGH_SCORE, 0);

    // Update menu display
    const menuScoreEl = document.getElementById('menuHighScoreVal');
    if (menuScoreEl) {
      menuScoreEl.textContent = highScore > 0 ? highScore.toLocaleString() : '0';
    }

    // Set up canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Touch
    initTouchControls();

    // UI
    initUI();

    // Visibility
    initVisibilityHandler();

    // Render title background
    renderTitleBackground();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
