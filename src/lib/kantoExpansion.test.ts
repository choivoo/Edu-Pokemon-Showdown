import { describe, expect, it } from 'vitest'
import { SPECIES, MOVES, getSpecies, getMove } from './roster'
import { getEndlessStage } from './stages'
import { KANTO_ADDITIONS } from '../data/kantoExpansion'
describe('관동 도감 데이터',()=>{
 it('관동 151종을 모두 등록하고 중복은 없다',()=>{
   expect(KANTO_ADDITIONS).toHaveLength(81)
   expect(new Set(SPECIES.map(x=>x.id)).size).toBe(SPECIES.length)
   for(let i=1;i<=151;i++) expect(getSpecies(i).name.length).toBeGreaterThan(0)
 })
 it('모든 신규 포켓몬이 사용 가능한 기술을 참조한다',()=>{
   const moves=new Set(MOVES.map(x=>x.id))
   for(const sp of SPECIES){
     expect(moves.has(sp.basic)).toBe(true)
     expect(moves.has(sp.special)).toBe(true)
   }
 })
 it('전설의 포켓몬은 도전 보상으로도 합류할 수 있다',()=>{
   expect(getEndlessStage(15).recruit).toBe(144)
   expect(getEndlessStage(30).recruit).toBe(151)
   expect(getMove('normal-easy').name).toBeTruthy()
 })
})
