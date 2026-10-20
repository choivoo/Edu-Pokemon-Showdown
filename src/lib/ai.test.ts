import { describe, expect, it } from 'vitest'
import { aiSucceeds, chooseAiMove } from './ai'
import type { Move } from '../types'

const mv = (id: string, type: Move['type'], difficulty: Move['difficulty'], power: number): Move => ({ id, name: id, type, difficulty, power })

describe('ai', () => {
  it('상성이 유리한 기술을 우선 선택', () => {
    const moves = [mv('a', 'normal', 'easy', 40), mv('b', 'water', 'easy', 40)]
    expect(chooseAiMove(moves, ['fire'], () => 0.5).id).toBe('b')
  })
  it('어려운 기술일수록 성공률이 낮다', () => {
    expect(aiSucceeds('easy', () => 0.8)).toBe(true)
    expect(aiSucceeds('hard', () => 0.8)).toBe(false)
  })
})
