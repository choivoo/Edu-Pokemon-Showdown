import { afterEach, describe, expect, it } from 'vitest'
import { useGame, areaCleared, areaUnlocked, legacyFanProgress } from '../store/gameStore'
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

  it('첫 파트너는 한 마리이며 요리는 탐험 후에만 완성된다', () => {
    useGame.getState().newGame('테스트', 25)
    expect(useGame.getState().save.owned).toHaveLength(1)
    expect(useGame.getState().save.party).toHaveLength(1)

    const fossil = ['fossil', 'fossil', 'fossil', 'fossil', 'fossil'] as const
    expect(useGame.getState().startCooking([...fossil])).toBe(true)
    expect(useGame.getState().startCooking([...fossil])).toBe(false)
    expect(useGame.getState().save.pot).toMatchObject({ remaining: 2, total: 2 })
    expect(useGame.getState().collectCooked()).toBeNull()

    useGame.getState().finishBattle(false, getStage(ORIGINAL_FIRST, 0))
    expect(useGame.getState().save.pot?.remaining).toBe(1)
    useGame.getState().finishBattle(false, getStage(ORIGINAL_FIRST, 0))
    expect(useGame.getState().save.pot?.remaining).toBe(0)

    const newcomer = useGame.getState().collectCooked()
    expect(newcomer).toBeTruthy()
    expect(useGame.getState().save.owned).toHaveLength(2)
    expect(useGame.getState().collectCooked()).toBeNull()
    expect(useGame.getState().save.counters.cooked).toBe(1)
  })
})
