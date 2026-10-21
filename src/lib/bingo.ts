// 빙고 보너스: 파워스톤 격자의 한 줄(가로 또는 세로)을 모두 스톤으로 채우면 포켓몬마다 정해진 보너스가 켜진다.
import type { Rng } from '../types'
import { GRID_H, GRID_W } from './stones'

export type BonusKind = 'atkCd' | 'spCd' | 'critRate' | 'critDmg' | 'moveSpd' | 'waveHeal' | 'lifesteal' | 'regen' | 'atkUp' | 'hpUp'

export const BONUS_INFO: Record<BonusKind, { label: string; max: number; unit: string }> = {
  atkCd: { label: '일반 공격 대기시간 감소', max: 25, unit: '%' },
  spCd: { label: '필살기 대기시간 감소', max: 25, unit: '%' },
  critRate: { label: '급소 확률 증가', max: 20, unit: '%p' },
  critDmg: { label: '급소 피해 증가', max: 50, unit: '%' },
  moveSpd: { label: '이동 속도 증가', max: 40, unit: '%' },
  waveHeal: { label: 'WAVE마다 HP 회복', max: 15, unit: '%' },
  lifesteal: { label: '공격 성공 시 HP 회복', max: 3, unit: '%' },
  regen: { label: 'HP 자연 회복(초당)', max: 1.2, unit: '%' },
  atkUp: { label: '공격력 증가', max: 25, unit: '%' },
  hpUp: { label: 'HP 증가', max: 25, unit: '%' },
}
export const BONUS_KINDS = Object.keys(BONUS_INFO) as BonusKind[]

/** 빙고 1·2·3줄일 때의 값. 많이 완성할수록 커진다 */
export interface Bonus { kind: BonusKind; v: [number, number, number] }

const round1 = (x: number) => Math.round(x * 10) / 10

/** 포켓몬이 합류할 때 서로 다른 보너스 3개를 무작위로 정한다 (이후 바뀌지 않음) */
export function rollBonuses(rng: Rng = Math.random): Bonus[] {
  const kinds = [...BONUS_KINDS]
  const out: Bonus[] = []
  for (let i = 0; i < 3; i++) {
    const kind = kinds.splice(Math.floor(rng() * kinds.length), 1)[0]
    const q = 0.55 + 0.45 * rng()
    const max = BONUS_INFO[kind].max
    out.push({ kind, v: [round1(max * q * 0.45), round1(max * q * 0.7), round1(max * q)] })
  }
  return out
}

/** 같은 id 면 항상 같은 보너스가 나오는 난수 (옛 저장 데이터 이전용) */
export function seededRng(seed: string): Rng {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => {
    h |= 0; h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 3x3 P애뮬릿의 3개 가로줄과 3개 세로줄: 총 6줄 */
export const BINGO_LINES: string[][] = [
  ...Array.from({ length: GRID_H }, (_, y) => Array.from({ length: GRID_W }, (_, x) => `${x},${y}`)),
  ...Array.from({ length: GRID_W }, (_, x) => Array.from({ length: GRID_H }, (_, y) => `${x},${y}`)),
]

/** 스톤으로 완전히 채워진 줄의 목록 */
export function completeLines(occ: Map<string, number>): string[][] {
  return BINGO_LINES.filter(line => line.every(c => occ.has(c)))
}
/** Original unlock thresholds: 3/6/9 stones, with a completed row/column. */
export function unlockedBingoCount(occ: Map<string, number>): number {
  return Math.min(3, completeLines(occ).length, Math.floor(occ.size / 3))
}

export interface Mods { atkCd: number; spCd: number; critRate: number; critDmg: number; moveSpd: number; waveHeal: number; lifesteal: number; regen: number; atkUp: number; hpUp: number }
export const NO_MODS: Mods = { atkCd: 0, spCd: 0, critRate: 0, critDmg: 0, moveSpd: 0, waveHeal: 0, lifesteal: 0, regen: 0, atkUp: 0, hpUp: 0 }

/** 빙고 줄 수(최대 3줄까지 인정)에 맞는 보너스 값. 0줄이면 아무 효과 없음 */
export function modsFor(bonuses: Bonus[], bingos: number): Mods {
  const m = { ...NO_MODS }
  if (bingos <= 0) return m
  // Three different perks unlock independently, not all at the first line.
  for (let i = 0; i < Math.min(3, bingos, bonuses.length); i++) {
    const b = bonuses[i]
    m[b.kind] += b.v[i]
  }
  return m
}

export const formatBonus = (kind: BonusKind, v: number) => `${BONUS_INFO[kind].label} +${v}${BONUS_INFO[kind].unit}`
