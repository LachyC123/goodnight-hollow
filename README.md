# Goodnight, Hollow — First Night Demo

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

## The First Night

- Wake in the **Dormitory** beside Elsie. Talk to her. Keep your promise — or don't.
- Fight through the **Nursery Rot**: Button Mice, Blanket Crawlers, and Crying Dolls (Elsie asked you not to hurt them).
- Find a **memory room**. Not all memories are kind.
- Choose a **Pretend** — a power the children believe you have.
- Face **The Nanny With No Face**.
- Bring back what she drops. Elsie will have something to say.

Death is part of the story. Your **Keepsakes** persist between nights (saved in your browser).

## Project structure

```
index.html        entry point
css/style.css     canvas scaling
js/main.js        game states, hub, run manager, HUD, story
js/player.js      Mallow: movement, dodge, attack, stitches, candleflame
js/enemies.js     Button Mouse, Blanket Crawler, Crying Doll, Nanny boss
js/rooms.js       room building + pre-rendered backgrounds
js/world.js       constants + tile collision
js/sprites.js     code-generated pixel sprites
js/dialogue.js    typewriter dialogue queue
js/input.js       keyboard input
js/audio.js       WebAudio-generated sound effects
```
