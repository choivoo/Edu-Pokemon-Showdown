import { afterEach, describe, expect, it } from 'vitest'
import { useGame } from '../store/gameStore'
import { defaultSave } from './storage'
import { getStage } from './stages'
import { ORIGINAL_FIRST } from './originalCampaign'
import { canTutorialExplore, isTutorialStage, tutorialPhase, tutorialWaves, TUTORIAL_ACTIVE, TUTORIAL_FINISHED, TUTORIAL_ACKNOWLEDGED, TUTORIAL_BATTLE_HINTS, TUTORIAL_SEQUENCE, TUTORIAL_STEW_INGREDIENTS, ONBOARDING_LINES, tutorialHint } from './tutorial'
import { pack, unpack } from './saveKey'
afterEach(()=>useGame.getState().hardReset())

const first=()=>getStage(ORIGINAL_FIRST,0)
const second=()=>getStage(ORIGINAL_FIRST,1)

describe('Official Quest introductory tutorial — original sequence',()=>{
  it('old and imported saves never force a tutorial',()=>{
    const save=defaultSave()
    expect(tutorialPhase(save)).toBeNull()
    expect(canTutorialExplore(save,getStage(ORIGINAL_FIRST,2))).toBe(true)
    expect(isTutorialStage(save,first())).toBe(false)
  })
  it('newly chosen starters immediately enter a very easy first fight',()=>{
    for(const species of [1,4,7,25,133]){
      useGame.getState().hardReset()
      useGame.getState().newGame('초보',species)
      const state=useGame.getState()
      expect(state.screen).toBe('battle')
      expect(state.stage?.id).toBe(first().id)
      expect(state.save.seenStory).toContain(TUTORIAL_ACTIVE)
      expect(state.save.owned).toHaveLength(1)
      expect(state.save.owned[0].species).toBe(species)
      expect(state.save.party).toHaveLength(1)
      expect(tutorialPhase(state.save)).toBe('first-expedition')
      expect(isTutorialStage(state.save,first())).toBe(true)
      const waves=tutorialWaves(state.save,first())!
      expect(waves.map(group=>group.length)).toEqual([1,1,1])
      expect(waves.flat().map(x=>x.species)).toEqual([16,19,52])
      expect(Math.max(...waves.flat().map(x=>x.level))).toBeLessThanOrEqual(2)
      expect(state.startStage(getStage(ORIGINAL_FIRST,2))).toBe(false)
    }
  })
  it('first win guarantees central-slot compatible stone; next fight gated until it is equipped',()=>{
    useGame.getState().newGame('샘플',25)
    useGame.getState().finishBattle(true,first(),3)
    const store=useGame.getState()
    expect(store.screen).toBe('result')
    expect(store.save.stones).toHaveLength(1)
    expect(store.save.stones[0].shape).toBe('dot')
    expect(tutorialPhase(store.save)).toBe('power-stone')
    expect(store.startStage(second())).toBe(false)
    const mon=store.save.owned[0],stone=store.save.stones[0]
    expect(store.autoPlaceStone(mon.id,stone.id)).toBe(true)
    const next=useGame.getState()
    expect(next.save.owned[0].stones).toHaveLength(1)
    expect(tutorialPhase(next.save)).toBe('second-expedition')
    expect(next.startStage(second())).toBe(true)
    const waves=tutorialWaves(useGame.getState().save,second())!
    expect(waves[2][0]).toMatchObject({species:11,elite:true})
  })
  it('after the second fight, a tutorial stew is instantly ready for Pidgey then Rattata',()=>{
    useGame.getState().newGame('새 섬',7)
    useGame.getState().finishBattle(true,first())
    let s=useGame.getState().save
    expect(useGame.getState().autoPlaceStone(s.owned[0].id,s.stones[0].id)).toBe(true)
    expect(useGame.getState().startStage(second())).toBe(true)
    useGame.getState().finishBattle(true,second())
    expect(tutorialPhase(useGame.getState().save)).toBe('cooking')
    const ingredients=['mushroomRed','berryBlue','nutYellow','fossil','rootRed'] as const
    expect(useGame.getState().startCooking([...ingredients],0)).toBe(true)
    expect(useGame.getState().save.pot).toMatchObject({species:16,visitors:[19],remaining:0})
    expect(tutorialPhase(useGame.getState().save)).toBe('friends')
    const pidgey=useGame.getState().collectCooked()!
    expect(pidgey.species).toBe(16)
    expect(useGame.getState().save.pot?.species).toBe(19)
    const rattata=useGame.getState().collectCooked()!
    expect(rattata.species).toBe(19)
    s=useGame.getState().save
    expect(s.owned).toHaveLength(3)
    expect(s.party).toHaveLength(3)
    expect(s.pot).toBeNull()
    expect(s.seenStory).toContain(TUTORIAL_FINISHED)
    expect(tutorialPhase(s)).toBe('complete')
    expect(useGame.getState().startStage(getStage(ORIGINAL_FIRST,2))).toBe(true)
  })
  it('persist tutorial checkpoints on all-device PQF1 encrypted save codes, including legacy compatibility',()=>{
    useGame.getState().newGame('기록',4)
    useGame.getState().finishBattle(true,first())
    let saved=useGame.getState().save
    expect(tutorialPhase(unpack(pack(saved)))).toBe('power-stone')
    saved={...saved,seenStory:[TUTORIAL_ACTIVE,TUTORIAL_FINISHED,TUTORIAL_ACKNOWLEDGED]}
    expect(unpack(pack(saved)).seenStory).toEqual(saved.seenStory)
    const legacy=pack(saved)
    legacy.pop()
    expect(unpack(legacy).seenStory).toEqual(['intro-0'])
    expect(tutorialPhase(unpack(legacy))).toBeNull()
  })
})

describe('Expanded MoBee prologue and user journey regressions',()=>{
  it('keeps exactly the documented original sequence, from ship/MoBee to second expedition and cooked guests',()=>{
    expect(TUTORIAL_SEQUENCE).toHaveLength(7)
    expect(TUTORIAL_SEQUENCE[0]).toContain('배')
    expect(TUTORIAL_SEQUENCE[2]).toContain('1-1')
    expect(TUTORIAL_SEQUENCE[3]).toContain('P스톤')
    expect(TUTORIAL_SEQUENCE[4]).toContain('1-2')
    expect(TUTORIAL_SEQUENCE[5]).toContain('요리')
    expect(TUTORIAL_SEQUENCE[6]).toContain('구구')
    expect(ONBOARDING_LINES.arrival.length).toBeGreaterThanOrEqual(4)
    expect(ONBOARDING_LINES.reboot.length).toBeGreaterThanOrEqual(2)
    expect(ONBOARDING_LINES.starters.length).toBeGreaterThanOrEqual(2)
    expect(ONBOARDING_LINES.finished.length).toBeGreaterThanOrEqual(2)
  })
  it('offers three battle lessons: 2D free move, twin move buttons and scatter',()=>{
    expect(TUTORIAL_BATTLE_HINTS).toHaveLength(3)
    expect(TUTORIAL_BATTLE_HINTS[0].description).toMatch(/WASD/)
    expect(TUTORIAL_BATTLE_HINTS[1].description).toMatch(/두|기술/)
    expect(TUTORIAL_BATTLE_HINTS[2].description).toContain('흩어지기')
  })
  it('starter carries two moves and the first expedition can be safely retried',()=>{
    useGame.getState().newGame('첫 시작',4)
    expect(useGame.getState().save.owned[0].move).toBeTruthy()
    expect(useGame.getState().save.owned[0].move2).toBeTruthy()
    useGame.getState().finishBattle(false,first())
    expect(tutorialPhase(useGame.getState().save)).toBe('first-expedition')
    expect(useGame.getState().startStage(first())).toBe(true)
  })
  it('the recommended five starter ingredients are already affordable and cook a guaranteed scripted stew',()=>{
    const game=useGame.getState()
    game.newGame('요리 수업',1)
    game.finishBattle(true,first())
    let s=useGame.getState().save
    expect(useGame.getState().autoPlaceStone(s.party[0],s.stones[0].id)).toBe(true)
    expect(useGame.getState().startStage(second())).toBe(true)
    useGame.getState().finishBattle(true,second())
    s=useGame.getState().save
    expect(tutorialHint(tutorialPhase(s))).toContain('냄비')
    expect(TUTORIAL_STEW_INGREDIENTS).toHaveLength(5)
    for(const ingredient of TUTORIAL_STEW_INGREDIENTS)expect(s.ingredients[ingredient]).toBeGreaterThanOrEqual(1)
    expect(useGame.getState().startCooking([...TUTORIAL_STEW_INGREDIENTS])).toBe(true)
    expect(useGame.getState().save.pot).toMatchObject({recipe:1,species:16,visitors:[19],remaining:0})
    expect(useGame.getState().collectCooked()?.species).toBe(16)
    expect(useGame.getState().collectCooked()?.species).toBe(19)
    expect(tutorialHint(tutorialPhase(useGame.getState().save))).toContain('세 동료')
  })
})
