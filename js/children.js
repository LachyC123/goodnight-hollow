// The other children of the Dormitory — Oren, Miri, Pip and Jude.
// One child wakes after each night Mallow clears; each keepsake carried home
// stirs another bed. Elsie stays special-cased in main.js (she is the story's
// anchor); everyone here is data-driven, like HUB_OBJECTS.
//
// Each child: { id, name, tx, ty, spr, wakeNight, dialogue } where
// `dialogue` is a list of prioritised entries for a DialogueManager
// (see storyDialogue.js). Children never consume the pending RunSummary —
// that belongs to Elsie — so their run reactions repeat until she has heard
// about the night.

import { TS } from './world.js';

const say = who => text => ({ who, text });
const oren = say('Oren');
const miri = say('Miri');
const pip = say('Pip');
const writes = text => ({ who: '', text: `Jude writes: ${text}` });

export const CHILDREN = [
  {
    id: 'oren',
    name: 'Oren',
    tx: 15.7, ty: 3.4,
    spr: 'oren',
    wakeNight: 1, // wakes once Night 1 is cleared (the ribbon came home)
    dialogue: [
      {
        id: 'oren_intro',
        speaker: 'Oren',
        priority: 85,
        repeatable: false,
        condition: () => true,
        lines: [
          { who: '', text: 'A boy is sitting up in the third bed, fists already closed.' },
          ...['You\'re the rabbit.', 'Elsie wouldn\'t shut up about you.',
            'I was asleep. I was asleep a long time, I think.',
            'Then something warm came back into the room and I got ANGRY, and the angry woke me up.',
            'That\'s fine. Angry is what I\'m for.',
            'You fight the house, rabbit. If it fights back, hit it harder.'].map(oren),
        ],
        effects: { child: 'oren', bondChange: 1, setFlags: { hasMetOren: true } },
      },
      {
        id: 'oren_ribbon_reaction',
        speaker: 'Oren',
        priority: 70,
        repeatable: false,
        condition: ({ state }) => state.burnedRibbonFound,
        lines: [
          ...['I saw what you brought back. The ribbon.', 'It\'s burned.',
            'I remember the smell. Don\'t ask me how.',
            'When you find out who lit it... you tell me first.',
            'Not Elsie. Me.'].map(oren),
        ],
        effects: { child: 'oren', childTruthChange: 1, truthChange: 1, arcStage: 1 },
      },
      {
        id: 'oren_killed_dolls',
        speaker: 'Oren',
        priority: 60,
        repeatable: true,
        condition: ({ run }) => run && run.killedCryingDolls,
        lines: [
          ...['The crying ones went quiet tonight. That was you.', 'Good.',
            'Don\'t look at me like that. Someone here has to say it.',
            '...Elsie cried about it, didn\'t she.', 'Don\'t tell me.'].map(oren),
        ],
        effects: { child: 'oren', trustChange: 1, childTruthChange: 1 },
      },
      {
        id: 'oren_spared_dolls',
        speaker: 'Oren',
        priority: 59,
        repeatable: true,
        condition: ({ run }) => run && run.sparedCryingDolls,
        lines: [
          ...['You left the crying ones alone.', 'Soft.',
            '...', 'No. Not soft.',
            'It\'s harder not to hit something. I know that better than anyone.'].map(oren),
        ],
        effects: { child: 'oren', bondChange: 1 },
      },
      {
        id: 'oren_ferocious',
        speaker: 'Oren',
        priority: 55,
        repeatable: true,
        condition: ({ run }) => run && run.ferocious,
        lines: ({ run }) => [
          ...[`${run.biggestCombo} in a row. I felt every one of them from up here.`,
            'THAT\'S it. That\'s what I keep telling Elsie.',
            'The house is bigger than us. So you hit it until it\'s smaller.',
            'You\'re not a soft little rabbit. You\'ve got teeth.',
            'Don\'t let her make you feel bad about the teeth.'].map(oren),
        ],
        effects: { child: 'oren', bondChange: 1, trustChange: 1 },
      },
      {
        id: 'oren_death_reaction',
        speaker: 'Oren',
        priority: 50,
        repeatable: true,
        condition: ({ run }) => run && run.died,
        lines: [
          ...['Get up.', 'Don\'t let it win.',
            'The house counts every time you stay down. So don\'t stay down.'].map(oren),
        ],
        effects: { child: 'oren', bondChange: 1 },
      },
      {
        id: 'oren_chatter',
        speaker: 'Oren',
        priority: 10,
        repeatable: true,
        condition: () => true,
        lines: ({ state }) => (state.totalRunsStarted % 2 === 0
          ? ['I punched the wall once. The wall said thank you.',
            'Everything in this house says thank you. I hate it.'].map(oren)
          : ['If you see the cook down there, hit him extra hard for me.',
            'Doesn\'t matter which one it is tonight. Hit them all extra hard.'].map(oren)),
      },
    ],
  },
  {
    id: 'miri',
    name: 'Miri',
    tx: 9.7, ty: 3.4,
    spr: 'miri',
    wakeNight: 2, // wakes once Night 2 is cleared (the chalk came home)
    dialogue: [
      {
        id: 'miri_intro',
        speaker: 'Miri',
        priority: 85,
        repeatable: false,
        condition: () => true,
        lines: [
          { who: '', text: 'A girl in the second bed opens her eyes as if she never closed them.' },
          ...['Hello, little lantern.', 'I dreamed you before you came. I draw the dreams sometimes.',
            'I drew a rabbit holding a needle, walking down and down and down.',
            'I\'m Miri. I\'m not well. That\'s alright.',
            'Sick children hear the house talking in its sleep. It says your name wrong on purpose.'].map(miri),
        ],
        effects: { child: 'miri', bondChange: 1, setFlags: { hasMetMiri: true } },
      },
      {
        id: 'miri_chalk_reaction',
        speaker: 'Miri',
        priority: 70,
        repeatable: false,
        condition: ({ state }) => true,
        lines: [
          ...['You brought the chalk stub home. The Teacher\'s chalk.',
            'Once upon a time there was a stick of chalk that only wrote lies.',
            'Then a rabbit carried it out of the lesson hall, and it forgot how.',
            'That\'s the whole story. It has a happy ending now. You did that.'].map(miri),
        ],
        effects: { child: 'miri', childComfortChange: 1, comfortChange: 1, arcStage: 1 },
      },
      {
        id: 'miri_killed_dolls',
        speaker: 'Miri',
        priority: 60,
        repeatable: true,
        condition: ({ run }) => run && run.killedCryingDolls,
        lines: [
          ...['The house told me what happened to the crying ones.',
            'Once upon a time there was a doll who stopped mid-tear...',
            'No. I don\'t want to finish that one.', 'Some stories should stay unfinished.'].map(miri),
        ],
        effects: { child: 'miri', fearChange: 1, trustChange: -1 },
      },
      {
        id: 'miri_spared_dolls',
        speaker: 'Miri',
        priority: 59,
        repeatable: true,
        condition: ({ run }) => run && run.sparedCryingDolls,
        lines: [
          ...['You stepped around the crying ones. I heard it in the floorboards.',
            'Once upon a time there was a rabbit who was gentle in an ungentle house.',
            'That one, I\'ll finish. Later. When I know the ending is real.'].map(miri),
        ],
        effects: { child: 'miri', bondChange: 1, childComfortChange: 1 },
      },
      {
        id: 'miri_death_reaction',
        speaker: 'Miri',
        priority: 50,
        repeatable: true,
        condition: ({ run }) => run && run.died,
        lines: [
          ...['Your candle went out. I watched the smoke find its way home.',
            'That\'s what you are, I think. Smoke that remembers being warm.',
            'Go be warm again. I\'ll draw you a door in case you need one.'].map(miri),
        ],
        effects: { child: 'miri', bondChange: 1, comfortChange: 1 },
      },
      {
        id: 'miri_chatter',
        speaker: 'Miri',
        priority: 10,
        repeatable: true,
        condition: () => true,
        lines: ({ state }) => (state.totalRunsStarted % 2 === 0
          ? ['I drew tonight before it happened. There was a lot of red, but red can mean brave.',
            'Bring me the blue moon if it falls. Only if it falls. Don\'t climb.'].map(miri)
          : ['The house dreams too. Lately it dreams about being empty. It wakes up screaming.',
            'Don\'t worry, little lantern. Screaming is just a house\'s way of crying.'].map(miri)),
      },
    ],
  },
  {
    id: 'pip',
    name: 'Pip',
    tx: 17.5, ty: 9.6,
    spr: 'pip',
    wakeNight: 3, // wakes once Night 3 is cleared (the spoon came home)
    dialogue: [
      {
        id: 'pip_intro',
        speaker: 'Pip',
        priority: 85,
        repeatable: false,
        condition: () => true,
        lines: [
          { who: '', text: 'A boy with a cracked mask pushed up on his head is sitting on the floor, grinning.' },
          ...['HA! A rabbit with a sword!', 'Okay, needle. A rabbit with a NEEDLE. Still funny.',
            'I\'m Pip. I woke up when the spoon came upstairs. Smelled like porridge. Woke up SCREAMING. Ha!',
            'That was a joke. I woke up laughing.', 'That was also a joke.',
            'If a door laughs at you down there, laugh back. They hate that.'].map(pip),
        ],
        effects: { child: 'pip', bondChange: 1, setFlags: { hasMetPip: true } },
      },
      {
        id: 'pip_spoon_reaction',
        speaker: 'Pip',
        priority: 70,
        repeatable: false,
        condition: ({ state }) => true,
        lines: [
          ...['The silver spoon! We used to say it belonged to the nicest cook.',
            'Then we used to say there was never a nicest cook.',
            'Then we stopped saying things about the kitchen at all.',
            '...Funny how that works.', 'Not funny-ha-ha. The other kind.'].map(pip),
        ],
        effects: { child: 'pip', childTruthChange: 1, arcStage: 1 },
      },
      {
        id: 'pip_killed_dolls',
        speaker: 'Pip',
        priority: 60,
        repeatable: true,
        condition: ({ run }) => run && run.killedCryingDolls,
        lines: [
          ...['Heard the crying stop tonight. All at once. Like a joke with no punchline.',
            'I laughed anyway.', 'I always laugh anyway.',
            'That\'s the trick, rabbit. If you\'re laughing, you can\'t hear yourself think about it.'].map(pip),
        ],
        effects: { child: 'pip', fearChange: 1, childTruthChange: 1 },
      },
      {
        id: 'pip_spared_dolls',
        speaker: 'Pip',
        priority: 59,
        repeatable: true,
        condition: ({ run }) => run && run.sparedCryingDolls,
        lines: [
          ...['You know the crying dolls? You left them be. I saw it in Elsie\'s face. She does a happy nose thing.',
            'HA! Don\'t tell her I said that.', 'Seriously. Don\'t. She\'ll do the SAD nose thing.'].map(pip),
        ],
        effects: { child: 'pip', bondChange: 1, comfortChange: 1 },
      },
      {
        id: 'pip_death_reaction',
        speaker: 'Pip',
        priority: 50,
        repeatable: true,
        condition: ({ run }) => run && run.died,
        lines: [
          ...['You died! I saw it! Well. Heard it. Well. Felt it, in the candle-ish way.',
            'That was funny.', 'Not funny-ha-ha. The other kind.',
            'Do the not-dying one next time. That one\'s funnier.'].map(pip),
        ],
        effects: { child: 'pip', bondChange: 1 },
      },
      {
        id: 'pip_chatter',
        speaker: 'Pip',
        priority: 10,
        repeatable: true,
        condition: () => true,
        lines: ({ state }) => (state.totalRunsStarted % 2 === 0
          ? ['Knock knock. Who\'s there? The house. The house who? Exactly. The house WHO. Nobody knows!',
            'HA! ...I\'m going to keep telling that one until it\'s funny.'].map(pip)
          : ['I saw something once. On the night everything went orange.',
            'HA! Nope. Never mind. Joke\'s over. Go stab the dark for me, rabbit.'].map(pip)),
      },
    ],
  },
  {
    id: 'jude',
    name: 'Jude',
    tx: 25.2, ty: 3.2,
    spr: 'jude',
    wakeNight: 4, // wakes once Night 4 is cleared (the music box came home)
    dialogue: [
      {
        id: 'jude_intro',
        speaker: 'Jude',
        priority: 85,
        repeatable: false,
        condition: () => true,
        lines: [
          { who: '', text: 'A hooded boy stands in the corner, holding a small chalkboard. He does not speak.' },
          writes('HELLO.'),
          writes('I AM JUDE.'),
          writes('I DO NOT TALK.'),
          { who: '', text: 'He wipes the board with his sleeve and writes again, slower.' },
          writes('I KNOW YOU.'),
          writes('FROM BEFORE.'),
        ],
        effects: { child: 'jude', bondChange: 1, setFlags: { hasMetJude: true } },
      },
      {
        id: 'jude_musicbox_reaction',
        speaker: 'Jude',
        priority: 70,
        repeatable: false,
        condition: ({ state }) => true,
        lines: [
          { who: '', text: 'Jude points at the music box, then at his own chest, then shakes his head.' },
          writes('IT PLAYED WHEN THEY TOOK US TO BE WASHED.'),
          writes('IT NEVER PLAYED FOR ME.'),
          writes('I HID.'),
          { who: '', text: 'His chalk hovers over the board for a long time.' },
          writes('I ALWAYS HID.'),
        ],
        effects: { child: 'jude', childTruthChange: 1, truthChange: 1, arcStage: 1 },
      },
      {
        id: 'jude_killed_dolls',
        speaker: 'Jude',
        priority: 60,
        repeatable: true,
        condition: ({ run }) => run && run.killedCryingDolls,
        lines: [
          { who: '', text: 'Jude looks at Mallow for a long moment, then writes.' },
          writes('THE QUIET IS NOT YOUR FAULT.'),
          writes('BUT IT IS YOUR QUIET NOW.'),
          writes('CARRY IT CAREFULLY.'),
        ],
        effects: { child: 'jude', childTruthChange: 1 },
      },
      {
        id: 'jude_spared_dolls',
        speaker: 'Jude',
        priority: 59,
        repeatable: true,
        condition: ({ run }) => run && run.sparedCryingDolls,
        lines: [
          writes('YOU LET THEM CRY.'),
          writes('GOOD.'),
          writes('CRYING MEANS STILL HERE.'),
        ],
        effects: { child: 'jude', bondChange: 1, trustChange: 1 },
      },
      {
        id: 'jude_death_reaction',
        speaker: 'Jude',
        priority: 50,
        repeatable: true,
        condition: ({ run }) => run && run.died,
        lines: [
          { who: '', text: 'Jude holds up the chalkboard before Mallow can even cross the room.' },
          writes('AGAIN.'),
        ],
        effects: { child: 'jude', bondChange: 1 },
      },
      {
        id: 'jude_chatter',
        speaker: 'Jude',
        priority: 10,
        repeatable: true,
        condition: () => true,
        lines: ({ state }) => (state.totalRunsStarted % 2 === 0
          ? [writes('DO NOT TRUST THE ROOM WITH TWO BEDS.'),
            { who: '', text: 'He underlines it twice.' }]
          : [writes('THE ATTIC REMEMBERS.'),
            writes('SO DO I.'),
            writes('NOT YET.')]),
      },
    ],
  },
];

// which children are awake in the Dormitory right now
export function awakeChildren(save) {
  return CHILDREN.filter(c => save.nightsCleared >= c.wakeNight);
}

// world-space position + hitbox for a child
export function childPos(c) {
  return { x: c.tx * TS, y: c.ty * TS, w: 10, h: 12 };
}
