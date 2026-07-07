// Dormitory hub — story-driven visual state and interactable objects.
// HUB_OBJECTS is data-driven so future interactables (Drawing Wall, Candle
// Cradle, Locked Door, each child's corner...) are added by extending the
// list, not by editing the game loop.
//
// Each object: { id, tx, ty, spr (SPR key) or draw(ctx,x,y), prompt,
//   visible(state), lines, once } — `state` is the permanent story state.

import { TS } from './world.js';

export const HUB_OBJECTS = [
  {
    id: 'mallowBed',
    tx: 21, ty: 1.6,
    prompt: 'look',
    visible: () => true,
    lines: [
      { who: '', text: 'Mallow\'s bed. The blanket is folded into a nest, the way you leave it every night.' },
      { who: '', text: 'The pillow smells faintly of candle wax.' },
    ],
  },
  {
    id: 'deathChalk',
    tx: 19.5, ty: 2.2,
    prompt: 'look',
    visible: s => s.totalDeaths > 0,
    draw(ctx, x, y, state) {
      // chalk tally marks near Mallow's bed — one per death, capped
      ctx.strokeStyle = 'rgba(200,190,220,0.55)';
      ctx.lineWidth = 1;
      const n = Math.min(state.totalDeaths, 8);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(x + i * 3 + 0.5, y);
        ctx.lineTo(x + i * 3 + 0.5, y + 6);
      }
      ctx.stroke();
    },
    lines: [
      { who: '', text: 'Small chalk marks, low on the wall, where someone kneeling could reach.' },
      { who: '', text: 'One mark for every time the candle went out. You did not make them.' },
    ],
  },
  {
    id: 'burnedRibbonHub',
    tx: 8.6, ty: 6,
    prompt: 'look',
    visible: s => s.burnedRibbonFound,
    spr: 'ribbon',
    lines: [
      { who: '', text: 'The burned ribbon, set where Elsie can see it.' },
      { who: '', text: 'It smells like smoke even when the room is cold.' },
      { who: '', text: 'Elsie says it was never hers. Elsie says that about everything she wants back.' },
    ],
  },
  {
    id: 'pramWheel',
    tx: 24.5, ty: 8.5,
    prompt: 'look',
    visible: s => s.nurseryBossDefeated,
    draw(ctx, x, y) {
      // a toy pram wheel leaning against the wall
      ctx.strokeStyle = '#8a8078';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 5, y + 5, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y + 10);
      ctx.moveTo(x, y + 5); ctx.lineTo(x + 10, y + 5);
      ctx.stroke();
    },
    lines: [
      { who: '', text: 'A small pram wheel. It still turns if you push it, squeaking a lullaby out of tune.' },
      { who: '', text: 'It rolled up the stairs by itself. Nobody carried it.' },
    ],
  },
];

// world-space position helper
export function hubObjectPos(o) {
  return { x: o.tx * TS, y: o.ty * TS, w: 12, h: 12 };
}
