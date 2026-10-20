import type { IngredientId } from './cooking'
import type { OwnedMon, Stone } from './stats'

export interface SaveData {
  version: 1
  started: boolean
  name: string
  coins: number
  ingredients: Record<IngredientId, number>
  stones: Stone[]
  owned: OwnedMon[]
  party: string[]
  cleared: Record<string, true>
  seenStory: string[]
  dex: number[]
  endlessBest: number
  uid: number
  muted: boolean
}

const KEY = 'pokemon-quest-fan-edition:v1'

export const defaultSave = (): SaveData => ({
  version: 1, started: false, name: '', coins: 100,
  ingredients: { ember: 4, dew: 4, leaf: 4, spark: 4, moon: 4, mushroom: 6 },
  stones: [], owned: [], party: [], cleared: {}, seenStory: [], dex: [], endlessBest: 0, uid: 1, muted: false,
})

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    const d = JSON.parse(raw) as Partial<SaveData>
    const base = defaultSave()
    return { ...base, ...d, ingredients: { ...base.ingredients, ...(d.ingredients ?? {}) }, version: 1 }
  } catch {
    return defaultSave()
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 저장이 막혀 있어도 게임은 계속된다
  }
}

export function resetSave(): void {
  try { localStorage.removeItem(KEY) } catch { /* 무시 */ }
}
