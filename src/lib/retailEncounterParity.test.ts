import { describe, expect, it } from 'vitest'
import { VERIFIED_RECIPE_GRADES, verifiedRecipeOdds } from '../data/verifiedRecipeOdds'
import { VERIFIED_ENCOUNTERS, verifiedWaves } from '../data/verifiedEncounters'
import { getSpecies } from './roster'
import { attractionOdds } from './cooking'

describe('all original story expedition encounter sources',()=>{
 it('provides precisely 54 original non-postgame stages in original world order',()=>{
  const expected=[4,5,5,5,5,5,6,6,6,6,1]
  expect(Object.keys(VERIFIED_ENCOUNTERS)).toHaveLength(54)
  expected.forEach((n,i)=>{
   const area=6+i
   for(let stage=0;stage<n;stage++){
    const key=`${area}-${stage}`
    expect(VERIFIED_ENCOUNTERS[key],key).toBeTruthy()
    const zero=verifiedWaves(area,stage,25,()=>0)
    const one=verifiedWaves(area,stage,25,()=>.999)
    expect(zero?.length).toBeGreaterThanOrEqual(1)
    expect(one?.length).toBeGreaterThanOrEqual(1)
    for(const e of [...(zero??[]).flat(),...(one??[]).flat()])
      expect(()=>getSpecies(e.species)).not.toThrow()
   }
  })
 })
 it('uses original multi-opponent finishers and true one-wave Mewtwo boss',()=>{
  expect(verifiedWaves(10,0,25,()=>0)).toHaveLength(2)
  expect(verifiedWaves(10,3,25,()=>0)![2]).toHaveLength(3)
  expect(verifiedWaves(12,1,25,()=>0)![2]).toHaveLength(2)
  expect(verifiedWaves(13,5,25,()=>0)![2]).toHaveLength(2)
  expect(verifiedWaves(15,4,25,()=>0)![2]).toHaveLength(3)
  expect(verifiedWaves(16,0,25,()=>0)).toEqual([[{species:150,level:25,boss:true}]])
 })
})
describe('18 original Pokémon Quest dish source probability tables',()=>{
 it('has verified candidate tables for each of the 18 original dishes',()=>{
  expect(Object.keys(VERIFIED_RECIPE_GRADES).map(Number).sort((a,b)=>a-b)).toEqual(Array.from({length:18},(_,i)=>i+1))
  let gradeCount=0
  for(const [dish,grades] of Object.entries(VERIFIED_RECIPE_GRADES)){
   for(const grade of grades){
    gradeCount++
    const odds=verifiedRecipeOdds(Number(dish),grade)!
    expect(odds.length).toBeGreaterThan(0)
    expect(odds.reduce((sum,x)=>sum+x.probability,0)).toBeCloseTo(1,9)
    expect(new Set(odds.map(x=>x.id)).size).toBe(odds.length)
    for(const x of odds) {
      expect(x.probability).toBeGreaterThan(0)
      expect(()=>getSpecies(x.id)).not.toThrow()
    }
   }
  }
  expect(gradeCount).toBeGreaterThanOrEqual(54)
 })
 it('matches published high-impact exact recruit rates after rounding normalization',()=>{
  const pika=verifiedRecipeOdds(16,'special')!
  expect(pika.find(p=>p.id===25)?.probability).toBeCloseTo(.8,5)
  const legend=verifiedRecipeOdds(18,'special')!
  expect(legend.find(p=>p.id===150)?.probability).toBeCloseTo(.4762,3)
  expect(legend.find(p=>p.id===151)?.probability).toBeCloseTo(.0476,3)
  const mud=verifiedRecipeOdds(9,'special')!
  expect(mud).toEqual([{id:104,probability:1}])
  const normal=verifiedRecipeOdds(1,'basic')!
  expect(normal).toHaveLength(24)
  expect(normal.every(x=>Math.abs(x.probability-1/24)<.00001)).toBe(true)
 })
 it('does not silently relabel unattested quality combinations as official',()=>{
  expect(verifiedRecipeOdds(17,'basic')).toBeUndefined()
  expect(verifiedRecipeOdds(18,'basic')).toBeUndefined()
  expect(verifiedRecipeOdds(6,'special')).toBeUndefined()
  const sel=['honey','honey','honey','honey','honey'] as const
  const table=attractionOdds([...sel])
  expect(table.reduce((s,x)=>s+x.probability,0)).toBeCloseTo(1,8)
 })
})
