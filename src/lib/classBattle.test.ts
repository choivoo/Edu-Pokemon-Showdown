import { describe, expect, it } from 'vitest'
import { assignPairs, isDecided, makeFighter, ranking, resolveRound, roundDifficulty } from './classBattle'
import { checkAnswer } from './questions'
import type { Question } from '../types'

const q: Question = { id: 'q', subject: 'math', difficulty: 'normal', type: 'number', question: '1+1', answer: '2', explanation: '' }
const mk = (names: string[]) => Object.fromEntries(names.map((n, i) => [n, makeFighter(n, 0, [25, 7, 4, 1, 133][i])]))

describe('assignPairs', () => {
  it('짝수: 서로 상대가 된다', () => {
    const f = assignPairs(mk(['a', 'b', 'c', 'd']), () => 0.3)
    for (const [id, x] of Object.entries(f)) expect(f[x.opponent!].opponent).toBe(id)
    expect(Object.values(f).some(x => x.bot)).toBe(false)
  })
  it('홀수: 마지막 한 명은 AI 트레이너와 대결', () => {
    const f = assignPairs(mk(['a', 'b', 'c']), () => 0.3)
    const bots = Object.entries(f).filter(([, x]) => x.bot)
    expect(bots).toHaveLength(1)
    const human = Object.entries(f).find(([, x]) => !x.bot && x.opponent === bots[0][0])
    expect(human).toBeTruthy()
  })
})

describe('resolveRound', () => {
  const base = () => assignPairs(mk(['a', 'b']), () => 0.1)
  it('정답자만 공격하고 점수를 얻는다', () => {
    const r = resolveRound(q, 15000, base(), { a: { answer: '2', ms: 1000 }, b: { answer: '3', ms: 500 } }, checkAnswer, () => 0.5)
    expect(r.verdicts.a.correct).toBe(true)
    expect(r.verdicts.b.correct).toBe(false)
    expect(r.fighters.b.hp).toBeLessThan(r.fighters.b.maxHp)
    expect(r.fighters.a.hp).toBe(r.fighters.a.maxHp)
    expect(r.fighters.a.score).toBeGreaterThan(100)
    expect(r.fighters.b.score).toBe(0)
  })
  it('둘 다 정답이면 둘 다 공격', () => {
    const r = resolveRound(q, 15000, base(), { a: { answer: '2', ms: 1000 }, b: { answer: '2', ms: 2000 } }, checkAnswer, () => 0.5)
    expect(r.fighters.a.hp).toBeLessThan(r.fighters.a.maxHp)
    expect(r.fighters.b.hp).toBeLessThan(r.fighters.b.maxHp)
  })
  it('빨리 맞힐수록 점수가 높다', () => {
    const fast = resolveRound(q, 15000, base(), { a: { answer: '2', ms: 500 } }, checkAnswer, () => 0.5)
    const slow = resolveRound(q, 15000, base(), { a: { answer: '2', ms: 14000 } }, checkAnswer, () => 0.5)
    expect(fast.fighters.a.score).toBeGreaterThan(slow.fighters.a.score)
  })
  it('먼저 쓰러뜨리면 반격이 없다', () => {
    const f = base()
    const [a, b] = Object.keys(f)
    f[b].hp = 1
    const r = resolveRound(q, 15000, f, { [a]: { answer: '2', ms: 100 }, [b]: { answer: '2', ms: 9000 } }, checkAnswer, () => 0.5)
    expect(r.fighters[b].hp).toBe(0)
    expect(r.fighters[a].hp).toBe(r.fighters[a].maxHp)
    expect(isDecided(r.fighters)).toBe(true)
  })
  it('무응답은 오답 처리', () => {
    const r = resolveRound(q, 15000, base(), {}, checkAnswer, () => 0.5)
    expect(Object.values(r.verdicts).every(v => !v.correct)).toBe(true)
  })
})

describe('ranking / difficulty', () => {
  it('점수 순 정렬, 봇 제외', () => {
    const f = assignPairs(mk(['a', 'b', 'c']), () => 0.3)
    f.a.score = 10; f.b.score = 300; f.c.score = 50
    expect(ranking(f).map(([id]) => id)).toEqual(['b', 'c', 'a'])
  })
  it('라운드 난이도 패턴', () => {
    expect([0, 1, 2, 3, 4].map(roundDifficulty)).toEqual(['easy', 'normal', 'normal', 'hard', 'easy'])
  })
})
