/**
 * Audio cues for the user-provided 75m24s licensed soundtrack.
 *
 * Attribution: provided by the project owner, who represents they have
 * permission to distribute it. No built-in game music is altered or copied
 * by this module. Public playback needs the corresponding static MP3 files
 * in public/audio/quest-ost/. If unavailable, the game gracefully falls
 * back to its existing original synthesized soundtrack.
 */
import type { SongName } from './songs'
import type { Stage } from './stages'
import { ORIGINAL_FIRST, ORIGINAL_BOSS_AREA, HAPPENSTANCE_AREA } from './originalCampaign'

export const SOUNDTRACK_CUES = [
  ['title',0],['intro',158],['tutorial',284],['results',390],
  ['base_camp',438],['expeditions',580],['first_steppe',684],
  ['boss_battle_1',798],['story_talk',914],['boss_battle_2',943],
  ['gloomy_grove',1047],['backforth_brook',1260],
  ['parched_peak',1483],['belly_button_cave',1674],
  ['pincushion_plain',1828],['miasma_moor',2022],
  ['hushed_highlands',2199],['nightlight_nook',2412],
  ['farside_fjord',2656],['story_emergency',2898],
  ['mewtwo_battle',2943],['staff_roll',3133],
  ['happenstance_grassland',3288],['happenstance_waterside',3494],
  ['happenstance_cave',3743],['happenstance_forest',4059],
  ['happenstance_mountain',4247],
] as const
export type SoundtrackCue = typeof SOUNDTRACK_CUES[number][0]
export const TOTAL_AUDIO_DURATION = 4524.225
export const SOUNDTRACK_CUE_TIMES: Record<SoundtrackCue,{start:number;end:number}> =
  Object.fromEntries(SOUNDTRACK_CUES.map(([id,start],i)=>[id,{
    start,end:SOUNDTRACK_CUES[i+1]?.[1]??TOTAL_AUDIO_DURATION
  }])) as Record<SoundtrackCue,{start:number;end:number}>

/** Imported separately as a static file so all users of GitHub Pages can stream it. */
export const soundtrackUrl = (cue:SoundtrackCue) =>
  `${import.meta.env.BASE_URL}audio/quest-ost/${cue}.mp3`

export const DEFAULT_SONG_CUES: Record<SongName,SoundtrackCue> = {
  title:'title',camp:'base_camp',map:'expeditions',
  battle:'first_steppe',boss:'boss_battle_1',
  story:'story_talk',tide:'backforth_brook',
  grove:'gloomy_grove',echo:'happenstance_cave',
  spark:'parched_peak',ember:'miasma_moor',
  astral:'happenstance_grassland',
}
export const ORIGINAL_STAGE_SCENES: readonly SoundtrackCue[]=[
  'first_steppe','gloomy_grove','backforth_brook','parched_peak',
  'belly_button_cave','pincushion_plain','miasma_moor',
  'hushed_highlands','nightlight_nook','farside_fjord'
]
export const HAPPENSTANCE_SCENES:readonly SoundtrackCue[]=[
  'happenstance_grassland','happenstance_waterside',
  'happenstance_cave','happenstance_forest',
  'happenstance_mountain'
]
/** A single deterministic audio selection for every expedition type. */
export function musicForStage(stage: Pick<Stage,'area'|'index'|'boss'>): SoundtrackCue {
  if(stage.area===ORIGINAL_BOSS_AREA)return 'mewtwo_battle'
  if(stage.area===HAPPENSTANCE_AREA) {
    if(stage.index===8&&stage.boss)return 'mewtwo_battle'
    return HAPPENSTANCE_SCENES[stage.index%HAPPENSTANCE_SCENES.length]
  }
  if(stage.boss)return stage.area>=ORIGINAL_FIRST+5?'boss_battle_2':'boss_battle_1'
  if(stage.area>=ORIGINAL_FIRST && stage.area<ORIGINAL_BOSS_AREA)
    return ORIGINAL_STAGE_SCENES[stage.area-ORIGINAL_FIRST]
  return HAPPENSTANCE_SCENES[Math.max(0,stage.area)%HAPPENSTANCE_SCENES.length]
}
export function fallbackSongForCue(cue:SoundtrackCue):SongName {
 const match=(Object.entries(DEFAULT_SONG_CUES) as [SongName,SoundtrackCue][]).find(([,v])=>v===cue)
 if(match)return match[0]
 if(cue.includes('boss')||cue==='mewtwo_battle')return 'boss'
 if(cue==='results'||cue==='staff_roll')return 'story'
 if(cue.startsWith('happenstance_'))return 'astral'
 if(cue==='story_emergency')return 'boss'
 if(cue==='intro'||cue==='tutorial')return 'story'
 if(cue==='hushed_highlands'||cue==='farside_fjord')return 'grove'
 if(cue==='pincushion_plain'||cue==='nightlight_nook')return 'spark'
 return 'battle'
}
