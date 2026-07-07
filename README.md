# Goodnight, Hollow

A dark pixel-art story roguelite that runs entirely in the browser. You are **Mallow**, a stitched rabbit doll with a candle flame in its chest, protecting the children of a cursed orphanage that wakes at 3:33 AM.

**No engine. No build step. No image assets.** Vanilla JavaScript + HTML5 Canvas; every sprite is generated in code.

## Play

Serve the folder with any static server and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Or enable GitHub Pages for this repository.)

## Controls

| Action | Keys |
|---|---|
| Move | WASD / Arrow keys |
| Attack (sewing needle) | J / Z / Space |
| Dodge | K / X / Shift |
| Talk / Interact / Advance dialogue | E / Enter |
| Candleflame burst (50 flame) | L / C |

## The Five Nights

Each night is one floor of the House of Good Children. Beat a night's boss, carry its **Keepsake** home, and the next floor wakes the following night. Keepsakes persist between nights (saved in your browser) and each grants a lasting gift.

| Night | Floor | Boss | Keepsake |
|---|---|---|---|
| 1 | Nursery Rot | The Nanny With No Face | the burned ribbon (+1 stitch) |
| 2 | The Lesson Hall | The Teacher of Quiet | the chalk stub (+50% flame gained) |
| 3 | The Long Kitchen | The Cook Who Stirs | the silver spoon (stitches heal double) |
| 4 | The Laundry Below | The Laundress | the music box (dodge recovers twice as fast) |
| 5 | The Attic of Rules | Mother Mercy | the mother's locket (a small mercy, once per night) |

Every run: wake in the **Dormitory** beside Elsie → four combat rooms → a **memory room** → the boss. Along the way you pick a **Pretend** — a power the children believe you have (six exist; each night offers different ones).

Rooms also drop **Thread** — a persistent currency. Back in the Dormitory, tend the **Candle Cradle** to sew small permanent mercies: an extra stitch, a stronger flame, a quicker needle.

**The crying dolls** appear on every floor. Elsie asked you not to hurt them. What you choose — every night — decides what kind of morning finally comes.

Death is part of the story. The house always lets you back.

## Project structure

```
index.html        entry point
css/style.css     canvas scaling
js/main.js        game states, hub, HUD, story, endings
js/save.js        save/load, migration, permanent progression (keepsakes, bonds, moral axis)
js/run.js         per-run state: room plan, active pretends, run stats
js/upgrades.js    data-driven Pretend + Keepsake effect tables
js/nights.js      the five nights: floors, bosses, keepsakes, memories, rules
js/player.js      Mallow: movement, dodge, attack, stitches, candleflame
js/enemies.js     enemies + bosses for all five floors
js/rooms.js       room building, per-floor layouts + pre-rendered backgrounds
js/world.js       constants + tile collision
js/sprites.js     code-generated pixel sprites
js/dialogue.js    typewriter dialogue queue
js/input.js       keyboard input
js/audio.js       WebAudio-generated sound effects
js/debug.js       developer shortcuts (only with ?dev=1)
```

## Developer shortcuts

Open the game with `?dev=1` (e.g. `http://localhost:8000/?dev=1`) to enable debug keys:

| Key | Effect |
|---|---|
| F1 | Clear the current room (spares crying dolls) |
| F2 | Skip to the boss room |
| F3 | Grant all keepsakes |
| F4 | Cycle the next night (1–5) |
| F5 | Full stitches + full candleflame |
| F6 | Wipe the save and reload |
| F7 | Kill everything in the room (bosses included) |
