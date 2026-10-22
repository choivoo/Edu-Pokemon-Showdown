# Pokémon Quest Fan Edition 1.0.0 — Stable 2D Release

This is an **independent, unofficial fan edition** labeled as its **own** stable 1.0.0 release; it is not an official Pokémon / Nintendo / GAME FREAK release.

- New **1.0.0 stable version** after v2.6 development.
- 27 precisely timed soundtrack chapters mapped automatically to title, intro, tutorial, map, base camp, expedition biome, boss fights, results, postgame regions.
- Cross-device shared-music implementation: looks for four files under `public/audio/quest-part-1.mp3` through `quest-part-4.mp3` on the website. When hosted, all mobile and desktop browsers stream those files automatically, with no local file picker. Browsers still require an initial click before audio may play.
- Original newly composed Web Audio cues remain a safe fallback if licensed files have not been uploaded or cannot load.
- Save panel adds permanent account reset with typed confirmation and backup warning; PQF1 save compatibility remains intact.
- Maintains prior 2D pixel graphics and v2.6 accessible free-roaming gameplay.
- **Audio deployment requirement**: the four MP3 chunks must be placed in `public/audio/` in the repository. The GitHub tool cannot upload the attached binary audio. The app must not be described as serving the supplied recordings until all four files are actually on GitHub Pages. Deployment CI will report whether each asset is present.
- The uploader is responsible for having an actual licence allowing copying, modifying, distributing and publicly hosting the original soundtrack recordings. User reports that permission was obtained; the project does not claim endorsement.
