import { describe, expect, it } from 'vitest'
import { ALLY_REVIVE_SECONDS, createBattle, rallyParty, step } from '../engine/battle'
import { allStages, buildWaves, introDifficulty } from './stages'
import { ORIGINAL_FIRST } from './originalCampaign'
import { computeStats } from './stats'
import { getSpecies } from './roster'
import { migrate, defaultSave } from './storage'
import { TRACKLIST } from './localSoundtrack'
import { useGame } from '../store/gameStore'
import { pack,unpack } from './saveKey'

describe('User requested stage tuning, 2D movement, two moves, finisher and account reset',()=>{
 it('all first four retail expeditions are easier than later areas',()=>{
  expect([0,1,2,3].map(i=>introDifficulty(ORIGINAL_FIRST,i))).toEqual([.44,.55,.67,.80])
  expect(introDifficulty(ORIGINAL_FIRST+2,0)).toBe(1)
  for(let i=0;i<4;i++){
   const stage=allStages().find(s=>s.area===ORIGINAL_FIRST&&s.index===i)!
   const waves=buildWaves(stage,()=>.4)
   expect(waves.length).toBeGreaterThan(0)
   expect(waves.flat().every(e=>e.difficulty===introDifficulty(ORIGINAL_FIRST,i))).toBe(true)
   expect(waves.at(-1)!.some(e=>e.boss||e.elite)).toBe(true)
  }
 })
 it('has 93 expeditions, and every final stage has a climactic last-wave enemy',()=>{
  const all=allStages()
  expect(all).toHaveLength(93)
  for(const s of all){
   const final=buildWaves(s,()=>.3).at(-1)!
   expect(final.length).toBeGreaterThan(0)
  }
 })
 it('can rally to any side of the arena and expires automatically',()=>{
  const stats=computeStats(getSpecies(25),25)
  const b=createBattle([{ownedId:'m1',speciesId:25,level:25,stats}],[[{species:19,level:1}]],()=>.5)
  const ally=b.units.find(u=>u.side==='ally')!
  const before={x:ally.x,y:ally.y}
  expect(rallyParty(b,100,440)).toBe(true)
  for(let i=0;i<20;i++)step(b,.05)
  expect(ally.y).toBeGreaterThan(before.y)
  expect(ally.x).toBeLessThan(before.x)
  expect(b.rally).not.toBeNull()
  b.t=b.rally!.expires+1
  step(b,.05)
  expect(b.rally).toBeNull()
  expect(ALLY_REVIVE_SECONDS).toBe(25)
 })
 it('plays one and only one final explosion cue when a boss or strong enemy falls',()=>{
  const stats={...computeStats(getSpecies(25),60),maxHp:10000,atk:90000,def:5000}
  const b=createBattle([{ownedId:'m1',speciesId:25,level:60,stats}],[[{species:19,level:1,boss:true}]],()=>.4)
  b.auto=true
  let seen=0
  for(let i=0;i<700;i++){
   step(b,.05)
   seen+=b.events.filter(e=>e.k==='finisher').length
   b.events.length=0
   if(b.phase==='won')break
  }
  expect(seen).toBe(1)
  expect(b.finisherPlayed).toBe(true)
  expect(b.phase).toBe('won')
 })
 it('new starters have two moves and old one-move saves upgrade without loss',()=>{
  useGame.getState().hardReset()
  useGame.getState().newGame('two',25)
  const s=useGame.getState().save
  expect(s.owned).toHaveLength(1)
  expect(s.owned[0].move).toBeTruthy()
  expect(s.owned[0].move2).toBeTruthy()
  const old=defaultSave()
  old.owned=[{id:'old',species:25,level:5,exp:0,stones:[],mstones:[],bonus:[],move:'quest-thunderbolt'}]
  const migrated=migrate(old)
  expect(migrated.owned[0].move).toBe('quest-thunderbolt')
  expect(migrated.owned[0].move2).toBeTruthy()
  const keys=unpack(pack(s))
  expect(keys.owned[0].move2).toBeTruthy()
 })
 it('account hard reset destroys progress locally and returns title',()=>{
  useGame.getState().hardReset()
  useGame.getState().newGame('delete',25)
  expect(useGame.getState().save.started).toBe(true)
  useGame.getState().hardReset()
  expect(useGame.getState().screen).toBe('title')
  expect(useGame.getState().save.started).toBe(false)
  expect(useGame.getState().save.owned).toHaveLength(0)
 })
 it('maps exactly 27 timestamped parts of the supplied 75-min personal audio',()=>{
  expect(TRACKLIST).toHaveLength(27)
  expect(TRACKLIST[0].title).toBe('Title')
  expect(TRACKLIST[0].start).toBe(0)
  expect(TRACKLIST[1].start).toBe(158)
  expect(TRACKLIST.at(-1)!.start).toBe(4247)
  expect(TRACKLIST.at(-1)!.end).toBeGreaterThan(TRACKLIST.at(-1)!.start)
  for(let i=1;i<TRACKLIST.length;i++)expect(TRACKLIST[i].start).toBe(TRACKLIST[i-1].end)
 })
})
