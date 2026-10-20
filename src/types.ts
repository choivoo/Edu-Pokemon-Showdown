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
