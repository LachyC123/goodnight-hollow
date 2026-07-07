// Goodnight, Hollow — the five nights of the House of Good Children.
// Vanilla JS + Canvas. No engine, no build step, no image assets.
import { SPR } from './sprites.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { Dialogue } from './dialogue.js';
import { Player } from './player.js';
import { buildRoom, spawnEnemies, drawRoom } from './rooms.js';
import { W, H, TS, COLS, ROWS, OX, OY, overlap, dist, solidAt } from './world.js';
import { NIGHTS, LAST_NIGHT, PRETENDS, KEEPSAKE_ORDER } from './nights.js';
import { loadSave, writeSave } from './save.js';
import { RunState } from './run.js';
import { computeMods, PRETEND_EFFECTS, CRADLE_UPGRADES } from './upgrades.js';
import { attachDebug } from './debug.js';
import { StoryManager } from './story.js';
import { DialogueManager, ELSIE_FIRST_WAKE, nannyIntroLines, NANNY_DEFEAT_LINES } from './storyDialogue.js';
import { HUB_OBJECTS, hubObjectPos } from './hub.js';
import { awakeChildren, childPos } from './children.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

class Game {
  constructor() {
    this.state = 'title';
    this.save = loadSave(); // migration/versioning lives in save.js
    this.story = new StoryManager(this.save, () => this.persist());
    this.storyDialogue = new DialogueManager(this.story);
    this.childDialogues = {}; // per-child DialogueManagers, built lazily
    this.run = null;        // RunState while a night is being attempted
    this.dialogue = new Dialogue();
    this.particles = [];
    this.pickups = [];
    this.enemies = [];
    this.projectiles = [];
    this.shakeMag = 0; this.shakeT = 0;
    this.fade = 0; this.fadeDir = 0; this.fadeCb = null;
    this.titleFlicker = 0;
    this.setupDorm();
  }

  persist() { writeSave(this.save); }

  // combined keepsake + pretend modifiers; recomputed whenever either changes
  refreshMods() {
    this.mods = computeMods(this.save.keepsakes, this.run ? this.run.pretends : [], this.save.cradle);
    if (this.player) {
      this.player.maxStitches = this.player.baseMaxStitches + this.mods.bonusMaxStitches;
      this.player.stitches = Math.min(this.player.stitches, this.player.maxStitches);
    }
  }

  // the night about to be (or being) attempted
  get currentNight() { return this.run ? this.run.night : Math.min(this.save.nightsCleared + 1, LAST_NIGHT); }
  get nightData() { return NIGHTS[this.currentNight]; }

  // ---------- setup ----------
  setupDorm() {
    this.room = buildRoom('dorm');
    this.player = new Player(this);
    this.run = null;
    this.refreshMods();
    this.player.stitches = this.player.maxStitches;
    this.player.x = 5 * TS; this.player.y = 8 * TS;
    this.elsie = { x: 4.2 * TS, y: 3.4 * TS, w: 10, h: 12 };
    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    this.room.doorsOpen = this.save.metElsie; // the house is never truly done with you
    this.bellRung = this.save.metElsie;
  }

  startRun() {
    this.run = new RunState(Math.min(this.save.nightsCleared + 1, LAST_NIGHT));
    this.story.beginRun(this.nightData.floor);
    this.refreshMods();
    this.player.locketUsed = false;
    this.state = 'run';
    this.enterRoom(0);
  }

  enterRoom(i) {
    this.run.roomIndex = i;
    this.room = this.run.rooms[i];
    this.player.x = 1.6 * TS;
    this.player.y = 7 * TS;
    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    if (this.room.type === 'combat' || this.room.type === 'boss') {
      this.room.doorsOpen = false;
      this.enemies = spawnEnemies(this.room, this);
      const dolls = this.enemies.filter(e => e.isDoll).length;
      this.run.dollsSeen += dolls;
      this.story.onDollSeen(dolls);
      Sfx.doorLock();
      if (this.room.type === 'boss') {
        this.story.onBossReached();
        if (this.nightData.bossKind === 'nanny') {
          this.dialogue.say(nannyIntroLines(this.story));
        } else {
          this.dialogue.say([
            { who: this.nightData.boss, text: this.nightData.bossIntro },
          ]);
        }
        Sfx.bossRoar();
      }
    } else {
      this.room.doorsOpen = false; // memory room opens after the memory is seen
    }
  }

  // ---------- events ----------
  spawnEnemy(e) { this.enemies.push(e); }
  spawnProjectile(p) { this.projectiles.push(p); }

  onDollKilled(doll) {
    this.run.dollKills++;
    this.save.dollKillsTotal++;
    this.story.onDollKilled(); // moral choice tracking + truthScore
    this.persist();
    // the house rewards cruelty
    this.pickups.push({ kind: 'flame', x: doll.x, y: doll.y });
    this.pickups.push({ kind: 'stitch', x: doll.x + 10, y: doll.y });
  }

  onDollExploded(doll) { /* not a kill — Elsie doesn't blame you */ }

  onRoomCleared() {
    this.room.cleared = true;
    this.room.doorsOpen = true;
    this.run.roomsCleared++;
    this.story.onRoomCleared();
    Sfx.doorOpen();
    const cx = 14 * TS, cy = 7 * TS;
    this.pickups.push({ kind: 'flame', x: cx - 8, y: cy });
    this.pickups.push({ kind: 'stitch', x: cx + 8, y: cy });
    this.pickups.push({ kind: 'thread', x: cx, y: cy - 12 });
    this.player.gainFlame(20);
    if (this.mods.healOnRoomClear) this.player.heal(this.mods.healOnRoomClear);
    if (!this.run.pretendOffered && this.room.type === 'combat') {
      this.run.pretendOffered = true;
      this.pretendSel = 0;
      // offer two pretends, chosen by the night so each floor feels different
      const pool = [...PRETENDS];
      const a = (this.currentNight * 2 - 2) % pool.length;
      const b = (this.currentNight * 2 - 1) % pool.length;
      this.pretendOptions = [pool[a], pool[b]];
      this.state = 'pretendChoice';
      Sfx.upgrade();
    }
  }

  onBossDefeated() {
    this.enemies = this.enemies.filter(e => !e.dead);
    this.projectiles = [];
    this.room.doorsOpen = false;
    this.story.onBossDefeated(this.nightData.bossKind);
    this.pickups.push({ kind: this.nightData.keepsake, keepsake: true, x: 14 * TS, y: 7 * TS });
    for (let i = 0; i < 3; i++) this.pickups.push({ kind: 'thread', x: (12 + i * 2) * TS, y: 9 * TS });
    const lines = [];
    if (this.nightData.bossKind === 'nanny') lines.push(...NANNY_DEFEAT_LINES);
    lines.push({ who: '', text: this.nightData.dropText });
    this.dialogue.say(lines);
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
    // the flame also burns projectiles out of the air
    this.projectiles = this.projectiles.filter(p => dist(p, { x, y }) >= 60);
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
      case 'cradle': this.updateCradle(dt); break;
      case 'memoryScene': this.updateMemoryScene(dt); break;
      case 'dying':
        this.deathT -= dt;
        if (this.deathT <= 0) this.state = 'death';
        break;
      case 'death': this.updateDeath(dt); break;
      case 'end': this.updateEnd(dt); break;
      case 'finale': this.updateEnd(dt); break;
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
    // Scene 1: First Wake
    this.dialogue.say(ELSIE_FIRST_WAKE, () => {
      this.save.metElsie = true;
      this.story.setFlag('hasMetElsie', true);
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
      this.talkToElsie();
      return;
    }
    // the other children, once they've woken (data-driven; see children.js)
    for (const c of awakeChildren(this.save)) {
      if (dist(this.player, childPos(c)) < 22 && Input.interact()) {
        this.talkToChild(c);
        return;
      }
    }
    // hub interactables (data-driven; see hub.js)
    for (const o of HUB_OBJECTS) {
      if (!o.visible(this.story.state)) continue;
      if (dist(this.player, hubObjectPos(o)) < 18 && Input.interact()) {
        if (o.action) { o.action(this); Sfx.talk(); break; }
        this.dialogue.say(o.lines);
        Sfx.talk();
        break;
      }
    }
    // exit east door -> start run
    if (this.room.doorsOpen && this.player.x > (COLS - 1.6) * TS && this.player.y > 5.4 * TS && this.player.y < 8.6 * TS) {
      this.startFade(() => this.startRun());
      this.room.doorsOpen = false; // avoid double trigger
    }
  }

  talkToElsie() {
    if (this.save.endingSeen) {
      this.dialogue.say([
        { who: 'Elsie', text: 'The sun is coming up. It hasn\'t done that in... I don\'t remember how long.' },
        { who: 'Elsie', text: 'You kept your promise, Mallow. Every night. You came back every night.' },
        { who: 'Elsie', text: 'Let\'s watch the window a while. There\'s nothing downstairs that needs us anymore.' },
      ]);
      return;
    }
    // Story-critical dialogue always beats generic hub chatter (see storyDialogue.js).
    const picked = this.storyDialogue.pick();
    if (picked && picked.priority > 10) {
      this.dialogue.say(picked.lines, () => picked.apply());
      return;
    }
    // repeatable pre-run dialogue + the night's flavour lines
    const lines = picked ? [...picked.lines] : [];
    lines.push(...this.elsieNightFlavour());
    this.dialogue.say(lines, () => { if (picked) picked.apply(); });
  }

  talkToChild(c) {
    if (this.save.endingSeen) {
      const morning = {
        oren: [{ who: 'Oren', text: 'The sun\'s up. I keep waiting to be angry about something. Nothing\'s coming. Weird.' }],
        miri: [{ who: 'Miri', text: 'Look, little lantern. I don\'t have to draw the morning anymore. It drew itself.' }],
        pip: [{ who: 'Pip', text: 'Daylight! HA! That\'s the funniest thing I\'ve ever seen. Funny-ha-ha. The GOOD kind.' }],
        jude: [{ who: '', text: 'Jude writes: MORNING.' }, { who: '', text: 'He does not wipe the board clean.' }],
      };
      this.dialogue.say(morning[c.id] || []);
      return;
    }
    if (!this.childDialogues[c.id]) {
      this.childDialogues[c.id] = new DialogueManager(this.story, c.dialogue);
    }
    const picked = this.childDialogues[c.id].pick();
    if (!picked) return;
    this.dialogue.say(picked.lines, () => picked.apply());
    Sfx.talk();
  }

  elsieNightFlavour() {
    const nc = this.save.nightsCleared;
    // pre-night flavour for the night about to be attempted
    const NEXT = {
      1: [
        { who: 'Elsie', text: 'Good children do not cry. Good children do not ask why. I know all the rules. Knowing them doesn\'t help.' },
        { who: 'Elsie', text: 'The door downstairs is open. Please remember your promise about the dolls.' },
      ],
      2: [
        { who: 'Elsie', text: 'The bell rang twice tonight. That means the Lesson Hall. We were never allowed to whisper there.' },
        { who: 'Elsie', text: 'The Teacher doesn\'t like it when you move. So move anyway. But not when she\'s looking.' },
      ],
      3: [
        { who: 'Elsie', text: 'Can you smell it? The kitchen is awake. The porridge was never food, Mallow. It was a punishment.' },
        { who: 'Elsie', text: 'The Cook keeps stirring the same pot. I don\'t think she remembers what was in it first.' },
      ],
      4: [
        { who: 'Elsie', text: 'The pipes are singing. The Laundry is filling up again. We hid there once, in the wet sheets.' },
        { who: 'Elsie', text: 'The Laundress will say you\'re dirty. You aren\'t. You never were. Don\'t let her wash the flame out.' },
      ],
      5: [
        { who: 'Elsie', text: 'The attic door is open. It was NEVER open. She\'s waiting for you, Mallow. She\'s been waiting the whole time.' },
        { who: 'Elsie', text: 'Whatever she says up there... whatever she calls you... you\'re mine. I stitched you myself. Come back.' },
      ],
    };
    const lines = [];
    if (nc >= 1 && !this.save.endingSeen) {
      lines.push({ who: 'Elsie', text: 'The wall keeps changing in the night. I didn\'t see who writes the new rules. I don\'t want to.' });
    }
    lines.push(...(NEXT[Math.min(nc + 1, LAST_NIGHT)] || NEXT[1]));
    return lines;
  }

  updateRun(dt) {
    if (this.dialogue.active) { this.dialogue.update(dt); return; }
    this.run.timeElapsed += dt;
    this.player.update(dt, this.room);
    if (this.player.dead) return;

    // enemies
    for (const e of this.enemies) if (!e.dead) e.update(dt, this.room, this.player);
    // projectiles
    for (const p of this.projectiles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
      if (solidAt(this.room, p.x, p.y)) p.t = 0;
      else if (dist(p, this.player) < (p.r || 2) + 4) {
        p.t = 0;
        this.player.hurt(1, p.x - p.vx, p.y - p.vy);
      }
    }
    this.projectiles = this.projectiles.filter(p => p.t > 0);
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
        else if (p.kind === 'stitch') this.player.heal(1 * this.mods.healMult);
        else if (p.kind === 'thread') { this.save.thread++; this.persist(); }
        else if (p.keepsake) {
          this.save.keepsakes[p.kind] = true;
          if (p.kind === 'ribbon') this.save.hasRibbon = true;
          this.persist();
          this.startFade(() => this.victorySequence());
        }
      }
    }
    this.pickups = this.pickups.filter(p => !p.taken);

    // exit east door -> next room
    if (this.room.doorsOpen && this.player.x > (COLS - 1.6) * TS && this.player.y > 5.4 * TS && this.player.y < 8.6 * TS) {
      const next = this.run.roomIndex + 1;
      this.room.doorsOpen = false;
      this.startFade(() => this.enterRoom(next));
    }
  }

  // ---------- Candle Cradle (permanent upgrades, bought with Thread) ----------
  openCradle() {
    this.cradleSel = 0;
    this.state = 'cradle';
  }

  cradleOptions() {
    // upgrades still to buy, then a "back to bed" exit row
    return [...CRADLE_UPGRADES.filter(u => !this.save.cradle[u.id]),
      { id: '_close', name: 'LEAVE THE CANDLE BE', desc: '', cost: 0 }];
  }

  updateCradle(dt) {
    const opts = this.cradleOptions();
    if (Input.wasPressed('KeyW','ArrowUp')) { this.cradleSel = (this.cradleSel + opts.length - 1) % opts.length; Sfx.talk(); }
    if (Input.wasPressed('KeyS','ArrowDown')) { this.cradleSel = (this.cradleSel + 1) % opts.length; Sfx.talk(); }
    this.cradleSel = Math.min(this.cradleSel, opts.length - 1);
    if (Input.dodge()) { this.state = 'dorm'; return; }
    if (Input.confirm()) {
      const pick = opts[this.cradleSel];
      if (pick.id === '_close') { this.state = 'dorm'; return; }
      if (this.save.thread >= pick.cost) {
        this.save.thread -= pick.cost;
        this.save.cradle[pick.id] = true;
        this.persist();
        this.refreshMods();
        if (pick.id === 'extraStitch') this.player.heal(1); // the new stitch arrives mended
        Sfx.upgrade();
      } else {
        Sfx.doorLock(); // not enough thread
      }
    }
  }

  updatePretendChoice(dt) {
    if (Input.wasPressed('KeyA','ArrowLeft','KeyD','ArrowRight')) {
      this.pretendSel = 1 - this.pretendSel;
      Sfx.talk();
    }
    if (Input.confirm()) {
      const pick = this.pretendOptions[this.pretendSel];
      this.run.addPretend(pick.id);
      this.pretendName = pick.name;
      this.refreshMods();
      const eff = PRETEND_EFFECTS[pick.id];
      if (eff && eff.healNow) this.player.heal(eff.healNow);
      Sfx.upgrade();
      this.state = 'run';
    }
  }

  memoryPages() {
    return this.nightData.memory;
  }

  updateMemoryScene(dt) {
    if (Input.confirm()) {
      this.memoryPage++;
      Sfx.talk();
      if (this.memoryPage >= this.memoryPages().length) {
        this.save.sawMemory = true;
        this.save.memoriesSeen[this.currentNight] = true;
        // Night 1's memory is the Burned Ribbon (story inventory + flags)
        this.story.onMemoryFound(this.currentNight === 1 ? 'burnedRibbon' : 'night' + this.currentNight);
        this.persist();
        this.state = 'run';
        this.room.doorsOpen = true;
        Sfx.doorOpen();
      }
    }
  }

  updateDeath(dt) {
    if (Input.confirm() && this.fadeDir === 0) {
      this.save.nights++;
      this.story.endRun('death'); // RunSummary — Elsie reacts when spoken to
      this.persist();
      this.startFade(() => {
        this.setupDorm();
        this.state = 'dorm';
        this.dialogue.say([
          { who: '', text: 'Mallow wakes on the Dormitory floor, restitched by small careful hands.' },
        ]);
      });
    }
  }

  victorySequence() {
    const night = this.currentNight;
    const data = this.nightData;
    const run = this.run; // stats outlive setupDorm's reset
    this.story.endRun('victory'); // RunSummary — Elsie reacts when spoken to
    this.save.nights++;
    this.save.wonOnce = true;
    this.save.nightsCleared = Math.max(this.save.nightsCleared, night);
    this.persist();
    if (night >= LAST_NIGHT) { this.finaleSequence(); return; }
    this.endNight = night;
    this.setupDorm();
    this.state = 'dorm';
    const lines = [
      { who: '', text: `Morning does not come. But the house grows quiet, and Mallow carries ${data.keepsakeName} back upstairs.` },
    ];
    const REACT = {
      1: [
        { who: 'Elsie', text: '...That isn\'t mine.' },
        { who: 'Elsie', text: 'I think I used to say that when I wanted something too much.' },
      ],
      2: [
        { who: 'Elsie', text: 'Chalk. We weren\'t allowed to draw with it. Only to write lines.' },
        { who: 'Elsie', text: 'Draw me something with it sometime. Anything. A window. A door that goes OUT.' },
      ],
      3: [
        { who: 'Elsie', text: 'A spoon... there\'s a name on it. I can\'t read it. I don\'t think we\'re supposed to.' },
        { who: 'Elsie', text: 'Nobody ever finished their bowl, Mallow. Nobody was ever MEANT to. I understand that now.' },
      ],
      4: [
        { who: 'Elsie', text: 'The music box! It used to play in the walls when someone was taken to be washed.' },
        { who: 'Elsie', text: 'It sounds different in your hands. Softer. Like it\'s sorry.' },
      ],
    };
    lines.push(...(REACT[night] || REACT[1]));
    if (night === 1) {
      // Night 1's doll reaction, memory reaction, and wall rule reveal are
      // story dialogue — Elsie delivers them when spoken to (storyDialogue.js).
      lines.push({ who: '', text: 'Elsie is watching Mallow very carefully, like she has something to say.' });
    } else {
      if (run.dollKills > 0) {
        lines.push({ who: 'Elsie', text: 'The dolls stopped crying tonight. I don\'t want to talk about it.' });
      } else if (run.dollsSeen > 0) {
        lines.push({ who: 'Elsie', text: 'You kept your promise. The crying ones... I heard them go quiet the kind way.' });
      }
      if (this.save.memoriesSeen[night]) {
        lines.push({ who: 'Elsie', text: 'You saw one of the little rooms, didn\'t you. You have that look. Like a candle that\'s seen a draught.' });
      }
      lines.push({ who: '', text: 'Behind Elsie, fresh paint glistens on the Dormitory wall.' });
      lines.push({ who: '', text: data.rule + '.' });
    }
    // a keepsake carried home stirs another bed (children.js)
    const WAKE = {
      1: 'In the third bed, someone who was not there before rolls over and growls in their sleep.',
      2: 'In the second bed, a girl is sitting up, already watching Mallow, already smiling.',
      3: 'From somewhere near the blanket pile, a mask-muffled voice snickers.',
      4: 'In the far corner, a hooded shape stands very still, holding a small chalkboard.',
    };
    if (WAKE[night]) lines.push({ who: '', text: WAKE[night] });
    this.dialogue.say(lines, () => { this.state = 'end'; });
  }

  finaleSequence() {
    this.save.endingSeen = true;
    this.persist();
    this.endNight = LAST_NIGHT;
    this.setupDorm();
    this.state = 'dorm';
    const kind = this.save.dollKillsTotal === 0;
    const lines = [
      { who: '', text: 'The locket beats in Mallow\'s paw, slower and slower, like something finally allowed to rest.' },
      { who: '', text: 'Above the house, for the first time in longer than anyone can remember, the clock moves past 3:33.' },
      { who: 'Elsie', text: 'Mallow! The window — LOOK at the window!' },
      { who: '', text: 'Grey light. Then gold. The chalk drawings on the wall fade gently, like they are going somewhere better.' },
    ];
    if (kind) {
      lines.push({ who: 'Elsie', text: 'The crying dolls are on the beds. All of them. Sleeping. ACTUALLY sleeping.' });
      lines.push({ who: 'Elsie', text: 'You never hurt a single one. All five nights. They knew, Mallow. That\'s why they\'re not afraid to close their eyes.' });
      lines.push({ who: '', text: 'One by one, the dolls breathe out, and are children again.' });
    } else {
      lines.push({ who: 'Elsie', text: 'Some of the beds are... empty. The dolls that stopped crying never came back upstairs.' });
      lines.push({ who: 'Elsie', text: 'You did what you had to. I keep telling myself that. Maybe one morning I\'ll believe it.' });
      lines.push({ who: '', text: 'The empty beds are made very neatly. The house was always good at tidying away.' });
    }
    lines.push({ who: 'Elsie', text: 'You came back. Every night, you came back. That was the only rule that ever mattered.' });
    lines.push({ who: '', text: 'On the Dormitory wall, the old rules peel away. Under all of them, in a child\'s chalk:' });
    lines.push({ who: '', text: 'GOODNIGHT, HOLLOW. SLEEP WELL.' });
    this.dialogue.say(lines, () => { this.state = 'finale'; this.finaleKind = kind; });
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
    if (this.state === 'finale') { this.drawFinale(); this.drawFade(); return; }

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
    const KSPR = { flame: SPR.flamePickup, stitch: SPR.stitchPickup, thread: SPR.thread, ribbon: SPR.ribbon, chalk: SPR.chalk, spoon: SPR.spoon, musicbox: SPR.musicbox, locket: SPR.locket };
    for (const p of this.pickups) {
      const spr = KSPR[p.kind] || SPR.ribbon;
      const bob = Math.sin(performance.now() / 250 + p.x) * 1.5;
      ctx.drawImage(spr, Math.round(ox + p.x - spr.width / 2), Math.round(oy + p.y - spr.height / 2 + bob));
    }

    // projectiles
    for (const p of this.projectiles) {
      if (p.spr) {
        ctx.save();
        ctx.translate(ox + p.x, oy + p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.drawImage(p.spr, -p.spr.width / 2, -p.spr.height / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color || '#e8e0d8';
        ctx.fillRect(Math.round(ox + p.x - 1), Math.round(oy + p.y - 1), 3, 3);
      }
    }

    // entities sorted by y
    const ents = [...this.enemies];
    if (!this.player.dead || this.state === 'dying') ents.push(this.player);
    if (this.state === 'dorm') {
      ents.push({ y: this.elsie.y, drawElsie: true });
      for (const c of awakeChildren(this.save)) {
        const p = childPos(c);
        ents.push({ y: p.y, drawChild: c, px: p.x, py: p.y });
      }
    }
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.drawElsie) {
        ctx.drawImage(SPR.elsie, Math.round(ox + this.elsie.x - 5), Math.round(oy + this.elsie.y - 10));
      } else if (e.drawChild) {
        ctx.drawImage(SPR[e.drawChild.spr], Math.round(ox + e.px - 5), Math.round(oy + e.py - 10));
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
    if (this.state === 'cradle') this.drawCradle();
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
    const st = this.story.state;
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(232,224,216,0.5)';
    ctx.fillText('GOOD CHILDREN DO NOT CRY', ox + 210, oy + 10);
    // rules earned so far, painted on the wall.
    // Night 1's rule only appears once the story has revealed it (Scene 9).
    for (let n = 1; n <= this.save.nightsCleared && n <= LAST_NIGHT; n++) {
      if (n === 1 && !st.hasSeenGoodChildrenDoNotRemember) continue;
      const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 400 + n);
      ctx.fillStyle = `rgba(176,58,72,${pulse})`;
      const rule = NIGHTS[n].rule.replace(/^RULE \d+: /, '');
      ctx.fillText(rule, ox + 200 - (n - 1) * 4, oy + 10 + n * 12);
    }
    // hub story objects (data-driven; see hub.js)
    for (const o of HUB_OBJECTS) {
      if (!o.visible(st)) continue;
      const p = hubObjectPos(o);
      if (o.spr) {
        ctx.drawImage(SPR[o.spr], Math.round(ox + p.x), Math.round(oy + p.y));
      } else if (o.draw) {
        o.draw(ctx, ox + p.x, oy + p.y, st);
      }
      if (!this.dialogue.active && dist(this.player, p) < 18 && dist(this.player, this.elsie) >= 22) {
        ctx.fillStyle = '#ffe08a';
        ctx.fillText(`[E] ${o.prompt}`, ox + p.x - 8, oy + p.y - 6);
      }
    }
    if (this.save.endingSeen) {
      ctx.fillStyle = `rgba(255,224,138,${0.6 + 0.3 * Math.sin(performance.now() / 500)})`;
      ctx.fillText('GOODNIGHT, HOLLOW. SLEEP WELL.', ox + 60, oy + 10);
    }
    // Elsie prompt
    if (!this.dialogue.active && dist(this.player, this.elsie) < 22) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('[E] talk', ox + this.elsie.x - 12, oy + this.elsie.y - 16);
    }
    // prompts for the other children
    if (!this.dialogue.active) {
      for (const c of awakeChildren(this.save)) {
        const p = childPos(c);
        if (dist(this.player, p) < 22) {
          ctx.fillStyle = '#ffe08a';
          ctx.fillText('[E] talk', ox + p.x - 12, oy + p.y - 16);
          break;
        }
      }
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
    if (this.run && this.run.pretends.length && this.state === 'run') {
      ctx.fillStyle = '#9fd8c0';
      ctx.fillText(this.pretendName || '', 260, 18);
    }
    // keepsakes owned
    const kspr = { ribbon: SPR.ribbon, chalk: SPR.chalk, spoon: SPR.spoon, musicbox: SPR.musicbox, locket: SPR.locket };
    let kx = 16;
    for (const k of KEEPSAKE_ORDER) {
      if (this.save.keepsakes[k]) { ctx.drawImage(kspr[k], kx, 22); kx += 10; }
    }
    // thread (persistent currency for the Candle Cradle)
    ctx.drawImage(SPR.thread, kx + 4, 22);
    ctx.fillStyle = '#b8b0a8';
    ctx.fillText(`${this.save.thread}`, kx + 12, 28);
    // room / place label
    ctx.fillStyle = '#b8b0a8';
    if (this.room.type !== 'dorm') {
      const floor = this.nightData.floor;
      const label = this.room.type === 'boss' ? `${floor} — ???`
        : this.room.type === 'memory' ? `${floor} — a quiet room`
        : `${floor} — room ${this.run.roomIndex + 1}`;
      ctx.fillText(label, W - 8 - ctx.measureText(label).width, 9);
      const nlabel = `NIGHT ${this.currentNight}`;
      ctx.fillStyle = '#7a6a92';
      ctx.fillText(nlabel, W - 8 - ctx.measureText(nlabel).width, 18);
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
      const bn = this.nightData.boss;
      ctx.fillText(bn, 240 - ctx.measureText(bn).width / 2, H - 16);
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
    const NAMES = { 1: 'FIRST', 2: 'SECOND', 3: 'THIRD', 4: 'FOURTH', 5: 'LAST' };
    const sub = this.save.endingSeen ? '— MORNING, AT LAST —'
      : `— THE ${NAMES[Math.min(this.save.nightsCleared + 1, LAST_NIGHT)]} NIGHT —`;
    ctx.fillText(sub, W / 2, 178);
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

  drawCradle() {
    ctx.fillStyle = 'rgba(10,8,16,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.font = '10px monospace';
    ctx.fillText('THE CANDLE CRADLE', W / 2, 52);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#b8b0a8';
    ctx.fillText('The candle keeps what Mallow saves. Thread buys small mercies.', W / 2, 66);
    ctx.drawImage(SPR.thread, W / 2 - 26, 74);
    ctx.fillStyle = '#e8e0d8';
    ctx.fillText(`THREAD: ${this.save.thread}`, W / 2 + 6, 80);
    const opts = this.cradleOptions();
    for (let i = 0; i < opts.length; i++) {
      const y = 100 + i * 28;
      const sel = this.cradleSel === i;
      ctx.fillStyle = sel ? '#322d44' : '#1c1626';
      ctx.fillRect(W / 2 - 150, y, 300, 24);
      ctx.strokeStyle = sel ? '#ffe08a' : '#55506a';
      ctx.strokeRect(W / 2 - 149.5, y + 0.5, 299, 23);
      const o = opts[i];
      const afford = o.id === '_close' || this.save.thread >= o.cost;
      ctx.fillStyle = sel ? (afford ? '#e8e0d8' : '#b03a48') : '#b8b0a8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(o.name, W / 2 - 140, y + 10);
      if (o.id !== '_close') {
        ctx.textAlign = 'right';
        ctx.fillText(`${o.cost} thread`, W / 2 + 140, y + 10);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#7a6a92';
        ctx.font = '7px monospace';
        ctx.fillText(o.desc, W / 2 - 140, y + 20);
      }
      ctx.textAlign = 'center';
    }
    ctx.fillStyle = '#55506a';
    ctx.font = '7px monospace';
    ctx.fillText('[W]/[S] choose · [ENTER] spend · [K] step away', W / 2, 100 + opts.length * 28 + 14);
    ctx.textAlign = 'left';
  }

  drawPretendChoice() {
    ctx.fillStyle = 'rgba(10,8,16,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.font = '10px monospace';
    ctx.fillText('The children believe in you. Pick a Pretend.', W / 2, 70);
    const opts = this.pretendOptions || [];
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
    if (this.run) {
      ctx.fillStyle = '#7a6a92';
      ctx.font = '7px monospace';
      const mins = Math.floor(this.run.timeElapsed / 60), secs = Math.floor(this.run.timeElapsed % 60);
      const spared = this.run.dollsSeen - this.run.dollKills;
      ctx.fillText(`rooms quieted: ${this.run.roomsCleared} · dolls spared: ${spared}/${this.run.dollsSeen} · ${mins}:${String(secs).padStart(2, '0')} in the dark`, W / 2, 152);
    }
    ctx.fillStyle = '#ffe08a';
    ctx.fillText('press [ENTER] to wake in the Dormitory', W / 2, 175);
    ctx.textAlign = 'left';
  }

  drawEnd() {
    const n = this.endNight || 1;
    const data = NIGHTS[n];
    const NAMES = { 1: 'FIRST', 2: 'SECOND', 3: 'THIRD', 4: 'FOURTH', 5: 'LAST' };
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e0d8';
    ctx.font = '14px monospace';
    ctx.fillText(`END OF THE ${NAMES[n]} NIGHT`, W / 2, 90);
    const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(176,58,72,${pulse})`;
    ctx.font = '11px monospace';
    // Night 1's rule only exists once the Burned Ribbon memory has been found
    const ruleText = (n === 1 && !this.story.state.burnedRibbonFound)
      ? 'THE WALL IS WAITING FOR A NEW RULE.'
      : data.rule;
    ctx.fillText(ruleText, W / 2, 135);
    ctx.fillStyle = '#7a6a92';
    ctx.font = '8px monospace';
    ctx.fillText(`Mallow keeps ${data.keepsakeName}. (${data.keepsakeDesc})`, W / 2, 165);
    ctx.fillStyle = '#55506a';
    const left = LAST_NIGHT - n;
    ctx.fillText(left > 1 ? `The house has ${['','one','two','three','four'][left]} more floors. But that is another night.`
      : 'One floor remains. The attic. Her floor.', W / 2, 182);
    ctx.fillStyle = '#ffe08a';
    if (Math.floor(performance.now() / 700) % 2) ctx.fillText('press [ENTER] to stay a while longer', W / 2, 220);
    ctx.textAlign = 'left';
  }

  drawFinale() {
    // dawn gradient — the only warm sky in the game
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1626');
    g.addColorStop(0.6, '#3a2a3a');
    g.addColorStop(1, '#7a5a3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.font = '16px monospace';
    ctx.fillText('MORNING COMES TO THE HOLLOW', W / 2, 80);
    ctx.fillStyle = '#e8e0d8';
    ctx.font = '9px monospace';
    if (this.finaleKind) {
      ctx.fillText('Every doll slept. Every child woke.', W / 2, 115);
      ctx.fillText('Mallow kept every promise, all five nights.', W / 2, 130);
    } else {
      ctx.fillText('The house sleeps. Not everyone woke to see it.', W / 2, 115);
      ctx.fillText('Some promises were heavier than a needle could carry.', W / 2, 130);
    }
    ctx.fillStyle = '#b8b0a8';
    ctx.font = '8px monospace';
    ctx.fillText(`Nights survived: ${this.save.nights} · Keepsakes: ${Object.keys(this.save.keepsakes).length}/5`, W / 2, 158);
    // Mallow and Elsie at the window
    ctx.drawImage(SPR.mallow, W / 2 - 26, 178, 24, 28);
    ctx.drawImage(SPR.elsie, W / 2 + 4, 172, 20, 28);
    const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 500);
    ctx.fillStyle = `rgba(255,224,138,${pulse})`;
    ctx.font = '10px monospace';
    ctx.fillText('GOODNIGHT, HOLLOW. SLEEP WELL.', W / 2, 232);
    ctx.fillStyle = '#55506a';
    ctx.font = '7px monospace';
    if (Math.floor(performance.now() / 700) % 2) ctx.fillText('press [ENTER] to stay in the morning', W / 2, 254);
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
attachDebug(game);    // dev shortcuts, only active with ?dev=1
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
