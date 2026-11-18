const assert = require('assert');

// Mock browser audio context
global.window = {
  AudioContext: class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.destination = {};
    }
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
          setTargetAtTime() {}
        },
        connect() {}
      };
    }
    createStereoPanner() {
      return {
        pan: { setValueAtTime() {} },
        connect() {}
      };
    }
    createBiquadFilter() {
      return {
        frequency: { value: 200, setValueAtTime() {} },
        Q: { value: 1 },
        connect() {}
      };
    }
    createOscillator() {
      return {
        frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {}
      };
    }
    createBufferSource() {
      return {
        playbackRate: { value: 1 },
        connect() {},
        start() {},
        stop() {}
      };
    }
    resume() {}
    suspend() {}
  }
};
global.localStorage = {
  getItem: () => 'false',
  setItem: () => {}
};

class SoundFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this.isMuted = false;
    this.atmoEnabled = true;
    this.buffers = {};
    this.loadState = 'idle';
    this.activeSources = new Set();
    this.droneSource = null;
    this.droneGain = null;
    this.heartbeatTimer = null;
    this.heartbeatRate = 1400;
    this.isHeartbeatActive = false;
    this.currentPhase = 'viewSetup';
    this.activeVocalTime = 0;
    this.lastVocalType = null;
    this.schedulerTimers = {};
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
    } catch (e) {}
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        const effectiveGain = this.isMuted ? 0 : this.volume;
        this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.preloadAssets();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    // val between 0 and 1 or 0 and 100
    this.volume = Math.max(0, Math.min(1, val > 1 ? val / 100 : val));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  preloadAssets() {
    if (this.loadState !== 'idle' || typeof window === 'undefined' || typeof fetch === 'undefined') return;
    this.loadState = 'loading';

    const assets = {
      whisper1: '../assets/audio/killer-killer/whisper-1.ogg',
      whisper2: '../assets/audio/killer-killer/whisper-2.ogg',
      whisper3: '../assets/audio/killer-killer/whisper-3.ogg',
      laugh1:   '../assets/audio/killer-killer/laugh-1.ogg',
      laugh2:   '../assets/audio/killer-killer/laugh-2.ogg',
      scream1:  '../assets/audio/killer-killer/scream-1.ogg',
      door1:    '../assets/audio/killer-killer/door-creak-1.ogg',
      knocks1:  '../assets/audio/killer-killer/knocks-1.ogg',
      bell1:    '../assets/audio/killer-killer/bell-1.ogg',
      footsteps1: '../assets/audio/killer-killer/footsteps-1.ogg',
      heartbeat1: '../assets/audio/killer-killer/heartbeat-1.ogg',
      drone1:   '../assets/audio/killer-killer/drone-1.wav'
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
          if (key === 'drone1' && !this.isMuted && this.atmoEnabled && !this.droneSource) {
            this.startDrone();
          }
        })
        .catch(() => {});
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMuteState();
    if (!this.isMuted) {
      this.initContext();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
      }
      if (this.atmoEnabled) {
        this.startDrone();
        this.startAllSchedulers();
      }
      if (this.isHeartbeatActive) {
        this.startHeartbeatLoop(this.heartbeatRate < 1000);
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      }
      this.stopHeartbeatLoop();
      this.stopAllSchedulers();
      this.stopDrone();
    }
    return this.isMuted;
  }

  toggleAtmo() {
    this.atmoEnabled = !this.atmoEnabled;
    if (this.atmoEnabled && !this.isMuted) {
      this.startDrone();
      this.startAllSchedulers();
    } else {
      this.stopDrone();
      this.stopAllSchedulers();
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
    const pan = options.pan !== undefined ? options.pan : 0;
    const filterFreq = options.filterFreq || null;

    if (this.buffers[key]) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[key];
        src.playbackRate.value = rate;
        src.loop = loop;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        let lastNode = src;

        if (filterFreq && this.ctx.createBiquadFilter) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
          lastNode.connect(filter);
          lastNode = filter;
        }

        if (this.ctx.createStereoPanner && pan !== 0) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(pan, this.ctx.currentTime);
          lastNode.connect(panner);
          lastNode = panner;
        }

        lastNode.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.onended = () => {
          this.activeSources.delete(src);
        };
        this.activeSources.add(src);
        src.start(0);
        return src;
      } catch (e) {}
    }

    this.synthFallback(key, volume, rate, pan);
    return null;
  }

  synthFallback(key, volume, rate, pan) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    try {
      if (key.startsWith('whisper')) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 1.2);
        filter.type = 'bandpass'; filter.frequency.value = 1600; filter.Q.value = 2.0;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(volume * 0.18, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
        osc.connect(filter); filter.connect(g); g.connect(this.masterGain);
        osc.start(t); osc.stop(t + 1.4);
      } else if (key.startsWith('laugh')) {
        [220, 196, 175, 140].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          const st = t + i * 0.16;
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, st);
          o.frequency.linearRampToValueAtTime(f - 25, st + 0.13);
          g.gain.setValueAtTime(0, st);
          g.gain.linearRampToValueAtTime(volume * 0.14, st + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.15);
          o.connect(g); g.connect(this.masterGain);
          o.start(st); o.stop(st + 0.17);
        });
      } else if (key === 'scream1') {
        const o = this.ctx.createOscillator();
        const f = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(620, t);
        o.frequency.exponentialRampToValueAtTime(180, t + 0.9);
        f.type = 'bandpass'; f.frequency.value = 850;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(volume * 0.35, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
        o.connect(f); f.connect(g); g.connect(this.masterGain);
        o.start(t); o.stop(t + 1.0);
      } else if (key === 'door1') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(95, t);
        o.frequency.linearRampToValueAtTime(140, t + 0.55);
        o.frequency.linearRampToValueAtTime(75, t + 1.1);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(volume * 0.22, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
        o.connect(g); g.connect(this.masterGain);
        o.start(t); o.stop(t + 1.3);
      } else if (key === 'knocks1') {
        [0, 0.22, 0.44].forEach(dt => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(115, t + dt);
          o.frequency.exponentialRampToValueAtTime(42, t + dt + 0.06);
          g.gain.setValueAtTime(0, t + dt);
          g.gain.linearRampToValueAtTime(volume * 0.38, t + dt + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.09);
          o.connect(g); g.connect(this.masterGain);
          o.start(t + dt); o.stop(t + dt + 0.1);
        });
      } else if (key === 'bell1') {
        [330, 660, 990].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(volume * (0.32 / (idx + 1)), t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
          o.connect(g); g.connect(this.masterGain);
          o.start(t); o.stop(t + 3.5);
        });
      } else if (key === 'footsteps1') {
        [0, 0.38].forEach(dt => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(88, t + dt);
          o.frequency.exponentialRampToValueAtTime(34, t + dt + 0.09);
          g.gain.setValueAtTime(0, t + dt);
          g.gain.linearRampToValueAtTime(volume * 0.18, t + dt + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.14);
          o.connect(g); g.connect(this.masterGain);
          o.start(t + dt); o.stop(t + dt + 0.16);
        });
      } else if (key === 'heartbeat1') {
        [0, 0.28].forEach((dt, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(60, t + dt);
          o.frequency.exponentialRampToValueAtTime(35, t + dt + 0.12);
          g.gain.setValueAtTime(0, t + dt);
          g.gain.linearRampToValueAtTime(idx === 0 ? volume * 0.42 : volume * 0.26, t + dt + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.22);
          o.connect(g); g.connect(this.masterGain);
          o.start(t + dt); o.stop(t + dt + 0.25);
        });
      }
    } catch (e) {}
  }

  // --- Vocal Overlap Prevention ---
  canPlayVocal() {
    const now = Date.now();
    return (now - this.activeVocalTime) > 3000;
  }

  markVocalPlayed(type) {
    this.activeVocalTime = Date.now();
    this.lastVocalType = type;
  }

  // --- Recognizable Horror Sound Effects ---
  playWhisper(forced = false) {
    if (!forced && !this.canPlayVocal()) return;
    this.markVocalPlayed('whisper');

    const pool = ['whisper1', 'whisper2', 'whisper3'];
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    const isDistant = Math.random() < 0.32;
    const volume = isDistant ? 0.38 : (0.75 + Math.random() * 0.15);
    const filterFreq = isDistant ? 1300 : null;
    const pan = (Math.random() * 1.3) - 0.65; // Stereo positioning

    this.playBuffer(chosen, { volume, pan, filterFreq, rate: 0.94 + Math.random() * 0.12 });

    // 25% chance of layered whisper (delayed echo on opposite stereo ear)
    if (!isDistant && Math.random() < 0.25) {
      setTimeout(() => {
        if (!this.isMuted) {
          const second = pool.find(p => p !== chosen) || 'whisper2';
          this.playBuffer(second, { volume: 0.45, pan: -pan * 0.8, filterFreq: 1500, rate: 0.98 });
        }
      }, 360);
    }
  }

  playLaughter(forced = false) {
    if (!forced && !this.canPlayVocal()) return;
    this.markVocalPlayed('laugh');

    const pool = ['laugh1', 'laugh2'];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const isDistant = Math.random() < 0.4;
    const volume = isDistant ? 0.32 : 0.72;
    const filterFreq = isDistant ? 1400 : null;
    const pan = (Math.random() * 1.2) - 0.6;

    this.playBuffer(chosen, { volume, pan, filterFreq, rate: 0.92 + Math.random() * 0.14 });
  }

  playScream(forced = false) {
    if (!forced && !this.canPlayVocal()) return;
    this.markVocalPlayed('scream');

    const pan = (Math.random() * 1.0) - 0.5;
    this.playBuffer('scream1', { volume: 0.85, pan, rate: 1.0 });
  }

  playDoorCreak() {
    const pan = (Math.random() * 1.2) - 0.6;
    this.playBuffer('door1', { volume: 0.7, pan, rate: 0.9 + Math.random() * 0.2 });
  }

  playFootsteps() {
    const pan = (Math.random() * 1.2) - 0.6;
    this.playBuffer('footsteps1', { volume: 0.65, pan, rate: 0.95 + Math.random() * 0.1 });
  }

  playKnocks() {
    const pan = (Math.random() * 1.0) - 0.5;
    this.playBuffer('knocks1', { volume: 0.75, pan, rate: 0.94 + Math.random() * 0.12 });
  }

  playBell() {
    const pan = (Math.random() * 0.8) - 0.4;
    this.playBuffer('bell1', { volume: 0.75, pan, rate: 0.88 + Math.random() * 0.25 });
  }

  playHeartbeat(fast = false) {
    const rate = fast ? 1.3 : 1.0;
    this.playBuffer('heartbeat1', { volume: 0.85, rate });
  }

  // --- Continuous Cinematic Drone ---
  startDrone() {
    if (this.isMuted || !this.atmoEnabled || this.droneSource) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.buffers.drone1) {
      try {
        this.droneSource = this.ctx.createBufferSource();
        this.droneSource.buffer = this.buffers.drone1;
        this.droneSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 2.5);

        this.droneSource.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.masterGain);

        this.droneSource.start(0);
      } catch (e) {
        this.droneSource = null;
      }
    } else {
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

  // --- Heartbeat Loop for Danger Phases ---
  startHeartbeatLoop(fast = false) {
    this.isHeartbeatActive = true;
    this.heartbeatRate = fast ? 850 : 1400;
    this.stopHeartbeatLoop();
    this.playHeartbeat(fast);
    this.heartbeatTimer = setInterval(() => {
      if (!this.isMuted && this.isHeartbeatActive) {
        this.playHeartbeat(this.heartbeatRate < 1000);
      }
    }, this.heartbeatRate);
  }

  stopHeartbeatLoop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- Intelligent Supernatural Random Schedulers ---
  startAllSchedulers() {
    this.stopAllSchedulers();

    // 1. Ghost Whispers (every 8–18s)
    const scheduleWhispers = () => {
      const delay = 8000 + Math.random() * 10000;
      this.schedulerTimers.whisper = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playWhisper();
        }
        scheduleWhispers();
      }, delay);
    };
    scheduleWhispers();

    // 2. Footsteps (every 18–35s)
    const scheduleFootsteps = () => {
      const delay = 18000 + Math.random() * 17000;
      this.schedulerTimers.footsteps = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playFootsteps();
        }
        scheduleFootsteps();
      }, delay);
    };
    scheduleFootsteps();

    // 3. Knocks (every 20–40s)
    const scheduleKnocks = () => {
      const delay = 20000 + Math.random() * 20000;
      this.schedulerTimers.knocks = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playKnocks();
        }
        scheduleKnocks();
      }, delay);
    };
    scheduleKnocks();

    // 4. Creepy Laughter (every 25–45s)
    const scheduleLaughter = () => {
      const delay = 25000 + Math.random() * 20000;
      this.schedulerTimers.laugh = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playLaughter();
        }
        scheduleLaughter();
      }, delay);
    };
    scheduleLaughter();

    // 5. Door Creaks (every 30–55s)
    const scheduleDoors = () => {
      const delay = 30000 + Math.random() * 25000;
      this.schedulerTimers.door = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playDoorCreak();
        }
        scheduleDoors();
      }, delay);
    };
    scheduleDoors();

    // 6. Eerie Bells (every 35–65s)
    const scheduleBells = () => {
      const delay = 35000 + Math.random() * 30000;
      this.schedulerTimers.bell = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          this.playBell();
        }
        scheduleBells();
      }, delay);
    };
    scheduleBells();

    // 7. Rare Distant Screams (every 90–180s)
    const scheduleScreams = () => {
      const delay = 90000 + Math.random() * 90000;
      this.schedulerTimers.scream = setTimeout(() => {
        if (!this.isMuted && this.atmoEnabled) {
          if (['viewNightKiller', 'viewVoting', 'viewFinalDiscussion', 'viewNomination'].includes(this.currentPhase)) {
            this.playScream();
          }
        }
        scheduleScreams();
      }, delay);
    };
    scheduleScreams();
  }

  stopAllSchedulers() {
    Object.values(this.schedulerTimers).forEach(t => clearTimeout(t));
    this.schedulerTimers = {};
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
        setTimeout(() => this.playWhisper(true), 400);
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
        setTimeout(() => this.playKnocks(), 800);
        break;

      case 'viewFinalDiscussion':
        this.startHeartbeatLoop(true);
        break;

      case 'viewVoting':
        this.startHeartbeatLoop(true);
        setTimeout(() => this.playWhisper(true), 600);
        setTimeout(() => this.playKnocks(), 2200);
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

  // --- Gameplay Event Stings ---
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
    this.playWhisper(true);

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
    this.playScream(true);

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
      this.playLaughter(true);
      setTimeout(() => this.playScream(true), 750);
    } else {
      this.playBell();
      setTimeout(() => this.playBell(), 950);
    }
  }

  testSound(name) {
    console.log(`[Killer Killer Horror Audio Test]: Testing "${name}"...`);
    this.initContext();
    switch ((name || '').toLowerCase()) {
      case 'whisper': return this.playWhisper(true);
      case 'laugh': return this.playLaughter(true);
      case 'scream': return this.playScream(true);
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
        console.log('Drone active.');
        return;
      case 'stopdrone':
        this.stopDrone();
        console.log('Drone stopped.');
        return;
      default:
        console.warn(`Available tests: whisper, laugh, scream, door, footsteps, knocks, bell, heartbeat, drone, stopdrone`);
    }
  }
}

// Unit tests
const s = new SoundFX();
s.initContext();
assert.strictEqual(typeof s.playWhisper, 'function');
assert.strictEqual(typeof s.playLaughter, 'function');
assert.strictEqual(typeof s.playScream, 'function');
assert.strictEqual(typeof s.playDoorCreak, 'function');
assert.strictEqual(typeof s.playFootsteps, 'function');
assert.strictEqual(typeof s.playKnocks, 'function');
assert.strictEqual(typeof s.playBell, 'function');
assert.strictEqual(typeof s.playHeartbeat, 'function');
assert.strictEqual(typeof s.startDrone, 'function');
assert.strictEqual(typeof s.stopDrone, 'function');
assert.strictEqual(typeof s.setVolume, 'function');
assert.strictEqual(typeof s.setPhase, 'function');

console.log('SoundFX HorrorAudioEngine passed all unit tests!');
