import type { Move, PokemonType, Rng } from '../types'
import { calcDamage } from '../lib/damage'
import { getMove, getSpecies } from '../lib/roster'
import { computeStats, type Stats } from '../lib/stats'
import type { WaveEnemy } from '../lib/stages'

export type Side = 'ally' | 'enemy'

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
  /** 진형 위치(0~2). 렌더러가 좌표로 바꾼다 */
  slot: number
  atkCd: number
  spCd: number
  spMax: number
  alive: boolean
  deadT: number
  /** 공격 연출(초), 피격 연출(초) */
  lunge: number
  hurt: number
}

export type FxEvent =
  | { k: 'attack'; from: number; to: number[]; type: PokemonType; special: boolean }
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

export const PROJECTILE_TIME = 0.22
export const ADVANCE_TIME = 1.5
export const AOE_TYPES: PokemonType[] = ['electric', 'ground', 'ice', 'psychic', 'ghost']
export const STAB = 1.3

const BOSS = { hp: 2.5, atk: 1.1, def: 1.05 }
/** 아군은 스톤으로 강해지므로 일반 적의 공격은 살짝 낮춘다 */
const ENEMY_ATK = 0.85

const attackInterval = (spe: number) => 2.3 / (1 + spe / 130)

function makeUnit(b: Battle, side: Side, speciesId: number, level: number, stats: Stats, slot: number, boss: boolean, ownedId?: string): Unit {
  const sp = getSpecies(speciesId)
  const m = boss ? BOSS : { hp: 1, atk: 1, def: 1 }
  const atkMul = side === 'enemy' ? m.atk * ENEMY_ATK : m.atk
  const maxHp = Math.floor(stats.maxHp * m.hp)
  const special = getMove(sp.special)
  return {
    uid: b.nextUid++, side, speciesId, name: sp.name, types: sp.types, level, maxHp, hp: maxHp,
    atk: Math.floor(stats.atk * atkMul), def: Math.floor(stats.def * m.def), spe: stats.spe, crit: stats.crit,
    basic: getMove(sp.basic), special, boss, ownedId, slot,
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

function strike(b: Battle, from: Unit, to: Unit, move: Move, special: boolean, powerMul = 1) {
  const power = move.power * powerMul * (from.types.includes(move.type) ? STAB : 1)
  const r = calcDamage({
    level: from.level, power, atk: from.atk, def: to.def, moveType: move.type, defenderTypes: to.types,
    rng: b.rng, crit: b.rng() < from.crit,
  })
  b.pending.push({
    at: b.t + PROJECTILE_TIME, from: from.uid, to: to.uid, amount: r.damage, eff: r.effectiveness, crit: r.crit, type: move.type, special,
  })
}

function target(b: Battle, u: Unit): Unit | undefined {
  const foes = alive(b, u.side === 'ally' ? 'enemy' : 'ally')
  if (!foes.length) return undefined
  return u.side === 'ally' ? foes.sort((a, c) => a.slot - c.slot)[0] : foes[Math.floor(b.rng() * foes.length)]
}

function doSpecial(b: Battle, u: Unit) {
  const foes = alive(b, u.side === 'ally' ? 'enemy' : 'ally')
  if (!foes.length) return false
  const aoe = u.boss || AOE_TYPES.includes(u.special.type)
  const targets = aoe ? foes : [target(b, u)!]
  const mul = u.boss ? 0.7 : aoe ? 0.65 : 1
  u.lunge = 0.35
  b.events.push({ k: 'attack', from: u.uid, to: targets.map(t => t.uid), type: u.special.type, special: true })
  for (const t of targets) strike(b, u, t, u.special, true, mul)
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
      if (u.atkCd <= 0) {
        const t = target(b, u)
        if (t) {
          u.lunge = 0.25
          b.events.push({ k: 'attack', from: u.uid, to: [t.uid], type: u.basic.type, special: false })
          strike(b, u, t, u.basic, false)
        }
        u.atkCd = attackInterval(u.spe) * (0.9 + b.rng() * 0.2)
      }
    }
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
    if (b.phaseT <= 0) {
      b.wave++
      if (b.wave >= b.waves.length) { b.phase = 'won'; return }
      spawnWave(b)
      for (const a of alive(b, 'ally')) a.atkCd = 0.3 + b.rng() * 0.6
      b.phase = 'fight'
    }
  }
}
