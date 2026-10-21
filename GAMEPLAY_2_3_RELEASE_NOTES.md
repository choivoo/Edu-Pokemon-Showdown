# Pokémon Quest Fan Edition v2.3.0 — 2D Quest Adventure
Unofficial, noncommercial fan project. No original game audio, dialogue, proprietary 3D, or ripped graphics are included. Current PokéAPI Gen-V 2D dot sprites remain.

## Included
- Source workbook `Pokémon Quest Movesheet.xlsx`: 151 original Kanto species, nine original Bingo candidates per species (1,359 candidates); random choice in each of three Bingo rows and species-specific effects including on evolution. Previously saved fan-original bonus sets remain compatible.
- 2D move combat profiles: beam, directional cone, melee, dash, burst/projectile, and 3-hit moves with hit-specific delays and declared status effects; enemy AI opportunistically targets injured nearby allies.
- Source-verified per-encounter enemy groups for six stages: First Steppe 1-1 to 1-4, Gloomy Grove 2-1 and 2-2. **Other 57 original main/postgame stage encounter sequences remain approximations.**
- Normalized individual recruitment odds by recipe and pot grade, visible in the cooking screen and explicitly marked **estimated**, not the original retail odds.
- Two-slot attack training, each with independently equipped compatible move stones and independent skill/stones effects, backwards-compatible encrypted PQF1 import/export.
- Brand new animated 2D title, sprite-loading animation, all 12 original electronic BGM themes (title, camp, exploration map, battles, boss, story, six regional themes), and 4 original fanfares. No copyrighted song melodies/samples.
- Existing 93 original + fan-created adventure expeditions preserved, 2D web gameplay and PokéAPI Gen-V sprite links preserved.

## Verification and scope
The existing and added 171 automated gameplay/music/save regressions pass; typecheck and production Vite build are required by the release workflow. Manual playthrough and cross-browser audiovisual regression tests have not been verified.

Still not exact original parity: remaining 57 original stages' complete encounters, retail per-species cooking weights, 167 distinct original animation/hitbox frames and decision-tree AI, original monetized feature/UI. Full status matrix: `PARITY_AUDIT_2_3.md`.

ZIP contains static web distribution in a `dist/` folder (not APK or native PC executable); play hosted version on GitHub Pages.
