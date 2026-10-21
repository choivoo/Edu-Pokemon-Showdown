import { describe, expect, it } from 'vitest'
import { TYPES, typeMultiplier, mainSeriesTypeMultiplier } from './typeChart'

describe('typeMultiplier', () => {
  it('Pokémon Quest attacks have no weaknesses or immunities', () => {
    expect(typeMultiplier('water', ['fire'])).toBe(1)
    expect(typeMultiplier('normal', ['ghost'])).toBe(1)
    expect(typeMultiplier('electric', ['ground'])).toBe(1)
  })
  it('18개 타입', () => expect(TYPES).toHaveLength(18))
  it('효과 굉장 (2배)', () => {
    expect(mainSeriesTypeMultiplier('water', ['fire'])).toBe(2)
    expect(mainSeriesTypeMultiplier('electric', ['water'])).toBe(2)
    expect(mainSeriesTypeMultiplier('fairy', ['dragon'])).toBe(2)
  })
  it('효과 별로 (0.5배)', () => {
    expect(mainSeriesTypeMultiplier('fire', ['water'])).toBe(0.5)
    expect(mainSeriesTypeMultiplier('grass', ['fire'])).toBe(0.5)
  })
  it('효과 없음 (0배)', () => {
    expect(mainSeriesTypeMultiplier('normal', ['ghost'])).toBe(0)
    expect(mainSeriesTypeMultiplier('electric', ['ground'])).toBe(0)
    expect(mainSeriesTypeMultiplier('dragon', ['fairy'])).toBe(0)
  })
  it('복합 타입은 곱한다', () => {
    expect(mainSeriesTypeMultiplier('ice', ['dragon', 'flying'])).toBe(4)
    expect(mainSeriesTypeMultiplier('rock', ['fire', 'flying'])).toBe(4)
    expect(mainSeriesTypeMultiplier('grass', ['water', 'ground'])).toBe(4)
    expect(mainSeriesTypeMultiplier('fire', ['water', 'rock'])).toBe(0.25)
    expect(mainSeriesTypeMultiplier('ground', ['electric', 'flying'])).toBe(0)
  })
  it('같은 타입은 1배', () => expect(mainSeriesTypeMultiplier('normal', ['normal'])).toBe(1))
})
