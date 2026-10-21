// 저장 키 시스템: 저장 데이터를 압축 → 랜덤 "암호 키"로 AES-GCM 암호화 → 문자열 "저장 키"로 만든다.
// 저장 키와 암호 키 두 가지를 모두 적어 두면 다른 기기에서도 그대로 불러올 수 있다. (서버 없이 동작)
import { defaultSave, migrate, type SaveData } from './storage'
import type { OwnedMon } from './stats'

const PREFIX = 'PQF1'
const PW_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const PBKDF2_ITER = 120_000

const enc = new TextEncoder()
const dec = new TextDecoder()

// ---------- 문자열 변환 ----------
function toB64Url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
function fromB64Url(str: string): Uint8Array {
  const b = str.replaceAll('-', '+').replaceAll('_', '/')
  const s = atob(b + '='.repeat((4 - (b.length % 4)) % 4))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

/** 사람이 옮겨 적기 쉽게 5글자씩 끊어 보여 준다 */
export const formatSaveKey = (key: string) => key.replace(/(.{5})/g, '$1 ').trim()
export const formatPassword = (pw: string) => pw.replace(/(.{4})(?=.)/g, '$1-')

/** 암호 키 입력 정리: 대문자, 구분 기호 제거, 헷갈리는 글자 보정(O→0, I/L→1) */
export function normalizePassword(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, '').replaceAll('O', '0').replaceAll('I', '1').replaceAll('L', '1').replaceAll('U', 'V')
}
/** 저장 키 입력 정리: 공백/줄바꿈 제거 */
export const normalizeSaveKey = (input: string) => input.replace(/\s+/g, '')

export function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let pw = ''
  for (const b of bytes) pw += PW_ALPHABET[b % 32]
  return pw
}

// ---------- 압축 ----------
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

// ---------- 저장 데이터 압축 표현 (배열 기반으로 크기를 줄임) ----------
type PackedMon = [string, number, number, number, Array<[string, number, number, number]>, Array<[string, number, number, number]>?, string[]?, string?, number?, number?, number?, string?, number?, number?, number?, string[]?, number[]?]
type Packed = [number, number, string, number, [string, number][], Array<[string, string, number, string, number?, Record<string,number>?]>, PackedMon[], string[], string[], number[], number, number, number, number, number, number?, number?, Array<[string, string]>?, Record<string, number>?, string[]?, number?, string[]?, string?, [number, number, number, number, number?, number[]?]?, number?, number?, string[]?]

export function pack(s: SaveData): Packed {
  return [
    s.version, s.started ? 1 : 0, s.name, s.coins,
    Object.entries(s.ingredients),
    s.stones.map(t => [t.id, t.kind, t.star, t.shape, t.value, t.perks]),
    s.owned.map(o => [o.id, o.species, o.level, o.exp, o.stones.map(p => [p.stone, p.x, p.y, p.rot]), o.bonus.map(b => [b.kind, ...b.v]), o.mstones, o.move ?? '', o.recalls ?? 0, o.recallT ?? 0, ...([o.everstone ? 1 : 0, o.move2 ?? '', o.potBonus ?? 0, o.ivHp ?? 0, o.ivAtk ?? 0, o.sockets ?? [], o.bingoChoices ?? []])]),
    s.party, Object.keys(s.cleared), s.dex, s.endlessBest, s.uid, s.muted ? 1 : 0, s.exportedAt, s.clearsSinceExport,
    s.battery.n, s.battery.at, s.moveStones.map(m => [m.id, m.kind]),
    s.counters, s.claimed, s.statue, s.themes, s.theme,
    s.pot ? [s.pot.species, s.pot.remaining, s.pot.total, s.pot.recipe, s.pot.tier ?? 0, s.pot.visitors ?? []] : undefined,
    s.pmTickets, s.ticketClaimedAt, s.decorations,
  ] as unknown as Packed
}

export function unpack(p: Packed): SaveData {
  const base = defaultSave()
  const ing = { ...base.ingredients }
  for (const [k, v] of p[4]) if (k in ing) ing[k as keyof typeof ing] = Number(v) || 0
  const save: SaveData = {
    ...base,
    version: 1,
    started: !!p[1],
    name: String(p[2] ?? ''),
    coins: Number(p[3]) || 0,
    ingredients: ing,
    stones: p[5].map(([id, kind, star, shape, value, perks]) => ({ id, kind, star, shape, ...(value != null ? { value } : {}), ...(perks ? { perks } : {}) })) as SaveData['stones'],
    owned: p[6].map(([id, species, level, exp, st, bonus, mstones, move, recalls, recallT, everstone, move2, potBonus, ivHp, ivAtk, sockets, bingoChoices]) => ({
      id, species, level, exp,
      ...(move ? { move } : {}), ...(recalls ? { recalls, recallT } : {}), ...(everstone ? { everstone: true } : {}), ...(move2 ? { move2 } : {}), ...(potBonus ? { potBonus } : {}), ...(ivHp ? { ivHp } : {}), ...(ivAtk ? { ivAtk } : {}), ...(Array.isArray(sockets) && sockets.length===9 ? { sockets: sockets as OwnedMon['sockets'] } : {}), ...(Array.isArray(bingoChoices) && bingoChoices.length === 3 ? { bingoChoices: bingoChoices as OwnedMon['bingoChoices'] } : {}),
      stones: st.map(([stone, x, y, rot]) => ({ stone, x, y, rot })),
      // 옛 저장 키에는 빙고 보너스/기술스톤이 없다 → migrate 가 채운다
      bonus: (bonus ?? []).map(([kind, a, b, c]) => ({ kind, v: [a, b, c] })) as OwnedMon['bonus'],
      mstones: mstones ?? [],
    })),
    party: p[7],
    cleared: Object.fromEntries(p[8].map(k => [k, true as const])),
    seenStory: ['intro-0'],
    dex: p[9],
    endlessBest: Number(p[10]) || 0,
    uid: Number(p[11]) || 1,
    muted: !!p[12],
    exportedAt: Number(p[13]) || 0,
    clearsSinceExport: Number(p[14]) || 0,
    battery: p[15] !== undefined && p[16] !== undefined ? { n: Math.max(0, Math.min(5, Number(p[15]) || 0)), at: Number(p[16]) || Date.now() } : defaultSave().battery,
    moveStones: (p[17] ?? []).map(([id, kind]) => ({ id, kind })) as SaveData['moveStones'],
    counters: p[18] ?? {}, claimed: p[19] ?? [], statue: Number(p[20]) || 0, themes: p[21] ?? ['default'], theme: p[22] ?? 'default',
    pot: p[23] ? { species: p[23][0], remaining: p[23][1], total: p[23][2], recipe: p[23][3], ...(p[23][4] ? { tier: p[23][4] as 0 | 1 | 2 | 3 } : {}), ...(Array.isArray(p[23][5]) && p[23][5].length ? { visitors: p[23][5] } : {}) } : null,
    pmTickets: Math.max(0, Number(p[24]) || 0), ticketClaimedAt: Math.max(0, Number(p[25]) || 0),
    decorations: Array.isArray(p[26]) ? p[26] : [],
  }
  return migrate(save)
}

/** 불러온 데이터가 게임이 믿고 써도 되는 모양인지 확인 */
export function validateSave(s: SaveData): string | null {
  if (!s.started || !s.name) return '시작하지 않은 저장 데이터예요.'
  if (!Array.isArray(s.owned) || s.owned.length === 0) return '포켓몬 정보가 없어요.'
  const ids = new Set(s.owned.map(o => o.id))
  if (ids.size !== s.owned.length) return '포켓몬 정보가 손상되었어요.'
  if (s.owned.some(o => !(o.level >= 1 && o.level <= 100) || !Number.isFinite(o.species))) return '포켓몬 정보가 손상되었어요.'
  if (s.party.some(id => !ids.has(id))) return '파티 정보가 손상되었어요.'
  return null
}

// ---------- 암호화 ----------
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password) as BufferSource, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export interface ExportedKeys { saveKey: string; password: string }

/** 저장 키와 (새로 만든) 암호 키 한 쌍을 만든다 */
export async function exportSave(save: SaveData, password = generatePassword()): Promise<ExportedKeys> {
  const json = enc.encode(JSON.stringify(pack(save)))
  let body: Uint8Array = json
  let flag = 0
  if (typeof CompressionStream !== 'undefined') { body = await pipe(json, new CompressionStream('deflate-raw')); flag = 1 }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, body as BufferSource))
  const out = new Uint8Array(1 + 16 + 12 + cipher.length)
  out[0] = flag
  out.set(salt, 1); out.set(iv, 17); out.set(cipher, 29)
  return { saveKey: `${PREFIX}${toB64Url(out)}`, password }
}

export class SaveKeyError extends Error {}

/** 저장 키 + 암호 키로 저장 데이터를 복원한다. 틀리면 SaveKeyError */
export async function importSave(saveKeyInput: string, passwordInput: string): Promise<SaveData> {
  const raw = normalizeSaveKey(saveKeyInput)
  if (!raw.startsWith(PREFIX)) throw new SaveKeyError('저장 키 형식이 올바르지 않아요. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인하세요.')
  let bytes: Uint8Array
  try { bytes = fromB64Url(raw.slice(PREFIX.length)) } catch { throw new SaveKeyError('저장 키에 잘못된 글자가 섞여 있어요.') }
  if (bytes.length < 30) throw new SaveKeyError('저장 키가 너무 짧아요. 일부가 잘렸을 수 있어요.')
  const flag = bytes[0]
  const salt = bytes.slice(1, 17), iv = bytes.slice(17, 29), cipher = bytes.slice(29)
  let body: Uint8Array
  try {
    const key = await deriveKey(normalizePassword(passwordInput), salt)
    body = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, cipher as BufferSource))
  } catch {
    throw new SaveKeyError('암호 키가 맞지 않거나 저장 키가 손상되었어요.')
  }
  try {
    if (flag === 1) body = await pipe(body, new DecompressionStream('deflate-raw'))
    const save = unpack(JSON.parse(dec.decode(body)) as Packed)
    const bad = validateSave(save)
    if (bad) throw new SaveKeyError(bad)
    return save
  } catch (e) {
    if (e instanceof SaveKeyError) throw e
    throw new SaveKeyError('저장 데이터를 읽을 수 없어요.')
  }
}

/** 내려받기용 텍스트 파일 내용 */
export const keysToText = (k: ExportedKeys) =>
  `포켓몬 퀘스트 팬 에디션 저장 키\n(두 가지를 모두 보관하세요. 암호 키가 없으면 복구할 수 없어요.)\n\n저장 키:\n${formatSaveKey(k.saveKey).replace(/((?:\S+ ){11}\S+) /g, '$1\n')}\n\n암호 키:\n${formatPassword(k.password)}\n`

/** 내려받은 텍스트 파일에서 두 키를 뽑아낸다 */
export function parseKeysText(text: string): { saveKey: string; password: string } | null {
  const m = text.match(/저장 키:\s*([\s\S]*?)\s*암호 키:\s*([0-9A-Za-z\- ]+)/)
  if (!m) return null
  return { saveKey: normalizeSaveKey(m[1]), password: m[2].trim() }
}
