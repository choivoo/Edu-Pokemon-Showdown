import {describe,expect,it} from 'vitest'
import {QUEST_MOVES} from '../data/questMoves'
import {createSkillVfx,drawImpactVfx,drawSkillVfx} from '../engine/skillVfx'
import {moveProfile} from './moveProfiles'

const fakeCanvas=()=>{
 let painted=0
 const g={addColorStop:()=>{painted++}}
 const d={
  createRadialGradient:()=>g,
  save:()=>{},restore:()=>{},beginPath:()=>{},closePath:()=>{},arc:()=>{painted++},
  ellipse:()=>{painted++},moveTo:()=>{},lineTo:()=>{},bezierCurveTo:()=>{},
  stroke:()=>{painted++},fill:()=>{painted++},translate:()=>{},rotate:()=>{},
 } as unknown as CanvasRenderingContext2D
 return {ctx:d,count:()=>painted}
}
describe('all 167 Quest special attacks render dynamic 2D effects',()=>{
 it('maps every Quest technique into a finite 2D cast silhouette',()=>{
  expect(QUEST_MOVES).toHaveLength(167)
  const shapes=new Set<string>()
  for(const [i,m] of QUEST_MOVES.entries()){
    const fx=createSkillVfx(m,120,240,440,310,0,m.role==='buff',m.power>200?1.2:1)
    expect(fx.id).toBe(m.id)
    expect(fx.type).toBe(m.type)
    expect(fx.duration).toBeGreaterThan(.45)
    expect(fx.duration).toBeLessThan(1.3)
    expect(Number.isFinite(fx.seed)).toBe(true)
    shapes.add(fx.shape)
    const canvas=fakeCanvas()
    // Three evenly spaced animation frames: wind-up, hit and fade.
    drawSkillVfx(canvas.ctx,fx,fx.duration*.12)
    drawSkillVfx(canvas.ctx,fx,fx.duration*.45)
    drawSkillVfx(canvas.ctx,fx,fx.duration*.82)
    expect(canvas.count(),`#${i} ${m.name}`).toBeGreaterThan(5)
  }
  for(const shape of ['beam','burst','cone','dash','strike','projectile','wave','support'])expect(shapes.has(shape)).toBe(true)
 })
 it('renders high-energy shockwaves at hit locations, then fades out',()=>{
  const canvas=fakeCanvas()
  drawImpactVfx(canvas.ctx,260,260,'#66ddff',.3,105)
  expect(canvas.count()).toBeGreaterThan(7)
  const before=canvas.count()
  drawImpactVfx(canvas.ctx,260,260,'#66ddff',1.01,105)
  expect(canvas.count()).toBe(before)
 })
 it('differentiates the look of ranged beams versus melee/elemental spells',()=>{
  const byName=(n:string)=>QUEST_MOVES.find(m=>m.name===n)!
  expect(moveProfile(byName('Hyper Beam')).shape).toBe('beam')
  expect(moveProfile(byName('Mega Punch')).shape).toBe('strike')
  expect(moveProfile(byName('Fire Blast')).shape).toBe('burst')
  expect(moveProfile(byName('Fly')).shape).toBe('dash')
  expect(moveProfile(byName('Gust')).shape).toBe('cone')
 })
})
