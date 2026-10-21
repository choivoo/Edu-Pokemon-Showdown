import { describe, expect, it } from 'vitest'
import { QUEST_MOVES } from '../data/questMoves'
import { QUEST_SPECIES, questLearnset, questStats } from '../data/questSpecies'
import { getSpecies, getMove } from './roster'
import { computeStats } from './stats'
import { rollRewards, getStage } from './stages'
import { acceptsSocket, socketLayout } from './pCharm'
import { defaultSave } from './storage'
import { pack, unpack } from './saveKey'
import { gradeOf, cookingExpeditions } from './cooking'
import { type Stone } from './stones'
import { typeMultiplier } from './typeChart'

describe('Pokémon Quest original workbook move and stat dataset', () => {
  it('provides 167 authentic Quest moves with wait time, power, and compatible stones', () => {
    expect(QUEST_MOVES).toHaveLength(167)
    expect(new Set(QUEST_MOVES.map(m=>m.id)).size).toBe(167)
    const punch = QUEST_MOVES.find(m=>m.name==='Mega Punch')!
    expect(punch.power).toBe(561)
    expect(punch.wait).toBe(5)
    expect(getMove(punch.id)).toBe(punch)
    expect(punch.stones?.length).toBeGreaterThan(0)
    const beam = QUEST_MOVES.find(m=>m.name==='Hyper Beam')!
    expect(beam.power).toBe(300)
    expect(beam.wait).toBe(10)
  })
  it('contains all 151 original Kanto Pokémon individual base HP/ATK + learnsets', () => {
    expect(QUEST_SPECIES.size).toBe(151)
    expect(questStats(25)).toMatchObject({hp:70, atk:130})
    for (let id=1;id<=151;id++) {
      const data = questStats(id)
      expect(data).toBeTruthy()
      expect(data!.hp).toBeGreaterThan(0)
      expect(data!.atk).toBeGreaterThan(0)
      expect(questLearnset(id).length).toBeGreaterThanOrEqual(1)
      for (const move of questLearnset(id)) expect(QUEST_MOVES).toContain(move)
    }
    expect(computeStats(getSpecies(25),1).atk).toBe(131)
    expect(computeStats(getSpecies(25),1).maxHp).toBe(71)
  })
  it('ignores conventional Pokémon elemental weaknesses', () => {
    expect(typeMultiplier('fire',['grass'])).toBe(1)
    expect(typeMultiplier('electric',['ground'])).toBe(1)
    expect(typeMultiplier('normal',['ghost'])).toBe(1)
  })
})
describe('Original cooking and P stone game rules',()=>{
  const base=['fossil','fossil','fossil','fossil','fossil'] as const
  it('uses precise 2/4/5/6 cooking times, higher pot adjustments and shell extra time', () => {
    for (const [tier,n] of [2,2,3,4].entries()) expect(cookingExpeditions([...base],tier as 0|1|2|3)).toBe(n)
    expect(gradeOf(['honey','honey','honey','fossil','fossil'])).toBe('great')
    expect(gradeOf(['rainbow','rainbow','honey','fossil','fossil'])).toBe('special')
    expect(cookingExpeditions(['shell','fossil','fossil','fossil','fossil'],0)).toBe(5)
  })
  it('guarantees three-perk gold stones and greater ingredient drops with expedition bonus',()=>{
    const stage = getStage(6,2)
    const s = rollRewards(stage,()=>0.45,true)
    expect(s.stone?.star).toBe(3)
    expect(Object.keys(s.stone?.perks ?? {})).toHaveLength(3)
    expect(Object.values(s.ingredients).reduce((a,b)=>a+(b ?? 0),0)).toBeGreaterThanOrEqual(10)
  })
  it('handles species-specific nine socket kinds without breaking old saves',()=>{
    const sockets=socketLayout(25)
    expect(sockets).toHaveLength(9)
    expect(sockets).toContain('hp')
    expect(sockets).toContain('atk')
    expect(sockets).toContain('any')
    const at=sockets.indexOf('atk')
    expect(acceptsSocket(sockets,at%3,Math.floor(at/3),'hp')).toBe(false)
    expect(acceptsSocket(sockets,at%3,Math.floor(at/3),'atk')).toBe(true)
    expect(acceptsSocket(undefined,at%3,Math.floor(at/3),'hp')).toBe(true)
  })
  it('persists rare stone perks, socket patterns and original pot stat bonuses', () => {
    const s=defaultSave()
    const st: Stone={id:'s42',kind:'hp',shape:'dot',star:3,value:521,perks:{regen:2.4,reviveSpeed:4,critRate:9}}
    s.stones=[st]
    s.owned=[{id:'m12',species:25,level:60,exp:0,stones:[],bonus:[],mstones:[],
      potBonus:300,ivHp:67,ivAtk:54,sockets:socketLayout(25)}]
    const restored=unpack(pack(s))
    expect(restored.stones).toEqual([st])
    expect(restored.owned[0].potBonus).toBe(300)
    expect(restored.owned[0].ivHp).toBe(67)
    expect(restored.owned[0].ivAtk).toBe(54)
    expect(restored.owned[0].sockets).toEqual(s.owned[0].sockets)
    const increased=computeStats(getSpecies(25),60,[st])
    const baseStats=computeStats(getSpecies(25),60)
    expect(increased.maxHp-baseStats.maxHp).toBe(521)
    expect(increased.regen).toBeCloseTo(0.024)
    expect(increased.reviveSpeed).toBeCloseTo(0.04)
  })
})
