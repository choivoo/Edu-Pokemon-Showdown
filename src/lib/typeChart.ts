import type { PokemonType } from '../types'

export const TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

export const TYPE_LABEL: Record<PokemonType, string> = {
  normal: '노말', fire: '불꽃', water: '물', electric: '전기', grass: '풀', ice: '얼음',
  fighting: '격투', poison: '독', ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
  rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악', steel: '강철', fairy: '페어리',
}

export const TYPE_COLOR: Record<PokemonType, string> = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030', grass: '#78c850',
  ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0', ground: '#e0c068', flying: '#a890f0',
  psychic: '#f85888', bug: '#a8b820', rock: '#b8a038', ghost: '#705898', dragon: '#7038f8',
  dark: '#705848', steel: '#b8b8d0', fairy: '#ee99ac',
}

interface Row { s?: PokemonType[]; r?: PokemonType[]; i?: PokemonType[] }

/** 공격 타입별: s=굉장(2배), r=별로(0.5배), i=효과 없음(0배). 나머지는 1배 */
const CHART: Record<PokemonType, Row> = {
  normal: { r: ['rock', 'steel'], i: ['ghost'] },
  fire: { s: ['grass', 'ice', 'bug', 'steel'], r: ['fire', 'water', 'rock', 'dragon'] },
  water: { s: ['fire', 'ground', 'rock'], r: ['water', 'grass', 'dragon'] },
  electric: { s: ['water', 'flying'], r: ['electric', 'grass', 'dragon'], i: ['ground'] },
  grass: { s: ['water', 'ground', 'rock'], r: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { s: ['grass', 'ground', 'flying', 'dragon'], r: ['fire', 'water', 'ice', 'steel'] },
  fighting: { s: ['normal', 'ice', 'rock', 'dark', 'steel'], r: ['poison', 'flying', 'psychic', 'bug', 'fairy'], i: ['ghost'] },
  poison: { s: ['grass', 'fairy'], r: ['poison', 'ground', 'rock', 'ghost'], i: ['steel'] },
  ground: { s: ['fire', 'electric', 'poison', 'rock', 'steel'], r: ['grass', 'bug'], i: ['flying'] },
  flying: { s: ['grass', 'fighting', 'bug'], r: ['electric', 'rock', 'steel'] },
  psychic: { s: ['fighting', 'poison'], r: ['psychic', 'steel'], i: ['dark'] },
  bug: { s: ['grass', 'psychic', 'dark'], r: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { s: ['fire', 'ice', 'flying', 'bug'], r: ['fighting', 'ground', 'steel'] },
  ghost: { s: ['psychic', 'ghost'], r: ['dark'], i: ['normal'] },
  dragon: { s: ['dragon'], r: ['steel'], i: ['fairy'] },
  dark: { s: ['psychic', 'ghost'], r: ['fighting', 'dark', 'fairy'] },
  steel: { s: ['ice', 'rock', 'fairy'], r: ['fire', 'water', 'electric', 'steel'] },
  fairy: { s: ['fighting', 'dragon', 'dark'], r: ['fire', 'poison', 'steel'] },
}

export function typeMultiplier(attack: PokemonType, defender: PokemonType[]): number {
  const row = CHART[attack]
  let m = 1
  for (const d of defender) {
    if (row.i?.includes(d)) return 0
    if (row.s?.includes(d)) m *= 2
    else if (row.r?.includes(d)) m *= 0.5
  }
  return m
}

export function effectivenessMessage(mult: number): string | null {
  if (mult === 0) return '효과가 없는 것 같다...'
  if (mult > 1) return '효과가 굉장했다!'
  if (mult < 1) return '효과가 별로인 듯하다...'
  return null
}
