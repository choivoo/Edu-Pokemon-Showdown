import type { PokemonType, Rng } from '../types'

export type Status = 'poison' | 'paralysis' | 'burn'

export const STATUS_LABEL: Record<Status, string> = { poison: '독', paralysis: '마비', burn: '화상' }
export const STATUS_COLOR: Record<Status, string> = { poison: '#a040a0', paralysis: '#d8b820', burn: '#e0602a' }
export const STATUS_CHANCE = 0.3

/** 기술 타입이 부여하는 상태이상 */
export function statusForMove(type: PokemonType): Status | null {
  if (type === 'poison') return 'poison'
  if (type === 'electric') return 'paralysis'
  if (type === 'fire') return 'burn'
  return null
}

/** 독 타입·강철은 독, 전기 타입은 마비, 불꽃 타입은 화상에 걸리지 않는다 */
export function canInflict(status: Status, defender: PokemonType[]): boolean {
  if (status === 'poison') return !defender.some(t => t === 'poison' || t === 'steel')
  if (status === 'paralysis') return !defender.includes('electric')
  return !defender.includes('fire')
}

export const statusMessage = (name: string, s: Status) =>
  s === 'poison' ? `${name}은(는) 독에 걸렸다!` : s === 'paralysis' ? `${name}은(는) 마비되어 기술이 나가기 어려워졌다!` : `${name}은(는) 화상을 입었다!`

/** 턴 종료 시 독/화상 데미지: 최대 HP의 1/8 */
export function endOfTurnDamage(maxHp: number, s: Status | null): number {
  return s === 'poison' || s === 'burn' ? Math.max(1, Math.floor(maxHp / 8)) : 0
}

/** 마비: 25% 확률로 행동 불가 */
export const paralyzedSkip = (s: Status | null, rng: Rng): boolean => s === 'paralysis' && rng() < 0.25

export const effectiveAtk = (atk: number, s: Status | null) => (s === 'burn' ? Math.floor(atk / 2) : atk)
export const effectiveSpeed = (spe: number, s: Status | null) => (s === 'paralysis' ? Math.floor(spe / 2) : spe)
