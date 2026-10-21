export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export type Rng = () => number

export interface Move {
  id: string
  name: string
  type: PokemonType
  power: number
  /** Original Quest move cooldown, in seconds (if specified). */
  wait?: number
  /** Which of the six Quest move stones fit this move. */
  stones?: Array<'quick'|'repeat'|'widen'|'multiply'|'bond'|'lasting'>
  /** 버프/디버프/상태이상 기술이면 지정 (없으면 평범한 공격기) */
  role?: 'buff' | 'debuff' | 'status'
  fx?: SupportFx
  /** 이 타입의 포켓몬이 떠올릴 수 있다 (보조기) */
  learn?: PokemonType[]
}

export type StatusKind = 'poison' | 'paralyze' | 'burn' | 'sleep' | 'freeze' | 'confuse' | 'chain'

export interface SupportFx {
  /** 공격력/방어력 증감 비율 (0.25 = 25%) */
  atk?: number
  def?: number
  /** 이동·공격 속도 증감 비율 */
  speed?: number
  /** 아군 회복 비율 (최대 체력 기준) */
  heal?: number
  status?: StatusKind
  secs?: number
}

export type Rarity = 1 | 2 | 3 | 4

export interface Species {
  id: number
  name: string
  types: PokemonType[]
  stats: { hp: number; atk: number; def: number; spe: number }
  /** 1 흔함 / 2 보통 / 3 희귀 / 4 전설(스토리 보상 전용) */
  rarity: Rarity
  basic: string
  special: string
}
