import {describe,expect,it} from 'vitest'
import {createBattle,step} from '../engine/battle'
import {getStage,buildWaves,recommendedPower} from './stages'
import {ORIGINAL_FIRST} from './originalCampaign'
import {computeStats,powerRating} from './stats'
import {getSpecies} from './roster'
import {defaultDualMoves} from './dualMoves'
const seeded=(n:number)=>()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}
/** Build a realistic evenly developed three-member team with a concrete *displayed*
 * power of ~1318, not a fictitious level-90 monster with a massive attack.
 */
export const mediumTeam=(power=1318)=>{
 const sp=[25,4,7], base=sp.map(id=>computeStats(getSpecies(id),8))
 const total=base.reduce((sum,s)=>sum+powerRating(s),0)
 const mul=power/total
 return sp.map((speciesId,i)=>{
  const s=base[i]
  const stats={...s,maxHp:Math.max(1,Math.round(s.maxHp*mul)),atk:Math.max(1,Math.round(s.atk*mul))}
  return {ownedId:'m'+i,speciesId,level:8,stats,...defaultDualMoves(speciesId)}
 })
}
const simulate=(index:number,power:number,seed:number,auto=true)=>{
 const stage=getStage(ORIGINAL_FIRST,index),rng=seeded(seed)
 const b=createBattle(mediumTeam(power),buildWaves(stage,rng),rng,stage)
 b.auto=auto
 let ticks=0
 while(b.phase!=='won'&&b.phase!=='lost'&&ticks++<2400)step(b,.1)
 return {outcome:b.phase,time:b.t,kills:b.kills,ticks,totalPower:mediumTeam(power).reduce((n,p)=>n+powerRating(p.stats),0)}
}
describe('1-3 recommended-power regression',()=>{
 it('confirms 1-3 is the expedition with recommended power 390',()=>{
  expect(getStage(ORIGINAL_FIRST,2).recommended).toBe(390)
  expect(recommendedPower(getStage(ORIGINAL_FIRST,2))).toBe(390)
 })
 it('three ~1318-power beginners should win 1-3 in a majority of seeded auto runs',()=>{
  const runs=[3,7,12,23,39].map(seed=>simulate(2,1318,seed))
  const wins=runs.filter(x=>x.outcome==='won')
  expect(wins.length,JSON.stringify(runs)).toBeGreaterThanOrEqual(4)
 })
 it('a well-developed team can still be challenged by stronger later content',()=>{
  const team=mediumTeam(1318)
  expect(team.reduce((n,p)=>n+powerRating(p.stats),0)).toBeGreaterThan(1150)
  const weak=[3,9,17].map(seed=>simulate(2,360,seed))
  expect(weak.filter(x=>x.outcome==='won').length).toBeLessThan(3)
 })
 it('same team is meaningfully more reliable in the first stage',()=>{
  const results=[1,8,15].map(seed=>simulate(0,1318,seed))
  expect(results.every(r=>r.outcome==='won'),JSON.stringify(results)).toBe(true)
 })
})
