import { describe, expect, it } from 'vitest'
import { encounterBalance } from './battleBalance'
import { ORIGINAL_FIRST } from './originalCampaign'
import { createBattle, movePartyTo, steerParty, step, FIELD } from '../engine/battle'
import { computeStats } from './stats'
import { getSpecies } from './roster'
import { getStage } from './stages'

const starter=(id:string)=>({
  ownedId:id,speciesId:25,level:5,stats:computeStats(getSpecies(25),5),
})

describe('Forgiving starter expedition difficulty',()=>{
  it('reduces the first fight enemy health and damage for one starter',()=>{
    const stage=getStage(ORIGINAL_FIRST,0)
    const one=encounterBalance(stage,1),two=encounterBalance(stage,2),three=encounterBalance(stage,3)
    expect(one.hp).toBeLessThan(two.hp)
    expect(two.hp).toBeLessThan(three.hp)
    expect(one.attack).toBeLessThan(two.attack)
    expect(one.allyHeal).toBeGreaterThan(three.allyHeal)
    expect(one.bossHp).toBeLessThan(three.bossHp)
  })
  it('does not accidentally trivialize late-world encounters',()=>{
    const stage=getStage(ORIGINAL_FIRST+8,1)
    expect(encounterBalance(stage,1)).toEqual(encounterBalance(stage,3))
  })
  it('uses the real number of allies when the encounter is created',()=>{
    const stage=getStage(ORIGINAL_FIRST,0)
    const waves=[[{species:19,level:5}]]
    const solo=createBattle([starter('a')],waves,()=>0.5,stage)
    const trio=createBattle([starter('a'),starter('b'),starter('c')],waves,()=>0.5,stage)
    expect(solo.units.find(u=>u.side==='enemy')!.maxHp).toBeLessThan(trio.units.find(u=>u.side==='enemy')!.maxHp)
    expect(solo.balance.allyHeal).toBeGreaterThan(trio.balance.allyHeal)
  })
})
describe('Free-roaming 2D party controls',()=>{
  const battle=()=>createBattle([starter('a')],[[{species:19,level:1}]],()=>0.5)
  it('normalizes held diagonals so they do not sprint faster',()=>{
    const b=battle()
    steerParty(b,1,-1)
    expect(b.manualDirection?.x).toBeCloseTo(Math.SQRT1_2)
    expect(b.manualDirection?.y).toBeCloseTo(-Math.SQRT1_2)
    const u=b.units.find(x=>x.side==='ally')!
    const {x,y}=u
    step(b,0.05)
    expect(u.x).toBeGreaterThan(x)
    expect(u.y).toBeLessThan(y)
  })
  it('stops movement on release, while tap-to-move sets a new waypoint',()=>{
    const b=battle()
    steerParty(b,0,1)
    expect(b.manualDirection?.y).toBe(1)
    steerParty(b,0,0)
    expect(b.manualDirection).toBeNull()
    expect(movePartyTo(b,1200,400)).toBe(true)
    expect(b.manualPoint).toEqual({x:1200,y:400})
    steerParty(b,-1,0)
    expect(b.manualPoint).toBeNull()
    expect(movePartyTo(b,999999,-20)).toBe(true)
    expect(b.manualDirection).toBeNull()
    expect(b.manualPoint).toEqual({x:FIELD.x1,y:FIELD.y0})
  })
  it('rejects invalid waypoints and never enters a 3D coordinate space',()=>{
    const b=battle()
    expect(movePartyTo(b,NaN,100)).toBe(false)
    expect(movePartyTo(b,0,Infinity)).toBe(false)
    steerParty(b,100,0)
    expect(b.manualDirection?.x).toBe(1)
  })
})
