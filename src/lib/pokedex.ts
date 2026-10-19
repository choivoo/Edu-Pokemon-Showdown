import type { Move, PokemonData } from '../types'
import pokemonJson from '../data/pokemon.json'
import movesJson from '../data/moves.json'
import { calcMaxHp, calcStat } from './damage'

export const POKEMON = pokemonJson as PokemonData[]
const MOVES = movesJson as Move[]
const moveMap = new Map(MOVES.map(m => [m.id, m]))

export const getMove = (id: string): Move => {
  const m = moveMap.get(id)
  if (!m) throw new Error(`unknown move: ${id}`)
  return m
}
export const getPokemon = (id: number): PokemonData => {
  const p = POKEMON.find(p => p.id === id)
  if (!p) throw new Error(`unknown pokemon: ${id}`)
  return p
}

export interface BattleMon {
  id: number
  name: string
  types: PokemonData['types']
  level: number
  maxHp: number
  hp: number
  atk: number
  def: number
  spe: number
  moves: Move[]
}

export function createBattleMon(id: number, level = 50): BattleMon {
  const p = getPokemon(id)
  const maxHp = calcMaxHp(p.stats.hp, level)
  return {
    id: p.id, name: p.name, types: p.types, level, maxHp, hp: maxHp,
    atk: calcStat(p.stats.atk, level), def: calcStat(p.stats.def, level), spe: calcStat(p.stats.spe, level),
    moves: p.moves.map(getMove),
  }
}
