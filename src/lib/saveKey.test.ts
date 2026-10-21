import { describe, expect, it } from 'vitest'
import { exportSave, formatPassword, generatePassword, importSave, keysToText, normalizePassword, pack, parseKeysText, SaveKeyError, unpack, validateSave } from './saveKey'
import { defaultSave, type SaveData } from './storage'
import { rollBonuses, seededRng } from './bingo'

function sample(): SaveData {
  const s = defaultSave()
  s.started = true
  s.name = '하늘'
  s.coins = 1234
  s.owned = Array.from({ length: 40 }, (_, i) => ({ id: `m${i + 1}`, species: [25, 6, 130, 150][i % 4], level: 10 + (i % 30), exp: i * 3, stones: i % 3 === 0 ? [{ stone: `s${i}`, x: 1, y: 1, rot: 1 }] : [], bonus: rollBonuses(seededRng(`m${i}`)), mstones: i % 5 === 0 ? [`t${i}`] : [] }))
  s.moveStones = Array.from({ length: 8 }, (_, i) => ({ id: `t${i * 5}`, kind: (['quick', 'repeat', 'widen', 'multiply', 'bond', 'lasting'] as const)[i % 6] }))
  s.battery = { n: 3, at: 1_700_000_000_000 }
  s.stones = Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, kind: (['hp', 'atk', 'def', 'spd', 'crit'] as const)[i % 5], star: ((i % 3) + 1) as 1 | 2 | 3, shape: (['dot', 'bar2', 'bar3', 'ell'] as const)[i % 4] }))
  s.party = ['m1', 'm2', 'm3']
  s.cleared = { 'a0-s0': true, 'a0-s1': true, 'a1-s0': true }
  s.dex = [25, 6, 130, 150]
  s.endlessBest = 7
  s.uid = 99
  return s
}

describe('저장 키', () => {
  it('탐험 대기 중인 요리도 암호화 저장 키에서 정확히 복원된다', async () => {
    const original = sample()
    original.pot = { species: 25, remaining: 2, total: 3, recipe: 4 }
    expect(unpack(pack(original)).pot).toEqual(original.pot)
    const keys = await exportSave(original)
    const restored = await importSave(keys.saveKey, keys.password)
    expect(restored.pot).toEqual(original.pot)
  })

  it('암호 키는 32글자 알파벳 16자이며 매번 다르다', () => {
    const a = generatePassword(), b = generatePassword()
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{16}$/)
    expect(a).not.toBe(b)
    expect(formatPassword(a)).toMatch(/^(\w{4}-){3}\w{4}$/)
  })

  it('저장 키 + 암호 키로 그대로 복원된다', async () => {
    const save = sample()
    const keys = await exportSave(save)
    expect(keys.saveKey.startsWith('PQF1')).toBe(true)
    const back = await importSave(keys.saveKey, keys.password)
    expect(back).toEqual({ ...save, seenStory: ['intro-0'] })
  })

  it('붙여 넣을 때 공백·줄바꿈·소문자·하이픈이 섞여도 복원된다', async () => {
    const keys = await exportSave(sample())
    const spaced = keys.saveKey.replace(/(.{7})/g, '$1 \n ')
    const pw = formatPassword(keys.password).toLowerCase()
    const back = await importSave(spaced, pw)
    expect(back.name).toBe('하늘')
  })

  it('암호 키가 틀리면 복원되지 않는다', async () => {
    const keys = await exportSave(sample())
    await expect(importSave(keys.saveKey, 'ABCD-EFGH-JKMN-PQRS')).rejects.toBeInstanceOf(SaveKeyError)
  })

  it('저장 키가 잘리거나 바뀌면 복원되지 않는다', async () => {
    const keys = await exportSave(sample())
    await expect(importSave(keys.saveKey.slice(0, -10), keys.password)).rejects.toBeInstanceOf(SaveKeyError)
    const flipped = keys.saveKey.slice(0, 60) + (keys.saveKey[60] === 'A' ? 'B' : 'A') + keys.saveKey.slice(61)
    await expect(importSave(flipped, keys.password)).rejects.toBeInstanceOf(SaveKeyError)
    await expect(importSave('hello', keys.password)).rejects.toBeInstanceOf(SaveKeyError)
  })

  it('같은 데이터도 저장 키는 매번 달라진다(암호화)', async () => {
    const s = sample()
    const a = await exportSave(s), b = await exportSave(s)
    expect(a.saveKey).not.toBe(b.saveKey)
  })

  it('저장 키 길이가 사람이 다룰 수 있는 수준이다 (포켓몬 40마리 기준)', async () => {
    const keys = await exportSave(sample())
    expect(keys.saveKey.length).toBeLessThan(3500)
  })

  it('텍스트 파일로 내보냈다가 다시 읽어 들일 수 있다', async () => {
    const keys = await exportSave(sample())
    const parsed = parseKeysText(keysToText(keys))!
    const back = await importSave(parsed.saveKey, parsed.password)
    expect(back.coins).toBe(1234)
  })

  it('암호 키 입력 보정', () => {
    expect(normalizePassword('abcd-efgh-ijkm-nopq')).toBe('ABCDEFGH1JKMN0PQ')
  })

  it('손상된 데이터는 거절한다', () => {
    const s = sample()
    expect(validateSave(s)).toBeNull()
    expect(validateSave({ ...s, party: ['nope'] })).not.toBeNull()
    expect(validateSave({ ...s, owned: [] })).not.toBeNull()
    expect(validateSave({ ...s, started: false })).not.toBeNull()
  })

  it('pack/unpack 왕복', () => {
    const s = sample()
    expect(unpack(pack(s))).toEqual({ ...s, seenStory: ['intro-0'] })
  })
})
