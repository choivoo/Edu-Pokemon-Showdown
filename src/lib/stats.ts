import type { Species } from '../types'
import { calcMaxHp, calcStat } from './damage'

export const MAX_LEVEL = 50
/** 실시간 전투 호흡에 맞춘 체력 보정 */
export const HP_SCALE = 2.2

export type StoneKind = 'hp' | 'atk' | 'def' | 'spd' | 'crit'
export interface Stone { id: string; kind: StoneKind; star: 1 | 2 | 3 }
export interface OwnedMon { id: string; species: number; level: number; exp: number; stones: (string | null)[] }

export const STONE_SLOTS = 2
export const STONE_INFO: Record<StoneKind, { name: string; emoji: string; desc: string }> = {
  hp: { name: '체력석', emoji: '❤️', desc: '체력 +10%' },
  atk: { name: '공격석', emoji: '🗡️', desc: '공격 +8%' },
  def: { name: '방어석', emoji: '🛡️', desc: '방어 +8%' },
  spd: { name: '속도석', emoji: '👟', desc: '속도 +8%' },
  crit: { name: '급소석', emoji: '🎯', desc: '급소 확률 +4%p' },
}
export const STONE_KINDS = Object.keys(STONE_INFO) as StoneKind[]

export interface Stats { maxHp: number; atk: number; def: number; spe: number; crit: number }

export const BASE_CRIT = 0.06

/** 레벨과 장착한 파워스톤을 반영한 전투 스탯 (별 개수만큼 효과가 배가된다) */
export function computeStats(sp: Species, level: number, stones: Stone[] = []): Stats {
  let hp = 1, atk = 1, def = 1, spd = 1, crit = BASE_CRIT
  for (const s of stones) {
    if (s.kind === 'hp') hp += 0.1 * s.star
    else if (s.kind === 'atk') atk += 0.08 * s.star
    else if (s.kind === 'def') def += 0.08 * s.star
    else if (s.kind === 'spd') spd += 0.08 * s.star
    else crit += 0.04 * s.star
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

/** 같은 종류·같은 별 2개를 합성하면 별 +1 (최대 3). 비용은 별 × 50 코인 */
export const mergeCost = (star: number) => star * 50
