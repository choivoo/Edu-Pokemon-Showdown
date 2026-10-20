import { describe, expect, it } from 'vitest'
import { ALL_RECIPES, attractPool, cook, gradeOf, INGREDIENTS, type IngredientId, recipeFor, tally } from './cooking'
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
  const ids = (...a: IngredientId[]) => a
  it('재료 성질을 센다 (무지개는 모든 색·식감·종류에 +1)', () => {
    const t = tally(ids('mushroomRed', 'rainbow'))
    expect(t.color.red).toBe(2)
    expect(t.color.blue).toBe(1)
    expect(t.texture.soft).toBe(2)
    expect(t.kind.mushroom).toBe(2)
    expect(t.kind.mystic).toBe(1)
  })
  it('레시피 판정: 한 색을 듬뿍 넣으면 그 색 요리', () => {
    expect(recipeFor(ids('mushroomRed', 'mushroomRed', 'rootRed', 'rootRed', 'rootRed')).no).toBe(2)
    expect(recipeFor(ids('berryBlue', 'berryBlue', 'rockBlue', 'rockBlue', 'berryBlue')).no).toBe(3)
    expect(recipeFor(ids('nutYellow', 'nutYellow', 'honey', 'honey', 'nutYellow')).no).toBe(4)
    expect(recipeFor(ids('fossil', 'fossil', 'mushroomGray', 'fossil', 'fossil')).no).toBe(5)
  })
  it('여러 레시피가 맞으면 번호가 낮은 것, 아무것도 안 맞으면 1번', () => {
    // 블리열매 3 + 화석 2: 7번(달콤 많이+회색 조금)·9번(부드럽 많이+광물 조금)에 해당 → 7번
    expect(recipeFor(ids('berryBlue', 'berryBlue', 'berryBlue', 'fossil', 'fossil')).no).toBe(7)
    expect(recipeFor(ids('mushroomRed', 'berryBlue', 'nutYellow', 'fossil', 'rockBlue')).no).toBe(1)
  })
  it('신비로운 재료를 듬뿍 넣으면 전설의 수프', () => {
    expect(recipeFor(ids('shell', 'shell', 'rainbow', 'rainbow', 'shell')).no).toBe(18)
  })
  it('요리 등급은 재료 희귀도의 합', () => {
    expect(gradeOf(ids('fossil', 'fossil', 'fossil', 'fossil', 'fossil'))).toBe('basic')
    expect(gradeOf(ids('fossil', 'honey', 'fossil', 'fossil', 'fossil'))).toBe('good')
    expect(gradeOf(ids('honey', 'honey', 'honey', 'fossil', 'fossil'))).toBe('great')
    expect(gradeOf(ids('rainbow', 'rainbow', 'honey', 'fossil', 'fossil'))).toBe('special')
  })
  it('찾아오는 포켓몬은 레시피의 타입에 속하고 전설은 나오지 않는다', () => {
    const rng = seeded(1)
    for (const recipe of ALL_RECIPES.filter(r => r.no !== 18)) {
      for (let i = 0; i < 60; i++) {
        const sp = attractPool(recipe)
        expect(sp.length).toBeGreaterThan(0)
        for (const s of sp) expect(s.types.some(t => recipe.types.includes(t))).toBe(true)
      }
    }
    for (let i = 0; i < 300; i++) expect(cook(ids('rainbow', 'rainbow', 'honey', 'fossil', 'fossil'), rng).rarity).toBeLessThanOrEqual(3)
  })
  it('등급이 높을수록 희귀한 포켓몬이 더 자주 온다', () => {
    const rng = seeded(9)
    const rare = (sel: IngredientId[]) => Array.from({ length: 800 }, () => cook(sel, rng)).filter(s => s.rarity >= 3).length
    expect(rare(ids('rainbow', 'rainbow', 'honey', 'fossil', 'fossil'))).toBeGreaterThan(rare(ids('fossil', 'fossil', 'fossil', 'fossil', 'fossil')))
  })
  it('모든 타입의 포켓몬을 요리로 만날 수 있다', () => {
    const reachable = new Set(ALL_RECIPES.flatMap(r => attractPool(r).flatMap(s => s.types)))
    for (const t of TYPES) expect(reachable.has(t)).toBe(true)
  })
  it('레시피는 18가지이며 번호가 겹치지 않는다', () => {
    expect(ALL_RECIPES).toHaveLength(18)
    expect(new Set(ALL_RECIPES.map(r => r.no)).size).toBe(18)
    expect(INGREDIENTS).toHaveLength(10)
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
    expect(Object.values(s.ingredients).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(25)
    expect(Object.values(s.ingredients).every(n => n >= 0)).toBe(true)
    expect(s.started).toBe(false)
  })
})
