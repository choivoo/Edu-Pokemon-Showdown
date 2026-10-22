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
  const stage = getStage(area, stageIdx)
  const b = createBattle(team, buildWaves(stage, rng), rng, stage)
  b.auto = true
  for (let i = 0; i < 20 * 60 * 10 && b.phase !== 'won' && b.phase !== 'lost'; i++) step(b, 0.1)
  return b
}

describe('battle engine', () => {
  it('충분히 강한 팀은 1-1을 클리어한다', () => {
    const wins = [1, 2, 3, 4, 5].filter(s => sim([ally(4, 6, 0), ally(7, 6, 1), ally(1, 6, 2)], 6, 0, s).phase === 'won')
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

// ---------- 기술스톤 / 빙고 보너스 효과 ----------
import { NO_FX, type MoveFx } from '../lib/moveStones'
import type { Stats } from '../lib/stats'

const mkBattle = (species: number, fx: Partial<MoveFx>, tweak: (s: Stats) => void = () => {}, enemies = 3, allies = 1, seed = 5) => {
  const rng = mulberry(seed)
  const team = Array.from({ length: allies }, (_, i) => {
    const stats = computeStats(getSpecies(species), 30)
    tweak(stats)
    return { ownedId: 'o' + i, speciesId: species, level: 30, stats, fx: { ...NO_FX, ...fx } }
  })
  const waves = [Array.from({ length: enemies }, () => ({ species: 19, level: 60 }))]
  const b = createBattle(team, waves, rng)
  // 적을 한곳에 모아 두고(범위 효과 확인용), 아군은 멀리서 시작해 일반 공격이 섞이지 않게 한다
  b.units.filter(u => u.side === 'enemy').forEach((u, i) => { u.x = 600 + i * 30; u.y = 300; u.atkCd = 99; u.spCd = 99; u.speed = 0 })
  b.units.filter(u => u.side === 'ally').forEach(u => { u.x = 80; u.y = 300; u.atkCd = 99; u.speed = 0; u.spCd = 0 })
  return b
}
const specialHits = (b: ReturnType<typeof mkBattle>) => b.events.filter(e => e.k === 'hit' && e.special) as Extract<(typeof b.events)[number], { k: 'hit' }>[]
const run = (b: ReturnType<typeof mkBattle>, sec: number) => { for (let i = 0; i < sec / 0.05; i++) step(b, 0.05) }

describe('기술스톤 효과', () => {
  it('빨리쏘기: 대기시간이 줄어든다', () => {
    const base = mkBattle(1, {}).units[0].spMax
    expect(mkBattle(1, { quick: 3 }).units[0].spMax).toBeLessThan(base)
  })
  it('리피트: 필살기가 한 번 더 나가고 대기시간이 늘어난다', () => {
    const base = mkBattle(1, {})
    const rep = mkBattle(1, { repeat: 1 })
    expect(rep.units[0].spMax).toBeGreaterThan(base.units[0].spMax)
    expect(useSpecial(base, base.units[0].uid)).toBe(true)
    expect(useSpecial(rep, rep.units[0].uid)).toBe(true)
    run(base, 1.5); run(rep, 1.5)
    expect(specialHits(base).length).toBe(1)
    expect(specialHits(rep).length).toBe(2)
  })
  it('넓히기: 한 명만 맞히던 필살기가 주변까지 번진다', () => {
    const base = mkBattle(1, {}), wide = mkBattle(1, { widen: 2 })
    useSpecial(base, base.units[0].uid); useSpecial(wide, wide.units[0].uid)
    run(base, 1.5); run(wide, 1.5)
    expect(new Set(specialHits(base).map(h => h.to)).size).toBe(1)
    expect(new Set(specialHits(wide).map(h => h.to)).size).toBeGreaterThan(1)
  })
  it('늘리기: 가까운 적을 더 맞히지만 위력은 줄어든다', () => {
    const base = mkBattle(1, {}), multi = mkBattle(1, { multiply: 2 })
    useSpecial(base, base.units[0].uid); useSpecial(multi, multi.units[0].uid)
    run(base, 1.5); run(multi, 1.5)
    expect(new Set(specialHits(multi).map(h => h.to)).size).toBe(3)
    const mainHit = (b: ReturnType<typeof mkBattle>) => specialHits(b).find(h => h.to === b.units.find(u => u.side === 'enemy')!.uid)!.amount
    expect(mainHit(multi)).toBeLessThan(mainHit(base))
  })
  it('필살기를 쓰면 공격력 기합이 붙고, 결속스톤은 동료에게도 나눠 주며, 오래가기스톤은 더 오래 간다', () => {
    const plain = mkBattle(1, {}, () => {}, 3, 2)
    const bond = mkBattle(1, { bond: 2, lasting: 2 }, () => {}, 3, 2)
    for (const b of [plain, bond]) { const [a] = b.units.filter(u => u.side === 'ally'); useSpecial(b, a.uid) }
    const [p1, p2] = plain.units.filter(u => u.side === 'ally')
    const [b1, b2] = bond.units.filter(u => u.side === 'ally')
    expect(p1.spirit.mul).toBeGreaterThan(0)
    expect(p2.spirit.mul).toBe(0) // 결속이 없으면 동료는 받지 못한다
    expect(b2.spirit.mul).toBeGreaterThan(0)
    expect(b2.spirit.mul).toBeLessThan(b1.spirit.mul)
    expect(b1.spirit.until - bond.t).toBeGreaterThan(p1.spirit.until - plain.t)
  })
})

describe('빙고 보너스 효과', () => {
  it('공격 대기시간 감소 / 필살기 대기시간 감소가 전투 수치에 반영된다', () => {
    const base = mkBattle(1, {})
    const fast = mkBattle(1, {}, s => { s.spCd = 0.2; s.atkCd = 0.2 })
    expect(fast.units[0].spMax).toBeLessThan(base.units[0].spMax)
    expect(fast.units[0].atkCdCut).toBe(0.2)
  })
  it('HP 자연 회복', () => {
    const base = mkBattle(1, {}), regen = mkBattle(1, {}, s => { s.regen = 0.02 })
    for (const b of [base, regen]) { b.units[0].hp = b.units[0].maxHp / 2; run(b, 3) }
    expect(regen.units[0].hp).toBeGreaterThan(base.units[0].hp)
  })
  it('공격에 성공하면 HP 회복', () => {
    const b = mkBattle(1, {}, s => { s.lifesteal = 0.05 })
    const a = b.units[0]
    a.hp = a.maxHp / 2
    // 적 옆으로 보내 일반 공격을 하게 한다
    a.x = 560; a.speed = 0; a.atkCd = 0
    const before = a.hp
    run(b, 2)
    expect(a.hp).toBeGreaterThan(before)
  })
  it('이동 속도 증가', () => {
    const speedOf = (moveSpd: number) => {
      const stats = { ...computeStats(getSpecies(1), 30), moveSpd }
      return createBattle([{ ownedId: 'o', speciesId: 1, level: 30, stats }], [[{ species: 19, level: 5 }]], mulberry(1)).units[0].speed
    }
    expect(speedOf(0.4)).toBeGreaterThan(speedOf(0))
  })
})
