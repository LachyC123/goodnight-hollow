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
    this.pretendBrave = false;   // +dmg below half health
    this.pretendDark = false;    // dark is scared: enemies near take chip damage
    this.darkTick = 0;
    this.hitThisSwing = new Set();
  }

  get attacking() { return this.attackT > 0; }

  attackBox() {
    const r = 15;
    return {
      x: this.x + this.facing.x * r,
      y: this.y + this.facing.y * r,
      w: this.facing.x !== 0 ? 18 : 24,
      h: this.facing.y !== 0 ? 18 : 24,
    };
  }

  damage() {
    let d = 1;
    if (this.pretendBrave && this.stitches <= this.maxStitches / 2) d = 2;
    return d;
  }

  hurt(amount, fromX, fromY) {
    if (this.iframes > 0 || this.dead || this.dodgeT > 0) return;
    this.stitches -= amount;
    this.iframes = 1.0;
    Sfx.hurt();
    this.game.shake(4, 0.25);
    const dx = this.x - fromX, dy = this.y - fromY;
    const l = Math.hypot(dx, dy) || 1;
    this.kbx = (dx / l) * 160; this.kby = (dy / l) * 160;
    this.kbT = 0.15;
    if (this.stitches <= 0) {
      this.stitches = 0;
      this.dead = true;
      this.game.onPlayerDeath();
    }
  }

  gainFlame(n) { this.flame = Math.min(100, this.flame + n); }
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

    let speed = 85;
    if (this.slowed) speed *= 0.5;
    this.slowed = false;

    if (this.kbT > 0) {
      this.kbT -= dt;
      moveEntity(this, this.kbx * dt, this.kby * dt, room);
    } else if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      moveEntity(this, this.dvx * dt, this.dvy * dt, room);
    } else {
      if (mx || my) {
        const l = Math.hypot(mx, my);
        moveEntity(this, (mx / l) * speed * dt, (my / l) * speed * dt, room);
      }
      if (Input.dodge() && this.dodgeCd <= 0) {
        const l = Math.hypot(mx, my);
        const dx = l ? mx / l : this.facing.x, dy = l ? my / l : this.facing.y;
        this.dodgeT = 0.18;
        this.dodgeCd = 0.6;
        this.dvx = dx * 250; this.dvy = dy * 250;
        Sfx.dodge();
      }
      if (Input.attack() && this.attackCd <= 0) {
        this.attackT = 0.12;
        this.attackCd = 0.32;
        this.hitThisSwing = new Set();
        Sfx.swing();
      }
      // Candleflame burst (special)
      if (Input.wasPressed('KeyL','KeyC') && this.flame >= 50) {
        this.flame -= 50;
        this.game.flameBurst(this.x, this.y);
      }
    }
  }

  draw(ctx, ox, oy) {
    const flick = this.iframes > 0 && Math.floor(performance.now() / 60) % 2 === 0;
    if (flick) return;
    const spr = this.stitches <= 2 ? SPR.mallowHurt : SPR.mallow;
    const px = Math.round(ox + this.x - spr.width / 2);
    const py = Math.round(oy + this.y - spr.height + 4);
    ctx.drawImage(spr, px, py);
    // low health: leaking stuffing
    if (this.stitches <= 2 && Math.random() < 0.05) {
      this.game.puff(this.x, this.y, '#e8e0d8');
    }
    // needle swing
    if (this.attackT > 0) {
      const b = this.attackBox();
      ctx.save();
      ctx.translate(ox + b.x, oy + b.y);
      const ang = Math.atan2(this.facing.y, this.facing.x);
      ctx.rotate(ang);
      ctx.drawImage(SPR.needle, -6, -3);
      ctx.restore();
    }
  }
}
