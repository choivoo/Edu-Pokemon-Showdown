import { describe, expect, it } from 'vitest'
import { ALL_STORY_SCENES, STORY_CHAPTERS, EPILOGUE_SCENES, fieldScene, storyProgress, storyUnlocked } from './storyCampaign'
import { defaultSave } from './storage'
import { QUESTS, isDone } from './quests'
import { getSpecies, getMove, SPECIES } from './roster'
import { EVOLUTIONS, EVOLUTION_ONLY, canEvolve, targetOf } from './evolution'
import { ALL_RECIPES } from './cooking'

describe('원작 본편 + 46장면 추가 스토리 · 기존 세이브 호환', () => {
  it('지역 6개, 메인 30개, 외전 12개, 후일담 4개', () => {
    expect(STORY_CHAPTERS).toHaveLength(17)
    expect(STORY_CHAPTERS.flatMap(x => x.scenes).filter(x => x.kind === 'main')).toHaveLength(84)
    expect(STORY_CHAPTERS.flatMap(x => x.scenes).filter(x => x.kind === 'side')).toHaveLength(12)
    expect(EPILOGUE_SCENES).toHaveLength(4)
    expect(ALL_STORY_SCENES).toHaveLength(100)
    expect(new Set(ALL_STORY_SCENES.map(x => x.id)).size).toBe(100)
  })
  it('6개 지역 모든 스테이지에 최초 클리어 장면이 있다', () => {
    for (let area = 0; area < 6; area++) for (let stage = 0; stage < 5; stage++) {
      const scene = fieldScene(area, stage)
      expect(scene).toBeDefined()
      expect(scene!.lines.length).toBeGreaterThanOrEqual(3)
      expect(scene!.lines.every(line => line.text.length > 0)).toBe(true)
    }
  })
  it('미클리어 장면은 잠겨 있고 이전 저장 데이터를 재생성할 필요 없다', () => {
    const save = defaultSave()
    const intro = fieldScene(0, 0)!
    expect(storyUnlocked(save, intro)).toBe(false)
    expect(storyProgress(save)).toEqual({ unlocked: 0, total: 100 })
    save.cleared['a0-s0'] = true
    expect(storyUnlocked(save, intro)).toBe(true)
    expect(storyUnlocked(save, fieldScene(0, 1)!)).toBe(false)
    expect(storyProgress(save).unlocked).toBe(1)
  })
  it('외전은 지역별 진행 단계에 따라 열리고 마지막 후일담은 결말 뒤에 열린다', () => {
    const save = defaultSave()
    save.cleared['a0-s2'] = true
    expect(STORY_CHAPTERS[11].scenes.filter(scene => storyUnlocked(save, scene))).toHaveLength(2)
    expect(EPILOGUE_SCENES.some(s => storyUnlocked(save, s))).toBe(false)
    save.cleared['a5-s4'] = true
    expect(EPILOGUE_SCENES.every(s => storyUnlocked(save, s))).toBe(true)
  })
})

describe('관동 도감 · 공식 한국어 이름', () => {
  it('관동 151종 완비, 3종 확장포켓몬 보존', () => {
    const ids = new Set(SPECIES.map(s => s.id))
    expect(ids.size).toBe(SPECIES.length)
    for (let id = 1; id <= 151; id++) expect(ids.has(id)).toBe(true)
    expect(SPECIES.filter(s => s.id > 151)).toHaveLength(3)
    expect(getSpecies(147).name).toBe('미뇽')
    expect(getSpecies(150).name).toBe('뮤츠')
  })
  it('모든 포켓몬의 전투 타입·기술 참조가 유효하다', () => {
    for (const p of SPECIES) {
      expect(p.types.length).toBeGreaterThan(0)
      expect(() => getMove(p.basic)).not.toThrow()
      expect(() => getMove(p.special)).not.toThrow()
      expect(p.stats.hp).toBeGreaterThan(0)
    }
  })
  it('레벨 진화의 결과는 도감에 등록돼 있다', () => {
    for (const x of Object.values(EVOLUTIONS)) expect(() => getSpecies(x.to)).not.toThrow()
    expect(EVOLUTIONS[75].to).toBe(76)
    expect(EVOLUTION_ONLY.has(76)).toBe(true)
    expect(canEvolve({species: 133, level: 19})).toBe(false)
    expect(canEvolve({species: 133, level: 36})).toBe(true)
    expect(targetOf(133, 'water')).toBe(134)
  })
})

describe('원작 기반 한국어 용어 및 퀘스트 진행', () => {
  it('요리 18종이 고유 공식 명칭을 사용한다', () => {
    expect(ALL_RECIPES).toHaveLength(18)
    expect(ALL_RECIPES[0].name).toBe('네모루루수프')
    expect(ALL_RECIPES[17].name).toBe('네모루루레전드수프')
    expect(new Set(ALL_RECIPES.map(x => x.name)).size).toBe(18)
  })
  it('보스 클리어는 메인 퀘스트 달성으로 인정된다', () => {
    const save = defaultSave()
    const q = QUESTS.find(q => q.id === 'main-0')!
    expect(isDone(save, q)).toBe(false)
    save.cleared['a0-s4'] = true
    expect(isDone(save, q)).toBe(true)
  })
})
