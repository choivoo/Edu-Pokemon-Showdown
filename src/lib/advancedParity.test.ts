import { describe, expect, it } from 'vitest'
import { QUEST_BINGO_TEXT } from '../data/questBingoCorpus'
import { questBingoOptions, questBingoEffects, activeQuestBingo } from './questBingo'
import { QUEST_RECOMPOSED_SONGS, QUEST_RECOMPOSED_JINGLES } from './questSoundtrack'
import { moveProfile,moveHits } from './moveProfiles'
import { QUEST_MOVE_BY_NAME } from '../data/questMoves'
import { verifiedWaves, VERIFIED_ENCOUNTERS } from '../data/verifiedEncounters'
import { defaultSave } from './storage'
import { pack, unpack } from './saveKey'
import { attractionOdds, cook } from './cooking'

describe('151 real Bingo candidates and evolution',()=>{
 it('loads all 1359 original Bingo candidates, no species omitted',()=>{
  expect(QUEST_BINGO_TEXT).toHaveLength(151)
  for(let id=1;id<=151;id++){
   expect(QUEST_BINGO_TEXT[id-1]).toHaveLength(9)
   expect(questBingoOptions(id,0)).toHaveLength(3)
   expect(questBingoOptions(id,1)).toHaveLength(3)
   expect(questBingoOptions(id,2)).toHaveLength(3)
  }
 })
 it('Bulbasaur, Ivysaur and Pikachu have distinct actual source candidates and evolutions',()=>{
  expect(questBingoOptions(1,0)[0]).toBe('Hit Healing +2%')
  expect(questBingoOptions(1,2)[1]).toBe('HP +550')
  expect(questBingoOptions(2,2)[1]).toBe('HP +250')
  expect(questBingoOptions(25,0)[0]).toContain('Electric Type Moves Wait -5%')
  expect(activeQuestBingo(1,[0,0,1],3)).toContain('HP +550')
  expect(activeQuestBingo(2,[0,0,1],3)).toContain('HP +250')
 })
 it('applies HP, grass attack and Pikachu electric wait plus static ATK',()=>{
  const bulb=questBingoEffects(1,[0,0,1],3)
  expect(bulb.hpFlat).toBe(550)
  const pikachu=questBingoEffects(25,[0,1,2],3)
  expect(pikachu.typeWait.electric).toBeCloseTo(.05)
  expect(pikachu.atkFlat).toBe(550)
  const fire=questBingoEffects(25,[1,1,1],3)
  expect(fire.typeAtk.electric).toBeCloseTo(.05+.15+.5)
 })
 it('preserves selected three candidate indexes during legacy compatible save packing',()=>{
  const s=defaultSave()
  s.owned=[{id:'p1',species:25,level:45,exp:0,stones:[],mstones:[],bonus:[],
    bingoChoices:[0,1,2]}]
  expect(unpack(pack(s)).owned[0].bingoChoices).toEqual([0,1,2])
 })
})
describe('2D soundtrack and move geometry',()=>{
 it('provides every 12 brand-new songs and all four jingles',()=>{
  expect(Object.keys(QUEST_RECOMPOSED_SONGS)).toHaveLength(12)
  expect(Object.keys(QUEST_RECOMPOSED_JINGLES)).toHaveLength(4)
  for(const song of Object.values(QUEST_RECOMPOSED_SONGS)) {
   expect(song.tracks.length).toBeGreaterThanOrEqual(6)
   expect(song.tracks[0].events.length).toBeGreaterThan(20)
  }
 })
 it('gives beams, area explosions and melee punches distinct shapes',()=>{
  const beam=moveProfile(QUEST_MOVE_BY_NAME.get('Hyper Beam')!)
  const burst=moveProfile(QUEST_MOVE_BY_NAME.get('Earthquake')!)
  const punch=moveProfile(QUEST_MOVE_BY_NAME.get('Mega Punch')!)
  expect(beam.shape).toBe('beam')
  expect(burst.shape).toBe('burst')
  expect(punch.shape).toBe('strike')
  expect(moveHits(beam,{x:0,y:0},{x:250,y:0},{x:220,y:15})).toBe(true)
  expect(moveHits(beam,{x:0,y:0},{x:250,y:0},{x:220,y:145})).toBe(false)
  expect(moveHits(burst,{x:0,y:0},{x:150,y:0},{x:220,y:20})).toBe(true)
  expect(moveHits(punch,{x:0,y:0},{x:90,y:0},{x:210,y:0})).toBe(false)
 })
})
describe('sourced stage enemy sets and transparent cooking estimates',()=>{
 it('matches Serebii first-steppe weighted boss sets and Gloomy Grove',()=>{
  expect(Object.keys(VERIFIED_ENCOUNTERS)).toHaveLength(14)
  for(let s=0;s<4;s++){
   const waves=verifiedWaves(6,s,20,()=>0.5)!
   expect(waves).toHaveLength(3)
   expect(waves[2][0].boss).toBe(true)
  }
  expect(verifiedWaves(6,0,10,()=>0)![2][0].species).toBe(52)
  expect(verifiedWaves(6,1,10,()=>0)![2][0].species).toBe(11)
  expect(verifiedWaves(6,1,10,()=>.99)![2][0].species).toBe(14)
  expect(verifiedWaves(6,2,10,()=>.98)![2][0].species).toBe(133)
  expect(verifiedWaves(7,0,10,()=>0)![2][0].species).toBe(44)
  expect(verifiedWaves(7,2,10,()=>0)![2][0].species).toBe(70)
  expect(verifiedWaves(7,3,10,()=>0)![2][0].species).toBe(47)
  expect(verifiedWaves(7,4,10,()=>0)![2][0].species).toBe(12)
  expect(verifiedWaves(7,4,10,()=>.99)![2][0].species).toBe(15)
  expect(verifiedWaves(7,3,10,()=>0)![1].length).toBeGreaterThan(0)
  expect(verifiedWaves(8,0,10,()=>0)![2][0].species).toBe(80)
  expect(verifiedWaves(8,1,10,()=>0)![2][0].species).toBe(73)
  expect(verifiedWaves(8,2,10,()=>0)![2][0].species).toBe(55)
  expect(verifiedWaves(8,3,10,()=>0)![2][0].species).toBe(91)
  expect(verifiedWaves(8,4,10,()=>0)![2][0].species).toBe(62)
  expect(verifiedWaves(9,0,10,()=>0)).toBeUndefined()
 })
 it('normalizes each recipe’s probability distribution to 100%',()=>{
  const sample=['mushroomRed','mushroomRed','rootRed','rootRed','rootRed'] as const
  const odds=attractionOdds([...sample])
  expect(odds.length).toBeGreaterThan(0)
  expect(odds.reduce((n,o)=>n+o.probability,0)).toBeCloseTo(1)
  const valid=new Set(odds.map(x=>x.species.id))
  for(const seed of [0,.1,.3,.5,.8,.99])expect(valid.has(cook([...sample],()=>seed).id)).toBe(true)
 })
})
