// Developer / debug shortcuts. Only active with ?dev=1 in the URL, so normal
// players never trigger them. All hooks act through the Game instance.
//
//   F1 — clear the current room (kills non-doll enemies)
//   F2 — skip straight to the boss room of the current run
//   F3 — grant all keepsakes
//   F4 — advance the "next night" (cycles 1..5)
//   F5 — heal to full + max candleflame
//   F6 — wipe the save and reload
//   F7 — kill the boss / end the current room instantly (dolls included)

import { LAST_NIGHT } from './nights.js';
import { clearSave } from './save.js';

export const DEV = new URLSearchParams(location.search).get('dev') === '1';

export function attachDebug(game) {
  if (!DEV) return;
  console.log('[goodnight-hollow] dev mode: F1 clear room · F2 to boss · F3 keepsakes · F4 next night · F5 heal · F6 wipe save · F7 kill all');
  window.addEventListener('keydown', e => {
    switch (e.code) {
      case 'F1':
        if (game.state === 'run') {
          for (const en of game.enemies) if (!en.isDoll && !en.dead) { en.dead = true; }
        }
        break;
      case 'F2':
        if (game.state === 'run' && game.run) {
          game.enterRoom(game.run.rooms.length - 1);
        }
        break;
      case 'F3':
        for (const k of ['ribbon', 'chalk', 'spoon', 'musicbox', 'locket']) game.save.keepsakes[k] = true;
        game.persist();
        break;
      case 'F4':
        game.save.nightsCleared = (game.save.nightsCleared + 1) % LAST_NIGHT;
        game.persist();
        break;
      case 'F5':
        game.player.stitches = game.player.maxStitches;
        game.player.flame = 100;
        break;
      case 'F6':
        clearSave();
        location.reload();
        break;
      case 'F7':
        if (game.state === 'run') {
          for (const en of game.enemies) if (!en.dead) { en.hp = 0; en.dead = true; if (en.isBoss) game.onBossDefeated(); }
        }
        break;
      default: return;
    }
    e.preventDefault();
  });
}
