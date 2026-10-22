import { describe, expect, it } from 'vitest'
import { capFirstWorldHit, encounterBalance } from './battleBalance'
import { ORIGINAL_FIRST } from './originalCampaign'
import { createBattle, step, useSpecial } from '../engine/battle'
import { getMove, getSpecies } from './roster'
import { computeStats } from './stats'
import { getStage } from './stages'
import { KOREAN_QUEST_MOVES, koreanMoveName } from '../data/questMoveKorean'
import { QUEST_MOVES } from '../data/questMoves'

const fixed = () => 0.5
const strongPikachu = () => ({
  ownedId: 'tester', speciesId: 25, level: 85,
  stats: computeStats(getSpecies(25), 85), move: 'quest-mega-punch',
})

describe('1.0 official medium-difficulty damage ceiling', () => {
  it('requires repeated strikes against regular, elite and boss first-world Pokémon', () => {
    const cap = encounterBalance(getStage(ORIGINAL_FIRST,0)).earlyEnemyHitCap
    expect(cap).toBeDefined()
    // HP=1000; an extreme 5000-point hit must not remove the whole bar.
    const ordinary = capFirstWorldHit(5000,1000,cap,'normal',false)
    const special = capFirstWorldHit(5000,1000,cap,'normal',true)
    const elite = capFirstWorldHit(5000,1000,cap,'elite',true)
    const boss = capFirstWorldHit(5000,1000,cap,'boss',true)
    expect(ordinary).toBeGreaterThanOrEqual(350)
    expect(ordinary).toBeLessThanOrEqual(500)
    expect(special).toBeGreaterThan(ordinary)
    expect(special).toBeLessThanOrEqual(600)
    expect(elite).toBeLessThan(400)
    expect(boss).toBeLessThanOrEqual(300)
    expect(capFirstWorldHit(25,1000,cap,'normal',true)).toBe(25)
    expect(capFirstWorldHit(5000,1000,undefined,'boss',true)).toBe(5000)
  })

  it('keeps late-area encounters uncapped for upgraded teams', () => {
    const later = encounterBalance(getStage(ORIGINAL_FIRST+4,0))
    expect(later.earlyEnemyHitCap).toBeUndefined()
    expect(capFirstWorldHit(10000,1000,later.earlyEnemyHitCap,'normal',true)).toBe(10000)
  })

  it('a very powerful move cannot erase full-health early strong-looking opponents in one impact', () => {
    const stage = getStage(ORIGINAL_FIRST,0)
    for (const elite of [false,true]) {
      const b = createBattle([strongPikachu()], [[{species:52,level:3,...(elite?{elite:true}:{})}]], fixed, stage)
      const hero = b.units.find(x=>x.side==='ally')!
      const enemy = b.units.find(x=>x.side==='enemy')!
      const initial = enemy.hp
      hero.special = getMove('quest-mega-punch')
      hero.spCd = 0
      hero.atkCd = 999
      enemy.atkCd = 999
      enemy.x = hero.x + 35
      enemy.y = hero.y
      enemy.speed = 0
      expect(useSpecial(b,hero.uid)).toBe(true)
      step(b,0.35)
      expect(b.events.some(e=>e.k==='hit'&&e.from===hero.uid&&e.to===enemy.uid)).toBe(true)
      expect(enemy.hp).toBeGreaterThan(0)
      expect(enemy.hp).toBeGreaterThanOrEqual(initial * (elite?0.60:0.40))
    }
  })
})

describe('full Korean move UI data for all screens',()=>{
  it('has a Korean label for every authentic move including long skill names',()=>{
    expect(QUEST_MOVES).toHaveLength(167)
    for(const move of QUEST_MOVES){
      expect(koreanMoveName(move.name)).toMatch(/[가-힣]/)
      expect(koreanMoveName(move.name)).toBe(KOREAN_QUEST_MOVES[move.name])
    }
    for(const name of ['사이코키네시스','깨물어부수기','일렉트릭필드','뼈다귀부메랑']){
      expect(name.length).toBeGreaterThanOrEqual(6)
    }
  })
})
