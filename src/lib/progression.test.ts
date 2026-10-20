import { describe, expect, it } from 'vitest'
import { statBonus, trainerLevel, unlockPrice } from './progression'
import { canInflict, effectiveAtk, effectiveSpeed, endOfTurnDamage, paralyzedSkip, statusForMove } from './status'

describe('progression', () => {
  it('경험치 100당 1레벨', () => {
    expect(trainerLevel(0)).toBe(1)
    expect(trainerLevel(99)).toBe(1)
    expect(trainerLevel(250)).toBe(3)
  })
  it('스탯 보너스는 소폭 상승하고 상한이 있다', () => {
    expect(statBonus(0)).toBe(1)
    expect(statBonus(500)).toBeCloseTo(1.1)
    expect(statBonus(999999)).toBe(1.3)
  })
  it('해금 가격은 종족값에 비례', () => {
    const a = unlockPrice({ id: 1, name: '', types: [], stats: { hp: 40, atk: 40, def: 40, spe: 40 }, moves: [] })
    expect(a).toBe(40)
  })
})

describe('status', () => {
  it('기술 타입별 상태이상', () => {
    expect(statusForMove('poison')).toBe('poison')
    expect(statusForMove('electric')).toBe('paralysis')
    expect(statusForMove('fire')).toBe('burn')
    expect(statusForMove('water')).toBeNull()
  })
  it('면역', () => {
    expect(canInflict('poison', ['steel'])).toBe(false)
    expect(canInflict('poison', ['grass', 'poison'])).toBe(false)
    expect(canInflict('paralysis', ['electric'])).toBe(false)
    expect(canInflict('burn', ['fire', 'flying'])).toBe(false)
    expect(canInflict('burn', ['water'])).toBe(true)
  })
  it('독/화상은 1/8, 마비는 0', () => {
    expect(endOfTurnDamage(160, 'poison')).toBe(20)
    expect(endOfTurnDamage(160, 'burn')).toBe(20)
    expect(endOfTurnDamage(160, 'paralysis')).toBe(0)
    expect(endOfTurnDamage(160, null)).toBe(0)
  })
  it('화상은 공격 절반, 마비는 속도 절반 + 25% 행동불가', () => {
    expect(effectiveAtk(100, 'burn')).toBe(50)
    expect(effectiveSpeed(100, 'paralysis')).toBe(50)
    expect(paralyzedSkip('paralysis', () => 0.1)).toBe(true)
    expect(paralyzedSkip('paralysis', () => 0.5)).toBe(false)
    expect(paralyzedSkip('poison', () => 0)).toBe(false)
  })
})
