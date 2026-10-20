import { create } from 'zustand'
import type { Species } from '../types'
import { cook, type IngredientId, getIngredient, DISH_SIZE } from '../lib/cooking'
import { getSpecies } from '../lib/roster'
import { addExp, expToNext, MAX_LEVEL, mergeCost, type OwnedMon, type Stone, STONE_SLOTS } from '../lib/stats'
import { AREAS, rollRewards, type Rewards, type Stage, stageId } from '../lib/stages'
import { defaultSave, loadSave, resetSave, type SaveData, writeSave } from '../lib/storage'
import { setMuted } from '../lib/sound'

export type Screen = 'title' | 'intro' | 'home' | 'battle' | 'result'
export type Tab = 'map' | 'camp' | 'team' | 'shop' | 'dex'

export interface BattleResult {
  win: boolean
  stage: Stage
  rewards: Rewards | null
  firstClear: boolean
  recruited: OwnedMon | null
  levelUps: { name: string; from: number; to: number }[]
  stone: Stone | null
  /** 보스 첫 클리어 시 보여줄 후일담 지역 */
  outroArea: number | null
}

interface GameState {
  screen: Screen
  tab: Tab
  save: SaveData
  stage: Stage | null
  result: BattleResult | null
  go: (s: Screen) => void
  setTab: (t: Tab) => void
  newGame: (name: string, starter: number) => void
  hardReset: () => void
  toggleMute: () => void
  markStory: (key: string) => void
  cookDish: (sel: IngredientId[]) => OwnedMon | null
  setParty: (ids: string[]) => void
  equipStone: (monId: string, slot: number, stoneId: string | null) => void
  mergeStones: (kind: Stone['kind'], star: 1 | 2) => boolean
  buyIngredient: (id: IngredientId, qty: number) => boolean
  levelUpCost: (monId: string) => number
  levelUpWithCoins: (monId: string) => boolean
  release: (monId: string) => boolean
  startStage: (stage: Stage) => void
  finishBattle: (win: boolean, stage: Stage) => void
}

/** 새로 합류하는 포켓몬의 레벨: 파티 평균보다 살짝 낮게 */
export function newcomerLevel(save: SaveData, floor = 5): number {
  const lv = save.party.map(id => save.owned.find(o => o.id === id)?.level ?? 0).filter(Boolean)
  const avg = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : floor
  return Math.max(floor, Math.round(avg) - 2)
}

export const isCleared = (save: SaveData, area: number, index: number) => !!save.cleared[stageId(area, index)]
export const areaCleared = (save: SaveData, area: number) => isCleared(save, area, 4)
export const areaUnlocked = (save: SaveData, area: number) => area === 0 || areaCleared(save, area - 1)
export const allCleared = (save: SaveData) => areaCleared(save, AREAS.length - 1)
/** 되찾은 프리즘 조각 수 (보스 6명 처치 = 6/6) */
export const shardCount = (save: SaveData) => AREAS.filter((_, i) => areaCleared(save, i)).length

export const useGame = create<GameState>((set, get) => {
  const commit = (patch: Partial<SaveData>) => {
    const save = { ...get().save, ...patch }
    writeSave(save)
    set({ save })
    return save
  }
  const newMon = (save: SaveData, speciesId: number, level: number): { mon: OwnedMon; patch: Partial<SaveData> } => {
    const mon: OwnedMon = { id: `m${save.uid}`, species: speciesId, level, exp: 0, stones: Array(STONE_SLOTS).fill(null) }
    return {
      mon,
      patch: { owned: [...save.owned, mon], uid: save.uid + 1, dex: save.dex.includes(speciesId) ? save.dex : [...save.dex, speciesId] },
    }
  }

  const initial = loadSave()
  setMuted(initial.muted)

  return {
    screen: 'title',
    tab: 'map',
    save: initial,
    stage: null,
    result: null,

    go: screen => set({ screen }),
    setTab: tab => set({ tab }),

    newGame: (name, starter) => {
      const base = defaultSave()
      // 미라 박사가 함께 챙겨 준 두 친구와 3마리 파티로 시작
      const first = newMon(base, starter, 5)
      const second = newMon({ ...base, ...first.patch }, 16, 5)
      const third = newMon({ ...base, ...first.patch, ...second.patch }, 19, 5)
      const save: SaveData = { ...base, ...third.patch, name, started: true, party: [first.mon.id, second.mon.id, third.mon.id], muted: get().save.muted }
      writeSave(save)
      set({ save, tab: 'map', screen: 'home' })
    },
    hardReset: () => {
      resetSave()
      set({ save: { ...defaultSave(), muted: get().save.muted }, screen: 'title', tab: 'map', stage: null, result: null })
    },
    toggleMute: () => {
      const muted = !get().save.muted
      setMuted(muted)
      commit({ muted })
    },
    markStory: key => {
      const s = get().save
      if (!s.seenStory.includes(key)) commit({ seenStory: [...s.seenStory, key] })
    },

    cookDish: sel => {
      const s = get().save
      if (sel.length !== DISH_SIZE) return null
      const need: Partial<Record<IngredientId, number>> = {}
      for (const id of sel) need[id] = (need[id] ?? 0) + 1
      for (const [id, n] of Object.entries(need) as [IngredientId, number][]) if ((s.ingredients[id] ?? 0) < n) return null
      const ingredients = { ...s.ingredients }
      for (const [id, n] of Object.entries(need) as [IngredientId, number][]) ingredients[id] -= n
      const sp: Species = cook(sel)
      const { mon, patch } = newMon({ ...s, ingredients }, sp.id, newcomerLevel(s))
      commit({ ...patch, ingredients })
      return mon
    },

    setParty: ids => commit({ party: ids.slice(0, 3) }),

    equipStone: (monId, slot, stoneId) => {
      const s = get().save
      const owned = s.owned.map(o => {
        if (o.id === monId) {
          const stones = [...o.stones]
          stones[slot] = stoneId
          return { ...o, stones }
        }
        // 다른 포켓몬이 끼고 있던 같은 스톤은 빼앗아 온다
        return stoneId && o.stones.includes(stoneId) ? { ...o, stones: o.stones.map(x => (x === stoneId ? null : x)) } : o
      })
      commit({ owned })
    },

    mergeStones: (kind, star) => {
      const s = get().save
      const equipped = new Set(s.owned.flatMap(o => o.stones))
      const same = s.stones.filter(x => x.kind === kind && x.star === star && !equipped.has(x.id))
      const cost = mergeCost(star)
      if (same.length < 2 || s.coins < cost) return false
      const [a, b] = same
      const merged: Stone = { id: `s${s.uid}`, kind, star: (star + 1) as 2 | 3 }
      commit({ stones: [...s.stones.filter(x => x.id !== a.id && x.id !== b.id), merged], coins: s.coins - cost, uid: s.uid + 1 })
      return true
    },

    buyIngredient: (id, qty) => {
      const s = get().save
      const cost = getIngredient(id).price * qty
      if (s.coins < cost) return false
      commit({ coins: s.coins - cost, ingredients: { ...s.ingredients, [id]: s.ingredients[id] + qty } })
      return true
    },

    levelUpCost: monId => {
      const m = get().save.owned.find(o => o.id === monId)
      return m && m.level < MAX_LEVEL ? Math.max(20, Math.ceil((expToNext(m.level) - m.exp) * 0.6)) : 0
    },
    levelUpWithCoins: monId => {
      const s = get().save
      const cost = get().levelUpCost(monId)
      const m = s.owned.find(o => o.id === monId)
      if (!m || cost === 0 || s.coins < cost) return false
      const { mon } = addExp(m, expToNext(m.level) - m.exp)
      commit({ coins: s.coins - cost, owned: s.owned.map(o => (o.id === monId ? mon : o)) })
      return true
    },

    release: monId => {
      const s = get().save
      const m = s.owned.find(o => o.id === monId)
      if (!m || s.owned.length <= 1 || s.party.includes(monId)) return false
      const sp = getSpecies(m.species)
      commit({ owned: s.owned.filter(o => o.id !== monId), coins: s.coins + sp.rarity * 30 + m.level * 5 })
      return true
    },

    startStage: stage => set({ stage, result: null, screen: 'battle' }),

    finishBattle: (win, stage) => {
      const s = get().save
      if (!win) {
        set({ result: { win: false, stage, rewards: null, firstClear: false, recruited: null, levelUps: [], stone: null, outroArea: null }, screen: 'result' })
        return
      }
      const rewards = rollRewards(stage)
      const firstClear = stage.area >= 0 ? !s.cleared[stage.id] : stage.endlessFloor! > s.endlessBest
      // 파티 전원에게 경험치
      const levelUps: BattleResult['levelUps'] = []
      let owned = s.owned.map(o => {
        if (!s.party.includes(o.id)) return o
        const r = addExp(o, rewards.exp)
        if (r.gained > 0) levelUps.push({ name: getSpecies(o.species).name, from: o.level, to: r.mon.level })
        return r.mon
      })
      const ingredients = { ...s.ingredients }
      for (const [id, n] of Object.entries(rewards.ingredients) as [IngredientId, number][]) ingredients[id] += n
      let uid = s.uid
      let stones = s.stones
      let stone: Stone | null = null
      if (rewards.stone) { stone = { ...rewards.stone, id: `s${uid++}` }; stones = [...stones, stone] }
      let cleared = s.cleared
      let endlessBest = s.endlessBest
      if (stage.area >= 0) cleared = { ...cleared, [stage.id]: true }
      else endlessBest = Math.max(endlessBest, stage.endlessFloor!)

      let recruited: OwnedMon | null = null
      let dex = s.dex
      if (firstClear && stage.recruit) {
        recruited = { id: `m${uid++}`, species: stage.recruit, level: Math.max(newcomerLevel(s), stage.level - 3), exp: 0, stones: Array(STONE_SLOTS).fill(null) }
        owned = [...owned, recruited]
        if (!dex.includes(stage.recruit)) dex = [...dex, stage.recruit]
      }
      commit({ coins: s.coins + rewards.coins, ingredients, owned, stones, cleared, endlessBest, uid, dex })
      set({
        result: { win: true, stage, rewards, firstClear, recruited, levelUps, stone, outroArea: firstClear && stage.boss && stage.area >= 0 ? stage.area : null },
        screen: 'result',
      })
    },
  }
})
