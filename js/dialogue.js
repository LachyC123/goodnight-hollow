// Simple queued dialogue box with typewriter effect.
import { Input } from './input.js';
import { Sfx } from './audio.js';

export class Dialogue {
  constructor() {
    this.queue = [];
    this.current = null;
    this.chars = 0;
    this.timer = 0;
    this.onDone = null;
  }
  get active() { return this.current !== null; }
  say(lines, onDone = null) {
    // lines: array of {who, text}
    this.queue.push(...lines);
    this.onDone = onDone;
    if (!this.current) this.next();
  }
  next() {
    this.current = this.queue.shift() || null;
    this.chars = 0;
    this.timer = 0;
    if (!this.current && this.onDone) {
      const cb = this.onDone;
      this.onDone = null;
      cb();
    }
  }
  update(dt) {
    if (!this.current) return;
    const full = this.current.text.length;
    if (this.chars < full) {
      this.timer += dt;
      while (this.timer > 0.025 && this.chars < full) {
        this.timer -= 0.025;
        this.chars++;
        if (this.chars % 3 === 0) Sfx.talk();
      }
      if (Input.confirm()) this.chars = full;
    } else if (Input.confirm()) {
      this.next();
    }
  }
  draw(ctx, W, H) {
    if (!this.current) return;
    const bx = 20, bh = 62, by = H - bh - 8, bw = W - 40;
    ctx.fillStyle = 'rgba(10,8,16,0.92)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#55506a';
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.font = '8px monospace';
    if (this.current.who) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText(this.current.who, bx + 8, by + 12);
    }
    ctx.fillStyle = '#e8e0d8';
    const text = this.current.text.slice(0, this.chars);
    const words = text.split(' ');
    let line = '', y = by + (this.current.who ? 24 : 14);
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > bw - 16) {
        ctx.fillText(line, bx + 8, y);
        y += 10;
        line = w;
      } else line = t;
    }
    ctx.fillText(line, bx + 8, y);
    if (this.chars >= this.current.text.length) {
      ctx.fillStyle = '#ffe08a';
      if (Math.floor(performance.now() / 400) % 2) ctx.fillText('\u25BC', bx + bw - 14, by + bh - 6);
    }
  }
}
