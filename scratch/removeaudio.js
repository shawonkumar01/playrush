const fs = require('fs');

// 1. HTML: remove both sound buttons
let h = fs.readFileSync('games/killer-killer.html', 'utf8');
h = h.replace(/<button class="header-icon-btn" id="btnHeaderSound"[\s\S]*?<\/button>\n/, '');
h = h.replace(/<button class="header-icon-btn" id="btnMusicToggle"[\s\S]*?<\/button>\n/, '');
fs.writeFileSync('games/killer-killer.html', h);
console.log('html buttons removed:', !h.includes('btnHeaderSound') && !h.includes('btnMusicToggle'));

// 2. JS: delete entire SoundFX class, replace instantiation with no-op stub
let s = fs.readFileSync('games/killer-killer.js', 'utf8');
const start = s.indexOf('class SoundFX {');
const end = s.indexOf('class KillerKillerGame {');
if (start < 0 || end < 0) { console.log('class markers missing'); process.exit(1); }
s = s.slice(0, start) + s.slice(end);

const stub = `class SoundFX {
  constructor() {
    this.isMuted = true;
    this.atmoEnabled = false;
    this.musicEnabled = false;
  }
  playClick() {} playReveal() {} playVote() {} playElimination() {}
  playNight() {} playDay() {} playVictory() {} playWhisper() {}
  playLaughter() {} playScream() {} playDoorCreak() {} playFootsteps() {}
  playKnocks() {} playBell() {} playHeartbeat() {} playBuffer() {}
  synthFallback() {} initContext() {} preloadAssets() {}
  toggleMute() { return true; }
  toggleAtmo() { return false; }
  toggleMusic() { return false; }
  startDrone() {} stopDrone() {} startScheduler() {} stopScheduler() {}
  startHeartbeatLoop() {} stopHeartbeatLoop() {}
  startSetupAmbience() {} stopSetupAmbience() {}
  startSetupMelody() {} stopSetupMelody() {}
  startMusicLayers() {} stopMusicLayers() {}
  setPhase() {} testSound() {}
}

`;
s = s.replace('class KillerKillerGame {', stub + 'class KillerKillerGame {');

// 3. Remove event bindings for sound buttons
s = s.replace(/    \/\/ Sound Toggle\n    this\.btnHeaderSound\.addEventListener\('click'[\s\S]*?\n    \}\);\n\n/, '');
s = s.replace(/\n    this\.btnMusicToggle = document\.getElementById\('btnMusicToggle'\);[\s\S]*?\n    \}\n/, '\n');
// element refs
s = s.replace(/    this\.btnHeaderSound = document\.getElementById\('btnHeaderSound'\);\n/, '');
s = s.replace(/    this\.btnAtmoSound = document\.getElementById\('btnAtmoSound'\);\n/, '');

fs.writeFileSync('games/killer-killer.js', s);
console.log('js done');
