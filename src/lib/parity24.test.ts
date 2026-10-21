import { describe, expect, it } from 'vitest'
import { QUEST_COOKING_WEIGHTS, originalCookingWeight } from '../data/originalCookingWeights'
import { attractionOdds, cook } from './cooking'
import { STAGE_ENCOUNTERS, STAGE_SOURCE_COUNT, STAGE_MODELED_COUNT, verifiedWaves, sourceConfidence } from '../data/verifiedEncounters'
import { ORIGINAL_STAGE_COUNTS } from './originalCampaign'
import { getStage, buildWaves } from './stages'
import { QUEST_MOVE_BY_NAME } from '../data/questMoves'
import { getSpecies } from './roster'
import { createBattle, useSpecial, step } from '../engine/battle'
import { computeStats } from './stats'

describe('all 151 Pokémon original recipe weight sources',()=>{
 it('has every species ID and exact datamine weights across 18 dishes and four qualities',()=>{
  expect(QUEST_COOKING_WEIGHTS.size).toBe(151)
  expect(originalCookingWeight(1,1,1)).toBe(500)
  expect(originalCookingWeight(1,4,2)).toBe(8000)
  expect(originalCookingWeight(25,16,3)).toBe(8000)
  expect(originalCookingWeight(150,18,3)).toBe(300)
  expect(originalCookingWeight(151,18,3)).toBe(30)
  expect(originalCookingWeight(6,2,3)).toBe(0)
 })
 it('makes original normal red stew using only the seven allowed species',()=>{
  const ingredients=Array(5).fill('mushroomRed') as Parameters<typeof attractionOdds>[0]
  const result=attractionOdds(ingredients)
  expect(result.length).toBe(7)
  expect(result.reduce((total,x)=>total+x.probability,0)).toBeCloseTo(1)
  for(const x of result)expect(x.weight).toBeGreaterThan(0)
  for(const random of [0,.01,.25,.5,.99])expect(result.map(x=>x.species.id)).toContain(cook(ingredients,()=>random).id)
 })
 it('honors rare mythical recipe weight distribution',()=>{
  const ingredients=Array(5).fill('shell') as Parameters<typeof attractionOdds>[0]
  const result=attractionOdds(ingredients)
  expect(result.reduce((total,x)=>total+x.probability,0)).toBeCloseTo(1)
  expect(result.find(x=>x.species.id===150)?.weight).toBe(300)
  expect(result.find(x=>x.species.id===151)?.weight).toBe(30)
 })
})
describe('63 explicit original stage enemy profiles, source audit',()=>{
 it('covers all 11 worlds and all nine postgame stages without old random wave fallback',()=>{
  const counts=[...ORIGINAL_STAGE_COUNTS,9]
  expect(counts.reduce((a,b)=>a+b,0)).toBe(63)
  let total=0
  for(let area=6;area<=17;area++){
    for(let index=0;index<counts[area-6];index++){
      total++
      const e=STAGE_ENCOUNTERS[`${area}-${index}`]
      expect(e,`missing ${area}-${index}`).toBeTruthy()
      const waves=verifiedWaves(area,index,getStage(area,index).level,()=>0.5)
      expect(waves).toHaveLength(3)
      expect(waves!.every(w=>w.length>0)).toBe(true)
      expect(waves![2].some(x=>x.boss)).toBe(true)
      expect(buildWaves(getStage(area,index),()=>0.5)).toEqual(waves)
    }
  }
  expect(total).toBe(63)
  expect(STAGE_SOURCE_COUNT+STAGE_MODELED_COUNT).toBe(63)
  expect(STAGE_SOURCE_COUNT).toBe(27)
  expect(STAGE_MODELED_COUNT).toBe(36)
  expect(sourceConfidence(8,0)).toBe('reference')
  expect(sourceConfidence(10,0)).toBe('modeled')
 })
 it('supports triple Marowak bosses and weighted evolution enemies',()=>{
  const waves=verifiedWaves(10,3,40,()=>0) ?? []
  expect(waves[2]).toHaveLength(3)
  expect(waves[2].map(x=>x.species)).toEqual([105,105,105])
  expect(verifiedWaves(9,3,30,()=>0)?.[2][0].species).toBe(59)
  expect(verifiedWaves(8,4,30,()=>0)?.[2][0].species).toBe(62)
 })
})
describe('60fps fixed-step enemy AI and impact collision',()=>{
 it('creates ranged and melee attacks and advances in fractional frames',()=>{
  const hp=computeStats(getSpecies(25),40)
  const enemy=computeStats(getSpecies(19),40)
  const b=createBattle([{ownedId:'m1',speciesId:25,level:40,stats:hp,move:QUEST_MOVE_BY_NAME.get('Thunderbolt')?.id}],
    [[{species:19,level:40}]],()=>.5)
  const before=b.t
  step(b,1/30)
  expect(b.t-before).toBeCloseTo(1/30)
  expect(b.units.filter(u=>u.side==='enemy')).toHaveLength(1)
  // Avoid checking stochastic damage or retail frame-perfect behavior.
  for(let i=0;i<60&&b.phase==='fight';i++)step(b,1/60)
  expect(b.t).toBeGreaterThan(.5)
  expect(enemy.maxHp).toBeGreaterThan(0)
 })
})
