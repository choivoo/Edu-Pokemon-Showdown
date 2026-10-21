import { describe, expect, it } from 'vitest'
import { calcDamage, calcMaxHp, calcStat, critChance } from './damage'

const base = { level: 50, power: 70, atk: 100, def: 100, moveType: 'normal' as const, defenderTypes: ['normal' as const] }

describe('calcDamage', () => {
  it('공식: ((2*50/5+2)*70*1/50+2)*1 * 랜덤(최대 1.0) = 32', () => {
    expect(calcDamage({ ...base, rng: () => 0.999999 }).damage).toBe(32)
  })
  it('랜덤 최솟값 0.85배', () => {
    expect(calcDamage({ ...base, rng: () => 0 }).damage).toBe(Math.floor(32.8 * 0.85))
  })
  it('원작 퀘스트에서는 방어 타입의 상성 영향이 없다', () => {
    const n = calcDamage({ ...base, rng: () => 1 }).damage
    const s = calcDamage({ ...base, moveType: 'water', defenderTypes: ['fire'], rng: () => 1 })
    const r = calcDamage({ ...base, moveType: 'fire', defenderTypes: ['water'], rng: () => 1 })
    expect(s.effectiveness).toBe(1)
    expect(s.damage).toBe(n)
    expect(r.damage).toBe(n)
  })
  it('노말 기술은 고스트에게도 정상 피해를 준다', () => {
    expect(calcDamage({ ...base, defenderTypes: ['ghost'], rng: () => 1 }).damage).toBe(32)
  })
  it('급소는 1.5배', () => {
    const r = calcDamage({ ...base, crit: true, rng: () => 1 })
    expect(r.crit).toBe(true)
    expect(r.damage).toBe(Math.floor(32.8 * 1.5))
  })
  it('공격/방어 비율 반영', () => {
    const strong = calcDamage({ ...base, atk: 200, rng: () => 1 }).damage
    const weak = calcDamage({ ...base, atk: 50, rng: () => 1 }).damage
    expect(strong).toBeGreaterThan(weak)
  })
  it('최소 1 데미지', () => {
    expect(calcDamage({ ...base, power: 1, atk: 1, def: 999, rng: () => 0 }).damage).toBeGreaterThanOrEqual(1)
  })
})

describe('critChance / stats', () => {
  it('빨리 맞힐수록 급소 확률 증가', () => {
    expect(critChance(1)).toBeGreaterThan(critChance(0.5))
    expect(critChance(0.5)).toBeGreaterThan(critChance(0))
    expect(critChance(0)).toBeCloseTo(1 / 16)
  })
  it('범위를 벗어난 비율은 보정', () => {
    expect(critChance(5)).toBe(critChance(1))
    expect(critChance(-1)).toBe(critChance(0))
  })
  it('Lv50 스탯', () => {
    expect(calcMaxHp(100, 50)).toBe(160)
    expect(calcStat(100, 50)).toBe(105)
  })
})
