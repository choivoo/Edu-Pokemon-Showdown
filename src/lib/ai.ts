import type { Difficulty, Move, PokemonType, Rng } from '../types'
import { typeMultiplier } from './typeChart'

/** AI가 해당 난이도 기술을 "성공시킬" 확률 (AI도 문제를 푼다고 가정) */
export const AI_SUCCESS: Record<Difficulty, number> = { easy: 0.92, normal: 0.75, hard: 0.55 }

/** 기대 피해(위력 x 상성 x 성공률)가 큰 기술을 고르되 약간의 무작위성을 둔다. */
export function chooseAiMove(moves: Move[], defenderTypes: PokemonType[], rng: Rng = Math.random): Move {
  const scored = moves.map(m => ({
    m,
    score: m.power * typeMultiplier(m.type, defenderTypes) * AI_SUCCESS[m.difficulty] * (0.8 + rng() * 0.4),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0].m
}

export function aiSucceeds(difficulty: Difficulty, rng: Rng = Math.random): boolean {
  return rng() < AI_SUCCESS[difficulty]
}
