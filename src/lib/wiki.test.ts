import { describe, expect, it } from 'vitest'
import { affinity, recall, recallChance, recallFatigue, recallPool, RECALL_RECOVER_MS, trainExp } from './training'
import { canEvolve, EVOLUTIONS, targetOf } from './evolution'
import { claimable, isDone, QUESTS, statueCost, statueMul } from './quests'
import { defaultSave } from './storage'
import { exportSave, importSave } from './saveKey'
import { getMove, getSpecies, SPECIES } from './roster'
import { ALL_RECIPES, attractPool } from './cooking'
import type { OwnedMon } from './stats'

const mon = (species: number, level = 10, id = 'x' + species): OwnedMon => ({ id, species, level, exp: 0, stones: [], bonus: [], mstones: [] })

describe('특훈', () => {
  it('같은 종이 가장 잘 맞고 전설은 더 잘 맞는다', () => {
    const t = mon(4)
    expect(affinity(t, mon(4))).toBeGreaterThan(affinity(t, mon(5)))
    expect(affinity(t, mon(5))).toBeGreaterThan(affinity(t, mon(19)))
    expect(affinity(t, mon(150))).toBeGreaterThan(affinity(t, mon(19)))
  })
  it('경험치는 재료가 많고 강할수록 늘어난다', () => {
    const t = mon(4)
    expect(trainExp(t, [mon(19), mon(16)])).toBeGreaterThan(trainExp(t, [mon(19)]))
    expect(trainExp(t, [mon(19, 30)])).toBeGreaterThan(trainExp(t, [mon(19, 5)]))
  })
  it('떠올리기 확률은 시도할수록 낮아지고 시간이 지나면 회복된다', () => {
    const t = mon(4)
    const foods = [mon(4, 10, 'a'), mon(5, 10, 'b')]
    const now = 1_000_000
    const c0 = recallChance(t, foods, now)
    const tired = { ...t, recalls: 3, recallT: now }
    expect(recallChance(tired, foods, now)).toBeLessThan(c0)
    expect(recallFatigue(tired, now + 3 * RECALL_RECOVER_MS)).toBe(0)
    expect(recallChance(tired, foods, now + 3 * RECALL_RECOVER_MS)).toBeCloseTo(c0)
  })
  it('성공하면 자기 타입의 새 필살기를 떠올린다', () => {
    const t = mon(4)
    const r = recall(t, [mon(4, 10, 'a'), mon(4, 10, 'b'), mon(5, 10, 'c'), mon(5, 10, 'd')], 0, () => 0)
    expect(r.ok).toBe(true)
    expect(r.mon.move).toBeTruthy()
    expect(recallPool(t).map(m => m.id)).toContain(r.mon.move)
    expect(r.mon.recalls).toBe(1)
  })
  it('실패하면 필살기는 그대로이고 피로만 쌓인다', () => {
    const r = recall(mon(4), [mon(19)], 0, () => 0.999)
    expect(r.ok).toBe(false)
    expect(r.mon.move).toBeUndefined()
    expect(r.mon.recalls).toBe(1)
  })
  it('모든 종이 떠올릴 기술을 가지고 있다', () => {
    for (const s of SPECIES) expect(recallPool(mon(s.id)).length).toBeGreaterThan(0)
  })
})

describe('진화', () => {
  it('진화 후 종과 단계가 모두 로스터에 있다', () => {
    for (const [from, e] of Object.entries(EVOLUTIONS)) { getSpecies(Number(from)); getSpecies(e.to); expect(e.level).toBeGreaterThan(1) }
    for (const id of [134, 135, 136]) getSpecies(id)
  })
  it('레벨이 모자라면 진화할 수 없다', () => {
    expect(canEvolve(mon(4, 15))).toBe(false)
    expect(canEvolve(mon(4, 16))).toBe(true)
    expect(canEvolve(mon(150, 50))).toBe(false)
  })
  it('이브이는 고른 타입으로 진화한다', () => {
    expect(targetOf(133, 'fire')).toBe(136)
    expect(targetOf(133, 'water')).toBe(134)
    expect(targetOf(133, 'electric')).toBe(135)
  })
  it('진화로만 만나는 포켓몬은 요리 후보에 없다', () => {
    const all = new Set(ALL_RECIPES.flatMap(r => attractPool(r).map(s => s.id)))
    for (const id of [2, 5, 8, 26, 151, 142]) expect(all.has(id)).toBe(false)
  })
  it('모든 포켓몬의 기술이 존재한다', () => {
    for (const s of SPECIES) { getMove(s.basic); getMove(s.special) }
  })
})

describe('퀘스트와 석상', () => {
  it('처음에는 받을 보상이 없다', () => {
    expect(claimable(defaultSave())).toHaveLength(0)
  })
  it('진행도가 목표를 넘으면 완료된다', () => {
    const s = { ...defaultSave(), counters: { clears: 10 } }
    expect(isDone(s, QUESTS.find(q => q.id === 'c-clear10')!)).toBe(true)
    expect(isDone(s, QUESTS.find(q => q.id === 'c-clear40')!)).toBe(false)
    expect(claimable(s).map(q => q.id)).toContain('c-clear10')
  })
  it('석상 비용은 두 배씩 오르고 경험치 배율이 늘어난다', () => {
    expect(statueCost(1)).toBe(statueCost(0) * 2)
    expect(statueMul(5)).toBeCloseTo(1.5)
  })
})

describe('저장 키에 새 데이터가 담긴다', () => {
  it('떠올린 기술, 퀘스트, 석상, 굿즈가 복원된다', async () => {
    const save = defaultSave()
    save.started = true; save.name = '테스트'
    save.owned = [{ ...mon(4, 20, 'm1'), move: 'fire-hard', recalls: 2, recallT: 12345 }]
    save.party = ['m1']
    save.counters = { clears: 7, trained: 2 }
    save.claimed = ['c-clear10']
    save.statue = 3
    save.themes = ['default', 'dusk']
    save.theme = 'dusk'
    const keys = await exportSave(save)
    const back = await importSave(keys.saveKey, keys.password)
    expect(back.owned[0].move).toBe('fire-hard')
    expect(back.owned[0].recalls).toBe(2)
    expect(back.counters).toEqual({ clears: 7, trained: 2 })
    expect(back.claimed).toEqual(['c-clear10'])
    expect(back.statue).toBe(3)
    expect(back.themes).toEqual(['default', 'dusk'])
    expect(back.theme).toBe('dusk')
  })
})
