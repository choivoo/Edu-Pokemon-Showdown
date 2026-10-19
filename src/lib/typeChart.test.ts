import { describe, expect, it } from 'vitest'
import { TYPES, typeMultiplier } from './typeChart'

describe('typeMultiplier', () => {
  it('18개 타입', () => expect(TYPES).toHaveLength(18))
  it('효과 굉장 (2배)', () => {
    expect(typeMultiplier('water', ['fire'])).toBe(2)
    expect(typeMultiplier('electric', ['water'])).toBe(2)
    expect(typeMultiplier('fairy', ['dragon'])).toBe(2)
  })
  it('효과 별로 (0.5배)', () => {
    expect(typeMultiplier('fire', ['water'])).toBe(0.5)
    expect(typeMultiplier('grass', ['fire'])).toBe(0.5)
  })
  it('효과 없음 (0배)', () => {
    expect(typeMultiplier('normal', ['ghost'])).toBe(0)
    expect(typeMultiplier('electric', ['ground'])).toBe(0)
    expect(typeMultiplier('dragon', ['fairy'])).toBe(0)
  })
  it('복합 타입은 곱한다', () => {
    expect(typeMultiplier('ice', ['dragon', 'flying'])).toBe(4)
    expect(typeMultiplier('rock', ['fire', 'flying'])).toBe(4)
    expect(typeMultiplier('grass', ['water', 'ground'])).toBe(4)
    expect(typeMultiplier('fire', ['water', 'rock'])).toBe(0.25)
    expect(typeMultiplier('ground', ['electric', 'flying'])).toBe(0)
  })
  it('같은 타입은 1배', () => expect(typeMultiplier('normal', ['normal'])).toBe(1))
})
