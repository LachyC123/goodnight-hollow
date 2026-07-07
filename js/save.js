// Save / permanent progression.
// One module owns everything that persists between runs and between nights,
// so future systems (child bonds, Comfort vs Truth, house learning, endings)
// only ever have to add fields here.

const SAVE_KEY = 'goodnightHollowSave';
export const SAVE_VERSION = 2;

// The default shape of a save. New permanent systems extend this object:
//   bonds        — per-child relationship levels (Elsie, Oren, Miri, Pip, Jude...)
//   comfort/truth— the two sides of the moral axis (doll kills feed `truth` for now)
//   houseMemory  — what the house has learned about how the player plays
//   flags        — one-off story flags (endings seen, routes opened, etc.)
export function defaultSave() {
  return {
    version: SAVE_VERSION,
    nights: 0,               // total runs attempted (win or lose)
    nightsCleared: 0,        // highest night beaten
    keepsakes: {},           // permanent unlocks, by id (see upgrades.js)
    memoriesSeen: {},        // memory rooms witnessed, by night
    dollKillsTotal: 0,
    metElsie: false,
    endingSeen: false,
    bonds: { elsie: 0 },     // relationship levels (future: oren, miri, pip, jude)
    comfort: 0,              // Comfort vs Truth moral axis (future system)
    truth: 0,
    houseMemory: {},         // house learning system (future system)
    flags: {},               // misc one-off story flags
    // legacy First Night Demo fields, kept so old saves keep working
    hasRibbon: false, sawMemory: false, wonOnce: false,
  };
}

// Upgrade older save formats in place. Add a block per version bump.
function migrate(s) {
  // v0/v1: the First Night Demo format
  if (!s.keepsakes) s.keepsakes = {};
  if (!s.memoriesSeen) s.memoriesSeen = {};
  if (s.hasRibbon && !s.keepsakes.ribbon) s.keepsakes.ribbon = true;
  if (s.wonOnce && !s.nightsCleared) s.nightsCleared = 1;
  if (s.sawMemory && !s.memoriesSeen[1]) s.memoriesSeen[1] = true;
  // v2: bonds / moral axis / house learning containers
  if (!s.bonds) s.bonds = { elsie: 0 };
  if (!s.houseMemory) s.houseMemory = {};
  if (!s.flags) s.flags = {};
  if (typeof s.comfort !== 'number') s.comfort = 0;
  if (typeof s.truth !== 'number') s.truth = 0;
  s.version = SAVE_VERSION;
  return s;
}

export function loadSave() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
  catch (e) { raw = {}; }
  return migrate(Object.assign(defaultSave(), raw));
}

export function writeSave(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* private mode */ }
}
