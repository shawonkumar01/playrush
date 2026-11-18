const assert = require('assert');
// Verification script for the complete SoundFX HorrorAudioEngine
class SoundFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.atmoEnabled = true;
    this.buffers = {};
    this.loadState = 'idle';
    this.activeSources = new Set();
    this.droneSource = null;
    this.droneGain = null;
    this.heartbeatTimer = null;
    this.heartbeatRate = 1400; // ms between double-beats
    this.isHeartbeatActive = false;
    this.schedulerTimer = null;
    this.lastSoundPlayed = null;
    this.currentPhase = 'viewSetup';
    this.loadMuteState();

    if (typeof window !== 'undefined') {
      window.playrushKKAudioTest = (soundName) => this.testSound(soundName);
    }
  }

  loadMuteState() {
    try {
      const stored = localStorage.getItem('playrush_kk_sound_muted');
      this.isMuted = stored === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  saveMuteState() {
    try {
      localStorage.setItem('playrush_kk_sound_muted', String(this.isMuted));
    } catch (e) {
      // Ignored
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.preloadAssets();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  preloadAssets() {
    if (this.loadState !== 'idle' || typeof window === 'undefined') return;
    this.loadState = 'loading';

    const assets = {
      whisper1: '../assets/audio/killer-killer/whisper-1.ogg',
      whisper2: '../assets/audio/killer-killer/whisper-2.ogg',
      laugh:    '../assets/audio/killer-killer/laugh-1.ogg',
      scream:   '../assets/audio/killer-killer/scream-1.ogg',
      door:     '../assets/audio/killer-killer/door-creak-1.ogg',
      knocks:   '../assets/audio/killer-killer/knocks-1.ogg',
      bell:     '../assets/audio/killer-killer/bell-1.ogg',
      footstep: '../assets/audio/killer-killer/footsteps-1.ogg',
      heart:    '../assets/audio/killer-killer/heartbeat-1.ogg',
      drone:    '../assets/audio/killer-killer/drone-1.wav'
    };

    Object.entries(assets).forEach(([key, url]) => {
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(ab => this.ctx.decodeAudioData(ab))
        .then(buf => {
          this.buffers[key] = buf;
          if (key === 'drone' && !this.isMuted && this.atmoEnabled && !this.droneSource) {
            this.startDrone();
          }
        })
        .catch(err => {
          // Keep silent; procedural synth will automatically take over if buffer is missing
        });
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMuteState();
    if (!this.isMuted) {
      this.initContext();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.1);
      }
      if (this.atmoEnabled) {
        this.startDrone();
        this.startScheduler();
      }
      if (this.isHeartbeatActive) {
        this.startHeartbeatLoop();
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      this.stopHeartbeatLoop();
      this.stopScheduler();
      this.stopDrone();
    }
    return this.isMuted;
  }

  toggleAtmo() {
    this.atmoEnabled = !this.atmoEnabled;
    if (this.atmoEnabled && !this.isMuted) {
      this.startDrone();
      this.startScheduler();
    } else {
      this.stopDrone();
      this.stopScheduler();
    }
    return this.atmoEnabled;
  }

  playBuffer(key, options = {}) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const volume = options.volume !== undefined ? options.volume : 0.75;
    const rate = options.rate || 1.0;
    const loop = options.loop || false;

    if (this.buffers[key]) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[key];
        src.playbackRate.value = rate;
        src.loop = loop;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        src.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.onended = () => {
          this.activeSources.delete(src);
        };
        this.activeSources.add(src);
        src.start(0);
        return src;
      } catch (e) {
        // Fall back to synth
      }
    }

    // Procedural fallback if buffer not yet loaded or on file:// protocol
    this.synthFallback(key, volume, rate);
    return null;
  }

  synthFallback(key, volume, rate) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    try {
      switch (key) {
        case 'whisper1':
        case 'whisper2': {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 1.2);
          filter.type = 'bandpass'; filter.frequency.value = 1600; filter.Q.value = 2.5;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(volume * 0.15, t + 0.15);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          osc.connect(filter); filter.connect(g); g.connect(this.masterGain);
          osc.start(t); osc.stop(t + 1.45);
          break;
        }
        case 'laugh': {
          [220, 196, 175, 140].forEach((f, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const st = t + i * 0.18;
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(f, st);
            o.frequency.linearRampToValueAtTime(f - 30, st + 0.14);
            g.gain.setValueAtTime(0, st);
            g.gain.linearRampToValueAtTime(volume * 0.12, st + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, st + 0.16);
            o.connect(g); g.connect(this.masterGain);
            o.start(st); o.stop(st + 0.18);
          });
          break;
        }
        case 'scream': {
          const o = this.ctx.createOscillator();
          const f = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(650, t);
          o.frequency.exponentialRampToValueAtTime(190, t + 0.9);
          f.type = 'bandpass'; f.frequency.value = 800;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(volume * 0.35, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
          o.connect(f); f.connect(g); g.connect(this.masterGain);
          o.start(t); o.stop(t + 1.0);
          break;
        }
        case 'door': {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(95, t);
          o.frequency.linearRampToValueAtTime(145, t + 0.6);
          o.frequency.linearRampToValueAtTime(80, t + 1.2);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(volume * 0.25, t + 0.08);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
          o.connect(g); g.connect(this.masterGain);
          o.start(t); o.stop(t + 1.35);
          break;
        }
        case 'knocks': {
          [0, 0.22, 0.45].forEach(dt => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(110, t + dt);
            o.frequency.exponentialRampToValueAtTime(45, t + dt + 0.06);
            g.gain.setValueAtTime(0, t + dt);
            g.gain.linearRampToValueAtTime(volume * 0.4, t + dt + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.09);
            o.connect(g); g.connect(this.masterGain);
            o.start(t + dt); o.stop(t + dt + 0.1);
          });
          break;
        }
        case 'bell': {
          [330, 660, 990].forEach((freq, idx) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(volume * (0.3 / (idx + 1)), t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
            o.connect(g); g.connect(this.masterGain);
            o.start(t); o.stop(t + 3.6);
          });
          break;
        }
        case 'footstep': {
          [0, 0.4].forEach(dt => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(90, t + dt);
            o.frequency.exponentialRampToValueAtTime(35, t + dt + 0.09);
            g.gain.setValueAtTime(0, t + dt);
            g.gain.linearRampToValueAtTime(volume * 0.18, t + dt + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.15);
            o.connect(g); g.connect(this.masterGain);
            o.start(t + dt); o.stop(t + dt + 0.18);
          });
          break;
        }
        case 'heart': {
          [0, 0.28].forEach((dt, idx) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(62, t + dt);
            o.frequency.exponentialRampToValueAtTime(36, t + dt + 0.12);
            g.gain.setValueAtTime(0, t + dt);
            g.gain.linearRampToValueAtTime(idx === 0 ? volume * 0.4 : volume * 0.25, t + dt + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.22);
            o.connect(g); g.connect(this.masterGain);
            o.start(t + dt); o.stop(t + dt + 0.25);
          });
          break;
        }
        default: break;
      }
    } catch (e) {}
  }

  // --- Specific Recognizable Horror Sounds ---
  playWhisper() {
    const pick = Math.random() < 0.5 ? 'whisper1' : 'whisper2';
    return this.playBuffer(pick, { volume: 0.75, rate: 0.95 + Math.random() * 0.1 });
  }

  playLaughter() {
    return this.playBuffer('laugh', { volume: 0.75, rate: 0.95 + Math.random() * 0.1 });
  }

  playScream() {
    return this.playBuffer('scream', { volume: 0.85, rate: 1.0 });
  }

  playDoorCreak() {
    return this.playBuffer('door', { volume: 0.7, rate: 0.9 + Math.random() * 0.2 });
  }

  playFootsteps() {
    return this.playBuffer('footstep', { volume: 0.65, rate: 0.95 + Math.random() * 0.1 });
  }

  playKnocks() {
    return this.playBuffer('knocks', { volume: 0.75, rate: 0.95 + Math.random() * 0.1 });
  }

  playBell() {
    return this.playBuffer('bell', { volume: 0.75, rate: 0.85 + Math.random() * 0.3 });
  }

  playHeartbeat(fast = false) {
    const rate = fast ? 1.3 : 1.0;
    return this.playBuffer('heart', { volume: 0.85, rate });
  }

  startDrone() {
    if (this.isMuted || !this.atmoEnabled || this.droneSource) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.buffers.drone) {
      try {
        this.droneSource = this.ctx.createBufferSource();
        this.droneSource.buffer = this.buffers.drone;
        this.droneSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 2.5);

        this.droneSource.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.masterGain);

        this.droneSource.start(0);
      } catch (e) {
        this.droneSource = null;
      }
    } else {
      // Procedural drone synthesis
      try {
        const droneGain = this.ctx.createGain();
        droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2.0);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 160;

        [43.65, 65.4, 87.3].forEach(freq => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine'; osc.frequency.value = freq;
          osc.connect(filter);
          osc.start();
        });

        filter.connect(droneGain);
        droneGain.connect(this.masterGain);
        this.droneGain = droneGain;
      } catch (e) {}
    }
  }

  stopDrone() {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
      setTimeout(() => {
        if (this.droneSource) {
          try { this.droneSource.stop(); } catch (e) {}
          this.droneSource = null;
        }
      }, 900);
    }
  }

  // --- Heartbeat Loop for Suspense Phases ---
  startHeartbeatLoop(fast = false) {
    this.isHeartbeatActive = true;
    this.heartbeatRate = fast ? 850 : 1400;
    this.stopHeartbeatLoop();
    this.playHeartbeat(fast);
    this.heartbeatTimer = setInterval(() => {
      if (!this.isMuted && this.isHeartbeatActive) {
        this.playHeartbeat(fast);
      }
    }, this.heartbeatRate);
  }

  stopHeartbeatLoop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- Intelligent Random Horror Sound Scheduler ---
  startScheduler() {
    this.stopScheduler();
    const nextTick = () => {
      if (this.isMuted || !this.atmoEnabled) return;
      const candidates = [
        { sound: 'whisper', weight: 3 },
        { sound: 'door',    weight: 3 },
        { sound: 'footsteps', weight: 3 },
        { sound: 'knocks',  weight: 2 },
        { sound: 'bell',    weight: 2 },
        { sound: 'laugh',   weight: 1 },
        { sound: 'scream',  weight: 0.3 }
      ];

      // Filter out immediate previous sound
      const pool = candidates.filter(c => c.sound !== this.lastSoundPlayed);
      const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
      let rand = Math.random() * totalWeight;
      let chosen = pool[0].sound;
      for (const item of pool) {
        if (rand < item.weight) {
          chosen = item.sound;
          break;
        }
        rand -= item.weight;
      }

      this.lastSoundPlayed = chosen;
      switch (chosen) {
        case 'whisper': this.playWhisper(); break;
        case 'door': this.playDoorCreak(); break;
        case 'footsteps': this.playFootsteps(); break;
        case 'knocks': this.playKnocks(); break;
        case 'bell': this.playBell(); break;
        case 'laugh': this.playLaughter(); break;
        case 'scream':
          if (['viewNightKiller', 'viewVoting', 'viewFinalDiscussion'].includes(this.currentPhase)) {
            this.playScream();
          } else {
            this.playWhisper();
          }
          break;
      }

      // Schedule next sound (18-36 seconds interval)
      const nextDelay = 18000 + Math.random() * 18000;
      this.schedulerTimer = setTimeout(nextTick, nextDelay);
    };

    // First trigger after 12 seconds
    this.schedulerTimer = setTimeout(nextTick, 12000);
  }

  stopScheduler() {
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  // --- Phase-Reactive Sound Coordinator ---
  setPhase(viewId) {
    this.currentPhase = viewId;
    if (this.isMuted) return;

    switch (viewId) {
      case 'viewSetup':
      case 'viewHandoff':
      case 'viewDayAnnouncement':
      case 'viewWordDescription':
      case 'viewDiscussion':
        this.stopHeartbeatLoop();
        this.isHeartbeatActive = false;
        break;

      case 'viewRoleReveal':
        this.startHeartbeatLoop(false);
        setTimeout(() => this.playWhisper(), 400);
        break;

      case 'viewNightIntro':
        this.startHeartbeatLoop(false);
        this.playDoorCreak();
        break;

      case 'viewNightKiller':
        this.startHeartbeatLoop(true);
        break;

      case 'viewNightDoctor':
      case 'viewNightPolice':
        this.startHeartbeatLoop(false);
        break;

      case 'viewPoliceResult':
        this.stopHeartbeatLoop();
        this.playBell();
        break;

      case 'viewNomination':
        this.startHeartbeatLoop(false);
        break;

      case 'viewFinalDiscussion':
        this.startHeartbeatLoop(true);
        break;

      case 'viewVoting':
        this.startHeartbeatLoop(true);
        setTimeout(() => this.playKnocks(), 1200);
        break;

      case 'viewVoteResults':
        this.stopHeartbeatLoop();
        break;

      case 'viewVictory':
        this.stopHeartbeatLoop();
        break;

      default:
        break;
    }
  }

  // --- Standard Game Event Stings (Preserving all interface requirements) ---
  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch (e) {}
  }

  playReveal(role) {
    if (this.isMuted) return;
    this.initContext();
    this.playWhisper();

    // Supernatural harmonic chime
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.46);
      });
    } catch (e) {}
  }

  playNight() {
    if (this.isMuted) return;
    this.initContext();
    this.playDoorCreak();
    this.startHeartbeatLoop(false);
  }

  playSave() {
    if (this.isMuted) return;
    this.initContext();
    this.playBell();
  }

  playElimination() {
    if (this.isMuted) return;
    this.initContext();
    this.playScream();

    // Cinematic deep horror impact braaam
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.9);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.15);
    } catch (e) {}
  }

  playVictory(winner) {
    if (this.isMuted) return;
    this.initContext();

    if (winner === 'KILLER' || (typeof winner === 'string' && winner.toLowerCase().includes('killer'))) {
      this.playLaughter();
      setTimeout(() => this.playScream(), 700);
    } else {
      this.playBell();
      setTimeout(() => this.playBell(), 900);
    }
  }

  // --- Development & Independent Testing Interface ---
  testSound(name) {
    console.log(`[Killer Killer Horror Audio Test]: Testing sound "${name}"...`);
    this.initContext();
    switch ((name || '').toLowerCase()) {
      case 'whisper': return this.playWhisper();
      case 'laugh': return this.playLaughter();
      case 'scream': return this.playScream();
      case 'door': return this.playDoorCreak();
      case 'footstep':
      case 'footsteps': return this.playFootsteps();
      case 'knocks':
      case 'knock': return this.playKnocks();
      case 'bell': return this.playBell();
      case 'heart':
      case 'heartbeat': return this.playHeartbeat(false);
      case 'drone':
        this.startDrone();
        console.log('Drone started. Call window.playrushKKAudioTest("stopdrone") to halt.');
        return;
      case 'stopdrone':
        this.stopDrone();
        console.log('Drone stopped.');
        return;
      default:
        console.warn(`Unknown sound: ${name}. Available: whisper, laugh, scream, door, footsteps, knocks, bell, heartbeat, drone, stopdrone`);
    }
  }
}

// Test instantiation
const instance = new SoundFX();
assert.strictEqual(typeof instance.playClick, 'function');
assert.strictEqual(typeof instance.playWhisper, 'function');
assert.strictEqual(typeof instance.playLaughter, 'function');
assert.strictEqual(typeof instance.playScream, 'function');
assert.strictEqual(typeof instance.playDoorCreak, 'function');
assert.strictEqual(typeof instance.playFootsteps, 'function');
assert.strictEqual(typeof instance.playKnocks, 'function');
assert.strictEqual(typeof instance.playBell, 'function');
assert.strictEqual(typeof instance.playHeartbeat, 'function');
assert.strictEqual(typeof instance.startDrone, 'function');
assert.strictEqual(typeof instance.stopDrone, 'function');
assert.strictEqual(typeof instance.toggleMute, 'function');
assert.strictEqual(typeof instance.testSound, 'function');
console.log('SoundFX class test PASSED!');
