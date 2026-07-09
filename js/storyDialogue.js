// Story dialogue — conditional, prioritised dialogue entries.
// Each entry has an id, speaker, lines, a condition, effects, and a priority.
// The DialogueManager picks the highest-priority entry whose condition holds,
// so story-critical dialogue always beats generic hub chatter.
//
// Priority order (higher number wins):
//   90 first-time story scene       (wall rule reveal)
//   80 new memory reaction          (Burned Ribbon)
//   70 boss defeat reaction         (The Nanny With No Face)
//   60 moral choice reaction        (killed / spared Crying Dolls)
//   50 death reaction
//   40 relationship / bond progression
//   30 request briefing (pre-run)
//   10 repeatable hub dialogue

const E = who => text => ({ who, text });
const elsie = E('Elsie');

// ctx passed to conditions: { story, state, run } where
//   story = StoryManager, state = permanent story values,
//   run   = pending RunSummary (or null when none is waiting for a reaction)
export const ELSIE_DIALOGUE = [
  {
    id: 'elsie_wall_rule_reveal',
    speaker: 'Elsie',
    priority: 90,
    repeatable: false,
    condition: ({ state }) => state.nurseryBossDefeated && state.burnedRibbonFound &&
      !state.hasSeenGoodChildrenDoNotRemember,
    lines: [
      { who: '', text: 'On the Dormitory wall, in paint that has not dried: GOOD CHILDREN DO NOT REMEMBER.' },
      ...['That wasn\'t there before.', 'Was it?', 'Please tell me it wasn\'t.', 'No.',
        'Don\'t tell me.', 'If you tell me, then I\'ll know.'].map(elsie),
    ],
    effects: { setFlags: { hasSeenGoodChildrenDoNotRemember: true } },
  },
  {
    id: 'elsie_burned_ribbon_reaction',
    speaker: 'Elsie',
    priority: 80,
    repeatable: false,
    condition: ({ state }) => state.burnedRibbonFound,
    lines: [
      ...['That ribbon…', 'No. It isn\'t mine.', 'I never had one like that.', 'I don\'t like red.',
        'I don\'t like things that smell like smoke.',
        'I don\'t like remembering that I don\'t like them.'].map(elsie),
      { who: '', text: 'Elsie is quiet for a long moment.' },
      ...['Can you put it somewhere I can\'t see it?', 'No.', 'Wait.', 'Put it somewhere I can.'].map(elsie),
    ],
    effects: { child: 'elsie', childTruthChange: 1, setFlags: { firstMemoryFound: true } },
  },
  {
    id: 'elsie_nanny_defeated',
    speaker: 'Elsie',
    priority: 70,
    repeatable: false,
    condition: ({ state }) => state.nurseryBossDefeated,
    lines: ({ state }) => [
      ...['The crying stopped.', 'Not all of it.', 'But some.', 'Was she very tall?',
        'Did she have a face?', 'No…', 'No, of course she didn\'t.',
        'They never did when they were angry.'].map(elsie),
      ...(state.burnedRibbonFound
        ? ['I think she used to tuck us in.', 'I think she was small once.', 'Like us.'].map(elsie)
        : []),
    ],
    effects: { child: 'elsie', truthChange: 1, arcStage: 1 },
  },
  {
    id: 'elsie_killed_dolls',
    speaker: 'Elsie',
    priority: 60,
    repeatable: true, // reacts each run it happens; gated by pendingRun
    consumesRun: true,
    condition: ({ run }) => run && run.killedCryingDolls,
    lines: [
      ...['You hurt them.', 'I heard them.', 'I know they aren\'t real.', 'I know they aren\'t children.',
        'I know that.', 'I know that.', 'I know that.'].map(elsie),
      { who: '', text: 'Elsie stares at the floor.' },
      elsie('Why does knowing not help?'),
    ],
    // hasFailedElsieRequest is set by StoryManager.endRun (gated on the request)
    effects: { child: 'elsie', trustChange: -1, fearChange: 1, truthChange: 1 },
  },
  {
    id: 'elsie_spared_dolls',
    speaker: 'Elsie',
    priority: 59,
    repeatable: true,
    consumesRun: true,
    condition: ({ run }) => run && run.sparedCryingDolls,
    lines: [
      ...['You didn\'t hurt them?', 'Thank you.', 'I don\'t know if they know you helped.', 'But I do.',
        'Maybe that matters.',
        'Maybe little things matter even when the house says they don\'t.'].map(elsie),
    ],
    // hasCompletedElsieRequest is set by StoryManager.endRun (gated on the request)
    effects: { child: 'elsie', bondChange: 2, trustChange: 1, comfortChange: 1 },
  },
  {
    id: 'elsie_death_reaction',
    speaker: 'Elsie',
    priority: 50,
    repeatable: true,
    consumesRun: true,
    condition: ({ run }) => run && run.died,
    lines: [
      ...['You came back.', 'That means it didn\'t keep you.', 'I think that counts as winning.',
        'Maybe not to the house.', 'But to me.'].map(elsie),
    ],
    effects: { child: 'elsie', bondChange: 1, comfortChange: 1 },
  },
  {
    id: 'elsie_flawless',
    speaker: 'Elsie',
    priority: 46,
    repeatable: true,
    consumesRun: true,
    condition: ({ run }) => run && run.flawless && !run.died,
    lines: [
      ...['Not a stitch out of place.', 'You went down there, into all of it, and came back whole.',
        'I counted your seams while you slept. All of them. Still yours.',
        'I don\'t know how you do it.', 'I\'m glad you do.'].map(elsie),
    ],
    effects: { child: 'elsie', bondChange: 1, comfortChange: 1 },
  },
  {
    id: 'elsie_ferocious',
    speaker: 'Elsie',
    priority: 45,
    repeatable: true,
    consumesRun: true,
    condition: ({ run }) => run && run.ferocious,
    lines: ({ run }) => [
      ...['I heard it. All the way up here.', 'The way you fought tonight.',
        'Your candle was so bright it came under the door.',
        `${run.biggestCombo} of them, one after another, and you didn\'t stop.`,
        'I\'m not scared of you.', 'I\'m scared of how the house is teaching you to be.',
        'Come back gentle sometimes. For me.'].map(elsie),
    ],
    effects: { child: 'elsie', fearChange: 1, truthChange: 1 },
  },
  {
    id: 'elsie_graceful',
    speaker: 'Elsie',
    priority: 44,
    repeatable: true,
    consumesRun: true,
    condition: ({ run }) => run && run.graceful,
    lines: [
      ...['You moved like water tonight.', 'In and out of all those grabbing hands, and never caught.',
        'Mother Mercy used to say still children are good children.',
        'But you weren\'t still. You were quick, and you were kind, and you came home.',
        'I think quick is better than still.'].map(elsie),
    ],
    effects: { child: 'elsie', bondChange: 1, comfortChange: 1 },
  },
  {
    id: 'elsie_request',
    speaker: 'Elsie',
    priority: 30,
    repeatable: false,
    condition: ({ state }) => state.hasMetElsie && !state.hasReceivedElsieRequest,
    lines: [
      ...['The door will open at 3:33.', 'It always does.',
        'If you see the crying dolls… please don\'t hurt them.', 'I know they look wrong.',
        'But maybe they\'re scared too.', 'Good children are gentle.', 'Mother Mercy said that.',
        'Mother Mercy said lots of things.'].map(elsie),
    ],
    effects: { setFlags: { hasReceivedElsieRequest: true } },
  },
  {
    id: 'elsie_house_awake',
    speaker: 'Elsie',
    priority: 20,
    repeatable: true,
    condition: ({ state }) => (state.houseAwareness || 0) >= 40,
    lines: [
      ...['The house is louder lately.', 'It says your name in its sleep now. It didn\'t used to.',
        'I think it\'s afraid of you.', 'I don\'t know if that\'s good.',
        'Afraid things bite. Be careful it doesn\'t bite back harder.'].map(elsie),
    ],
  },
  {
    id: 'elsie_pre_run_repeat',
    speaker: 'Elsie',
    priority: 10,
    repeatable: true,
    condition: ({ state }) => state.hasReceivedElsieRequest,
    lines: [
      ...['Please be careful.', 'And please remember what I asked.',
        'Unless remembering makes it harder.', 'Sometimes it does.'].map(elsie),
    ],
  },
];

// Scene 1: First Wake — played as the intro sequence when the demo starts.
export const ELSIE_FIRST_WAKE = [
  { who: '', text: 'The House of Good Children. 3:33 AM.' },
  ...['Mallow?', 'You came back wrong this time.', 'I\'m sorry. I didn\'t mean that.',
    'It\'s just… your candle is smaller.', 'When the bell rings, you have to go.',
    'That\'s the rule.', 'I don\'t know who wrote it.',
    'I only know what happens when we don\'t listen.'].map(elsie),
];

// The Nanny With No Face — story dialogue (Night 1 boss).
export function nannyIntroLines(story) {
  const lines = ['Little thing.', 'Stitched thing.', 'Why are you out of bed?',
    'The small ones cry when they see you.', 'I know what to do with crying things.'];
  if (story.run.currentRunCryingDollsKilled > 0) {
    lines.push('Oh.', 'You know too.', 'Quiet is kinder.');
  } else if (story.run.cryingDollsSeen > 0) {
    lines.push('You let them cry?', 'Cruel little rabbit.', 'Cruel, cruel, cruel.');
  }
  return lines.map(E('THE NANNY WITH NO FACE'));
}

export const NANNY_DEFEAT_LINES = ['I was small once.', 'I held the blanket corners.',
  'I told them it would be morning.', 'I lied so softly.'].map(E('THE NANNY WITH NO FACE'));

// ---------- dialogue manager ----------

export class DialogueManager {
  constructor(story, entries = ELSIE_DIALOGUE) {
    this.story = story;
    this.entries = entries;
  }

  // Pick the best entry for the current story state + pending run summary.
  // Returns { lines, apply } or null. `apply()` must be called when the
  // dialogue finishes: it applies effects, marks one-time entries seen, and
  // consumes the pending run summary for run-reaction entries.
  pick() {
    const story = this.story;
    const ctx = { story, state: story.state, run: story.pendingRun };
    const sorted = [...this.entries].sort((a, b) => b.priority - a.priority);
    for (const e of sorted) {
      if (!e.repeatable && story.hasSeen(e.id)) continue;
      if (!e.condition(ctx)) continue;
      const lines = typeof e.lines === 'function' ? e.lines(ctx) : e.lines;
      return {
        id: e.id,
        priority: e.priority,
        lines,
        apply: () => {
          story.applyEffects(e.effects);
          if (!e.repeatable) story.markSeen(e.id);
          if (e.consumesRun) story.consumePendingRun();
        },
      };
    }
    return null;
  }
}
