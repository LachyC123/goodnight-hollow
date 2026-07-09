// Enemies: Button Mouse, Blanket Crawler, Crying Doll, Hand minion, and the boss.
import { SPR } from './sprites.js';
import { Sfx } from './audio.js';
import { moveEntity, overlap, dist, TS, COLS, ROWS } from './world.js';

class Enemy {
  constructor(game, x, y) {
    this.game = game;
    this.x = x; this.y = y;
    this.w = 10; this.h = 8;
    this.hp = 1;
    this.dead = false;
    this.flash = 0;
    this.contactDamage = true;
    this.touchable = true; // takes hits
  }
  hit(dmg, from) {
    if (this.dead || !this.touchable) return;
    this.hp -= dmg;
    this.flash = 0.1;
    Sfx.hit();
    const dx = this.x - from.x, dy = this.y - from.y;
    const l = Math.hypot(dx, dy) || 1;
    this.x += (dx / l) * 5; this.y += (dy / l) * 5;
    // sparks fly from the struck point, toward where the needle came from
    this.game.sparks(this.x - (dx / l) * 4, this.y - (dy / l) * 4, '#ffe0a0', 5);
    this.game.player.gainFlame(6);
    if (this.hp <= 0) this.die();
  }
  die() {
    this.dead = true;
    Sfx.enemyDie();
    this.game.puff(this.x, this.y, '#55506a');
    this.game.sparks(this.x, this.y, '#ffd0a0', 9);
  }
  update(dt, room, player) {}
  drawSprite(ctx, ox, oy, spr) {
    const px = Math.round(ox + this.x - spr.width / 2);
    const py = Math.round(oy + this.y - spr.height + 4);
    if (this.flash > 0) {
      ctx.save();
      ctx.filter = 'brightness(3)';
      ctx.drawImage(spr, px, py);
      ctx.restore();
    } else {
      ctx.drawImage(spr, px, py);
    }
  }
}

export class ButtonMouse extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 2;
    this.w = 8; this.h = 6;
    this.state = 'chase';
    this.t = 0;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    const d = dist(this, player);
    if (this.state === 'chase') {
      if (d < 42) { this.state = 'windup'; this.t = 0.35; }
      else {
        const dx = player.x - this.x, dy = player.y - this.y;
        const l = Math.hypot(dx, dy) || 1;
        moveEntity(this, (dx / l) * 55 * dt, (dy / l) * 55 * dt, room);
      }
    } else if (this.state === 'windup') {
      if (this.t <= 0) {
        const dx = player.x - this.x, dy = player.y - this.y;
        const l = Math.hypot(dx, dy) || 1;
        this.lvx = (dx / l) * 175; this.lvy = (dy / l) * 175;
        this.state = 'lunge'; this.t = 0.25;
      }
    } else if (this.state === 'lunge') {
      moveEntity(this, this.lvx * dt, this.lvy * dt, room);
      if (this.t <= 0) { this.state = 'rest'; this.t = 0.5; }
    } else if (this.state === 'rest') {
      if (this.t <= 0) this.state = 'chase';
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    if (this.state === 'windup' && Math.floor(performance.now() / 80) % 2) {
      ctx.save(); ctx.filter = 'brightness(1.8)';
      this.drawSprite(ctx, ox, oy, SPR.buttonMouse);
      ctx.restore();
    } else this.drawSprite(ctx, ox, oy, SPR.buttonMouse);
  }
}

export class BlanketCrawler extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 4;
    this.w = 13; this.h = 7;
    this.state = 'dormant';
    this.t = 0;
    this.contactDamage = false;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    const d = dist(this, player);
    if (this.state === 'dormant') {
      if (d < 58 || this.flash > 0) { this.state = 'rise'; this.t = 0.55; }
    } else if (this.state === 'rise') {
      if (this.t <= 0) { this.state = 'pursue'; this.t = 2.0; this.contactDamage = true; }
    } else if (this.state === 'pursue') {
      const dx = player.x - this.x, dy = player.y - this.y;
      const l = Math.hypot(dx, dy) || 1;
      moveEntity(this, (dx / l) * 28 * dt, (dy / l) * 28 * dt, room);
      if (this.t <= 0) { this.state = 'windup'; this.t = 0.45; }
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
    } else if (this.state === 'windup') {
      if (this.t <= 0) {
        const dx = player.x - this.x, dy = player.y - this.y;
        const l = Math.hypot(dx, dy) || 1;
        this.lvx = (dx / l) * 145; this.lvy = (dy / l) * 145;
        this.state = 'lunge'; this.t = 0.3;
      }
    } else if (this.state === 'lunge') {
      moveEntity(this, this.lvx * dt, this.lvy * dt, room);
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
      if (this.t <= 0) { this.state = 'pursue'; this.t = 2.2; }
    }
  }
  draw(ctx, ox, oy) {
    const spr = this.state === 'dormant' ? SPR.crawlerDown : SPR.crawlerUp;
    if (this.state === 'windup' && Math.floor(performance.now() / 80) % 2) {
      ctx.save(); ctx.filter = 'brightness(1.8)';
      this.drawSprite(ctx, ox, oy, spr);
      ctx.restore();
    } else this.drawSprite(ctx, ox, oy, spr);
  }
}

export class CryingDoll extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 3;
    this.w = 9; this.h = 10;
    this.cry = 0;
    this.cryMax = 9;
    this.contactDamage = false;
    this.isDoll = true;
  }
  die() {
    // killed by the player — this is the moral choice
    super.die();
    this.game.onDollKilled(this);
  }
  explode() {
    this.dead = true;
    Sfx.explode();
    this.game.shake(5, 0.3);
    this.game.puff(this.x, this.y, '#9fd8c0');
    if (dist(this, this.game.player) < 46) {
      this.game.player.hurt(1, this.x, this.y);
    }
    this.game.onDollExploded(this);
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.cry += dt;
    if (this.cry >= this.cryMax) this.explode();
  }
  draw(ctx, ox, oy) {
    this.drawSprite(ctx, ox, oy, SPR.cryingDoll);
    // tear drip
    if (Math.floor(performance.now() / 300) % 2) {
      ctx.fillStyle = '#9fd8c0';
      ctx.fillRect(Math.round(ox + this.x - 3), Math.round(oy + this.y - 4), 1, 2);
      ctx.fillRect(Math.round(ox + this.x + 3), Math.round(oy + this.y - 4), 1, 2);
    }
    // cry meter
    const p = this.cry / this.cryMax;
    ctx.fillStyle = '#14101c';
    ctx.fillRect(ox + this.x - 6, oy + this.y - 14, 12, 2);
    ctx.fillStyle = p > 0.75 ? '#ff6b35' : '#9fd8c0';
    ctx.fillRect(ox + this.x - 6, oy + this.y - 14, Math.round(12 * p), 2);
  }
}

export class HandMinion extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 1;
    this.w = 7; this.h = 5;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    const dx = player.x - this.x, dy = player.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    moveEntity(this, (dx / l) * 68 * dt, (dy / l) * 68 * dt, room);
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) { this.drawSprite(ctx, ox, oy, SPR.hand); }
}

// --- Boss: The Nanny With No Face ---
export class Nanny extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.maxHp = 55;
    this.hp = this.maxHp;
    this.w = 18; this.h = 16;
    this.isBoss = true;
    this.state = 'intro';
    this.t = 1.2;
    this.zones = [];   // lullaby zones {x,y,t,active}
    this.shakeX = 0;
  }
  get phase2() { return this.hp <= this.maxHp / 2; }
  hit(dmg, from) {
    if (this.state === 'intro') return;
    super.hit(dmg, from);
  }
  die() {
    this.dead = true;
    Sfx.explode();
    this.game.shake(8, 0.7);
    this.game.puff(this.x, this.y, '#241e33');
    this.game.onBossDefeated();
  }
  pickAttack(player) {
    const opts = ['charge', 'hands', 'lullaby'];
    const a = this.lastAttack === undefined ? 'charge'
      : opts.filter(o => o !== this.lastAttack)[Math.floor(Math.random() * 2)];
    this.lastAttack = a;
    if (a === 'charge') {
      this.state = 'chargeWindup';
      this.t = this.phase2 ? 0.5 : 0.75;
    } else if (a === 'hands') {
      this.state = 'hands';
      this.t = 0.8;
    } else {
      this.state = 'lullaby';
      this.t = 0.6;
    }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    // zones
    for (const z of this.zones) {
      z.t -= dt;
      if (!z.active && z.t <= 0) { z.t = 3.2; z.active = true; }
      if (z.active && dist(z, player) < z.r) player.slowed = true;
    }
    this.zones = this.zones.filter(z => !(z.active && z.t <= 0));

    switch (this.state) {
      case 'intro':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.8; }
        break;
      case 'idle': {
        // drift toward player slowly
        const dx = player.x - this.x, dy = player.y - this.y;
        const l = Math.hypot(dx, dy) || 1;
        moveEntity(this, (dx / l) * 22 * dt, (dy / l) * 22 * dt, room);
        if (this.t <= 0) this.pickAttack(player);
        break;
      }
      case 'chargeWindup':
        this.shakeX = Math.sin(performance.now() / 25) * 1.5;
        if (this.t <= 0) {
          this.shakeX = 0;
          const dx = player.x - this.x, dy = player.y - this.y;
          const l = Math.hypot(dx, dy) || 1;
          this.cvx = (dx / l) * (this.phase2 ? 265 : 220);
          this.cvy = (dy / l) * (this.phase2 ? 265 : 220);
          this.state = 'charge';
          this.t = 2.0;
          Sfx.bossRoar();
        }
        break;
      case 'charge': {
        const ox = this.x, oyy = this.y;
        moveEntity(this, this.cvx * dt, this.cvy * dt, room);
        const blocked = Math.abs(this.x - ox) < Math.abs(this.cvx * dt) * 0.4
                     && Math.abs(this.y - oyy) < Math.abs(this.cvy * dt) * 0.4;
        if (overlap(this, player)) player.hurt(1, this.x, this.y);
        if (blocked || this.t <= 0) {
          this.state = 'stunned';
          this.t = 1.3;
          this.game.shake(6, 0.3);
        }
        break;
      }
      case 'stunned':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.9; }
        break;
      case 'hands':
        if (this.t <= 0) {
          const n = this.phase2 ? 4 : 3;
          for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n;
            this.game.spawnEnemy(new HandMinion(this.game,
              this.x + Math.cos(a) * 24, this.y + Math.sin(a) * 24));
          }
          this.state = 'idle';
          this.t = this.phase2 ? 1.2 : 1.8;
        }
        break;
      case 'lullaby':
        if (this.t <= 0) {
          const n = this.phase2 ? 3 : 2;
          for (let i = 0; i < n; i++) {
            this.zones.push({
              x: player.x + (Math.random() * 70 - 35) * i,
              y: player.y + (Math.random() * 70 - 35) * i,
              r: 34, t: 0.8, active: false,
            });
          }
          Sfx.bell();
          this.state = 'idle';
          this.t = 1.6;
        }
        break;
    }
    if (this.state !== 'charge' && overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    // zones under everything
    for (const z of this.zones) {
      ctx.save();
      ctx.globalAlpha = z.active ? 0.35 : 0.15 + 0.15 * Math.sin(performance.now() / 100);
      ctx.fillStyle = z.active ? '#7a6a92' : '#ffe08a';
      ctx.beginPath();
      ctx.arc(ox + z.x, oy + z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const sx = ox + (this.state === 'chargeWindup' ? this.shakeX : 0);
    // pram in front
    const nan = SPR.nanny, pram = SPR.pram;
    const sc = 1.6;
    const px = Math.round(sx + this.x - (nan.width * sc) / 2);
    const py = Math.round(oy + this.y - nan.height * sc + 10);
    ctx.imageSmoothingEnabled = false;
    if (this.flash > 0) {
      ctx.save(); ctx.filter = 'brightness(2.5)';
      ctx.drawImage(nan, px, py, nan.width * sc, nan.height * sc);
      ctx.restore();
    } else ctx.drawImage(nan, px, py, nan.width * sc, nan.height * sc);
    ctx.drawImage(pram, Math.round(sx + this.x - (pram.width * sc) / 2), Math.round(oy + this.y - 2), pram.width * sc, pram.height * sc);
  }
}

// ============ Nights 2-5 enemies ============

// --- Chalk Wraith (Lesson Hall): drifts, fires chalk dots ---
export class ChalkWraith extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 3;
    this.w = 8; this.h = 10;
    this.t = 0.8 + Math.random();
    this.pink = Math.random() < 0.5;
    this.contactDamage = true;
    this.drift = Math.random() * Math.PI * 2;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    this.drift += dt * 1.4;
    const d = dist(this, player);
    // keep a chalk-throw distance, weaving
    const dx = player.x - this.x, dy = player.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    const want = d > 90 ? 1 : d < 60 ? -1 : 0;
    moveEntity(this,
      ((dx / l) * want * 34 + Math.cos(this.drift) * 22) * dt,
      ((dy / l) * want * 34 + Math.sin(this.drift) * 22) * dt, room);
    if (this.t <= 0 && d < 150) {
      this.t = 1.7 + Math.random() * 0.6;
      this.game.spawnProjectile({
        x: this.x, y: this.y, vx: (dx / l) * 95, vy: (dy / l) * 95,
        r: 2, t: 2.2, color: this.pink ? '#c87a9e' : '#6a86b8',
      });
      Sfx.talk();
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    const bob = Math.sin(performance.now() / 220 + this.x) * 1.5;
    ctx.save();
    ctx.translate(0, bob);
    this.drawSprite(ctx, ox, oy, this.pink ? SPR.chalkWraithPink : SPR.chalkWraith);
    ctx.restore();
  }
}

// --- Desk Mimic (Lesson Hall): looks like a desk until you come close ---
export class DeskMimic extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 5;
    this.w = 14; this.h = 8;
    this.state = 'dormant';
    this.t = 0;
    this.contactDamage = false;
    this.touchable = true;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    const d = dist(this, player);
    if (this.state === 'dormant') {
      if (d < 34 || this.flash > 0) { this.state = 'snap'; this.t = 0.25; Sfx.doorLock(); }
    } else if (this.state === 'snap') {
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
      if (this.t <= 0) { this.state = 'scuttle'; this.t = 1.4; }
    } else if (this.state === 'scuttle') {
      const dx = player.x - this.x, dy = player.y - this.y;
      const l = Math.hypot(dx, dy) || 1;
      moveEntity(this, (dx / l) * 62 * dt, (dy / l) * 62 * dt, room);
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
      if (this.t <= 0) { this.state = 'rest'; this.t = 0.9; }
    } else if (this.state === 'rest') {
      if (this.t <= 0) { this.state = 'snap'; this.t = 0.25; }
    }
  }
  draw(ctx, ox, oy) {
    const spr = this.state === 'dormant' || this.state === 'rest' ? SPR.mimicClosed : SPR.mimicOpen;
    this.drawSprite(ctx, ox, oy, spr);
  }
}

// --- Spoon Swarm (Kitchen): fast dart-and-circle flyer ---
export class SpoonSwarm extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 1;
    this.w = 7; this.h = 4;
    this.state = 'circle';
    this.t = 0.8 + Math.random() * 0.8;
    this.ang = Math.random() * Math.PI * 2;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    if (this.state === 'circle') {
      this.ang += dt * 2.4;
      const tx = player.x + Math.cos(this.ang) * 52;
      const ty = player.y + Math.sin(this.ang) * 34;
      const dx = tx - this.x, dy = ty - this.y;
      const l = Math.hypot(dx, dy) || 1;
      moveEntity(this, (dx / l) * Math.min(90, l * 4) * dt, (dy / l) * Math.min(90, l * 4) * dt, room);
      if (this.t <= 0) {
        const px = player.x - this.x, py = player.y - this.y;
        const pl = Math.hypot(px, py) || 1;
        this.dvx = (px / pl) * 200; this.dvy = (py / pl) * 200;
        this.state = 'dart'; this.t = 0.35;
        Sfx.swing();
      }
    } else {
      moveEntity(this, this.dvx * dt, this.dvy * dt, room);
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
      if (this.t <= 0) { this.state = 'circle'; this.t = 1.2 + Math.random() * 0.6; }
    }
  }
  draw(ctx, ox, oy) { this.drawSprite(ctx, ox, oy, SPR.spoonEnemy); }
}

// --- Porridge Blob (Kitchen): slow, spits globs, splits once ---
export class PorridgeBlob extends Enemy {
  constructor(game, x, y, small = false) {
    super(game, x, y);
    this.small = small;
    this.hp = small ? 2 : 5;
    this.w = small ? 6 : 10; this.h = small ? 4 : 6;
    this.t = 1.2;
  }
  die() {
    super.die();
    if (!this.small) {
      this.game.spawnEnemy(new PorridgeBlob(this.game, this.x - 8, this.y, true));
      this.game.spawnEnemy(new PorridgeBlob(this.game, this.x + 8, this.y, true));
    }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    moveEntity(this, (dx / l) * (this.small ? 44 : 24) * dt, (dy / l) * (this.small ? 44 : 24) * dt, room);
    if (!this.small && this.t <= 0 && l < 140) {
      this.t = 2.1;
      this.game.spawnProjectile({
        x: this.x, y: this.y, vx: (dx / l) * 78, vy: (dy / l) * 78,
        r: 2, t: 2, color: '#b8b0a8',
      });
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    if (this.small) {
      const px = Math.round(ox + this.x - 2), py = Math.round(oy + this.y - 2);
      ctx.drawImage(SPR.glob, px, py);
    } else this.drawSprite(ctx, ox, oy, SPR.porridge);
  }
}

// --- Sheet Ghost (Laundry): phases through furniture, smothers ---
export class SheetGhost extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 3;
    this.w = 9; this.h = 7;
    this.phase = Math.random() * Math.PI * 2;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.phase += dt * 2;
    const dx = player.x - this.x, dy = player.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    const sp = 38 + Math.sin(this.phase) * 16;
    // drifts straight through obstacles (no collision) but stays inside walls
    this.x = Math.max(TS + 4, Math.min((COLS - 1) * TS - 4, this.x + (dx / l) * sp * dt));
    this.y = Math.max(TS + 4, Math.min((ROWS - 1) * TS - 4, this.y + (dy / l) * sp * dt));
    if (overlap(this, player)) { player.slowed = true; player.hurt(1, this.x, this.y); }
  }
  draw(ctx, ox, oy) {
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(this.phase) * 0.15;
    const bob = Math.sin(performance.now() / 260 + this.y) * 2;
    ctx.translate(0, bob);
    this.drawSprite(ctx, ox, oy, SPR.sheet);
    ctx.restore();
  }
}

// --- Mangle Hound (Laundry): patrols, then runs you down in straight lines ---
export class MangleHound extends Enemy {
  constructor(game, x, y) {
    super(game, x, y);
    this.hp = 4;
    this.w = 10; this.h = 6;
    this.state = 'stalk';
    this.t = 0.9;
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    if (this.state === 'stalk') {
      const dx = player.x - this.x, dy = player.y - this.y;
      const l = Math.hypot(dx, dy) || 1;
      moveEntity(this, (dx / l) * 40 * dt, (dy / l) * 40 * dt, room);
      if (this.t <= 0 && l < 130) { this.state = 'windup'; this.t = 0.4; }
    } else if (this.state === 'windup') {
      if (this.t <= 0) {
        // charge along the dominant axis only — dodge sideways to escape
        const dx = player.x - this.x, dy = player.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) { this.cvx = Math.sign(dx) * 215; this.cvy = 0; }
        else { this.cvx = 0; this.cvy = Math.sign(dy) * 215; }
        this.state = 'charge'; this.t = 0.9;
        Sfx.dodge();
      }
    } else if (this.state === 'charge') {
      const px = this.x, py = this.y;
      moveEntity(this, this.cvx * dt, this.cvy * dt, room);
      if (overlap(this, player)) player.hurt(1, this.x, this.y);
      const blocked = this.x === px && this.y === py;
      if (blocked || this.t <= 0) { this.state = 'stalk'; this.t = 1.3; }
    }
  }
  draw(ctx, ox, oy) {
    if (this.state === 'windup' && Math.floor(performance.now() / 80) % 2) {
      ctx.save(); ctx.filter = 'brightness(1.8)';
      this.drawSprite(ctx, ox, oy, SPR.hound);
      ctx.restore();
    } else this.drawSprite(ctx, ox, oy, SPR.hound);
  }
}

// ============ Bosses, Nights 2-5 ============

class Boss extends Enemy {
  constructor(game, x, y, hp, w, h) {
    super(game, x, y);
    this.maxHp = hp; this.hp = hp;
    this.w = w; this.h = h;
    this.isBoss = true;
    this.state = 'intro';
    this.t = 1.2;
  }
  get phase2() { return this.hp <= this.maxHp / 2; }
  hit(dmg, from) {
    if (this.state === 'intro') return;
    super.hit(dmg, from);
  }
  die() {
    this.dead = true;
    Sfx.explode();
    this.game.shake(8, 0.7);
    this.game.puff(this.x, this.y, '#241e33');
    this.game.onBossDefeated();
  }
  driftToward(player, room, speed, dt) {
    const dx = player.x - this.x, dy = player.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    moveEntity(this, (dx / l) * speed * dt, (dy / l) * speed * dt, room);
  }
}

// --- Night 2: The Teacher of Quiet ---
// Attacks: ruler sweep volley, "eyes on the board" freeze-gaze, summon chalk wraiths.
export class Teacher extends Boss {
  constructor(game, x, y) { super(game, x, y, 65, 16, 16); this.gazeT = 0; }
  pickAttack(player) {
    const opts = ['rulers', 'gaze', 'summon'];
    const a = this.lastAttack === undefined ? 'rulers'
      : opts.filter(o => o !== this.lastAttack)[Math.floor(Math.random() * 2)];
    this.lastAttack = a;
    if (a === 'rulers') { this.state = 'rulers'; this.t = 0.55; }
    else if (a === 'gaze') { this.state = 'gazeWind'; this.t = 0.8; }
    else { this.state = 'summon'; this.t = 0.6; }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    switch (this.state) {
      case 'intro':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.8; }
        break;
      case 'idle':
        this.driftToward(player, room, 20, dt);
        if (this.t <= 0) this.pickAttack(player);
        break;
      case 'rulers':
        if (this.t <= 0) {
          const n = this.phase2 ? 7 : 5;
          const base = Math.atan2(player.y - this.y, player.x - this.x);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.28;
            this.game.spawnProjectile({
              x: this.x, y: this.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
              r: 3, t: 2.4, spr: SPR.ruler,
            });
          }
          Sfx.swing();
          this.state = 'idle'; this.t = this.phase2 ? 1.1 : 1.6;
        }
        break;
      case 'gazeWind':
        if (this.t <= 0) { this.state = 'gaze'; this.t = 1.4; Sfx.bell(); }
        break;
      case 'gaze':
        // EYES ON THE BOARD: moving is punished
        if (Math.abs(player.vxLast || 0) + Math.abs(player.vyLast || 0) > 1) {
          this.gazeT += dt;
          if (this.gazeT > 0.45) { this.gazeT = 0; player.hurt(1, this.x, this.y); }
        } else this.gazeT = 0;
        if (this.t <= 0) { this.state = 'idle'; this.t = 1.4; this.gazeT = 0; }
        break;
      case 'summon':
        if (this.t <= 0) {
          const n = this.phase2 ? 2 : 1;
          for (let i = 0; i < n; i++) {
            this.game.spawnEnemy(new ChalkWraith(this.game,
              this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 40));
          }
          this.state = 'idle'; this.t = 1.8;
        }
        break;
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    if (this.state === 'gazeWind' || this.state === 'gaze') {
      // warning: DO NOT MOVE
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '8px monospace';
      const on = this.state === 'gaze';
      ctx.fillStyle = on ? '#b03a48' : '#ffe08a';
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 90);
      ctx.fillText(on ? 'EYES ON THE BOARD' : '...', ox + this.x, oy + this.y - 34);
      ctx.restore();
      ctx.textAlign = 'left';
    }
    this.drawSpriteScaled(ctx, ox, oy, SPR.teacher, 1.5);
  }
  drawSpriteScaled(ctx, ox, oy, spr, sc) {
    const px = Math.round(ox + this.x - (spr.width * sc) / 2);
    const py = Math.round(oy + this.y - spr.height * sc + 8);
    if (this.flash > 0) {
      ctx.save(); ctx.filter = 'brightness(2.5)';
      ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
      ctx.restore();
    } else ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
  }
}

// --- Night 3: The Cook Who Stirs ---
// Attacks: porridge spray, boiling ring from the pot, ladle slam; summons globs in phase 2.
export class Cook extends Boss {
  constructor(game, x, y) { super(game, x, y, 75, 16, 16); }
  pickAttack(player) {
    const opts = ['spray', 'ring', 'slam'];
    const a = this.lastAttack === undefined ? 'spray'
      : opts.filter(o => o !== this.lastAttack)[Math.floor(Math.random() * 2)];
    this.lastAttack = a;
    if (a === 'spray') { this.state = 'spray'; this.t = 0.6; }
    else if (a === 'ring') { this.state = 'ring'; this.t = 0.7; }
    else { this.state = 'slamWind'; this.t = 0.55; }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    switch (this.state) {
      case 'intro':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.7; }
        break;
      case 'idle':
        this.driftToward(player, room, 26, dt);
        if (this.t <= 0) this.pickAttack(player);
        break;
      case 'spray': {
        if (this.t <= 0) {
          const base = Math.atan2(player.y - this.y, player.x - this.x);
          const n = this.phase2 ? 6 : 4;
          for (let i = 0; i < n; i++) {
            const a = base + (Math.random() - 0.5) * 0.9;
            const sp = 80 + Math.random() * 60;
            this.game.spawnProjectile({
              x: this.x, y: this.y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              r: 2, t: 2.2, spr: SPR.glob,
            });
          }
          Sfx.hit();
          this.state = 'idle'; this.t = this.phase2 ? 0.9 : 1.4;
        }
        break;
      }
      case 'ring':
        if (this.t <= 0) {
          const n = this.phase2 ? 12 : 8;
          for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n + (this.phase2 ? performance.now() / 900 : 0);
            this.game.spawnProjectile({
              x: this.x, y: this.y, vx: Math.cos(a) * 88, vy: Math.sin(a) * 88,
              r: 2, t: 2.6, spr: SPR.glob,
            });
          }
          Sfx.bossRoar();
          this.state = 'idle'; this.t = 1.6;
        }
        break;
      case 'slamWind':
        if (this.t <= 0) {
          const dx = player.x - this.x, dy = player.y - this.y;
          const l = Math.hypot(dx, dy) || 1;
          this.cvx = (dx / l) * 240; this.cvy = (dy / l) * 240;
          this.state = 'slam'; this.t = 0.55;
          Sfx.bossRoar();
        }
        break;
      case 'slam': {
        moveEntity(this, this.cvx * dt, this.cvy * dt, room);
        if (overlap(this, player)) player.hurt(1, this.x, this.y);
        if (this.t <= 0) {
          this.game.shake(6, 0.3);
          if (this.phase2) this.game.spawnEnemy(new PorridgeBlob(this.game, this.x + 14, this.y, true));
          this.state = 'idle'; this.t = 1.2;
        }
        break;
      }
    }
    if (this.state !== 'slam' && overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    const sc = 1.5;
    const spr = SPR.cook;
    const px = Math.round(ox + this.x - (spr.width * sc) / 2);
    const py = Math.round(oy + this.y - spr.height * sc + 8);
    if (this.flash > 0) {
      ctx.save(); ctx.filter = 'brightness(2.5)';
      ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
      ctx.restore();
    } else ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
    ctx.drawImage(SPR.pot, Math.round(ox + this.x - 9), Math.round(oy + this.y - 2), 18, 9);
  }
}

// --- Night 4: The Laundress ---
// Attacks: wringing waves of suds, spinning sheet ghosts, steam clouds that slow.
export class Laundress extends Boss {
  constructor(game, x, y) { super(game, x, y, 85, 16, 16); this.clouds = []; }
  pickAttack(player) {
    const opts = ['wring', 'sheets', 'steam'];
    const a = this.lastAttack === undefined ? 'wring'
      : opts.filter(o => o !== this.lastAttack)[Math.floor(Math.random() * 2)];
    this.lastAttack = a;
    if (a === 'wring') { this.state = 'wring'; this.t = 0.65; this.wave = 0; }
    else if (a === 'sheets') { this.state = 'sheets'; this.t = 0.7; }
    else { this.state = 'steam'; this.t = 0.5; }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    for (const c of this.clouds) {
      c.t -= dt;
      if (dist(c, player) < c.r) player.slowed = true;
    }
    this.clouds = this.clouds.filter(c => c.t > 0);
    switch (this.state) {
      case 'intro':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.8; }
        break;
      case 'idle':
        this.driftToward(player, room, 24, dt);
        if (this.t <= 0) this.pickAttack(player);
        break;
      case 'wring':
        if (this.t <= 0) {
          // horizontal sweep of suds toward the player's side of the room
          const dir = Math.sign(player.x - this.x) || 1;
          const n = this.phase2 ? 6 : 4;
          for (let i = 0; i < n; i++) {
            this.game.spawnProjectile({
              x: this.x + dir * 10, y: this.y - 16 + i * 8,
              vx: dir * 105, vy: 0, r: 2, t: 2.4, spr: SPR.suds,
            });
          }
          this.wave++;
          Sfx.hit();
          if (this.wave < (this.phase2 ? 3 : 2)) this.t = 0.45;
          else { this.state = 'idle'; this.t = 1.5; }
        }
        break;
      case 'sheets':
        if (this.t <= 0) {
          const n = this.phase2 ? 2 : 1;
          for (let i = 0; i < n; i++) {
            this.game.spawnEnemy(new SheetGhost(this.game,
              this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 30));
          }
          this.state = 'idle'; this.t = 1.9;
        }
        break;
      case 'steam':
        if (this.t <= 0) {
          const n = this.phase2 ? 3 : 2;
          for (let i = 0; i < n; i++) {
            this.clouds.push({
              x: player.x + (Math.random() - 0.5) * 80,
              y: player.y + (Math.random() - 0.5) * 50,
              r: 30, t: 4.5,
            });
          }
          Sfx.doorOpen();
          this.state = 'idle'; this.t = 1.6;
        }
        break;
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    for (const c of this.clouds) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, c.t * 0.2);
      ctx.fillStyle = '#b8c4d0';
      ctx.beginPath();
      ctx.arc(ox + c.x, oy + c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const sc = 1.5;
    const spr = SPR.laundress;
    const px = Math.round(ox + this.x - (spr.width * sc) / 2);
    const py = Math.round(oy + this.y - spr.height * sc + 8);
    if (this.flash > 0) {
      ctx.save(); ctx.filter = 'brightness(2.5)';
      ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
      ctx.restore();
    } else ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
  }
}

// --- Night 5: Mother Mercy ---
// Attacks: rule shards in rings, "recite the rules" gaze, summons hands, teleports.
// Phase 2: the mask cracks; everything faster.
export class Mercy extends Boss {
  constructor(game, x, y) { super(game, x, y, 110, 16, 18); this.gazeT = 0; }
  pickAttack(player) {
    const opts = ['shards', 'recite', 'hands', 'blink'];
    const a = this.lastAttack === undefined ? 'shards'
      : opts.filter(o => o !== this.lastAttack)[Math.floor(Math.random() * 3)];
    this.lastAttack = a;
    if (a === 'shards') { this.state = 'shards'; this.t = 0.6; this.burst = 0; }
    else if (a === 'recite') { this.state = 'reciteWind'; this.t = 0.8; }
    else if (a === 'hands') { this.state = 'hands'; this.t = 0.6; }
    else { this.state = 'blinkOut'; this.t = 0.45; }
  }
  update(dt, room, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.t -= dt;
    switch (this.state) {
      case 'intro':
        if (this.t <= 0) { this.state = 'idle'; this.t = 0.8; }
        break;
      case 'idle':
        this.driftToward(player, room, this.phase2 ? 34 : 24, dt);
        if (this.t <= 0) this.pickAttack(player);
        break;
      case 'shards':
        if (this.t <= 0) {
          const n = this.phase2 ? 10 : 7;
          const off = this.burst * 0.35;
          for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n + off;
            this.game.spawnProjectile({
              x: this.x, y: this.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95,
              r: 2, t: 2.6, spr: SPR.ruleShard,
            });
          }
          Sfx.swing();
          this.burst++;
          if (this.burst < (this.phase2 ? 3 : 2)) this.t = 0.5;
          else { this.state = 'idle'; this.t = this.phase2 ? 1.0 : 1.5; }
        }
        break;
      case 'reciteWind':
        if (this.t <= 0) { this.state = 'recite'; this.t = 1.5; Sfx.bell(); }
        break;
      case 'recite':
        // GOOD CHILDREN HOLD STILL — moving is punished, like the Teacher's gaze
        if (Math.abs(player.vxLast || 0) + Math.abs(player.vyLast || 0) > 1) {
          this.gazeT += dt;
          if (this.gazeT > 0.4) { this.gazeT = 0; player.hurt(1, this.x, this.y); }
        } else this.gazeT = 0;
        if (this.t <= 0) { this.state = 'idle'; this.t = 1.2; this.gazeT = 0; }
        break;
      case 'hands':
        if (this.t <= 0) {
          const n = this.phase2 ? 4 : 3;
          for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n;
            this.game.spawnEnemy(new HandMinion(this.game,
              this.x + Math.cos(a) * 26, this.y + Math.sin(a) * 26));
          }
          this.state = 'idle'; this.t = 1.6;
        }
        break;
      case 'blinkOut':
        if (this.t <= 0) {
          this.game.puff(this.x, this.y, '#b03a48');
          // reappear behind the player
          const a = Math.atan2(this.y - player.y, this.x - player.x) + Math.PI;
          this.x = Math.max(TS * 2, Math.min((COLS - 2) * TS, player.x + Math.cos(a) * 46));
          this.y = Math.max(TS * 2, Math.min((ROWS - 2) * TS, player.y + Math.sin(a) * 46));
          this.game.puff(this.x, this.y, '#b03a48');
          Sfx.dodge();
          this.state = this.phase2 ? 'shards' : 'idle';
          this.t = this.phase2 ? 0.35 : 0.7;
          this.burst = 0;
        }
        break;
    }
    if (overlap(this, player)) player.hurt(1, this.x, this.y);
  }
  draw(ctx, ox, oy) {
    if (this.state === 'reciteWind' || this.state === 'recite') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '8px monospace';
      const on = this.state === 'recite';
      ctx.fillStyle = on ? '#b03a48' : '#ffe08a';
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 90);
      ctx.fillText(on ? 'GOOD CHILDREN HOLD STILL' : '...', ox + this.x, oy + this.y - 38);
      ctx.restore();
      ctx.textAlign = 'left';
    }
    const sc = 1.6;
    const spr = SPR.mercy;
    const px = Math.round(ox + this.x - (spr.width * sc) / 2);
    const py = Math.round(oy + this.y - spr.height * sc + 10);
    if (this.flash > 0) {
      ctx.save(); ctx.filter = 'brightness(2.5)';
      ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
      ctx.restore();
    } else ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
    // phase 2: the porcelain face cracks
    if (this.phase2) {
      ctx.strokeStyle = '#14101c';
      ctx.beginPath();
      ctx.moveTo(px + 12 * sc, py + 4 * sc);
      ctx.lineTo(px + 9 * sc, py + 6 * sc);
      ctx.lineTo(px + 11 * sc, py + 7 * sc);
      ctx.stroke();
    }
  }
}
