import { describe, expect, it } from 'vitest'
import { type AllyInput, createBattle, step, useSpecial } from './battle'
import { buildWaves, getStage } from '../lib/stages'
import { computeStats } from '../lib/stats'
import { getSpecies } from '../lib/roster'

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ally = (id: number, level: number, i: number): AllyInput => ({ ownedId: 'o' + i, speciesId: id, level, stats: computeStats(getSpecies(id), level) })

/** 헤드리스 시뮬레이션 (필살기 자동 사용) */
function sim(team: AllyInput[], area: number, stageIdx: number, seed: number) {
  const rng = mulberry(seed)
  const b = createBattle(team, buildWaves(getStage(area, stageIdx), rng), rng)
  b.auto = true
  for (let i = 0; i < 20 * 60 * 10 && b.phase !== 'won' && b.phase !== 'lost'; i++) step(b, 0.1)
  return b
}

describe('battle engine', () => {
  it('충분히 강한 팀은 1-1을 클리어한다', () => {
    const wins = [1, 2, 3, 4, 5].filter(s => sim([ally(4, 6, 0), ally(7, 6, 1), ally(1, 6, 2)], 0, 0, s).phase === 'won')
    expect(wins.length).toBeGreaterThanOrEqual(4)
  })
  it('레벨이 너무 낮으면 보스에게 진다', () => {
    const lost = [1, 2, 3].filter(s => sim([ally(19, 3, 0), ally(16, 3, 1), ally(52, 3, 2)], 0, 4, s).phase === 'lost')
    expect(lost.length).toBe(3)
  })
  it('종료 상태에서는 더 진행하지 않는다', () => {
    const b = sim([ally(6, 50, 0), ally(9, 50, 1), ally(3, 50, 2)], 0, 0, 1)
    expect(b.phase).toBe('won')
    const t = b.t
    step(b, 1)
    expect(b.t).toBe(t)
  })
  it('필살기는 쿨다운 중에는 발동되지 않고, 발동 후 쿨다운에 들어간다', () => {
    const rng = mulberry(3)
    const b = createBattle([ally(25, 10, 0)], buildWaves(getStage(0, 0), rng), rng)
    const u = b.units.find(x => x.side === 'ally')!
    expect(useSpecial(b, u.uid)).toBe(false)
    u.spCd = 0
    expect(useSpecial(b, u.uid)).toBe(true)
    expect(u.spCd).toBeGreaterThan(0)
    expect(useSpecial(b, u.uid)).toBe(false)
  })
  it('쓰러진 적은 kills 로 집계되고 웨이브가 넘어간다', () => {
    const b = sim([ally(6, 50, 0), ally(9, 50, 1), ally(3, 50, 2)], 0, 0, 2)
    expect(b.kills).toBe(getStage(0, 0).wavePlan.reduce((a, c) => a + c, 0))
    expect(b.wave).toBe(getStage(0, 0).wavePlan.length)
  })
  it('보스 웨이브에는 보스가 포함된다', () => {
    const waves = buildWaves(getStage(0, 4), mulberry(1))
    expect(waves[waves.length - 1][0].boss).toBe(true)
    expect(waves[waves.length - 1][0].species).toBe(130)
  })
})
