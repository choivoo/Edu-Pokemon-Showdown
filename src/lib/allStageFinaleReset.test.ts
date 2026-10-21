import { describe, expect, it } from 'vitest'
import { createBattle, step, type AllyInput } from '../engine/battle'
import { computeStats } from './stats'
import { getSpecies } from './roster'
import { getStage, buildWaves, type WaveEnemy } from './stages'
import { useGame } from '../store/gameStore'

const rng = () => 0.32
const ally: AllyInput = { ownedId:'test', speciesId:150, level:90, stats:computeStats(getSpecies(150),90) }
const finish = (waves:WaveEnemy[][]) => {
 const b=createBattle([ally],waves,rng)
 b.auto=true
 for(let i=0;i<4800 && b.phase!=='won' && b.phase!=='lost';i++)step(b,.05)
 return b
}
const finales = (b:ReturnType<typeof createBattle>)=>b.events.filter(e=>e.k==='bossDefeated')

describe('all-expedition victory flourish',()=>{
 it('plays exactly one explosion on a non-boss final enemy',()=>{
   const b=finish([[{species:19,level:1}]])
   expect(b.phase).toBe('won')
   expect(finales(b)).toHaveLength(1)
   expect(finales(b)[0]).toMatchObject({ k:'bossDefeated' })
   expect(b.finalePlayed).toBe(true)
 })
 it('plays exactly once even when the final boss also triggers an existing boss knockout',()=>{
   const b=finish([[{species:19,level:1}],[{species:52,level:1,boss:true},{species:19,level:1}]])
   expect(b.phase).toBe('won')
   expect(finales(b)).toHaveLength(1)
 })
 it('uses the final wave and not an intermediate normal enemy',()=>{
   const b=createBattle([ally],[[{species:19,level:1}],[{species:16,level:1}]],rng)
   b.auto=true
   for(let i=0;i<4800 && b.phase!=='won' && b.phase!=='lost';i++){
     step(b,.05)
     if(b.wave===0) expect(finales(b)).toHaveLength(0)
   }
   expect(b.phase).toBe('won')
   expect(finales(b)).toHaveLength(1)
 })
 it('never plays a victory blast for a lost expedition',()=>{
   const b=createBattle([ally],[[{species:150,level:100,boss:true}]],rng)
   for(const a of b.units.filter(x=>x.side==='ally')) a.alive=false
   step(b,.05)
   expect(b.phase).toBe('lost')
   expect(finales(b)).toHaveLength(0)
 })
 it('preserves all four first-region stage layouts for finale playback',()=>{
   for(let i=0;i<4;i++){
     const stage=getStage(6,i)
     const waves=buildWaves(stage,rng)
     expect(waves.length).toBeGreaterThan(1)
     expect(waves[waves.length-1].length).toBeGreaterThan(0)
   }
 })
})

describe('account reset behavior',()=>{
 it('clears all player progress and sends the user to the title screen',()=>{
   const state=useGame.getState()
   state.newGame('계정초기화테스트',25)
   expect(useGame.getState().save.owned.length).toBeGreaterThan(0)
   useGame.getState().hardReset()
   const s=useGame.getState()
   expect(s.screen).toBe('title')
   expect(s.panel).toBeNull()
   expect(s.save.started).toBe(false)
   expect(s.save.owned).toHaveLength(0)
   expect(s.save.party).toHaveLength(0)
   expect(s.save.cleared).toEqual({})
   expect(s.save.pmTickets).toBe(0)
 })
})
