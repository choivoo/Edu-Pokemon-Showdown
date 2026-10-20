import type { SaveData } from './storage'
import { computeStats, type OwnedMon, powerRating, type Stats } from './stats'
import type { Stone } from './stones'
import { getSpecies } from './roster'

/** 이 포켓몬의 격자에 놓인 스톤들 */
export const placedStones = (save: SaveData, mon: OwnedMon): Stone[] =>
  mon.stones.map(p => save.stones.find(s => s.id === p.stone)).filter((s): s is Stone => !!s)

export const statsOf = (save: SaveData, mon: OwnedMon): Stats => computeStats(getSpecies(mon.species), mon.level, placedStones(save, mon))
export const powerOf = (save: SaveData, mon: OwnedMon) => powerRating(statsOf(save, mon))
export const partyMons = (save: SaveData): OwnedMon[] => save.party.map(id => save.owned.find(o => o.id === id)).filter((o): o is OwnedMon => !!o)
export const partyPower = (save: SaveData) => partyMons(save).reduce((a, m) => a + powerOf(save, m), 0)
/** 어느 포켓몬에든 놓인 스톤 id 집합 */
export const usedStoneIds = (save: SaveData): Set<string> => new Set(save.owned.flatMap(o => o.stones.map(p => p.stone)))
