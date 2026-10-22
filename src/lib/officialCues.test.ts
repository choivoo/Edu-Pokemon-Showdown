import {describe,it,expect} from 'vitest'
import {OFFICIAL_CUES,CUE_DETAILS,DEFAULT_SCENE_CUE,cueForBattle,cuePath} from './officialCues'
describe('Official 1.0 licensed soundtrack routing',()=>{
 it('lists 27 complete sequential OST chapters with unique file IDs',()=>{
  expect(OFFICIAL_CUES).toHaveLength(27)
  expect(new Set(OFFICIAL_CUES.map(x=>x[0])).size).toBe(27)
  expect(OFFICIAL_CUES[0]).toEqual(['title','Title','00:00','02:38'])
  expect(OFFICIAL_CUES[26][3]).toBe('1:15:24')
  for(const [id] of OFFICIAL_CUES)expect(cuePath(id).endsWith('/soundtrack/'+id+'.mp3')).toBe(true)
 })
 it('routes all ten normal original environments and bosses',()=>{
  const tracks=['first-steppe','gloomy-grove','backforth-brook','parched-peak','belly-button-cave','pincushion-plain','miasma-moor','hushed-highlands','nightlight-nook','farside-fjord']
  for(let i=0;i<10;i++)expect(cueForBattle(i+6,1,false)).toBe(tracks[i])
  expect(cueForBattle(6,3,true)).toBe('boss-battle-1')
  expect(cueForBattle(15,4,true)).toBe('boss-battle-2')
  expect(cueForBattle(16,0,true)).toBe('mewtwo-battle')
 })
 it('routes Happenstance themed episodes',()=>{
  expect(cueForBattle(17,0,false)).toBe('happenstance-grassland')
  expect(cueForBattle(17,2,false)).toBe('happenstance-waterside')
  expect(cueForBattle(17,4,false)).toBe('happenstance-cave')
  expect(cueForBattle(17,6,false)).toBe('happenstance-forest')
  expect(cueForBattle(17,7,false)).toBe('happenstance-forest')
  expect(cueForBattle(17,8,true)).toBe('happenstance-mountain')
 })
 it('has original synth fallback for every original scene',()=>{
  for(const cue of Object.values(DEFAULT_SCENE_CUE))expect(CUE_DETAILS[cue]).toBeTruthy()
 })
})
