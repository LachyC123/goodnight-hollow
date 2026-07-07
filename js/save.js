// Save / permanent progression.
// One module owns everything that persists between runs and between nights,
// so future systems (child bonds, Comfort vs Truth, house learning, endings)
// only ever have to add fields here.

const SAVE_KEY = 'goodnightHollowSave';
export const SAVE_VERSION = 3;

import { defaultStoryState } from './story.js';

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
    story: defaultStoryState(), // the story system (js/story.js) owns this
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
  // v3: story system container (js/story.js). Map legacy demo progress into it
  // so existing saves keep their story position.
  if (!s.story) {
    const st = defaultStoryState();
    st.hasMetElsie = !!s.metElsie;
    st.hasReceivedElsieRequest = !!s.metElsie; // the old intro included the request
    st.totalRunsStarted = s.nights || 0;
    st.totalCryingDollsKilled = s.dollKillsTotal || 0;
    st.comfortScore = s.comfort || 0;
    st.truthScore = s.truth || 0;
    st.children.elsie.bond = (s.bonds && s.bonds.elsie) || 0;
    if (s.nightsCleared >= 1) {
      st.totalVictories = 1;
      st.nurseryBossDefeated = true;
      st.hasSeenGoodChildrenDoNotRemember = true; // the rule was already on the wall
      st.seenDialogue.elsie_wall_rule_reveal = true;
      st.seenDialogue.elsie_nanny_defeated = true;
    }
    if (s.memoriesSeen && s.memoriesSeen[1]) {
      st.burnedRibbonFound = true;
      st.firstMemoryFound = true;
      st.inventory.burnedRibbon = true;
      st.seenDialogue.elsie_burned_ribbon_reaction = true;
    }
    s.story = st;
  } else {
    // fill any story fields added since the save was written
    s.story = Object.assign(defaultStoryState(), s.story);
    s.story.children = Object.assign(defaultStoryState().children, s.story.children);
  }
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
