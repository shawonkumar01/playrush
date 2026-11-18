const fs = require('fs');
const p = 'games/killer-killer.js';
let s = fs.readFileSync(p, 'utf8');

// 1. Add music state + methods to SoundFX (before Phase Coordinator section)
const anchor = '  // --- Phase-Reactive Sound Coordinator ---';
const methods = `  // --- Haunted Music Toggle (laugh loop + theme melody, whole game) ---
  musicEnabled = false;
  musicLaughSource = null;
  musicLaughGain = null;

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && !this.isMuted) {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.startMusicLayers();
    } else {
      this.stopMusicLayers();
    }
    return this.musicEnabled;
  }

  startMusicLayers() {
    if (!this.ctx || !this.masterGain) return;
    // Laugh track looped quietly as the music bed
    if (!this.musicLaughSource && this.buffers.laugh) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.laugh;
        src.loop = true;
        src.playbackRate.value = 0.85;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2.5);
        src.connect(g); g.connect(this.masterGain);
        src.start(0);
        this.musicLaughSource = src;
        this.musicLaughGain = g;
      } catch (e) {}
    }
    // Haunted theme melody (loops through composed phrase)
    this.startSetupMelody();
  }

  stopMusicLayers() {
    if (this.musicLaughGain && this.ctx) {
      this.musicLaughGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
      const src = this.musicLaughSource;
      setTimeout(() => { try { src && src.stop(); } catch (e) {} }, 800);
    }
    this.musicLaughSource = null;
    this.musicLaughGain = null;
    this.stopSetupMelody();
  }

` + anchor;

if (!s.includes(anchor)) { console.log('anchor missing'); process.exit(1); }
s = s.replace(anchor, methods);

// 2. Element ref + event binding (next to btnAtmoSound binding)
s = s.replace("    if (this.btnAtmoSound) {\n      this.btnAtmoSound.addEventListener('click', () => {\n        this.sound.playClick();\n        this.sound.toggleAtmo();\n        this.updateSoundIcon();\n      });\n    }",
`    if (this.btnAtmoSound) {
      this.btnAtmoSound.addEventListener('click', () => {
        this.sound.playClick();
        this.sound.toggleAtmo();
        this.updateSoundIcon();
      });
    }

    this.btnMusicToggle = document.getElementById('btnMusicToggle');
    if (this.btnMusicToggle) {
      this.btnMusicToggle.addEventListener('click', () => {
        this.sound.playClick();
        const on = this.sound.toggleMusic();
        this.btnMusicToggle.classList.toggle('sound-on', on);
        this.btnMusicToggle.setAttribute('aria-pressed', String(on));
        this.btnMusicToggle.title = on ? 'Stop Haunted Music' : 'Play Haunted Music';
      });
    }`);

// 3. Remove redundant bell ambience calls (music toggle replaces it)
s = s.replace("      case 'viewSetup':\n        this.startSetupAmbience();\n", "      case 'viewSetup':\n");

// 4. Mute should also silence music: masterGain already covers it (music connects to masterGain) - ok.
//    But toggling mute off should resume music layers if musicEnabled
s = s.replace("      if (this.atmoEnabled) {\n        this.startDrone();\n        this.startScheduler();\n      }",
`      if (this.atmoEnabled) {
        this.startDrone();
        this.startScheduler();
      }
      if (this.musicEnabled) {
        this.startMusicLayers();
      }`);

fs.writeFileSync(p, s);
console.log('done');
