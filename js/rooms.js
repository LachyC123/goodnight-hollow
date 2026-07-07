// Room construction and rendering for the Dormitory and Nursery Rot.
import { SPR } from './sprites.js';
import { TS, COLS, ROWS } from './world.js';
import { ButtonMouse, BlanketCrawler, CryingDoll, Nanny } from './enemies.js';

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

export function buildRoom(type, variant = 0, game = null) {
  const room = {
    type,
    grid: emptyGrid(),
    decor: [],
    spawnSpecs: [],
    doorTiles: EXIT_TILES,
    doorsOpen: false,
    cleared: false,
    seed: 100 + variant * 37 + (type === 'boss' ? 999 : 0),
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
    const layouts = [
      r => { // cribs flanking
        addObstacle(r, 5, 4, 2, 1, SPR.crib);
        addObstacle(r, 20, 9, 2, 1, SPR.crib);
        r.spawnSpecs = [
          ['mouse', C(9, 3)], ['mouse', C(18, 4)], ['mouse', C(14, 11)], ['mouse', C(22, 7)],
        ];
      },
      r => { // toy piles + crawlers
        addObstacle(r, 13, 6, 2, 1, SPR.toyPile);
        addObstacle(r, 6, 10, 2, 1, SPR.toyPile);
        r.spawnSpecs = [
          ['crawler', C(9, 4)], ['crawler', C(20, 10)], ['mouse', C(22, 3)], ['mouse', C(16, 11)],
        ];
      },
      r => { // crying dolls in cribs
        addObstacle(r, 8, 3, 2, 1, SPR.crib);
        addObstacle(r, 18, 10, 2, 1, SPR.crib);
        r.spawnSpecs = [
          ['doll', C(9, 6)], ['doll', C(19, 8)], ['mouse', C(14, 3)], ['mouse', C(14, 11)],
        ];
      },
      r => { // gauntlet
        addObstacle(r, 10, 5, 2, 1, SPR.toyPile);
        addObstacle(r, 17, 8, 2, 1, SPR.crib);
        r.spawnSpecs = [
          ['crawler', C(13, 10)], ['doll', C(23, 4)], ['mouse', C(8, 9)],
          ['mouse', C(20, 3)], ['mouse', C(24, 10)],
        ];
      },
    ];
    layouts[variant % layouts.length](room);
    // ambience decor (non-solid): a candle and scattered comfort objects
    room.decor.push({ spr: SPR.candle, tx: 2 + (variant * 5) % 20, ty: 2, scale: 1 });
    room.decor.push({ spr: SPR.blanketPile, tx: 3 + (variant * 7) % 18, ty: 11, scale: 2 });
    room.decor.push({ spr: SPR.teddy, tx: 5 + (variant * 9) % 20, ty: 4, scale: 1 });
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
    room.spawnSpecs = [['nanny', C(20, 7)]];
  }
  return room;
}

export function spawnEnemies(room, game) {
  const out = [];
  for (const [kind, p] of room.spawnSpecs) {
    if (kind === 'mouse') out.push(new ButtonMouse(game, p.x, p.y));
    else if (kind === 'crawler') out.push(new BlanketCrawler(game, p.x, p.y));
    else if (kind === 'doll') out.push(new CryingDoll(game, p.x, p.y));
    else if (kind === 'nanny') out.push(new Nanny(game, p.x, p.y));
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
  // warm wooden floorboards (reference image style)
  const planks = ['#43301f', '#4a3524', '#3c2b1c', '#463222'];
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
  // dark walls
  ctx.fillStyle = '#151020';
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
