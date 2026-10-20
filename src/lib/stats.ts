import type { Species } from '../types'
import { calcMaxHp, calcStat } from './damage'
import { type Placement, SHAPES, type Stone, STONE_INFO } from './stones'

export const MAX_LEVEL = 50
/** 실시간 전투 호흡에 맞춘 체력 보정 */
export const HP_SCALE = 2.2

export interface OwnedMon { id: string; species: number; level: number; exp: number; stones: Placement[] }

export interface Stats { maxHp: number; atk: number; def: number; spe: number; crit: number }

export const BASE_CRIT = 0.06

/** 레벨과 배치한 파워스톤을 반영한 전투 스탯 (칸 수 × 별 개수만큼 효과가 커진다) */
export function computeStats(sp: Species, level: number, stones: Stone[] = []): Stats {
  let hp = 1, atk = 1, def = 1, spd = 1, crit = BASE_CRIT
  for (const s of stones) {
    const v = STONE_INFO[s.kind].per * s.star * SHAPES[s.shape].length
    if (s.kind === 'hp') hp += v
    else if (s.kind === 'atk') atk += v
    else if (s.kind === 'def') def += v
    else if (s.kind === 'spd') spd += v
    else crit += v
  }
  return {
    maxHp: Math.floor(calcMaxHp(sp.stats.hp, level) * HP_SCALE * hp),
    atk: Math.floor(calcStat(sp.stats.atk, level) * atk),
    def: Math.floor(calcStat(sp.stats.def, level) * def),
    spe: Math.floor(calcStat(sp.stats.spe, level) * spd),
    crit,
  }
}

/** 표시용 전투력 */
export const powerRating = (s: Stats) => Math.round(s.maxHp / 3 + s.atk * 2 + s.def + s.spe)

export const expToNext = (level: number) => Math.round(8 * Math.pow(level, 1.4))

/** 경험치를 주고 레벨업을 처리한다. 올라간 레벨 수를 함께 반환 */
export function addExp(mon: OwnedMon, amount: number): { mon: OwnedMon; gained: number } {
  let { level, exp } = mon
  exp += Math.max(0, Math.floor(amount))
  const start = level
  while (level < MAX_LEVEL && exp >= expToNext(level)) {
    exp -= expToNext(level)
    level++
  }
  if (level >= MAX_LEVEL) exp = 0
  return { mon: { ...mon, level, exp }, gained: level - start }
}
