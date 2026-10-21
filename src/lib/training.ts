import type { Move, Rng } from '../types'
import { MOVES, getSpecies } from './roster'
import { isEvolvedForm } from './evolution'
import { expToNext, type OwnedMon } from './stats'
import { questLearnset } from '../data/questSpecies'

export const TRAIN_MAX = 4
/** 기술 떠올리기 성공 확률이 회복되는 시간 (분 단위로 1회씩) */
export const RECALL_RECOVER_MS = 20 * 60 * 1000

/** 재료로 쓰는 포켓몬이 대상과 얼마나 잘 맞는지 (같은 종 > 같은 타입 > 진화/전설 보너스) */
export function affinity(target: OwnedMon, food: OwnedMon): number {
  const t = getSpecies(target.species), f = getSpecies(food.species)
  let a = 0.1
  if (f.id === t.id) a += 0.22
  else if (f.types.some(x => t.types.includes(x))) a += 0.12
  if (isEvolvedForm(f.id)) a += 0.08
  if (f.rarity >= 4) a += 0.3
  return a
}

/** 특훈으로 얻는 경험치 */
export function trainExp(target: OwnedMon, foods: OwnedMon[]): number {
  return Math.round(foods.reduce((sum, f) => {
    const sp = getSpecies(f.species)
    const base = 30 + f.level * 7 + sp.rarity * 25
    return sum + base * (1 + affinity(target, f) * 2.2)
  }, 0))
}

/** 현재 남아 있는 "떠올리기 피로" (시간이 지나면 줄어든다) */
export function recallFatigue(m: OwnedMon, now: number): number {
  const n = m.recalls ?? 0
  if (!n) return 0
  return Math.max(0, n - Math.floor((now - (m.recallT ?? now)) / RECALL_RECOVER_MS))
}

export function recallChance(target: OwnedMon, foods: OwnedMon[], now: number): number {
  if (!foods.length) return 0
  const sum = foods.reduce((a, f) => a + affinity(target, f), 0)
  return Math.min(0.95, Math.max(0.04, sum - 0.12 * recallFatigue(target, now)))
}

/** 이 포켓몬이 떠올릴 수 있는 필살기 후보 (자기 타입의 공격기 + 어울리는 보조기) */
export function recallPool(m: OwnedMon): Move[] {
  const sp = getSpecies(m.species)
  const cur = m.move ?? sp.special
  const questMoves = questLearnset(sp.id)
  if (questMoves.length) return questMoves.filter(mv => mv.id !== cur && mv.id !== m.move2)
  return MOVES.filter(mv => mv.id !== cur && mv.id !== sp.basic && (mv.role ? mv.learn?.some(t => sp.types.includes(t)) : sp.types.includes(mv.type) && mv.power >= 70))
}

export interface RecallResult { ok: boolean; mon: OwnedMon; move: Move | null }

export function recall(target: OwnedMon, foods: OwnedMon[], now: number, rng: Rng, multiplier = 1): RecallResult {
  const chance = Math.min(0.95, recallChance(target, foods, now) * multiplier)
  const fatigue = recallFatigue(target, now)
  const next: OwnedMon = { ...target, recalls: fatigue + 1, recallT: now }
  const pool = recallPool(target)
  if (!pool.length || rng() >= chance) return { ok: false, mon: next, move: null }
  const move = pool[Math.floor(rng() * pool.length)]
  return { ok: true, mon: { ...next, move: move.id }, move }
}

export const expNeededLabel = (m: OwnedMon) => expToNext(m.level)
