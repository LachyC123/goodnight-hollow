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
    this.game.player.gainFlame(6);
    if (this.hp <= 0) this.die();
  }
  die() {
    this.dead = true;
    Sfx.enemyDie();
    this.game.puff(this.x, this.y, '#55506a');
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
