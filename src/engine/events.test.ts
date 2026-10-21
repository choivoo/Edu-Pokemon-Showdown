import { describe, expect, it } from 'vitest'
import { type AllyInput, createBattle, scatter, step } from './battle'
import { buildWaves, getStage, type WaveEnemy } from '../lib/stages'
import { computeStats } from '../lib/stats'
import { getMove, getSpecies } from '../lib/roster'

const seq = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
const ally = (id: number, level: number, i: number, move?: string): AllyInput => ({ ownedId: 'o' + i, speciesId: id, level, stats: computeStats(getSpecies(id), level), move })
const run = (b: ReturnType<typeof createBattle>, secs: number) => { for (let i = 0; i < secs * 20; i++) step(b, 0.05) }

describe('웨이브 이벤트', () => {
  it('일반 스테이지 마지막 웨이브에는 강해 보이는 포켓몬이 있다', () => {
    const w = buildWaves(getStage(1, 1), seq(5))
    expect(w[w.length - 1].some(e => e.elite)).toBe(true)
  })
  it('첫 두 판은 이벤트 없이 시작한다', () => {
    for (let s = 1; s < 30; s++) for (const w of buildWaves(getStage(0, 0), seq(s))) expect(w.some(e => e.late || e.surround || e.elite)).toBe(false)
  })
  it('여러 시드에서 호출/새 무리/포위 이벤트가 모두 나온다', () => {
    const kinds = new Set<string>()
    for (let s = 1; s < 80; s++) for (const w of buildWaves(getStage(2, 2), seq(s))) for (const e of w) { if (e.late) kinds.add(e.late); if (e.surround) kinds.add('surround') }
    expect([...kinds].sort()).toEqual(['bossHp', 'call', 'new', 'surround'].filter(k => k !== 'bossHp').sort())
  })
  it('새로운 무리는 웨이브를 다 쓰러뜨려도 이어서 나온다', () => {
    const waves: WaveEnemy[][] = [[{ species: 19, level: 1 }, { species: 19, level: 1, late: 'new' }, { species: 19, level: 1, late: 'new' }]]
    const b = createBattle([ally(150, 60, 0)], waves, seq(2))
    b.auto = true
    run(b, 60)
    expect(b.events.some(e => e.k === 'banner' && e.text.includes('새로운'))).toBe(true)
    expect(b.kills).toBe(3)
    expect(b.phase).toBe('won')
  })
  it('동료 호출은 첫 적이 쓰러지면 합류한다', () => {
    const waves: WaveEnemy[][] = [[{ species: 19, level: 1 }, { species: 16, level: 1, late: 'call' }, { species: 16, level: 1, late: 'call' }]]
    const b = createBattle([ally(150, 60, 0)], waves, seq(3))
    b.auto = true
    run(b, 60)
    expect(b.events.some(e => e.k === 'banner' && e.text.includes('동료'))).toBe(true)
    expect(b.kills).toBe(3)
  })
  it('포위 이벤트는 배너를 띄우고 사방에서 나타난다', () => {
    const b = createBattle([ally(150, 60, 0)], [[{ species: 19, level: 1, surround: true }, { species: 19, level: 1, surround: true }, { species: 19, level: 1, surround: true }]], seq(4))
    expect(b.events.some(e => e.k === 'banner' && e.text.includes('포위'))).toBe(true)
    const ys = b.units.filter(u => u.side === 'enemy').map(u => Math.round(u.y))
    expect(new Set(ys).size).toBeGreaterThan(1)
  })
  it('보스가 쓰러지면 부하들은 도망친다', () => {
    const b = createBattle([ally(150, 80, 0)], [[{ species: 130, level: 1, boss: true }, { species: 19, level: 40 }, { species: 19, level: 40 }]], seq(6))
    b.auto = true
    const boss = b.units.find(u => u.boss)!
    boss.hp = 1
    const minions = b.units.filter(u => u.side === 'enemy' && !u.boss)
    minions.forEach(m => { m.hp = m.maxHp = 99999 })
    run(b, 30)
    expect(minions.every(m => !m.alive)).toBe(true)
    expect(b.kills).toBe(1)
    expect(b.phase).toBe('won')
  })
})

describe('상태이상과 보조기', () => {
  const setup = (move: string) => {
    const b = createBattle([ally(150, 30, 0, move)], [[{ species: 19, level: 30 }, { species: 16, level: 30 }]], seq(8))
    const u = b.units.find(x => x.side === 'ally')!
    u.spCd = 0
    return { b, u, foes: b.units.filter(x => x.side === 'enemy') }
  }
  it('전기쇼크파는 마비를 건다', () => {
    const { b, u, foes } = setup('thunderwave')
    foes.forEach(f => { f.x = u.x + 60; f.y = u.y })
    b.auto = true
    run(b, 1)
    expect(foes.some(f => f.status?.kind === 'paralyze')).toBe(true)
  })
  it('상태이상은 한 번에 하나만 걸린다', () => {
    const { b, foes } = setup('toxic')
    const f = foes[0]
    f.status = { kind: 'burn', until: 999, tick: 0 }
    b.auto = true
    run(b, 2)
    expect(f.status?.kind).toBe('burn')
  })
  it('잠든 적은 행동하지 않는다', () => {
    const { b, foes } = setup('sleeppowder')
    const f = foes[0]
    f.status = { kind: 'sleep', until: 5, tick: 0 }
    const x0 = f.x
    run(b, 2)
    expect(f.x).toBe(x0)
  })
  it('독은 시간이 지나면 체력을 깎는다', () => {
    const { b, foes } = setup('toxic')
    const f = foes[0]
    f.status = { kind: 'poison', until: 99, tick: 0 }
    const hp = f.hp
    f.x = 9999
    run(b, 3)
    expect(f.hp).toBeLessThan(hp)
  })
  it('벌크업은 아군의 공격/방어를 올린다', () => {
    const { b, u } = setup('bulkup')
    b.auto = true
    run(b, 1)
    expect(u.buff.atk).toBeGreaterThan(0)
    expect(getMove('bulkup').role).toBe('buff')
  })
  it('울음소리는 적의 공격을 낮춘다', () => {
    const { b, foes } = setup('growl')
    b.auto = true
    run(b, 1)
    expect(foes.some(f => f.debuff.atk < 0)).toBe(true)
  })
  it('아로마테라피는 아군을 회복시킨다', () => {
    const { b, u } = setup('aroma')
    u.hp = Math.floor(u.maxHp / 2)
    const hp = u.hp
    b.auto = true
    run(b, 0.3)
    expect(u.hp).toBeGreaterThan(hp)
  })
})

describe('흩어지기', () => {
  it('쿨타임 5초 동안 다시 쓸 수 없고 지나면 다시 쓴다', () => {
    const b = createBattle([ally(150, 30, 0)], [[{ species: 19, level: 30 }]], seq(9))
    expect(scatter(b)).toBe(true)
    expect(scatter(b)).toBe(false)
    run(b, 5.2)
    expect(scatter(b)).toBe(true)
  })
  it('흩어지는 동안 아군은 적에게서 멀어진다', () => {
    const b = createBattle([ally(150, 30, 0)], [[{ species: 19, level: 30 }]], seq(10))
    const u = b.units.find(x => x.side === 'ally')!
    const f = b.units.find(x => x.side === 'enemy')!
    f.x = u.x + 100; f.y = u.y
    const d0 = Math.hypot(f.x - u.x, f.y - u.y)
    scatter(b)
    run(b, 0.6)
    expect(Math.hypot(f.x - u.x, f.y - u.y)).toBeGreaterThan(d0)
  })
})

describe('최종 보스 패턴', () => {
  const boss = (id: number) => {
    const b = createBattle([ally(150, 40, 0)], [[{ species: id, level: 20, boss: true }]], seq(12))
    b.auto = false
    return b
  }
  it('보스는 일정 시간마다 기가임팩트를 준비하고 쏜다', () => {
    const b = boss(149)
    const texts: string[] = []
    for (let i = 0; i < 20 * 25; i++) { step(b, 0.05); b.events.forEach(e => e.k === 'banner' && texts.push(e.text)); b.events.length = 0 }
    expect(texts.some(t => t.includes('기가임팩트'))).toBe(true)
    expect(texts.some(t => t.includes('순간이동'))).toBe(true)
  })
  it('체력이 반 이하가 되면 사이코브레이크로 방어를 깎는다', () => {
    const b = boss(150)
    const u = b.units.find(x => x.boss)!
    u.hp = Math.floor(u.maxHp * 0.4)
    step(b, 0.05)
    const a = b.units.find(x => x.side === 'ally')!
    expect(a.debuff.def).toBeLessThan(0)
    expect(u.buff.atk).toBeGreaterThan(0)
  })
})
