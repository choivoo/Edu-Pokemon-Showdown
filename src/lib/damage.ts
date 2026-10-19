import type { PokemonType, Rng } from '../types'
import { typeMultiplier } from './typeChart'

export interface DamageInput {
  level: number
  power: number
  atk: number
  def: number
  moveType: PokemonType
  defenderTypes: PokemonType[]
  rng: Rng
  crit?: boolean
}

export interface DamageResult {
  damage: number
  effectiveness: number
  crit: boolean
}

export const CRIT_MULTIPLIER = 1.5

/** ((2*Lv/5+2) * 위력 * 공격/방어 / 50 + 2) * 상성 * 랜덤(0.85~1) [* 급소] */
export function calcDamage(i: DamageInput): DamageResult {
  const effectiveness = typeMultiplier(i.moveType, i.defenderTypes)
  const crit = !!i.crit
  if (effectiveness === 0) return { damage: 0, effectiveness, crit }
  const base = ((2 * i.level) / 5 + 2) * i.power * (i.atk / i.def) / 50 + 2
  const random = 0.85 + i.rng() * 0.15
  const raw = base * effectiveness * random * (crit ? CRIT_MULTIPLIER : 1)
  return { damage: Math.max(1, Math.floor(raw)), effectiveness, crit }
}

/** 급소 확률: 기본 1/16 + 남은 시간 비율(빨리 맞힐수록)에 비례해 최대 +25%p */
export function critChance(timeLeftRatio: number): number {
  const r = Math.min(1, Math.max(0, timeLeftRatio))
  return 1 / 16 + r * 0.25
}

/** 레벨 기반 스탯 (원작 개체값/노력치 제외 간소화) */
export function calcMaxHp(base: number, level: number): number {
  return Math.floor((2 * base * level) / 100) + level + 10
}
export function calcStat(base: number, level: number): number {
  return Math.floor((2 * base * level) / 100) + 5
}
