import { create } from 'zustand'
import type { Species } from '../types'
import { cook, type IngredientId, getIngredient, DISH_SIZE } from '../lib/cooking'
import { getSpecies, SPECIES } from '../lib/roster'
import { addExp, expToNext, MAX_LEVEL, type OwnedMon } from '../lib/stats'
import { canPlace, findSpot, mergeCost, occupancy, type Stone, type ShapeId, type StoneKind } from '../lib/stones'
import { usedMoveStoneIds, usedStoneIds } from '../lib/party'
import { type MoveStone, MOVE_SLOTS } from '../lib/moveStones'
import { rollBonuses } from '../lib/bingo'
import { BATTERY_MAX, batteryNow, charge, consume } from '../lib/battery'
import { AREAS, rollRewards, type Rewards, type Stage, stageId } from '../lib/stages'
import { defaultSave, loadSave, resetSave, type SaveData, writeSave } from '../lib/storage'
import { setMuted } from '../lib/sound'
import { recall, trainExp, TRAIN_MAX, type RecallResult } from '../lib/training'
import { canEvolve, EVOLUTION_ONLY, targetOf } from '../lib/evolution'
import { QUESTS, isClaimed, isDone, STATUE_MAX, statueCap, statueCost, statueMul } from '../lib/quests'

export const ENCOUNTER_COST = 500
export const BATTERY_ONE_COST = 150
export const BATTERY_FULL_COST = 600

export type Screen = 'title' | 'intro' | 'camp' | 'island' | 'battle' | 'result'
/** 화면 위에 겹쳐 뜨는 창 (원작처럼 한 화면 안에서 열고 닫는다) */
export type Panel = 'team' | 'cook' | 'dex' | 'shop' | 'save' | 'train' | 'quest' | null

export interface BattleResult {
  win: boolean
  stage: Stage
  rewards: Rewards | null
  firstClear: boolean
  recruited: OwnedMon | null
  levelUps: { name: string; from: number; to: number }[]
  stone: Stone | null
  moveStone: MoveStone | null
  /** 보스 첫 클리어 시 보여줄 후일담 지역 */
  outroArea: number | null
}

interface GameState {
  screen: Screen
  panel: Panel
  save: SaveData
  stage: Stage | null
  result: BattleResult | null
  go: (s: Screen) => void
  openPanel: (p: Panel) => void
  importSave: (save: SaveData) => void
  markExported: () => void
  newGame: (name: string, starter: number) => void
  hardReset: () => void
  toggleMute: () => void
  markStory: (key: string) => void
  cookDish: (sel: IngredientId[]) => OwnedMon | null
  setParty: (ids: string[]) => void
  placeStone: (monId: string, stoneId: string, x: number, y: number, rot: number) => boolean
  autoPlaceStone: (monId: string, stoneId: string) => boolean
  removeStone: (monId: string, stoneId: string) => void
  mergeStones: (kind: StoneKind, shape: ShapeId, star: 1 | 2) => boolean
  buyIngredient: (id: IngredientId, qty: number) => boolean
  levelUpCost: (monId: string) => number
  levelUpWithCoins: (monId: string) => boolean
  release: (monId: string) => boolean
  /** 배터리를 1개 쓰고 탐험을 시작한다. 배터리가 없으면 false */
  startStage: (stage: Stage) => boolean
  buyBattery: (full: boolean) => boolean
  equipMoveStone: (monId: string, stoneId: string) => boolean
  unequipMoveStone: (monId: string, stoneId: string) => void
  finishBattle: (win: boolean, stage: Stage, kills?: number) => void
  /** 특훈: 경험치(exp) 또는 기술 떠올리기(move). 재료로 쓴 포켓몬은 사라진다 */
  train: (targetId: string, foodIds: string[], mode: 'exp' | 'move') => { ok: boolean; exp?: number; recall?: RecallResult } | null
  evolve: (monId: string, choice?: string) => number | null
  upgradeStatue: () => boolean
  claimQuest: (id: string) => boolean
  setTheme: (id: string) => void
  toggleKeep: (monId: string) => void
  /** 기이한만남의섬: 코인 500 또는 선물 티켓 1장으로 낯선 포켓몬과 만난다 */
  encounter: (useTicket: boolean) => OwnedMon | null
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
  const bump = (c: Record<string, number>, key: string, n = 1) => ({ ...c, [key]: (c[key] ?? 0) + n })
  const newMon = (save: SaveData, speciesId: number, level: number): { mon: OwnedMon; patch: Partial<SaveData> } => {
    const mon: OwnedMon = { id: `m${save.uid}`, species: speciesId, level, exp: 0, stones: [], bonus: rollBonuses(), mstones: [] }
    return {
      mon,
      patch: { owned: [...save.owned, mon], uid: save.uid + 1, dex: save.dex.includes(speciesId) ? save.dex : [...save.dex, speciesId] },
    }
  }

  const initial = loadSave()
  setMuted(initial.muted)

  return {
    screen: 'title',
    panel: null,
    save: initial,
    stage: null,
    result: null,

    go: screen => set({ screen }),
    openPanel: panel => set({ panel }),
    importSave: save => {
      writeSave(save)
      setMuted(save.muted)
      set({ save, panel: null, screen: 'camp' })
    },
    markExported: () => commit({ exportedAt: Date.now(), clearsSinceExport: 0 }),

    newGame: (name, starter) => {
      const base = defaultSave()
      // 미라 박사가 함께 챙겨 준 두 친구와 3마리 파티로 시작
      const first = newMon(base, starter, 5)
      const second = newMon({ ...base, ...first.patch }, 16, 5)
      const third = newMon({ ...base, ...first.patch, ...second.patch }, 19, 5)
      const save: SaveData = { ...base, ...third.patch, name, started: true, party: [first.mon.id, second.mon.id, third.mon.id], muted: get().save.muted }
      writeSave(save)
      set({ save, panel: null, screen: 'camp' })
    },
    hardReset: () => {
      resetSave()
      set({ save: { ...defaultSave(), muted: get().save.muted }, screen: 'title', panel: null, stage: null, result: null })
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
      commit({ ...patch, ingredients, counters: bump(s.counters, 'cooked') })
      return mon
    },

    setParty: ids => commit({ party: ids.slice(0, 3) }),

    placeStone: (monId, stoneId, x, y, rot) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      const stone = s.stones.find(t => t.id === stoneId)
      if (!mon || !stone || usedStoneIds(s).has(stoneId)) return false
      if (!canPlace(mon.level, occupancy(mon.stones, s.stones), stone.shape, rot, x, y)) return false
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, stones: [...o.stones, { stone: stoneId, x, y, rot }] } : o)) })
      return true
    },
    autoPlaceStone: (monId, stoneId) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      const stone = s.stones.find(t => t.id === stoneId)
      if (!mon || !stone) return false
      const spot = findSpot(mon.level, occupancy(mon.stones, s.stones), stone.shape)
      return spot ? get().placeStone(monId, stoneId, spot.x, spot.y, spot.rot) : false
    },
    removeStone: (monId, stoneId) => {
      const s = get().save
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, stones: o.stones.filter(p => p.stone !== stoneId) } : o)) })
    },

    mergeStones: (kind, shape, star) => {
      const s = get().save
      const used = usedStoneIds(s)
      const same = s.stones.filter(x => x.kind === kind && x.shape === shape && x.star === star && !used.has(x.id))
      const cost = mergeCost({ star, shape })
      if (same.length < 2 || s.coins < cost) return false
      const [a, b] = same
      const merged: Stone = { id: `s${s.uid}`, kind, shape, star: (star + 1) as 2 | 3 }
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

    startStage: stage => {
      const s = get().save
      const next = consume(s.battery, Date.now())
      if (!next) return false
      commit({ battery: next })
      set({ stage, result: null, screen: 'battle' })
      return true
    },

    buyBattery: full => {
      const s = get().save
      const now = Date.now()
      const have = batteryNow(s.battery, now).n
      const cost = full ? BATTERY_FULL_COST : BATTERY_ONE_COST
      if (s.coins < cost || have >= BATTERY_MAX) return false
      commit({ coins: s.coins - cost, battery: charge(s.battery, now, full ? BATTERY_MAX : 1) })
      return true
    },

    equipMoveStone: (monId, stoneId) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      if (!mon || mon.mstones.length >= MOVE_SLOTS || usedMoveStoneIds(s).has(stoneId) || !s.moveStones.some(m => m.id === stoneId)) return false
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, mstones: [...o.mstones, stoneId] } : o)) })
      return true
    },
    unequipMoveStone: (monId, stoneId) => {
      const s = get().save
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, mstones: o.mstones.filter(x => x !== stoneId) } : o)) })
    },

    train: (targetId, foodIds, mode) => {
      const s = get().save
      const target = s.owned.find(o => o.id === targetId)
      const foods = [...new Set(foodIds)].map(id => s.owned.find(o => o.id === id)).filter((o): o is OwnedMon => !!o && o.id !== targetId && !s.party.includes(o.id))
      if (!target || !foods.length || foods.length > TRAIN_MAX) return null
      const gone = new Set(foods.map(f => f.id))
      const rest = s.owned.filter(o => !gone.has(o.id))
      const counters = bump(s.counters, 'trained')
      if (mode === 'exp') {
        const exp = trainExp(target, foods)
        const { mon } = addExp(target, exp)
        commit({ owned: rest.map(o => (o.id === targetId ? mon : o)), counters })
        return { ok: true, exp }
      }
      const r = recall(target, foods, Date.now(), Math.random)
      commit({ owned: rest.map(o => (o.id === targetId ? r.mon : o)), counters: r.ok ? bump(counters, 'recalled') : counters })
      return { ok: r.ok, recall: r }
    },

    evolve: (monId, choice) => {
      const s = get().save
      const m = s.owned.find(o => o.id === monId)
      if (!m || !canEvolve(m)) return null
      const to = targetOf(m.species, choice)
      if (!to) return null
      // 새 종은 기본 필살기로 돌아간다 (떠올린 기술은 유지)
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, species: to } : o)), dex: s.dex.includes(to) ? s.dex : [...s.dex, to], counters: bump(s.counters, 'evolved') })
      return to
    },

    upgradeStatue: () => {
      const s = get().save
      const cost = statueCost(s.statue)
      if (s.statue >= STATUE_MAX || s.coins < cost) return false
      commit({ coins: s.coins - cost, statue: s.statue + 1 })
      return true
    },

    claimQuest: id => {
      const s = get().save
      const q = QUESTS.find(x => x.id === id)
      if (!q || !isDone(s, q) || isClaimed(s, q)) return false
      const ingredients = { ...s.ingredients }
      if (q.reward.shell) ingredients.shell += q.reward.shell
      if (q.reward.rainbow) ingredients.rainbow += q.reward.rainbow
      const themes = q.reward.theme && !s.themes.includes(q.reward.theme) ? [...s.themes, q.reward.theme] : s.themes
      commit({ claimed: [...s.claimed, id], coins: s.coins + (q.reward.coins ?? 0), ingredients, themes, tickets: s.tickets + (q.reward.ticket ?? 0) })
      return true
    },

    toggleKeep: monId => {
      const s = get().save
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, keep: !o.keep } : o)) })
    },

    encounter: useTicket => {
      const s = get().save
      if (useTicket ? s.tickets < 1 : s.coins < ENCOUNTER_COST) return null
      const r = Math.random()
      const pool = SPECIES.filter(x => !EVOLUTION_ONLY.has(x.id))
      const legend = [144, 145, 146, 142, 151]
      let id: number
      if (r < 0.06) id = legend[Math.floor(Math.random() * legend.length)]
      else {
        const rar = r < 0.5 ? 1 : r < 0.85 ? 2 : 3
        const c = pool.filter(x => x.rarity === rar)
        id = c[Math.floor(Math.random() * c.length)].id
      }
      const { mon, patch } = newMon(s, id, newcomerLevel(s, 8))
      commit({ ...patch, ...(useTicket ? { tickets: s.tickets - 1 } : { coins: s.coins - ENCOUNTER_COST }) })
      return mon
    },

    setTheme: id => {
      const s = get().save
      if (s.themes.includes(id)) commit({ theme: id })
    },

    finishBattle: (win, stage, kills = 0) => {
      const s = get().save
      if (!win) {
        set({ result: { win: false, stage, rewards: null, firstClear: false, recruited: null, levelUps: [], stone: null, moveStone: null, outroArea: null }, screen: 'result' })
        return
      }
      const rewards = rollRewards(stage)
      const firstClear = stage.area >= 0 ? !s.cleared[stage.id] : stage.endlessFloor! > s.endlessBest
      // 파티 전원에게 경험치
      const levelUps: BattleResult['levelUps'] = []
      let owned = s.owned.map(o => {
        if (!s.party.includes(o.id)) return o
        // 번영의 석상: 아직 레벨이 낮은 포켓몬은 경험치를 더 받는다
        const mul = o.level < statueCap(s.statue) ? statueMul(s.statue) : 1
        const r = addExp(o, Math.round(rewards.exp * mul))
        if (r.gained > 0) levelUps.push({ name: getSpecies(o.species).name, from: o.level, to: r.mon.level })
        return r.mon
      })
      const ingredients = { ...s.ingredients }
      for (const [id, n] of Object.entries(rewards.ingredients) as [IngredientId, number][]) ingredients[id] += n
      let uid = s.uid
      let stones = s.stones
      let stone: Stone | null = null
      if (rewards.stone) { stone = { ...rewards.stone, id: `s${uid++}` }; stones = [...stones, stone] }
      let moveStone: MoveStone | null = null
      let moveStones = s.moveStones
      if (rewards.moveStone) { moveStone = { id: `t${uid++}`, kind: rewards.moveStone }; moveStones = [...moveStones, moveStone] }
      let cleared = s.cleared
      let endlessBest = s.endlessBest
      if (stage.area >= 0) cleared = { ...cleared, [stage.id]: true }
      else endlessBest = Math.max(endlessBest, stage.endlessFloor!)

      let recruited: OwnedMon | null = null
      let dex = s.dex
      if (firstClear && stage.recruit) {
        recruited = { id: `m${uid++}`, species: stage.recruit, level: Math.max(newcomerLevel(s), stage.level - 3), exp: 0, stones: [], bonus: rollBonuses(), mstones: [] }
        owned = [...owned, recruited]
        if (!dex.includes(stage.recruit)) dex = [...dex, stage.recruit]
      }
      commit({ coins: s.coins + rewards.coins, ingredients, owned, stones, moveStones, cleared, endlessBest, uid, dex, clearsSinceExport: s.clearsSinceExport + 1, counters: bump(bump(bump(s.counters, 'clears'), 'kills', kills), 'bosses', stage.boss ? 1 : 0) })
      set({
        result: { win: true, stage, rewards, firstClear, recruited, levelUps, stone, moveStone, outroArea: firstClear && stage.boss && stage.area >= 0 ? stage.area : null },
        screen: 'result',
      })
    },
  }
})
