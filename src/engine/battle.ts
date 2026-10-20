import type { Move, PokemonType, Rng } from '../types'
import { calcDamage } from '../lib/damage'
import { getMove, getSpecies } from '../lib/roster'
import { computeStats, type Stats } from '../lib/stats'
import type { WaveEnemy } from '../lib/stages'

export type Side = 'ally' | 'enemy'

/** 전장 크기(가상 좌표). 렌더러와 같은 좌표계를 쓴다. */
export const FIELD = { x0: 70, x1: 890, y0: 190, y1: 460 }

export interface Unit {
  uid: number
  side: Side
  speciesId: number
  name: string
  types: PokemonType[]
  level: number
  maxHp: number
  hp: number
  atk: number
  def: number
  spe: number
  crit: number
  basic: Move
  special: Move
  boss: boolean
  ownedId?: string
  /** 아군의 파티 순서(0~2). 빨강/초록/파랑 표시 색을 정한다 */
  slot: number
  x: number
  y: number
  face: 1 | -1
  moving: boolean
  range: number
  speed: number
  radius: number
  atkCd: number
  spCd: number
  spMax: number
  alive: boolean
  deadT: number
  lunge: number
  hurt: number
}

export type FxEvent =
  | { k: 'attack'; from: number; to: number[]; type: PokemonType; special: boolean; ranged: boolean }
  | { k: 'hit'; from: number; to: number; amount: number; eff: number; crit: boolean; type: PokemonType; special: boolean }
  | { k: 'faint'; uid: number }
  | { k: 'heal'; uid: number; amount: number }
  | { k: 'wave'; index: number }

interface Pending { at: number; from: number; to: number; amount: number; eff: number; crit: boolean; type: PokemonType; special: boolean }

export type Phase = 'fight' | 'advance' | 'won' | 'lost'

export interface Battle {
  t: number
  units: Unit[]
  waves: WaveEnemy[][]
  wave: number
  phase: Phase
  phaseT: number
  pending: Pending[]
  events: FxEvent[]
  auto: boolean
  kills: number
  nextUid: number
  rng: Rng
}

export interface AllyInput { ownedId: string; speciesId: number; level: number; stats: Stats }

export const ADVANCE_TIME = 1.7
export const AOE_TYPES: PokemonType[] = ['electric', 'ground', 'ice', 'psychic', 'ghost']
/** 멀리서 쏘는 타입 (나머지는 달려가서 때린다) */
export const RANGED_TYPES: PokemonType[] = ['fire', 'water', 'electric', 'psychic', 'ice', 'ghost', 'dragon', 'grass', 'fairy', 'poison']
export const STAB = 1.3
export const AOE_RADIUS = 150

const BOSS = { hp: 3, atk: 1.12, def: 1.05 }
/** 아군은 스톤으로 강해지므로 일반 적의 공격은 살짝 낮춘다 */
const ENEMY_ATK = 1.0

const MELEE_RANGE = 52
const RANGED_RANGE = 190
export const FORMATION = [{ x: 280, y: 320 }, { x: 205, y: 395 }, { x: 205, y: 245 }]

const attackInterval = (spe: number) => 2.3 / (1 + spe / 130)
const dist = (a: Unit, b: Unit) => Math.hypot(a.x - b.x, a.y - b.y)

function makeUnit(b: Battle, side: Side, speciesId: number, level: number, stats: Stats, slot: number, boss: boolean, ownedId?: string): Unit {
  const sp = getSpecies(speciesId)
  const m = boss ? BOSS : { hp: 1, atk: 1, def: 1 }
  const atkMul = side === 'enemy' ? m.atk * ENEMY_ATK : m.atk
  const maxHp = Math.floor(stats.maxHp * m.hp)
  const special = getMove(sp.special)
  const basic = getMove(sp.basic)
  const ranged = RANGED_TYPES.includes(basic.type) && !boss
  const home = FORMATION[slot] ?? FORMATION[0]
  const x = side === 'ally' ? home.x : boss ? 760 : 640 + b.rng() * 220
  const y = side === 'ally' ? home.y : boss ? 325 : FIELD.y0 + 30 + (slot / 2) * (FIELD.y1 - FIELD.y0 - 60) + (b.rng() - 0.5) * 30
  return {
    uid: b.nextUid++, side, speciesId, name: sp.name, types: sp.types, level, maxHp, hp: maxHp,
    atk: Math.floor(stats.atk * atkMul), def: Math.floor(stats.def * m.def), spe: stats.spe, crit: stats.crit,
    basic, special, boss, ownedId, slot, x, y, face: side === 'ally' ? 1 : -1, moving: false,
    range: boss ? 96 : ranged ? RANGED_RANGE : MELEE_RANGE,
    speed: Math.min(150, 62 + stats.spe * 0.55),
    radius: boss ? 62 : 28,
    atkCd: 0.4 + b.rng() * 0.9,
    spMax: special.power >= 100 ? 10 : 8,
    spCd: side === 'ally' ? 3.5 : 6 + b.rng() * 3,
    alive: true, deadT: 0, lunge: 0, hurt: 0,
  }
}

function spawnWave(b: Battle) {
  b.units = b.units.filter(u => u.side === 'ally' || u.alive)
  b.waves[b.wave].forEach((e, i) => {
    b.units.push(makeUnit(b, 'enemy', e.species, e.level, computeStats(getSpecies(e.species), e.level), i, !!e.boss))
  })
  b.events.push({ k: 'wave', index: b.wave })
}

export function createBattle(allies: AllyInput[], waves: WaveEnemy[][], rng: Rng = Math.random): Battle {
  const b: Battle = {
    t: 0, units: [], waves, wave: 0, phase: 'fight', phaseT: 0, pending: [], events: [],
    auto: false, kills: 0, nextUid: 1, rng,
  }
  allies.forEach((a, i) => b.units.push(makeUnit(b, 'ally', a.speciesId, a.level, a.stats, i, false, a.ownedId)))
  spawnWave(b)
  return b
}

const alive = (b: Battle, side: Side) => b.units.filter(u => u.side === side && u.alive)
export const unitById = (b: Battle, uid: number) => b.units.find(u => u.uid === uid)

function nearest(b: Battle, u: Unit): Unit | undefined {
  let best: Unit | undefined
  let bd = Infinity
  for (const f of b.units) {
    if (f.side === u.side || !f.alive) continue
    const d = dist(u, f)
    if (d < bd) { bd = d; best = f }
  }
  return best
}

function strike(b: Battle, from: Unit, to: Unit, move: Move, special: boolean, powerMul = 1, delay = 0.12) {
  const power = move.power * powerMul * (from.types.includes(move.type) ? STAB : 1)
  const crit = b.rng() < from.crit
  let r = calcDamage({ level: from.level, power, atk: from.atk, def: to.def, moveType: move.type, defenderTypes: to.types, rng: b.rng, crit })
  if (r.effectiveness === 0) {
    // 실시간 전투에서 무한 교착을 막기 위해 "효과 없음"은 0.25배 피해로 처리한다
    const neutral = calcDamage({ level: from.level, power, atk: from.atk, def: to.def, moveType: move.type, defenderTypes: [], rng: b.rng, crit })
    r = { damage: Math.max(1, Math.floor(neutral.damage * 0.25)), effectiveness: 0.25, crit }
  }
  b.pending.push({ at: b.t + delay, from: from.uid, to: to.uid, amount: r.damage, eff: r.effectiveness, crit: r.crit, type: move.type, special })
}

const travel = (a: Unit, c: Unit) => Math.max(0.12, dist(a, c) / 560)

function doSpecial(b: Battle, u: Unit): boolean {
  const main = nearest(b, u)
  if (!main) return false
  const foes = alive(b, u.side === 'ally' ? 'enemy' : 'ally')
  const aoe = u.boss || AOE_TYPES.includes(u.special.type)
  const targets = u.boss ? foes : aoe ? foes.filter(f => Math.hypot(f.x - main.x, f.y - main.y) <= AOE_RADIUS) : [main]
  const mul = u.boss ? 0.7 : aoe ? 0.65 : 1
  u.lunge = 0.35
  u.face = main.x >= u.x ? 1 : -1
  b.events.push({ k: 'attack', from: u.uid, to: targets.map(t => t.uid), type: u.special.type, special: true, ranged: true })
  for (const t of targets) strike(b, u, t, u.special, true, mul, travel(u, t))
  u.spCd = u.spMax
  return true
}

/** 플레이어가 아군의 필살기를 직접 발동 */
export function useSpecial(b: Battle, uid: number): boolean {
  const u = unitById(b, uid)
  if (!u || u.side !== 'ally' || !u.alive || b.phase !== 'fight' || u.spCd > 0) return false
  return doSpecial(b, u)
}

function applyHit(b: Battle, p: Pending) {
  const to = unitById(b, p.to)
  if (!to || !to.alive) return
  to.hp = Math.max(0, to.hp - p.amount)
  to.hurt = 0.3
  b.events.push({ k: 'hit', from: p.from, to: p.to, amount: p.amount, eff: p.eff, crit: p.crit, type: p.type, special: p.special })
  if (to.hp <= 0) {
    to.alive = false
    to.deadT = 0
    if (to.side === 'enemy') b.kills++
    b.events.push({ k: 'faint', uid: to.uid })
  }
}

function separate(b: Battle) {
  const us = b.units.filter(u => u.alive)
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
    const a = us[i], c = us[j]
    const dx = c.x - a.x, dy = c.y - a.y
    const d = Math.hypot(dx, dy) || 0.01
    const min = (a.radius + c.radius) * 0.9
    if (d < min) {
      const push = (min - d) / 2
      a.x -= (dx / d) * push; a.y -= (dy / d) * push
      c.x += (dx / d) * push; c.y += (dy / d) * push
    }
  }
  for (const u of us) {
    u.x = Math.min(FIELD.x1, Math.max(FIELD.x0, u.x))
    u.y = Math.min(FIELD.y1, Math.max(FIELD.y0, u.y))
  }
}

export function step(b: Battle, dt: number): void {
  if (b.phase === 'won' || b.phase === 'lost') return
  b.t += dt

  for (const u of b.units) {
    if (!u.alive) { u.deadT += dt; continue }
    u.lunge = Math.max(0, u.lunge - dt)
    u.hurt = Math.max(0, u.hurt - dt)
  }

  if (b.phase === 'fight') {
    for (const u of b.units) {
      if (!u.alive) continue
      u.atkCd -= dt
      u.spCd = Math.max(0, u.spCd - dt)
      if (u.spCd <= 0 && (u.boss || (u.side === 'ally' && b.auto))) doSpecial(b, u)
      const t = nearest(b, u)
      if (!t) { u.moving = false; continue }
      const d = dist(u, t)
      u.face = t.x >= u.x ? 1 : -1
      if (d > u.range + t.radius * 0.4) {
        u.moving = true
        const k = Math.min(u.speed * dt, d)
        u.x += ((t.x - u.x) / d) * k
        u.y += ((t.y - u.y) / d) * k
      } else {
        u.moving = false
        if (u.atkCd <= 0) {
          const ranged = u.range > MELEE_RANGE + 10 && !u.boss
          u.lunge = 0.25
          b.events.push({ k: 'attack', from: u.uid, to: [t.uid], type: u.basic.type, special: false, ranged })
          strike(b, u, t, u.basic, false, 1, ranged ? travel(u, t) : 0.12)
          u.atkCd = attackInterval(u.spe) * (0.9 + b.rng() * 0.2)
        }
      }
    }
    separate(b)
  }

  // 날아가던 공격이 도착했는지 확인
  const due = b.pending.filter(p => p.at <= b.t)
  if (due.length) {
    b.pending = b.pending.filter(p => p.at > b.t)
    for (const p of due) applyHit(b, p)
  }

  if (b.phase === 'fight') {
    if (!alive(b, 'ally').length) { b.phase = 'lost'; return }
    if (!alive(b, 'enemy').length && !b.pending.length) {
      b.phase = 'advance'
      b.phaseT = ADVANCE_TIME
      for (const a of alive(b, 'ally')) {
        const heal = Math.floor(a.maxHp * 0.1)
        a.hp = Math.min(a.maxHp, a.hp + heal)
        b.events.push({ k: 'heal', uid: a.uid, amount: heal })
      }
    }
  } else if (b.phase === 'advance') {
    b.phaseT -= dt
    for (const a of alive(b, 'ally')) {
      const h = FORMATION[a.slot] ?? FORMATION[0]
      const dx = h.x - a.x, dy = h.y - a.y
      const d = Math.hypot(dx, dy)
      a.moving = true
      a.face = 1
      if (d > 2) { const k = Math.min(d, 170 * dt); a.x += (dx / d) * k; a.y += (dy / d) * k }
    }
    if (b.phaseT <= 0) {
      b.wave++
      if (b.wave >= b.waves.length) { b.phase = 'won'; return }
      spawnWave(b)
      for (const a of alive(b, 'ally')) { a.atkCd = 0.3 + b.rng() * 0.6; a.moving = false }
      b.phase = 'fight'
    }
  }
}
