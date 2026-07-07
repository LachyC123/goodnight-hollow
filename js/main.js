// Goodnight, Hollow — First Night Demo
// Vanilla JS + Canvas. No engine, no build step, no image assets.
import { SPR } from './sprites.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { Dialogue } from './dialogue.js';
import { Player } from './player.js';
import { buildRoom, spawnEnemies, drawRoom } from './rooms.js';
import { W, H, TS, COLS, ROWS, OX, OY, overlap, dist } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const SAVE_KEY = 'goodnightHollowSave';

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
  catch (e) { return {}; }
}
function writeSave(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
}

class Game {
  constructor() {
    this.state = 'title';
    this.save = Object.assign({
      nights: 0, hasRibbon: false, sawMemory: false,
      dollKillsTotal: 0, wonOnce: false, metElsie: false,
    }, loadSave());
    this.dialogue = new Dialogue();
    this.particles = [];
    this.pickups = [];
    this.enemies = [];
    this.shakeMag = 0; this.shakeT = 0;
    this.fade = 0; this.fadeDir = 0; this.fadeCb = null;
    this.titleFlicker = 0;
    this.setupDorm();
  }

  persist() { writeSave(this.save); }

  // ---------- setup ----------
  setupDorm() {
    this.room = buildRoom('dorm');
    this.player = new Player(this);
    if (this.save.hasRibbon) { this.player.maxStitches = 7; this.player.stitches = 7; }
    this.player.x = 5 * TS; this.player.y = 8 * TS;
    this.elsie = { x: 4.2 * TS, y: 3.4 * TS, w: 10, h: 12 };
    this.enemies = [];
    this.pickups = [];
    this.room.doorsOpen = this.save.metElsie;
    this.bellRung = this.save.metElsie;
    this.newRule = this.save.wonOnce;
  }

  startRun() {
    this.runRooms = [
      buildRoom('combat', 0), buildRoom('combat', 1),
      buildRoom('memory'), buildRoom('combat', 2),
      buildRoom('combat', 3), buildRoom('boss'),
    ];
    this.roomIndex = 0;
    this.dollKillsRun = 0;
    this.dollsSeen = 0;
    this.pretendOffered = false;
    this.pretend = null;
    this.state = 'run';
    this.enterRoom(0);
  }

  enterRoom(i) {
    this.roomIndex = i;
    this.room = this.runRooms[i];
    this.player.x = 1.6 * TS;
    this.player.y = 7 * TS;
    this.enemies = [];
    this.pickups = [];
    if (this.room.type === 'combat' || this.room.type === 'boss') {
      this.room.doorsOpen = false;
      this.enemies = spawnEnemies(this.room, this);
      this.dollsSeen += this.enemies.filter(e => e.isDoll).length;
      Sfx.doorLock();
      if (this.room.type === 'boss') {
        this.dialogue.say([
          { who: 'The Nanny With No Face', text: 'Hush now. Little dolls should be SLEEPING.' },
        ]);
        Sfx.bossRoar();
      }
    } else {
      this.room.doorsOpen = false; // memory room opens after the memory is seen
    }
  }

  // ---------- events ----------
  spawnEnemy(e) { this.enemies.push(e); }

  onDollKilled(doll) {
    this.dollKillsRun++;
    this.save.dollKillsTotal++;
    this.persist();
    // the house rewards cruelty
    this.pickups.push({ kind: 'flame', x: doll.x, y: doll.y });
    this.pickups.push({ kind: 'stitch', x: doll.x + 10, y: doll.y });
  }

  onDollExploded(doll) { /* not a kill — Elsie doesn't blame you */ }

  onRoomCleared() {
    this.room.cleared = true;
    this.room.doorsOpen = true;
    Sfx.doorOpen();
    const cx = 14 * TS, cy = 7 * TS;
    this.pickups.push({ kind: 'flame', x: cx - 8, y: cy });
    this.pickups.push({ kind: 'stitch', x: cx + 8, y: cy });
    this.player.gainFlame(20);
    if (!this.pretendOffered && this.room.type === 'combat') {
      this.pretendOffered = true;
      this.pretendSel = 0;
      this.state = 'pretendChoice';
      Sfx.upgrade();
    }
  }

  onBossDefeated() {
    this.enemies = this.enemies.filter(e => !e.dead);
    this.room.doorsOpen = false;
    this.pickups.push({ kind: 'ribbon', x: 14 * TS, y: 7 * TS });
    this.dialogue.say([
      { who: '', text: 'Something falls from the pram. A ribbon, half-burned. It smells like smoke and old lullabies.' },
    ]);
  }

  onPlayerDeath() {
    this.deathT = 1.2;
    this.state = 'dying';
    Sfx.explode();
  }

  flameBurst(x, y) {
    Sfx.explode();
    this.shake(5, 0.3);
    for (let i = 0; i < 24; i++) this.puff(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, '#ffb347');
    for (const e of this.enemies) {
      if (!e.dead && dist(e, { x, y }) < 60) e.hit(3, { x, y });
    }
  }

  // ---------- fx ----------
  shake(mag, t) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, t); }
  puff(x, y, color) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 - 15,
        t: 0.4 + Math.random() * 0.3, color,
      });
    }
  }
  startFade(cb) { this.fadeDir = 1; this.fadeCb = cb; }

  // ---------- update ----------
  update(dt) {
    // fade transitions
    if (this.fadeDir !== 0) {
      this.fade += this.fadeDir * dt * 2.5;
      if (this.fade >= 1 && this.fadeDir > 0) {
        this.fade = 1; this.fadeDir = -1;
        if (this.fadeCb) { const cb = this.fadeCb; this.fadeCb = null; cb(); }
      } else if (this.fade <= 0 && this.fadeDir < 0) {
        this.fade = 0; this.fadeDir = 0;
      }
    }
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.shakeT <= 0) this.shakeMag = 0;
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
    }
    this.particles = this.particles.filter(p => p.t > 0);

    switch (this.state) {
      case 'title': this.updateTitle(dt); break;
      case 'dorm': this.updateDorm(dt); break;
      case 'run': this.updateRun(dt); break;
      case 'pretendChoice': this.updatePretendChoice(dt); break;
      case 'memoryScene': this.updateMemoryScene(dt); break;
      case 'dying':
        this.deathT -= dt;
        if (this.deathT <= 0) this.state = 'death';
        break;
      case 'death': this.updateDeath(dt); break;
      case 'end': this.updateEnd(dt); break;
    }
    Input.endFrame();
  }

  updateTitle(dt) {
    this.titleFlicker += dt;
    if (Input.confirm()) {
      Sfx.unlock(); Sfx.bell();
      this.startFade(() => {
        this.setupDorm();
        this.state = 'dorm';
        if (!this.save.metElsie) {
          setTimeout(() => this.introSequence(), 400);
        }
      });
    }
  }

  introSequence() {
    this.dialogue.say([
      { who: '', text: 'The House of Good Children. 3:33 AM.' },
      { who: 'Elsie', text: 'You came back wrong this time.' },
      { who: 'Elsie', text: 'Your ear... and your eye. Did the house take them? It takes things, you know. When it likes you.' },
      { who: '', text: 'Somewhere below, a bell rings once. The Dormitory door unlocks by itself.' },
      { who: 'Elsie', text: 'It wants you to go downstairs.' },
      { who: 'Elsie', text: 'Mallow... if you see the crying dolls — please don\'t hurt them. I think they\'re children too. They just forgot how to look like it.' },
      { who: 'Elsie', text: 'Come back. Promise you\'ll come back.' },
    ], () => {
      this.save.metElsie = true;
      this.persist();
      this.room.doorsOpen = true;
      this.bellRung = true;
      Sfx.bell();
      Sfx.doorOpen();
    });
  }

  updateDorm(dt) {
    if (this.dialogue.active) { this.dialogue.update(dt); return; }
    this.player.update(dt, this.room);
    // talk to Elsie
    if (dist(this.player, this.elsie) < 22 && Input.interact()) {
      this.dialogue.say(this.elsieDormLines());
    }
    // exit east door -> start run
    if (this.room.doorsOpen && this.player.x > (COLS - 1.6) * TS && this.player.y > 5.4 * TS && this.player.y < 8.6 * TS) {
      this.startFade(() => this.startRun());
      this.room.doorsOpen = false; // avoid double trigger
    }
  }

  elsieDormLines() {
    if (this.save.wonOnce) {
      return [
        { who: 'Elsie', text: 'The wall changed in the night. I didn\'t see who wrote it.' },
        { who: 'Elsie', text: 'GOOD CHILDREN DO NOT REMEMBER. But I want to remember. Is that bad?' },
        { who: 'Elsie', text: 'Thank you for the ribbon. Even if it isn\'t mine. Even if it is.' },
      ];
    }
    if (this.save.nights > 0) {
      const lines = [];
      if (this.save.dollKillsTotal > 0) {
        lines.push({ who: 'Elsie', text: '...The dolls stopped crying last night. I could hear it from here.' });
        lines.push({ who: 'Elsie', text: 'You promised. Didn\'t you? Maybe I dreamed that part.' });
      } else {
        lines.push({ who: 'Elsie', text: 'You didn\'t hurt them. The crying ones. I can always tell.' });
        lines.push({ who: 'Elsie', text: 'Thank you, Mallow.' });
      }
      lines.push({ who: 'Elsie', text: 'The door is open again. It\'s always open now. Be careful of the Nanny. She pushes that pram like there\'s still someone in it.' });
      return lines;
    }
    return [
      { who: 'Elsie', text: 'Good children do not cry. Good children do not ask why. I know all the rules. Knowing them doesn\'t help.' },
      { who: 'Elsie', text: 'The door downstairs is open. Please remember your promise about the dolls.' },
    ];
  }

  updateRun(dt) {
    if (this.dialogue.active) { this.dialogue.update(dt); return; }
    this.player.update(dt, this.room);
    if (this.player.dead) return;

    // enemies
    for (const e of this.enemies) if (!e.dead) e.update(dt, this.room, this.player);
    // player attacks
    if (this.player.attacking) {
      const box = this.player.attackBox();
      for (const e of this.enemies) {
        if (!e.dead && !this.player.hitThisSwing.has(e) && overlap(box, e)) {
          this.player.hitThisSwing.add(e);
          e.hit(this.player.damage(), this.player);
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // combat room clear
    if ((this.room.type === 'combat') && !this.room.cleared && this.enemies.length === 0) {
      this.onRoomCleared();
    }

    // memory spot
    if (this.room.type === 'memory' && !this.room.memorySpot.seen &&
        dist(this.player, this.room.memorySpot) < this.room.memorySpot.r) {
      this.room.memorySpot.seen = true;
      this.memoryPage = 0;
      this.state = 'memoryScene';
      Sfx.bell();
    }

    // pickups
    for (const p of this.pickups) {
      if (overlap(this.player, { x: p.x, y: p.y, w: 10, h: 10 })) {
        p.taken = true;
        Sfx.pickup();
        if (p.kind === 'flame') this.player.gainFlame(25);
        else if (p.kind === 'stitch') this.player.heal(1);
        else if (p.kind === 'ribbon') {
          this.save.hasRibbon = true;
          this.persist();
          this.startFade(() => this.victorySequence());
        }
      }
    }
    this.pickups = this.pickups.filter(p => !p.taken);

    // exit east door -> next room
    if (this.room.doorsOpen && this.player.x > (COLS - 1.6) * TS && this.player.y > 5.4 * TS && this.player.y < 8.6 * TS) {
      const next = this.roomIndex + 1;
      this.room.doorsOpen = false;
      this.startFade(() => this.enterRoom(next));
    }
  }

  updatePretendChoice(dt) {
    if (Input.wasPressed('KeyA','ArrowLeft','KeyD','ArrowRight')) {
      this.pretendSel = 1 - this.pretendSel;
      Sfx.talk();
    }
    if (Input.confirm()) {
      this.pretend = this.pretendSel === 0 ? 'brave' : 'dark';
      if (this.pretend === 'brave') this.player.pretendBrave = true;
      else { this.player.maxStitches += 2; this.player.heal(2); }
      Sfx.upgrade();
      this.state = 'run';
    }
  }

  memoryPages() {
    return [
      'The candles remember for you.',
      'A small room. A smaller chair. A child sits facing the corner, shoulders shaking without a sound.',
      'MOTHER MERCY: "Good children do not cry. Crying is asking. And what do we say about asking?"',
      'The child\'s voice, very quiet: "Good children do not ask why."',
      'MOTHER MERCY: "There. All better. Sit until you are dry."',
      'The child holds something under their shirt. Something soft. Something with one button eye.',
      'The memory goes dark, like a snuffed candle.',
    ];
  }

  updateMemoryScene(dt) {
    if (Input.confirm()) {
      this.memoryPage++;
      Sfx.talk();
      if (this.memoryPage >= this.memoryPages().length) {
        this.save.sawMemory = true;
        this.persist();
        this.state = 'run';
        this.room.doorsOpen = true;
        Sfx.doorOpen();
      }
    }
  }

  updateDeath(dt) {
    if (Input.confirm()) {
      this.save.nights++;
      this.persist();
      this.startFade(() => {
        this.setupDorm();
        this.state = 'dorm';
        const line = this.dollKillsRun > 0
          ? { who: 'Elsie', text: '...You\'re back. The house let you back. It always does, when it isn\'t finished with you.' }
          : { who: 'Elsie', text: 'You did your best. That counts, doesn\'t it?' };
        this.dialogue.say([
          { who: '', text: 'Mallow wakes on the Dormitory floor, restitched by small careful hands.' },
          line,
        ]);
      });
    }
  }

  victorySequence() {
    this.save.nights++;
    this.save.wonOnce = true;
    this.persist();
    this.setupDorm();
    this.state = 'dorm';
    this.newRule = true;
    const lines = [
      { who: '', text: 'Morning does not come. But the house grows quiet, and Mallow carries the burned ribbon back upstairs.' },
      { who: 'Elsie', text: '...That isn\'t mine.' },
      { who: 'Elsie', text: 'I think I used to say that when I wanted something too much.' },
    ];
    if (this.dollKillsRun > 0) {
      lines.push({ who: 'Elsie', text: 'The dolls stopped crying tonight. I don\'t want to talk about it.' });
    } else if (this.dollsSeen > 0) {
      lines.push({ who: 'Elsie', text: 'You kept your promise. The crying ones... I heard them go quiet the kind way.' });
    }
    if (this.save.sawMemory) {
      lines.push({ who: 'Elsie', text: 'You saw one of the little rooms, didn\'t you. You have that look. Like a candle that\'s seen a draught.' });
    }
    lines.push({ who: '', text: 'Behind Elsie, fresh paint glistens on the Dormitory wall.' });
    lines.push({ who: '', text: 'RULE 6: GOOD CHILDREN DO NOT REMEMBER.' });
    this.dialogue.say(lines, () => { this.state = 'end'; });
  }

  updateEnd(dt) {
    if (Input.confirm()) {
      this.startFade(() => {
        this.setupDorm();
        this.state = 'dorm';
      });
    }
  }

  // ---------- draw ----------
  draw() {
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(0, 0, W, H);

    if (this.state === 'title') { this.drawTitle(); this.drawFade(); return; }
    if (this.state === 'end') { this.drawEnd(); this.drawFade(); return; }

    let ox = OX, oy = OY;
    if (this.shakeMag > 0) {
      ox += (Math.random() - 0.5) * this.shakeMag;
      oy += (Math.random() - 0.5) * this.shakeMag;
    }

    drawRoom(ctx, this.room, ox, oy);

    // memory spot glow
    if (this.room.type === 'memory' && !this.room.memorySpot.seen) {
      const s = this.room.memorySpot;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 300);
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.arc(ox + s.x, oy + s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // pickups
    for (const p of this.pickups) {
      const spr = p.kind === 'flame' ? SPR.flamePickup : p.kind === 'stitch' ? SPR.stitchPickup : SPR.ribbon;
      const bob = Math.sin(performance.now() / 250 + p.x) * 1.5;
      ctx.drawImage(spr, Math.round(ox + p.x - spr.width / 2), Math.round(oy + p.y - spr.height / 2 + bob));
    }

    // entities sorted by y
    const ents = [...this.enemies];
    if (!this.player.dead || this.state === 'dying') ents.push(this.player);
    if (this.state === 'dorm') ents.push({ y: this.elsie.y, drawElsie: true });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.drawElsie) {
        ctx.drawImage(SPR.elsie, Math.round(ox + this.elsie.x - 5), Math.round(oy + this.elsie.y - 10));
      } else e.draw(ctx, ox, oy);
    }

    // particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.t * 2.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(ox + p.x), Math.round(oy + p.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    // candlelight vignette
    this.drawLight(ox, oy);

    // dorm extras
    if (this.state === 'dorm' || (this.state !== 'run' && this.room.type === 'dorm')) this.drawDormOverlay(ox, oy);

    this.drawHud();

    if (this.state === 'pretendChoice') this.drawPretendChoice();
    if (this.state === 'memoryScene') this.drawMemoryScene();
    if (this.state === 'death') this.drawDeath();
    this.dialogue.draw(ctx, W, H);
    this.drawFade();
  }

  drawLight(ox, oy) {
    const px = ox + this.player.x, py = oy + this.player.y;
    const flick = 1 + Math.sin(performance.now() / 90) * 0.03;
    // warm candle glow around Mallow (reference: chest flame lights the room)
    const warm = ctx.createRadialGradient(px, py, 4, px, py, 70 * flick);
    warm.addColorStop(0, 'rgba(255,179,71,0.14)');
    warm.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(px, py, 34 * flick, px, py, 215 * flick);
    g.addColorStop(0, 'rgba(10,8,16,0)');
    g.addColorStop(0.7, 'rgba(10,8,16,0.35)');
    g.addColorStop(1, 'rgba(10,8,16,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawDormOverlay(ox, oy) {
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(232,224,216,0.5)';
    ctx.fillText('GOOD CHILDREN DO NOT CRY', ox + 210, oy + 10);
    if (this.newRule) {
      const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 400);
      ctx.fillStyle = `rgba(176,58,72,${pulse})`;
      ctx.fillText('GOOD CHILDREN DO NOT REMEMBER', ox + 200, oy + 22);
    }
    // Elsie prompt
    if (!this.dialogue.active && dist(this.player, this.elsie) < 22) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('[E] talk', ox + this.elsie.x - 12, oy + this.elsie.y - 16);
    }
    if (this.room.doorsOpen && !this.dialogue.active) {
      ctx.fillStyle = 'rgba(255,224,138,0.7)';
      ctx.fillText('the door is open', ox + (COLS - 8) * TS, oy + 5.6 * TS);
    }
    if (!this.bellRung) {
      ctx.fillStyle = 'rgba(232,224,216,0.4)';
      ctx.fillText('3:32 AM', OX + 4, OY - 6);
    }
  }

  drawHud() {
    // stitches as pixel hearts (reference style)
    for (let i = 0; i < this.player.maxStitches; i++) {
      const spr = i < this.player.stitches ? SPR.heartFull : SPR.heartEmpty;
      ctx.drawImage(spr, 16 + i * 10, 10, 8, 7);
    }
    ctx.font = '7px monospace';
    ctx.fillStyle = '#b8b0a8';
    ctx.fillText('STITCHES', 16, 8);
    // candleflame: candle icon + orange gradient bar (reference style)
    ctx.drawImage(SPR.candle, 130, 9, 7, 7);
    ctx.fillText('CANDLEFLAME', 141, 8);
    ctx.fillStyle = '#14101c';
    ctx.fillRect(141, 11, 62, 7);
    ctx.strokeStyle = '#55506a';
    ctx.strokeRect(140.5, 10.5, 63, 8);
    const fw = Math.round(60 * this.player.flame / 100);
    if (fw > 0) {
      const grad = ctx.createLinearGradient(142, 0, 142 + 60, 0);
      grad.addColorStop(0, '#b03a48');
      grad.addColorStop(0.5, '#ff6b35');
      grad.addColorStop(1, '#ffb347');
      ctx.fillStyle = grad;
      ctx.fillRect(142, 12, fw, 5);
    }
    if (this.player.flame >= 50) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('[L] burst', 208, 17);
    }
    // pretend
    if (this.pretend && this.state === 'run') {
      ctx.fillStyle = '#9fd8c0';
      ctx.fillText(this.pretend === 'brave' ? 'PRETEND YOU ARE BRAVE' : 'PRETEND YOU ARE LOVED', 260, 18);
    }
    // room / place label
    ctx.fillStyle = '#b8b0a8';
    if (this.room.type !== 'dorm') {
      const label = this.room.type === 'boss' ? 'NURSERY ROT — ???'
        : this.room.type === 'memory' ? 'NURSERY ROT — a quiet room'
        : `NURSERY ROT — room ${this.roomIndex + 1}`;
      ctx.fillText(label, W - 8 - ctx.measureText(label).width, 9);
    } else {
      ctx.fillText('THE DORMITORY', W - 8 - ctx.measureText('THE DORMITORY').width, 9);
    }
    // boss bar
    const boss = this.enemies.find(e => e.isBoss);
    if (boss) {
      ctx.fillStyle = '#14101c';
      ctx.fillRect(90, H - 14, 300, 8);
      ctx.fillStyle = '#b03a48';
      ctx.fillRect(91, H - 13, Math.round(298 * boss.hp / boss.maxHp), 6);
      ctx.fillStyle = '#e8e0d8';
      ctx.font = '7px monospace';
      ctx.fillText('THE NANNY WITH NO FACE', 180, H - 16);
    }
  }

  drawTitle() {
    const t = this.titleFlicker;
    ctx.textAlign = 'center';
    // candle
    ctx.drawImage(SPR.mallow, 0, 0, 12, 14, W / 2 - 24, 70, 48, 56);
    const flick = 0.85 + Math.sin(t * 7) * 0.1 + Math.sin(t * 23) * 0.05;
    ctx.globalAlpha = flick;
    ctx.fillStyle = '#e8e0d8';
    ctx.font = '24px monospace';
    ctx.fillText('GOODNIGHT, HOLLOW', W / 2, 160);
    ctx.globalAlpha = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = '#7a6a92';
    ctx.fillText('— FIRST NIGHT —', W / 2, 178);
    if (Math.floor(t * 1.4) % 2 === 0) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('press [ENTER] to wake', W / 2, 216);
    }
    ctx.fillStyle = '#55506a';
    ctx.font = '7px monospace';
    ctx.fillText('WASD move · J/SPACE attack · K/SHIFT dodge · E talk · L candle burst', W / 2, 250);
    ctx.fillText('3:33 AM. The house is awake.', W / 2, 262);
    ctx.textAlign = 'left';
  }

  drawPretendChoice() {
    ctx.fillStyle = 'rgba(10,8,16,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.font = '10px monospace';
    ctx.fillText('The children believe in you. Pick a Pretend.', W / 2, 70);
    const opts = [
      { name: 'PRETEND YOU ARE BRAVE', desc: 'Double damage while below half stitches.' },
      { name: 'PRETEND YOU ARE LOVED', desc: 'Two extra stitches, sewn with borrowed thread.' },
    ];
    for (let i = 0; i < 2; i++) {
      const x = W / 2 + (i === 0 ? -110 : 110);
      const sel = this.pretendSel === i;
      ctx.fillStyle = sel ? '#322d44' : '#1c1626';
      ctx.fillRect(x - 95, 95, 190, 70);
      ctx.strokeStyle = sel ? '#ffe08a' : '#55506a';
      ctx.strokeRect(x - 94.5, 95.5, 189, 69);
      ctx.fillStyle = sel ? '#e8e0d8' : '#b8b0a8';
      ctx.font = '8px monospace';
      ctx.fillText(opts[i].name, x, 118);
      ctx.fillStyle = '#7a6a92';
      ctx.font = '7px monospace';
      const words = opts[i].desc.split(' ');
      let line = '', y = 134;
      for (const w of words) {
        const tl = line ? line + ' ' + w : w;
        if (ctx.measureText(tl).width > 170) { ctx.fillText(line, x, y); y += 9; line = w; }
        else line = tl;
      }
      ctx.fillText(line, x, y);
    }
    ctx.fillStyle = '#55506a';
    ctx.fillText('[A]/[D] choose · [ENTER] believe', W / 2, 195);
    ctx.textAlign = 'left';
  }

  drawMemoryScene() {
    ctx.fillStyle = 'rgba(5,3,8,0.96)';
    ctx.fillRect(0, 0, W, H);
    const pages = this.memoryPages();
    const text = pages[Math.min(this.memoryPage, pages.length - 1)];
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.font = '8px monospace';
    ctx.fillText('— A MEMORY, OR SOMETHING SHAPED LIKE ONE —', W / 2, 60);
    ctx.fillStyle = '#e8e0d8';
    ctx.font = '9px monospace';
    const words = text.split(' ');
    let line = '', y = 115;
    for (const w of words) {
      const tl = line ? line + ' ' + w : w;
      if (ctx.measureText(tl).width > 380) { ctx.fillText(line, W / 2, y); y += 13; line = w; }
      else line = tl;
    }
    ctx.fillText(line, W / 2, y);
    ctx.fillStyle = '#55506a';
    ctx.font = '7px monospace';
    ctx.fillText('[ENTER]', W / 2, 220);
    ctx.textAlign = 'left';
  }

  drawDeath() {
    ctx.fillStyle = 'rgba(5,3,8,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b03a48';
    ctx.font = '16px monospace';
    ctx.fillText('THE CANDLE GOES OUT', W / 2, 110);
    ctx.fillStyle = '#b8b0a8';
    ctx.font = '8px monospace';
    ctx.fillText('The house folds Mallow away like a finished bedtime story.', W / 2, 135);
    ctx.fillStyle = '#ffe08a';
    ctx.fillText('press [ENTER] to wake in the Dormitory', W / 2, 175);
    ctx.textAlign = 'left';
  }

  drawEnd() {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e0d8';
    ctx.font = '14px monospace';
    ctx.fillText('END OF THE FIRST NIGHT', W / 2, 90);
    const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(176,58,72,${pulse})`;
    ctx.font = '11px monospace';
    ctx.fillText('RULE 6: GOOD CHILDREN DO NOT REMEMBER', W / 2, 135);
    ctx.fillStyle = '#7a6a92';
    ctx.font = '8px monospace';
    ctx.fillText('Mallow keeps the burned ribbon. (+1 stitch, every night after.)', W / 2, 165);
    ctx.fillStyle = '#55506a';
    ctx.fillText('The house has four more floors. But that is another night.', W / 2, 182);
    ctx.fillStyle = '#ffe08a';
    if (Math.floor(performance.now() / 700) % 2) ctx.fillText('press [ENTER] to stay a while longer', W / 2, 220);
    ctx.textAlign = 'left';
  }

  drawFade() {
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(5,3,8,${this.fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

const game = new Game();
window.__game = game; // debug/testing hook
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
