import type { Move, Species } from '../types'
import speciesJson from '../data/pokemon.json'
import movesJson from '../data/moves.json'
import { SUPPORT_MOVES } from './moveSet'
import { QUEST_MOVES } from '../data/questMoves'

export const SPECIES = speciesJson as Species[]
export const MOVES = [...(movesJson as Move[]), ...SUPPORT_MOVES, ...QUEST_MOVES]
const speciesMap = new Map(SPECIES.map(s => [s.id, s]))
const moveMap = new Map(MOVES.map(m => [m.id, m]))

export const getSpecies = (id: number): Species => {
  const s = speciesMap.get(id)
  if (!s) throw new Error(`unknown species: ${id}`)
  return s
}
export const getMove = (id: string): Move => {
  const m = moveMap.get(id)
  if (!m) throw new Error(`unknown move: ${id}`)
  return m
}
