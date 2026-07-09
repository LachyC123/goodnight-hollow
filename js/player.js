// Mallow — the player character.
import { SPR } from './sprites.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { moveEntity } from './world.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.x = 0; this.y = 0;
    this.w = 9; this.h = 10;
    this.baseMaxStitches = 6;   // permanent/temporary bonuses come from game.mods
    this.maxStitches = 6;
    this.stitches = 6;
    this.flame = 0;          // candleflame 0-100
    this.facing = { x: 1, y: 0 };
    this.dodgeT = 0;
    this.dodgeCd = 0;
    this.attackT = 0;
    this.attackCd = 0;
    this.iframes = 0;
    this.dead = false;
    this.vxLast = 0; this.vyLast = 0; // for "hold still" boss gazes
    this.hitThisSwing = new Set();
    this.animPhase = 0;      // walk-cycle phase
    this.moving = false;
    this.ghosts = [];        // dodge afterimages
    this.lungeT = 0;         // forward step-in on attack
    this.lvx = 0; this.lvy = 0;
    this.flourish = false;   // empowered swing while a combo is hot
    this.dodgeRewarded = false;
  }

  get keepsakes() { return this.game.save.keepsakes || {}; }
  get mods() { return this.game.mods; }

  get attacking() { return this.attackT > 0; }

  attackBox() {
    const r = this.flourish ? 18 : 15;                 // the flourish reaches wider
    const long = this.flourish ? 30 : 24, wide = this.flourish ? 24 : 18;
    return {
      x: this.x + this.facing.x * r,
      y: this.y + this.facing.y * r,
      w: this.facing.x !== 0 ? wide : long,
      h: this.facing.y !== 0 ? wide : long,
    };
  }

  damage() {
    let d = 1 * this.mods.damageMult;
    if (this.stitches <= this.maxStitches / 2) d *= this.mods.damageMultLowHp;
    if (this.flourish) d *= 2.2;                        // combo finisher hits hard
    return d;
  }

  hurt(amount, fromX, fromY) {
    if (this.dead || this.iframes > 0) return;
    // a hit avoided mid-dodge is a *perfect dodge* — rewarded once per roll
    if (this.dodgeT > 0) {
      if (!this.dodgeRewarded) { this.dodgeRewarded = true; this.game.onPerfectDodge(this); }
      return;
    }
    this.stitches -= amount;
    if (this.game.run) this.game.run.damageTaken += amount;
    this.iframes = 1.0;
    Sfx.hurt();
    this.game.shake(5, 0.3);
    this.game.hitStop = Math.max(this.game.hitStop, 0.06);   // a beat of impact
    this.game.damageFlash = 0.25;
    const dx = this.x - fromX, dy = this.y - fromY;
    const l = Math.hypot(dx, dy) || 1;
    this.kbx = (dx / l) * 160; this.kby = (dy / l) * 160;
    this.kbT = 0.15;
    if (this.stitches <= 0) {
      // the mother's locket refuses, once each night
      if (this.mods.reviveOncePerNight && !this.locketUsed) {
        this.locketUsed = true;
        this.stitches = 1;
        this.iframes = 2.0;
        Sfx.bell();
        return;
      }
      this.stitches = 0;
      this.dead = true;
      this.game.onPlayerDeath();
    }
  }

  gainFlame(n) {
    this.flame = Math.min(100, this.flame + n * this.mods.flameGainMult);
  }
  heal(n) { this.stitches = Math.min(this.maxStitches, this.stitches + n); }

  update(dt, room) {
    if (this.dead) return;
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.iframes = Math.max(0, this.iframes - dt);
    this.attackT = Math.max(0, this.attackT - dt);

    let mx = Input.moveX(), my = Input.moveY();
    if (mx || my) {
      const l = Math.hypot(mx, my);
      this.facing = { x: mx / l, y: my / l };
      // snap facing to a cardinal for attack boxes
      if (Math.abs(mx) >= Math.abs(my)) this.facing = { x: Math.sign(mx), y: 0 };
      else this.facing = { x: 0, y: Math.sign(my) };
    }

    let speed = 85 * this.mods.speedMult;
    if (this.slowed) speed *= 0.5;
    this.slowed = false;

    // afterimage trail fades regardless of state
    for (const g of this.ghosts) g.t -= dt;
    if (this.ghosts.length) this.ghosts = this.ghosts.filter(g => g.t > 0);

    const px0 = this.x, py0 = this.y;
    this.moving = false;
    if (this.kbT > 0) {
      this.kbT -= dt;
      moveEntity(this, this.kbx * dt, this.kby * dt, room);
    } else if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      moveEntity(this, this.dvx * dt, this.dvy * dt, room);
      this.ghosts.push({ x: this.x, y: this.y, t: 0.22 });
    } else {
      if (mx || my) {
        const l = Math.hypot(mx, my);
        moveEntity(this, (mx / l) * speed * dt, (my / l) * speed * dt, room);
        this.moving = true;
        this.animPhase += dt * 11;
      }
      if (Input.dodge() && this.dodgeCd <= 0) {
        const l = Math.hypot(mx, my);
        const dx = l ? mx / l : this.facing.x, dy = l ? my / l : this.facing.y;
        this.dodgeT = 0.18;
        this.dodgeCd = 0.6 * this.mods.dodgeCdMult;
        this.dvx = dx * 250; this.dvy = dy * 250;
        this.dodgeRewarded = false;
        Sfx.dodge();
      }
      if (Input.attack() && this.attackCd <= 0) {
        this.attackT = 0.12;
        this.attackCd = 0.32 * this.mods.attackCdMult;
        this.hitThisSwing = new Set();
        // a hot combo (>=5) empowers the swing into a wide, heavy flourish
        this.flourish = this.game.combo >= 5;
        // step into the swing — commitment and weight
        this.lungeT = this.flourish ? 0.14 : 0.11;
        this.lvx = this.facing.x * (this.flourish ? 120 : 90);
        this.lvy = this.facing.y * (this.flourish ? 120 : 90);
        if (this.flourish) { this.game.shake(3, 0.12); Sfx.flourish(); } else Sfx.swing();
      }
      // Candleflame burst (special)
      if (Input.wasPressed('KeyL','KeyC') && this.flame >= 50) {
        this.flame -= 50;
        this.game.flameBurst(this.x, this.y);
      }
    }
    // attack lunge — a short decaying forward push, layered over any movement
    if (this.lungeT > 0 && this.kbT <= 0 && this.dodgeT <= 0) {
      this.lungeT -= dt;
      moveEntity(this, this.lvx * dt, this.lvy * dt, room);
      this.lvx *= 0.82; this.lvy *= 0.82;
    }
    this.vxLast = (this.x - px0) / Math.max(dt, 0.0001);
    this.vyLast = (this.y - py0) / Math.max(dt, 0.0001);
  }

  draw(ctx, ox, oy) {
    const spr = this.stitches <= 2 ? SPR.mallowHurt : SPR.mallow;
    // dodge afterimages — cool ghost trail behind Mallow
    for (const g of this.ghosts) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, g.t * 2.2);
      ctx.drawImage(spr, Math.round(ox + g.x - spr.width / 2), Math.round(oy + g.y - spr.height + 4));
      ctx.restore();
    }
    const flick = this.iframes > 0 && Math.floor(performance.now() / 60) % 2 === 0;
    if (!flick) {
      // walk bob while moving, a slow breath while still
      const now = performance.now();
      const bob = this.moving
        ? -Math.abs(Math.sin(this.animPhase)) * 2
        : Math.sin(now / 600) * 0.6;
      const baseY = oy + this.y + 4 + bob;   // feet baseline
      if (this.attackT > 0) {
        // anticipation → follow-through: stretch along the swing axis, squash across
        const prog = 1 - this.attackT / 0.12;
        const punch = Math.sin(prog * Math.PI);
        let sx = 1, sy = 1;
        if (this.facing.x !== 0) { sx = 1 + 0.22 * punch; sy = 1 - 0.12 * punch; }
        else { sy = 1 + 0.22 * punch; sx = 1 - 0.12 * punch; }
        ctx.save();
        ctx.translate(ox + this.x, baseY);
        ctx.scale(sx, sy);
        ctx.drawImage(spr, -spr.width / 2, -spr.height);
        ctx.restore();
      } else {
        ctx.drawImage(spr, Math.round(ox + this.x - spr.width / 2), Math.round(baseY - spr.height));
      }
      // low health: leaking stuffing
      if (this.stitches <= 2 && Math.random() < 0.05) {
        this.game.puff(this.x, this.y, '#e8e0d8');
      }
    }
    // needle swing + bright slash arc (wider, hotter, longer for a flourish)
    if (this.attackT > 0) {
      const fl = this.flourish;
      const prog = 1 - this.attackT / 0.12;               // 0..1 through the swing
      const base = Math.atan2(this.facing.y, this.facing.x);
      const sweep = fl ? 2.0 : 1.4;
      const swing = base - sweep / 2 + sweep * prog;       // sweep across the arc
      const r = fl ? 20 : 15;
      const tail = fl ? 8 : 5;
      const col = fl ? '255,190,110' : '255,236,180';
      ctx.save();
      ctx.translate(ox + this.x, oy + this.y - 2);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < tail; i++) {
        const a = swing - i * 0.15;
        const alpha = (1 - prog) * (1 - i / tail) * (fl ? 0.7 : 0.55);
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(${col},${alpha})`;
        ctx.lineWidth = (fl ? 3 : 2.2) - i * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, r, a - (fl ? 0.09 : 0.06), a + (fl ? 0.09 : 0.06));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.rotate(swing);
      ctx.drawImage(SPR.needle, r - 8, -3);
      ctx.restore();
    }
  }
}
