import type { Move, PokemonData } from '../types'
import pokemonJson from '../data/pokemon.json'
import movesJson from '../data/moves.json'
import { calcMaxHp, calcStat } from './damage'
import type { Status } from './status'

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
  status: Status | null
}

/** bonus: 트레이너 레벨에 따른 스탯 배율 (기본 1) */
export function createBattleMon(id: number, level = 50, bonus = 1): BattleMon {
  const p = getPokemon(id)
  const maxHp = Math.floor(calcMaxHp(p.stats.hp, level) * bonus)
  const st = (v: number) => Math.floor(calcStat(v, level) * bonus)
  return {
    id: p.id, name: p.name, types: p.types, level, maxHp, hp: maxHp,
    atk: st(p.stats.atk), def: st(p.stats.def), spe: st(p.stats.spe),
    moves: p.moves.map(getMove), status: null,
  }
}
