// Tiny WebAudio sound effects, generated in code.
let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}

function noise(dur, vol = 0.06) {
  try {
    const a = ac();
    const len = a.sampleRate * dur;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource();
    const g = a.createGain();
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(g); g.connect(a.destination);
    s.start();
  } catch (e) { /* audio unavailable */ }
}

export const Sfx = {
  unlock() { ac(); },
  swing() { noise(0.05, 0.03); tone(300, 0.07, 'sawtooth', 0.045, -190); },
  // punchier connect: a noise crack + a body tone that pitches up with the combo,
  // and a low thump for weight.
  hit(combo = 0) {
    const p = Math.min(12, combo);
    noise(0.06, 0.10);
    tone(175 + p * 16, 0.07, 'square', 0.07, -80);
    tone(90, 0.05, 'sine', 0.06, -24);
  },
  hurt() { tone(110, 0.25, 'sawtooth', 0.1, -70); noise(0.15, 0.06); },
  dodge() { tone(500, 0.1, 'sine', 0.05, 250); },
  enemyDie() { noise(0.15, 0.07); tone(90, 0.2, 'triangle', 0.08, -50); },
  pickup() { tone(660, 0.1, 'sine', 0.06, 220); tone(880, 0.12, 'sine', 0.05, 110); },
  doorOpen() { tone(160, 0.3, 'triangle', 0.07, 60); },
  doorLock() { tone(120, 0.2, 'square', 0.08, -40); },
  bell() { tone(1245, 0.9, 'sine', 0.07, -20); tone(830, 0.9, 'sine', 0.05, -10); },
  talk() { tone(440 + Math.random() * 120, 0.04, 'square', 0.03); },
  bossRoar() { tone(70, 0.7, 'sawtooth', 0.12, -30); noise(0.4, 0.08); },
  explode() { noise(0.35, 0.12); tone(60, 0.4, 'sawtooth', 0.1, -30); },
  upgrade() { tone(523, 0.12, 'sine', 0.06); setTimeout(() => tone(659, 0.12, 'sine', 0.06), 110); setTimeout(() => tone(784, 0.2, 'sine', 0.06), 220); },
};
