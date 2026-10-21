/**
 * 27 authored chapter boundaries in the user-provided, 75-minute licensed album.
 * Timings are absolute positions within the single complete soundtrack MP3.
 * This module carries only timings. The recording is NOT added to this repo by
 * this code; if a bundled asset is absent, the synthesized BGM works as before.
 */
export const QUEST_ALBUM_CUES = {
  title: [0, 158],
  intro: [158, 284],
  tutorial: [284, 390],
  results: [390, 438],
  camp: [438, 580],
  expeditions: [580, 684],
  firstSteppe: [684, 798],
  boss1: [798, 914],
  storyTalk: [914, 943],
  boss2: [943, 1047],
  gloomyGrove: [1047, 1260],
  backforthBrook: [1260, 1483],
  parchedPeak: [1483, 1674],
  bellyButtonCave: [1674, 1828],
  pincushionPlain: [1828, 2022],
  miasmaMoor: [2022, 2199],
  hushedHighlands: [2199, 2412],
  nightlightNook: [2412, 2656],
  farsideFjord: [2656, 2898],
  storyEmergency: [2898, 2943],
  mewtwoBattle: [2943, 3133],
  staffRoll: [3133, 3288],
  happenstanceGrassland: [3288, 3494],
  happenstanceWaterside: [3494, 3743],
  happenstanceCave: [3743, 4059],
  happenstanceForest: [4059, 4247],
  happenstanceMountain: [4247, 4524.225],
} as const satisfies Record<string, readonly [number,number]>
export type QuestAlbumCue = keyof typeof QUEST_ALBUM_CUES
export const QUEST_ALBUM_BUNDLE_PATH = 'music/quest-complete.mp3'
/** The original island starts at area 6 and the postgame Happenstance Island at 17. */
const originalRegions = [
 'firstSteppe','gloomyGrove','backforthBrook','parchedPeak',
 'bellyButtonCave','pincushionPlain','miasmaMoor','hushedHighlands',
 'nightlightNook','farsideFjord','mewtwoBattle',
] as const satisfies readonly QuestAlbumCue[]
const fanRegions = [
 'happenstanceWaterside','happenstanceForest','happenstanceCave',
 'parchedPeak','miasmaMoor','happenstanceMountain',
] as const satisfies readonly QuestAlbumCue[]
export function cueForExpedition(area:number,index:number,boss:boolean):QuestAlbumCue {
 if (area===16) return 'mewtwoBattle'
 if (area===17) return ['happenstanceGrassland','happenstanceWaterside','happenstanceCave','happenstanceForest','happenstanceMountain'][Math.min(4,Math.floor(index/2))] as QuestAlbumCue
 if (area>=6 && area<=15) {
  if (boss) return area<11?'boss1':'boss2'
  return originalRegions[area-6]
 }
 if(area>=0 && area<=5) return boss?'boss2':fanRegions[area]
 return boss?'boss2':'expeditions'
}
export function validateAlbumCues(duration=4524.225):boolean {
 const ranges=Object.values(QUEST_ALBUM_CUES)
 return ranges[0][0]===0&&ranges.every(([start,end],i)=>end>start&&(i===0||Math.abs(start-ranges[i-1][1])<.002))&&Math.abs(ranges[ranges.length-1][1]-duration)<1
}
