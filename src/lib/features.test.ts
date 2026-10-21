import { describe, expect, it } from 'vitest'
import { BATTERY_MAX, batteryNow, charge, consume, freshBattery, RECHARGE_MS, settle } from './battery'
import { BINGO_LINES, BONUS_INFO, completeLines, modsFor, rollBonuses, seededRng } from './bingo'
import { moveFx, NO_FX } from './moveStones'
import { migrate, defaultSave, type SaveData } from './storage'
import { computeStats } from './stats'
import { getSpecies } from './roster'
import { occupancy, type Stone } from './stones'
import { exportSave, importSave } from './saveKey'
import { rollRewards, getStage } from './stages'

describe('배터리', () => {
  const t0 = 1_000_000
  it('처음엔 가득 차 있다', () => expect(batteryNow(freshBattery(t0), t0)).toEqual({ n: BATTERY_MAX, nextMs: 0 }))
  it('쓰면 1개 줄고, 30분마다 1개씩 찬다', () => {
    const b = consume(freshBattery(t0), t0)!
    expect(batteryNow(b, t0).n).toBe(4)
    expect(batteryNow(b, t0 + RECHARGE_MS - 1).n).toBe(4)
    expect(batteryNow(b, t0 + RECHARGE_MS).n).toBe(5)
    expect(batteryNow(b, t0 + 10 * RECHARGE_MS).n).toBe(5)
  })
  it('다음 충전까지 남은 시간을 알려 준다', () => {
    const b = consume(freshBattery(t0), t0)!
    expect(batteryNow(b, t0 + 10 * 60 * 1000).nextMs).toBe(20 * 60 * 1000)
  })
  it('연속으로 쓰면 바닥나고, 없으면 쓸 수 없다', () => {
    let b = freshBattery(t0)
    for (let i = 0; i < BATTERY_MAX; i++) b = consume(b, t0)!
    expect(batteryNow(b, t0).n).toBe(0)
    expect(consume(b, t0)).toBeNull()
    expect(consume(b, t0 + RECHARGE_MS)).not.toBeNull()
  })
  it('충전 시간은 쓸 때마다 처음부터 다시 세지 않는다 (남은 시간 유지)', () => {
    let b = consume(freshBattery(t0), t0)!
    b = consume(b, t0 + 20 * 60 * 1000)! // 20분 지난 뒤 또 사용
    expect(batteryNow(b, t0 + 20 * 60 * 1000).nextMs).toBe(10 * 60 * 1000)
  })
  it('코인 충전은 최대치를 넘지 않는다', () => {
    let b = freshBattery(t0)
    for (let i = 0; i < 3; i++) b = consume(b, t0)!
    expect(batteryNow(charge(b, t0, 1), t0).n).toBe(3)
    expect(batteryNow(charge(b, t0, 99), t0).n).toBe(BATTERY_MAX)
    expect(settle(b, t0 + 99 * RECHARGE_MS).n).toBe(BATTERY_MAX)
  })
})

describe('빙고 보너스', () => {
  it('보너스는 서로 다른 3개이고 빙고가 많을수록 값이 커진다', () => {
    for (let i = 0; i < 50; i++) {
      const b = rollBonuses(seededRng('x' + i))
      expect(new Set(b.map(x => x.kind)).size).toBe(3)
      for (const x of b) { expect(x.v[0]).toBeLessThan(x.v[1]); expect(x.v[1]).toBeLessThan(x.v[2]); expect(x.v[2]).toBeLessThanOrEqual(BONUS_INFO[x.kind].max) }
    }
  })
  it('같은 id 는 항상 같은 보너스 (옛 저장 데이터 이전용)', () => {
    expect(rollBonuses(seededRng('m7'))).toEqual(rollBonuses(seededRng('m7')))
    expect(rollBonuses(seededRng('m7'))).not.toEqual(rollBonuses(seededRng('m8')))
  })
  it('P애뮬릿은 3×3 격자이며 가로 3줄, 세로 3줄', () => {
    expect(BINGO_LINES).toHaveLength(6)
    expect(BINGO_LINES.every(l => l.length === 3)).toBe(true)
  })
  it('한 줄을 모두 스톤으로 채우면 빙고', () => {
    const stones: Stone[] = [{ id: 'a', kind: 'atk', star: 1, shape: 'bar3' }, { id: 'b', kind: 'hp', star: 1, shape: 'dot' }]
    // 가로 한 줄은 3칸이므로 bar3 한 개로 채울 수 있다(기존 저장 호환).
    const occ = occupancy([{ stone: 'a', x: 0, y: 1, rot: 0 }], stones)
    expect(completeLines(occ)).toHaveLength(1)
    expect(completeLines(occupancy([{ stone: 'b', x: 1, y: 1, rot: 0 }], stones))).toHaveLength(0)
  })
  it('빙고 0줄이면 효과 없음, 3줄 이상이면 최대 효과', () => {
    const b = rollBonuses(seededRng('q'))
    expect(Object.values(modsFor(b, 0)).every(v => v === 0)).toBe(true)
    const m1 = modsFor(b, 1), m3 = modsFor(b, 3), m7 = modsFor(b, 7)
    for (const x of b) { expect(m3[x.kind]).toBeGreaterThan(m1[x.kind]); expect(m7[x.kind]).toBe(m3[x.kind]) }
  })
  it('보너스가 실제 스탯에 반영된다', () => {
    const sp = getSpecies(25)
    const base = computeStats(sp, 30)
    const mods = modsFor([{ kind: 'atkUp', v: [5, 10, 20] }, { kind: 'critRate', v: [2, 4, 10] }, { kind: 'lifesteal', v: [1, 2, 3] }], 3)
    const s = computeStats(sp, 30, [], mods)
    expect(s.atk).toBeGreaterThan(base.atk)
    expect(s.crit).toBeCloseTo(base.crit + 0.1)
    expect(s.lifesteal).toBeCloseTo(0.03)
  })
})

describe('기술스톤', () => {
  it('종류별 개수를 센다', () => {
    const fx = moveFx([{ id: 'a', kind: 'quick' }, { id: 'b', kind: 'quick' }, { id: 'c', kind: 'bond' }])
    expect(fx).toEqual({ ...NO_FX, quick: 2, bond: 1 })
  })
  it('보스 스테이지는 기술스톤이 자주 나온다', () => {
    let boss = 0, normal = 0
    for (let i = 0; i < 400; i++) {
      let s = 7 + i
      const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
      if (rollRewards(getStage(0, 4), rng).moveStone) boss++
      if (rollRewards(getStage(0, 0), rng).moveStone) normal++
    }
    expect(boss).toBeGreaterThan(normal)
  })
})

describe('저장 데이터 이전/호환', () => {
  it('옛 저장 데이터(빙고·기술스톤·배터리 없음)를 불러오면 채워 넣는다', () => {
    const old = defaultSave() as unknown as Record<string, unknown>
    old.owned = [{ id: 'm1', species: 25, level: 5, exp: 0, stones: [] }]
    delete old.battery
    delete old.moveStones
    const s = migrate(old as unknown as SaveData)
    expect(s.owned[0].bonus).toHaveLength(3)
    expect(s.owned[0].mstones).toEqual([])
    expect(s.battery.n).toBe(BATTERY_MAX)
    expect(s.moveStones).toEqual([])
    // 같은 데이터를 다시 이전해도 보너스가 바뀌지 않는다
    expect(migrate(old as unknown as SaveData).owned[0].bonus).toEqual(s.owned[0].bonus)
  })

  it('새 항목이 저장 키로 그대로 왕복된다', async () => {
    const s = defaultSave()
    s.started = true; s.name = '하늘'
    s.owned = [{ id: 'm1', species: 25, level: 5, exp: 0, stones: [], bonus: rollBonuses(seededRng('z')), mstones: ['t1'] }]
    s.party = ['m1']
    s.moveStones = [{ id: 't1', kind: 'repeat' }]
    s.battery = { n: 2, at: 1_700_000_000_123 }
    const k = await exportSave(s)
    const back = await importSave(k.saveKey, k.password)
    expect(back.owned[0].bonus).toEqual(s.owned[0].bonus)
    expect(back.owned[0].mstones).toEqual(['t1'])
    expect(back.moveStones).toEqual([{ id: 't1', kind: 'repeat' }])
    expect(back.battery).toEqual({ n: 2, at: 1_700_000_000_123 })
  })
})
