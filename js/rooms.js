// Room construction and rendering for the Dormitory and the five floors.
import { SPR } from './sprites.js';
import { TS, COLS, ROWS } from './world.js';
import {
  ButtonMouse, BlanketCrawler, CryingDoll, Nanny,
  ChalkWraith, DeskMimic, SpoonSwarm, PorridgeBlob, SheetGhost, MangleHound,
  Teacher, Cook, Laundress, Mercy,
} from './enemies.js';
import { NIGHTS } from './nights.js';

// tiles for the exit door (east wall) and entry (west wall)
const EXIT_TILES = [{ x: COLS - 1, y: 6 }, { x: COLS - 1, y: 7 }];
const ENTRY_TILES = [{ x: 0, y: 6 }, { x: 0, y: 7 }];

function emptyGrid() {
  const g = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) row.push(y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1);
    g.push(row);
  }
  return g;
}

function addObstacle(room, tx, ty, tw, th, spr, scale = 2) {
  for (let y = ty; y < ty + th; y++)
    for (let x = tx; x < tx + tw; x++)
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) room.grid[y][x] = true;
  room.decor.push({ spr, tx, ty, scale });
}

// deterministic pseudo-random for room texture
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildRoom(type, variant = 0, night = 1) {
  const room = {
    type,
    night,
    grid: emptyGrid(),
    decor: [],
    spawnSpecs: [],
    doorTiles: EXIT_TILES,
    doorsOpen: false,
    cleared: false,
    seed: 100 + variant * 37 + night * 211 + (type === 'boss' ? 999 : 0),
    bg: null,
  };

  const C = (tx, ty) => ({ x: tx * TS + TS / 2, y: ty * TS + TS / 2 });

  if (type === 'dorm') {
    room.doorsOpen = false; // opened by story
    room.cleared = true;
    for (let i = 0; i < 4; i++) addObstacle(room, 3 + i * 6, 1, 2, 1, SPR.bed);
    room.decor.push({ spr: SPR.candle, tx: 2, ty: 5, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 25, ty: 5, scale: 1 });
    room.decor.push({ spr: SPR.blanketPile, tx: 22, ty: 11, scale: 2 });
    room.decor.push({ spr: SPR.teddy, tx: 8, ty: 10, scale: 1 });
  } else if (type === 'combat') {
    const layouts = COMBAT_LAYOUTS[night] || COMBAT_LAYOUTS[1];
    layouts[variant % layouts.length](room, C);
    // ambience decor (non-solid)
    room.decor.push({ spr: SPR.candle, tx: 2 + (variant * 5) % 20, ty: 2, scale: 1 });
    const amb = AMBIENCE[night] || AMBIENCE[1];
    room.decor.push({ spr: amb[variant % amb.length], tx: 3 + (variant * 7) % 18, ty: 11, scale: 2 });
    room.decor.push({ spr: amb[(variant + 1) % amb.length], tx: 5 + (variant * 9) % 20, ty: 4, scale: 1 });
  } else if (type === 'memory') {
    room.cleared = true;
    room.decor.push({ spr: SPR.candle, tx: 11, ty: 6, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 16, ty: 6, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 11, ty: 9, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 16, ty: 9, scale: 1 });
    room.memorySpot = { x: 14 * TS, y: 7.5 * TS, r: 20, seen: false };
  } else if (type === 'boss') {
    room.decor.push({ spr: SPR.candle, tx: 3, ty: 2, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 24, ty: 2, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 3, ty: 11, scale: 1 });
    room.decor.push({ spr: SPR.candle, tx: 24, ty: 11, scale: 1 });
    room.spawnSpecs = [[NIGHTS[night].bossKind, C(20, 7)]];
  }
  return room;
}

// Combat room layouts per night. Each layout adds solid obstacles + spawn specs.
const COMBAT_LAYOUTS = {
  1: [
    (r, C) => { // cribs flanking
      addObstacle(r, 5, 4, 2, 1, SPR.crib);
      addObstacle(r, 20, 9, 2, 1, SPR.crib);
      r.spawnSpecs = [
        ['mouse', C(9, 3)], ['mouse', C(18, 4)], ['mouse', C(14, 11)], ['mouse', C(22, 7)],
      ];
    },
    (r, C) => { // toy piles + crawlers
      addObstacle(r, 13, 6, 2, 1, SPR.toyPile);
      addObstacle(r, 6, 10, 2, 1, SPR.toyPile);
      r.spawnSpecs = [
        ['crawler', C(9, 4)], ['crawler', C(20, 10)], ['mouse', C(22, 3)], ['mouse', C(16, 11)],
      ];
    },
    (r, C) => { // crying dolls in cribs
      addObstacle(r, 8, 3, 2, 1, SPR.crib);
      addObstacle(r, 18, 10, 2, 1, SPR.crib);
      r.spawnSpecs = [
        ['doll', C(9, 6)], ['doll', C(19, 8)], ['mouse', C(14, 3)], ['mouse', C(14, 11)],
      ];
    },
    (r, C) => { // gauntlet
      addObstacle(r, 10, 5, 2, 1, SPR.toyPile);
      addObstacle(r, 17, 8, 2, 1, SPR.crib);
      r.spawnSpecs = [
        ['crawler', C(13, 10)], ['doll', C(23, 4)], ['mouse', C(8, 9)],
        ['mouse', C(20, 3)], ['mouse', C(24, 10)],
      ];
    },
  ],
  2: [
    (r, C) => { // rows of desks, wraiths above them
      addObstacle(r, 6, 4, 2, 1, SPR.desk);
      addObstacle(r, 12, 4, 2, 1, SPR.desk);
      addObstacle(r, 18, 4, 2, 1, SPR.desk);
      addObstacle(r, 9, 9, 2, 1, SPR.desk);
      addObstacle(r, 15, 9, 2, 1, SPR.desk);
      r.spawnSpecs = [
        ['wraith', C(8, 2)], ['wraith', C(20, 11)], ['mouse', C(14, 7)], ['mouse', C(23, 3)],
      ];
    },
    (r, C) => { // one of these desks bites
      addObstacle(r, 7, 6, 2, 1, SPR.desk);
      addObstacle(r, 20, 5, 2, 1, SPR.desk);
      r.spawnSpecs = [
        ['mimic', C(14, 8)], ['mimic', C(22, 10)], ['wraith', C(10, 11)],
      ];
    },
    (r, C) => { // detention: dolls made to sit facing the wall
      addObstacle(r, 4, 7, 2, 1, SPR.desk);
      addObstacle(r, 23, 7, 2, 1, SPR.desk);
      r.spawnSpecs = [
        ['doll', C(3, 3)], ['doll', C(25, 11)], ['wraith', C(14, 4)], ['wraith', C(14, 10)],
      ];
    },
    (r, C) => { // full class
      addObstacle(r, 10, 4, 2, 1, SPR.desk);
      addObstacle(r, 16, 9, 2, 1, SPR.desk);
      r.spawnSpecs = [
        ['mimic', C(13, 7)], ['wraith', C(7, 3)], ['wraith', C(21, 11)],
        ['mouse', C(23, 4)], ['doll', C(5, 10)],
      ];
    },
  ],
  3: [
    (r, C) => { // the long table itself
      addObstacle(r, 8, 6, 4, 1, SPR.table);
      addObstacle(r, 16, 6, 4, 1, SPR.table);
      r.spawnSpecs = [
        ['spoon', C(7, 3)], ['spoon', C(21, 3)], ['spoon', C(14, 11)], ['porridge', C(14, 9)],
      ];
    },
    (r, C) => { // stoves in the corners
      addObstacle(r, 4, 3, 2, 1, SPR.stove);
      addObstacle(r, 22, 10, 2, 1, SPR.stove);
      r.spawnSpecs = [
        ['porridge', C(8, 8)], ['porridge', C(20, 5)], ['spoon', C(14, 3)], ['crawler', C(14, 11)],
      ];
    },
    (r, C) => { // dolls at the table, still waiting to be excused
      addObstacle(r, 11, 7, 4, 1, SPR.table);
      r.spawnSpecs = [
        ['doll', C(10, 5)], ['doll', C(17, 9)], ['spoon', C(5, 4)], ['spoon', C(23, 10)],
      ];
    },
    (r, C) => { // full kitchen
      addObstacle(r, 7, 4, 2, 1, SPR.stove);
      addObstacle(r, 15, 9, 4, 1, SPR.table);
      r.spawnSpecs = [
        ['porridge', C(20, 4)], ['spoon', C(10, 10)], ['spoon', C(24, 8)],
        ['crawler', C(5, 9)], ['doll', C(13, 3)],
      ];
    },
  ],
  4: [
    (r, C) => { // tubs in a row
      addObstacle(r, 6, 5, 2, 1, SPR.tub);
      addObstacle(r, 13, 5, 2, 1, SPR.tub);
      addObstacle(r, 20, 5, 2, 1, SPR.tub);
      r.spawnSpecs = [
        ['sheet', C(9, 9)], ['sheet', C(18, 10)], ['mouse', C(24, 3)], ['mouse', C(4, 11)],
      ];
    },
    (r, C) => { // hanging lines, hounds between them
      addObstacle(r, 9, 3, 2, 1, SPR.line);
      addObstacle(r, 17, 10, 2, 1, SPR.line);
      r.spawnSpecs = [
        ['hound', C(6, 8)], ['hound', C(22, 5)], ['sheet', C(14, 7)],
      ];
    },
    (r, C) => { // dolls left in the wash
      addObstacle(r, 12, 7, 2, 1, SPR.tub);
      r.spawnSpecs = [
        ['doll', C(6, 4)], ['doll', C(22, 10)], ['sheet', C(14, 3)], ['hound', C(18, 11)],
      ];
    },
    (r, C) => { // full laundry
      addObstacle(r, 7, 4, 2, 1, SPR.tub);
      addObstacle(r, 18, 8, 2, 1, SPR.line);
      r.spawnSpecs = [
        ['hound', C(13, 10)], ['sheet', C(8, 9)], ['sheet', C(22, 4)],
        ['mouse', C(4, 3)], ['doll', C(24, 11)],
      ];
    },
  ],
  5: [
    (r, C) => { // boxes of small shoes
      addObstacle(r, 6, 4, 1, 1, SPR.box);
      addObstacle(r, 12, 8, 1, 1, SPR.box);
      addObstacle(r, 19, 4, 1, 1, SPR.box);
      addObstacle(r, 23, 10, 1, 1, SPR.box);
      r.spawnSpecs = [
        ['wraith', C(9, 10)], ['wraith', C(18, 3)], ['sheet', C(14, 7)], ['mouse', C(24, 5)],
      ];
    },
    (r, C) => { // covered mirrors
      addObstacle(r, 8, 5, 1, 1, SPR.mirror);
      addObstacle(r, 19, 8, 1, 1, SPR.mirror);
      r.spawnSpecs = [
        ['sheet', C(5, 9)], ['sheet', C(23, 4)], ['wraith', C(14, 11)], ['wraith', C(14, 3)],
      ];
    },
    (r, C) => { // the dolls kept closest
      addObstacle(r, 13, 6, 1, 1, SPR.box);
      addObstacle(r, 15, 8, 1, 1, SPR.box);
      r.spawnSpecs = [
        ['doll', C(9, 4)], ['doll', C(19, 10)], ['doll', C(24, 6)], ['wraith', C(5, 10)],
      ];
    },
    (r, C) => { // everything the house remembers
      addObstacle(r, 9, 4, 1, 1, SPR.box);
      addObstacle(r, 18, 9, 1, 1, SPR.mirror);
      r.spawnSpecs = [
        ['wraith', C(6, 9)], ['sheet', C(22, 4)], ['hound', C(14, 11)],
        ['mouse', C(24, 8)], ['doll', C(4, 4)],
      ];
    },
  ],
};

const AMBIENCE = {
  1: [SPR.blanketPile, SPR.teddy],
  2: [SPR.blackboard, SPR.desk],
  3: [SPR.pot, SPR.stove],
  4: [SPR.line, SPR.tub],
  5: [SPR.box, SPR.mirror],
};

export function spawnEnemies(room, game) {
  const out = [];
  for (const [kind, p] of room.spawnSpecs) {
    if (kind === 'mouse') out.push(new ButtonMouse(game, p.x, p.y));
    else if (kind === 'crawler') out.push(new BlanketCrawler(game, p.x, p.y));
    else if (kind === 'doll') out.push(new CryingDoll(game, p.x, p.y));
    else if (kind === 'wraith') out.push(new ChalkWraith(game, p.x, p.y));
    else if (kind === 'mimic') out.push(new DeskMimic(game, p.x, p.y));
    else if (kind === 'spoon') out.push(new SpoonSwarm(game, p.x, p.y));
    else if (kind === 'porridge') out.push(new PorridgeBlob(game, p.x, p.y));
    else if (kind === 'sheet') out.push(new SheetGhost(game, p.x, p.y));
    else if (kind === 'hound') out.push(new MangleHound(game, p.x, p.y));
    else if (kind === 'nanny') out.push(new Nanny(game, p.x, p.y));
    else if (kind === 'teacher') out.push(new Teacher(game, p.x, p.y));
    else if (kind === 'cook') out.push(new Cook(game, p.x, p.y));
    else if (kind === 'laundress') out.push(new Laundress(game, p.x, p.y));
    else if (kind === 'mercy') out.push(new Mercy(game, p.x, p.y));
  }
  return out;
}

// Pre-render the room background to an offscreen canvas.
export function renderRoomBg(room) {
  const c = document.createElement('canvas');
  c.width = COLS * TS; c.height = ROWS * TS;
  const ctx = c.getContext('2d');
  const rnd = mulberry(room.seed);
  const dorm = room.type === 'dorm';
  const pal = (NIGHTS[room.night] || NIGHTS[1]).palette;
  // floorboards, tinted per floor
  const planks = dorm ? NIGHTS[1].palette.planks : pal.planks;
  for (let y = 1; y < ROWS - 1; y++) {
    const shade = planks[Math.floor(rnd() * planks.length)];
    for (let x = 1; x < COLS - 1; x++) {
      ctx.fillStyle = (x + y * 3) % 7 === 0 ? planks[(y + x) % 4] : shade;
      ctx.fillRect(x * TS, y * TS, TS, TS);
      // plank seams
      ctx.fillStyle = 'rgba(20,12,6,0.5)';
      ctx.fillRect(x * TS, y * TS, TS, 1);
      if ((x * 5 + y * 11) % 9 === 0) ctx.fillRect(x * TS, y * TS, 1, TS);
      if (rnd() < 0.05) { // nail / knot
        ctx.fillStyle = 'rgba(15,9,5,0.6)';
        ctx.fillRect(x * TS + 4 + Math.floor(rnd() * 8), y * TS + 4 + Math.floor(rnd() * 8), 2, 2);
      }
    }
  }
  // dark walls, tinted per floor
  ctx.fillStyle = dorm ? NIGHTS[1].palette.wall : pal.wall;
  ctx.fillRect(0, 0, COLS * TS, TS);
  ctx.fillRect(0, (ROWS - 1) * TS, COLS * TS, TS);
  ctx.fillRect(0, 0, TS, ROWS * TS);
  ctx.fillRect((COLS - 1) * TS, 0, TS, ROWS * TS);
  // skirting shadow at wall base
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(TS, TS, (COLS - 2) * TS, 3);
  // chalk drawings on the top wall (reference: child stick figures)
  const chalkCols = ['#6a86b8', '#c87a9e', '#8fb0c8'];
  for (let i = 0; i < 5; i++) {
    if (rnd() < 0.35) continue;
    const cx = TS * 2 + Math.floor(rnd() * (COLS - 5)) * TS;
    const col = chalkCols[Math.floor(rnd() * chalkCols.length)];
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    // tiny stick figure
    ctx.strokeRect(cx + 2.5, 2.5, 4, 4);           // head
    ctx.beginPath();
    ctx.moveTo(cx + 4.5, 7); ctx.lineTo(cx + 4.5, 12);   // body
    ctx.moveTo(cx + 1, 9); ctx.lineTo(cx + 8, 9);        // arms
    ctx.moveTo(cx + 4.5, 12); ctx.lineTo(cx + 2, 15);    // legs
    ctx.moveTo(cx + 4.5, 12); ctx.lineTo(cx + 7, 15);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // moonlit window in the dorm (reference image)
  if (dorm) {
    const wx = 10 * TS, wy = 1;
    ctx.fillStyle = '#0e1524';
    ctx.fillRect(wx, wy, 34, 14);
    ctx.fillStyle = '#31507c';
    ctx.fillRect(wx + 2, wy + 2, 14, 4); ctx.fillRect(wx + 18, wy + 2, 14, 4);
    ctx.fillRect(wx + 2, wy + 8, 14, 4); ctx.fillRect(wx + 18, wy + 8, 14, 4);
    ctx.fillStyle = '#8fb0c8';
    ctx.fillRect(wx + 5, wy + 3, 3, 2); // moon glint
    // moonbeam on the floor
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#8fb0c8';
    ctx.beginPath();
    ctx.moveTo(wx + 2, TS);
    ctx.lineTo(wx + 32, TS);
    ctx.lineTo(wx + 52, TS * 6);
    ctx.lineTo(wx - 18, TS * 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // star rug in the room centre (memory, dorm, boss rooms)
  if (room.type === 'memory' || dorm || room.type === 'boss') {
    const rx = COLS * TS / 2, ry = ROWS * TS / 2 + (dorm ? 8 : 0), rr = 52;
    ctx.fillStyle = '#4c4a38';
    ctx.beginPath(); ctx.ellipse(rx, ry, rr, rr * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5e5c46';
    ctx.beginPath(); ctx.ellipse(rx, ry, rr - 6, (rr - 6) * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#6a6850';
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7;
      const sx = rx + Math.cos(a) * (rr - 16), sy = ry + Math.sin(a) * (rr - 16) * 0.62;
      ctx.fillRect(sx - 1, sy - 3, 2, 6);
      ctx.fillRect(sx - 3, sy - 1, 6, 2);
    }
  }
  // decor
  for (const d of room.decor) {
    const s = d.scale || 2;
    ctx.imageSmoothingEnabled = false;
    // warm glow behind candles
    if (d.spr === SPR.candle) {
      const gx = d.tx * TS + (d.spr.width * s) / 2, gy = d.ty * TS + TS - 2;
      const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 26);
      g.addColorStop(0, 'rgba(255,179,71,0.35)');
      g.addColorStop(1, 'rgba(255,179,71,0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - 26, gy - 26, 52, 52);
    }
    ctx.drawImage(d.spr, d.tx * TS, d.ty * TS + TS - d.spr.height * s / 2, d.spr.width * s, d.spr.height * s);
  }
  room.bg = c;
  return c;
}

export function drawRoom(ctx, room, ox, oy) {
  if (!room.bg) renderRoomBg(room);
  ctx.drawImage(room.bg, ox, oy);
  // exit door (east)
  drawDoor(ctx, room, ox + (COLS - 1) * TS - 4, oy + 6 * TS, room.doorsOpen);
  // entry door (west) — always shut behind you
  drawDoor(ctx, room, ox + 4 - 8, oy + 6 * TS, false);
}

function drawDoor(ctx, room, x, y, open) {
  ctx.fillStyle = '#5e4630';
  ctx.fillRect(x, y - 4, 12, 40);
  ctx.fillStyle = open ? '#050308' : '#2c2035';
  ctx.fillRect(x + 2, y - 2, 8, 36);
  if (!open) {
    ctx.strokeStyle = '#55506a';
    ctx.beginPath();
    ctx.moveTo(x + 2, y); ctx.lineTo(x + 10, y + 32);
    ctx.moveTo(x + 10, y); ctx.lineTo(x + 2, y + 32);
    ctx.stroke();
  }
}

export { EXIT_TILES, ENTRY_TILES };
