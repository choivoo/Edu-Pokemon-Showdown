import type { PokemonType, Rng, Species } from '../types'
import { SPECIES } from './roster'

export type IngredientId = 'ember' | 'dew' | 'leaf' | 'spark' | 'moon' | 'mushroom'

export interface Ingredient { id: IngredientId; name: string; emoji: string; types: PokemonType[]; price: number }

export const INGREDIENTS: Ingredient[] = [
  { id: 'ember', name: '불씨열매', emoji: '🔥', types: ['fire', 'fighting', 'dragon'], price: 18 },
  { id: 'dew', name: '이슬방울', emoji: '💧', types: ['water', 'ice', 'flying'], price: 18 },
  { id: 'leaf', name: '초록잎', emoji: '🍃', types: ['grass', 'bug', 'poison'], price: 18 },
  { id: 'spark', name: '번개조각', emoji: '⚡', types: ['electric', 'steel', 'psychic'], price: 22 },
  { id: 'moon', name: '달빛가루', emoji: '🌙', types: ['ghost', 'dark', 'fairy'], price: 22 },
  { id: 'mushroom', name: '흙버섯', emoji: '🍄', types: ['normal', 'ground', 'rock'], price: 14 },
]
export const getIngredient = (id: IngredientId) => INGREDIENTS.find(i => i.id === id)!

export const DISH_SIZE = 3

export type DishKind = 'special' | 'good' | 'plain'

/** 같은 재료 3개 = 특선, 2개 = 좋은 요리, 모두 다르면 평범한 요리 */
export function dishKind(sel: IngredientId[]): DishKind {
  const distinct = new Set(sel).size
  return distinct === 1 ? 'special' : distinct === 2 ? 'good' : 'plain'
}
export const DISH_LABEL: Record<DishKind, string> = { special: '특선 요리', good: '좋은 요리', plain: '평범한 요리' }

/** 희귀도 1~3의 가중치 (4는 요리로 나오지 않는다) */
export const RARITY_WEIGHTS: Record<DishKind, [number, number, number]> = {
  special: [40, 40, 20],
  good: [60, 32, 8],
  plain: [80, 18, 2],
}

/** 가장 많이 쓴 재료가 끌어들일 타입을 정한다. 동률이면 무작위 */
export function dominantIngredient(sel: IngredientId[], rng: Rng): IngredientId {
  const count = new Map<IngredientId, number>()
  for (const s of sel) count.set(s, (count.get(s) ?? 0) + 1)
  const max = Math.max(...count.values())
  const top = [...count.entries()].filter(([, n]) => n === max).map(([id]) => id)
  return top[Math.floor(rng() * top.length)]
}

export function attractPool(ing: IngredientId): Species[] {
  const types = getIngredient(ing).types
  return SPECIES.filter(s => s.rarity <= 3 && s.types.some(t => types.includes(t)))
}

/** 요리를 해서 찾아오는 포켓몬을 뽑는다 */
export function cook(sel: IngredientId[], rng: Rng = Math.random): Species {
  const dom = dominantIngredient(sel, rng)
  const pool = attractPool(dom)
  const w = RARITY_WEIGHTS[dishKind(sel)]
  // 풀에 존재하는 희귀도만으로 가중치를 다시 계산
  const avail = ([1, 2, 3] as const).filter(r => pool.some(s => s.rarity === r))
  const total = avail.reduce((a, r) => a + w[r - 1], 0)
  let roll = rng() * total
  let pick = avail[avail.length - 1]
  for (const r of avail) {
    roll -= w[r - 1]
    if (roll < 0) { pick = r; break }
  }
  const cands = pool.filter(s => s.rarity === pick)
  return cands[Math.floor(rng() * cands.length)]
}
