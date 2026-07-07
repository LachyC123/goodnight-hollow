// World constants and collision helpers.
export const TS = 16;      // tile size
export const COLS = 28;    // room width in tiles
export const ROWS = 14;    // room height in tiles
export const OX = 16;      // room x offset on canvas
export const OY = 38;      // room y offset on canvas
export const W = 480, H = 270;

export function solidAt(room, px, py) {
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  if (room.grid[ty][tx]) {
    // door tiles pass when open
    if (room.doorTiles && room.doorsOpen) {
      for (const d of room.doorTiles) if (d.x === tx && d.y === ty) return false;
    }
    return true;
  }
  return false;
}

// Axis-separated AABB movement against tile grid. Entity has x,y center and w,h box.
export function moveEntity(e, dx, dy, room) {
  const hw = e.w / 2, hh = e.h / 2;
  if (dx !== 0) {
    let nx = e.x + dx;
    const edge = dx > 0 ? nx + hw : nx - hw;
    if (!solidAt(room, edge, e.y - hh + 1) && !solidAt(room, edge, e.y + hh - 1)) e.x = nx;
  }
  if (dy !== 0) {
    let ny = e.y + dy;
    const edge = dy > 0 ? ny + hh : ny - hh;
    if (!solidAt(room, e.x - hw + 1, edge) && !solidAt(room, e.x + hw - 1, edge)) e.y = ny;
  }
}

export function overlap(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
