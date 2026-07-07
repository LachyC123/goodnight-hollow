// Story system — permanent story state, per-run temporary state, and the
// RunSummary that connects them. This is the spine of the full game's story:
// child bonds, Comfort vs Truth, story flags, run history, story inventory,
// acts, and (later) endings all live here.
//
// Permanent story values are stored inside the save object (save.story) so
// they persist with the existing versioned save. Temporary run values live
// on the StoryManager and reset when a new Night begins.

// ---------- permanent story state ----------

export function defaultChild() {
  return { bond: 0, trust: 0, fear: 0, comfort: 0, truth: 0, arcStage: 0 };
}

export function defaultStoryState() {
  return {
    // global story values
    totalRunsStarted: 0,
    totalDeaths: 0,
    totalVictories: 0,
    nurseryBossDefeated: false,
    firstMemoryFound: false,
    burnedRibbonFound: false,
    hasSeenGoodChildrenDoNotRemember: false,
    hasMetElsie: false,
    hasReceivedElsieRequest: false,
    hasCompletedElsieRequest: false,
    hasFailedElsieRequest: false,
    totalCryingDollsKilled: 0,
    totalCryingDollsSpared: 0,
    comfortScore: 0,          // Comfort vs Truth — not good vs evil
    truthScore: 0,
    houseAwareness: 0,        // house learning system (future)
    currentAct: 1,            // acts 1..5 (future)
    unlockedFinalRoute: false,
    // story inventory / memory log (Burned Ribbon now; more items later)
    inventory: {},
    // one-time dialogue ids that have been seen
    seenDialogue: {},
    // child bond structure — only Elsie is active; the rest are ready
    children: {
      elsie: defaultChild(),
      oren: defaultChild(),
      miri: defaultChild(),
      pip: defaultChild(),
      jude: defaultChild(),
    },
    // run history: compact summaries of past runs (most recent last)
    runHistory: [],
    // the summary of the run that just ended, until Elsie has reacted to it
    lastRun: null,
  };
}

// ---------- per-run temporary state ----------

export function freshRunTemp(floor = null) {
  return {
    currentRunStarted: false,
    currentRunFloor: floor,
    currentRunRoomsCleared: 0,
    currentRunMemoriesFound: 0,
    currentRunCryingDollsKilled: 0,
    currentRunCryingDollsSpared: 0,
    cryingDollsSeen: 0,
    currentRunAcceptedBargain: false,
    currentRunBrokeRule: false,
    currentRunBossReached: false,
    currentRunBossDefeated: false,
    currentRunDeathCause: null,
    currentRunResult: null, // 'death' | 'victory' | 'return'
  };
}

// ---------- story manager ----------

const MAX_RUN_HISTORY = 50;

export class StoryManager {
  // save: the whole save object (owned by save.js). save.story is ours.
  constructor(save, persist) {
    this.save = save;
    this.persist = persist;
    this.run = freshRunTemp();
  }

  get state() { return this.save.story; }
  child(name) { return this.state.children[name]; }

  flag(name) { return !!this.state[name]; }
  setFlag(name, value = true) { this.state[name] = value; this.persist(); }

  hasSeen(dialogueId) { return !!this.state.seenDialogue[dialogueId]; }
  markSeen(dialogueId) { this.state.seenDialogue[dialogueId] = true; this.persist(); }

  addItem(id) { this.state.inventory[id] = true; this.persist(); }
  hasItem(id) { return !!this.state.inventory[id]; }

  // ----- run lifecycle -----

  beginRun(floorName) {
    this.run = freshRunTemp(floorName);
    this.run.currentRunStarted = true;
    this.state.totalRunsStarted++;
    this.persist();
  }

  onRoomCleared() { this.run.currentRunRoomsCleared++; }
  onDollSeen(n = 1) { this.run.cryingDollsSeen += n; }

  onDollKilled() {
    this.run.currentRunCryingDollsKilled++;
    this.state.totalCryingDollsKilled++;
    this.state.truthScore++; // cruelty is a kind of truth; the moral axis remembers
    this.persist();
  }

  onMemoryFound(memoryId) {
    this.run.currentRunMemoriesFound++;
    if (memoryId === 'burnedRibbon' && !this.state.burnedRibbonFound) {
      this.state.burnedRibbonFound = true;
      this.state.firstMemoryFound = true;
      this.state.truthScore++;
      this.addItem('burnedRibbon');
    }
    this.persist();
  }

  onBossReached() { this.run.currentRunBossReached = true; }

  onBossDefeated(bossKind) {
    this.run.currentRunBossDefeated = true;
    if (bossKind === 'nanny' && !this.state.nurseryBossDefeated) {
      this.state.nurseryBossDefeated = true;
      // defeating The Nanny after finding the memory adds truth
      if (this.state.burnedRibbonFound) this.state.truthScore++;
    }
    this.persist();
  }

  // result: 'death' | 'victory' | 'return'
  endRun(result, deathCause = null) {
    const r = this.run;
    r.currentRunResult = result;
    r.currentRunDeathCause = deathCause;
    r.currentRunCryingDollsSpared = Math.max(0, r.cryingDollsSeen - r.currentRunCryingDollsKilled);
    if (r.currentRunCryingDollsSpared > 0) {
      this.state.totalCryingDollsSpared += r.currentRunCryingDollsSpared;
    }
    if (result === 'death') this.state.totalDeaths++;
    if (result === 'victory') this.state.totalVictories++;

    const summary = buildRunSummary(r, this.state);

    // Elsie's request resolves at the end of the run (moral choice, not menu)
    if (this.state.hasReceivedElsieRequest) {
      if (summary.killedCryingDolls) this.state.hasFailedElsieRequest = true;
      else if (summary.sparedCryingDolls) this.state.hasCompletedElsieRequest = true;
    }

    this.state.lastRun = summary;
    this.state.runHistory.push(summary);
    if (this.state.runHistory.length > MAX_RUN_HISTORY) this.state.runHistory.shift();
    this.run = freshRunTemp();
    this.persist();
    return summary;
  }

  // the run summary Elsie has not yet reacted to (null once consumed)
  get pendingRun() {
    const lr = this.state.lastRun;
    return lr && !lr.reacted ? lr : null;
  }
  consumePendingRun() {
    if (this.state.lastRun) { this.state.lastRun.reacted = true; this.persist(); }
  }

  // apply a dialogue entry's effects.
  // Global: comfortChange, truthChange. Child (needs fx.child): bondChange,
  // trustChange, fearChange, childComfortChange, childTruthChange, arcStage.
  applyEffects(fx) {
    if (!fx) return;
    if (fx.comfortChange) this.state.comfortScore += fx.comfortChange;
    if (fx.truthChange) this.state.truthScore += fx.truthChange;
    if (fx.child) {
      const c = this.child(fx.child);
      if (fx.bondChange) c.bond += fx.bondChange;
      if (fx.trustChange) c.trust += fx.trustChange;
      if (fx.fearChange) c.fear += fx.fearChange;
      if (fx.childComfortChange) c.comfort += fx.childComfortChange;
      if (fx.childTruthChange) c.truth += fx.childTruthChange;
      if (typeof fx.arcStage === 'number') c.arcStage = Math.max(c.arcStage, fx.arcStage);
    }
    if (fx.setFlags) for (const [k, v] of Object.entries(fx.setFlags)) this.state[k] = v;
    this.persist();
  }
}

// ---------- run summary ----------

// A plain-data description of what happened in one run, consumed by the
// Dormitory dialogue system (and later: house learning, endings).
export function buildRunSummary(run, state) {
  return {
    result: run.currentRunResult,                 // 'death' | 'victory' | 'return'
    died: run.currentRunResult === 'death',
    deathCause: run.currentRunDeathCause,
    floor: run.currentRunFloor,
    roomsCleared: run.currentRunRoomsCleared,
    foundMemory: run.currentRunMemoriesFound > 0,
    foundBurnedRibbon: run.currentRunMemoriesFound > 0 && state.burnedRibbonFound,
    killedCryingDolls: run.currentRunCryingDollsKilled > 0,
    cryingDollsKilled: run.currentRunCryingDollsKilled,
    sparedCryingDolls: run.cryingDollsSeen > 0 && run.currentRunCryingDollsKilled === 0,
    cryingDollsSpared: run.currentRunCryingDollsSpared,
    encounteredCryingDolls: run.cryingDollsSeen > 0,
    completedElsieRequest: state.hasReceivedElsieRequest &&
      run.cryingDollsSeen > 0 && run.currentRunCryingDollsKilled === 0,
    failedElsieRequest: state.hasReceivedElsieRequest && run.currentRunCryingDollsKilled > 0,
    brokeRule: run.currentRunBrokeRule,
    tookBargain: run.currentRunAcceptedBargain,
    bossReached: run.currentRunBossReached,
    bossDefeated: run.currentRunBossDefeated,
    reacted: false, // set true once the Dormitory reaction has played
  };
}
