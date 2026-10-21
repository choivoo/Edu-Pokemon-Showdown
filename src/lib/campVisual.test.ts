import {describe,expect,it} from 'vitest'
import {campPlacements} from '../art/campDecor'
import {DECORATIONS} from './decorations'
import {ORIGINAL_FIRST} from './originalCampaign'
import {buildWaves,getStage} from './stages'
import {VERIFIED_ENCOUNTERS} from '../data/verifiedEncounters'

describe('Decorative 2D base camp environment',()=>{
 it('displays all 18 free-ticket furniture designs at unique positions',()=>{
  const owned=DECORATIONS.map(x=>x.id)
  const furniture=campPlacements(owned)
  expect(furniture).toHaveLength(18)
  expect(new Set(furniture.map(x=>x.x+','+x.y)).size).toBe(18)
  for(const item of furniture) {
    expect(item.x).toBeGreaterThanOrEqual(0)
    expect(item.x).toBeLessThan(960)
    expect(item.y).toBeGreaterThan(110)
    expect(item.y).toBeLessThan(405)
    // Keep the big clickable cooking pot at (560–780, 190–360) clear.
    expect(item.x>=560&&item.x<=780&&item.y>=190&&item.y<=360).toBe(false)
  }
 })
 it('skips unknown, duplicated and forged decorations without drawing offscreen',()=>{
  expect(campPlacements(['flareonCushion','flareonCushion','unknown'])).toEqual([
    {id:'flareonCushion',x:96,y:194}
  ])
  expect(campPlacements([])).toEqual([])
 })
})
describe('Original opening stage finale, data still present after v2.6',()=>{
 it('uses a stage-final strong Pokémon for 1-1, 1-2 and 1-4',()=>{
  for(const index of [0,1,3]){
    const stage=getStage(ORIGINAL_FIRST,index)
    const wave=buildWaves(stage,()=>0.3)
    expect(wave[wave.length-1].some(enemy=>enemy.boss)).toBe(true)
  }
 })
 it('retains all 54 original island public-source encounter tables',()=>{
  expect(Object.keys(VERIFIED_ENCOUNTERS)).toHaveLength(54)
 })
})
