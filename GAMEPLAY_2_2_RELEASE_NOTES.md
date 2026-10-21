# Pokémon Quest Fan Edition v2.2.0 — 2D Gameplay Parity

**Unofficial noncommercial fan game.** All original music, original lines/dialogue, proprietary source graphics/models, and all 3D implementations remain excluded, as requested. The game is a 2D React/Canvas adventure with PokéAPI Generation V pixel sprites (and original 2D fallback).

## Core gameplay updates

- Faithfully import the provided **Pokémon Quest Movesheet.xlsx** move strength/wait data: **167** Quest-specific moves, **151** first-generation species' individual HP/ATK and learnable move pools
- Remove main-series type weaknesses/immunities from Pokémon Quest battles; retain region-specific recommended type bonuses
- Apply original cookbook rules and priority for all **18 dishes**; Rainbow Matter only modifies cooking quality (5 / 6–7 / 8–9 / 10+ points). Brass/Bronze/Silver/Gold pots now apply permanent stat bonuses of 0/50/100/300 and pot-dependent Pokémon IV ranges
- Add real multi-Pokémon recruitment chances (2: 4.3%, 3: 0.5%), with sequential arrivals and existing save compatibility
- Add restricted Mighty/Sturdy/universal P Charm sockets (same species, varying individuals), 10 rare Power Stone secondary boosts that affect the actual 2D battle and save keys; 1/2/3 completed-line bingo thresholds
- Expedition Bonus fills on ten successful expeditions; **the next** expedition drops a guaranteed 3-perk gold stone when won
- Improve move-stone compatibility/Wait Less value, 2-move frequency and expand PM-ticket decorations from 15 to **18** including Kangaskhan, Victreebel, Pikachu multi-recruit boosts
- All 93 prior expeditions (54 base story, 9 post-game, 30 original fan sequel), 100 diary scenes, original fan audio, save keys, and PokéAPI sprites are preserved

## Fidelity notes, caveats, credits

This is not a verified one-to-one implementation of every stage wave, enemy AI, move animation/hitbox/side-effect, every Pokémon-specific Bingo choice after evolution, exact recruitment percentage for all 151 species and all recipes, or complete original-game menu and online/premium features. See **ORIGINAL_GAMEPLAY_PARITY_2_2.md** for specific tests and gaps.

Gameplay reference data: user's `Pokemon Quest Movesheet.xlsx`; Pokémon.com, Bulbapedia Pokémon Quest pages, Serebii Quest cooking and powerstones pages, and the open-source MIT `imyelo/pokequest-wiki` recipe rule data. No proprietary art/audio/dialogue imported from that reference.

Released as a static web game for GitHub Pages; ZIP contains the built web distribution, not an APK or PC installer. Pokémon is copyrighted by its respective owners. PokéAPI sprites are referenced by URL, not official endorsement or license.
