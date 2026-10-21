import { describe,expect,it } from 'vitest'
import { VERIFIED_ENCOUNTERS } from '../data/verifiedEncounters'
import { buildWaves, getStage } from './stages'
import { ORIGINAL_FIRST, ORIGINAL_BOSS_AREA } from './originalCampaign'
import { ATTRACTABLE_SOURCE_SPECIES, attractionWeight, QUEST_DISH_NAMES } from '../data/questAttractionWeights'
import { verifiedRecipeOdds } from '../data/verifiedRecipeOdds'
import { attractionOdds } from './cooking'
import { createBattle, movePartyTo, clearPartyWaypoint, step, useSpecial, FIELD } from '../engine/battle'
import { computeStats } from './stats'
import { defaultDualMoves } from './dualMoves'
import { getSpecies } from './roster'
import { QUEST_MOVE_BY_NAME } from '../data/questMoves'
const random=()=>.5
describe('Original 54 stages: complete sourced encounter coverage',()=>{
 it('includes exactly all four first-world and the 50 other original-world stages',()=>{
   const expected=Array.from({length:ORIGINAL_BOSS_AREA-ORIGINAL_FIRST+1},(_,n)=>{
     const count=[4,5,5,5,5,5,6,6,6,6,1][n]
     return Array.from({length:count},(_,i)=>`${ORIGINAL_FIRST+n}-${i}`)
   }).flat()
   expect(expected).toHaveLength(54)
   expect(Object.keys(VERIFIED_ENCOUNTERS).sort()).toEqual(expected.sort())
   for(let a=ORIGINAL_FIRST;a<=ORIGINAL_BOSS_AREA;a++)for(let i=0;i<[4,5,5,5,5,5,6,6,6,6,1][a-ORIGINAL_FIRST];i++){
     const waves=buildWaves(getStage(a,i),random)
     expect(waves.length).toBeGreaterThanOrEqual(1)
     expect(waves.flat().length).toBeGreaterThanOrEqual(1)
     for(const enemy of waves.flat())expect(getSpecies(enemy.species).id).toBe(enemy.species)
   }
 })
 it('keeps solo Mewtwo battle and intentional no-boss 5-1 exception',()=>{
   const mewtwo=buildWaves(getStage(ORIGINAL_BOSS_AREA,0),random).flat()
   expect(mewtwo).toHaveLength(1)
   expect(mewtwo[0]).toMatchObject({species:150,boss:true})
   expect(buildWaves(getStage(10,0),random).flat().some(e=>e.boss)).toBe(false)
 })
})
describe('Community source-based cooking weights',()=>{
 it('contains the documented 79 recruitable species and all 18 dish names',()=>{
   expect(ATTRACTABLE_SOURCE_SPECIES).toHaveLength(79)
   expect(QUEST_DISH_NAMES).toHaveLength(18)
   expect(new Set(ATTRACTABLE_SOURCE_SPECIES).size).toBe(79)
   expect(attractionWeight(1,'Grass','great')).toBe(8000)
   expect(attractionWeight(150,'Ambrosia','special')).toBe(300)
   expect(attractionWeight(151,'Ambrosia','special')).toBe(30)
   expect(attractionWeight(150,'Grass','basic')).toBe(0)
 })
 it('makes each disclosed sourced recipe/quality probability normalize to 100%',()=>{
   for(let n=1;n<=18;n++)for(const q of ['basic','good','great','special'] as const){
     const source=verifiedRecipeOdds(n,q)
     if(source)expect(source.reduce((sum,e)=>sum+e.probability,0)).toBeCloseTo(1)
   }
   const cooking=attractionOdds(['mushroomRed','mushroomRed','mushroomRed','mushroomRed','mushroomRed'])
   expect(cooking.reduce((sum,e)=>sum+e.probability,0)).toBeCloseTo(1)
 })
})
describe('Touchable 360° exploration',()=>{
 it('accepts north, southwest and southeast target points then resumes combat',()=>{
   const b=createBattle([{ownedId:'hero',speciesId:25,level:20,stats:computeStats(getSpecies(25),20)}],[[{species:19,level:1}]],random)
   const ally=b.units.find(x=>x.side==='ally')!
   const enemy=b.units.find(x=>x.side==='enemy')!
   enemy.x=2750;enemy.y=1200;enemy.speed=0;enemy.atkCd=999
   const x=ally.x,y=ally.y
   expect(movePartyTo(b,x-120,y-190)).toBe(true)
   step(b,.2);expect(ally.x).toBeLessThan(x);expect(ally.y).toBeLessThan(y)
   const mid={x:ally.x,y:ally.y}
   expect(movePartyTo(b,mid.x+250,mid.y+120)).toBe(true)
   step(b,.2);expect(ally.x).toBeGreaterThan(mid.x);expect(ally.y).toBeGreaterThan(mid.y)
   expect(movePartyTo(b,-10000,100000)).toBe(true)
   expect(b.manualPoint).toMatchObject({x:FIELD.x0,y:FIELD.y1})
   clearPartyWaypoint(b);expect(b.manualPoint).toBe(null)
   expect(movePartyTo(b,Number.NaN,300)).toBe(false)
 })
})

describe('Quest moves resolve collision on impact frames',()=>{
 it('a fast-moving enemy can dodge a narrow Hyper Beam after the casting frame',()=>{
   const beam=QUEST_MOVE_BY_NAME.get('Hyper Beam')!
   const make=()=>{
     const b=createBattle([{ownedId:'x',speciesId:150,level:35,stats:computeStats(getSpecies(150),35),move:beam.id}],
       [[{species:19,level:10}]],random)
     const hero=b.units.find(u=>u.side==='ally')!,enemy=b.units.find(u=>u.side==='enemy')!
     hero.x=410;hero.y=650;hero.atkCd=999;hero.spCd=0
     enemy.x=615;enemy.y=650;enemy.atkCd=999;enemy.speed=0
     return {b,hero,enemy}
   }
   const dodge=make()
   const full=dodge.enemy.hp
   expect(useSpecial(dodge.b,dodge.hero.uid)).toBe(true)
   dodge.enemy.y+=245
   for(let i=0;i<15;i++)step(dodge.b,.05)
   expect(dodge.enemy.hp).toBe(full)
   const hit=make()
   const full2=hit.enemy.hp
   expect(useSpecial(hit.b,hit.hero.uid)).toBe(true)
   for(let i=0;i<15;i++)step(hit.b,.05)
   expect(hit.enemy.hp).toBeLessThan(full2)
 })
})

describe('Every starting species can finish the introductory expedition',()=>{
 it('keeps 1-1 accessible with any of the five starter Pokémon',()=>{
  for(const speciesId of [1,4,7,25,133]){
   for(const seed of [3,11]){
    let n=seed>>>0
    const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}
    const stage=getStage(ORIGINAL_FIRST,0)
    const b=createBattle([{ownedId:'starter',speciesId,level:5,
     stats:computeStats(getSpecies(speciesId),5),...defaultDualMoves(speciesId)}],buildWaves(stage,rng),rng,stage)
    b.auto=true
    for(let i=0;i<3500 && b.phase!=='lost' && b.phase!=='won';i++)step(b,.1)
    expect(b.phase,`starter ${speciesId} seed ${seed}`).toBe('won')
   }
  }
 })
})
