import { describe,expect,it } from 'vitest'
import { QUEST_ALBUM_CUES, QUEST_ALBUM_BUNDLE_PATH, cueForExpedition, validateAlbumCues } from './questAlbum'
import { createBattle, step } from '../engine/battle'
import { computeStats } from './stats'
import { getSpecies } from './roster'
import { useGame } from '../store/gameStore'
import { defaultSave } from './storage'
import { ORIGINAL_FIRST, HAPPENSTANCE_AREA } from './originalCampaign'
import { getStage } from './stages'

const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const hero={ownedId:'player',speciesId:150,level:85,stats:computeStats(getSpecies(150),85)}
function battleForLastWave(boss:boolean){
 const b=createBattle([hero],[[{species:19,level:1,boss}]],seeded(5))
 b.auto=true
 const enemy=b.units.find(x=>x.side==='enemy')!
 enemy.hp=1
 enemy.atkCd=999
 for(let i=0;i<1200&&b.phase!=='won'&&b.phase!=='lost';i++)step(b,.05)
 return b
}
describe('1.0 final cue and stage celebration reliability',()=>{
 it('all 27 album chapters are chronological and cover the submitted recording',()=>{
  expect(Object.keys(QUEST_ALBUM_CUES)).toHaveLength(27)
  expect(validateAlbumCues()).toBe(true)
  expect(QUEST_ALBUM_CUES.title).toEqual([0,158])
  expect(QUEST_ALBUM_CUES.camp).toEqual([438,580])
  expect(QUEST_ALBUM_CUES.happenstanceMountain[0]).toBe(4247)
  expect(QUEST_ALBUM_BUNDLE_PATH).toBe('music/quest-complete.mp3')
 })
 it('automatically selects correct song for the original 11 areas, postgame, and fan sequel',()=>{
  expect(cueForExpedition(ORIGINAL_FIRST,0,false)).toBe('firstSteppe')
  expect(cueForExpedition(ORIGINAL_FIRST+1,0,false)).toBe('gloomyGrove')
  expect(cueForExpedition(ORIGINAL_FIRST+9,2,false)).toBe('farsideFjord')
  expect(cueForExpedition(ORIGINAL_FIRST,3,true)).toBe('boss1')
  expect(cueForExpedition(ORIGINAL_FIRST+9,3,true)).toBe('boss2')
  expect(cueForExpedition(ORIGINAL_FIRST+10,0,true)).toBe('mewtwoBattle')
  expect(cueForExpedition(HAPPENSTANCE_AREA,8,false)).toBe('happenstanceMountain')
  expect(cueForExpedition(2,1,false)).toBe('happenstanceCave')
 })
 it('emits exactly one fanfare/explosion event for final-wave bosses and normal enemies',()=>{
  for(const boss of [false,true]){
   const b=battleForLastWave(boss)
   expect(b.phase).toBe('won')
   expect(b.finaleFired).toBe(true)
   expect(b.events.filter(e=>e.k==='bossDefeated')).toHaveLength(1)
   expect(b.events.filter(e=>e.k==='faint')).toHaveLength(1)
  }
 })
 it('keeps the finale wired for every original and fan world',()=>{
  for(const area of [0,1,2,3,4,5,...Array.from({length:12},(_,i)=>i+6)]){
   const b=createBattle([hero],[[{species:19,level:1}]],seeded(area+10),getStage(area,0))
   b.auto=true
   b.units.find(u=>u.side==='enemy')!.hp=1
   for(let i=0;i<1200&&b.phase!=='won'&&b.phase!=='lost';i++)step(b,.05)
   expect(b.phase).toBe('won')
   expect(b.events.filter(e=>e.k==='bossDefeated')).toHaveLength(1)
  }
 })
})
describe('fully controlled account reset',()=>{
 it('clears all progress and returns to title without losing mute preference',()=>{
  const s=defaultSave()
  s.started=true;s.name='다시시작';s.coins=730;s.pmTickets=300
  s.cleared={'a6-s0':true}
  s.owned=[{id:'m1',species:25,level:45,exp:0,stones:[],bonus:[],mstones:[]}]
  s.party=['m1'];s.muted=true
  useGame.setState({save:s,screen:'camp',panel:'save'})
  useGame.getState().hardReset()
  const state=useGame.getState()
  expect(state.screen).toBe('title')
  expect(state.panel).toBeNull()
  expect(state.save.started).toBe(false)
  expect(state.save.name).toBe('')
  expect(state.save.cleared).toEqual({})
  expect(state.save.owned).toEqual([])
  expect(state.save.party).toEqual([])
  expect(state.save.coins).toBe(100)
  expect(state.save.pmTickets).toBe(0)
  expect(state.save.muted).toBe(true)
 })
})
