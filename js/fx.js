// fx.js — atmosphere, dynamic lighting and post-processing.
// Purely visual: nothing here touches gameplay. Everything composites over
// the already-rendered scene to make the house feel candle-lit and alive.
import { SPR } from './sprites.js';
import { TS, W, H } from './world.js';

// Per-night mood: drifting mote colour + a soft-light colour grade.
export const NIGHT_FX = {
  1: { mote: '#ffb861', grade: 'rgba(90,50,20,0.16)' },  // nursery — warm ember
  2: { mote: '#9fd8c0', grade: 'rgba(28,60,50,0.18)' },  // lesson hall — cold green
  3: { mote: '#ffce8a', grade: 'rgba(80,50,20,0.15)' },  // kitchen — warm amber
  4: { mote: '#9fc0d8', grade: 'rgba(20,44,64,0.20)' },  // laundry — cold blue steam
  5: { mote: '#d89aac', grade: 'rgba(60,22,40,0.17)' },  // attic — dusky rose
};
export const fxFor = (night) => NIGHT_FX[night] || NIGHT_FX[1];

// ---- Drifting atmosphere (embers / dust motes lit by the candles) ----
export class Atmosphere {
  constructor(n = 36) {
    this.motes = [];
    for (let i = 0; i < n; i++) this.motes.push(this._spawn(Math.random() * H));
  }
  _spawn(y) {
    return {
      x: Math.random() * W,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: -3 - Math.random() * 9,               // drift gently upward
      r: Math.random() < 0.22 ? 1.5 : 0.8,
      ph: Math.random() * Math.PI * 2,
      sp: 0.6 + Math.random() * 1.4,
    };
  }
  update(dt) {
    for (const m of this.motes) {
      m.ph += dt * m.sp;
      m.x += (m.vx + Math.sin(m.ph) * 7) * dt;
      m.y += m.vy * dt;
      if (m.y < -4 || m.x < -8 || m.x > W + 8) Object.assign(m, this._spawn(H + 4));
    }
  }
  draw(ctx, color) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;
    for (const m of this.motes) {
      ctx.globalAlpha = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(m.ph * 2));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// ---- Soft grounding shadow beneath an entity ----
export function drawShadow(ctx, sx, sy, w = 10) {
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 3, Math.max(4, w * 0.62), Math.max(1.6, w * 0.26), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---- Collect warm light sources from a room's candle decor ----
function collectLights(room) {
  const lights = [];
  if (!room || !room.decor) return lights;
  for (const d of room.decor) {
    if (d.spr !== SPR.candle) continue;
    const s = d.scale || 2;
    lights.push({
      x: d.tx * TS + (d.spr.width * s) / 2,
      y: d.ty * TS + TS - d.spr.height * s + 2,
      r: 40 + s * 6,
      ph: (d.tx * 13 + d.ty * 7) % 10,   // desync flicker between candles
    });
  }
  return lights;
}

// ---- Flickering light pools cast by candles (drawn after the darkness) ----
export function drawLightPools(ctx, room, ox, oy) {
  const now = performance.now();
  const lights = collectLights(room);
  if (!lights.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    const flick = 0.82 + Math.sin(now / 90 + L.ph) * 0.10 + Math.sin(now / 47 + L.ph) * 0.05;
    const r = L.r * flick;
    const cx = ox + L.x, cy = oy + L.y;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    g.addColorStop(0, 'rgba(255,186,96,0.30)');
    g.addColorStop(0.5, 'rgba(255,140,60,0.12)');
    g.addColorStop(1, 'rgba(255,120,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ---- Living chest-flame glow on Mallow (call after drawing her sprite) ----
export function drawChestFlame(ctx, cx, cy) {
  const now = performance.now();
  const fl = 0.72 + Math.sin(now / 70) * 0.16 + Math.sin(now / 31) * 0.08;
  const r = 11 * fl;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(255,224,150,0.55)');
  g.addColorStop(0.5, 'rgba(255,150,70,0.22)');
  g.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

// ---- Cinematic edge vignette (screen-space, frames the scene) ----
export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, W * 0.64);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(4,2,7,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---- Per-night colour grade ----
export function drawGrade(ctx, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---- Film grain (pre-baked noise tile, scrolled each frame) ----
let _grain = null;
function grainTile() {
  if (_grain) return _grain;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (110 + Math.random() * 145) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  _grain = c;
  return c;
}
export function drawGrain(ctx, alpha = 0.05) {
  const t = grainTile();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const sx = -((Math.random() * t.width) | 0);
  const sy = -((Math.random() * t.height) | 0);
  for (let y = sy; y < H; y += t.height)
    for (let x = sx; x < W; x += t.width)
      ctx.drawImage(t, x, y);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---- Red danger overlay: pulses when hurt, throbs while near death ----
export function drawDanger(ctx, damageFlash, lowFrac) {
  let a = 0;
  if (damageFlash > 0) a = Math.max(a, damageFlash * 1.6);
  if (lowFrac > 0) a = Math.max(a, lowFrac * (0.16 + 0.10 * Math.sin(performance.now() / 260)));
  if (a <= 0) return;
  a = Math.min(0.55, a);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, 'rgba(120,20,32,0)');
  g.addColorStop(1, `rgba(150,24,38,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
