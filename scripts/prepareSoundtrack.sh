#!/usr/bin/env bash
# Install 27 exact user-licensed soundtrack cues from a single GitHub release ZIP.
# The ZIP is attached to v1.0.0-official. Original synthesizer works without it.
set -euo pipefail
ASSET='quest_official_1_0_music_pack.zip'
RELEASE='v1.0.0-official'
mkdir -p public/soundtrack
count=$(find public/soundtrack -maxdepth 1 -name '*.mp3' -type f | wc -l | tr -d '[:space:]')
if [ "$count" -eq 27 ]; then echo "Already carrying 27 public cue files"; exit 0; fi

if [[ -n "${GH_TOKEN:-}" ]]; then
  mkdir -p /tmp/quest-official-ost
  if gh release download "$RELEASE" --repo "$GITHUB_REPOSITORY" --pattern "$ASSET" --dir /tmp/quest-official-ost --clobber 2>/dev/null; then
    echo "User-licensed 27-track release pack found"
    unzip -t "/tmp/quest-official-ost/$ASSET" >/dev/null
    unzip -qo "/tmp/quest-official-ost/$ASSET" -d .
  else
    echo "::warning::The actual licensed MP3 assets have not been attached to the official release. 16 original generated tracks will play as a fallback."
    exit 0
  fi
else
  echo "Local build without GitHub release token; using existing assets or synthesizer fallback"
  exit 0
fi

# Exact cue names must exist, including 5 different Happenstance Island biomes.
expected=(
 title intro tutorial expedition-results base-camp expeditions first-steppe
 boss-battle-1 story-talk boss-battle-2 gloomy-grove backforth-brook parched-peak
 belly-button-cave pincushion-plain miasma-moor hushed-highlands nightlight-nook
 farside-fjord story-emergency mewtwo-battle staff-roll
 happenstance-grassland happenstance-waterside happenstance-cave
 happenstance-forest happenstance-mountain
)
for cue in "${expected[@]}"; do
  file="public/soundtrack/${cue}.mp3"
  if [[ ! -s "$file" ]]; then
    echo "::error::Licensed soundtrack asset missing: $file"
    exit 1
  fi
done
echo "Ready: ${#expected[@]} uploaded MP3 tracks will be served to all devices by GitHub Pages."
