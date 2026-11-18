const fs = require('fs');

// 1. HTML: remove btnAtmoSound button
let h = fs.readFileSync('games/killer-killer.html', 'utf8');
h = h.replace(/<button class="header-icon-btn" id="btnAtmoSound"[\s\S]*?<\/button>\n/, '');
fs.writeFileSync('games/killer-killer.html', h);
console.log('atmo btn removed:', !h.includes('btnAtmoSound'));

// 2. JS: make music toggle control EVERYTHING (drone+scheduler+melody+laugh)
let s = fs.readFileSync('games/killer-killer.js', 'utf8');
s = s.replace(`  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && !this.isMuted) {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.startMusicLayers();
    } else {
      this.stopMusicLayers();
    }
    return this.musicEnabled;
  }`,
`  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && !this.isMuted) {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.startDrone();
      this.startScheduler();
      this.startMusicLayers();
    } else {
      this.stopMusicLayers();
      this.stopDrone();
      this.stopScheduler();
      this.stopHeartbeatLoop();
    }
    return this.musicEnabled;
  }`);

// 3. Remove btnAtmoSound JS binding + element ref + sound-on sync lines
s = s.replace(/    if \(this\.btnAtmoSound\) \{\n      this\.btnAtmoSound\.addEventListener\('click'[\s\S]*?\n    \}\n\n/, '');
s = s.replace(/    this\.btnAtmoSound = document\.getElementById\('btnAtmoSound'\);\n/, '');
s = s.replace(/      if \(this\.btnAtmoSound\) \{\n        this\.btnAtmoSound\.classList\.remove\('sound-on'\);\n        this\.btnAtmoSound\.setAttribute\('aria-pressed', 'false'\);\n      \}\n/, '');
s = s.replace(/      if \(this\.btnAtmoSound\) \{\n        this\.btnAtmoSound\.classList\.toggle\('sound-on', this\.sound\.atmoEnabled\);\n        this\.btnAtmoSound\.setAttribute\('aria-pressed', String\(this\.sound\.atmoEnabled\)\);\n      \}\n/, '');
// btnMusicToggle icon sync on mute changes: add to updateSoundIcon if exists? ensure toggleMusic state reflected - add in updateSoundIcon
s = s.replace('  updateSoundIcon() {', `  updateSoundIcon() {
    if (this.btnMusicToggle) {
      this.btnMusicToggle.classList.toggle('sound-on', this.sound.musicEnabled && !this.sound.isMuted);
      this.btnMusicToggle.setAttribute('aria-pressed', String(this.sound.musicEnabled));
    }`);
fs.writeFileSync('games/killer-killer.js', s);
console.log('js done');
