# Pokémon Quest Fan Edition v2.6.0 — starter-friendly 2D free roaming

## What changed
- Progressive difficulty responds to party size: the initial island's first five missions adjust opponent HP, attack, defense and healing opportunities to whether you bring one, two or three Pokémon. A single untrained level-5 partner can explore without grinding, while a full team faces the previous tuned difficulty. Two following story regions receive gentler solo scaling. Late-game and Happenstance combat stats are unchanged.
- True held-direction controls in the wide 3,220 × 1,460 2D isometric-style field. Hold WASD / arrow keys for continuous movement, combine directions for speed-normalized diagonals; key release, focus loss and pause are handled. A four-direction mobile touchscreen pad supports hold-to-run.
- Field click/tap and minimap waypoint clicks continue to work. Touch-to-waypoint overrides an active joystick direction; using the pad overrides the former waypoint. The 2D landscape keeps camera following, depth sorting and hand-drawn isometric scenery; there is **no 3D engine**.
- Six new automated tests for difficulty scaling, three-mon late game protection, movement normalization, invalid waypoints and direction/waypoint interactions. All original v2.5.0 data, gameplay features and saves are preserved.

## New illustrated camp furnishing
- All 18 purchasable PM Ticket decorations now render as original hand-drawn 2D furniture at individual stable positions on the campsite (chairs, flags, inflatable balloons, torches, fountain, surfboard, tents and more). Previously they were shown only as a row of labels; now their physical presence is visible while wild Pokémon wander naturally in front. A compact control still opens the shop and keeps all passive effects.
- All 18 positions are inside the 960×540 scene and outside the main cooking-pot hit area; unknown duplicate decoration IDs do not create duplicate objects. Added regression tests.

## Preserved from v2.5.0
- Source-backed original 54 stage encounter sets and weighted original boss lists, with the original postgame and original fan sequel retained.
- Pokémon start with two trainable techniques and individual move stones; 151 species × 9 original Bingo candidates, 167 move definitions, original-based recipe rules and estimated per-species odds.
- Synthesized custom soundtrack 12 cues + 4 jingles, specific boss-finale impact sound and particles, PokéAPI pixel art. Existing support for selecting your own MP3 **locally in the browser only** is preserved. No copyrighted recordings are redistributed in this public web release.
- Existing encrypted PQF1 backup format and HTML5 Canvas web compatibility.

## Known differences from the retail game
- Although all 54 original island stage species/wave lists are represented from public reference data, the 2D wave grouping and live enemy AI differ from the proprietary title.
- Full official restaurant recipe species probabilities and frame-level exact hitboxes/animation are not guaranteed; custom 2D models and approximations remain. No original 3D assets/dialogue/music are redistributed.
- Game design and imagery remain unofficial and noncommercial. Pokémon belongs to its respective rights holders.
