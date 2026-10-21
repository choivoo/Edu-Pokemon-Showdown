import { describe, expect, it } from 'vitest'
import { socketAccepts, socketKind, unlockedCount, type Stone } from './stones'
import { getSpecies } from './roster'
import { computeStats } from './stats'
import { rollRewards, getStage } from './stages'
import { decorationBonus } from './decorations'
import { calcDamage } from './damage'
import { modsFor } from './bingo'
import { defaultSave } from './storage'
import { pack, unpack } from './saveKey'
import { useGame } from '../store/gameStore'

describe('2D 원작 시스템 충실도 개선', () => {
  it('같은 포켓몬 소켓은 고정되며 HP/공격 제한이 적용된다', () => {
    expect(unlockedCount(1)).toBe(1)
    expect(unlockedCount(100)).toBe(9)
    expect(socketKind('m1', 25, 1, 1)).toBe('both')
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const kind = socketKind('m15', 25, x, y)
      expect(socketKind('m15', 25, x, y)).toBe(kind)
      expect(socketAccepts('m15', 25, 'atk', 'dot', x, y, 0)).toBe(kind === 'both' || kind === 'atk')
      expect(socketAccepts('m15', 25, 'hp', 'dot', x, y, 0)).toBe(kind === 'both' || kind === 'hp')
    }
  })
  it('최초 10회 보너스 탐험은 금색 스톤을 확정 획득한다', () => {
    const stage = getStage(10, 2)
    const bonus = rollRewards(stage, () => 0.4, true)
    expect(bonus.stone).not.toBeNull()
    expect(bonus.stone?.star).toBe(3)
    expect(bonus.stone?.value).toBeGreaterThan(0)
    expect(Object.keys(bonus.stone?.effects ?? {})).toHaveLength(3)
  })
  it('금색 스톤은 평면 스탯에 직접 합산되고 옵션도 전투에 반영된다', () => {
    const pikachu = getSpecies(25)
    const base = computeStats(pikachu, 50)
    const gear: Stone[] = [
      { id: 'a', kind: 'hp', shape: 'dot', star: 3, value: 275, effects: { hitHealing: 4, critRate: 6 } },
      { id: 'b', kind: 'atk', shape: 'dot', star: 2, value: 190, effects: { naturalHealing: 2 } },
    ]
    const buffed = computeStats(pikachu, 50, gear)
    expect(buffed.maxHp).toBeGreaterThan(base.maxHp)
    expect(buffed.atk).toBeGreaterThan(base.atk)
    expect(buffed.lifesteal).toBeCloseTo(0.04)
    expect(buffed.regen).toBeCloseTo(0.02)
    expect(buffed.crit).toBeCloseTo(base.crit + 0.06)
  })
  it('빙고 보너스는 한 줄씩 하나씩 해금된다', () => {
    const bonuses = [
      { kind: 'atkUp' as const, v: [8, 16, 25] as [number,number,number] },
      { kind: 'hpUp' as const, v: [8, 16, 25] as [number,number,number] },
      { kind: 'critRate' as const, v: [2, 4, 6] as [number,number,number] },
    ]
    expect(modsFor(bonuses, 1).atkUp).toBe(8)
    expect(modsFor(bonuses, 1).hpUp).toBe(0)
    expect(modsFor(bonuses, 2).hpUp).toBe(16)
    expect(modsFor(bonuses, 2).critRate).toBe(0)
    expect(modsFor(bonuses, 3).critRate).toBe(6)
  })
  it('타입상성으로 인한 0배/2배 피해가 없고 지역 보너스는 별개다', () => {
    const input = { level: 50, power: 70, atk: 100, def: 100, moveType: 'normal' as const, defenderTypes: ['ghost' as const], rng: () => 1 }
    expect(calcDamage(input).damage).toBeGreaterThan(0)
    expect(calcDamage({ ...input, defenderTypes: ['normal'] }).damage).toBe(calcDamage(input).damage)
    expect(calcDamage({ ...input, moveType: 'water', defenderTypes: ['fire'] }).damage).toBe(calcDamage(input).damage)
  })
  it('구매만으로 장식 보너스가 적용되고 같은 장식을 중복계산하지 않는다', () => {
    expect(decorationBonus([]).ingredient).toBe(0)
    expect(decorationBonus(['berry-basket','berry-basket','moss-lantern']).ingredient).toBeCloseTo(0.35)
    const st = getStage(6, 2)
    const before = rollRewards(st, () => 0.5)
    const after = rollRewards(st, () => 0.5, false, decorationBonus(['berry-basket', 'moss-lantern']))
    const count = (o: typeof before) => Object.values(o.ingredients).reduce((a, n) => a + (n ?? 0), 0)
    expect(count(after)).toBeGreaterThan(count(before))
  })
  it('장식을 소유하면 전시하지 않아도 버프가 유지된다', () => {
    useGame.setState(s => ({ save: { ...defaultSave(), started: true, name: '테스트', coins: 2000, owned: s.save.owned, party: s.save.party } }))
    expect(useGame.getState().buyDecoration('camp-tent')).toBe(true)
    expect(useGame.getState().buyDecoration('camp-tent')).toBe(false)
    expect(decorationBonus(useGame.getState().save.decorations).cook).toBe(1)
    expect(useGame.getState().toggleDecoration('camp-tent')).toBe(true)
    expect(useGame.getState().save.placedDecorations).toEqual([])
    expect(decorationBonus(useGame.getState().save.decorations).cook).toBe(1)
  })
  it('특수 스톤과 개인 최고 기록, 장식 정보는 암호화된 저장 포맷의 원본을 그대로 왕복한다', () => {
    const s = defaultSave()
    s.stones = [{ id: 's1', kind: 'atk', star: 3, shape: 'dot', value: 348, effects: { critRate: 10, hitHealing: 2 } }]
    s.clearTimes = { 'a17-s0': 42.5 }
    s.decorations = ['camp-tent']
    s.placedDecorations = ['camp-tent']
    const out = unpack(pack(s))
    expect(out.stones).toEqual(s.stones)
    expect(out.clearTimes).toEqual(s.clearTimes)
    expect(out.decorations).toEqual(s.decorations)
    expect(out.placedDecorations).toEqual(s.placedDecorations)
  })
  it('기이한 섬의 기록은 클리어 후 빠른 기록만 갱신한다', () => {
    const initial = defaultSave()
    initial.started = true
    initial.owned = [{ id: 'm1', species: 25, level: 60, exp: 0, stones: [], bonus: [], mstones: [] }]
    initial.party = ['m1']
    useGame.setState({ save: initial })
    const stage = getStage(17, 0)
    useGame.getState().finishBattle(true, stage, 3, 120.3)
    expect(useGame.getState().save.clearTimes[stage.id]).toBe(120.3)
    useGame.getState().finishBattle(true, stage, 3, 130)
    expect(useGame.getState().save.clearTimes[stage.id]).toBe(120.3)
    useGame.getState().finishBattle(true, stage, 3, 83.59)
    expect(useGame.getState().save.clearTimes[stage.id]).toBe(83.6)
  })
})
