const fs = require('fs');

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
    createOscillator() {
      return {
        frequency: {
          value: 440,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {}
        },
        connect() {},
        start() {},
        stop() {}
      };
    }
    createBiquadFilter() {
      return {
        frequency: { value: 200 },
        Q: { value: 1 },
        connect() {}
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

const js = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/playrush/games/killer-killer.js', 'utf8');
const classCode = js.slice(js.indexOf('class SoundFX {'), js.indexOf('/* ==========================================================================\n   GAME STATE CONTROLLER'));

const fn = new Function(classCode + '\nreturn SoundFX;');
const SoundFXClass = fn();

const s = new SoundFXClass();
s.initContext();
console.log('Testing playClick...'); s.playClick();
console.log('Testing playWhisper...'); s.playWhisper();
console.log('Testing playLaughter...'); s.playLaughter();
console.log('Testing playScream...'); s.playScream();
console.log('Testing playDoorCreak...'); s.playDoorCreak();
console.log('Testing playFootsteps...'); s.playFootsteps();
console.log('Testing playKnocks...'); s.playKnocks();
console.log('Testing playBell...'); s.playBell();
console.log('Testing playHeartbeat...'); s.playHeartbeat(false);
console.log('Testing startDrone...'); s.startDrone();
console.log('Testing testSound via window API...');
window.playrushKKAudioTest('whisper');
window.playrushKKAudioTest('laugh');
window.playrushKKAudioTest('scream');
window.playrushKKAudioTest('door');
window.playrushKKAudioTest('footsteps');
window.playrushKKAudioTest('knocks');
window.playrushKKAudioTest('bell');
window.playrushKKAudioTest('heartbeat');
console.log('ALL AUDIO TESTS EXECUTED CLEANLY AND PASSED!');
