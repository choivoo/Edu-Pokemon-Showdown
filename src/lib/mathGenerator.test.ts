import { describe, expect, it } from 'vitest'
import { generateMathQuestion } from './mathGenerator'
import type { Difficulty } from '../types'

// 간단한 시드 RNG (mulberry32)
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const levels: Difficulty[] = ['easy', 'normal', 'hard']

describe('generateMathQuestion', () => {
  for (const d of levels) {
    it(`${d}: 스키마를 지키고 정답이 보기에 포함된다`, () => {
      const rng = seeded(42)
      for (let i = 0; i < 300; i++) {
        const q = generateMathQuestion(d, rng)
        expect(q.subject).toBe('math')
        expect(q.difficulty).toBe(d)
        expect(q.answer).not.toBe('')
        expect(q.explanation.length).toBeGreaterThan(0)
        if (q.type === 'choice') {
          expect(q.choices).toHaveLength(4)
          expect(new Set(q.choices).size).toBe(4)
          expect(q.choices).toContain(q.answer)
        }
      }
    })
  }

  it('easy: 덧셈은 20 이하 범위, 뺄셈은 음수가 없다', () => {
    const rng = seeded(1)
    for (let i = 0; i < 300; i++) {
      const q = generateMathQuestion('easy', rng)
      expect(Number(q.answer)).toBeGreaterThanOrEqual(0)
      expect(Number(q.answer)).toBeLessThanOrEqual(40)
    }
  })

  it('산술 문제의 정답이 실제 계산 결과와 일치한다', () => {
    const rng = seeded(7)
    for (let i = 0; i < 500; i++) {
      const q = generateMathQuestion(levels[i % 3], rng)
      const m = q.question.match(/^(\d+) ([+\-×÷]) (\d+) = \?$/)
      if (!m) continue
      const [a, op, b] = [Number(m[1]), m[2], Number(m[3])]
      const expected = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b
      expect(Number(q.answer)).toBe(expected)
    }
  })

  it('hard 방정식 정답이 방정식을 만족한다', () => {
    const rng = seeded(99)
    let found = 0
    for (let i = 0; i < 300; i++) {
      const q = generateMathQuestion('hard', rng)
      const m = q.question.match(/^(\d+)x \+ (\d+) = (\d+) /)
      if (!m) continue
      found++
      expect(Number(m[1]) * Number(q.answer) + Number(m[2])).toBe(Number(m[3]))
    }
    expect(found).toBeGreaterThan(0)
  })

  it('hard 분수 덧셈 정답은 기약분수이며 값이 맞다', () => {
    const rng = seeded(5)
    let found = 0
    for (let i = 0; i < 300; i++) {
      const q = generateMathQuestion('hard', rng)
      const m = q.question.match(/^(\d+)\/(\d+) \+ (\d+)\/(\d+) = \?/)
      if (!m) continue
      found++
      const [n1, d1, n2, d2] = m.slice(1).map(Number)
      const [an, ad = '1'] = q.answer.split('/')
      expect(Number(an) / Number(ad)).toBeCloseTo(n1 / d1 + n2 / d2, 10)
    }
    expect(found).toBeGreaterThan(0)
  })
})
