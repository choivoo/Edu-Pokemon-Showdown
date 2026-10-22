import { describe, expect, it } from 'vitest'
import { encounterBalance } from './battleBalance'
import { defaultDualMoves, ensureDualMoves } from './dualMoves'
import { WORLD_BOUNDS } from '../art/openField'
import { createBattle, FIELD, step, waveCenter } from '../engine/battle'
import { buildWaves, getStage } from './stages'
import { ORIGINAL_FIRST } from './originalCampaign'
import { computeStats } from './stats'
import { getSpecies } from './roster'

const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
describe('gentle beginner difficulty without flatlining later progression', () => {
  it('keeps original 1-1 to 1-4 stage strengths rising gradually', () => {
    const vals = Array.from({length:4},(_,i)=>encounterBalance({area:ORIGINAL_FIRST,index:i}))
    expect(vals.every((v,i)=>v.hp>1&&(i===0||v.hp>vals[i-1].hp))).toBe(true)
    expect(vals.every((v,i)=>i===0||v.attack>vals[i-1].attack)).toBe(true)
    expect(vals.every(v=>v.bossHp>=.9&&v.bossHp<=1.2)).toBe(true)
    expect(encounterBalance({area:ORIGINAL_FIRST+4,index:0}).hp).toBeCloseTo(1.06)
    expect(getStage(ORIGINAL_FIRST,0).recommended).toBe(140)
  })
  it('a freshly recruited level-five Pikachu can beat story 1-1 alone', () => {
    const stage=getStage(ORIGINAL_FIRST,0)
    const pikachu={ownedId:'starter',speciesId:25,level:5,
      stats:computeStats(getSpecies(25),5),...defaultDualMoves(25)}
    for(const seed of [1,2,4]){
      const rng=seeded(seed)
      const b=createBattle([pikachu],buildWaves(stage,rng),rng,stage)
      let steps=0
      while(b.phase!=='won'&&b.phase!=='lost'&&steps++<5000)step(b,.1)
      if(b.phase!=='won')console.log('PIKACHU-DIAG',JSON.stringify({seed,phase:b.phase,t:b.t,wave:b.wave,balance:b.balance,units:b.units.map(u=>({name:u.name,hp:Math.round(u.hp),maxHp:u.maxHp,side:u.side,alive:u.alive,spCd:u.spCd,attack:u.atk,def:u.def,special:u.special.name})),events:{all:b.events.length,attacks:b.events.filter(e=>e.k==='attack'&&e.from===b.units[0].uid).length,hits:b.events.filter(e=>e.k==='hit'&&e.from===b.units[0].uid).length,damage:b.events.filter(e=>e.k==='hit'&&e.from===b.units[0].uid).map(e=>e.k==='hit'?e.amount:0).slice(-20)}}}))
      expect(b.phase).toBe('won')
    }
  })
  it('all first four verified stages have a special last-wave boss with finale event', () => {
    for(let index=0;index<4;index++){
      const stage=getStage(ORIGINAL_FIRST,index)
      const waves=buildWaves(stage,seeded(index+11))
      expect(waves[waves.length-1].some(e=>e.boss)).toBe(true)
    }
    const b=createBattle([{ownedId:'hero',speciesId:150,level:100,
      stats:computeStats(getSpecies(150),100)}],[[{species:52,level:1,boss:true}]],seeded(10))
    for(let i=0;i<5000&&!b.events.some(e=>e.k==='bossDefeated');i++)step(b,.1)
    expect(b.events.some(e=>e.k==='bossDefeated')).toBe(true)
    expect(b.events.filter(e=>e.k==='bossDefeated')).toHaveLength(1)
  })
})
describe('real 360-degree travel in an oversized 2D/2.5D map',()=>{
  it('route returns west after eastward progress and travels north and south',()=>{
    const route=[0,1,2].map(i=>waveCenter(i,3))
    expect(route[1].x).toBeGreaterThan(route[0].x)
    expect(route[2].x).toBeLessThan(route[1].x)
    expect(route[1].y).toBeGreaterThan(route[0].y)
    expect(route[2].y).toBeLessThan(route[0].y)
    expect(FIELD.x1-FIELD.x0).toBeGreaterThan(2500)
    expect(WORLD_BOUNDS.bottom-WORLD_BOUNDS.top).toBeGreaterThan(1200)
  })
  it('units approach enemies in directions other than east',()=>{
    const b=createBattle([{ownedId:'a',speciesId:25,level:20,
      stats:computeStats(getSpecies(25),20)}],[[{species:19,level:1}]])
    const ally=b.units.find(u=>u.side==='ally')!
    const foe=b.units.find(u=>u.side==='enemy')!
    ally.x=1800;ally.y=1050;foe.x=1600;foe.y=600;foe.speed=0;foe.atkCd=999
    const before={x:ally.x,y:ally.y}
    step(b,.1)
    expect(ally.x).toBeLessThan(before.x)
    expect(ally.y).toBeLessThan(before.y)
  })
})
describe('two original-style skill buttons always available for old and new Pokémon',()=>{
  it('assigns independent, distinct primary and secondary moves',()=>{
    for(const id of [1,4,7,25,94,133,150,151]){
      const duo=defaultDualMoves(id)
      expect(duo.move).toBeTruthy()
      expect(duo.move2).toBeTruthy()
      expect(duo.move).not.toBe(duo.move2)
    }
    const existing={id:'m99',species:25,level:37,exp:0,stones:[],mstones:[],bonus:[],
      move:'quest-thunderbolt'}
    const upgraded=ensureDualMoves(existing)
    expect(upgraded.move).toBe('quest-thunderbolt')
    expect(upgraded.move2).not.toBe(upgraded.move)
    expect(ensureDualMoves(upgraded)).toBe(upgraded)
  })
})
