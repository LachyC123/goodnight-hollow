// Upgrades — data-driven effect tables for temporary Pretends and permanent
// Keepsakes. Gameplay code asks questions ("what's my damage multiplier?")
// instead of checking individual flags, so adding a new upgrade is a single
// new entry here (plus its definition in nights.js for Pretends).
//
// A "mods" object collects every numeric hook the game currently supports.
// New hooks (new weapons, house-learning counters, bond perks...) get added
// to DEFAULT_MODS and consumed where relevant.

export const DEFAULT_MODS = {
  damageMult: 1,          // needle damage multiplier
  damageMultLowHp: 1,     // extra damage multiplier while at/below half stitches
  speedMult: 1,           // movement speed
  dodgeCdMult: 1,         // dodge cooldown multiplier (lower = faster recovery)
  attackCdMult: 1,        // attack cooldown multiplier (lower = faster needle)
  flameGainMult: 1,       // candleflame gain multiplier
  healMult: 1,            // stitch pickup healing multiplier
  bonusMaxStitches: 0,    // extra max stitches
  healOnRoomClear: 0,     // stitches mended when a room goes quiet
  reviveOncePerNight: false, // survive a killing blow once per run
};

// Temporary upgrades: applied for a single run. ids match nights.js PRETENDS.
export const PRETEND_EFFECTS = {
  brave:  { damageMultLowHp: 2 },
  loved:  { bonusMaxStitches: 2, healNow: 2 },
  quick:  { speedMult: 1.2, dodgeCdMult: 0.7 },
  ember:  { flameGainMult: 1.5 },
  mended: { healOnRoomClear: 1 },
  fierce: { attackCdMult: 0.2 / 0.32 },
};

// Permanent unlocks: applied whenever they are owned in the save.
export const KEEPSAKE_EFFECTS = {
  ribbon:   { bonusMaxStitches: 1 },
  chalk:    { flameGainMult: 1.5 },
  spoon:    { healMult: 2 },
  musicbox: { dodgeCdMult: 0.5 },
  locket:   { reviveOncePerNight: true },
};

function fold(mods, eff) {
  if (!eff) return;
  if (eff.damageMult) mods.damageMult *= eff.damageMult;
  if (eff.damageMultLowHp) mods.damageMultLowHp *= eff.damageMultLowHp;
  if (eff.speedMult) mods.speedMult *= eff.speedMult;
  if (eff.dodgeCdMult) mods.dodgeCdMult *= eff.dodgeCdMult;
  if (eff.attackCdMult) mods.attackCdMult *= eff.attackCdMult;
  if (eff.flameGainMult) mods.flameGainMult *= eff.flameGainMult;
  if (eff.healMult) mods.healMult *= eff.healMult;
  if (eff.bonusMaxStitches) mods.bonusMaxStitches += eff.bonusMaxStitches;
  if (eff.healOnRoomClear) mods.healOnRoomClear += eff.healOnRoomClear;
  if (eff.reviveOncePerNight) mods.reviveOncePerNight = true;
}

// Combine owned keepsakes + active pretends (an array of ids) into one mods
// object. Future sources of modifiers (bond perks, curses, rule rooms) fold
// in here the same way.
export function computeMods(keepsakes = {}, pretendIds = []) {
  const mods = Object.assign({}, DEFAULT_MODS);
  for (const k of Object.keys(KEEPSAKE_EFFECTS)) {
    if (keepsakes[k]) fold(mods, KEEPSAKE_EFFECTS[k]);
  }
  for (const id of pretendIds) fold(mods, PRETEND_EFFECTS[id]);
  return mods;
}
