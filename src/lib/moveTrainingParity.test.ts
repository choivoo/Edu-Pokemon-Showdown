import { afterEach,describe,expect,it } from 'vitest'
import { useGame } from '../store/gameStore'
import { getSpecies } from './roster'
import { defaultSave } from './storage'
import { moveFxOf } from './party'
import { QUEST_MOVES } from '../data/questMoves'
import { type OwnedMon } from './stats'
import { pack,unpack } from './saveKey'
import { recall } from './training'
import { createBattle,step } from '../engine/battle'
import { computeStats } from './stats'
afterEach(()=>useGame.getState().hardReset())
const mon=(id:string,species=25):OwnedMon=>({
 id,species,level:60,exp:0,stones:[],bonus:[],mstones:[],
 move:QUEST_MOVES.find(m=>m.name==='Thunderbolt')!.id,
 move2:QUEST_MOVES.find(m=>m.name==='Thunder Shock')!.id,
})
describe('two independently trained moves, move stone slots and old saves',()=>{
 it('has separate stone attachments, primary quick and secondary repeat',()=>{
  useGame.getState().newGame('훈련',25)
  useGame.setState(s=>({save:{...s.save,owned:[mon('m1')],party:['m1'],moveStones:[
   {id:'quick',kind:'quick'}, {id:'repeat',kind:'repeat'}
  ]}}))
  const store=useGame.getState()
  expect(store.equipMoveStone('m1','quick',0)).toBe(true)
  expect(store.equipMoveStone('m1','repeat',1)).toBe(true)
  expect(store.equipMoveStone('m1','quick',1)).toBe(false)
  let saved=useGame.getState().save, current=saved.owned[0]
  expect(moveFxOf(saved,current,0).quick).toBe(1)
  expect(moveFxOf(saved,current,0).repeat).toBe(0)
  expect(moveFxOf(saved,current,1).repeat).toBe(1)
  expect(moveFxOf(saved,current,1).quick).toBe(0)
  const restored=unpack(pack(saved))
  expect(restored.owned[0].moveStoneSlots).toEqual([0,1])
  expect(moveFxOf(restored,restored.owned[0],1).repeat).toBe(1)
  store.unequipMoveStone('m1','repeat')
  expect(useGame.getState().save.owned[0].moveStoneSlots).toEqual([0])
 })
 it('preserves legacy stones on first move and does not share with second',()=>{
  const s=defaultSave()
  const old={...mon('legacy'),mstones:['x']} as OwnedMon
  s.owned=[old];s.moveStones=[{id:'x',kind:'quick'}]
  expect(moveFxOf(s,old,0).quick).toBe(1)
  expect(moveFxOf(s,old,1).quick).toBe(0)
 })
 it('relearns selected move slot without overwriting the other slot',()=>{
  const p=mon('p'), food=mon('food',26)
  const result=recall(p,[food,food,food,food],0,()=>0,10,1)
  expect(result.ok).toBe(true)
  expect(result.mon.move).toBe(p.move)
  expect(result.mon.move2).not.toBe(p.move2)
 })
 it('move stone parameters independently alter seconds in combat',()=>{
  const p=mon('p')
  const stats=computeStats(getSpecies(p.species),60)
  const b=createBattle([{ownedId:p.id,speciesId:25,level:60,stats,move:p.move,move2:p.move2,
    fx:{quick:1,repeat:0,widen:0,multiply:0,bond:0,lasting:0},
    fx2:{quick:0,repeat:1,widen:0,multiply:0,bond:0,lasting:0},
  }],[[{species:19,level:1}]])
  const u=b.units.find(x=>x.side==='ally')!
  expect(u.spMax).toBeLessThan(5)
  expect(u.spMax2).toBeGreaterThan(5)
  step(b,.05)
 })
})
