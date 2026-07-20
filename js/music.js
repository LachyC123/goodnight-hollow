// Adaptive ambient score, generated in WebAudio. A continuous drone + evolving
// pad, tinted per floor, that swells from calm exploration through combat to a
// boss, with a heartbeat sub-bass that quickens under pressure. No audio files.
import { audioContext } from './audio.js';

// per-floor root frequency (low, minor, uneasy)
const FLOOR_ROOT = { 1: 110.0, 2: 98.0, 3: 82.4, 4: 73.4, 5: 65.4 };

// mood -> target sound shape. cutoff opens and layers rise with tension.
const MOODS = {
  calm:    { cutoff: 380,  pad: 0.05, tension: 0.0,  beat: 0,   master: 0.42 },
  explore: { cutoff: 520,  pad: 0.06, tension: 0.02, beat: 0,   master: 0.45 },
  combat:  { cutoff: 820,  pad: 0.07, tension: 0.06, beat: 1.1, master: 0.5 },
  boss:    { cutoff: 1150, pad: 0.08, tension: 0.11, beat: 0.72, master: 0.6 },
  danger:  { cutoff: 1500, pad: 0.06, tension: 0.14, beat: 0.5, master: 0.6 },
};

export class Music {
  constructor() {
    this.on = false;
    this.enabled = true;
    this.userVol = 1;    // 0..1, set from the pause menu
    this.mood = 'calm';
    this.floor = 1;
    this.beatTimer = 0;
    this.nodes = null;
  }

  setUserVolume(v) {
    this.userVol = Math.max(0, Math.min(1, v));
    if (this.on) {
      try {
        const target = (MOODS[this.mood] || MOODS.calm).master * this.userVol;
        this.nodes.master.gain.setTargetAtTime(Math.max(0.0001, target), this.a.currentTime, 0.3);
      } catch (e) { /* ignore */ }
    }
  }

  start() {
    if (this.on || !this.enabled) return;
    try {
      const a = audioContext();
      this.a = a;
      const master = a.createGain(); master.gain.value = 0.0001;
      master.connect(a.destination);
      const filter = a.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 400; filter.Q.value = 0.8;
      filter.connect(master);

      // drone: two slightly detuned oscillators
      const droneGain = a.createGain(); droneGain.gain.value = 0.07; droneGain.connect(filter);
      const d1 = a.createOscillator(); d1.type = 'sawtooth';
      const d2 = a.createOscillator(); d2.type = 'triangle';
      d1.connect(droneGain); d2.connect(droneGain);

      // pad: a minor triad, quiet, slowly beating
      const padGain = a.createGain(); padGain.gain.value = 0.05; padGain.connect(filter);
      const p1 = a.createOscillator(); p1.type = 'sine';
      const p2 = a.createOscillator(); p2.type = 'sine';
      const p3 = a.createOscillator(); p3.type = 'sine';
      p1.connect(padGain); p2.connect(padGain); p3.connect(padGain);

      // slow filter LFO for movement
      const lfo = a.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
      const lfoGain = a.createGain(); lfoGain.gain.value = 120;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);

      this.nodes = { master, filter, droneGain, padGain, d: [d1, d2], p: [p1, p2, p3], lfo, lfoGain };
      this.setFloor(this.floor);
      [d1, d2, p1, p2, p3, lfo].forEach(o => o.start());
      master.gain.setTargetAtTime(Math.max(0.0001, MOODS[this.mood].master * this.userVol), a.currentTime, 3);
      this.on = true;
    } catch (e) { /* audio unavailable */ }
  }

  setFloor(n) {
    this.floor = n;
    if (!this.nodes) return;
    const a = this.a, root = FLOOR_ROOT[n] || 110;
    const now = a.currentTime;
    // drone at root, faintly detuned
    this.nodes.d[0].frequency.setTargetAtTime(root, now, 1.5);
    this.nodes.d[1].frequency.setTargetAtTime(root * 1.005, now, 1.5);
    // minor triad above: root, minor third, fifth
    this.nodes.p[0].frequency.setTargetAtTime(root * 2, now, 1.5);
    this.nodes.p[1].frequency.setTargetAtTime(root * 2 * 1.1892, now, 1.5); // ~minor third
    this.nodes.p[2].frequency.setTargetAtTime(root * 3, now, 1.5);          // fifth (octave up)
  }

  setMood(mood) { if (MOODS[mood]) this.mood = mood; }

  // called each frame; steers the live nodes toward the current mood and fires
  // the heartbeat sub-bass.
  update(dt) {
    if (!this.on) return;
    const a = this.a, m = MOODS[this.mood] || MOODS.calm, now = a.currentTime;
    const n = this.nodes;
    n.filter.frequency.setTargetAtTime(m.cutoff, now, 0.4);
    n.padGain.gain.setTargetAtTime(m.pad, now, 0.6);
    n.master.gain.setTargetAtTime(Math.max(0.0001, m.master * this.userVol), now, 1.2);
    // heartbeat
    if (m.beat > 0 && this.userVol > 0) {
      this.beatTimer -= dt;
      if (this.beatTimer <= 0) {
        this.beatTimer = m.beat;
        this._thump(FLOOR_ROOT[this.floor] || 110);
      }
    } else this.beatTimer = 0;
  }

  _thump(root) {
    try {
      const a = this.a, now = a.currentTime;
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(root * 0.5, now);
      o.frequency.exponentialRampToValueAtTime(root * 0.25, now + 0.18);
      const g = a.createGain(); g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      o.connect(g); g.connect(this.a.destination);
      o.start(now); o.stop(now + 0.24);
    } catch (e) { /* ignore */ }
  }

  stop() {
    if (!this.on) return;
    try { this.nodes.master.gain.setTargetAtTime(0.0001, this.a.currentTime, 1.5); } catch (e) {}
  }
}
