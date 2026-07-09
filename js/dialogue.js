// Simple queued dialogue box with typewriter effect.
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { SPR } from './sprites.js';

// Speaker label -> portrait sprite key.
const PORTRAIT = {
  'Elsie': 'elsie', 'Oren': 'oren', 'Miri': 'miri', 'Pip': 'pip',
  'Jude': 'jude', 'Mallow': 'mallow',
  'THE NANNY WITH NO FACE': 'nanny', 'THE TEACHER OF QUIET': 'teacher',
  'THE COOK WHO STIRS': 'cook', 'THE LAUNDRESS': 'laundress', 'MOTHER MERCY': 'mercy',
};

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
    const who = this.current.who;
    const portrait = who ? SPR[PORTRAIT[who]] : null;
    const bx = 20, bh = 62, by = H - bh - 8, bw = W - 40;

    // soft drop shadow beneath the box
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    this._panel(ctx, bx + 2, by + 3, bw, bh, 5);
    ctx.fill();
    ctx.restore();

    // panel
    ctx.fillStyle = 'rgba(12,9,18,0.94)';
    this._panel(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    // warm candle accent along the top edge
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, by, 0, by + 10);
    g.addColorStop(0, 'rgba(255,180,90,0.16)');
    g.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = g;
    this._panel(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#6a5f82';
    ctx.lineWidth = 1;
    this._panel(ctx, bx + 0.5, by + 0.5, bw - 1, bh - 1, 5);
    ctx.stroke();

    // portrait, framed on the left
    let textX = bx + 10;
    if (portrait) {
      const pb = 46, pxx = bx + 6, pyy = by + (bh - pb) / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(6,4,10,0.9)';
      this._panel(ctx, pxx, pyy, pb, pb, 4); ctx.fill();
      ctx.strokeStyle = '#6a5f82';
      this._panel(ctx, pxx + 0.5, pyy + 0.5, pb - 1, pb - 1, 4); ctx.stroke();
      const sc = Math.min((pb - 8) / portrait.width, (pb - 8) / portrait.height);
      const dw = portrait.width * sc, dh = portrait.height * sc;
      ctx.imageSmoothingEnabled = false;   // scoped by save/restore below
      ctx.drawImage(portrait, pxx + (pb - dw) / 2, pyy + (pb - dh) / 2, dw, dh);
      ctx.restore();
      textX = pxx + pb + 10;
    }

    const textW = bx + bw - textX - 8;
    ctx.font = '8px monospace';
    if (who) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText(who, textX, by + 13);
    }
    ctx.fillStyle = '#e8e0d8';
    const text = this.current.text.slice(0, this.chars);
    const words = text.split(' ');
    let line = '', y = by + (who ? 26 : 16);
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > textW) {
        ctx.fillText(line, textX, y);
        y += 10;
        line = w;
      } else line = t;
    }
    ctx.fillText(line, textX, y);
    if (this.chars >= this.current.text.length) {
      ctx.fillStyle = '#ffe08a';
      if (Math.floor(performance.now() / 400) % 2) ctx.fillText('\u25BC', bx + bw - 14, by + bh - 6);
    }
  }

  // rounded-rectangle path helper (falls back to a plain rect on old canvases)
  _panel(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }
}
