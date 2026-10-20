import { describe, expect, it } from 'vitest'
import { attractPool, cook, dishKind, dominantIngredient, getIngredient, INGREDIENTS } from './cooking'
import { addExp, computeStats, expToNext, MAX_LEVEL, type OwnedMon } from './stats'
import { canPlace, cellsOf, findSpot, GRID_H, GRID_W, occupancy, type Stone, unlockedCount } from './stones'
import { AREAS, buildWaves, getEndlessStage, getStage, rollRewards, STAGES_PER_AREA } from './stages'
import { getMove, getSpecies, SPECIES } from './roster'
import { TYPES } from './typeChart'
import { defaultSave } from './storage'

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('cooking', () => {
  it('요리 종류 판정', () => {
    expect(dishKind(['ember', 'ember', 'ember', 'ember', 'ember'])).toBe('special')
    expect(dishKind(['ember', 'ember', 'ember', 'ember', 'dew'])).toBe('special')
    expect(dishKind(['ember', 'ember', 'ember', 'dew', 'dew'])).toBe('good')
    expect(dishKind(['ember', 'ember', 'dew', 'dew', 'leaf'])).toBe('plain')
    expect(dishKind(['ember', 'dew', 'leaf', 'spark', 'moon'])).toBe('plain')
  })
  it('가장 많은 재료가 타입을 정한다', () => {
    expect(dominantIngredient(['ember', 'ember', 'dew'], () => 0.9)).toBe('ember')
    expect(dominantIngredient(['ember', 'dew', 'leaf'], () => 0)).toBe('ember')
    expect(dominantIngredient(['ember', 'dew', 'leaf'], () => 0.99)).toBe('leaf')
  })
  it('찾아오는 포켓몬은 재료의 타입에 속하고 전설은 나오지 않는다', () => {
    const rng = seeded(1)
    for (const ing of INGREDIENTS) {
      for (let i = 0; i < 100; i++) {
        const sp = cook([ing.id, ing.id, ing.id], rng)
        expect(sp.rarity).toBeLessThanOrEqual(3)
        expect(sp.types.some(t => getIngredient(ing.id).types.includes(t))).toBe(true)
      }
    }
  })
  it('특선 요리는 평범한 요리보다 희귀한 포켓몬이 더 자주 온다', () => {
    const rng = seeded(9)
    const rare = (sel: Parameters<typeof cook>[0]) => Array.from({ length: 600 }, () => cook(sel, rng)).filter(s => s.rarity >= 3).length
    expect(rare(['mushroom', 'mushroom', 'mushroom'])).toBeGreaterThan(rare(['mushroom', 'ember', 'leaf']))
  })
  it('모든 타입의 포켓몬을 요리로 만날 수 있다', () => {
    const reachable = new Set(INGREDIENTS.flatMap(i => attractPool(i.id).flatMap(s => s.types)))
    for (const t of TYPES) expect(reachable.has(t)).toBe(true)
  })
})

describe('stats / 성장', () => {
  const mon: OwnedMon = { id: 'm1', species: 25, level: 5, exp: 0, stones: [] }
  it('경험치로 여러 레벨이 오른다', () => {
    const r = addExp(mon, expToNext(5) + expToNext(6) + 1)
    expect(r.gained).toBe(2)
    expect(r.mon.level).toBe(7)
    expect(r.mon.exp).toBe(1)
  })
  it('최대 레벨을 넘지 않는다', () => {
    const r = addExp({ ...mon, level: MAX_LEVEL - 1 }, 10_000_000)
    expect(r.mon.level).toBe(MAX_LEVEL)
    expect(r.mon.exp).toBe(0)
  })
  it('레벨이 오르면 스탯이 오른다', () => {
    const sp = getSpecies(25)
    expect(computeStats(sp, 20).atk).toBeGreaterThan(computeStats(sp, 10).atk)
  })
  it('파워스톤은 별 개수만큼 효과가 커진다', () => {
    const sp = getSpecies(25)
    const base = computeStats(sp, 30)
    const s1: Stone = { id: 'a', kind: 'atk', star: 1, shape: 'dot' }
    const s3: Stone = { id: 'b', kind: 'atk', star: 3, shape: 'dot' }
    expect(computeStats(sp, 30, [s1]).atk).toBeGreaterThan(base.atk)
    expect(computeStats(sp, 30, [s3]).atk).toBeGreaterThan(computeStats(sp, 30, [s1]).atk)
    expect(computeStats(sp, 30, [{ id: 'c', kind: 'crit', star: 2, shape: 'dot' }]).crit).toBeCloseTo(base.crit + 0.05)
    // 칸이 큰 스톤일수록 효과가 크다
    expect(computeStats(sp, 30, [{ id: 'd', kind: 'atk', star: 1, shape: 'bar3' }]).atk).toBeGreaterThan(computeStats(sp, 30, [s1]).atk)
  })
})

describe('파워스톤 격자', () => {
  const stones: Stone[] = [{ id: 'a', kind: 'atk', star: 1, shape: 'bar2' }, { id: 'b', kind: 'hp', star: 1, shape: 'ell' }]
  it('레벨이 오르면 열리는 칸이 늘어나고 12칸을 넘지 않는다', () => {
    expect(unlockedCount(1)).toBe(4)
    expect(unlockedCount(6)).toBeGreaterThan(unlockedCount(1))
    expect(unlockedCount(50)).toBe(GRID_W * GRID_H)
  })
  it('회전해도 칸 수가 같고 좌상단으로 정규화된다', () => {
    for (let r = 0; r < 4; r++) {
      const cells = cellsOf('ell', r)
      expect(cells).toHaveLength(3)
      expect(Math.min(...cells.map(c => c[0]))).toBe(0)
      expect(Math.min(...cells.map(c => c[1]))).toBe(0)
    }
    expect(cellsOf('bar2', 1)).toEqual([[0, 0], [0, 1]])
  })
  it('잠긴 칸과 겹친 칸에는 놓을 수 없다', () => {
    const empty = occupancy([], stones)
    expect(canPlace(1, empty, 'dot', 0, 3, 2)).toBe(false) // 잠긴 칸
    expect(canPlace(1, empty, 'dot', 0, 1, 1)).toBe(true)
    const occ = occupancy([{ stone: 'a', x: 1, y: 1, rot: 0 }], stones)
    expect(canPlace(1, occ, 'dot', 0, 2, 1)).toBe(false) // bar2 가 (1,1)(2,1) 차지
    expect(canPlace(1, occ, 'dot', 0, 1, 0)).toBe(true)
  })
  it('자동 배치는 들어갈 자리가 없으면 null', () => {
    expect(findSpot(1, occupancy([], stones), 'bar3')).toBeNull() // 레벨1은 열린 칸이 4개뿐이라 3칸 일자는 들어가지 않는다
  })
})

describe('스테이지 / 보상', () => {
  it('지역은 6개, 지역당 5스테이지(마지막이 보스)', () => {
    expect(AREAS).toHaveLength(6)
    for (let a = 0; a < AREAS.length; a++) {
      for (let i = 0; i < STAGES_PER_AREA; i++) expect(getStage(a, i).boss).toBe(i === STAGES_PER_AREA - 1)
      expect(getStage(a, 4).recruit).toBe(AREAS[a].boss)
    }
  })
  it('지역이 갈수록 적 레벨이 오른다', () => {
    for (let a = 1; a < AREAS.length; a++) {
      expect(getStage(a, 0).level).toBeGreaterThan(getStage(a - 1, 0).level)
      expect(getStage(a, 4).level).toBeGreaterThan(getStage(a - 1, 4).level)
    }
  })
  it('보스 스테이지의 마지막 웨이브에 보스가 있다', () => {
    const w = buildWaves(getStage(2, 4), seeded(3))
    expect(w[w.length - 1][0]).toMatchObject({ species: 94, boss: true })
  })
  it('보스 보상은 파워스톤이 확정이다', () => {
    for (let s = 1; s < 20; s++) expect(rollRewards(getStage(0, 4), seeded(s)).stone).not.toBeNull()
  })
  it('재료는 해당 지역의 드롭 목록에서만 나온다', () => {
    const r = rollRewards(getStage(0, 0), seeded(4))
    for (const id of Object.keys(r.ingredients)) expect(AREAS[0].drops).toContain(id)
  })
  it('끝없는 별길: 층이 오를수록 강해지고 10층에 전설 동료', () => {
    expect(getEndlessStage(6).level).toBeGreaterThan(getEndlessStage(2).level)
    expect(getEndlessStage(5).boss).toBe(true)
    expect(getEndlessStage(10).recruit).toBe(150)
  })
})

describe('데이터 정합성', () => {
  it('모든 포켓몬의 기술 id와 타입이 유효하다', () => {
    for (const s of SPECIES) {
      expect(() => getMove(s.basic)).not.toThrow()
      expect(() => getMove(s.special)).not.toThrow()
      for (const t of s.types) expect(TYPES).toContain(t)
    }
  })
  it('도감 번호가 중복되지 않는다', () => {
    expect(new Set(SPECIES.map(s => s.id)).size).toBe(SPECIES.length)
  })
  it('지역의 몬스터 풀과 보스가 모두 존재한다', () => {
    for (const a of AREAS) {
      expect(() => getSpecies(a.boss)).not.toThrow()
      for (const id of a.pool) expect(() => getSpecies(id)).not.toThrow()
    }
  })
  it('새 저장 데이터는 재료를 갖고 시작한다', () => {
    const s = defaultSave()
    expect(Object.values(s.ingredients).every(n => n > 0)).toBe(true)
    expect(s.started).toBe(false)
  })
})
