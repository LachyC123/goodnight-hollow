// Lore content: the opening prologue cutscene, and the codex the player can
// read in the Dormitory to actually piece the house's story together.

// Prologue — played once, the first time the game is woken. Grounds the
// premise so the fragmented memories later have something to hang on.
export const PROLOGUE = [
  { title: 'THE HOUSE OF GOOD CHILDREN', text: 'It burned down a long time ago. Nobody agrees on when. The house disagrees most of all.' },
  { title: 'THE HOUSE OF GOOD CHILDREN', text: 'Every night at 3:33 it remembers being full of children, and wakes to look for them. It is not gentle when it looks.' },
  { title: 'MALLOW', text: 'You are Mallow — a stitched rabbit with a candle where a heart should be. A girl named Elsie made you, and dropped you from a high window so you would land soft and go get help.' },
  { title: 'MALLOW', text: 'You never found help. You found your way back. You keep finding your way back. The candle in your chest is the only warm thing left in the house.' },
  { title: 'THE RULE', text: 'When the bell rings at 3:33, the door opens, and a good child goes down into the house. Mother Mercy wrote the rules. The children are still learning which ones were lies.' },
  { title: 'THE RULE', text: 'Protect the children who wake. Carry home what the house took. And the crying dolls in the dark — decide, every night, what kind of morning you are trying to make.' },
];

// Codex entries. `unlock(state)` decides whether the entry is legible yet;
// locked entries show as "— not yet remembered —". Memory entries fill in as
// the player finds each floor's memory.
export const CODEX = [
  {
    id: 'house', title: 'The House', always: true,
    body: 'The House of Good Children. An orphanage that burned, and refused to stop being one. At 3:33 AM it wakes and re-enacts the night it lost everyone, floor by floor. Five floors: the Nursery, the Lesson Hall, the Long Kitchen, the Laundry Below, and the Attic of Rules.',
  },
  {
    id: 'mallow', title: 'Mallow', always: true,
    body: 'A rabbit doll stitched by Elsie, with a candleflame sewn into its chest. Thrown from a window on the last night so it could "land soft and get help." It came back instead. It always comes back. The candle is what the house is most afraid of.',
  },
  {
    id: 'elsie', title: 'Elsie', always: true,
    body: 'The girl who made Mallow. She waits in the Dormitory and cannot go down into the house herself. She asks Mallow not to hurt the crying dolls. She is trying to remember something she asked the house to help her forget.',
  },
  {
    id: 'dolls', title: 'The Crying Dolls', always: true,
    body: 'They appear on every floor, weeping and grey. Elsie begs you not to hurt them. What they are is the game\'s central question — and what you choose to do with them, every night, decides what kind of morning finally comes.',
  },
  {
    id: 'mercy', title: 'Mother Mercy', unlock: s => s.nurseryBossDefeated || s.nightsCleared >= 1,
    body: 'She ran the House. She wrote the rules on the walls: good children do not cry, do not remember, do not ask about the fourth floor. Every keepsake you carry home is a piece of what she did. She waits on the fifth floor, and she is very glad to see you.',
  },
  {
    id: 'candle', title: 'The Candleflame', always: true,
    body: 'The light in Mallow\'s chest. It grows as you fight and can be spent in a burst. The house is dark on purpose — the candle is the only thing that was ever allowed to be warm here. The brighter it burns, the more the house notices you.',
  },
  {
    id: 'awareness', title: 'The House Is Awake', unlock: s => (s.houseAwareness || 0) >= 20,
    body: 'The house learns. The more fiercely you fight — high combos, cruelty to the dolls, turning its own attacks back on it — the more it wakes up, and the harder it pushes back. Gentle nights let it stay half-asleep. The choice of how to survive is also a choice of what to wake.',
  },
];

// Per-floor memory summaries — legible once that night's memory is found.
export const MEMORY_LORE = {
  1: { title: 'Memory: The Nursery', body: 'A crib, a burned ribbon, chalk marks nobody finished. A child was made small and quiet for frightening the others. The ribbon burned first, then the name attached to it.' },
  2: { title: 'Memory: The Lesson Hall', body: 'Rows of children who have not moved in a very long time. A hand raised so long the arm went thin as a candlewick. On the board, four hundred times: I WILL NOT ASK ABOUT THE FOURTH FLOOR.' },
  3: { title: 'Memory: The Long Kitchen', body: 'A bowl of grey porridge that never empties, and a child bolted to a chair, whispering "I\'m grateful" until it stopped meaning anything. The bowl was never meant to empty.' },
  4: { title: 'Memory: The Laundry Below', body: 'A child scrubbed pink and raw, asking "Am I clean yet?" The Laundress touched the place over the heart: "There is always one spot here that will not come out."' },
  5: { title: 'Memory: The Attic of Rules', body: 'A girl at the window with a stitched rabbit. "If I drop you, you\'ll land soft, and you can go get help." She hugged it hard enough to feel the candle, still warm, and whispered into its missing ear: "Come back. Promise you\'ll come back." This memory is your own.' },
};
