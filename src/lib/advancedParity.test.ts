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
  expect(Object.keys(VERIFIED_ENCOUNTERS)).toHaveLength(54)
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
  expect(verifiedWaves(9,0,10,()=>0)![2][0].species).toBe(67)
  expect(verifiedWaves(9,1,10,()=>0)![2][0].species).toBe(38)
  expect(verifiedWaves(9,2,10,()=>0)![2][0].species).toBe(78)
  expect(verifiedWaves(9,3,10,()=>0)![2][0].species).toBe(59)
  expect(verifiedWaves(9,4,10,()=>0)![2][0].species).toBe(68)
  expect(verifiedWaves(10,0,10,()=>0)).toHaveLength(2)
  expect(verifiedWaves(10,1,10,()=>0)![2].map(x=>x.species)).toEqual([42,41])
  expect(verifiedWaves(10,2,10,()=>0)![2][0].species).toBe(95)
  expect(verifiedWaves(10,3,10,()=>0)![2].map(x=>x.species)).toEqual([105,105,105])
  expect(verifiedWaves(10,4,10,()=>0)![2][0].species).toBe(76)
  expect(verifiedWaves(11,0,10,()=>0)![2][0].species).toBe(53)
  expect(verifiedWaves(11,1,10,()=>0)![2][0].species).toBe(18)
  expect(verifiedWaves(11,2,10,()=>0)![2][0].species).toBe(97)
  expect(verifiedWaves(11,3,10,()=>0)![2][0].species).toBe(122)
  expect(verifiedWaves(11,4,10,()=>0)![2][0].species).toBe(65)
  expect(verifiedWaves(11,4,10,()=>0.999)![2][0].species).toBe(143)
  expect(verifiedWaves(12,0,10,()=>0)![2][0].species).toBe(49)
  expect(verifiedWaves(12,1,10,()=>0)![2].map(x=>x.species)).toEqual([110,110])
  expect(verifiedWaves(12,2,10,()=>0)![2][0].species).toBe(71)
  expect(verifiedWaves(12,3,10,()=>0)![2][0].species).toBe(89)
  expect(verifiedWaves(12,4,10,()=>0)![2][0].species).toBe(45)
  expect(verifiedWaves(12,5,10,()=>0)![2][0].species).toBe(123)
  expect(verifiedWaves(12,5,10,()=>0.99)![2][0].species).toBe(127)
  expect(verifiedWaves(13,0,10,()=>0)![2][0].species).toBe(40)
  expect(verifiedWaves(13,1,10,()=>0)![2][0].species).toBe(24)
  expect(verifiedWaves(13,2,10,()=>.99)![2][0].species).toBe(142)
  expect(verifiedWaves(13,3,10,()=>0)![2][0].species).toBe(108)
  expect(verifiedWaves(13,4,10,()=>0)![2][0].species).toBe(36)
  expect(verifiedWaves(13,5,10,()=>0)![2].map(x=>x.species)).toEqual([34,31])
  expect(verifiedWaves(14,0,10,()=>0)![2][0].species).toBe(93)
  expect(verifiedWaves(14,1,10,()=>0)![2][0].species).toBe(112)
  expect(verifiedWaves(14,2,10,()=>.99)![2][0].species).toBe(131)
  expect(verifiedWaves(14,3,10,()=>0)![2][0].species).toBe(82)
  expect(verifiedWaves(14,4,10,()=>0)![2][0].species).toBe(124)
  expect(verifiedWaves(14,5,10,()=>0)![2][0].species).toBe(94)
  expect(verifiedWaves(15,0,10,()=>0)![2][0].species).toBe(121)
  expect(verifiedWaves(15,1,10,()=>0)![2][0].species).toBe(117)
  expect(verifiedWaves(15,2,10,()=>.99)![2][0].species).toBe(148)
  expect(verifiedWaves(15,3,10,()=>0)![2][0].species).toBe(99)
  expect(verifiedWaves(15,4,10,()=>0)![2].map(x=>x.species)).toEqual([85,85,85])
  expect(verifiedWaves(15,5,10,()=>.99)![2].map(x=>x.species)).toEqual([149,149])
  expect(verifiedWaves(16,0,10,()=>0)).toEqual([[{species:150,level:10,boss:true}]])
  expect(verifiedWaves(17,0,10,()=>0)).toBeUndefined()
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
