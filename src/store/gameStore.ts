import { create } from 'zustand'
import { cook, cookingExpeditions, COOKING_TIERS, recipeFor, type CookingTier, type IngredientId, getIngredient, DISH_SIZE } from '../lib/cooking'
import { getSpecies, getMove } from '../lib/roster'
import { questLearnset } from '../data/questSpecies'
import { ensureDualMoves } from '../lib/dualMoves'
import { rollQuestBingo } from '../lib/questBingo'
import { acceptsSocket, socketLayout } from '../lib/pCharm'
import { addExp, expToNext, MAX_LEVEL, type OwnedMon } from '../lib/stats'
import { canPlace, mergeCost, occupancy, type Stone, type ShapeId, type StoneKind } from '../lib/stones'
import { usedMoveStoneIds, usedStoneIds } from '../lib/party'
import { type MoveStone, MOVE_SLOTS } from '../lib/moveStones'
import { rollBonuses } from '../lib/bingo'
import { BATTERY_MAX, batteryNow, charge, consume } from '../lib/battery'
import { AREAS, rollRewards, stageCount, type Rewards, type Stage, stageId } from '../lib/stages'
import { ORIGINAL_FIRST, ORIGINAL_LAST, ORIGINAL_BOSS_AREA, ORIGINAL_STATUE_COUNT, HAPPENSTANCE_AREA, originalUnlocked } from '../lib/originalCampaign'
import { defaultSave, loadSave, resetSave, type SaveData, writeSave } from '../lib/storage'
import { setMuted } from '../lib/sound'
import { recall, recallPool, trainExp, TRAIN_MAX, type RecallResult } from '../lib/training'
import { autoEvolve, canEvolve, targetOf } from '../lib/evolution'
import { MEMBER_REWARD_TICKETS, memberRewardReady, buyableDecoration, ingredientBonus, maxBatteryBonus, moveSuccessBonus, recycledIngredientBonus, trainingExpBonus, multipleCookingBonus } from '../lib/decorations'
import { QUESTS, isClaimed, isDone, STATUE_MAX, statueCap, statueCost, statueMul } from '../lib/quests'
import { TUTORIAL_ACTIVE, TUTORIAL_FINISHED, tutorialPhase, canTutorialExplore } from '../lib/tutorial'
import { getStage } from '../lib/stages'

export const BATTERY_ONE_COST = 150
export const BATTERY_FULL_COST = 600

export type Screen = 'title' | 'intro' | 'camp' | 'island' | 'battle' | 'result'
/** 화면 위에 겹쳐 뜨는 창 (원작처럼 한 화면 안에서 열고 닫는다) */
export type Panel = 'team' | 'cook' | 'dex' | 'shop' | 'save' | 'train' | 'quest' | 'story' | null

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
  startCooking: (sel: IngredientId[], tier?: CookingTier) => boolean
  collectCooked: () => OwnedMon | null
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
  equipMoveStone: (monId: string, stoneId: string, slot?: 0 | 1) => boolean
  unequipMoveStone: (monId: string, stoneId: string) => void
  finishBattle: (win: boolean, stage: Stage, kills?: number) => void
  /** 특훈: 경험치(exp) 또는 기술 떠올리기(move). 재료로 쓴 포켓몬은 사라진다 */
  train: (targetId: string, foodIds: string[], mode: 'exp' | 'move', moveSlot?: 0 | 1) => { ok: boolean; exp?: number; recall?: RecallResult } | null
  evolve: (monId: string, choice?: string) => number | null
  toggleEverstone: (monId: string) => void
  upgradeStatue: () => boolean
  claimMemberTickets: () => number
  buyDecoration: (id: string) => boolean
  recycleStone: (stoneId: string) => boolean
  claimQuest: (id: string) => boolean
  setTheme: (id: string) => void
}

/** 새로 합류하는 포켓몬의 레벨: 파티 평균보다 살짝 낮게 */
export function newcomerLevel(save: SaveData, floor = 5): number {
  const lv = save.party.map(id => save.owned.find(o => o.id === id)?.level ?? 0).filter(Boolean)
  const avg = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : floor
  return Math.max(floor, Math.round(avg) - 2)
}

export const isCleared = (save: SaveData, area: number, index: number) => !!save.cleared[stageId(area, index)]
export const areaCleared = (save: SaveData, area: number) => isCleared(save, area, stageCount(area) - 1)
/** Original campaign first. Fan-created six chapters unlock only after Mewtwo. */
export const legacyFanProgress = (save: SaveData): boolean =>
  Object.keys(save.cleared).some(k => /^a[0-5]-s\d+$/.test(k))
export const areaUnlocked = (save: SaveData, area: number): boolean => {
  if (area === HAPPENSTANCE_AREA) return areaCleared(save, ORIGINAL_BOSS_AREA)
  if (area >= ORIGINAL_FIRST && area <= ORIGINAL_LAST) return originalUnlocked(area, i => areaCleared(save, i))
  // Existing pre-2D-remake saves keep access to their already-played fan route.
  return (areaCleared(save, ORIGINAL_BOSS_AREA) || legacyFanProgress(save)) && (area === 0 || areaCleared(save, area - 1))
}
/** The postgame Happenstance Island is available as soon as the original final boss falls. */
export const allCleared = (save: SaveData) => areaCleared(save, ORIGINAL_BOSS_AREA)
export const originalStatueCount = (save: SaveData) =>
  Array.from({ length: ORIGINAL_STATUE_COUNT }, (_, i) => ORIGINAL_FIRST + i).filter(i => areaCleared(save, i)).length
const ORIGINAL_STATUE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60]
/** Non-stacking 50% experience increase for Pokémon under the last unlocked statue's level. */
export const originalStatueExpCap = (save: SaveData): number =>
  ORIGINAL_STATUE_LEVELS[originalStatueCount(save) - 1] ?? 0
/** Optional fan story has six prism shards after the retail-story ending. */
export const shardCount = (save: SaveData) =>
  AREAS.slice(0, ORIGINAL_FIRST).filter((_, i) => areaCleared(save, i)).length

export const useGame = create<GameState>((set, get) => {
  const commit = (patch: Partial<SaveData>) => {
    const save = { ...get().save, ...patch }
    writeSave(save)
    set({ save })
    return save
  }
  const bump = (c: Record<string, number>, key: string, n = 1) => ({ ...c, [key]: (c[key] ?? 0) + n })
  const newMon = (save: SaveData, speciesId: number, level: number, tier: CookingTier = 0): { mon: OwnedMon; patch: Partial<SaveData> } => {
    const bonuses = [0, 50, 100, 300] as const
    const maxIV = [10, 50, 100, 100] as const
    const mon: OwnedMon = { id: `m${save.uid}`, species: speciesId, level, exp: 0, stones: [],
      bonus: rollBonuses(), bingoChoices: rollQuestBingo(speciesId), mstones: [], potBonus: bonuses[tier], ivHp: Math.floor(Math.random() * (maxIV[tier] + 1)), ivAtk: Math.floor(Math.random() * (maxIV[tier] + 1)), sockets: socketLayout(speciesId, save.uid) }
    const pool = questLearnset(speciesId)
    if (pool.length) {
      const first = pool[Math.floor(Math.random() * pool.length)]
      mon.move = first.id
      const second = pool.filter(m => m.id !== first.id)
      if (second.length) mon.move2 = second[Math.floor(Math.random() * second.length)].id
    } else {
      const options = recallPool(mon)
      if (options.length) mon.move2 = options[Math.floor(Math.random() * options.length)].id
    }
    const ready = ensureDualMoves(mon)
    return {
      mon: ready,
      patch: { owned: [...save.owned, ready], uid: save.uid + 1, dex: save.dex.includes(speciesId) ? save.dex : [...save.dex, speciesId] },
    }
  }

  const stored = loadSave()
  const initial = { ...stored, owned: stored.owned.map(ensureDualMoves) }
  if(initial.owned.some((mon,i)=>mon!==stored.owned[i])) writeSave(initial)
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
      const upgraded = { ...save, owned: save.owned.map(ensureDualMoves) }
      writeSave(upgraded)
      setMuted(upgraded.muted)
      set({ save: upgraded, panel: null, screen: 'camp' })
    },
    markExported: () => commit({ exportedAt: Date.now(), clearsSinceExport: 0 }),

    newGame: (name, starter) => {
      const base = defaultSave()
      // Original first expedition starts with ONE chosen partner.
      // Other companions arrive through base-camp cooking.
      const first = newMon(base, starter, 5)
      const nextBattery = consume(base.battery, Date.now(), BATTERY_MAX) ?? base.battery
      const save: SaveData = { ...base, ...first.patch, name, started: true,
        party: [first.mon.id], battery: nextBattery, seenStory: [TUTORIAL_ACTIVE],
        muted: get().save.muted }
      writeSave(save)
      set({ save, panel: null, stage: getStage(ORIGINAL_FIRST,0), result: null, screen: 'battle' })
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

    startCooking: (sel, tier: CookingTier = 0) => {
      const s = get().save
      if (s.pot || sel.length !== DISH_SIZE) return false
      const pot = COOKING_TIERS[tier]
      if (!pot || (pot.unlockArea >= 0 && !areaCleared(s, pot.unlockArea))) return false
      const need: Partial<Record<IngredientId, number>> = {}
      for (const id of sel) need[id] = (need[id] ?? 0) + pot.perSlot
      for (const [id, n] of Object.entries(need) as [IngredientId, number][])
        if ((s.ingredients[id] ?? 0) < n) return false
      const ingredients = { ...s.ingredients }
      for (const [id, n] of Object.entries(need) as [IngredientId, number][]) ingredients[id] -= n
      const tutorialCook = tutorialPhase(s)==='cooking'
      const visitor = tutorialCook ? getSpecies(16) : cook(sel)
      // Original cooking: 4.3% chance to attract two Pokémon, 0.5% for three.
      const roll = Math.random()
      const boost = multipleCookingBonus(s.decorations)
      const extras = tutorialCook ? [19] : roll < 0.005 * boost ? [cook(sel).id, cook(sel).id] : roll < 0.048 * boost ? [cook(sel).id] : []
      // The one-time onboarding pot is immediately ready, so new players never
      // get trapped waiting for two more expeditions before receiving a party.
      const total = tutorialCook ? 1 : cookingExpeditions(sel, tier)
      const recipe = tutorialCook ? 1 : recipeFor(sel).no
      commit({ ingredients, pot: { species: visitor.id, visitors: extras, remaining: tutorialCook ? 0 : total, total, recipe, ...(tier ? { tier } : {}) } })
      return true
    },

    collectCooked: () => {
      const s = get().save
      if (!s.pot || s.pot.remaining > 0) return null
      const potTier = s.pot.tier ?? 0
      const low = [1,16,31,71][potTier] ?? 1
      const high = [15,30,70,100][potTier] ?? 15
      const { mon, patch } = newMon(s, s.pot.species, Math.max(low, Math.min(high, newcomerLevel(s, low))), potTier)
      const waiting = s.pot.visitors ?? []
      const pot = waiting.length ? { ...s.pot, species: waiting[0], visitors: waiting.slice(1), remaining: 0 } : null
      const tutorialGuests = s.seenStory.includes(TUTORIAL_ACTIVE) && !s.seenStory.includes(TUTORIAL_FINISHED)
      const guestParty = tutorialGuests && s.party.length < 3 ? [...s.party, mon.id] : s.party
      const ready = tutorialGuests && !pot &&
        [...s.owned, mon].some(o=>o.species===16) &&
        [...s.owned, mon].some(o=>o.species===19)
      commit({ ...patch, pot, party: guestParty,
        seenStory: ready ? [...s.seenStory, TUTORIAL_FINISHED] : s.seenStory,
        counters: bump(s.counters, 'cooked') })
      return mon
    },

    setParty: ids => commit({ party: ids.slice(0, 3) }),

    placeStone: (monId, stoneId, x, y, rot) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      const stone = s.stones.find(t => t.id === stoneId)
      if (!mon || !stone || usedStoneIds(s).has(stoneId)) return false
      if (!canPlace(mon.level, occupancy(mon.stones, s.stones), stone.shape, rot, x, y)) return false
      if (!acceptsSocket(mon.sockets, x, y, stone.kind)) return false
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, stones: [...o.stones, { stone: stoneId, x, y, rot }] } : o)) })
      return true
    },
    autoPlaceStone: (monId, stoneId) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      const stone = s.stones.find(t => t.id === stoneId)
      if (!mon || !stone) return false
      const occ = occupancy(mon.stones, s.stones)
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++)
        if (acceptsSocket(mon.sockets, x, y, stone.kind) && canPlace(mon.level, occ, stone.shape, 0, x, y))
          return get().placeStone(monId, stoneId, x, y, 0)
      return false
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
      const merged: Stone = { id: `s${s.uid}`, kind, shape, star: (star + 1) as 2 | 3,
        ...(a.value !== undefined || b.value !== undefined ? { value: Math.round(Math.max(a.value ?? 0, b.value ?? 0) * 1.15) } : {}) }
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
      const mon = autoEvolve(addExp(m, expToNext(m.level) - m.exp).mon, s.stones)
      commit({ coins: s.coins - cost, owned: s.owned.map(o => (o.id === monId ? mon : o)),
        dex: s.dex.includes(mon.species) ? s.dex : [...s.dex, mon.species] })
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
      if (stage.area >= 0 && (!areaUnlocked(s, stage.area) || (stage.area !== HAPPENSTANCE_AREA && stage.index > 0 && !isCleared(s, stage.area, stage.index - 1)))) return false
      if (!canTutorialExplore(s, stage)) return false
      const next = consume(s.battery, Date.now(), BATTERY_MAX + maxBatteryBonus(s.decorations))
      if (!next) return false
      commit({ battery: next })
      set({ stage, result: null, screen: 'battle' })
      return true
    },

    buyBattery: full => {
      const s = get().save
      const now = Date.now()
      const cap = BATTERY_MAX + maxBatteryBonus(s.decorations)
      const have = batteryNow(s.battery, now, cap).n
      const cost = full ? BATTERY_FULL_COST : BATTERY_ONE_COST
      if (s.coins < cost || have >= cap) return false
      commit({ coins: s.coins - cost, battery: charge(s.battery, now, full ? cap : 1, cap) })
      return true
    },

    equipMoveStone: (monId, stoneId, slot = 0) => {
      const s = get().save
      const mon = s.owned.find(o => o.id === monId)
      const ms = s.moveStones.find(m => m.id === stoneId)
      if (!mon || !ms || (slot===1 && !mon.move2) || mon.mstones.length >= (mon.move2 ? 2 : MOVE_SLOTS) || usedMoveStoneIds(s).has(stoneId)) return false
      if(mon.move2 && mon.mstones.some((_,i)=>(mon.moveStoneSlots?.[i]??0)===slot))return false
      const move=getMove((slot===1 ? mon.move2 : mon.move) ?? getSpecies(mon.species).special)
      if(move.stones && !move.stones.includes(ms.kind))return false
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, mstones: [...o.mstones, stoneId], moveStoneSlots:[...(o.moveStoneSlots??o.mstones.map(()=>0)),slot] } : o)) })
      return true
    },
    unequipMoveStone: (monId, stoneId) => {
      const s = get().save
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, mstones: o.mstones.filter(x => x !== stoneId), moveStoneSlots:(o.moveStoneSlots??o.mstones.map(()=>0)).filter((_,i)=>o.mstones[i]!==stoneId) as Array<0|1> } : o)) })
    },

    train: (targetId, foodIds, mode, moveSlot = 0) => {
      const s = get().save
      const target = s.owned.find(o => o.id === targetId)
      const foods = [...new Set(foodIds)].map(id => s.owned.find(o => o.id === id)).filter((o): o is OwnedMon => !!o && o.id !== targetId && !s.party.includes(o.id))
      if (!target || !foods.length || foods.length > TRAIN_MAX) return null
      const gone = new Set(foods.map(f => f.id))
      const rest = s.owned.filter(o => !gone.has(o.id))
      const counters = bump(s.counters, 'trained')
      if (mode === 'exp') {
        const exp = Math.round(trainExp(target, foods) * trainingExpBonus(s.decorations))
        const mon = autoEvolve(addExp(target, exp).mon, s.stones)
        commit({ owned: rest.map(o => (o.id === targetId ? mon : o)), counters,
          dex: s.dex.includes(mon.species) ? s.dex : [...s.dex, mon.species] })
        return { ok: true, exp }
      }
      const r = recall(target, foods, Date.now(), Math.random, moveSuccessBonus(s.decorations), moveSlot)
      commit({ owned: rest.map(o => (o.id === targetId ? r.mon : o)), counters: r.ok ? bump(counters, 'recalled') : counters })
      return { ok: r.ok, recall: r }
    },

    toggleEverstone: monId => {
      const s = get().save
      if (!s.owned.some(m => m.id === monId)) return
      commit({ owned: s.owned.map(m => m.id === monId ? { ...m, everstone: !m.everstone } : m) })
    },
    evolve: (monId, choice) => {
      const s = get().save
      const m = s.owned.find(o => o.id === monId)
      if (!m || !canEvolve(m)) return null
      if (m.everstone) return null
      const to = targetOf(m.species, choice)
      if (!to) return null
      // 새 종은 기본 필살기로 돌아간다 (떠올린 기술은 유지)
      commit({ owned: s.owned.map(o => (o.id === monId ? { ...o, species: to } : o)), dex: s.dex.includes(to) ? s.dex : [...s.dex, to], counters: bump(s.counters, 'evolved') })
      return to
    },

    claimMemberTickets: () => {
      const s = get().save
      const now = Date.now()
      if (!memberRewardReady(s, now)) return 0
      commit({ pmTickets: s.pmTickets + MEMBER_REWARD_TICKETS, ticketClaimedAt: now })
      return MEMBER_REWARD_TICKETS
    },

    buyDecoration: id => {
      const s = get().save
      const item = buyableDecoration(id)
      if (!item || s.decorations.includes(id) || s.pmTickets < item.tickets) return false
      commit({ pmTickets: s.pmTickets - item.tickets, decorations: [...s.decorations, id] })
      return true
    },

    recycleStone: stoneId => {
      const s = get().save
      const stone = s.stones.find(x => x.id === stoneId)
      if (!stone || usedStoneIds(s).has(stoneId)) return false
      const ingredient: IngredientId = stone.kind === 'atk' ? 'mushroomRed' :
        stone.kind === 'hp' ? 'berryBlue' : 'fossil'
      const amount = Math.ceil((stone.star * 2 + 1) * recycledIngredientBonus(s.decorations))
      commit({
        stones: s.stones.filter(x => x.id !== stoneId),
        ingredients: { ...s.ingredients, [ingredient]: s.ingredients[ingredient] + amount },
      })
      return true
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
      commit({ claimed: [...s.claimed, id], coins: s.coins + (q.reward.coins ?? 0), pmTickets: s.pmTickets + (q.reward.tickets ?? 0), ingredients, themes })
      return true
    },

    setTheme: id => {
      const s = get().save
      if (s.themes.includes(id)) commit({ theme: id })
    },

    finishBattle: (win, stage, kills = 0) => {
      const s = get().save
      if (!win) {
        if (s.pot && s.pot.remaining > 0) commit({ pot: { ...s.pot, remaining: s.pot.remaining - 1 } })
        set({ result: { win: false, stage, rewards: null, firstClear: false, recruited: null, levelUps: [], stone: null, moveStone: null, outroArea: null }, screen: 'result' })
        return
      }
      const clearsSoFar = s.counters.clears ?? 0
      const expeditionBonus = clearsSoFar > 0 && clearsSoFar % 10 === 0
      const rewards = rollRewards(stage, Math.random, expeditionBonus)
      if (tutorialPhase(s)==='first-expedition' && stage.area===ORIGINAL_FIRST && stage.index===0) {
        // Guaranteed central-slot-compatible one-cell stone after 1-1.
        const firstMon = s.owned.find(o=>s.party.includes(o.id))
        const socket = firstMon?.sockets?.[4] ?? 'any'
        rewards.stone = {kind: socket==='hp' ? 'hp' : 'atk', shape:'dot',star:1,value:100,perks:{}}
        rewards.ingredients = { mushroomRed:3, berryBlue:3, nutYellow:3, fossil:3, rootRed:3 }
      }
      const firstClear = stage.area >= 0 ? !s.cleared[stage.id] : stage.endlessFloor! > s.endlessBest
      // 파티 전원에게 경험치
      const levelUps: BattleResult['levelUps'] = []
      let owned = s.owned.map(o => {
        if (!s.party.includes(o.id)) return o
        // 번영의 석상: 아직 레벨이 낮은 포켓몬은 경험치를 더 받는다
        const mul = Math.max(o.level <= originalStatueExpCap(s) ? 1.5 : 1, o.level < statueCap(s.statue) ? statueMul(s.statue) : 1)
        const r = addExp(o, Math.round(rewards.exp * mul))
        const grown = autoEvolve(r.mon, s.stones)
        if (r.gained > 0) levelUps.push({ name: grown.species !== o.species ? getSpecies(o.species).name + ' → ' + getSpecies(grown.species).name : getSpecies(o.species).name, from: o.level, to: grown.level })
        return grown
      })
      const ingredients = { ...s.ingredients }
      for (const [id, n] of Object.entries(rewards.ingredients) as [IngredientId, number][]) ingredients[id] += ingredientBonus(id, n, s.decorations)
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
      let dex = [...new Set([...s.dex, ...owned.map(o => o.species)])]
      if (firstClear && stage.recruit) {
        recruited = ensureDualMoves({ id: `m${uid++}`, species: stage.recruit, level: Math.max(newcomerLevel(s), stage.level - 3), exp: 0, stones: [], bonus: rollBonuses(), mstones: [] })
        owned = [...owned, recruited]
        if (!dex.includes(stage.recruit)) dex = [...dex, stage.recruit]
      }
      const pot = s.pot && s.pot.remaining > 0 ? { ...s.pot, remaining: s.pot.remaining - 1 } : s.pot
      commit({ coins: s.coins + rewards.coins, ingredients, owned, stones, moveStones, cleared, endlessBest, uid, dex, pot, clearsSinceExport: s.clearsSinceExport + 1, counters: bump(bump(bump(s.counters, 'clears'), 'kills', kills), 'bosses', stage.boss ? 1 : 0) })
      set({
        result: { win: true, stage, rewards, firstClear, recruited, levelUps, stone, moveStone, outroArea: firstClear && stage.boss && stage.area >= 0 ? stage.area : null },
        screen: 'result',
      })
    },
  }
})
