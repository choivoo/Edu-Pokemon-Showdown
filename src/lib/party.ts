import type { SaveData } from './storage'
import { computeStats, type OwnedMon, powerRating, type Stats } from './stats'
import { unlockedBingoCount, type Mods, modsFor } from './bingo'
import { type MoveFx, moveFx, type MoveStone } from './moveStones'
import { occupancy } from './stones'
import type { Stone } from './stones'
import { getSpecies } from './roster'
import { questBingoEffects } from './questBingo'

/** 이 포켓몬의 격자에 놓인 스톤들 */
export const placedStones = (save: SaveData, mon: OwnedMon): Stone[] =>
  mon.stones.map(p => save.stones.find(s => s.id === p.stone)).filter((s): s is Stone => !!s)

/** 격자에서 완성된 빙고 줄 수 */
export const bingoOf = (save: SaveData, mon: OwnedMon) => unlockedBingoCount(occupancy(mon.stones, save.stones))
export const modsOf = (save: SaveData, mon: OwnedMon): Mods => modsFor(mon.bingoChoices ? [] : mon.bonus, bingoOf(save, mon))
export const equippedMoveStones = (save: SaveData, mon: OwnedMon): MoveStone[] => mon.mstones.map(id => save.moveStones.find(s => s.id === id)).filter((s): s is MoveStone => !!s)
export const moveFxOf = (save: SaveData, mon: OwnedMon, slot: 0|1 = 0): MoveFx => {
  const all=equippedMoveStones(save,mon)
  if (!mon.moveStoneSlots) return slot===0 ? moveFx(all) : moveFx([])
  return moveFx(all.filter((_,i)=>(mon.moveStoneSlots?.[i]??0)===slot))
}

export const statsOf = (save: SaveData, mon: OwnedMon): Stats => {
  const stats=computeStats(getSpecies(mon.species), mon.level, placedStones(save, mon), modsOf(save, mon), mon)
  if(!mon.bingoChoices)return stats // preserve original fan save bonuses
  const e=questBingoEffects(mon.species,mon.bingoChoices,bingoOf(save,mon))
  return {...stats,
    maxHp:stats.maxHp+e.hpFlat, atk:stats.atk+e.atkFlat,
    atkCd:Math.min(.75,stats.atkCd+e.atkCd),
    crit:Math.min(.99,stats.crit+e.critRate),critDmg:stats.critDmg+e.critDmg,
    moveSpd:stats.moveSpd+e.moveSpd,waveHeal:stats.waveHeal+e.waveHeal,
    lifesteal:stats.lifesteal+e.lifesteal,regen:stats.regen+e.regen,
    koHeal:(stats.koHeal??0)+e.koHeal,reviveSpeed:Math.min(.9,(stats.reviveSpeed??0)+e.reviveSpeed),
    reviveHp:(stats.reviveHp??0)+e.reviveHp,effectResist:(stats.effectResist??0)+e.effectResist,
    statusResist:(stats.statusResist??0)+e.statusResist,
    typeMoveAtk:e.typeAtk,typeMoveWait:e.typeWait,typeDamageResist:e.typeDamageResist,
    statusTypeResist:e.statusTypeResist,critTakenResist:e.criticalTaken,bodySize:e.size}
}
export const powerOf = (save: SaveData, mon: OwnedMon) => powerRating(statsOf(save, mon))
export const partyMons = (save: SaveData): OwnedMon[] => save.party.map(id => save.owned.find(o => o.id === id)).filter((o): o is OwnedMon => !!o)
export const partyPower = (save: SaveData) => partyMons(save).reduce((a, m) => a + powerOf(save, m), 0)
/** 어느 포켓몬에든 놓인 스톤 id 집합 */
export const usedStoneIds = (save: SaveData): Set<string> => new Set(save.owned.flatMap(o => o.stones.map(p => p.stone)))
/** 어느 포켓몬에든 장착된 기술스톤 id 집합 */
export const usedMoveStoneIds = (save: SaveData): Set<string> => new Set(save.owned.flatMap(o => o.mstones))
