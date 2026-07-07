// Run state — everything that lives and dies with a single night's run.
// Keeping this off the Game class means new run-scoped systems (multiple
// pretends, rule rooms, child requests, run seeds, house-learning inputs)
// only touch this file and the places that read it.

import { buildRoom } from './rooms.js';

// The plan for one run: an ordered list of room descriptors.
// New room types (rule rooms, child request rooms, shops...) are added by
// extending this list and teaching rooms.js/main.js about the type.
export function buildRunPlan(night) {
  return [
    { type: 'combat', variant: 0 },
    { type: 'combat', variant: 1 },
    { type: 'memory', variant: 0 },
    { type: 'combat', variant: 2 },
    { type: 'combat', variant: 3 },
    { type: 'boss', variant: 0 },
  ];
}

export class RunState {
  constructor(night) {
    this.night = night;
    this.plan = buildRunPlan(night);
    this.rooms = this.plan.map(r => buildRoom(r.type, r.variant, night));
    this.roomIndex = 0;
    this.pretends = [];        // active pretend ids (array: supports several later)
    this.pretendOffered = false;
    // run stats — for end-of-run summaries and, later, house learning
    this.dollKills = 0;
    this.dollsSeen = 0;
    this.roomsCleared = 0;
    this.damageTaken = 0;
    this.timeElapsed = 0;
  }

  get room() { return this.rooms[this.roomIndex]; }
  get isLastRoom() { return this.roomIndex >= this.rooms.length - 1; }

  hasPretend(id) { return this.pretends.includes(id); }
  addPretend(id) { if (!this.hasPretend(id)) this.pretends.push(id); }
}
