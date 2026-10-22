import type { Move, PokemonType, Rng, StatusKind } from '../types'
import { STATUS_CHANCE, TYPE_STATUS } from '../lib/moveSet'
import { calcDamage } from '../lib/damage'
import { getMove, getSpecies } from '../lib/roster'
import { computeStats, type Stats } from '../lib/stats'
import type { WaveEnemy } from '../lib/stages'
import { type MoveFx, NO_FX, SPIRIT_ATK, SPIRIT_SECONDS } from '../lib/moveStones'
import { moveHits, moveProfile, type MoveProfile } from '../lib/moveProfiles'
import { encounterBalance, type EncounterBalance } from '../lib/battleBalance'
import { WORLD_BOUNDS } from '../art/openField'
import type { Stage } from '../lib/stages'

export type Side = 'ally' | 'enemy'

/** 전장 크기(가상 좌표). 렌더러와 같은 좌표계를 쓴다. */
export const FIELD = { x0: 100, x1: WORLD_BOUNDS.right - 100, y0: 110, y1: WORLD_BOUNDS.bottom - 110 }

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
  secondary: Move | null
  spCd2: number
  spMax2: number
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
  /** 기술스톤 효과 */
  fx: MoveFx
  fx2: MoveFx
  /** 빙고 보너스 효과 */
  critDmg: number
  atkCdCut: number
  lifesteal: number
  regen: number
  waveHeal: number
  koHeal: number
  reviveSpeed: number
  reviveHp: number
  effectResist: number
  statusResist: number
  typeMoveAtk: Record<string,number>
  typeMoveWait: Record<string,number>
  typeDamageResist: Record<string,number>
  statusTypeResist: Record<string,number>
  critTakenResist: number
  /** 필살기로 얻은 공격력 기합 (until 까지 mul 배) */
  spirit: { mul: number; until: number }
  /** 보조기로 받은 증감 (until 까지) */
  buff: { atk: number; def: number; speed: number; until: number }
  debuff: { atk: number; def: number; speed: number; until: number }
  status: { kind: StatusKind; until: number; tick: number } | null
  /** 흩어지기 남은 시간 */
  scatterT: number
  elite: boolean
  alive: boolean
  deadT: number
  /** Original Quest: allies can revive after 25 seconds while the party survives. */
  revives: number
  lunge: number
  hurt: number
}

export type FxEvent =
  | { k: 'attack'; from: number; to: number[]; type: PokemonType; special: boolean; ranged: boolean }
  | { k: 'hit'; from: number; to: number; amount: number; eff: number; crit: boolean; type: PokemonType; special: boolean }
  | { k: 'faint'; uid: number }
  | { k: 'bossDefeated'; uid: number; x: number; y: number }
  | { k: 'heal'; uid: number; amount: number }
  | { k: 'wave'; index: number }
  | { k: 'banner'; text: string; tone: 'info' | 'warn' | 'boss' }
  | { k: 'status'; uid: number; kind: StatusKind }
  | { k: 'buff'; uid: number; good: boolean }
  | { k: 'flee'; uid: number }

interface Pending { at: number; from: number; to: number; amount: number; eff: number; crit: boolean; type: PokemonType; special: boolean; status?: StatusKind; sourceQuest?: boolean; geometry?: {profile:MoveProfile; origin:{x:number;y:number}; aim:{x:number;y:number}} }

export type Phase = 'fight' | 'advance' | 'won' | 'lost'

interface Queued { at: number; uid: number; mul: number; slot: 0 | 1 }

export interface Battle {
  /** 웨이브 도중에 합류하는 적 (동료 호출 / 새로운 무리 / 포위) */
  late: WaveEnemy[]
  scatterCd: number
  surrounded: boolean
  waveKills: number
  t: number
  units: Unit[]
  waves: WaveEnemy[][]
  wave: number
  phase: Phase
  phaseT: number
  pending: Pending[]
  /** 리피트/늘리기 스톤으로 이어서 나가는 필살기 */
  queue: Queued[]
  events: FxEvent[]
  auto: boolean
  kills: number
  nextUid: number
  rng: Rng
  balance: EncounterBalance
  /** Optional user-commanded free-roam waypoint in the 2D island world. */
  manualPoint: {x:number;y:number}|null
  /** Continuous omnidirectional motion from keyboard or touch pad. */
  manualDirection: {x:number;y:number}|null
}

export interface AllyInput { ownedId: string; speciesId: number; level: number; stats: Stats; fx?: MoveFx; fx2?: MoveFx; move?: string; move2?: string }

export const ADVANCE_TIME = 2.7
export const AOE_TYPES: PokemonType[] = ['electric', 'ground', 'ice', 'psychic', 'ghost']
/** 멀리서 쏘는 타입 (나머지는 달려가서 때린다) */
export const RANGED_TYPES: PokemonType[] = ['fire', 'water', 'electric', 'psychic', 'ice', 'ghost', 'dragon', 'grass', 'fairy', 'poison']
export const STAB = 1.3
export const AOE_RADIUS = 150

const BOSS = { hp: 3, atk: 1.12, def: 1.05 }
const ELITE = { hp: 1.7, atk: 1.1, def: 1.05 }
/** 아군은 스톤으로 강해지므로 일반 적의 공격은 살짝 낮춘다 */
const ENEMY_ATK = 0.96

const MELEE_RANGE = 52
const RANGED_RANGE = 190
export const FORMATION = [{ x: 420, y: 650 }, { x: 360, y: 715 }, { x: 370, y: 595 }]
/** Non-monotonic routes bend back to the west, north and south. */
export function waveCenter(wave: number, total: number) {
  const nodes = total <= 1
    ? [{x:1050,y:630}]
    : total === 2
      ? [{x:940,y:610},{x:1610,y:990}]
      : total === 3
        ? [{x:930,y:640},{x:1860,y:990},{x:1150,y:375}]
        : total === 4
          ? [{x:930,y:640},{x:1700,y:1010},{x:2480,y:625},{x:1530,y:330}]
          : [{x:940,y:640},{x:1700,y:1080},{x:2420,y:690},{x:1970,y:340},{x:1170,y:750}]
  return nodes[Math.max(0,Math.min(nodes.length-1,wave))]
}

const attackInterval = (spe: number) => 2.3 / (1 + spe / 130)
const dist = (a: Unit, b: Unit) => Math.hypot(a.x - b.x, a.y - b.y)

interface MakeOpts { ownedId?: string; fx?: MoveFx; fx2?: MoveFx; move?: string; move2?: string; elite?: boolean; pos?: { x: number; y: number } }

function makeUnit(b: Battle, side: Side, speciesId: number, level: number, stats: Stats, slot: number, boss: boolean, o: MakeOpts = {}): Unit {
  const { ownedId, fx = NO_FX, fx2 = NO_FX, elite = false } = o
  const sp = getSpecies(speciesId)
  const m = boss ? BOSS : elite ? ELITE : { hp: 1, atk: 1, def: 1 }
  const atkMul = side === 'enemy' ? m.atk * ENEMY_ATK * b.balance.attack : m.atk
  const maxHp = Math.max(5, Math.floor(stats.maxHp * m.hp * (side === 'enemy' ? b.balance.hp * (boss ? b.balance.bossHp : 1) : 1)))
  const special = getMove(o.move ?? sp.special)
  const secondary = o.move2 ? getMove(o.move2) : null
  const basic = getMove(sp.basic)
  const ranged = RANGED_TYPES.includes(basic.type) && !boss
  const home = FORMATION[slot] ?? FORMATION[0]
  const anchor = waveCenter(b.wave,b.waves.length)
  const angle = slot * 2.39996 + b.rng() * 0.65
  const radial = boss ? 0 : 65 + (slot % 3) * 34
  const x = o.pos?.x ?? (side === 'ally' ? home.x : anchor.x + Math.cos(angle) * radial)
  const y = o.pos?.y ?? (side === 'ally' ? home.y : anchor.y + Math.sin(angle) * radial)
  return {
    uid: b.nextUid++, side, speciesId, name: sp.name, types: sp.types, level, maxHp, hp: maxHp,
    atk: Math.floor(stats.atk * atkMul), def: Math.floor(stats.def * m.def * (side === 'enemy' ? b.balance.defense : 1)), spe: stats.spe, crit: stats.crit,
    basic, special, secondary, spCd2: secondary ? 4 : 0,
    spMax2: secondary ? Math.max(1, (secondary.wait ?? (secondary.power >= 100 ? 10 : 8)) * (1 - 0.05 * fx2.quick) * (1 + 0.5 * fx2.repeat) * (1 - stats.spCd) * (1 - (stats.typeMoveWait?.[secondary.type] ?? 0))) : 0,
    boss, ownedId, slot, x, y, face: side === 'ally' ? 1 : -1, moving: false,
    range: boss ? 96 : ranged ? RANGED_RANGE : MELEE_RANGE,
    speed: Math.min(190, Math.min(150, 62 + stats.spe * 0.55) * (1 + stats.moveSpd)),
    radius: (boss ? 62 : elite ? 36 : 28) * (1 + (stats.bodySize ?? 0)),
    atkCd: 0.4 + b.rng() * 0.9,
    fx, fx2,
    spMax: Math.max(1, (special.wait ?? (special.power >= 100 ? 10 : 8)) * (1 - 0.05 * fx.quick) * (1 + 0.5 * fx.repeat) * (1 - stats.spCd) * (1 - (stats.typeMoveWait?.[special.type] ?? 0))),
    critDmg: stats.critDmg, atkCdCut: stats.atkCd, lifesteal: stats.lifesteal, regen: stats.regen, waveHeal: stats.waveHeal,
    koHeal: stats.koHeal ?? 0, reviveSpeed: stats.reviveSpeed ?? 0, reviveHp: stats.reviveHp ?? 0,
    effectResist: stats.effectResist ?? 0, statusResist: stats.statusResist ?? 0,
    typeMoveAtk: stats.typeMoveAtk ?? {}, typeMoveWait: stats.typeMoveWait ?? {},
    typeDamageResist: stats.typeDamageResist ?? {}, statusTypeResist: stats.statusTypeResist ?? {},
    critTakenResist: stats.critTakenResist ?? 0,
    spirit: { mul: 0, until: 0 },
    buff: { atk: 0, def: 0, speed: 0, until: 0 }, debuff: { atk: 0, def: 0, speed: 0, until: 0 }, status: null, scatterT: 0, elite,
    spCd: side === 'ally' ? 1.2 : 6 + b.rng() * 3,
    alive: true, deadT: 0, revives: 0, lunge: 0, hurt: 0,
  }
}

/** 포위당했을 때 적이 나타나는 자리: 아군을 둘러싼 가장자리 */
function surroundPos(i: number, n: number) {
  const ang = (i / n) * Math.PI * 2 + 0.4
  const center = waveCenter(0,3)
  return { x: Math.min(FIELD.x1, Math.max(FIELD.x0, center.x + Math.cos(ang) * 185)), y: Math.min(FIELD.y1, Math.max(FIELD.y0, center.y + Math.sin(ang) * 170)) }
}

function addEnemy(b: Battle, e: WaveEnemy, i: number, pos?: { x: number; y: number }) {
  b.units.push(makeUnit(b, 'enemy', e.species, e.level, computeStats(getSpecies(e.species), e.level), i, !!e.boss, { elite: !!e.elite, pos }))
}

function spawnWave(b: Battle) {
  b.units = b.units.filter(u => u.side === 'ally' || u.alive)
  b.waveKills = 0
  b.surrounded = false
  const wave = b.waves[b.wave]
  b.late = wave.filter(e => e.late === 'call' || e.late === 'new' || e.late === 'bossHp')
  const first = wave.filter(e => !e.late)
  const surround = first.some(e => e.surround)
  const last = b.wave === b.waves.length - 1
  first.forEach((e, i) => {
    if (e.surround || surround) {
      const around = surroundPos(i, first.length)
      const node = waveCenter(b.wave,b.waves.length)
      addEnemy(b,e,i,{x:around.x+node.x-930,y:around.y+node.y-640})
    } else addEnemy(b,e,i)
  })
  b.events.push({ k: 'wave', index: b.wave })
  if (surround) b.events.push({ k: 'banner', text: '포위당했다!', tone: 'warn' })
  else if (last && wave.some(e => e.boss)) b.events.push({ k: 'banner', text: '매우 강해 보이는 포켓몬이 나타났다!', tone: 'boss' })
  else if (last && wave.some(e => e.elite)) b.events.push({ k: 'banner', text: '매우 강해 보이는 포켓몬이 나타났다!', tone: 'boss' })
  else if (wave.some(e => e.elite)) b.events.push({ k: 'banner', text: '강해 보이는 포켓몬이 나타났다!', tone: 'warn' })
}

/** 웨이브 도중에 합류하는 적을 불러낸다 */
function joinLate(b: Battle, kind: 'call' | 'new' | 'bossHp') {
  const group = b.late.filter(e => e.late === kind)
  if (!group.length) return
  b.late = b.late.filter(e => e.late !== kind)
  const text = kind === 'call' ? '동료를 불렀다!' : kind === 'new' ? '새로운 포켓몬이 나타났다!' : '포위당했다!'
  b.events.push({ k: 'banner', text, tone: kind === 'new' ? 'info' : 'warn' })
  group.forEach((e, i) => addEnemy(b, e, i + 4, kind === 'new' ? undefined : surroundPos(i, group.length)))
}

export function createBattle(allies: AllyInput[], waves: WaveEnemy[][], rng: Rng = Math.random, stage?: Pick<Stage,'area'|'index'>): Battle {
  const b: Battle = {
    late: [], scatterCd: 0, surrounded: false, waveKills: 0, t: 0, units: [], waves, wave: 0, phase: 'fight', phaseT: 0, pending: [], queue: [], events: [],
    auto: false, kills: 0, nextUid: 1, rng, manualPoint: null, manualDirection: null, balance: stage ? encounterBalance(stage, allies.length) : { hp: 1, attack: 1, defense: 1, allyHeal: 0.1, bossHp: 1 },
  }
  allies.forEach((a, i) => b.units.push(makeUnit(b, 'ally', a.speciesId, a.level, a.stats, i, false, { ownedId: a.ownedId, fx: a.fx, move: a.move, move2: a.move2, fx2: a.fx2 })))
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
  if (best && u.side==='enemy' && !u.boss) {
    // Enemy pack coordination: focus a wounded nearby partner only when
    // the diversion is close enough to avoid endless cross-field chasing.
    const candidates=b.units.filter(x=>x.side==='ally'&&x.alive&&dist(u,x)<=bd*1.45)
    const wounded=candidates.filter(x=>x.hp/x.maxHp<.4)
      .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)
    if(wounded.length) return wounded[0]
  }
  return best
}

const live = (b: Battle, e: { until: number }) => b.t < e.until
const atkOf = (b: Battle, u: Unit) =>
  u.atk * (1 + (live(b, u.spirit) ? u.spirit.mul : 0) + (live(b, u.buff) ? u.buff.atk : 0) - (live(b, u.debuff) ? -u.debuff.atk : 0)) * (u.status?.kind === 'burn' ? 0.8 : 1)
const defOf = (b: Battle, u: Unit) => u.def * Math.max(0.3, 1 + (live(b, u.buff) ? u.buff.def : 0) + (live(b, u.debuff) ? u.debuff.def : 0))
const speedOf = (b: Battle, u: Unit) =>
  u.speed * Math.max(0.3, 1 + (live(b, u.buff) ? u.buff.speed : 0) + (live(b, u.debuff) ? u.debuff.speed : 0)) * (u.status?.kind === 'paralyze' ? 0.5 : 1)
/** 행동할 수 없는 상태 (잠듦/얼음) */
const stunned = (u: Unit) => u.status?.kind === 'sleep' || u.status?.kind === 'freeze'
export const isBuffed = (b: Battle, u: Unit) => b.t < u.spirit.until

function strike(b: Battle, from: Unit, to: Unit, move: Move, special: boolean, powerMul = 1, delay = 0.12, geometry?:Pending['geometry']) {
  const power = move.power * powerMul * (from.types.includes(move.type) ? STAB : 1) * (1 + (from.typeMoveAtk[move.type] ?? 0))
  const crit = b.rng() < from.crit
  const atk = atkOf(b, from)
  let r = calcDamage({ level: from.level, power, atk, def: defOf(b, to), moveType: move.type, defenderTypes: to.types, rng: b.rng, crit })
  if (r.effectiveness === 0) {
    // 실시간 전투에서 무한 교착을 막기 위해 "효과 없음"은 0.25배 피해로 처리한다
    const neutral = calcDamage({ level: from.level, power, atk, def: defOf(b, to), moveType: move.type, defenderTypes: [], rng: b.rng, crit })
    r = { damage: Math.max(1, Math.floor(neutral.damage * 0.25)), effectiveness: 0.25, crit }
  }
  const amount = r.crit && from.critDmg > 0 ? Math.floor(r.damage * (1 + from.critDmg)) : r.damage
  b.pending.push({ at: b.t + delay, from: from.uid, to: to.uid, amount, eff: r.effectiveness, crit: r.crit, type: move.type, special, status: move.id.startsWith('quest-') ? moveProfile(move).status : undefined, sourceQuest: move.id.startsWith('quest-'), geometry })
}

const travel = (a: Unit, c: Unit) => Math.max(0.12, dist(a, c) / 560)

const STATUS_SECS: Record<StatusKind, number> = { poison: 7, paralyze: 5, burn: 6, sleep: 3, freeze: 2.5, confuse: 5, chain: 4 }

/** 상태이상은 한 번에 하나만 걸린다. 보스는 절반만 걸린다. */
function applyStatus(b: Battle, to: Unit, kind: StatusKind, secs = STATUS_SECS[kind]) {
  if (!to.alive || to.status || b.rng() < Math.min(1,to.statusResist + (to.statusTypeResist[kind] ?? 0))) return
  to.status = { kind, until: b.t + secs * (to.boss ? 0.5 : 1), tick: 0 }
  b.events.push({ k: 'status', uid: to.uid, kind })
}

/** 버프/디버프/상태이상 기술: 피해 없이 효과만 준다 */
function castSupport(b: Battle, u: Unit, mv: Move = u.special): boolean {
  const fx = mv.fx ?? {}
  const foes = alive(b, u.side === 'ally' ? 'enemy' : 'ally')
  const friends = alive(b, u.side)
  const main = nearest(b, u)
  u.lunge = 0.35
  if (mv.role === 'buff') {
    b.events.push({ k: 'attack', from: u.uid, to: friends.map(f => f.uid), type: mv.type, special: true, ranged: true })
    for (const f of friends) {
      if (fx.heal) {
        const h = Math.floor(f.maxHp * fx.heal)
        f.hp = Math.min(f.maxHp, f.hp + h)
        b.events.push({ k: 'heal', uid: f.uid, amount: h })
      }
      if (fx.atk || fx.def || fx.speed) {
        f.buff = { atk: fx.atk ?? 0, def: fx.def ?? 0, speed: fx.speed ?? 0, until: b.t + (fx.secs ?? 8) }
        b.events.push({ k: 'buff', uid: f.uid, good: true })
      }
    }
    return true
  }
  if (!main) return false
  if (mv.role === 'debuff') {
    const targets = foes.filter(f => Math.hypot(f.x - main.x, f.y - main.y) <= AOE_RADIUS + 120)
    b.events.push({ k: 'attack', from: u.uid, to: targets.map(t => t.uid), type: mv.type, special: true, ranged: true })
    for (const t of targets) {
      if (b.rng() < t.effectResist) continue
      t.debuff = { atk: fx.atk ?? 0, def: fx.def ?? 0, speed: fx.speed ?? 0, until: b.t + (fx.secs ?? 8) * (t.boss ? 0.6 : 1) }
      b.events.push({ k: 'buff', uid: t.uid, good: false })
    }
    return true
  }
  // 상태이상
  const targets = foes.filter(f => Math.hypot(f.x - main.x, f.y - main.y) <= AOE_RADIUS)
  b.events.push({ k: 'attack', from: u.uid, to: targets.map(t => t.uid), type: mv.type, special: true, ranged: true })
  for (const t of targets) if (fx.status) applyStatus(b, t, fx.status, fx.secs)
  return true
}

/** 필살기 한 번(대상 고르기 + 피해 예약). 리피트/늘리기 스톤으로 이어지는 발사에도 쓴다. */
function castSpecial(b: Battle, u: Unit, extraMul = 1, mv: Move = u.special, slot: 0|1 = 0) {
  if (mv.role) return castSupport(b, u, mv)
  const main = nearest(b, u)
  if (!main) return false
  const foes = alive(b, u.side === 'ally' ? 'enemy' : 'ally')
  const profile=moveProfile(mv)
  const isQuest=mv.id.startsWith('quest-')
  const aoe = u.boss || (isQuest ? ['burst','wave','cone'].includes(profile.shape) : AOE_TYPES.includes(mv.type))
  const { widen, multiply } = slot===1 ? u.fx2 : u.fx
  let targets: Unit[]
  if (u.boss) targets = foes
  else if (isQuest) targets = foes.filter(f => moveHits({...profile,radius:profile.radius+50*widen,range:profile.range+35*widen},u,main,f,f.radius))
  else if (aoe) targets = foes.filter(f => Math.hypot(f.x - main.x, f.y - main.y) <= AOE_RADIUS + 50 * widen)
  else {
    targets = [main]
    // 늘리기: 가까운 적을 더 맞힌다
    const others = foes.filter(f => f !== main).sort((x, y) => Math.hypot(x.x - u.x, x.y - u.y) - Math.hypot(y.x - u.x, y.y - u.y))
    targets.push(...others.slice(0, multiply))
  }
  if(isQuest && targets.length===0) targets=[main]
  const base = u.boss ? 0.7 : aoe ? 0.65 : 1
  const mul = base * Math.pow(0.85, multiply) * extraMul
  const geometry = isQuest ? {profile:{...profile,radius:profile.radius+50*widen,range:profile.range+35*widen},origin:{x:u.x,y:u.y},aim:{x:main.x,y:main.y}} : undefined
  u.lunge = 0.35
  u.face = main.x >= u.x ? 1 : -1
  b.events.push({ k: 'attack', from: u.uid, to: targets.map(t => t.uid), type: mv.type, special: true, ranged: true })
  for (const t of targets) for(let hit=0;hit<(isQuest?profile.hits:1);hit++)
    strike(b,u,t,mv,true,mul/(isQuest?Math.sqrt(profile.hits):1), Math.max(profile.windup,travel(u,t))+hit*.12,geometry)
  // 넓히기: 한 명만 맞히던 필살기도 주변까지 번진다
  if (!aoe && !u.boss && widen > 0) {
    const radius = 20 + 50 * widen
    for (const f of foes) if (!targets.includes(f) && Math.hypot(f.x - main.x, f.y - main.y) <= radius) strike(b, u, f, mv, true, mul * 0.5, travel(u, f),geometry)
  }
  return true
}

function doSpecial(b: Battle, u: Unit, slot: 0 | 1 = 0): boolean {
  const mv = slot === 1 ? u.secondary : u.special
  if (!mv || !castSpecial(b, u, 1, mv, slot)) return false
  const fx=slot===1 ? u.fx2 : u.fx
  if (slot === 1) u.spCd2 = u.spMax2
  else u.spCd = u.spMax
  // 필살기를 쓰면 공격력 기합이 붙는다. 결속스톤이 있으면 동료도 나눠 받고, 오래가기스톤이 있으면 더 오래 간다.
  const secs = SPIRIT_SECONDS * (1 + 0.25 * fx.lasting)
  u.spirit = { mul: SPIRIT_ATK, until: b.t + secs }
  if (fx.bond > 0) {
    for (const a of alive(b, u.side)) {
      if (a === u) continue
      const mul = SPIRIT_ATK * 0.25 * fx.bond
      if (b.t >= a.spirit.until || mul > a.spirit.mul) a.spirit = { mul, until: Math.max(b.t + secs, a.spirit.until) }
    }
  }
  // 리피트: 연달아 한 번 더 / 늘리기: 범위기는 한 번 더 때린다
  const repeats = fx.repeat + (AOE_TYPES.includes(mv.type) || u.boss ? fx.multiply : 0)
  for (let i = 1; i <= repeats; i++) b.queue.push({ at: b.t + 0.45 * i, uid: u.uid, mul: i <= fx.repeat ? 1 : 0.85, slot })
  return true
}

/** 플레이어가 아군의 필살기를 직접 발동 */
export function useSpecial(b: Battle, uid: number, slot: 0 | 1 = 0): boolean {
  const u = unitById(b, uid)
  if (!u || u.side !== 'ally' || !u.alive || b.phase !== 'fight') return false
  if (slot === 1 ? !u.secondary || u.spCd2 > 0 : u.spCd > 0) return false
  return doSpecial(b, u, slot)
}

export const SCATTER_SECS = 2
export const SCATTER_COOLDOWN = 5

/** 흩어지기: 잠깐 사방으로 흩어져 공격을 피한다 (쿨타임 5초) */
export function scatter(b: Battle): boolean {
  if (b.phase !== 'fight' || b.scatterCd > b.t) return false
  b.scatterCd = b.t + SCATTER_COOLDOWN
  for (const a of alive(b, 'ally')) a.scatterT = SCATTER_SECS
  return true
}

function applyHit(b: Battle, p: Pending) {
  const to = unitById(b, p.to)
  if (!to || !to.alive) return
  // Projectile, beam, dash and AoE contact is resolved at its scheduled hit
  // frame, not locked to a target's position at the casting frame.
  if (p.geometry && !moveHits(p.geometry.profile,p.geometry.origin,p.geometry.aim,to,to.radius)) return
  if (to.scatterT > 0 && b.rng() < (p.special ? 0.55 : 0.3)) return
  const resisted = Math.round(p.amount * Math.max(0.05, 1 - (to.typeDamageResist[p.type] ?? 0)) * (p.crit ? Math.max(0,1-to.critTakenResist) : 1))
  to.hp = Math.max(0, to.hp - resisted)
  to.hurt = 0.3
  // 잠듦은 맞으면 깬다
  if (to.status?.kind === 'sleep') to.status = null
  b.events.push({ k: 'hit', from: p.from, to: p.to, amount: resisted, eff: p.eff, crit: p.crit, type: p.type, special: p.special })
  const from = unitById(b, p.from)
  if (from && from.alive && from.lifesteal > 0 && !p.special && p.amount > 0) {
    const heal = Math.max(1, Math.floor(from.maxHp * from.lifesteal))
    from.hp = Math.min(from.maxHp, from.hp + heal)
    b.events.push({ k: 'heal', uid: from.uid, amount: heal })
  }
  if (from && from.alive && p.special && from.side !== to.side && to.hp > 0) {
    if(p.status) {if(b.rng()<STATUS_CHANCE)applyStatus(b,to,p.status)}
    else if(!p.sourceQuest && b.rng()<STATUS_CHANCE) applyStatus(b, to, TYPE_STATUS[p.type])
  }
  if (to.hp <= 0) {
    to.alive = false
    to.deadT = 0
    to.status = null
    if (to.side === 'enemy') {
      b.kills++; b.waveKills++
      if (from && from.alive && from.side === 'ally' && from.koHeal > 0) {
        const healed = Math.max(1, Math.floor(from.maxHp * from.koHeal))
        from.hp = Math.min(from.maxHp, from.hp + healed)
        b.events.push({ k:'heal', uid:from.uid, amount:healed })
      }
    }
    b.events.push({ k: 'faint', uid: to.uid })
    if((to.boss || (to.elite && b.wave === b.waves.length - 1)) && to.side === 'enemy') b.events.push({ k: 'bossDefeated', uid: to.uid, x: to.x, y: to.y })
    // 보스가 쓰러지면 부하들은 도망친다
    if (to.boss && to.side === 'enemy') {
      for (const m of b.units) if (m.side === 'enemy' && m.alive) { m.alive = false; m.deadT = 0; b.events.push({ k: 'flee', uid: m.uid }) }
      b.late = []
    }
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

/** Tap field or use keyboard to move as one 2D party in any direction. */
export function movePartyTo(b:Battle,x:number,y:number):boolean {
 if(b.phase!=='fight'&&b.phase!=='advance')return false
 if(!Number.isFinite(x)||!Number.isFinite(y))return false
 b.manualPoint={x:Math.max(FIELD.x0,Math.min(FIELD.x1,x)),y:Math.max(FIELD.y0,Math.min(FIELD.y1,y))}
 b.manualDirection=null // tap-to-waypoint overrides held motion
 return true
}
export function clearPartyWaypoint(b:Battle):void {b.manualPoint=null}
/** A held button controls motion at a consistent speed, including diagonals. */
export function steerParty(b:Battle,dx:number,dy:number):void {
  const length=Math.hypot(dx,dy)
  b.manualDirection=length<.01 ? null : {x:dx/length,y:dy/length}
  if(b.manualDirection)b.manualPoint=null
}
export const ALLY_REVIVE_SECONDS = 25
export function step(b: Battle, dt: number): void {
  if (b.phase === 'won' || b.phase === 'lost') return
  b.t += dt

  for (const u of b.units) {
    if (!u.alive) {
      u.deadT += dt
      if (b.phase === 'fight' && u.side === 'ally' && u.deadT >= ALLY_REVIVE_SECONDS * (1 - u.reviveSpeed) &&
          b.units.some(other => other !== u && other.side === 'ally' && other.alive)) {
        u.alive = true
        u.revives++
        u.hp = Math.max(1, Math.floor(u.maxHp * Math.min(1, Math.max(0.1, 0.5 / u.revives + u.reviveHp))))
        u.deadT = 0
        u.spCd = Math.min(u.spMax, 2)
        const home = FORMATION[u.slot] ?? FORMATION[0]
        u.x = home.x
        u.y = home.y
        b.events.push({ k: 'heal', uid: u.uid, amount: u.hp })
        b.events.push({ k: 'banner', text: u.name + '이(가) 다시 일어났다!', tone: 'info' })
      }
      continue
    }
    u.lunge = Math.max(0, u.lunge - dt)
    u.hurt = Math.max(0, u.hurt - dt)
  }

  if (b.phase === 'fight') {
    for (const u of b.units) {
      if (!u.alive) continue
      if (u.regen > 0 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * u.regen * dt)
      u.scatterT = Math.max(0, u.scatterT - dt)
      // 상태이상: 독/화상은 조금씩 체력을 깎고, 시간이 지나면 풀린다
      if (u.status) {
        if (b.t >= u.status.until) u.status = null
        else if (u.status.kind === 'poison' || u.status.kind === 'burn') {
          u.status.tick += dt
          if (u.status.tick >= 1) {
            u.status.tick -= 1
            const pct = (u.status.kind === 'poison' ? 0.03 : 0.02) * (u.boss ? 0.4 : 1)
            u.hp = Math.max(u.side === 'ally' ? 1 : 0, u.hp - Math.max(1, Math.floor(u.maxHp * pct)))
            u.hurt = 0.15
            if (u.hp <= 0) {
              u.alive = false; u.deadT = 0; u.status = null
              if (u.side === 'enemy') { b.kills++; b.waveKills++ }
              b.events.push({ k: 'faint', uid: u.uid })
              if ((u.boss || (u.elite && b.wave === b.waves.length - 1)) && u.side === 'enemy') b.events.push({ k: 'bossDefeated', uid: u.uid, x: u.x, y: u.y })
              continue
            }
          }
        }
      }
      if (stunned(u)) { u.moving = false; continue }
      u.atkCd -= u.status?.kind === 'paralyze' ? dt * 0.5 : dt
      u.spCd = Math.max(0, u.spCd - dt)
      u.spCd2 = Math.max(0, u.spCd2 - dt)
      const automated = u.boss || (u.side === 'ally' && b.auto) || u.side === 'enemy' && u.special.role
      if (automated && u.scatterT <= 0) {
        const primary = u.spCd <= 0
        const secondary = !!u.secondary && u.spCd2 <= 0 && u.side === 'ally'
        if (primary || secondary) doSpecial(b, u, primary && secondary ? (b.rng() < 0.5 ? 0 : 1) : secondary && !primary ? 1 : 0)
      }
      // 흩어지기: 가장 가까운 적에게서 멀어지는 쪽으로 달아난다
      if (u.scatterT > 0) {
        const foe = nearest(b, u)
        if (foe) {
          const d = dist(u, foe) || 1
          const k = Math.min(210, speedOf(b, u) * 1.5) * dt
          u.x += ((u.x - foe.x) / d) * k + Math.sin(u.uid * 2.3 + b.t * 3) * k * 0.7
          u.y += ((u.y - foe.y) / d) * k + Math.cos(u.uid * 1.7 + b.t * 3) * k * 0.7
          u.moving = true
        }
        continue
      }
      if(u.side==='ally'&&b.manualDirection&&!u.status){
        const dir=b.manualDirection
        // All three allies follow the same freely chosen direction; there
        // is no compulsory left-to-right scroll or lane-locked movement.
        const velocity=Math.max(125,speedOf(b,u))*1.8*dt
        u.x=Math.min(FIELD.x1,Math.max(FIELD.x0,u.x+dir.x*velocity))
        u.y=Math.min(FIELD.y1,Math.max(FIELD.y0,u.y+dir.y*velocity))
        if(Math.abs(dir.x)>.02)u.face=dir.x>=0?1:-1
        u.moving=true
        continue
      }
      if(u.side==='ally'&&b.manualPoint&&!u.status){
        const dest=b.manualPoint
        const spreadX=(u.slot-1)*42,spreadY=(u.slot===0?-34:u.slot===1?34:0)
        const dx=dest.x+spreadX-u.x,dy=dest.y+spreadY-u.y
        const d=Math.hypot(dx,dy)
        if(d>18){
          const k=Math.min(d,speedOf(b,u)*dt*1.65)
          u.x+=dx/d*k;u.y+=dy/d*k
          u.face=dx>=0?1:-1;u.moving=true
          // Stay in the arena but keep existing battle and cooldown timers.
          continue
        }
        if(u.slot===0)b.manualPoint=null
      }
      let t = nearest(b, u)
      // 혼란: 가끔 엉뚱한 상대(동료 포함)를 노린다
      if (u.status?.kind === 'confuse' && b.rng() < 0.5) {
        const any = b.units.filter(x => x !== u && x.alive)
        if (any.length) t = any[Math.floor(b.rng() * any.length)]
      }
      if (!t) { u.moving = false; continue }
      const d = dist(u, t)
      u.face = t.x >= u.x ? 1 : -1
      if (d > u.range + t.radius * 0.4) {
        if (u.status?.kind === 'chain') { u.moving = false; continue }
        u.moving = true
        const k = Math.min(speedOf(b, u) * dt, d)
        const weave = 0.28 * Math.sin(b.t * 0.9 + u.uid * 1.9)
        u.x += (((t.x-u.x)/d) - ((t.y-u.y)/d) * weave) * k
        u.y += (((t.y-u.y)/d) + ((t.x-u.x)/d) * weave) * k
      } else {
        if (u.range > MELEE_RANGE + 10 && u.atkCd > 0.3 && d > 24) {
          const sign = Math.sin(u.uid * 2.17) >= 0 ? 1 : -1
          const k = speedOf(b, u) * dt * 0.32 * sign
          u.x += -(t.y - u.y) / d * k
          u.y += (t.x - u.x) / d * k
          u.moving = true
        } else u.moving = false
        if (u.atkCd <= 0) {
          const ranged = u.range > MELEE_RANGE + 10 && !u.boss
          u.lunge = 0.25
          b.events.push({ k: 'attack', from: u.uid, to: [t.uid], type: u.basic.type, special: false, ranged })
          strike(b, u, t, u.basic, false, 1, ranged ? travel(u, t) : 0.12)
          u.atkCd = attackInterval(u.spe) * (1 - u.atkCdCut) * (0.9 + b.rng() * 0.2)
        }
      }
    }
    separate(b)
  }

  // 이어서 나가는 필살기(리피트/늘리기)
  if (b.queue.length) {
    const dueQ = b.queue.filter(q => q.at <= b.t)
    if (dueQ.length) {
      b.queue = b.queue.filter(q => q.at > b.t)
      for (const q of dueQ) { const u = unitById(b, q.uid); if (u && u.alive && b.phase === 'fight') castSpecial(b, u, q.mul, q.slot === 1 ? u.secondary ?? u.special : u.special, q.slot) }
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
    if (b.late.length) {
      // 동료 호출: 첫 적이 쓰러지면 / 보스 포위: 보스 체력이 반쯤 깎이면
      if (b.waveKills >= 1 && b.late.some(e => e.late === 'call')) joinLate(b, 'call')
      const boss = b.units.find(u => u.boss && u.alive && u.side === 'enemy')
      if (boss && boss.hp <= boss.maxHp * 0.5) joinLate(b, 'bossHp')
      // 새로운 무리: 지금 있는 적을 모두 쓰러뜨리면 곧바로 이어서 나타난다
      if (!alive(b, 'enemy').length && !b.pending.length && b.late.some(e => e.late === 'new')) joinLate(b, 'new')
    }
    if (!alive(b, 'enemy').length && !b.pending.length) {
      b.phase = 'advance'
      b.manualPoint=null
      b.phaseT = ADVANCE_TIME
      for (const a of alive(b, 'ally')) {
        a.status = null
        a.scatterT = 0
        const heal = Math.floor(a.maxHp * (b.balance.allyHeal + a.waveHeal))
        a.hp = Math.min(a.maxHp, a.hp + heal)
        b.events.push({ k: 'heal', uid: a.uid, amount: heal })
      }
    }
  } else if (b.phase === 'advance') {
    b.phaseT -= dt
    for (const a of alive(b, 'ally')) {
      const center = waveCenter(b.wave + 1,b.waves.length)
      const h = { x: center.x - 225 - a.slot * 25, y: center.y + (a.slot-1)*62 }
      const dx = h.x - a.x, dy = h.y - a.y
      const d = Math.hypot(dx, dy)
      a.moving = true
      a.face = dx >= 0 ? 1 : -1
      if (d > 2) { const k = Math.min(d, 410 * dt); a.x += (dx / d) * k; a.y += (dy / d) * k }
    }
    if (b.phaseT <= 0) {
      b.wave++
      if (b.wave >= b.waves.length) { b.phase = 'won'; return }
      spawnWave(b)
      for (const a of alive(b, 'ally')) { a.atkCd = 0.3 + b.rng() * 0.6; a.moving = false }
      b.phase = 'fight'
      b.manualPoint=null
    }
  }
}
