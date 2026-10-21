import { describe, expect, it } from 'vitest'
import { backSprite, frontSprite, pokeapiSprite, POKEAPI_SPRITE_ROOT } from '../data/sprites'
import { MEMBER_REWARD_MS, DECORATIONS, memberRewardReady, memberRewardWait, ingredientBonus, trainingExpBonus, moveSuccessBonus, recycledIngredientBonus, maxBatteryBonus } from './decorations'
import { defaultSave } from './storage'
import { useGame } from '../store/gameStore'
import { autoEvolve, canEvolve } from './evolution'
import { unlockedBingoCount } from './bingo'
import { computeStats, type OwnedMon } from './stats'
import { getSpecies } from './roster'
import { createBattle, step, useSpecial } from '../engine/battle'
import { pack, unpack } from './saveKey'
import type { Stone } from './stones'

describe('PokéAPI default 2D pixel art', () => {
  it('uses the canonical Black/White pixel sprite links, never a 3D asset', () => {
    expect(frontSprite(25)).toBe(POKEAPI_SPRITE_ROOT + '/versions/generation-v/black-white/25.png')
    expect(backSprite(151)).toBe(POKEAPI_SPRITE_ROOT + '/versions/generation-v/black-white/back/151.png')
    expect(pokeapiSprite(198)).toMatch(/198\.png$/)
    expect(() => frontSprite(-1)).toThrow()
    expect(() => frontSprite(0)).toThrow()
  })
})
describe('Original free Poké Mart', () => {
  it('delivers member service every 22 hours, not repeatedly on the same day', () => {
    const s = defaultSave()
    expect(memberRewardReady(s, 100000)).toBe(true)
    s.ticketClaimedAt = 100000
    expect(memberRewardReady(s, 100000)).toBe(false)
    expect(memberRewardWait(s, 100000 + MEMBER_REWARD_MS - 200)).toBe(200)
    expect(memberRewardReady(s, 100000 + MEMBER_REWARD_MS)).toBe(true)
  })
  it('decorations apply passive colour rewards, training and battery boost', () => {
    const decorations = ['flareonCushion', 'charizardTorch', 'fearowVane', 'dittoBalloon', 'meowthBalloon', 'mewtwoArch']
    expect(DECORATIONS).toHaveLength(15)
    expect(ingredientBonus('mushroomRed', 3, decorations)).toBe(6)
    expect(ingredientBonus('rockBlue', 3, decorations)).toBe(3)
    expect(ingredientBonus('shell', 2, decorations)).toBe(2)
    expect(trainingExpBonus(decorations)).toBe(2)
    expect(moveSuccessBonus(decorations)).toBe(2)
    expect(recycledIngredientBonus(decorations)).toBe(2)
    expect(maxBatteryBonus(decorations)).toBe(1)
  })
  it('free PM tickets cannot be claimed twice or used to purchase a duplicate decoration', () => {
    useGame.getState().newGame('test', 25)
    expect(useGame.getState().claimMemberTickets()).toBe(50)
    expect(useGame.getState().claimMemberTickets()).toBe(0)
    expect(useGame.getState().buyDecoration('flareonCushion')).toBe(true)
    expect(useGame.getState().buyDecoration('flareonCushion')).toBe(false)
    expect(useGame.getState().save.decorations).toContain('flareonCushion')
    expect(useGame.getState().save.pmTickets).toBe(0)
  })
})
describe('Original evolution and Bingo rules', () => {
  it('Eevee evolves at level 36 according to its equipped HP/Attack stones; Everstone prevents it', () => {
    const hp: Stone = { id: 'h', kind: 'hp', star: 1, shape: 'dot' }
    const atk: Stone = { id: 'a', kind: 'atk', star: 1, shape: 'dot' }
    const mon: OwnedMon = { id: 'e', species: 133, level: 36, exp: 0,
      stones: [{ stone: 'h', x: 0, y: 0, rot: 0 }], mstones: [], bonus: [] }
    expect(canEvolve({ species: 133, level: 35 })).toBe(false)
    expect(autoEvolve(mon, [hp, atk]).species).toBe(134)
    expect(autoEvolve({ ...mon, stones: [{ stone: 'a', x: 0, y: 0, rot: 0 }] }, [hp, atk]).species).toBe(136)
    expect(autoEvolve({ ...mon, stones: [] }, [hp, atk]).species).toBe(135)
    expect(autoEvolve({ ...mon, everstone: true }, [hp, atk]).species).toBe(133)
  })
  it('unlocks three distinct Bingo bonuses only at 3, 6 and 9 stones', () => {
    const occ = new Map<string, number>()
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        occ.set(x + ',' + y, x + y * 3)
        const expected = y === 0 ? (x === 2 ? 1 : 0) : y === 1 ? (x === 2 ? 2 : 1) : x === 2 ? 3 : 2
        expect(unlockedBingoCount(occ)).toBe(expected)
      }
    }
  })
  it('new numerical ATK/HP stones add flat stats and survive encrypted save packing', () => {
    const sp = getSpecies(25)
    const base = computeStats(sp, 40)
    const attack: Stone = { id: 'stone-power', kind: 'atk', star: 2, shape: 'dot', value: 120 }
    const health: Stone = { id: 'stone-health', kind: 'hp', star: 2, shape: 'dot', value: 150 }
    const withStones = computeStats(sp, 40, [attack, health])
    expect(withStones.atk - base.atk).toBe(120)
    expect(withStones.maxHp - base.maxHp).toBe(150)
    const s = defaultSave()
    s.stones = [attack, health]
    expect(unpack(pack(s)).stones).toEqual(s.stones)
  })
  it('stores original new economy, Everstone and two-move layout using PQF1-compatible format', () => {
    const save = defaultSave()
    save.pmTickets = 300
    save.ticketClaimedAt = 150000
    save.decorations = ['jolteonCushion']
    save.owned = [{ id: 'm1', species: 25, level: 44, exp: 0, stones: [], bonus: [], mstones: [], move2: 'rally', everstone: true }]
    const restored = unpack(pack(save))
    expect(restored.pmTickets).toBe(300)
    expect(restored.ticketClaimedAt).toBe(150000)
    expect(restored.decorations).toEqual(['jolteonCushion'])
    expect(restored.owned[0].everstone).toBe(true)
    expect(restored.owned[0].move2).toBe('rally')
  })
})
describe('2D battle original revival and dual-move input', () => {
  const ally = (id: number, slot: number, move2?: string) => ({ ownedId: 'a' + slot, speciesId: id, level: 70,
    stats: computeStats(getSpecies(id), 70), ...(move2 ? { move2 } : {}) })
  it('can revive fainted allies after 25s, only while teammates survive', () => {
    const battle = createBattle([ally(25, 0), ally(7, 1)], [[{ species: 19, level: 1 }]])
    const first = battle.units.find(u => u.side === 'ally' && u.slot === 0)!
    first.hp = 0; first.alive = false; first.deadT = 24.8
    step(battle, 0.3)
    expect(first.alive).toBe(true)
    expect(first.revives).toBe(1)
    expect(first.hp).toBeGreaterThan(0)
    expect(first.hp).toBeLessThanOrEqual(first.maxHp * 0.5)
  })
  it('recognizes the optional second move and two independent cooldowns', () => {
    const battle = createBattle([ally(25, 0, 'rally'), ally(7, 1)], [[{ species: 19, level: 1 }]])
    const first = battle.units.find(u => u.side === 'ally' && u.slot === 0)!
    expect(first.secondary).not.toBeNull()
    first.spCd = 0; first.spCd2 = 0
    expect(useSpecial(battle, first.uid, 1)).toBe(true)
    expect(first.spCd2).toBeGreaterThan(0)
    expect(first.spCd).toBe(0)
  })
})
