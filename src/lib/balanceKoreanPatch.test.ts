import { describe, expect, it } from 'vitest'
import { KOREAN_QUEST_MOVES, koreanMoveName } from '../data/questMoveKorean'
import { QUEST_MOVES } from '../data/questMoves'
import { encounterBalance } from './battleBalance'
import { ORIGINAL_FIRST } from './originalCampaign'
import { createBattle, step } from '../engine/battle'
import { computeStats } from './stats'
import { getMove, getSpecies } from './roster'
import { buildWaves, getStage } from './stages'
import { calcDamage } from './damage'

const fixed = () => .5
const first = getStage(ORIGINAL_FIRST, 0)
const solo = (id: number) => ({
  ownedId: 'starter-'+id,
  speciesId: id,
  level: 5,
  stats: computeStats(getSpecies(id), 5),
})

describe('1.0.1 middle-difficulty tuning', () => {
  it('no longer reduces early enemy HP to 20 percent of baseline', () => {
    for (let s=0;s<5;s++) {
      const stage=getStage(ORIGINAL_FIRST,s)
      const one=encounterBalance(stage,1)
      const three=encounterBalance(stage,3)
      expect(one.hp).toBeGreaterThan(.8)
      expect(three.hp).toBeGreaterThan(1)
      expect(one.attack).toBeGreaterThan(.3)
      expect(one.attack).toBeLessThan(1)
      expect(one.defense).toBeGreaterThan(.9)
      expect(one.bossHp).toBeGreaterThan(.8)
    }
  })

  it('1-1 enemies survive ordinary attacks from untrained level-5 starter Pokémon', () => {
    for(const id of [1,4,7,25,133]) {
      const b=createBattle([solo(id)],[[{species:16,level:1}]],fixed,first)
      const ally=b.units.find(x=>x.side==='ally')!
      const enemy=b.units.find(x=>x.side==='enemy')!
      const expected=calcDamage({
        level:ally.level,
        power:ally.basic.power*(ally.types.includes(ally.basic.type)?1.3:1),
        atk:ally.atk,def:enemy.def,
        moveType:ally.basic.type,defenderTypes:enemy.types,rng:fixed,
      }).damage
      expect(enemy.maxHp, `starter #${id} needs > one ordinary hit`).toBeGreaterThan(expected)
    }
  })

  it('the first stage strong final foe has meaningfully greater durability than normal fodder', () => {
    const normal=createBattle([solo(25)],[[{species:52,level:2}]],fixed,first)
    const elite=createBattle([solo(25)],[[{species:52,level:2,elite:true}]],fixed,first)
    const a=normal.units.find(x=>x.side==='enemy')!
    const b=elite.units.find(x=>x.side==='enemy')!
    expect(b.maxHp).toBeGreaterThan(a.maxHp*1.7)
    expect(b.def).toBeGreaterThan(a.def)
    const waves=buildWaves(first,fixed)
    expect(waves[waves.length-1].some(x=>x.elite||x.boss)).toBe(true)
  })

  it('ordinary enemies can automatically cast damage or support specials', () => {
    const b=createBattle([solo(25)],[[{species:52,level:5}]],fixed,first)
    const enemy=b.units.find(x=>x.side==='enemy')!
    const ally=b.units.find(x=>x.side==='ally')!
    enemy.spCd=0
    enemy.atkCd=100
    // Keep combatants alive and in range for deterministic attack event.
    enemy.x=ally.x+60; enemy.y=ally.y
    ally.hp=ally.maxHp=100000
    step(b,.05)
    expect(b.events.some(e=>e.k==='attack'&&e.from===enemy.uid&&e.special)).toBe(true)
  })
})

describe('all 167 Quest moves have visible Korean labels', () => {
  it('localizes all 167 authentic Quest moves and retains stable IDs/save keys', () => {
    expect(QUEST_MOVES).toHaveLength(167)
    expect(Object.keys(KOREAN_QUEST_MOVES)).toHaveLength(167)
    for(const move of QUEST_MOVES) {
      const label=koreanMoveName(move.name)
      expect(label).toMatch(/[가-힣]/)
      expect(label).not.toBe(move.name)
      expect(getMove(move.id)).toBe(move)
    }
  })
  it('does not touch already translated legacy moves or lose long labels', () => {
    expect(koreanMoveName('Thunderbolt')).toBe('10만볼트')
    expect(koreanMoveName('Crunch')).toBe('깨물어부수기')
    expect(koreanMoveName('Psychic')).toBe('사이코키네시스')
    expect(koreanMoveName('몸통박치기')).toBe('몸통박치기')
  })
})
