/**
 * NEON DODGE - Core Arcade Game Engine
 * Tech: HTML5 Canvas API, Pure Vanilla JS, Web Audio API Sound Synthesizer, LocalStorage
 */

(function () {
  'use strict';

  /* ==========================================================================
     Constants & Configuration
     ========================================================================== */
  const V_WIDTH = 720;
  const V_HEIGHT = 900;
  const STORAGE_HIGH_SCORE = 'playrush_neon_dodge_highscore'; // Legacy / Normal default key
  const STORAGE_SPEED_MODE = 'playrush_game_speed'; // 'EASY' | 'NORMAL' | 'FAST'
  const STORAGE_TOTAL_ORBS = 'playrush_total_orbs';
  const STORAGE_MUTED = 'playrush_sound_muted';
  const STORAGE_MUSIC_ENABLED = 'playrush_music_enabled';
  const STORAGE_MUSIC_VOLUME = 'playrush_music_volume';

  // Game Speed configuration
  const SPEED_CONFIGS = {
    EASY: { key: 'EASY', label: 'EASY', mult: 0.80, storageKey: 'playrush_high_score_easy' },
    NORMAL: { key: 'NORMAL', label: 'NORMAL', mult: 1.00, storageKey: STORAGE_HIGH_SCORE },
    FAST: { key: 'FAST', label: 'FAST', mult: 1.25, storageKey: 'playrush_high_score_fast' }
  };

  // Safe LocalStorage helpers with exception handling and validation
  function safeGetStorage(key, defaultVal = 0, maxVal = 999999999) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultVal;
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) || parsed < 0 ? defaultVal : Math.min(parsed, maxVal);
    } catch (e) {
      return defaultVal;
    }
  }

  function safeSetStorage(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {
      // Storage quota exceeded or blocked in restricted browser modes
    }
  }

  /* ==========================================================================
     Web Audio API - Pure Synthesized Retro Arcade Sounds
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      let muted = false;
      try {
        muted = localStorage.getItem(STORAGE_MUTED) === 'true';
      } catch (e) {}
      this.isMuted = muted;
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

    toggleMute() {
      this.isMuted = !this.isMuted;
      safeSetStorage(STORAGE_MUTED, String(this.isMuted));
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.05);
      }
      return this.isMuted;
    }

    playOrbCollect() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    playSuperOrbCollect() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      [659.25, 830.61, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        gain.gain.setValueAtTime(0.35, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.25);
      });
    }

    playShieldCollect() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.3);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    playShieldBreak() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    playExplosion() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.exponentialRampToValueAtTime(50, t + 0.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(150, t);
      subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.5);

      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.5);
    }

    playGameOver() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      [329.63, 261.63, 220].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.15);

        gain.gain.setValueAtTime(0.3, t + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.15);
        osc.stop(t + idx * 0.15 + 0.4);
      });
    }

    playClick() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  const audio = new SoundEngine();

  /* ==========================================================================
     Synthwave Background Music Engine (Web Audio API)
     ========================================================================== */
  class MusicEngine {
    constructor(soundEngine) {
      this.soundEngine = soundEngine;
      this.musicGain = null;
      this.isPlaying = false;
      this.isFading = false;
      this.schedulerTimer = null;
      this.nextNoteTime = 0;
      this.currentBeat = 0;

      // Active oscillator/source tracking for cleanup
      this.activeNodes = [];

      // Load preferences
      let enabled = false;
      let volume = 0.35;
      try {
        enabled = localStorage.getItem(STORAGE_MUSIC_ENABLED) === 'true';
        const storedVol = parseFloat(localStorage.getItem(STORAGE_MUSIC_VOLUME));
        if (!isNaN(storedVol) && storedVol >= 0 && storedVol <= 1) volume = storedVol;
      } catch (e) {}
      this.enabled = enabled;
      this.volume = volume;

      // Music composition data — A minor synthwave loop (4 bars of 4/4 at 128 BPM)
      this.bpm = 128;
      this.beatsPerBar = 4;
      this.totalBeats = 16; // 4 bars
      this.secondsPerBeat = 60 / this.bpm;

      // Bass sequence (root notes, A minor scale) — plays on every beat
      this.bassPattern = [
        // Bar 1: Am
        { beat: 0,  note: 110.00, dur: 0.4 },   // A2
        { beat: 1,  note: 110.00, dur: 0.2 },
        { beat: 1.5,note: 130.81, dur: 0.2 },   // C3
        { beat: 2,  note: 146.83, dur: 0.4 },   // D3
        { beat: 3,  note: 130.81, dur: 0.2 },
        { beat: 3.5,note: 110.00, dur: 0.2 },
        // Bar 2: Em
        { beat: 4,  note: 82.41,  dur: 0.4 },   // E2
        { beat: 5,  note: 82.41,  dur: 0.2 },
        { beat: 5.5,note: 98.00,  dur: 0.2 },   // G2
        { beat: 6,  note: 110.00, dur: 0.4 },   // A2
        { beat: 7,  note: 98.00,  dur: 0.2 },
        { beat: 7.5,note: 82.41,  dur: 0.2 },
        // Bar 3: F
        { beat: 8,  note: 87.31,  dur: 0.4 },   // F2
        { beat: 9,  note: 87.31,  dur: 0.2 },
        { beat: 9.5,note: 110.00, dur: 0.2 },   // A2
        { beat: 10, note: 130.81, dur: 0.4 },   // C3
        { beat: 11, note: 110.00, dur: 0.2 },
        { beat: 11.5,note: 87.31, dur: 0.2 },
        // Bar 4: G -> Am
        { beat: 12, note: 98.00,  dur: 0.4 },   // G2
        { beat: 13, note: 98.00,  dur: 0.2 },
        { beat: 13.5,note: 123.47,dur: 0.2 },   // B2
        { beat: 14, note: 110.00, dur: 0.4 },   // A2
        { beat: 15, note: 130.81, dur: 0.2 },
        { beat: 15.5,note: 110.00,dur: 0.2 },
      ];

      // Synth lead melody (upper register arpeggios)
      this.leadPattern = [
        // Bar 1: Am arpeggios
        { beat: 0,   note: 440.00, dur: 0.35 },  // A4
        { beat: 0.75,note: 523.25, dur: 0.2  },  // C5
        { beat: 1.5, note: 659.25, dur: 0.35 },  // E5
        { beat: 2.5, note: 523.25, dur: 0.4  },  // C5
        { beat: 3.25,note: 440.00, dur: 0.3  },  // A4
        // Bar 2: Em arpeggios
        { beat: 4,   note: 329.63, dur: 0.35 },  // E4
        { beat: 4.75,note: 392.00, dur: 0.2  },  // G4
        { beat: 5.5, note: 493.88, dur: 0.35 },  // B4
        { beat: 6.5, note: 440.00, dur: 0.4  },  // A4
        { beat: 7.25,note: 392.00, dur: 0.3  },  // G4
        // Bar 3: F arpeggios
        { beat: 8,   note: 349.23, dur: 0.35 },  // F4
        { beat: 8.75,note: 440.00, dur: 0.2  },  // A4
        { beat: 9.5, note: 523.25, dur: 0.35 },  // C5
        { beat: 10.5,note: 440.00, dur: 0.4  },  // A4
        { beat: 11.25,note: 349.23,dur: 0.3  },  // F4
        // Bar 4: G -> resolve to Am
        { beat: 12,  note: 392.00, dur: 0.35 },  // G4
        { beat: 12.75,note: 493.88,dur: 0.2  },  // B4
        { beat: 13.5,note: 587.33, dur: 0.35 },  // D5
        { beat: 14,  note: 523.25, dur: 0.4  },  // C5
        { beat: 15,  note: 440.00, dur: 0.45 },  // A4 (resolve)
      ];

      // Pad chords (sustained chords per bar)
      this.padPattern = [
        { beat: 0,  notes: [220.00, 261.63, 329.63], dur: 3.6 }, // Am
        { beat: 4,  notes: [164.81, 196.00, 246.94], dur: 3.6 }, // Em
        { beat: 8,  notes: [174.61, 220.00, 261.63], dur: 3.6 }, // F
        { beat: 12, notes: [196.00, 246.94, 293.66], dur: 3.6 }, // G
      ];

      // Hi-hat pattern (every 8th note with accents)
      this.hihatAccents = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];

      // Kick/snare pattern per bar
      this.kickBeats = [0, 2];
      this.snareBeats = [1, 3];
    }

    initGain() {
      if (this.musicGain || !this.soundEngine.ctx) return;
      this.musicGain = this.soundEngine.ctx.createGain();
      this.musicGain.gain.value = this.enabled ? this.volume : 0;
      this.musicGain.connect(this.soundEngine.masterGain);
    }

    setVolume(val) {
      this.volume = Math.max(0, Math.min(1, val));
      safeSetStorage(STORAGE_MUSIC_VOLUME, String(this.volume));
      if (this.musicGain && this.enabled && this.isPlaying) {
        this.musicGain.gain.setTargetAtTime(this.volume, this.soundEngine.ctx.currentTime, 0.05);
      }
    }

    setEnabled(on) {
      this.enabled = on;
      safeSetStorage(STORAGE_MUSIC_ENABLED, String(on));
      if (on && !this.isPlaying && currentState === GameState.PLAYING) {
        this.start();
      } else if (!on && this.isPlaying) {
        this.stop();
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
      const pb = document.getElementById('btnHeaderPause');
      if (pb) pb.classList.remove('nd-hidden');
      this.currentBeat = 0;
      this.nextNoteTime = ctx.currentTime + 0.1; // small delay for context to warm up
      this._startScheduler();
    }

    pause() {
      if (!this.isPlaying) return;
      this._stopScheduler();
      if (this.musicGain && this.soundEngine.ctx) {
        this.musicGain.gain.setTargetAtTime(0, this.soundEngine.ctx.currentTime, 0.08);
      }
      // Don't set isPlaying to false — we want to resume from where we paused
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

    fadeOutAndStop(duration) {
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
      }, duration * 1000 + 200);
    }

    stop() {
      this._stopScheduler();
      this._cleanupNodes();
      this.isPlaying = false;
      this.isFading = false;
      this.currentBeat = 0;
      if (this.musicGain && this.soundEngine.ctx) {
        this.musicGain.gain.cancelScheduledValues(this.soundEngine.ctx.currentTime);
        this.musicGain.gain.value = 0;
      }
    }

    _startScheduler() {
      this._stopScheduler();
      this.schedulerTimer = setInterval(() => this._schedule(), 50);
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

      // Look ahead 0.15 seconds and schedule any beats that fall in that window
      const lookAhead = 0.15;
      while (this.nextNoteTime < ctx.currentTime + lookAhead) {
        this._scheduleBeat(this.currentBeat % this.totalBeats, this.nextNoteTime);
        this.nextNoteTime += this.secondsPerBeat / 2; // schedule on 8th notes
        this.currentBeat += 0.5;
      }
    }

    _scheduleBeat(beat, time) {
      const ctx = this.soundEngine.ctx;

      // --- Bass synth (sawtooth with filter) ---
      for (const note of this.bassPattern) {
        if (Math.abs(note.beat - beat) < 0.01) {
          this._playBass(ctx, note.note, time, note.dur);
        }
      }

      // --- Lead synth (pulse-like with detuning) ---
      for (const note of this.leadPattern) {
        if (Math.abs(note.beat - beat) < 0.01) {
          this._playLead(ctx, note.note, time, note.dur);
        }
      }

      // --- Pad chords (filtered sawtooth ensemble) ---
      for (const pad of this.padPattern) {
        if (Math.abs(pad.beat - beat) < 0.01) {
          this._playPad(ctx, pad.notes, time, pad.dur);
        }
      }

      // --- Drums ---
      const barBeat = beat % 4;

      // Hi-hat on every 8th note
      for (const hh of this.hihatAccents) {
        if (Math.abs(hh - barBeat) < 0.01) {
          this._playHihat(ctx, time, barBeat % 1 === 0 ? 0.25 : 0.12);
        }
      }

      // Kick
      for (const kb of this.kickBeats) {
        if (Math.abs(kb - barBeat) < 0.01) {
          this._playKick(ctx, time);
        }
      }

      // Snare
      for (const sb of this.snareBeats) {
        if (Math.abs(sb - barBeat) < 0.01) {
          this._playSnare(ctx, time);
        }
      }
    }

    _trackNode(node) {
      this.activeNodes.push(node);
      // Auto-remove after it stops
      if (node.addEventListener) {
        node.addEventListener('ended', () => {
          const idx = this.activeNodes.indexOf(node);
          if (idx >= 0) this.activeNodes.splice(idx, 1);
        });
      }
    }

    _playBass(ctx, freq, time, dur) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + dur);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.45, time);
      gain.gain.setValueAtTime(0.4, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      this._trackNode(osc);
    }

    _playLead(ctx, freq, time, dur) {
      // Two detuned sawtooths for a rich synth lead
      for (const detune of [-8, 8]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.03);
        gain.gain.setValueAtTime(0.1, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur + 0.05);
        this._trackNode(osc);
      }
    }

    _playPad(ctx, freqs, time, dur) {
      for (const freq of freqs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 10, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);
        filter.Q.value = 1;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.4);
        gain.gain.setValueAtTime(0.05, time + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur + 0.1);
        this._trackNode(osc);
      }
    }

    _playKick(ctx, time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.25);
      this._trackNode(osc);
    }

    _playSnare(ctx, time) {
      // Noise burst
      const bufLen = Math.floor(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.12);
      this._trackNode(noise);

      // Tonal body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.06);
      oscGain.gain.setValueAtTime(0.3, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
      osc.connect(oscGain);
      oscGain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.1);
      this._trackNode(osc);
    }

    _playHihat(ctx, time, vol) {
      const bufLen = Math.floor(ctx.sampleRate * 0.03);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.05);
      this._trackNode(noise);
    }
  }

  const music = new MusicEngine(audio);

  /* ==========================================================================
     Game Engine State
     ========================================================================== */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let scale = 1;
  let canvasOffset = { x: 0, y: 0 };

  const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
  };

  let currentState = GameState.MENU;

  // Selected game speed setting
  let selectedSpeedMode = 'NORMAL';
  try {
    const savedSpeed = localStorage.getItem(STORAGE_SPEED_MODE);
    if (savedSpeed && SPEED_CONFIGS[savedSpeed]) {
      selectedSpeedMode = savedSpeed;
    }
  } catch (e) {}

  function getHighScoreForMode(mode) {
    const config = SPEED_CONFIGS[mode] || SPEED_CONFIGS.NORMAL;
    return safeGetStorage(config.storageKey, 0);
  }

  let score = 0;
  let displayScore = 0;
  let highScore = getHighScoreForMode(selectedSpeedMode);
  let baseRunSpeed = SPEED_CONFIGS[selectedSpeedMode].mult; // Starting base speed for active run
  let activeRunSpeedMultiplier = baseRunSpeed; // Current effective speed (smoothly interpolated)
  let survivalFrames = 0;
  let orbsCollectedInRun = 0;
  let multiplier = 1;
  let multiplierTimer = 0;
  let shakeAmount = 0;

  // Fixed timestep accumulator and timing
  let lastTime = 0;
  let accumulator = 0;
  const FIXED_DELTA_MS = 1000 / 60; // 16.6667ms per simulation tick at 60Hz baseline

  // Input states
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  let touchTarget = null;
  let isTouching = false;

  // Entities
  let player = null;
  let hazards = [];
  let collectibles = [];
  let particles = [];
  let floatingTexts = [];
  let starfield = [];
  let shockwaves = [];

  // Spawn timers
  let hazardSpawnTimer = 0;
  let collectibleSpawnTimer = 0;

  /* ==========================================================================
     Player Spaceship Class
     ========================================================================== */
  class Player {
    constructor() {
      this.width = 32;
      this.height = 42;
      this.x = V_WIDTH / 2;
      this.y = V_HEIGHT - 160;
      this.vx = 0;
      this.vy = 0;
      this.maxSpeed = 8.5;
      this.acceleration = 0.95;
      this.friction = 0.88;
      this.tilt = 0;
      this.radius = 16;
      this.hasShield = false;
      this.shieldPulse = 0;
      this.invulnerableTimer = 0;
    }

    update(speedMult = 1.0) {
      // Keyboard input
      let moveX = 0;
      let moveY = 0;

      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;
      if (keys.up) moveY -= 1;
      if (keys.down) moveY += 1;

      // Touch / Drag input
      if (isTouching && touchTarget) {
        const dx = touchTarget.x - this.x;
        const dy = touchTarget.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          moveX = (dx / dist) * Math.min(dist / 25, 1.2);
          moveY = (dy / dist) * Math.min(dist / 25, 1.2);
        }
      }

      // Accelerate
      this.vx += moveX * this.acceleration * speedMult;
      this.vy += moveY * this.acceleration * speedMult;

      // Apply friction
      this.vx *= Math.pow(this.friction, speedMult);
      this.vy *= Math.pow(this.friction, speedMult);

      // Clamp speed
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > this.maxSpeed * speedMult) {
        this.vx = (this.vx / speed) * this.maxSpeed * speedMult;
        this.vy = (this.vy / speed) * this.maxSpeed * speedMult;
      }

      // Update positions
      this.x += this.vx;
      this.y += this.vy;

      // Boundary clamping
      const pad = 24;
      this.x = Math.max(pad, Math.min(V_WIDTH - pad, this.x));
      this.y = Math.max(pad + 40, Math.min(V_HEIGHT - pad - 20, this.y));

      // Ship tilt
      this.tilt = Math.max(-0.4, Math.min(0.4, this.vx * 0.05));

      // Thruster exhaust particles
      if (Math.random() < 0.85 * speedMult) {
        particles.push({
          x: this.x + (Math.random() - 0.5) * 8,
          y: this.y + 18,
          vx: (Math.random() - 0.5) * 1.5 - this.vx * 0.2,
          vy: (4 + Math.random() * 3) * speedMult,
          radius: 3 + Math.random() * 2,
          color: Math.random() > 0.4 ? '#55e6ff' : '#d1e8e2',
          alpha: 1,
          decay: 0.05 * speedMult
        });
      }

      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= speedMult;
        if (this.invulnerableTimer < 0) this.invulnerableTimer = 0;
      }

      if (this.hasShield) {
        this.shieldPulse += 0.08 * speedMult;
      }
    }

    draw(ctx) {
      // Invulnerability flashing
      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
        return;
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);

      // Draw Shield
      if (this.hasShield) {
        ctx.save();
        const shieldR = 34 + Math.sin(this.shieldPulse) * 3;
        ctx.strokeStyle = '#a78bfa';
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
        ctx.fill();
        ctx.restore();
      }

      // Glowing Ship Silhouette — electric cyan energy
      ctx.shadowColor = '#55e6ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#55e6ff';
      ctx.fillStyle = '#2c3531';
      ctx.lineWidth = 2.5;

      // Triangular sleek fuselage
      ctx.beginPath();
      ctx.moveTo(0, -22); // Tip
      ctx.lineTo(18, 16); // Right wingtip
      ctx.lineTo(6, 12);  // Right inner notch
      ctx.lineTo(0, 18);  // Engine base
      ctx.lineTo(-6, 12); // Left inner notch
      ctx.lineTo(-18, 16); // Left wingtip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing accents
      ctx.strokeStyle = '#55e6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(0, -10);
      ctx.lineTo(10, 4);
      ctx.stroke();

      // Glowing Cockpit Core
      ctx.fillStyle = '#55e6ff';
      ctx.shadowColor = '#55e6ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /* ==========================================================================
     Hazard / Obstacle Classes
     ========================================================================== */
  class AsteroidHazard {
    constructor(difficultyTier) {
      this.type = 'ASTEROID';
      this.radius = 16 + Math.random() * 18;
      this.x = Math.random() * (V_WIDTH - this.radius * 2) + this.radius;
      this.y = -this.radius - 10;
      this.speed = (3.5 + Math.random() * 2.5) * (1 + difficultyTier * 0.12);
      this.vx = (Math.random() - 0.5) * 1.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.08;
      this.points = [];
      const numPts = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        const r = this.radius * (0.8 + Math.random() * 0.4);
        this.points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      }
      this.color = '#ff4f87';
    }

    update(speedMult = 1.0) {
      this.x += this.vx * speedMult;
      this.y += this.speed * speedMult;
      this.rotation += this.rotSpeed * speedMult;

      // Wall bounce
      if (this.x < this.radius || this.x > V_WIDTH - this.radius) {
        this.vx *= -1;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(30, 39, 36, 0.85)';

      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner polygon core — light pink highlight
      ctx.strokeStyle = '#ffb0cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  class LaserBeamHazard {
    constructor() {
      this.type = 'LASER';
      this.x = Math.random() * (V_WIDTH - 120) + 60;
      this.width = 38;
      this.warnFrames = 75; // ~1.2s warning
      this.fireFrames = 50; // Active lethal firing
      this.totalFrames = this.warnFrames + this.fireFrames;
      this.currentFrame = 0;
      this.isLethal = false;
    }

    update(speedMult = 1.0) {
      this.currentFrame += speedMult;
      this.isLethal = this.currentFrame >= this.warnFrames && this.currentFrame <= this.totalFrames;
    }

    draw(ctx) {
      ctx.save();

      if (this.currentFrame < this.warnFrames) {
        // Telegraph warning line
        const alpha = (Math.sin(this.currentFrame * 0.3) + 1) * 0.4 + 0.2;
        ctx.strokeStyle = `rgba(255, 92, 92, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(this.x, 0);
        ctx.lineTo(this.x, V_HEIGHT);
        ctx.stroke();

        // Warning triangles top & bottom
        ctx.fillStyle = '#ff5c5c';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, 20);
        ctx.lineTo(this.x + 10, 20);
        ctx.lineTo(this.x, 35);
        ctx.closePath();
        ctx.fill();
      } else {
        // Full firing lethal plasma beam
        const fireProgress = (this.currentFrame - this.warnFrames) / this.fireFrames;
        const intensity = Math.sin(fireProgress * Math.PI);

        ctx.shadowColor = '#ff5c5c';
        ctx.shadowBlur = 25 * intensity;

        // Outer glow beam
        ctx.fillStyle = `rgba(255, 92, 92, ${0.45 * intensity})`;
        ctx.fillRect(this.x - this.width / 2, 0, this.width, V_HEIGHT);

        // Core white beam
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * intensity})`;
        ctx.fillRect(this.x - 4, 0, 8, V_HEIGHT);
      }

      ctx.restore();
    }
  }

  class TrackingMineHazard {
    constructor(difficultyTier) {
      this.type = 'MINE';
      this.radius = 16;
      this.x = Math.random() * (V_WIDTH - 100) + 50;
      this.y = -20;
      this.speed = (2.8 + Math.random() * 1.5) * (1 + difficultyTier * 0.1);
      this.pulse = 0;
    }

    update(playerX, speedMult = 1.0) {
      this.y += this.speed * speedMult;
      this.pulse += 0.1 * speedMult;

      // Gentle homing drift towards player X
      if (playerX !== undefined) {
        const dx = playerX - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.02 * speedMult, 1.4 * speedMult);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.pulse);

      ctx.strokeStyle = '#d9b08c';
      ctx.shadowColor = '#d9b08c';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#2c3531';

      // 4-point star spike mine
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? this.radius * 1.3 : this.radius * 0.6;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pulsing core
      const coreR = 4 + Math.sin(this.pulse * 2) * 1.5;
      ctx.fillStyle = '#ff5c5c';
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /* ==========================================================================
     Collectible Classes
     ========================================================================== */
  class Collectible {
    constructor(type) {
      this.type = type; // 'ORB', 'SUPER', 'SHIELD'
      this.radius = type === 'SUPER' ? 14 : (type === 'SHIELD' ? 13 : 11);
      this.x = Math.random() * (V_WIDTH - 80) + 40;
      this.y = -20;
      this.speed = 2.2 + Math.random() * 1.2;
      this.pulse = Math.random() * Math.PI * 2;
    }

    update(speedMult = 1.0) {
      this.y += this.speed * speedMult;
      this.pulse += 0.08 * speedMult;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      let color = '#7cffb2';
      if (this.type === 'SUPER') color = '#ffcb9a';
      if (this.type === 'SHIELD') color = '#a78bfa';

      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = color;

      const dynamicRadius = this.radius + Math.sin(this.pulse) * 2;

      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, dynamicRadius + 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /* ==========================================================================
     Particle & Visual Effect Helpers
     ========================================================================== */
  function spawnExplosion(x, y, baseColor = '#ffcb9a', count = 30) {
    audio.playExplosion();
    shakeAmount = 18;

    // Shockwave ring
    shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 75,
      color: baseColor,
      alpha: 1
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? baseColor : '#ffffff',
        alpha: 1,
        decay: 0.025 + Math.random() * 0.02
      });
    }
  }

  function spawnCollectBurst(x, y, color = '#d1e8e2', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color,
        alpha: 1,
        decay: 0.035
      });
    }
  }

  function addFloatingText(text, x, y, color = '#d1e8e2') {
    floatingTexts.push({
      text,
      x,
      y,
      vy: -2,
      alpha: 1,
      color
    });
  }

  /* ==========================================================================
     Starfield Background
     ========================================================================== */
  function initStarfield() {
    starfield = [];
    for (let i = 0; i < 90; i++) {
      starfield.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        speed: 0.8 + Math.random() * 3.5,
        size: Math.random() * 2 + 0.8,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  function updateAndDrawStarfield(ctx) {
    ctx.save();
    for (let star of starfield) {
      star.y += star.speed * (multiplier > 1 ? 1.4 : 1.0);
      if (star.y > V_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * V_WIDTH;
      }
      ctx.fillStyle = `rgba(209, 232, 226, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }

  /* ==========================================================================
     Screen Resizing & Canvas Scaling (High-DPI Support)
     ========================================================================== */
  function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;

    const contW = container.clientWidth;
    const contH = container.clientHeight;

    const aspect = V_WIDTH / V_HEIGHT;
    let targetW = contW;
    let targetH = contW / aspect;

    if (targetH > contH) {
      targetH = contH;
      targetW = contH * aspect;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = targetW * dpr;
    canvas.height = targetH * dpr;

    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;

    scale = (targetW / V_WIDTH) * dpr;

    const rect = canvas.getBoundingClientRect();
    canvasOffset = { x: rect.left, y: rect.top };
  }

  /* ==========================================================================
     Game Lifecycle Controls (Start, Pause, Restart, GameOver)
     ========================================================================== */
  function startGame() {
    audio.init();
    audio.playClick();

    // Lock in the chosen speed mode and reset progression for this run
    baseRunSpeed = SPEED_CONFIGS[selectedSpeedMode].mult;
    activeRunSpeedMultiplier = baseRunSpeed;
    highScore = getHighScoreForMode(selectedSpeedMode);

    score = 0;
    displayScore = 0;
    survivalFrames = 0;
    orbsCollectedInRun = 0;
    multiplier = 1;
    multiplierTimer = 0;
    shakeAmount = 0;

    hazards = [];
    collectibles = [];
    particles = [];
    floatingTexts = [];
    shockwaves = [];

    hazardSpawnTimer = 0;
    collectibleSpawnTimer = 0;

    player = new Player();
    currentState = GameState.PLAYING;

    hideAllScreens();
    updateHUD();
    updatePauseButtonIcon(false);

    // Music game-state integration: start fresh music session if enabled
    music.stop();
    if (music.enabled) {
      music.start();
    }
  }

  const ICON_PAUSE = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
  const ICON_PLAY  = 'M8 5v14l11-7z';

  function updatePauseButtonIcon(isPaused) {
    const btn = document.getElementById('btnHeaderPause');
    if (!btn) return;
    const path = btn.querySelector('svg path');
    if (path) {
      path.setAttribute('d', isPaused ? ICON_PLAY : ICON_PAUSE);
    }
    btn.setAttribute('title', isPaused ? 'Resume Game (Space / P / Esc)' : 'Pause Game (Space / P / Esc)');
    btn.setAttribute('aria-label', isPaused ? 'Resume game' : 'Pause game');
  }

  function pauseGame() {
    if (currentState === GameState.PLAYING) {
      currentState = GameState.PAUSED;
      audio.playClick();
      showScreen('pauseScreen');
      updatePauseButtonIcon(true);
      music.pause();
    }
  }

  function resumeGame() {
    if (currentState === GameState.PAUSED) {
      currentState = GameState.PLAYING;
      audio.playClick();
      hideAllScreens();
      updatePauseButtonIcon(false);
      music.unpause();
      // Reset lastTime to prevent huge accumulator leap when unpausing
      lastTime = performance.now();
      accumulator = 0;
    }
  }

  function triggerGameOver() {
    currentState = GameState.GAMEOVER;
    audio.playGameOver();
    updatePauseButtonIcon(false);
    music.fadeOutAndStop(1.2);

    // Check & persist high score safely for the active speed mode
    let isNewRecord = false;
    const activeConfig = SPEED_CONFIGS[selectedSpeedMode] || SPEED_CONFIGS.NORMAL;
    const currentModeHighScore = getHighScoreForMode(selectedSpeedMode);

    if (score > currentModeHighScore) {
      highScore = score;
      safeSetStorage(activeConfig.storageKey, highScore);
      isNewRecord = true;
    } else {
      highScore = currentModeHighScore;
    }

    // Update cumulative orbs collected for daily challenge safely
    const currentOrbs = safeGetStorage(STORAGE_TOTAL_ORBS, 0);
    safeSetStorage(STORAGE_TOTAL_ORBS, currentOrbs + orbsCollectedInRun);

    // Update best survival time for daily challenge safely
    const seconds = Math.floor(survivalFrames / 60);
    const bestSurvival = safeGetStorage('playrush_best_survival_time', 0);
    if (seconds > bestSurvival) {
      safeSetStorage('playrush_best_survival_time', seconds);
    }

    // Fill Game Over UI
    const finalScoreEl = document.getElementById('finalScoreVal');
    const bestScoreEl = document.getElementById('gameOverBestVal');
    const speedModeLabel = document.getElementById('gameOverSpeedModeLabel');
    const newRecordTag = document.getElementById('newRecordBanner');
    const statsSummary = document.getElementById('runStatsSummary');

    if (finalScoreEl) finalScoreEl.textContent = score.toLocaleString();
    if (bestScoreEl) bestScoreEl.textContent = highScore.toLocaleString();
    if (speedModeLabel) speedModeLabel.textContent = activeConfig.label;
    if (newRecordTag) newRecordTag.style.display = isNewRecord ? 'block' : 'none';

    if (statsSummary) {
      statsSummary.textContent = `Survived: ${seconds}s  •  Orbs: ${orbsCollectedInRun}`;
    }

    // Ensure speed selector buttons on game over screen reflect current selection
    updateSpeedUI();

    showScreen('gameOverScreen');
  }

  function hideAllScreens() {
    document.querySelectorAll('.screen-overlay').forEach(el => el.classList.add('hidden'));
  }

  function showScreen(screenId) {
    hideAllScreens();
    const el = document.getElementById(screenId);
    if (el) el.classList.remove('hidden');
  }

  function updateHUD() {
    const scoreValEl = document.getElementById('hudScoreVal');
    const bestValEl = document.getElementById('hudBestVal');
    const multBadge = document.getElementById('hudMultiplier');
    const shieldInd = document.getElementById('hudShield');

    if (scoreValEl) {
      scoreValEl.textContent = Math.floor(displayScore).toLocaleString();
    }
    if (bestValEl) {
      bestValEl.textContent = Math.max(score, highScore).toLocaleString();
    }

    if (multBadge) {
      if (multiplier > 1) {
        multBadge.classList.add('active');
        multBadge.textContent = `${multiplier}X BOOST!`;
      } else {
        multBadge.classList.remove('active');
      }
    }

    if (shieldInd) {
      if (player && player.hasShield) {
        shieldInd.classList.add('active');
      } else {
        shieldInd.classList.remove('active');
      }
    }
  }

  /* ==========================================================================
     Fixed Timestep Simulation Update (Target 60Hz baseline)
     ========================================================================== */
  function updatePhysics() {
    if (currentState !== GameState.PLAYING) return;

    // Continuous score-based acceleration without hard caps or discrete milestones
    const targetSpeed = baseRunSpeed + (score * 0.00025);

    // Smooth asymptotic transition to prevent sudden speed jumps (0.003 per tick ~ 0.18/sec max delta)
    if (activeRunSpeedMultiplier < targetSpeed) {
      activeRunSpeedMultiplier = Math.min(targetSpeed, activeRunSpeedMultiplier + 0.003);
    } else if (activeRunSpeedMultiplier > targetSpeed) {
      activeRunSpeedMultiplier = Math.max(targetSpeed, activeRunSpeedMultiplier - 0.003);
    }

    // Current effective speed for this simulation tick
    const speedMult = activeRunSpeedMultiplier;

    survivalFrames++;

    // Increment passive survival score (+1 every 5 simulation ticks = ~12 pts/sec at 1.0x)
    if (survivalFrames % 5 === 0) {
      score += 1 * multiplier;
    }

    // Smooth display score animation
    if (displayScore < score) {
      displayScore += Math.max(1, (score - displayScore) * 0.15);
    } else {
      displayScore = score;
    }

    // Multiplier countdown timer
    if (multiplierTimer > 0) {
      multiplierTimer -= speedMult;
      if (multiplierTimer <= 0) {
        multiplierTimer = 0;
        multiplier = 1;
      }
    }

    // Calculate dynamic difficulty (0 to 10+ based on survival time)
    const difficultyTier = Math.min(10, survivalFrames / 450); // scales every ~7.5 seconds at 60Hz

    // Spawning Hazards (frequency scaled by speedMult)
    hazardSpawnTimer += speedMult;
    const currentSpawnThreshold = Math.max(22, 60 - difficultyTier * 4);
    if (hazardSpawnTimer >= currentSpawnThreshold) {
      hazardSpawnTimer = 0;
      const rand = Math.random();

      if (rand < 0.65) {
        hazards.push(new AsteroidHazard(difficultyTier));
      } else if (rand < 0.85) {
        hazards.push(new TrackingMineHazard(difficultyTier));
      } else {
        hazards.push(new LaserBeamHazard());
      }
    }

    // Spawning Collectibles (frequency scaled by speedMult)
    collectibleSpawnTimer += speedMult;
    if (collectibleSpawnTimer >= 180) { // Every ~3 seconds
      collectibleSpawnTimer = 0;
      const roll = Math.random();
      if (roll < 0.65) {
        collectibles.push(new Collectible('ORB'));
      } else if (roll < 0.88) {
        collectibles.push(new Collectible('SUPER'));
      } else {
        collectibles.push(new Collectible('SHIELD'));
      }
    }

    // Update Player (using speedMult)
    player.update(speedMult);

    // Update & Check Hazards
    for (let i = hazards.length - 1; i >= 0; i--) {
      const hazard = hazards[i];
      if (hazard.type === 'MINE') {
        hazard.update(player.x, speedMult);
      } else if (hazard.type === 'LASER') {
        hazard.update(speedMult);
      } else {
        hazard.update(speedMult);
      }

      // Offscreen removal
      if (hazard.y > V_HEIGHT + 50 || (hazard.currentFrame && hazard.currentFrame > hazard.totalFrames)) {
        hazards.splice(i, 1);
        continue;
      }

      // Collision Check with Player
      let collided = false;

      if (hazard.type === 'LASER') {
        if (hazard.isLethal) {
          const left = hazard.x - hazard.width / 2;
          const right = hazard.x + hazard.width / 2;
          if (player.x + player.radius > left && player.x - player.radius < right) {
            collided = true;
          }
        }
      } else {
        const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
        if (dist < player.radius + hazard.radius) {
          collided = true;
        }
      }

      if (collided && player.invulnerableTimer === 0) {
        if (player.hasShield) {
          // Shield absorbs damage!
          player.hasShield = false;
          player.invulnerableTimer = 40; // ~0.6s grace period at 60Hz
          audio.playShieldBreak();
          shakeAmount = 14;
          spawnExplosion(player.x, player.y, '#a78bfa', 20);
          addFloatingText('SHIELD BROKEN!', player.x, player.y - 30, '#a78bfa');

          // Destroy colliding hazard if not laser
          if (hazard.type !== 'LASER') {
            hazards.splice(i, 1);
          }
        } else {
          // Player Destroyed -> Game Over
          spawnExplosion(player.x, player.y, '#ff5c5c', 40);
          triggerGameOver();
          break;
        }
      }
    }

    // Update & Check Collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      c.update(speedMult);

      if (c.y > V_HEIGHT + 30) {
        collectibles.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(player.x - c.x, player.y - c.y);
      if (dist < player.radius + c.radius) {
        orbsCollectedInRun++;

        if (c.type === 'ORB') {
          const pts = 50 * multiplier;
          score += pts;
          audio.playOrbCollect();
          spawnCollectBurst(c.x, c.y, '#7cffb2');
          addFloatingText(`+${pts}`, c.x, c.y, '#7cffb2');
        } else if (c.type === 'SUPER') {
          const pts = 150 * multiplier;
          score += pts;
          multiplier = 2;
          multiplierTimer = 360; // 6 seconds at 60Hz baseline
          audio.playSuperOrbCollect();
          spawnCollectBurst(c.x, c.y, '#ffcb9a', 25);
          addFloatingText('2X MULTIPLIER!', c.x, c.y, '#ffcb9a');
        } else if (c.type === 'SHIELD') {
          player.hasShield = true;
          audio.playShieldCollect();
          spawnCollectBurst(c.x, c.y, '#a78bfa', 25);
          addFloatingText('SHIELD READY!', c.x, c.y, '#a78bfa');
        }

        collectibles.splice(i, 1);
      }
    }

    updateHUD();
  }

  /* ==========================================================================
     Main Game Loop with Fixed Timestep
     ========================================================================== */
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let elapsed = timestamp - lastTime;
    lastTime = timestamp;

    // Clamp huge frame-time gaps (e.g. after tab switching or background throttle)
    if (elapsed > 200) {
      elapsed = 200;
    }

    if (currentState === GameState.PLAYING) {
      accumulator += elapsed;
      // Fixed 60Hz simulation updates
      let updates = 0;
      while (accumulator >= FIXED_DELTA_MS && updates < 5) {
        updatePhysics();
        accumulator -= FIXED_DELTA_MS;
        updates++;
      }
      if (updates >= 5) {
        // Discard spiral of death accumulator backlog
        accumulator = 0;
      }
    } else {
      accumulator = 0;
    }

    // --- Rendering Stage ---
    // Canvas Clear & Screen Shake
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let shakeX = 0;
    let shakeY = 0;
    if (shakeAmount > 0) {
      shakeX = (Math.random() - 0.5) * shakeAmount;
      shakeY = (Math.random() - 0.5) * shakeAmount;
      shakeAmount *= 0.9;
      if (shakeAmount < 0.3) shakeAmount = 0;
    }

    ctx.translate(shakeX, shakeY);
    ctx.scale(scale, scale);

    // Render Ambient Space Starfield
    updateAndDrawStarfield(ctx);

    // Draw Collectibles
    for (const c of collectibles) {
      c.draw(ctx);
    }

    // Draw Hazards
    for (const h of hazards) {
      h.draw(ctx);
    }

    // Draw Player
    if (player && (currentState === GameState.PLAYING || currentState === GameState.PAUSED)) {
      player.draw(ctx);
    }

    // Draw Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += 4;
      sw.alpha -= 0.04;
      if (sw.alpha <= 0) {
        shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;

      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 18px "Manrope", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
  }

  /* ==========================================================================
     Input Listeners (Keyboard, Touch, Mouse)
     ========================================================================== */
  function initInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.up = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keys.down = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keys.right = true;
          break;
        case 'KeyP':
          if (currentState === GameState.PLAYING) pauseGame();
          else if (currentState === GameState.PAUSED) resumeGame();
          break;
        case 'Escape':
          // If audio panel is open, close it on Escape first
          const audioPanelEl = document.getElementById('audioSettingsPanel');
          const btnAudioSettingsEl = document.getElementById('btnAudioSettings');
          if (audioPanelEl && !audioPanelEl.classList.contains('hidden')) {
            audioPanelEl.classList.add('hidden');
            if (btnAudioSettingsEl) btnAudioSettingsEl.setAttribute('aria-expanded', 'false');
            break;
          }
          if (currentState === GameState.PLAYING) pauseGame();
          else if (currentState === GameState.PAUSED) resumeGame();
          break;
        case 'Space':
          if (currentState === GameState.PLAYING) {
            e.preventDefault();
            pauseGame();
          } else if (currentState === GameState.PAUSED) {
            e.preventDefault();
            resumeGame();
          } else if (currentState === GameState.MENU || currentState === GameState.GAMEOVER) {
            e.preventDefault();
            startGame();
          }
          break;
        case 'Enter':
          if (currentState === GameState.MENU || currentState === GameState.GAMEOVER) {
            startGame();
          }
          break;
        case 'KeyM':
          toggleMuteBtn();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keys.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keys.right = false;
          break;
      }
    });

    // Touch Event Handling on Canvas
    function handleTouchCoords(touch) {
      const rect = canvas.getBoundingClientRect();
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      touchTarget = {
        x: (clientX / rect.width) * V_WIDTH,
        y: (clientY / rect.height) * V_HEIGHT
      };
    }

    canvas.addEventListener('touchstart', (e) => {
      audio.init();
      if (e.touches.length > 0) {
        isTouching = true;
        handleTouchCoords(e.touches[0]);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        isTouching = true;
        handleTouchCoords(e.touches[0]);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        isTouching = false;
        touchTarget = null;
      }
    });

    // Mouse drag support on canvas
    let isMouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
      audio.init();
      isMouseDown = true;
      const rect = canvas.getBoundingClientRect();
      touchTarget = {
        x: ((e.clientX - rect.left) / rect.width) * V_WIDTH,
        y: ((e.clientY - rect.top) / rect.height) * V_HEIGHT
      };
      isTouching = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const rect = canvas.getBoundingClientRect();
      touchTarget = {
        x: ((e.clientX - rect.left) / rect.width) * V_WIDTH,
        y: ((e.clientY - rect.top) / rect.height) * V_HEIGHT
      };
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      isTouching = false;
      touchTarget = null;
    });
  }

  /* ==========================================================================
     UI Buttons & Interactivity
     ========================================================================== */
  function updateSpeedUI() {
    const currentConfig = SPEED_CONFIGS[selectedSpeedMode] || SPEED_CONFIGS.NORMAL;

    // Update start screen best score for currently selected speed
    const menuHighScoreEl = document.getElementById('menuHighScoreVal');
    if (menuHighScoreEl) {
      menuHighScoreEl.textContent = getHighScoreForMode(selectedSpeedMode).toLocaleString();
    }

    // Update all speed button groups (start menu and game over screen)
    document.querySelectorAll('.speed-buttons-row').forEach(row => {
      row.querySelectorAll('.speed-btn').forEach(btn => {
        const mode = btn.getAttribute('data-speed');
        if (mode === selectedSpeedMode) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      });
    });

    const speedModeLabel = document.getElementById('gameOverSpeedModeLabel');
    if (speedModeLabel) {
      speedModeLabel.textContent = currentConfig.label;
    }
  }

  function setSpeedMode(mode) {
    if (!SPEED_CONFIGS[mode]) return;
    // Lock speed changes during active run
    if (currentState === GameState.PLAYING || currentState === GameState.PAUSED) return;

    selectedSpeedMode = mode;
    safeSetStorage(STORAGE_SPEED_MODE, mode);
    audio.playClick();
    updateSpeedUI();
  }

  function updateAudioUI() {
    // Update SFX header buttons and panel toggle
    const isSfxMuted = audio.isMuted;
    const muteIcons = document.querySelectorAll('.sound-btn-icon');
    muteIcons.forEach(icon => {
      if (isSfxMuted) {
        icon.classList.add('muted');
        icon.setAttribute('title', 'Unmute SFX (M)');
      } else {
        icon.classList.remove('muted');
        icon.setAttribute('title', 'Mute SFX (M)');
      }
    });

    const sfxBtn = document.getElementById('btnToggleSFX');
    const sfxText = document.getElementById('sfxToggleText');
    if (sfxBtn && sfxText) {
      if (isSfxMuted) {
        sfxBtn.classList.remove('active');
        sfxBtn.setAttribute('aria-pressed', 'false');
        sfxText.textContent = 'OFF';
      } else {
        sfxBtn.classList.add('active');
        sfxBtn.setAttribute('aria-pressed', 'true');
        sfxText.textContent = 'ON';
      }
    }

    // Update Music toggle button and slider in panel
    const musicBtn = document.getElementById('btnToggleMusic');
    const musicText = document.getElementById('musicToggleText');
    const musicSlider = document.getElementById('musicVolumeSlider');
    const musicVolVal = document.getElementById('musicVolumeVal');

    if (musicBtn && musicText) {
      if (music.enabled) {
        musicBtn.classList.add('active');
        musicBtn.setAttribute('aria-pressed', 'true');
        musicText.textContent = 'ON';
      } else {
        musicBtn.classList.remove('active');
        musicBtn.setAttribute('aria-pressed', 'false');
        musicText.textContent = 'OFF';
      }
    }

    if (musicSlider) {
      musicSlider.value = Math.round(music.volume * 100);
    }
    if (musicVolVal) {
      musicVolVal.textContent = `${Math.round(music.volume * 100)}%`;
    }
  }

  function toggleMuteBtn() {
    audio.toggleMute();
    updateAudioUI();
  }

  function initUI() {
    // Initial high score render in menu
    const menuHighScoreEl = document.getElementById('menuHighScoreVal');
    if (menuHighScoreEl) {
      menuHighScoreEl.textContent = highScore.toLocaleString();
    }

    // Play button on start screen
    const btnStart = document.getElementById('btnStartGame');
    if (btnStart) {
      btnStart.addEventListener('click', startGame);
    }

    // Restart button on game over
    const btnRestart = document.getElementById('btnRestartGame');
    if (btnRestart) {
      btnRestart.addEventListener('click', startGame);
    }

    // Resume button on pause
    const btnResume = document.getElementById('btnResumeGame');
    if (btnResume) {
      btnResume.addEventListener('click', resumeGame);
    }

    // Restart from pause
    const btnPauseRestart = document.getElementById('btnPauseRestart');
    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', startGame);
    }

    // Header Pause button
    const btnHeaderPause = document.getElementById('btnHeaderPause');
    if (btnHeaderPause) {
      btnHeaderPause.addEventListener('click', () => {
        if (currentState === GameState.PLAYING) pauseGame();
        else if (currentState === GameState.PAUSED) resumeGame();
      });
    }

    // Header Sound button (quick SFX mute)
    const btnHeaderSound = document.getElementById('btnHeaderSound');
    if (btnHeaderSound) {
      btnHeaderSound.addEventListener('click', toggleMuteBtn);
    }

    // Audio Settings Panel Open/Close
    const btnAudioSettings = document.getElementById('btnAudioSettings');
    const audioPanel = document.getElementById('audioSettingsPanel');
    const btnCloseAudioPanel = document.getElementById('btnCloseAudioPanel');

    if (btnAudioSettings && audioPanel) {
      btnAudioSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = audioPanel.classList.toggle('hidden');
        btnAudioSettings.setAttribute('aria-expanded', String(!isHidden));
      });
    }

    if (btnCloseAudioPanel && audioPanel && btnAudioSettings) {
      btnCloseAudioPanel.addEventListener('click', (e) => {
        e.stopPropagation();
        audioPanel.classList.add('hidden');
        btnAudioSettings.setAttribute('aria-expanded', 'false');
      });
    }

    // Close settings panel when clicking outside
    document.addEventListener('click', (e) => {
      if (audioPanel && !audioPanel.classList.contains('hidden')) {
        const wrapper = document.querySelector('.audio-settings-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          audioPanel.classList.add('hidden');
          if (btnAudioSettings) btnAudioSettings.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Panel Music Toggle Button
    const btnToggleMusic = document.getElementById('btnToggleMusic');
    if (btnToggleMusic) {
      btnToggleMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        audio.resume();
        music.initGain();
        music.setEnabled(!music.enabled);
        updateAudioUI();
      });
    }

    // Panel SFX Toggle Button
    const btnToggleSFX = document.getElementById('btnToggleSFX');
    if (btnToggleSFX) {
      btnToggleSFX.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.init();
        audio.resume();
        toggleMuteBtn();
      });
    }

    // Music Volume Slider
    const musicSlider = document.getElementById('musicVolumeSlider');
    const musicVolVal = document.getElementById('musicVolumeVal');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        music.setVolume(val);
        if (musicVolVal) {
          musicVolVal.textContent = `${e.target.value}%`;
        }
      });
    }

    // Hide unsupported controls
    const fsBtn = document.getElementById('btnHeaderFullscreen');
    if (fsBtn && !document.fullscreenEnabled) fsBtn.classList.add('nd-hidden');
    const pb = document.getElementById('btnHeaderPause');
    if (pb) pb.classList.add('nd-hidden');

    // Fullscreen toggle
    const btnFullscreen = document.getElementById('btnHeaderFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Speed selection buttons listener (delegated)
    document.querySelectorAll('.speed-buttons-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const btn = e.target.closest('.speed-btn');
        if (btn) {
          const mode = btn.getAttribute('data-speed');
          if (mode) {
            setSpeedMode(mode);
          }
        }
      });
    });

    // Initialize UI states from storage
    updateAudioUI();
    updateSpeedUI();
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  window.addEventListener('load', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    initStarfield();
    initInputs();
    initUI();
    showScreen('startScreen');
    requestAnimationFrame(gameLoop);
  });

})();
