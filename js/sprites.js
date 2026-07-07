// Code-generated pixel-art sprites. No image assets.
// Each sprite is a string map; each character maps to a palette colour ('.' = transparent).

const PAL = {
  '.': null,
  'K': '#14101c', // black outline
  'G': '#55506a', // grey
  'g': '#322d44', // dark grey
  'W': '#e8e0d8', // white
  'w': '#b8b0a8', // dim white
  'P': '#d8c4b0', // mallow cream
  'p': '#b09a86', // darker cream
  'O': '#ffb347', // flame orange
  'o': '#ff6b35', // flame red-orange
  'Y': '#ffe08a', // yellow
  'B': '#5a6e9e', // cloak blue
  'b': '#3a4a72', // dark blue
  'R': '#b03a48', // red
  'r': '#6e2430', // dark red
  'T': '#8a6a4a', // thread brown
  't': '#5e4630', // dark brown
  'L': '#7a6a92', // blanket lavender
  'l': '#574a6e', // dark lavender
  'N': '#3a3054', // nanny dress
  'S': '#c9b8d8', // pale lavender skin (elsie)
  'H': '#caa356', // hair gold
  'E': '#9fd8c0', // eerie green
  'M': '#7e8aa6', // metal
  'C': '#a89f6e', // cape olive
  'c': '#6e6848', // dark cape
  'q': '#d88a9a', // mouse-tail pink
  'D': '#6a86b8', // chalk blue
  'd': '#c87a9e', // chalk pink
};

function makeSprite(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const col = PAL[rows[y][x]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    }
  }
  return c;
}

export const SPR = {};

// --- Mallow: stitched rabbit doll, big button eye, one missing ear, cape, flame in chest ---
SPR.mallow = makeSprite([
  '...PP.......',
  '...PP.......',
  '...PP...pp..',
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  '.PKKKPPPrrP.',
  '.PKtKPPPPPP.',
  '.PKKKPtPPPP.',
  '..PPPPPPPP..',
  '.CCCCOOCCCC.',
  '.CCCOooOCCC.',
  '.CCCCOOCCCC.',
  '..cCCCCCCc..',
  '..PP....PP..',
]);
SPR.mallowHurt = makeSprite([
  '...WW.......',
  '...WW.......',
  '...WW...ww..',
  '..WWWWWWWW..',
  '.WWWWWWWWWW.',
  '.WKKKWWWrrW.',
  '.WKtKWWWWWW.',
  '.WKKKWtWWWW.',
  '..WWWWWWWW..',
  '.CCCCOOCCCC.',
  '.CCCOooOCCC.',
  '.CCCCOOCCCC.',
  '..cCCCCCCc..',
  '..WW....WW..',
]);

// --- Needle (drawn rotated in code) ---
SPR.needle = makeSprite([
  'M...........',
  '.MM.........',
  '..MMMMMMMMM.',
  '.MM.........',
  'M...........',
]);

// --- Button Mouse (pink tail, like the reference mice) ---
SPR.buttonMouse = makeSprite([
  '.gg...gg..',
  'gGGg.gGGg.',
  '.gGGGGGg..',
  '.GGKGKGG..',
  '.GGGGGGGqq',
  '..GGtGG..q',
  '...g.g..q.',
]);

// --- Blanket Crawler (dormant) ---
SPR.crawlerDown = makeSprite([
  '..............',
  '....LLLLLL....',
  '..LLLLLLLLLL..',
  '.LLLlLLLLlLL..',
  'LLLLLLLLLLLLL.',
  'lLlLlLlLlLlLl.',
]);
// --- Blanket Crawler (risen) ---
SPR.crawlerUp = makeSprite([
  '....LLLLLL....',
  '..LLLLLLLLLL..',
  '.LLLKLLLLKLL..',
  '.LLLLLLLLLLL..',
  'LLLLLKKKLLLLL.',
  'LLLLLLLLLLLLL.',
  'lLlLlLlLlLlLl.',
  '.l..l..l..l...',
]);

// --- Crying Doll (grey, cracked head, tears — like the reference) ---
SPR.cryingDoll = makeSprite([
  '..wWWWW...',
  '.WWKWWWW..',
  '.WKWWWKW..',
  '.WEWWWEW..',
  '.WEWrWEW..',
  '..WWWWW...',
  '.wWWWWWw..',
  '.wWWWWWw..',
  '.wWWWWWw..',
  '..WW.WW...',
  '..ww.ww...',
]);

// --- Elsie ---
SPR.elsie = makeSprite([
  '..HHHHHH..',
  '.HHHHHHHH.',
  '.HSSSSSSH.',
  '.HSKSSKSH.',
  '.HSSSSSSH.',
  '.HSSrSSSH.',
  '..SSSSSS..',
  '..WWWWWW..',
  '.WWWWWWWW.',
  '.WWWWWWWW.',
  '.WWWWWWWW.',
  '.WWWWWWWW.',
  '..SS..SS..',
  '..ww..ww..',
]);

// --- Nanny With No Face ---
SPR.nanny = makeSprite([
  '......gggggg......',
  '.....gGGGGGGg.....',
  '.....GGGGGGGG.....',
  '.....GGGGGGGG.....',
  '.....GGGGGGGG.....',
  '.....gGGGGGGg.....',
  '......GGGGGG......',
  '....NNNNNNNNNN....',
  '...NNNNNNNNNNNN...',
  '..NNNNNNNNNNNNNN..',
  '..NNWNNNNNNNNWNN..',
  '..NNWNNNNNNNNWNN..',
  '..NNWNNNNNNNNWNN..',
  '.NNNNNNNNNNNNNNNN.',
  '.NNNNNNNNNNNNNNNN.',
  '.NNNNNNNNNNNNNNNN.',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNN',
  '.NNNNNNNNNNNNNNNN.',
]);

// --- Pram ---
SPR.pram = makeSprite([
  '..gggggggggg..',
  '.gNNNNNNNNNNg.',
  '.gNPPNPPNPPNg.',
  '.gNNNNNNNNNNg.',
  '..gggggggggg..',
  '...gg....gg...',
  '..gGGg..gGGg..',
  '...gg....gg...',
]);

// --- Hand minion ---
SPR.hand = makeSprite([
  '.S.S.S.',
  '.SSSSS.',
  'SSSSSSS',
  '.SSSSS.',
  '..SSS..',
]);

// --- Pickups ---
SPR.flamePickup = makeSprite([
  '..O..',
  '.OoO.',
  '.oOo.',
  'OoYoO',
  '.OOO.',
]);
SPR.stitchPickup = makeSprite([
  'W...W',
  '.WTW.',
  '..T..',
  '.WTW.',
  'W...W',
]);
SPR.thread = makeSprite([
  '.ttt.',
  'tWTWt',
  'tTTTt',
  'tWTWt',
  '.ttt.',
]);
SPR.ribbon = makeSprite([
  'rR...Rr',
  '.RRrRR.',
  '..RRR..',
  '.RRrRR.',
  'rR...Rr',
]);
SPR.key = makeSprite([
  '.YY..',
  'Y..Y.',
  '.YY..',
  '..Y..',
  '..YY.',
  '..Y..',
  '..YY.',
]);

// --- Furniture ---
SPR.crib = makeSprite([
  't.t.t.t.t.t.t.t.',
  'tttttttttttttttt',
  'tWWWWWWWWWWWWWWt',
  'tWwWWwWWwWWwWWWt',
  'tttttttttttttttt',
  't..............t',
  't..............t',
  'tt............tt',
]);
SPR.toyPile = makeSprite([
  '....R.....',
  '...RRR.Y..',
  '.GGRRRYYY.',
  'GGGGBBBYY.',
  'GGGBBBBGG.',
  '.GGGGGGGG.',
]);
SPR.bed = makeSprite([
  'tttttttttttttt',
  'tWWWWWWWWWWWWt',
  'tWWwwWWWWWWWWt',
  'tLLLLLLLLLLLLt',
  'tLLlLLLLlLLLLt',
  'tLLLLLLLLLLLLt',
  'tttttttttttttt',
  't............t',
]);
SPR.candle = makeSprite([
  '..O..',
  '..o..',
  '.WWW.',
  '.WwW.',
  '.WWW.',
]);
// --- Blanket pile (reference: heaped blue cloth) ---
SPR.blanketPile = makeSprite([
  '.....BBBB.....',
  '...BBBBBBBB...',
  '..BBLLBBBBLB..',
  '.BBLLLLBBBBBB.',
  'lBBBBLLLBBBBl.',
  'llLlllBlllLll.',
]);
// --- Teddy decor ---
SPR.teddy = makeSprite([
  '.p..p.',
  'pppppp',
  'pKppKp',
  '.pppp.',
  'pppppp',
  '.p..p.',
]);
// --- HUD hearts ---
SPR.heartFull = makeSprite([
  '.RR.RR.',
  'RRRRRRR',
  'RRWRRRR',
  '.RRRRR.',
  '..RRR..',
  '...R...',
]);
SPR.heartEmpty = makeSprite([
  '.gg.gg.',
  'gKKgKKg',
  'gKKKKKg',
  '.gKKKg.',
  '..gKg..',
  '...g...',
]);
SPR.door = makeSprite([
  'tttttttttttt',
  'tKKKKKKKKKKt',
  'tKKKKKKKKKKt',
  'tKKKKKKKKKKt',
  'tKKKKKKKKKKt',
  'tKKKKYKKKKKt',
  'tKKKKKKKKKKt',
  'tKKKKKKKKKKt',
  'tKKKKKKKKKKt',
]);
SPR.doorLocked = makeSprite([
  'tttttttttttt',
  'tttttttttttt',
  'ttwtttttwttt',
  'tttwttttttttt'.slice(0,12),
  'tttttwtttttt',
  'ttttttttwttt',
  'ttwttttttttt',
  'tttttttttttt',
  'tttttttttttt',
]);

// ============ Nights 2-5 ============

// --- Chalk Wraith (Lesson Hall): a child's chalk drawing peeled off the wall ---
SPR.chalkWraith = makeSprite([
  '..DDDD..',
  '.D....D.',
  '.D.KK.D.',
  '.D....D.',
  '..DDDD..',
  '...DD...',
  '..DDDD..',
  '.D.DD.D.',
  '...DD...',
  '..D..D..',
]);
SPR.chalkWraithPink = makeSprite([
  '..dddd..',
  '.d....d.',
  '.d.KK.d.',
  '.d....d.',
  '..dddd..',
  '...dd...',
  '..dddd..',
  '.d.dd.d.',
  '...dd...',
  '..d..d..',
]);

// --- Desk Mimic (Lesson Hall): a school desk with teeth ---
SPR.mimicClosed = makeSprite([
  'tttttttttttt',
  'tTTTTTTTTTTt',
  'tTTTTTTTTTTt',
  'tttttttttttt',
  '.tt......tt.',
  '.tt......tt.',
]);
SPR.mimicOpen = makeSprite([
  'tttttttttttt',
  'tKWKWKWKWKKt',
  'tKKKKKKKKKKt',
  'tKWKWKWKWKKt',
  'tttttttttttt',
  '.tt......tt.',
]);

// --- Spoon Swarm (Kitchen): cutlery that flies ---
SPR.spoonEnemy = makeSprite([
  '.MM.....',
  'MMMM....',
  'MMMMM...',
  '.MM.MMMM',
  '........',
]);

// --- Porridge Blob (Kitchen) ---
SPR.porridge = makeSprite([
  '...wwww...',
  '..wwwwww..',
  '.wwKwwKww.',
  'wwwwwwwwww',
  'wwwGwwGwww',
  '.wGwwwwGw.',
]);

// --- Sheet Ghost (Laundry): a wet bedsheet that hunts ---
SPR.sheet = makeSprite([
  '...WWWW...',
  '..WWWWWW..',
  '.WWKWWKWW.',
  '.WWWWWWWW.',
  '.WWWWWWWW.',
  'WWWWWWWWWW',
  'W.WW.WW.WW',
]);

// --- Mangle Hound (Laundry): a dog folded out of wrung clothes ---
SPR.hound = makeSprite([
  'LL........',
  'LLL....LLL',
  '.LLLLLLLL.',
  '.LKLLLLLL.',
  '.LLLLLLLLL',
  '..LL...LL.',
  '..ll...ll.',
]);

// --- The Teacher of Quiet (boss, Night 2) ---
SPR.teacher = makeSprite([
  '.....gGGg.....',
  '....GGGGGG....',
  '....GGGGGG....',
  '....GGGGGG....',
  '.....GGGG.....',
  '...NNNNNNNN...',
  '..NNNNNNNNNN..',
  '.NNNNNNNNNNNN.',
  '.NNWNNNNNNWNN.',
  '.NNWNNNNNNWNN.',
  'NNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNN',
  '.NNNN....NNNN.',
  '.NNNN....NNNN.',
]);
// The Teacher's ruler (projectile / pointer)
SPR.ruler = makeSprite([
  'TTTTTTTTTT',
  'TwTwTwTwTT',
  'TTTTTTTTTT',
]);

// --- The Cook Who Stirs (boss, Night 3) ---
SPR.cook = makeSprite([
  '....WWWWWW....',
  '....WWWWWW....',
  '.....WWWW.....',
  '....gGGGGg....',
  '....GGGGGG....',
  '....GGGGGG....',
  '.....GGGG.....',
  '...WWWWWWWW...',
  '..WWWWWWWWWW..',
  '.WWWWWWWWWWWW.',
  '.WWrWWWWWWrWW.',
  'WWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWW',
  'wWWWWWWWWWWWWw',
  'wWWWWWWWWWWWWw',
  '.wWWW....WWWw.',
  '.wWWW....WWWw.',
]);
SPR.pot = makeSprite([
  '..MMMMMMMM..',
  '.MMMMMMMMMM.',
  'MMwwwwwwwwMM',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  '..MM....MM..',
]);
SPR.glob = makeSprite([
  '.ww.',
  'wwww',
  'wwGw',
  '.ww.',
]);

// --- The Laundress (boss, Night 4) ---
SPR.laundress = makeSprite([
  '.....BBBB.....',
  '....BBBBBB....',
  '....BBBBBB....',
  '.....BBBB.....',
  '....gGGGGg....',
  '....GGGGGG....',
  '.....GGGG.....',
  '...BBBBBBBB...',
  '..BBBBBBBBBB..',
  '.BBBBBBBBBBBB.',
  '.BBWBBBBBBWBB.',
  'BBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBB',
  'bBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBb',
  '.bBBB....BBBb.',
  '.bBBB....BBBb.',
]);
SPR.suds = makeSprite([
  '.WW.',
  'WwwW',
  'WwwW',
  '.WW.',
]);

// --- Mother Mercy (final boss, Night 5) ---
SPR.mercy = makeSprite([
  '......rRRr......',
  '.....RRRRRR.....',
  '.....RRRRRR.....',
  '.....RSSSSR.....',
  '.....RSKKSR.....',
  '.....RSSSSR.....',
  '......SSSS......',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '..RRRRRRRRRRRR..',
  '..RRWRRRRRRWRR..',
  '..RRWRRRRRRWRR..',
  '.RRRRRRRRRRRRRR.',
  '.RRRRRRRRRRRRRR.',
  '.RRRRRRRRRRRRRR.',
  'rRRRRRRRRRRRRRRr',
  'rRRRRRRRRRRRRRRr',
  'rRRRRRRRRRRRRRRr',
  'rRRRRRRRRRRRRRRr',
  'rRRRRRRRRRRRRRRr',
  'rRRRRRRRRRRRRRRr',
  '.rRRRRRRRRRRRRr.',
]);
SPR.ruleShard = makeSprite([
  '.Y.',
  'YKY',
  'YKY',
  '.Y.',
]);

// --- Keepsake pickups ---
SPR.chalk = makeSprite([
  '.DD..',
  '.DDD.',
  '..DDD',
  '...DD',
]);
SPR.spoon = makeSprite([
  '.MM....',
  'MMMM...',
  'MMMM...',
  '.MM.MM.',
  '.....MM',
]);
SPR.musicbox = makeSprite([
  '..Y....',
  'ttYtttt',
  'tTTTTTt',
  'tTTYTTt',
  'ttttttt',
]);
SPR.locket = makeSprite([
  '..YY..',
  '.Y..Y.',
  '.YYYY.',
  'YYRRYY',
  'YYRRYY',
  '.YYYY.',
]);

// --- Floor furniture: Lesson Hall ---
SPR.desk = makeSprite([
  'tttttttttttt',
  'tTTTTTTTTTTt',
  'tTTTwTTTTTTt',
  'tttttttttttt',
  '.tt......tt.',
  '.tt......tt.',
]);
SPR.blackboard = makeSprite([
  'tttttttttttttttt',
  'tggggggggggggggt',
  'tgDwDwgwDgwDwggt',
  'tgwgDggwgDgggwgt',
  'tttttttttttttttt',
]);
// --- Floor furniture: Kitchen ---
SPR.table = makeSprite([
  'tttttttttttttttt',
  'tTTTTTTTTTTTTTTt',
  'tTwwTTwwTTwwTTTt',
  'tttttttttttttttt',
  '.tt..........tt.',
]);
SPR.stove = makeSprite([
  'gggggggggg',
  'gGGGGGGGGg',
  'gGooGGooGg',
  'gGGGGGGGGg',
  'gggggggggg',
]);
// --- Floor furniture: Laundry ---
SPR.tub = makeSprite([
  '.MMMMMMMMMM.',
  'MMBBBBBBBBMM',
  'MMBWBBBWBBMM',
  '.MMMMMMMMMM.',
  '..MM....MM..',
]);
SPR.line = makeSprite([
  'M..............M',
  'MMMMMMMMMMMMMMMM',
  'M.WW..LL..WW...M',
  'M.WW..LL..WW...M',
  'M.W...L...W....M',
]);
// --- Floor furniture: Attic ---
SPR.box = makeSprite([
  'tttttttt',
  'tTTTTTTt',
  'tTTwTTTt',
  'tTTTTTTt',
  'tttttttt',
]);
SPR.mirror = makeSprite([
  '.tttttt.',
  'ttBBBBtt',
  'ttBbWBtt',
  'ttBBbBtt',
  'ttBBBBtt',
  '.tttttt.',
  '...tt...',
]);

export { makeSprite, PAL };
