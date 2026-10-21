import { afterEach, describe, expect, it } from 'vitest'
import { useGame, areaCleared, areaUnlocked, legacyFanProgress, originalStatueExpCap } from '../store/gameStore'
import { getStage } from './stages'
import { defaultSave } from './storage'
import { ORIGINAL_BOSS_AREA, ORIGINAL_FIRST } from './originalCampaign'

afterEach(() => useGame.getState().hardReset())

describe('2D 원작 진행 / 팬 후속편', () => {
  it('최초에는 네모루루섬 1지역만 열리고 팬 후속편은 잠긴다', () => {
    const save = defaultSave()
    expect(areaUnlocked(save, ORIGINAL_FIRST)).toBe(true)
    expect(areaUnlocked(save, ORIGINAL_FIRST + 1)).toBe(false)
    expect(areaUnlocked(save, 0)).toBe(false)
    save.cleared[getStage(ORIGINAL_FIRST, 3).id] = true
    expect(areaUnlocked(save, ORIGINAL_FIRST + 1)).toBe(true)
    expect(areaUnlocked(save, ORIGINAL_FIRST + 2)).toBe(true)
    save.cleared[getStage(ORIGINAL_BOSS_AREA, 0).id] = true
    expect(areaUnlocked(save, 0)).toBe(true)
    expect(areaCleared(save, ORIGINAL_BOSS_AREA)).toBe(true)
  })

  it('예전에 플레이한 추가 스토리의 클리어 기록이 새 업데이트에서 보존된다', () => {
    const save = defaultSave()
    save.cleared[getStage(0, 0).id] = true
    expect(legacyFanProgress(save)).toBe(true)
    expect(areaUnlocked(save, 0)).toBe(true)
    expect(areaUnlocked(save, 1)).toBe(false)
  })

  it('열 개 석상 보너스는 낮은 레벨 포켓몬의 경험치 1.5배만 적용한다', () => {
    const save = defaultSave()
    expect(originalStatueExpCap(save)).toBe(0)
    save.cleared[getStage(ORIGINAL_FIRST, 3).id] = true
    expect(originalStatueExpCap(save)).toBe(5)
    for (let i = ORIGINAL_FIRST; i <= ORIGINAL_BOSS_AREA - 1; i++) {
      save.cleared[getStage(i, [4,5,5,5,5,5,6,6,6,6][i - ORIGINAL_FIRST] - 1).id] = true
    }
    expect(originalStatueExpCap(save)).toBe(60)
  })

  it('기이한 섬은 뮤츠 엔딩 후 아홉 단계가 동시에 열리며 제한시간 5분이다', () => {
    const save = defaultSave()
    expect(areaUnlocked(save, 17)).toBe(false)
    save.cleared[getStage(ORIGINAL_BOSS_AREA, 0).id] = true
    expect(areaUnlocked(save, 17)).toBe(true)
    for (let i = 0; i < 9; i++) expect(getStage(17, i).timeLimitSec).toBe(300)
    expect(getStage(6, 0).recommended).toBe(140)
    expect(getStage(6, 3).recommended).toBe(520)
  })

  it('상위 냄비는 특정 석상 보스 클리어 후에 열리며 재료를 더 소모한다', () => {
    useGame.getState().newGame('시험', 7)
    const recipe = ['fossil','fossil','fossil','fossil','fossil'] as const
    useGame.setState(s => ({ save: { ...s.save, ingredients: { ...s.save.ingredients, fossil: 120 } } }))
    expect(useGame.getState().startCooking([...recipe], 3)).toBe(false)
    useGame.setState(s => ({ save: { ...s.save, cleared: { ...s.save.cleared, [getStage(16,0).id]: true } } }))
    expect(useGame.getState().startCooking([...recipe], 3)).toBe(true)
    expect(useGame.getState().save.ingredients.fossil).toBe(20)
    expect(useGame.getState().save.pot?.tier).toBe(3)
  })

  it('첫 파트너는 한 마리이며 요리는 탐험 후에만 완성된다', () => {
    useGame.getState().newGame('테스트', 25)
    expect(useGame.getState().save.owned).toHaveLength(1)
    expect(useGame.getState().save.party).toHaveLength(1)

    const fossil = ['fossil', 'fossil', 'fossil', 'fossil', 'fossil'] as const
    useGame.setState(s => ({ save: { ...s.save, ingredients: { ...s.save.ingredients, fossil: 18 } } }))
    expect(useGame.getState().startCooking([...fossil])).toBe(true)
    expect(useGame.getState().startCooking([...fossil])).toBe(false)
    expect(useGame.getState().save.pot).toMatchObject({ remaining: 2, total: 2 })
    expect(useGame.getState().collectCooked()).toBeNull()

    useGame.getState().finishBattle(false, getStage(ORIGINAL_FIRST, 0))
    expect(useGame.getState().save.pot?.remaining).toBe(1)
    useGame.getState().finishBattle(false, getStage(ORIGINAL_FIRST, 0))
    expect(useGame.getState().save.pot?.remaining).toBe(0)

    const additionalVisitors = useGame.getState().save.pot?.visitors?.length ?? 0
    const newcomer = useGame.getState().collectCooked()
    expect(newcomer).toBeTruthy()
    expect(useGame.getState().save.owned).toHaveLength(2)
    // The original game can bring two or three Pokémon from one dish;
    // this test must not fail randomly when a rare extra visitor appears.
    for (let i = 0; i < additionalVisitors; i++) {
      expect(useGame.getState().collectCooked()).toBeTruthy()
    }
    expect(useGame.getState().collectCooked()).toBeNull()
    expect(useGame.getState().save.owned).toHaveLength(2 + additionalVisitors)
    expect(useGame.getState().save.counters.cooked).toBe(1 + additionalVisitors)
  })
})
