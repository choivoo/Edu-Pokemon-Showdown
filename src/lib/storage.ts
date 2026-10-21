import type { IngredientId } from './cooking'
import type { OwnedMon } from './stats'
import type { Stone } from './stones'
import { type Battery, freshBattery } from './battery'
import type { MoveStone } from './moveStones'
import { rollBonuses, seededRng } from './bingo'

export interface CookingPot {
  species: number
  remaining: number
  total: number
  recipe: number
}

export interface SaveData {
  version: 1
  started: boolean
  name: string
  coins: number
  ingredients: Record<IngredientId, number>
  /** Cooked dishes mature after exploration, not after a 1-second animation. */
  pot: CookingPot | null
  stones: Stone[]
  owned: OwnedMon[]
  party: string[]
  cleared: Record<string, true>
  seenStory: string[]
  dex: number[]
  endlessBest: number
  uid: number
  muted: boolean
  /** 마지막으로 저장 키를 만든 시각(0이면 아직 없음)과 그 뒤의 클리어 횟수 */
  exportedAt: number
  clearsSinceExport: number
  battery: Battery
  moveStones: MoveStone[]
  /** 퀘스트 진행 횟수 */
  counters: Record<string, number>
  /** 보상을 받은 퀘스트 */
  claimed: string[]
  /** 번영의 석상 레벨 */
  statue: number
  /** 굿즈(캠프 분위기): 받은 것과 지금 쓰는 것 */
  themes: string[]
  theme: string
}

const KEY = 'pokemon-quest-fan-edition:v1'

export const defaultSave = (): SaveData => ({
  version: 1, started: false, name: '', coins: 100,
  ingredients: { mushroomRed: 6, berryBlue: 6, nutYellow: 6, fossil: 6, rootRed: 6, rockBlue: 0, honey: 0, mushroomGray: 0, rainbow: 0, shell: 0 },
  pot: null, stones: [], owned: [], party: [], cleared: {}, seenStory: [], dex: [], endlessBest: 0, uid: 1, muted: false, exportedAt: 0, clearsSinceExport: 0,
  battery: freshBattery(Date.now()), moveStones: [],
  counters: {}, claimed: [], statue: 0, themes: ['default'], theme: 'default',
})

/** 옛 저장 데이터에 새로 생긴 항목(빙고 보너스, 기술스톤, 배터리)을 채워 넣는다 */
export function migrate(s: SaveData): SaveData {
  return {
    ...s,
    pot: s.pot ?? null,
    owned: s.owned.map(o => ({ ...o, bonus: o.bonus?.length ? o.bonus : rollBonuses(seededRng(o.id)), mstones: o.mstones ?? [] })),
    moveStones: s.moveStones ?? [],
    battery: s.battery ?? freshBattery(Date.now()),
    counters: s.counters ?? {}, claimed: s.claimed ?? [], statue: s.statue ?? 0, themes: s.themes?.length ? s.themes : ['default'], theme: s.theme ?? 'default',
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    const d = JSON.parse(raw) as Partial<SaveData>
    const base = defaultSave()
    return migrate({ ...base, ...d, ingredients: { ...base.ingredients, ...(d.ingredients ?? {}) }, version: 1 })
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
